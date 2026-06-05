from datetime import timedelta

from fastapi import APIRouter, Depends
from sqlalchemy import func, insert, select
from sqlalchemy.engine import Connection

from database import get_db
from models import quest_completions, weekly_reviews
from schemas import WeeklyReview, WeeklyReviewCreate

from .utils import get_one, parse_iso_date


router = APIRouter(prefix="/weekly", tags=["weekly"])


@router.get("", response_model=list[WeeklyReview])
def get_weekly_reviews(conn: Connection = Depends(get_db)) -> list[dict]:
    return list(
        conn.execute(select(weekly_reviews).order_by(weekly_reviews.c.week_start.desc()))
        .mappings()
        .all()
    )


@router.post("", response_model=WeeklyReview)
def create_weekly_review(
    payload: WeeklyReviewCreate, conn: Connection = Depends(get_db)
) -> dict:
    week_start = parse_iso_date(payload.week_start)
    week_end = week_start + timedelta(days=6)

    totals = conn.execute(
        select(
            func.coalesce(func.sum(quest_completions.c.xp_awarded), 0).label("xp_gained"),
            func.coalesce(func.sum(quest_completions.c.gold_awarded), 0).label("gold_gained"),
            func.count(quest_completions.c.id).label("quests_completed"),
        ).where(
            quest_completions.c.completed_date >= week_start.isoformat(),
            quest_completions.c.completed_date <= week_end.isoformat(),
        )
    ).mappings().one()

    review_id = conn.execute(
        insert(weekly_reviews).values(
            week_start=week_start.isoformat(),
            summary=payload.summary,
            xp_gained=totals["xp_gained"],
            gold_gained=totals["gold_gained"],
            quests_completed=totals["quests_completed"],
        )
    ).inserted_primary_key[0]
    return get_one(conn, select(weekly_reviews).where(weekly_reviews.c.id == review_id))
