from fastapi import APIRouter, Depends
from sqlalchemy import select, text, update
from sqlalchemy.engine import Connection

from database import get_db
from models import app_settings
from schemas import AppSettings, AppSettingsUpdate

from .utils import get_one


router = APIRouter(prefix="/settings", tags=["settings"])


@router.get("", response_model=AppSettings)
def get_settings(conn: Connection = Depends(get_db)) -> dict:
    return get_one(conn, select(app_settings).where(app_settings.c.id == 1))


@router.put("", response_model=AppSettings)
def update_settings(
    payload: AppSettingsUpdate, conn: Connection = Depends(get_db)
) -> dict:
    values = payload.model_dump(exclude_unset=True, exclude_none=True)
    if values:
        conn.execute(
            update(app_settings)
            .where(app_settings.c.id == 1)
            .values(**values, updated_at=text("datetime('now')"))
        )
    return get_settings(conn)
