from sqlalchemy import (
    CheckConstraint,
    Column,
    ForeignKey,
    Index,
    Integer,
    MetaData,
    Table,
    Text,
    text,
)


metadata = MetaData()

app_settings = Table(
    "app_settings",
    metadata,
    Column("id", Integer, primary_key=True, server_default=text("1")),
    Column("app_name", Text, nullable=False, server_default=text("'Arise'")),
    Column(
        "app_subtitle",
        Text,
        nullable=False,
        server_default=text("'Your personal progression system'"),
    ),
    Column("system_name", Text, nullable=False, server_default=text("'The System'")),
    Column("updated_at", Text, nullable=False, server_default=text("(datetime('now'))")),
    CheckConstraint("id = 1"),
)

user_profile = Table(
    "user_profile",
    metadata,
    Column("id", Integer, primary_key=True, server_default=text("1")),
    Column("display_name", Text, nullable=False, server_default=text("'Hunter'")),
    Column("total_xp", Integer, nullable=False, server_default=text("0")),
    Column("gold", Integer, nullable=False, server_default=text("0")),
    Column("level", Integer, nullable=False, server_default=text("1")),
    Column("updated_at", Text, nullable=False, server_default=text("(datetime('now'))")),
    CheckConstraint("id = 1"),
)

ranks = Table(
    "ranks",
    metadata,
    Column("id", Integer, primary_key=True, autoincrement=True),
    Column("label", Text, nullable=False),
    Column("min_xp", Integer, nullable=False),
    Column("sort_order", Integer, nullable=False, unique=True),
)

attributes = Table(
    "attributes",
    metadata,
    Column("id", Integer, primary_key=True, autoincrement=True),
    Column("key", Text, nullable=False, unique=True),
    Column("name", Text, nullable=False),
    Column("description", Text),
    Column(
        "domain",
        Text,
        nullable=False,
    ),
    Column("score", Integer, nullable=False, server_default=text("0")),
    Column("icon", Text, nullable=False, server_default=text("'⭐'")),
    CheckConstraint("domain IN ('Health','Wealth','Happiness','Mastery')"),
)

campaigns = Table(
    "campaigns",
    metadata,
    Column("id", Integer, primary_key=True, autoincrement=True),
    Column("name", Text, nullable=False),
    Column("description", Text),
    Column("domain", Text, nullable=False),
    Column("is_active", Integer, nullable=False, server_default=text("0")),
    Column("created_at", Text, nullable=False, server_default=text("(datetime('now'))")),
)

quests = Table(
    "quests",
    metadata,
    Column("id", Integer, primary_key=True, autoincrement=True),
    Column("title", Text, nullable=False),
    Column("description", Text),
    Column(
        "quest_type",
        Text,
        nullable=False,
    ),
    Column("campaign_id", Integer, ForeignKey("campaigns.id", ondelete="SET NULL")),
    Column("xp_reward", Integer, nullable=False, server_default=text("50")),
    Column("gold_reward", Integer, nullable=False, server_default=text("10")),
    Column("attribute_rewards", Text, nullable=False, server_default=text("'[]'")),
    Column(
        "recurrence",
        Text,
        nullable=False,
        server_default=text("'none'"),
    ),
    Column("due_date", Text),
    Column("is_archived", Integer, nullable=False, server_default=text("0")),
    Column("created_at", Text, nullable=False, server_default=text("(datetime('now'))")),
    Column("updated_at", Text, nullable=False, server_default=text("(datetime('now'))")),
    CheckConstraint("quest_type IN ('daily','weekly','campaign','trial','reflection','recovery')"),
    CheckConstraint("recurrence IN ('none','daily','weekly')"),
)

quest_completions = Table(
    "quest_completions",
    metadata,
    Column("id", Integer, primary_key=True, autoincrement=True),
    Column("quest_id", Integer, ForeignKey("quests.id", ondelete="CASCADE"), nullable=False),
    Column("completed_date", Text, nullable=False),
    Column("xp_awarded", Integer, nullable=False),
    Column("gold_awarded", Integer, nullable=False),
    Column("attribute_changes", Text, nullable=False, server_default=text("'[]'")),
    Column("notes", Text),
    Column("completed_at", Text, nullable=False, server_default=text("(datetime('now'))")),
)

Index(
    "idx_completion_quest_date",
    quest_completions.c.quest_id,
    quest_completions.c.completed_date,
    unique=True,
)

companions = Table(
    "companions",
    metadata,
    Column("id", Integer, primary_key=True, autoincrement=True),
    Column("name", Text, nullable=False),
    Column("role", Text, nullable=False),
    Column("domain", Text, nullable=False),
    Column("persona", Text, nullable=False),
    Column("bio", Text),
    Column("is_unlocked", Integer, nullable=False, server_default=text("0")),
    Column("unlock_cost_gold", Integer, nullable=False, server_default=text("0")),
    Column("unlock_condition", Text),
    Column("current_state", Text, nullable=False, server_default=text("'idle'")),
    Column("sort_order", Integer, nullable=False, server_default=text("0")),
    CheckConstraint("current_state IN ('idle','studying','celebrating','briefing')"),
)

reflections = Table(
    "reflections",
    metadata,
    Column("id", Integer, primary_key=True, autoincrement=True),
    Column(
        "quest_completion_id",
        Integer,
        ForeignKey("quest_completions.id", ondelete="SET NULL"),
    ),
    Column("content", Text, nullable=False),
    Column("xp_awarded", Integer, nullable=False, server_default=text("25")),
    Column("created_at", Text, nullable=False, server_default=text("(datetime('now'))")),
)

weekly_reviews = Table(
    "weekly_reviews",
    metadata,
    Column("id", Integer, primary_key=True, autoincrement=True),
    Column("week_start", Text, nullable=False, unique=True),
    Column("summary", Text),
    Column("xp_gained", Integer, nullable=False, server_default=text("0")),
    Column("gold_gained", Integer, nullable=False, server_default=text("0")),
    Column("quests_completed", Integer, nullable=False, server_default=text("0")),
    Column("created_at", Text, nullable=False, server_default=text("(datetime('now'))")),
)
