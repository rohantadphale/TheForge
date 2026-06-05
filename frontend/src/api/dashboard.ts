import { apiClient } from './client'
import type { DashboardResponse } from './types'

export async function getDashboard() {
  const { data } = await apiClient.get<DashboardResponse>('/dashboard')
  return data
}
