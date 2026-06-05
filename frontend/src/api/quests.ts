import { apiClient } from './client'
import type { CompletionResponse, Quest, QuestPayload, QuestType } from './types'

export type QuestFilters = {
  type?: QuestType
  campaign_id?: number
  date?: string
  archived?: 0 | 1
}

export async function getQuests(filters: QuestFilters = {}) {
  const { data } = await apiClient.get<Quest[]>('/quests', { params: filters })
  return data
}

export async function getQuest(id: number) {
  const { data } = await apiClient.get<Quest>(`/quests/${id}`)
  return data
}

export async function createQuest(payload: QuestPayload) {
  const { data } = await apiClient.post<Quest>('/quests', payload)
  return data
}

export async function updateQuest(id: number, payload: Partial<QuestPayload>) {
  const { data } = await apiClient.put<Quest>(`/quests/${id}`, payload)
  return data
}

export async function deleteQuest(id: number) {
  const { data } = await apiClient.delete<{ ok: boolean }>(`/quests/${id}`)
  return data
}

export async function completeQuest(id: number, date?: string, notes?: string) {
  const { data } = await apiClient.post<CompletionResponse>(`/quests/${id}/complete`, {
    date,
    notes,
  })
  return data
}
