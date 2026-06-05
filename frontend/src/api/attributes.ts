import { apiClient } from './client'
import type { Attribute } from './types'

export async function getAttributes() {
  const { data } = await apiClient.get<Attribute[]>('/attributes')
  return data
}
