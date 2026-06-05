from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.engine import Connection

from database import get_db
from models import ranks
from schemas import Rank


router = APIRouter(prefix="/ranks", tags=["ranks"])


@router.get("", response_model=list[Rank])
def get_ranks(conn: Connection = Depends(get_db)) -> list[dict]:
    return list(conn.execute(select(ranks).order_by(ranks.c.sort_order)).mappings().all())
