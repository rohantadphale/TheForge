export type QuestType = 'daily' | 'weekly' | 'campaign' | 'trial' | 'reflection' | 'recovery'
export type Recurrence = 'none' | 'daily' | 'weekly'
export type CompanionState = 'idle' | 'studying' | 'celebrating' | 'briefing'

export type AppSettings = {
  id: number
  app_name: string
  app_subtitle: string
  system_name: string
  updated_at: string
}

export type Profile = {
  id: number
  display_name: string
  total_xp: number
  gold: number
  level: number
  updated_at: string
}

export type Rank = {
  id: number
  label: string
  min_xp: number
  sort_order: number
}

export type Attribute = {
  id: number
  key: string
  name: string
  description: string | null
  domain: string
  score: number
  icon: string
}

export type Campaign = {
  id: number
  name: string
  description: string | null
  domain: string
  is_active: number
  created_at: string
}

export type Quest = {
  id: number
  title: string
  description: string | null
  quest_type: QuestType
  campaign_id: number | null
  xp_reward: number
  gold_reward: number
  attribute_rewards: string
  recurrence: Recurrence
  due_date: string | null
  is_archived: number
  created_at: string
  updated_at: string
}

export type Companion = {
  id: number
  name: string
  role: string
  domain: string
  persona: string
  bio: string | null
  is_unlocked: number
  unlock_cost_gold: number
  unlock_condition: string | null
  current_state: CompanionState
  sort_order: number
}

export type DashboardResponse = {
  settings: AppSettings
  profile: Profile
  current_rank: Rank
  next_rank: Rank | null
  today_quests: Quest[]
  weekly_quests: Quest[]
  active_campaign: Campaign | null
  companion: Companion | null
  attributes: Attribute[]
}

export type QuestPayload = {
  title: string
  description?: string | null
  quest_type: QuestType
  campaign_id?: number | null
  xp_reward: number
  gold_reward: number
  attribute_rewards: string
  recurrence: Recurrence
  due_date?: string | null
}

export type CompletionResponse = {
  completion: {
    id: number
    quest_id: number
    completed_date: string
    xp_awarded: number
    gold_awarded: number
    attribute_changes: string
    notes: string | null
    completed_at: string
  }
  new_total_xp: number
  new_gold: number
  new_level: number
  rank_changed: boolean
  new_rank: Rank
  attribute_changes: Array<{
    key: string
    name: string
    points_gained: number
    new_score: number
  }>
}
