from datetime import date, datetime, timedelta
from typing import Any

from fastapi import HTTPException
from sqlalchemy import Select, select
from sqlalchemy.engine import Connection, RowMapping
from sqlalchemy.sql.schema import Table

from models import ranks
from schemas import Rank


def row_dict(row: RowMapping | None) -> dict[str, Any] | None:
    if row is None:
        return None
    return dict(row)


def require_row(row: RowMapping | None, detail: str = "Not found") -> dict[str, Any]:
    data = row_dict(row)
    if data is None:
        raise HTTPException(status_code=404, detail=detail)
    return data


def get_one(conn: Connection, statement: Select[Any], detail: str = "Not found") -> dict[str, Any]:
    return require_row(conn.execute(statement).mappings().first(), detail)


def get_by_id(conn: Connection, table: Table, item_id: int, detail: str = "Not found") -> dict[str, Any]:
    return get_one(conn, select(table).where(table.c.id == item_id), detail)


def parse_iso_date(value: str) -> date:
    try:
        return date.fromisoformat(value)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail="Invalid date format. Use YYYY-MM-DD") from exc


def parse_db_date(value: str) -> date:
    try:
        return datetime.fromisoformat(value).date()
    except ValueError:
        return date.fromisoformat(value[:10])


def week_bounds(day: date) -> tuple[date, date]:
    start = day - timedelta(days=day.weekday())
    return start, start + timedelta(days=6)


def is_quest_due_on(quest: dict[str, Any], requested_date: date) -> bool:
    recurrence = quest["recurrence"]
    if recurrence == "daily":
        return True
    if recurrence == "weekly":
        start, end = week_bounds(parse_db_date(quest["created_at"]))
        return start <= requested_date <= end
    return quest["due_date"] == requested_date.isoformat()


def current_and_next_rank(conn: Connection, total_xp: int) -> tuple[Rank, Rank | None]:
    rank_rows = conn.execute(select(ranks).order_by(ranks.c.sort_order)).mappings().all()
    if not rank_rows:
        raise HTTPException(status_code=500, detail="Ranks are not configured")

    current = dict(rank_rows[0])
    for rank in rank_rows:
        rank_data = dict(rank)
        if rank_data["min_xp"] <= total_xp:
            current = rank_data
        else:
            break

    next_rank = next(
        (dict(rank) for rank in rank_rows if rank["sort_order"] > current["sort_order"]),
        None,
    )
    return Rank.model_validate(current), Rank.model_validate(next_rank) if next_rank else None
