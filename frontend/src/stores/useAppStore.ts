import { create } from 'zustand'
import type { AppSettings, CompanionState, CompletionResponse, Profile, Quest } from '../api/types'

export type CompletionToastItem = {
  id: string
  questTitle: string
  completion: CompletionResponse
  isLeaving: boolean
}

type AppState = {
  settings: AppSettings | null
  profile: Profile | null
  companionState: CompanionState
  completionToasts: CompletionToastItem[]
  rankUpLabel: string | null
  isRankUpLeaving: boolean
  setSettings: (settings: AppSettings) => void
  setProfile: (profile: Profile) => void
  setCompanionState: (state: CompanionState) => void
  enqueueCompletionToast: (quest: Quest, completion: CompletionResponse) => void
  dismissCompletionToast: (id: string) => void
  removeCompletionToast: (id: string) => void
  showRankUp: (label: string) => void
  hideRankUp: () => void
  clearRankUp: () => void
}

export const useAppStore = create<AppState>((set) => ({
  settings: null,
  profile: null,
  companionState: 'idle',
  completionToasts: [],
  rankUpLabel: null,
  isRankUpLeaving: false,
  setSettings: (settings) => set({ settings }),
  setProfile: (profile) => set({ profile }),
  setCompanionState: (companionState) => set({ companionState }),
  enqueueCompletionToast: (quest, completion) =>
    set((state) => ({
      completionToasts: [
        ...state.completionToasts,
        {
          id: `${quest.id}-${completion.completion.id}-${Date.now()}`,
          questTitle: quest.title,
          completion,
          isLeaving: false,
        },
      ],
    })),
  dismissCompletionToast: (id) =>
    set((state) => ({
      completionToasts: state.completionToasts.map((toast) =>
        toast.id === id ? { ...toast, isLeaving: true } : toast,
      ),
    })),
  removeCompletionToast: (id) =>
    set((state) => ({
      completionToasts: state.completionToasts.filter((toast) => toast.id !== id),
    })),
  showRankUp: (rankUpLabel) => set({ rankUpLabel, isRankUpLeaving: false }),
  hideRankUp: () => set({ isRankUpLeaving: true }),
  clearRankUp: () => set({ rankUpLabel: null, isRankUpLeaving: false }),
}))
