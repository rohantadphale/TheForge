import json
import sys
from collections.abc import Generator
from pathlib import Path

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, text
from sqlalchemy.engine import Engine

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from database import SCHEMA_STATEMENTS, get_db
from main import app


@pytest.fixture()
def test_engine(tmp_path: Path) -> Generator[Engine, None, None]:
    engine = create_engine(
        f"sqlite:///{tmp_path / 'theforge-test.db'}",
        connect_args={"check_same_thread": False},
        future=True,
    )
    with engine.begin() as conn:
        conn.execute(text("PRAGMA foreign_keys = ON"))
        for statement in SCHEMA_STATEMENTS:
            conn.exec_driver_sql(statement)
        _seed_test_data(conn)

    yield engine
    engine.dispose()


@pytest.fixture()
def client(test_engine: Engine) -> Generator[TestClient, None, None]:
    def override_get_db():
        with test_engine.begin() as conn:
            conn.execute(text("PRAGMA foreign_keys = ON"))
            yield conn

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


def _seed_test_data(conn) -> None:
    conn.execute(
        text(
            """
            INSERT INTO app_settings (id, app_name, app_subtitle, system_name)
            VALUES (1, 'Arise', 'Your personal progression system', 'The System')
            """
        )
    )
    conn.execute(
        text(
            """
            INSERT INTO user_profile (id, display_name, total_xp, gold, level)
            VALUES (1, 'Hunter', 0, 0, 1)
            """
        )
    )

    ranks = [
        ("Unawakened", 0, 0),
        ("E-Rank", 500, 1),
        ("D-Rank", 1500, 2),
        ("C-Rank", 4000, 3),
        ("B-Rank", 10000, 4),
        ("A-Rank", 25000, 5),
        ("S-Rank", 60000, 6),
    ]
    for label, min_xp, sort_order in ranks:
        conn.execute(
            text(
                """
                INSERT INTO ranks (label, min_xp, sort_order)
                VALUES (:label, :min_xp, :sort_order)
                """
            ),
            {"label": label, "min_xp": min_xp, "sort_order": sort_order},
        )

    attributes = [
        ("intelligence", "Intelligence", "Mastery", "INT"),
        ("discipline", "Discipline", "Mastery", "DIS"),
        ("wisdom", "Wisdom", "Mastery", "WIS"),
    ]
    for key, name, domain, icon in attributes:
        conn.execute(
            text(
                """
                INSERT INTO attributes (key, name, domain, score, icon)
                VALUES (:key, :name, :domain, 0, :icon)
                """
            ),
            {"key": key, "name": name, "domain": domain, "icon": icon},
        )

    conn.execute(
        text(
            """
            INSERT INTO campaigns (id, name, description, domain, is_active)
            VALUES (1, 'Senior SWE Prep', 'Interview preparation.', 'Mastery', 1)
            """
        )
    )

    daily_quests = [
        (
            1,
            "Solve 1 DSA problem",
            50,
            10,
            [{"key": "intelligence", "points": 5}, {"key": "discipline", "points": 2}],
        ),
        (2, "System design review block", 50, 10, [{"key": "wisdom", "points": 4}]),
        (3, "Go or Python language block", 50, 10, []),
        (4, "Read 1 system design article", 30, 5, []),
        (5, "Daily reflection", 25, 5, []),
    ]
    for quest_id, title, xp_reward, gold_reward, rewards in daily_quests:
        conn.execute(
            text(
                """
                INSERT INTO quests
                  (id, title, quest_type, campaign_id, xp_reward, gold_reward,
                   attribute_rewards, recurrence)
                VALUES
                  (:id, :title, 'daily', 1, :xp_reward, :gold_reward,
                   :attribute_rewards, 'daily')
                """
            ),
            {
                "id": quest_id,
                "title": title,
                "xp_reward": xp_reward,
                "gold_reward": gold_reward,
                "attribute_rewards": json.dumps(rewards, separators=(",", ":")),
            },
        )
