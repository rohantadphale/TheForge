from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.engine import Connection

from database import get_db
from models import attributes
from schemas import Attribute


router = APIRouter(prefix="/attributes", tags=["attributes"])


@router.get("", response_model=list[Attribute])
def get_attributes(conn: Connection = Depends(get_db)) -> list[dict]:
    return list(conn.execute(select(attributes).order_by(attributes.c.id)).mappings().all())
