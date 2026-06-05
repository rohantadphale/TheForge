import { create } from 'zustand'
import type { AppSettings, CompanionState, Profile } from '../api/types'

type AppState = {
  settings: AppSettings | null
  profile: Profile | null
  companionState: CompanionState
  setSettings: (settings: AppSettings) => void
  setProfile: (profile: Profile) => void
  setCompanionState: (state: CompanionState) => void
}

export const useAppStore = create<AppState>((set) => ({
  settings: null,
  profile: null,
  companionState: 'idle',
  setSettings: (settings) => set({ settings }),
  setProfile: (profile) => set({ profile }),
  setCompanionState: (companionState) => set({ companionState }),
}))
