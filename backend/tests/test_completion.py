import json

from sqlalchemy import text


def test_complete_daily_quest_returns_rewards_level_and_rank(client):
    response = client.post("/api/quests/1/complete", json={"date": "2026-06-04"})

    assert response.status_code == 200
    body = response.json()
    assert body["completion"]["quest_id"] == 1
    assert body["completion"]["completed_date"] == "2026-06-04"
    assert body["completion"]["xp_awarded"] == 50
    assert body["completion"]["gold_awarded"] == 10
    assert body["new_total_xp"] == 50
    assert body["new_gold"] == 10
    assert body["new_level"] == 1
    assert body["rank_changed"] is False
    assert body["new_rank"]["label"] == "Unawakened"


def test_complete_same_quest_same_date_returns_409(client):
    assert client.post("/api/quests/1/complete", json={"date": "2026-06-04"}).status_code == 200

    response = client.post("/api/quests/1/complete", json={"date": "2026-06-04"})

    assert response.status_code == 409
    assert response.json() == {"detail": "Quest already completed for this date"}


def test_complete_quest_updates_attribute_rewards(client, test_engine):
    response = client.post("/api/quests/1/complete", json={"date": "2026-06-04"})

    assert response.status_code == 200
    changes = {change["key"]: change for change in response.json()["attribute_changes"]}
    assert changes["intelligence"]["points_gained"] == 5
    assert changes["intelligence"]["new_score"] == 5
    assert changes["discipline"]["points_gained"] == 2
    assert changes["discipline"]["new_score"] == 2

    with test_engine.begin() as conn:
        scores = dict(
            conn.execute(text("SELECT key, score FROM attributes WHERE key IN ('intelligence', 'discipline')"))
            .tuples()
            .all()
        )
    assert scores == {"intelligence": 5, "discipline": 2}


def test_complete_quest_that_causes_rank_up(client, test_engine):
    with test_engine.begin() as conn:
        conn.execute(text("UPDATE user_profile SET total_xp = 490, level = 5 WHERE id = 1"))

    response = client.post("/api/quests/1/complete", json={"date": "2026-06-04"})

    assert response.status_code == 200
    body = response.json()
    assert body["new_total_xp"] == 540
    assert body["rank_changed"] is True
    assert body["new_rank"]["label"] == "E-Rank"


def test_complete_quest_level_formula_uses_new_total_xp(client, test_engine):
    with test_engine.begin() as conn:
        conn.execute(text("UPDATE user_profile SET total_xp = 950, level = 10 WHERE id = 1"))

    response = client.post("/api/quests/1/complete", json={"date": "2026-06-04"})

    assert response.status_code == 200
    assert response.json()["new_total_xp"] == 1000
    assert response.json()["new_level"] == 11


def test_complete_invalid_quest_id_returns_404(client):
    response = client.post("/api/quests/999/complete", json={"date": "2026-06-04"})

    assert response.status_code == 404


def test_complete_archived_quest_returns_404(client, test_engine):
    with test_engine.begin() as conn:
        conn.execute(text("UPDATE quests SET is_archived = 1 WHERE id = 1"))

    response = client.post("/api/quests/1/complete", json={"date": "2026-06-04"})

    assert response.status_code == 404


def test_complete_quest_with_date_records_that_date(client, test_engine):
    response = client.post(
        "/api/quests/1/complete",
        json={"date": "2026-06-01", "notes": "Completed during morning block"},
    )

    assert response.status_code == 200
    assert response.json()["completion"]["completed_date"] == "2026-06-01"
    assert response.json()["completion"]["notes"] == "Completed during morning block"

    with test_engine.begin() as conn:
        row = conn.execute(
            text(
                """
                SELECT completed_date, notes
                FROM quest_completions
                WHERE quest_id = 1
                """
            )
        ).mappings().one()
    assert row["completed_date"] == "2026-06-01"
    assert row["notes"] == "Completed during morning block"


def test_complete_quest_skips_missing_attribute_keys(client, test_engine):
    with test_engine.begin() as conn:
        conn.execute(
            text(
                """
                UPDATE quests
                SET attribute_rewards = :rewards
                WHERE id = 1
                """
            ),
            {"rewards": json.dumps([{"key": "missing", "points": 99}])},
        )

    response = client.post("/api/quests/1/complete", json={"date": "2026-06-04"})

    assert response.status_code == 200
    assert response.json()["attribute_changes"] == []
