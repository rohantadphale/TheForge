from datetime import date

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.engine import Connection

from database import get_db
from models import app_settings, attributes, campaigns, companions, quests, user_profile
from schemas import DashboardResponse

from .utils import current_and_next_rank, get_one, is_quest_due_on


router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("", response_model=DashboardResponse)
def get_dashboard(conn: Connection = Depends(get_db)) -> dict:
    settings = get_one(conn, select(app_settings).where(app_settings.c.id == 1))
    profile = get_one(conn, select(user_profile).where(user_profile.c.id == 1))
    current_rank, next_rank = current_and_next_rank(conn, profile["total_xp"])

    today = date.today()
    active_quests = [
        dict(row)
        for row in conn.execute(
            select(quests).where(quests.c.is_archived == 0).order_by(quests.c.id)
        )
        .mappings()
        .all()
    ]
    today_quests = [quest for quest in active_quests if is_quest_due_on(quest, today)]
    weekly_quests = [quest for quest in today_quests if quest["quest_type"] == "weekly"]

    active_campaign = conn.execute(
        select(campaigns).where(campaigns.c.is_active == 1).order_by(campaigns.c.id)
    ).mappings().first()
    companion = conn.execute(
        select(companions)
        .where(companions.c.is_unlocked == 1)
        .order_by(companions.c.sort_order, companions.c.id)
    ).mappings().first()
    attribute_rows = conn.execute(select(attributes).order_by(attributes.c.id)).mappings().all()

    return {
        "settings": settings,
        "profile": profile,
        "current_rank": current_rank,
        "next_rank": next_rank,
        "today_quests": today_quests,
        "weekly_quests": weekly_quests,
        "active_campaign": dict(active_campaign) if active_campaign else None,
        "companion": dict(companion) if companion else None,
        "attributes": list(attribute_rows),
    }
