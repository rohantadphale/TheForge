import json
from datetime import UTC, date as date_type, datetime
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import insert, select, text, update
from sqlalchemy.engine import Connection

from database import get_db
from models import attributes, quest_completions, quests, user_profile
from schemas import (
    OkResponse,
    Quest,
    QuestCompleteRequest,
    QuestCompleteResponse,
    QuestCreate,
    QuestType,
    QuestUpdate,
)

from .utils import current_and_next_rank, get_by_id, get_one, is_quest_due_on, parse_iso_date


router = APIRouter(prefix="/quests", tags=["quests"])


@router.get("", response_model=list[Quest])
def get_quests(
    quest_type: Annotated[QuestType | None, Query(alias="type")] = None,
    campaign_id: int | None = None,
    date: str | None = None,
    archived: Annotated[int | None, Query(ge=0, le=1)] = 0,
    conn: Connection = Depends(get_db),
) -> list[dict]:
    conditions = []
    if quest_type is not None:
        conditions.append(quests.c.quest_type == quest_type)
    if campaign_id is not None:
        conditions.append(quests.c.campaign_id == campaign_id)
    if archived is not None:
        conditions.append(quests.c.is_archived == archived)

    statement = select(quests).where(*conditions).order_by(quests.c.id)
    rows = [dict(row) for row in conn.execute(statement).mappings().all()]

    if date is not None:
        requested_date = parse_iso_date(date)
        rows = [quest for quest in rows if is_quest_due_on(quest, requested_date)]

    return rows


@router.post("", response_model=Quest)
def create_quest(payload: QuestCreate, conn: Connection = Depends(get_db)) -> dict:
    quest_id = conn.execute(insert(quests).values(**payload.model_dump())).inserted_primary_key[0]
    return get_by_id(conn, quests, quest_id, "Quest not found")


@router.get("/{quest_id}", response_model=Quest)
def get_quest(quest_id: int, conn: Connection = Depends(get_db)) -> dict:
    return get_by_id(conn, quests, quest_id, "Quest not found")


@router.put("/{quest_id}", response_model=Quest)
def update_quest(
    quest_id: int, payload: QuestUpdate, conn: Connection = Depends(get_db)
) -> dict:
    get_by_id(conn, quests, quest_id, "Quest not found")
    values = payload.model_dump(exclude_unset=True)
    if values:
        conn.execute(
            update(quests)
            .where(quests.c.id == quest_id)
            .values(**values, updated_at=text("datetime('now')"))
        )
    return get_by_id(conn, quests, quest_id, "Quest not found")


@router.delete("/{quest_id}", response_model=OkResponse)
def delete_quest(quest_id: int, conn: Connection = Depends(get_db)) -> dict[str, bool]:
    get_by_id(conn, quests, quest_id, "Quest not found")
    conn.execute(
        update(quests)
        .where(quests.c.id == quest_id)
        .values(is_archived=1, updated_at=text("datetime('now')"))
    )
    return {"ok": True}


@router.post("/{quest_id}/complete", response_model=QuestCompleteResponse)
def complete_quest(
    quest_id: int,
    payload: QuestCompleteRequest | None = None,
    conn: Connection = Depends(get_db),
) -> dict:
    quest = conn.execute(
        select(quests).where(quests.c.id == quest_id, quests.c.is_archived == 0)
    ).mappings().first()
    if quest is None:
        raise HTTPException(status_code=404, detail="Quest not found")

    completed_date = (
        parse_iso_date(payload.date)
        if payload is not None and payload.date is not None
        else datetime.now(UTC).date()
    )
    completed_date_value = completed_date.isoformat()

    existing_completion = conn.execute(
        select(quest_completions.c.id).where(
            quest_completions.c.quest_id == quest_id,
            quest_completions.c.completed_date == completed_date_value,
        )
    ).first()
    if existing_completion is not None:
        raise HTTPException(status_code=409, detail="Quest already completed for this date")

    attribute_rewards = _parse_attribute_rewards(quest["attribute_rewards"])
    xp_to_award = quest["xp_reward"]
    gold_to_award = quest["gold_reward"]

    profile = get_one(conn, select(user_profile).where(user_profile.c.id == 1))
    old_rank, _ = current_and_next_rank(conn, profile["total_xp"])
    new_total_xp = profile["total_xp"] + xp_to_award
    new_gold = profile["gold"] + gold_to_award
    new_level = min((new_total_xp // 100) + 1, 100)

    completion_id = conn.execute(
        insert(quest_completions).values(
            quest_id=quest_id,
            completed_date=completed_date_value,
            xp_awarded=xp_to_award,
            gold_awarded=gold_to_award,
            attribute_changes=quest["attribute_rewards"],
            notes=payload.notes if payload is not None else None,
        )
    ).inserted_primary_key[0]

    conn.execute(
        update(user_profile)
        .where(user_profile.c.id == 1)
        .values(
            total_xp=new_total_xp,
            gold=new_gold,
            level=new_level,
            updated_at=text("datetime('now')"),
        )
    )

    for reward in attribute_rewards:
        conn.execute(
            update(attributes)
            .where(attributes.c.key == reward["key"])
            .values(score=attributes.c.score + reward["points"])
        )

    new_rank, _ = current_and_next_rank(conn, new_total_xp)
    changed_keys = [reward["key"] for reward in attribute_rewards]
    attribute_rows = {
        row["key"]: dict(row)
        for row in conn.execute(select(attributes).where(attributes.c.key.in_(changed_keys)))
        .mappings()
        .all()
    } if changed_keys else {}

    completion = get_one(
        conn,
        select(quest_completions).where(quest_completions.c.id == completion_id),
    )

    return {
        "completion": completion,
        "new_total_xp": new_total_xp,
        "new_gold": new_gold,
        "new_level": new_level,
        "rank_changed": old_rank.id != new_rank.id,
        "new_rank": new_rank,
        "attribute_changes": [
            {
                "key": reward["key"],
                "name": attribute_rows[reward["key"]]["name"],
                "points_gained": reward["points"],
                "new_score": attribute_rows[reward["key"]]["score"],
            }
            for reward in attribute_rewards
            if reward["key"] in attribute_rows
        ],
    }


def _parse_attribute_rewards(raw_rewards: str) -> list[dict[str, int | str]]:
    try:
        parsed = json.loads(raw_rewards)
    except json.JSONDecodeError:
        return []

    if not isinstance(parsed, list):
        return []

    rewards: list[dict[str, int | str]] = []
    for item in parsed:
        if (
            isinstance(item, dict)
            and isinstance(item.get("key"), str)
            and isinstance(item.get("points"), int)
        ):
            rewards.append({"key": item["key"], "points": item["points"]})
    return rewards
