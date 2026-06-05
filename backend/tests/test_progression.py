import pytest
from sqlalchemy import text


@pytest.mark.parametrize(
    ("xp_reward", "expected_level"),
    [
        (0, 1),
        (99, 1),
        (100, 2),
        (9900, 100),
        (99999, 100),
    ],
)
def test_level_formula_cases(client, test_engine, xp_reward, expected_level):
    with test_engine.begin() as conn:
        conn.execute(
            text("UPDATE quests SET xp_reward = :xp_reward, gold_reward = 0 WHERE id = 1"),
            {"xp_reward": xp_reward},
        )

    response = client.post("/api/quests/1/complete", json={"date": "2026-06-01"})

    assert response.status_code == 200
    assert response.json()["new_total_xp"] == xp_reward
    assert response.json()["new_level"] == expected_level


@pytest.mark.parametrize(
    ("total_xp", "expected_rank"),
    [
        (0, "Unawakened"),
        (499, "Unawakened"),
        (500, "E-Rank"),
        (60000, "S-Rank"),
    ],
)
def test_rank_computation_cases(client, test_engine, total_xp, expected_rank):
    with test_engine.begin() as conn:
        conn.execute(
            text("UPDATE user_profile SET total_xp = :total_xp WHERE id = 1"),
            {"total_xp": total_xp},
        )

    response = client.get("/api/dashboard")

    assert response.status_code == 200
    assert response.json()["current_rank"]["label"] == expected_rank


def test_completing_5_daily_quests_accumulates_rewards(client):
    for quest_id in range(1, 6):
        response = client.post(f"/api/quests/{quest_id}/complete", json={"date": "2026-06-01"})
        assert response.status_code == 200

    dashboard = client.get("/api/dashboard")

    assert dashboard.status_code == 200
    assert dashboard.json()["profile"]["total_xp"] == 205
    assert dashboard.json()["profile"]["gold"] == 40


def test_get_weekly_returns_aggregated_xp_for_known_week(client):
    assert client.post("/api/quests/1/complete", json={"date": "2026-06-01"}).status_code == 200
    assert client.post("/api/quests/2/complete", json={"date": "2026-06-03"}).status_code == 200

    response = client.get("/api/weekly?week_start=2026-06-01")

    assert response.status_code == 200
    body = response.json()
    assert body["week_start"] == "2026-06-01"
    assert body["xp_gained"] == 100
    assert body["gold_gained"] == 20
    assert body["quests_completed"] == 2
    assert [completion["quest_title"] for completion in body["completions"]] == [
        "Solve 1 DSA problem",
        "System design review block",
    ]


def test_post_weekly_saves_summary_and_get_returns_it(client):
    assert client.post("/api/quests/1/complete", json={"date": "2026-06-01"}).status_code == 200

    save_response = client.post(
        "/api/weekly",
        json={"week_start": "2026-06-01", "summary": "Learned to ship in small slices."},
    )
    get_response = client.get("/api/weekly?week_start=2026-06-01")

    assert save_response.status_code == 200
    assert get_response.status_code == 200
    assert get_response.json()["summary"] == "Learned to ship in small slices."
    assert get_response.json()["xp_gained"] == 50
