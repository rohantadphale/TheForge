import { apiClient } from './client'
import type { Campaign } from './types'

export async function getCampaigns() {
  const { data } = await apiClient.get<Campaign[]>('/campaigns')
  return data
}
