/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getDashboard } from '../api/dashboard'
import { getSettings, updateSettings } from '../api/settings'
import { updateProfile } from '../api/profile'
import { Panel } from '../components/Panel'
import { useAppStore } from '../stores/useAppStore'

type SettingsToast = {
  id: number
  message: string
  kind: 'success' | 'error'
}

export function SettingsPage() {
  const queryClient = useQueryClient()
  const profile = useAppStore((store) => store.profile)
  const setSettings = useAppStore((store) => store.setSettings)
  const setProfile = useAppStore((store) => store.setProfile)
  const settingsQuery = useQuery({ queryKey: ['settings'], queryFn: getSettings })
  const dashboardQuery = useQuery({ queryKey: ['dashboard'], queryFn: getDashboard })

  const [appName, setAppName] = useState('')
  const [appSubtitle, setAppSubtitle] = useState('')
  const [systemName, setSystemName] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [toast, setToast] = useState<SettingsToast | null>(null)

  useEffect(() => {
    if (settingsQuery.data) {
      setSettings(settingsQuery.data)
      setAppName(settingsQuery.data.app_name)
      setAppSubtitle(settingsQuery.data.app_subtitle)
      setSystemName(settingsQuery.data.system_name)
    }
  }, [setSettings, settingsQuery.data])

  useEffect(() => {
    if (dashboardQuery.data?.profile) {
      setProfile(dashboardQuery.data.profile)
    }
  }, [dashboardQuery.data?.profile, setProfile])

  useEffect(() => {
    const sourceProfile = dashboardQuery.data?.profile ?? profile
    if (sourceProfile) setDisplayName(sourceProfile.display_name)
  }, [dashboardQuery.data?.profile, profile])

  const showToast = (message: string, kind: SettingsToast['kind']) => {
    const id = Date.now()
    setToast({ id, message, kind })
    window.setTimeout(() => {
      setToast((current) => (current?.id === id ? null : current))
    }, 2000)
  }

  const brandingMutation = useMutation({
    mutationFn: () =>
      updateSettings({ app_name: appName, app_subtitle: appSubtitle, system_name: systemName }),
    onSuccess: (settingsResult) => {
      setSettings(settingsResult)
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['settings'] })
      showToast('Settings saved.', 'success')
    },
    onError: () => showToast('Save failed.', 'error'),
  })

  const profileMutation = useMutation({
    mutationFn: () => updateProfile({ display_name: displayName }),
    onSuccess: (profileResult) => {
      setProfile(profileResult)
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      showToast('Settings saved.', 'success')
    },
    onError: () => showToast('Save failed.', 'error'),
  })

  const handleBrandingSubmit = (event: FormEvent) => {
    event.preventDefault()
    brandingMutation.mutate()
  }

  const handleProfileSubmit = (event: FormEvent) => {
    event.preventDefault()
    profileMutation.mutate()
  }

  const stats = dashboardQuery.data

  return (
    <div className="space-y-5">
      <Panel title="App Branding">
        <form className="grid max-w-3xl gap-5" onSubmit={handleBrandingSubmit}>
          <label className="grid gap-2">
            <span className="font-mono text-sm text-text-muted">App Name</span>
            <input className="rounded-md border border-border bg-bg-elevated px-3 py-2 text-text-primary" value={appName} onChange={(event) => setAppName(event.target.value)} />
          </label>
          <label className="grid gap-2">
            <span className="font-mono text-sm text-text-muted">App Subtitle</span>
            <input className="rounded-md border border-border bg-bg-elevated px-3 py-2 text-text-primary" value={appSubtitle} onChange={(event) => setAppSubtitle(event.target.value)} />
          </label>
          <label className="grid gap-2">
            <span className="font-mono text-sm text-text-muted">System Name</span>
            <input className="rounded-md border border-border bg-bg-elevated px-3 py-2 text-text-primary" value={systemName} onChange={(event) => setSystemName(event.target.value)} />
          </label>
          <button className="w-fit rounded-md bg-primary px-4 py-2 font-mono text-sm font-semibold text-white hover:bg-violet-600 disabled:bg-bg-elevated disabled:text-text-dim" disabled={brandingMutation.isPending} type="submit">
            {brandingMutation.isPending ? 'Saving' : 'Save Branding'}
          </button>
        </form>
      </Panel>

      <Panel title="Profile">
        <form className="grid max-w-3xl gap-5" onSubmit={handleProfileSubmit}>
          <label className="grid gap-2">
            <span className="font-mono text-sm text-text-muted">Display Name</span>
            <input className="rounded-md border border-border bg-bg-elevated px-3 py-2 text-text-primary" value={displayName} onChange={(event) => setDisplayName(event.target.value)} />
          </label>
          <button className="w-fit rounded-md bg-primary px-4 py-2 font-mono text-sm font-semibold text-white hover:bg-violet-600 disabled:bg-bg-elevated disabled:text-text-dim" disabled={profileMutation.isPending} type="submit">
            {profileMutation.isPending ? 'Saving' : 'Save Profile'}
          </button>
        </form>
      </Panel>

      <Panel title="Stats">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Stat label="Total XP" value={stats?.profile.total_xp ?? 0} tone="text-primary" />
          <Stat label="Gold" value={stats?.profile.gold ?? 0} tone="text-gold" />
          <Stat label="Level" value={stats?.profile.level ?? 1} />
          <Stat label="Current Rank" value={stats?.current_rank.label ?? 'Unawakened'} />
        </div>
      </Panel>

      {toast ? (
        <div className={`fixed bottom-5 right-5 z-40 rounded-md border bg-bg-elevated px-4 py-3 font-mono text-sm shadow-2xl ${
          toast.kind === 'success' ? 'border-success/50 text-success' : 'border-danger/50 text-danger'
        }`}>
          {toast.message}
        </div>
      ) : null}
    </div>
  )
}

function Stat({ label, value, tone = 'text-text-primary' }: { label: string; value: string | number; tone?: string }) {
  return (
    <div className="rounded-md border border-border bg-bg-elevated p-4">
      <p className="font-mono text-xs uppercase tracking-normal text-text-muted">{label}</p>
      <p className={`mt-2 font-mono text-2xl font-bold ${tone}`}>{value}</p>
    </div>
  )
}
