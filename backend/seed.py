import json

from sqlalchemy import text

from database import engine, init_db


RANKS = [
    ("Unawakened", 0, 0),
    ("E-Rank", 500, 1),
    ("D-Rank", 1500, 2),
    ("C-Rank", 4000, 3),
    ("B-Rank", 10000, 4),
    ("A-Rank", 25000, 5),
    ("S-Rank", 60000, 6),
    ("National-Level", 150000, 7),
    ("Mythic", 400000, 8),
    ("Transcendent", 1000000, 9),
]

ATTRIBUTES = [
    ("strength", "Strength", "Health", "💪"),
    ("vitality", "Vitality", "Health", "🫀"),
    ("intelligence", "Intelligence", "Mastery", "🧠"),
    ("wisdom", "Wisdom", "Mastery", "🦉"),
    ("discipline", "Discipline", "Mastery", "⚔️"),
    ("charisma", "Charisma", "Happiness", "✨"),
    ("fortune", "Fortune", "Wealth", "💰"),
    ("spirit", "Spirit", "Happiness", "😇"),
]

QUESTS = [
    (
        "Solve 1 DSA problem",
        "daily",
        "daily",
        50,
        10,
        [{"key": "intelligence", "points": 5}, {"key": "discipline", "points": 2}],
    ),
    (
        "System design review block",
        "daily",
        "daily",
        50,
        10,
        [{"key": "intelligence", "points": 3}, {"key": "wisdom", "points": 4}],
    ),
    (
        "Go or Python language block",
        "daily",
        "daily",
        50,
        10,
        [{"key": "intelligence", "points": 4}, {"key": "discipline", "points": 3}],
    ),
    (
        "Read 1 system design article",
        "daily",
        "daily",
        30,
        5,
        [{"key": "wisdom", "points": 4}],
    ),
    (
        "Daily reflection",
        "daily",
        "daily",
        25,
        5,
        [{"key": "wisdom", "points": 2}, {"key": "discipline", "points": 2}],
    ),
    (
        "Complete mock interview or timed practice",
        "weekly",
        "weekly",
        200,
        50,
        [{"key": "intelligence", "points": 10}, {"key": "charisma", "points": 10}],
    ),
    (
        "Write system design doc",
        "weekly",
        "weekly",
        200,
        50,
        [{"key": "wisdom", "points": 12}, {"key": "intelligence", "points": 8}],
    ),
]


def seed() -> None:
    init_db()

    with engine.begin() as conn:
        conn.execute(text("PRAGMA foreign_keys = ON"))
        conn.execute(
            text(
                """
                INSERT OR IGNORE INTO app_settings
                  (id, app_name, app_subtitle, system_name)
                VALUES
                  (1, 'Arise', 'Your personal progression system', 'The System')
                """
            )
        )
        conn.execute(
            text(
                """
                INSERT OR IGNORE INTO user_profile
                  (id, display_name, total_xp, gold, level)
                VALUES
                  (1, 'Rohi', 0, 0, 1)
                """
            )
        )

        for label, min_xp, sort_order in RANKS:
            conn.execute(
                text(
                    """
                    INSERT OR IGNORE INTO ranks (label, min_xp, sort_order)
                    VALUES (:label, :min_xp, :sort_order)
                    """
                ),
                {"label": label, "min_xp": min_xp, "sort_order": sort_order},
            )

        for key, name, domain, icon in ATTRIBUTES:
            conn.execute(
                text(
                    """
                    INSERT OR IGNORE INTO attributes
                      (key, name, description, domain, score, icon)
                    VALUES
                      (:key, :name, NULL, :domain, 0, :icon)
                    """
                ),
                {"key": key, "name": name, "domain": domain, "icon": icon},
            )
            conn.execute(
                text(
                    """
                    UPDATE attributes
                    SET name = :name, domain = :domain, icon = :icon
                    WHERE key = :key
                    """
                ),
                {"key": key, "name": name, "domain": domain, "icon": icon},
            )

        campaign_id = conn.execute(
            text(
                """
                INSERT INTO campaigns (name, description, domain, is_active)
                SELECT
                  'Senior SWE Prep',
                  'Senior software engineering interview preparation campaign.',
                  'Mastery',
                  1
                WHERE NOT EXISTS (
                  SELECT 1 FROM campaigns WHERE name = 'Senior SWE Prep'
                )
                RETURNING id
                """
            )
        ).scalar_one_or_none()

        if campaign_id is None:
            campaign_id = conn.execute(
                text("SELECT id FROM campaigns WHERE name = 'Senior SWE Prep'")
            ).scalar_one()

        for title, quest_type, recurrence, xp, gold, rewards in QUESTS:
            conn.execute(
                text(
                    """
                    INSERT INTO quests
                      (title, description, quest_type, campaign_id, xp_reward,
                       gold_reward, attribute_rewards, recurrence)
                    SELECT
                      :title, NULL, :quest_type, :campaign_id, :xp_reward,
                      :gold_reward, :attribute_rewards, :recurrence
                    WHERE NOT EXISTS (
                      SELECT 1 FROM quests
                      WHERE title = :title AND campaign_id = :campaign_id
                    )
                    """
                ),
                {
                    "title": title,
                    "quest_type": quest_type,
                    "campaign_id": campaign_id,
                    "xp_reward": xp,
                    "gold_reward": gold,
                    "attribute_rewards": json.dumps(rewards, separators=(",", ":")),
                    "recurrence": recurrence,
                },
            )

        conn.execute(
            text(
                """
                INSERT INTO companions
                  (name, role, domain, persona, bio, is_unlocked,
                   unlock_cost_gold, unlock_condition, current_state, sort_order)
                SELECT
                  'Axiom',
                  'System Guide',
                  'Mastery',
                  'Sharp, mildly sarcastic, action-focused, allergic to excuses',
                  'The System''s first manifest agent. Axiom appeared when the Hunter awakened. Nobody knows if it chose this role or was assigned it.',
                  1,
                  0,
                  NULL,
                  'idle',
                  0
                WHERE NOT EXISTS (
                  SELECT 1 FROM companions WHERE name = 'Axiom'
                )
                """
            )
        )


if __name__ == "__main__":
    seed()
    print("Seeded successfully.")
