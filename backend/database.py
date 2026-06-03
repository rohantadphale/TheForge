from collections.abc import Generator
from pathlib import Path

from sqlalchemy import create_engine, text
from sqlalchemy.engine import Connection


DATABASE_PATH = Path(__file__).resolve().with_name("theforge.db")
DATABASE_URL = f"sqlite:///{DATABASE_PATH}"

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False},
    future=True,
)

SCHEMA_STATEMENTS = [
    """
    CREATE TABLE IF NOT EXISTS app_settings (
      id            INTEGER PRIMARY KEY DEFAULT 1 CHECK(id = 1),
      app_name      TEXT NOT NULL DEFAULT 'Arise',
      app_subtitle  TEXT NOT NULL DEFAULT 'Your personal progression system',
      system_name   TEXT NOT NULL DEFAULT 'The System',
      updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS user_profile (
      id            INTEGER PRIMARY KEY DEFAULT 1 CHECK(id = 1),
      display_name  TEXT NOT NULL DEFAULT 'Hunter',
      total_xp      INTEGER NOT NULL DEFAULT 0,
      gold          INTEGER NOT NULL DEFAULT 0,
      level         INTEGER NOT NULL DEFAULT 1,
      updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS ranks (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      label      TEXT NOT NULL,
      min_xp     INTEGER NOT NULL,
      sort_order INTEGER NOT NULL UNIQUE
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS attributes (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      key         TEXT NOT NULL UNIQUE,
      name        TEXT NOT NULL,
      description TEXT,
      domain      TEXT NOT NULL CHECK(domain IN ('Health','Wealth','Happiness','Mastery')),
      score       INTEGER NOT NULL DEFAULT 0,
      icon        TEXT NOT NULL DEFAULT '⭐'
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS campaigns (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      name        TEXT NOT NULL,
      description TEXT,
      domain      TEXT NOT NULL,
      is_active   INTEGER NOT NULL DEFAULT 0,
      created_at  TEXT NOT NULL DEFAULT (datetime('now'))
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS quests (
      id                INTEGER PRIMARY KEY AUTOINCREMENT,
      title             TEXT NOT NULL,
      description       TEXT,
      quest_type        TEXT NOT NULL CHECK(quest_type IN ('daily','weekly','campaign','trial','reflection','recovery')),
      campaign_id       INTEGER REFERENCES campaigns(id) ON DELETE SET NULL,
      xp_reward         INTEGER NOT NULL DEFAULT 50,
      gold_reward       INTEGER NOT NULL DEFAULT 10,
      attribute_rewards TEXT NOT NULL DEFAULT '[]',
      recurrence        TEXT NOT NULL DEFAULT 'none' CHECK(recurrence IN ('none','daily','weekly')),
      due_date          TEXT,
      is_archived       INTEGER NOT NULL DEFAULT 0,
      created_at        TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at        TEXT NOT NULL DEFAULT (datetime('now'))
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS quest_completions (
      id               INTEGER PRIMARY KEY AUTOINCREMENT,
      quest_id         INTEGER NOT NULL REFERENCES quests(id) ON DELETE CASCADE,
      completed_date   TEXT NOT NULL,
      xp_awarded       INTEGER NOT NULL,
      gold_awarded     INTEGER NOT NULL,
      attribute_changes TEXT NOT NULL DEFAULT '[]',
      notes            TEXT,
      completed_at     TEXT NOT NULL DEFAULT (datetime('now'))
    )
    """,
    """
    CREATE UNIQUE INDEX IF NOT EXISTS idx_completion_quest_date
      ON quest_completions(quest_id, completed_date)
    """,
    """
    CREATE TABLE IF NOT EXISTS companions (
      id                INTEGER PRIMARY KEY AUTOINCREMENT,
      name              TEXT NOT NULL,
      role              TEXT NOT NULL,
      domain            TEXT NOT NULL,
      persona           TEXT NOT NULL,
      bio               TEXT,
      is_unlocked       INTEGER NOT NULL DEFAULT 0,
      unlock_cost_gold  INTEGER NOT NULL DEFAULT 0,
      unlock_condition  TEXT,
      current_state     TEXT NOT NULL DEFAULT 'idle'
                        CHECK(current_state IN ('idle','studying','celebrating','briefing')),
      sort_order        INTEGER NOT NULL DEFAULT 0
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS reflections (
      id                   INTEGER PRIMARY KEY AUTOINCREMENT,
      quest_completion_id  INTEGER REFERENCES quest_completions(id) ON DELETE SET NULL,
      content              TEXT NOT NULL,
      xp_awarded           INTEGER NOT NULL DEFAULT 25,
      created_at           TEXT NOT NULL DEFAULT (datetime('now'))
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS weekly_reviews (
      id               INTEGER PRIMARY KEY AUTOINCREMENT,
      week_start       TEXT NOT NULL UNIQUE,
      summary          TEXT,
      xp_gained        INTEGER NOT NULL DEFAULT 0,
      gold_gained      INTEGER NOT NULL DEFAULT 0,
      quests_completed INTEGER NOT NULL DEFAULT 0,
      created_at       TEXT NOT NULL DEFAULT (datetime('now'))
    )
    """,
]


def init_db() -> None:
    with engine.begin() as conn:
        conn.exec_driver_sql("PRAGMA foreign_keys = ON")
        for statement in SCHEMA_STATEMENTS:
            conn.exec_driver_sql(statement)


def get_db() -> Generator[Connection]:
    with engine.begin() as conn:
        conn.execute(text("PRAGMA foreign_keys = ON"))
        yield conn
