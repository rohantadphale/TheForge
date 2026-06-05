import { apiClient } from './client'
import type { WeeklySummary } from './types'

export async function getWeeklySummary(weekStart: string) {
  const { data } = await apiClient.get<WeeklySummary>('/weekly', {
    params: { week_start: weekStart },
  })
  return data
}

export async function saveWeeklySummary(payload: { week_start: string; summary: string }) {
  const { data } = await apiClient.post<WeeklySummary>('/weekly', payload)
  return data
}
