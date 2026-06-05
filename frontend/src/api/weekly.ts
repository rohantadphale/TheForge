import { apiClient } from './client'

export type WeeklyReview = {
  id: number
  week_start: string
  summary: string | null
  xp_gained: number
  gold_gained: number
  quests_completed: number
  created_at: string
}

export async function getWeeklyReviews() {
  const { data } = await apiClient.get<WeeklyReview[]>('/weekly')
  return data
}
