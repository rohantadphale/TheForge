import { apiClient } from './client'
import type { AppSettings } from './types'

export async function getSettings() {
  const { data } = await apiClient.get<AppSettings>('/settings')
  return data
}

export async function updateSettings(payload: Partial<Pick<AppSettings, 'app_name' | 'app_subtitle' | 'system_name'>>) {
  const { data } = await apiClient.put<AppSettings>('/settings', payload)
  return data
}
