from datetime import date

from sqlalchemy import text


def test_create_quest_returns_created_quest(client):
    response = client.post(
        "/api/quests",
        json={
            "title": "Write a design note",
            "quest_type": "campaign",
            "xp_reward": 150,
            "gold_reward": 30,
            "attribute_rewards": "[]",
            "recurrence": "none",
            "due_date": "2026-06-10",
        },
    )

    assert response.status_code in (200, 201)
    body = response.json()
    assert body["title"] == "Write a design note"
    assert body["quest_type"] == "campaign"
    assert body["xp_reward"] == 150


def test_update_quest_returns_updated_fields(client):
    response = client.put(
        "/api/quests/1",
        json={"title": "Solve 2 DSA problems", "xp_reward": 75},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["id"] == 1
    assert body["title"] == "Solve 2 DSA problems"
    assert body["xp_reward"] == 75


def test_delete_quest_archives_and_filters_from_unarchived(client, test_engine):
    response = client.delete("/api/quests/1")

    assert response.status_code == 200
    assert response.json() == {"ok": True}

    with test_engine.begin() as conn:
        is_archived = conn.execute(text("SELECT is_archived FROM quests WHERE id = 1")).scalar_one()
    assert is_archived == 1

    unarchived = client.get("/api/quests?archived=0")
    assert unarchived.status_code == 200
    assert all(quest["id"] != 1 for quest in unarchived.json())


def test_get_quests_by_today_returns_seeded_daily_quests(client):
    response = client.get(f"/api/quests?date={date.today().isoformat()}")

    assert response.status_code == 200
    daily_quests = [quest for quest in response.json() if quest["quest_type"] == "daily"]
    assert len(daily_quests) == 5
