/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getSettings, updateSettings } from '../api/settings'
import { updateProfile } from '../api/profile'
import { Panel } from '../components/Panel'
import { useAppStore } from '../stores/useAppStore'

export function SettingsPage() {
  const queryClient = useQueryClient()
  const profile = useAppStore((store) => store.profile)
  const setSettings = useAppStore((store) => store.setSettings)
  const setProfile = useAppStore((store) => store.setProfile)
  const settingsQuery = useQuery({ queryKey: ['settings'], queryFn: getSettings })

  const [appName, setAppName] = useState('')
  const [appSubtitle, setAppSubtitle] = useState('')
  const [systemName, setSystemName] = useState('')
  const [displayName, setDisplayName] = useState('')

  useEffect(() => {
    if (settingsQuery.data) {
      setSettings(settingsQuery.data)
      setAppName(settingsQuery.data.app_name)
      setAppSubtitle(settingsQuery.data.app_subtitle)
      setSystemName(settingsQuery.data.system_name)
    }
  }, [setSettings, settingsQuery.data])

  useEffect(() => {
    if (profile) setDisplayName(profile.display_name)
  }, [profile])

  const mutation = useMutation({
    mutationFn: async () => {
      const [settingsResult, profileResult] = await Promise.all([
        updateSettings({ app_name: appName, app_subtitle: appSubtitle, system_name: systemName }),
        displayName ? updateProfile({ display_name: displayName }) : Promise.resolve(profile),
      ])
      return { settingsResult, profileResult }
    },
    onSuccess: ({ settingsResult, profileResult }) => {
      setSettings(settingsResult)
      if (profileResult) setProfile(profileResult)
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['settings'] })
    },
  })

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    mutation.mutate()
  }

  return (
    <Panel title="Settings">
      <form className="grid max-w-3xl gap-5" onSubmit={handleSubmit}>
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
        <label className="grid gap-2">
          <span className="font-mono text-sm text-text-muted">Display Name</span>
          <input className="rounded-md border border-border bg-bg-elevated px-3 py-2 text-text-primary" value={displayName} onChange={(event) => setDisplayName(event.target.value)} />
        </label>
        {mutation.isSuccess ? <p className="text-success">Settings saved.</p> : null}
        {mutation.isError ? <p className="text-danger">Settings could not be saved.</p> : null}
        <button className="w-fit rounded-md bg-primary px-4 py-2 font-mono text-sm font-semibold text-white hover:bg-violet-600 disabled:bg-bg-elevated disabled:text-text-dim" disabled={mutation.isPending} type="submit">
          {mutation.isPending ? 'Saving' : 'Save Settings'}
        </button>
      </form>
    </Panel>
  )
}
