from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, text, update
from sqlalchemy.engine import Connection

from database import get_db
from models import companions, user_profile
from schemas import Companion, CompanionStateUpdate

from .utils import get_by_id, get_one


router = APIRouter(prefix="/companions", tags=["companions"])


@router.get("", response_model=list[Companion])
def get_companions(conn: Connection = Depends(get_db)) -> list[dict]:
    return list(
        conn.execute(select(companions).order_by(companions.c.sort_order, companions.c.id))
        .mappings()
        .all()
    )


@router.post("/{companion_id}/unlock", response_model=Companion)
def unlock_companion(companion_id: int, conn: Connection = Depends(get_db)) -> dict:
    companion = get_by_id(conn, companions, companion_id, "Companion not found")
    if companion["is_unlocked"]:
        raise HTTPException(status_code=400, detail="Already unlocked")

    profile = get_one(conn, select(user_profile).where(user_profile.c.id == 1))
    if profile["gold"] < companion["unlock_cost_gold"]:
        raise HTTPException(status_code=400, detail="Insufficient gold")

    conn.execute(
        update(user_profile)
        .where(user_profile.c.id == 1)
        .values(
            gold=profile["gold"] - companion["unlock_cost_gold"],
            updated_at=text("datetime('now')"),
        )
    )
    conn.execute(
        update(companions)
        .where(companions.c.id == companion_id)
        .values(is_unlocked=1)
    )
    return get_by_id(conn, companions, companion_id, "Companion not found")


@router.put("/{companion_id}/state", response_model=Companion)
def update_companion_state(
    companion_id: int,
    payload: CompanionStateUpdate,
    conn: Connection = Depends(get_db),
) -> dict:
    get_by_id(conn, companions, companion_id, "Companion not found")
    conn.execute(
        update(companions)
        .where(companions.c.id == companion_id)
        .values(current_state=payload.state)
    )
    return get_by_id(conn, companions, companion_id, "Companion not found")
