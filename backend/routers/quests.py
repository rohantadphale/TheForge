from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy import insert, select, text, update
from sqlalchemy.engine import Connection

from database import get_db
from models import quests
from schemas import OkResponse, Quest, QuestCreate, QuestType, QuestUpdate

from .utils import get_by_id, is_quest_due_on, parse_iso_date


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
