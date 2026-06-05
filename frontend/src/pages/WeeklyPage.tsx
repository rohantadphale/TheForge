/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getWeeklySummary, saveWeeklySummary } from '../api/weekly'
import { Panel } from '../components/Panel'

const weeklyTargetXp = 500

function startOfWeek(date: Date) {
  const copy = new Date(date)
  const day = copy.getDay()
  const diff = day === 0 ? -6 : 1 - day
  copy.setDate(copy.getDate() + diff)
  copy.setHours(0, 0, 0, 0)
  return copy
}

function addDays(date: Date, days: number) {
  const copy = new Date(date)
  copy.setDate(copy.getDate() + days)
  return copy
}

function isoDate(date: Date) {
  return date.toISOString().slice(0, 10)
}

function displayDate(date: Date) {
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

export function WeeklyPage() {
  const queryClient = useQueryClient()
  const currentWeekStart = useMemo(() => startOfWeek(new Date()), [])
  const [weekStart, setWeekStart] = useState(() => isoDate(currentWeekStart))
  const [summaryDraft, setSummaryDraft] = useState('')
  const [saved, setSaved] = useState(false)

  const weeklyQuery = useQuery({
    queryKey: ['weekly', weekStart],
    queryFn: () => getWeeklySummary(weekStart),
  })

  const weekStartDate = useMemo(() => new Date(`${weekStart}T00:00:00`), [weekStart])
  const weekEndDate = useMemo(() => addDays(weekStartDate, 6), [weekStartDate])
  const isCurrentWeek = weekStart === isoDate(currentWeekStart)
  const xpProgress = Math.min(((weeklyQuery.data?.xp_gained ?? 0) / weeklyTargetXp) * 100, 100)

  useEffect(() => {
    setSummaryDraft(weeklyQuery.data?.summary ?? '')
  }, [weeklyQuery.data?.summary])

  const saveMutation = useMutation({
    mutationFn: () => saveWeeklySummary({ week_start: weekStart, summary: summaryDraft }),
    onSuccess: () => {
      setSaved(true)
      window.setTimeout(() => setSaved(false), 2000)
      queryClient.invalidateQueries({ queryKey: ['weekly', weekStart] })
    },
  })

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    saveMutation.mutate()
  }

  return (
    <div className="space-y-5">
      <Panel title="Weekly Summary">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-text-primary">
              {displayDate(weekStartDate)} - {displayDate(weekEndDate)}
            </h1>
            <p className="mt-2 text-sm text-text-muted">Weekly target: {weeklyTargetXp} XP</p>
          </div>
          <div className="flex gap-2">
            <button
              className="rounded-md border border-border px-3 py-2 font-mono text-sm text-text-primary hover:bg-bg-elevated"
              onClick={() => setWeekStart(isoDate(addDays(weekStartDate, -7)))}
            >
              Previous week
            </button>
            <button
              className="rounded-md border border-border px-3 py-2 font-mono text-sm text-text-primary hover:bg-bg-elevated disabled:cursor-not-allowed disabled:text-text-dim"
              disabled={isCurrentWeek}
              onClick={() => setWeekStart(isoDate(addDays(weekStartDate, 7)))}
            >
              Next week
            </button>
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <Stat label="XP earned" value={weeklyQuery.data?.xp_gained ?? 0} tone="text-primary" />
          <Stat label="Gold earned" value={weeklyQuery.data?.gold_gained ?? 0} tone="text-gold" />
          <Stat label="Quests completed" value={weeklyQuery.data?.quests_completed ?? 0} />
        </div>

        <div className="mt-5">
          <div className="h-3 overflow-hidden rounded-sm bg-bg-elevated">
            <div className="h-full bg-primary transition-[width] duration-500" style={{ width: `${xpProgress}%` }} />
          </div>
          <p className="mt-2 font-mono text-xs text-text-muted">
            {weeklyQuery.data?.xp_gained ?? 0} / {weeklyTargetXp} XP
          </p>
        </div>
      </Panel>

      <Panel title="Completions">
        {weeklyQuery.isLoading ? <p className="text-text-muted">Loading completions...</p> : null}
        {weeklyQuery.data?.completions.length === 0 ? (
          <p className="rounded-md border border-dashed border-border p-6 text-text-muted">No completions recorded this week.</p>
        ) : null}
        <div className="space-y-2">
          {weeklyQuery.data?.completions.map((completion) => (
            <div key={completion.id} className="grid gap-2 rounded-md border border-border bg-bg-elevated p-3 md:grid-cols-[1fr_auto_auto] md:items-center">
              <span className="font-semibold text-text-primary">{completion.quest_title}</span>
              <span className="font-mono text-sm text-text-muted">{completion.completed_date}</span>
              <span className="font-mono text-sm text-primary">{completion.xp_awarded} XP</span>
            </div>
          ))}
        </div>
      </Panel>

      <Panel title="Reflection">
        <form className="space-y-4" onSubmit={handleSubmit}>
          <textarea
            className="min-h-36 w-full rounded-md border border-border bg-bg-elevated px-3 py-2 text-text-primary outline-none focus:border-primary"
            placeholder="What did you learn this week?"
            value={summaryDraft}
            onChange={(event) => setSummaryDraft(event.target.value)}
          />
          <div className="flex items-center gap-3">
            <button
              className="rounded-md bg-primary px-4 py-2 font-mono text-sm font-semibold text-white hover:bg-violet-600 disabled:bg-bg-elevated disabled:text-text-dim"
              disabled={saveMutation.isPending}
              type="submit"
            >
              {saveMutation.isPending ? 'Saving' : 'Save Reflection'}
            </button>
            {saved ? <span className="font-mono text-sm text-success">Saved.</span> : null}
            {saveMutation.isError ? <span className="font-mono text-sm text-danger">Save failed.</span> : null}
          </div>
        </form>
      </Panel>
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
