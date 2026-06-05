import { apiClient } from './client'
import type { Campaign, CampaignWithQuests } from './types'

export async function getCampaigns() {
  const { data } = await apiClient.get<Campaign[]>('/campaigns')
  return data
}

export async function getCampaign(id: number) {
  const { data } = await apiClient.get<CampaignWithQuests>(`/campaigns/${id}`)
  return data
}
