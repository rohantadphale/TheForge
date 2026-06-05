import { apiClient } from './client'
import type { Profile } from './types'

export async function updateProfile(payload: Pick<Profile, 'display_name'>) {
  const { data } = await apiClient.put<Profile>('/profile', payload)
  return data
}
