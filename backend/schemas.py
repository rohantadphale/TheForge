from typing import Literal

from pydantic import BaseModel, ConfigDict


Domain = Literal["Health", "Wealth", "Happiness", "Mastery"]
QuestType = Literal["daily", "weekly", "campaign", "trial", "reflection", "recovery"]
Recurrence = Literal["none", "daily", "weekly"]
CompanionState = Literal["idle", "studying", "celebrating", "briefing"]


class BaseSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)


class AppSettings(BaseSchema):
    id: int
    app_name: str
    app_subtitle: str
    system_name: str
    updated_at: str


class AppSettingsUpdate(BaseModel):
    app_name: str | None = None
    app_subtitle: str | None = None
    system_name: str | None = None


class UserProfile(BaseSchema):
    id: int
    display_name: str
    total_xp: int
    gold: int
    level: int
    updated_at: str


class UserProfileUpdate(BaseModel):
    display_name: str


class Rank(BaseSchema):
    id: int
    label: str
    min_xp: int
    sort_order: int


class UserProfileWithRank(UserProfile):
    current_rank: Rank


class AttributeReward(BaseModel):
    key: str
    points: int


class Attribute(BaseSchema):
    id: int
    key: str
    name: str
    description: str | None = None
    domain: Domain
    score: int
    icon: str


class Campaign(BaseSchema):
    id: int
    name: str
    description: str | None = None
    domain: str
    is_active: int
    created_at: str


class CampaignWithQuests(Campaign):
    quests: list["Quest"]


class Quest(BaseSchema):
    id: int
    title: str
    description: str | None = None
    quest_type: QuestType
    campaign_id: int | None = None
    xp_reward: int
    gold_reward: int
    attribute_rewards: str
    recurrence: Recurrence
    due_date: str | None = None
    is_archived: int
    created_at: str
    updated_at: str


class QuestCreate(BaseModel):
    title: str
    description: str | None = None
    quest_type: QuestType
    campaign_id: int | None = None
    xp_reward: int = 50
    gold_reward: int = 10
    attribute_rewards: str = "[]"
    recurrence: Recurrence = "none"
    due_date: str | None = None


class QuestUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    quest_type: QuestType | None = None
    campaign_id: int | None = None
    xp_reward: int | None = None
    gold_reward: int | None = None
    attribute_rewards: str | None = None
    recurrence: Recurrence | None = None
    due_date: str | None = None
    is_archived: int | None = None


class QuestCompletion(BaseSchema):
    id: int
    quest_id: int
    completed_date: str
    xp_awarded: int
    gold_awarded: int
    attribute_changes: str
    notes: str | None = None
    completed_at: str


class QuestCompleteRequest(BaseModel):
    notes: str | None = None
    date: str | None = None


class AttributeChangeResponse(BaseModel):
    key: str
    name: str
    points_gained: int
    new_score: int


class QuestCompleteResponse(BaseModel):
    completion: QuestCompletion
    new_total_xp: int
    new_gold: int
    new_level: int
    rank_changed: bool
    new_rank: Rank
    attribute_changes: list[AttributeChangeResponse]


class Companion(BaseSchema):
    id: int
    name: str
    role: str
    domain: str
    persona: str
    bio: str | None = None
    is_unlocked: int
    unlock_cost_gold: int
    unlock_condition: str | None = None
    current_state: CompanionState
    sort_order: int


class CompanionStateUpdate(BaseModel):
    state: CompanionState


class Reflection(BaseSchema):
    id: int
    quest_completion_id: int | None = None
    content: str
    xp_awarded: int
    created_at: str


class ReflectionCreate(BaseModel):
    content: str
    quest_completion_id: int | None = None


class WeeklyReview(BaseSchema):
    id: int
    week_start: str
    summary: str | None = None
    xp_gained: int
    gold_gained: int
    quests_completed: int
    created_at: str


class WeeklyReviewCreate(BaseModel):
    week_start: str
    summary: str | None = None


class DashboardResponse(BaseModel):
    profile: UserProfile
    current_rank: Rank
    next_rank: Rank | None = None
    today_quests: list[Quest]
    weekly_quests: list[Quest]
    active_campaign: Campaign | None = None
    companion: Companion | None = None
    attributes: list[Attribute]
    settings: AppSettings


class OkResponse(BaseModel):
    ok: bool
