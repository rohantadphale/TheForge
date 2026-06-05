from fastapi import APIRouter, Depends
from sqlalchemy import insert, select, text, update
from sqlalchemy.engine import Connection

from database import get_db
from models import reflections, user_profile
from schemas import Reflection, ReflectionCreate

from .utils import get_one


router = APIRouter(prefix="/reflections", tags=["reflections"])


@router.post("", response_model=Reflection)
def create_reflection(
    payload: ReflectionCreate, conn: Connection = Depends(get_db)
) -> dict:
    reflection_id = conn.execute(
        insert(reflections).values(
            quest_completion_id=payload.quest_completion_id,
            content=payload.content,
            xp_awarded=25,
        )
    ).inserted_primary_key[0]

    profile = get_one(conn, select(user_profile).where(user_profile.c.id == 1))
    new_total_xp = profile["total_xp"] + 25
    conn.execute(
        update(user_profile)
        .where(user_profile.c.id == 1)
        .values(
            total_xp=new_total_xp,
            level=min((new_total_xp // 100) + 1, 100),
            updated_at=text("datetime('now')"),
        )
    )
    return get_one(conn, select(reflections).where(reflections.c.id == reflection_id))
