from fastapi import APIRouter, Depends
from sqlalchemy import select, text, update
from sqlalchemy.engine import Connection

from database import get_db
from models import user_profile
from schemas import UserProfile, UserProfileUpdate, UserProfileWithRank

from .utils import current_and_next_rank, get_one


router = APIRouter(prefix="/profile", tags=["profile"])


@router.get("", response_model=UserProfileWithRank)
def get_profile(conn: Connection = Depends(get_db)) -> dict:
    profile = get_one(conn, select(user_profile).where(user_profile.c.id == 1))
    current_rank, _ = current_and_next_rank(conn, profile["total_xp"])
    return {**profile, "current_rank": current_rank}


@router.put("", response_model=UserProfile)
def update_profile(
    payload: UserProfileUpdate, conn: Connection = Depends(get_db)
) -> dict:
    conn.execute(
        update(user_profile)
        .where(user_profile.c.id == 1)
        .values(display_name=payload.display_name, updated_at=text("datetime('now')"))
    )
    return get_one(conn, select(user_profile).where(user_profile.c.id == 1))
