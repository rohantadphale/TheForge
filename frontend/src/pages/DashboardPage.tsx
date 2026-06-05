import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getDashboard } from '../api/dashboard'
import { completeQuest } from '../api/quests'
import type { Quest } from '../api/types'
import { AttributeGrid } from '../components/AttributeGrid'
import { CompanionWidget } from '../components/CompanionWidget'
import { CurrencyBar } from '../components/CurrencyBar'
import { DailyBriefing } from '../components/DailyBriefing'
import { LoadingSkeleton } from '../components/LoadingSkeleton'
import { Panel } from '../components/Panel'
import { QuestList } from '../components/QuestList'
import { RankBadge } from '../components/RankBadge'
import { useAppStore } from '../stores/useAppStore'

const completionKey = () => `completed:${new Date().toISOString().slice(0, 10)}`

function readCompletedIds() {
  try {
    return new Set<number>(JSON.parse(localStorage.getItem(completionKey()) ?? '[]'))
  } catch {
    return new Set<number>()
  }
}

function writeCompletedIds(ids: Set<number>) {
  localStorage.setItem(completionKey(), JSON.stringify([...ids]))
}

export function DashboardPage() {
  const queryClient = useQueryClient()
  const setSettings = useAppStore((store) => store.setSettings)
  const setProfile = useAppStore((store) => store.setProfile)
  const setCompanionState = useAppStore((store) => store.setCompanionState)
  const enqueueCompletionToast = useAppStore((store) => store.enqueueCompletionToast)
  const showRankUp = useAppStore((store) => store.showRankUp)
  const [completedIds, setCompletedIds] = useState<Set<number>>(() => readCompletedIds())

  const dashboardQuery = useQuery({
    queryKey: ['dashboard'],
    queryFn: getDashboard,
  })

  useEffect(() => {
    if (dashboardQuery.data) {
      setSettings(dashboardQuery.data.settings)
      setProfile(dashboardQuery.data.profile)
    }
  }, [dashboardQuery.data, setProfile, setSettings])

  const completeMutation = useMutation({
    mutationFn: (quest: Quest) => completeQuest(quest.id, new Date().toISOString().slice(0, 10)),
    onSuccess: (result, quest) => {
      const next = new Set(completedIds)
      next.add(quest.id)
      setCompletedIds(next)
      writeCompletedIds(next)
      enqueueCompletionToast(quest, result)
      if (result.rank_changed) showRankUp(result.new_rank.label)
      setCompanionState('celebrating')
      console.info('Companion state changed to celebrating')
      window.setTimeout(() => {
        setCompanionState('idle')
        console.info('Companion state changed to idle')
      }, 3000)
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['quests'] })
    },
  })

  const sortedQuests = useMemo(
    () => [...(dashboardQuery.data?.today_quests ?? [])].sort((a, b) => a.id - b.id),
    [dashboardQuery.data?.today_quests],
  )

  if (dashboardQuery.isLoading) return <LoadingSkeleton />

  if (dashboardQuery.isError || !dashboardQuery.data) {
    return <Panel><p className="text-danger">Dashboard data could not be loaded.</p></Panel>
  }

  const data = dashboardQuery.data

  return (
    <div className="space-y-5">
      <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <Panel className="min-h-44">
          <p className="font-mono text-xs uppercase tracking-normal text-primary">{data.settings.system_name}</p>
          <h1 className="mt-3 text-4xl font-bold text-text-primary">{data.settings.app_name}</h1>
          <p className="mt-2 max-w-2xl text-text-muted">{data.settings.app_subtitle}</p>
        </Panel>
        <Panel title="Rank + Level">
          <RankBadge
            currentRank={data.current_rank}
            nextRank={data.next_rank}
            totalXp={data.profile.total_xp}
            level={data.profile.level}
          />
        </Panel>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1fr_2fr]">
        <Panel title="Currency">
          <CurrencyBar totalXp={data.profile.total_xp} gold={data.profile.gold} />
        </Panel>
        <Panel title="Today's Quests">
          <QuestList
            quests={sortedQuests}
            completedIds={completedIds}
            completingId={completeMutation.variables?.id ?? null}
            onComplete={(quest) => completeMutation.mutate(quest)}
          />
        </Panel>
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        <Panel title="Active Campaign">
          {data.active_campaign ? (
            <div>
              <h3 className="text-xl font-semibold text-text-primary">{data.active_campaign.name}</h3>
              <p className="mt-2 text-sm leading-6 text-text-muted">{data.active_campaign.description}</p>
            </div>
          ) : (
            <p className="text-text-muted">No active campaign.</p>
          )}
        </Panel>
        <Panel title="Companion">
          <CompanionWidget companion={data.companion} />
        </Panel>
        <Panel>
          <DailyBriefing />
        </Panel>
      </div>

      <Panel title="Attributes">
        <AttributeGrid attributes={data.attributes} />
      </Panel>
    </div>
  )
}
