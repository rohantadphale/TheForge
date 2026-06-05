from datetime import timedelta

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, insert, select, update
from sqlalchemy.engine import Connection

from database import get_db
from models import quest_completions, quests, weekly_reviews
from schemas import WeeklyReviewCreate, WeeklySummary

from .utils import parse_iso_date


router = APIRouter(prefix="/weekly", tags=["weekly"])


@router.get("", response_model=WeeklySummary)
def get_weekly_review(
    week_start: str = Query(...),
    conn: Connection = Depends(get_db),
) -> dict:
    return _weekly_summary(conn, week_start)


@router.post("", response_model=WeeklySummary)
def create_weekly_review(
    payload: WeeklyReviewCreate, conn: Connection = Depends(get_db)
) -> dict:
    week_start = parse_iso_date(payload.week_start).isoformat()
    existing_id = conn.execute(
        select(weekly_reviews.c.id).where(weekly_reviews.c.week_start == week_start)
    ).scalar_one_or_none()

    totals = _weekly_totals(conn, week_start)
    if existing_id is None:
        conn.execute(
            insert(weekly_reviews).values(
                week_start=week_start,
                summary=payload.summary,
                xp_gained=totals["xp_gained"],
                gold_gained=totals["gold_gained"],
                quests_completed=totals["quests_completed"],
            )
        )
    else:
        conn.execute(
            update(weekly_reviews)
            .where(weekly_reviews.c.id == existing_id)
            .values(
                summary=payload.summary,
                xp_gained=totals["xp_gained"],
                gold_gained=totals["gold_gained"],
                quests_completed=totals["quests_completed"],
            )
        )

    return _weekly_summary(conn, week_start)


def _weekly_bounds(week_start: str) -> tuple[str, str]:
    start = parse_iso_date(week_start)
    return start.isoformat(), (start + timedelta(days=6)).isoformat()


def _weekly_totals(conn: Connection, week_start: str) -> dict:
    start, end = _weekly_bounds(week_start)
    return dict(
        conn.execute(
            select(
                func.coalesce(func.sum(quest_completions.c.xp_awarded), 0).label("xp_gained"),
                func.coalesce(func.sum(quest_completions.c.gold_awarded), 0).label("gold_gained"),
                func.count(quest_completions.c.id).label("quests_completed"),
            ).where(
                quest_completions.c.completed_date >= start,
                quest_completions.c.completed_date <= end,
            )
        ).mappings().one()
    )


def _weekly_completions(conn: Connection, week_start: str) -> list[dict]:
    start, end = _weekly_bounds(week_start)
    return list(
        conn.execute(
            select(
                quest_completions.c.id,
                quest_completions.c.quest_id,
                quests.c.title.label("quest_title"),
                quest_completions.c.completed_date,
                quest_completions.c.xp_awarded,
                quest_completions.c.gold_awarded,
            )
            .select_from(quest_completions.join(quests, quests.c.id == quest_completions.c.quest_id))
            .where(
                quest_completions.c.completed_date >= start,
                quest_completions.c.completed_date <= end,
            )
            .order_by(quest_completions.c.completed_date, quest_completions.c.id)
        )
        .mappings()
        .all()
    )


def _weekly_summary(conn: Connection, week_start: str) -> dict:
    week_start_value = parse_iso_date(week_start).isoformat()
    totals = _weekly_totals(conn, week_start_value)
    review = conn.execute(
        select(weekly_reviews).where(weekly_reviews.c.week_start == week_start_value)
    ).mappings().first()

    base = dict(review) if review else {"id": None, "week_start": week_start_value, "summary": None, "created_at": None}
    return {
        **base,
        "xp_gained": totals["xp_gained"],
        "gold_gained": totals["gold_gained"],
        "quests_completed": totals["quests_completed"],
        "completions": _weekly_completions(conn, week_start_value),
    }
