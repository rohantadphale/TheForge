import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getCampaign, getCampaigns } from '../api/campaigns'
import { getWeeklySummary } from '../api/weekly'
import { Panel } from '../components/Panel'

function currentWeekStart() {
  const date = new Date()
  const day = date.getDay()
  const diff = day === 0 ? -6 : 1 - day
  date.setDate(date.getDate() + diff)
  date.setHours(0, 0, 0, 0)
  return date.toISOString().slice(0, 10)
}

export function CampaignPage() {
  const campaignsQuery = useQuery({ queryKey: ['campaigns'], queryFn: getCampaigns })
  const activeCampaign = campaignsQuery.data?.find((campaign) => campaign.is_active === 1) ?? campaignsQuery.data?.[0]
  const campaignQuery = useQuery({
    queryKey: ['campaigns', activeCampaign?.id],
    queryFn: () => getCampaign(activeCampaign?.id as number),
    enabled: Boolean(activeCampaign?.id),
  })
  const weeklyQuery = useQuery({
    queryKey: ['weekly', currentWeekStart()],
    queryFn: () => getWeeklySummary(currentWeekStart()),
  })

  const campaign = campaignQuery.data
  const campaignQuestIds = new Set((campaign?.quests ?? []).map((quest) => quest.id))
  const completedThisWeek =
    weeklyQuery.data?.completions.filter((completion) => campaignQuestIds.has(completion.quest_id)).length ?? 0

  return (
    <div className="space-y-5">
      <Panel
        title="Active Campaign"
        action={
          campaign ? (
            <Link
              className="rounded-md bg-primary px-4 py-2 font-mono text-sm font-semibold text-white hover:bg-violet-600"
              to={`/quests/new?campaign_id=${campaign.id}`}
            >
              Add quest to campaign
            </Link>
          ) : null
        }
      >
        {campaignsQuery.isLoading || campaignQuery.isLoading ? <p className="text-text-muted">Loading campaign...</p> : null}
        {campaign ? (
          <div className="space-y-4">
            <span className="inline-flex rounded border border-primary/40 bg-primary-dim/30 px-2 py-1 font-mono text-xs text-violet-100">
              {campaign.domain}
            </span>
            <h1 className="text-3xl font-bold text-text-primary">{campaign.name}</h1>
            <p className="max-w-3xl leading-7 text-text-muted">{campaign.description}</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <Stat label="Total quests" value={campaign.quests.length} />
              <Stat label="Completed this week" value={completedThisWeek} tone="text-success" />
            </div>
          </div>
        ) : (
          <p className="text-text-muted">No active campaign.</p>
        )}
      </Panel>

      <Panel title="Campaign Quests">
        {campaign?.quests.length === 0 ? <p className="text-text-muted">No quests in this campaign yet.</p> : null}
        <div className="space-y-2">
          {campaign?.quests.map((quest) => (
            <div key={quest.id} className="grid gap-2 rounded-md border border-border bg-bg-elevated p-3 md:grid-cols-[1fr_auto_auto_auto] md:items-center">
              <span className="font-semibold text-text-primary">{quest.title}</span>
              <span className="rounded border border-primary/40 bg-primary-dim/30 px-2 py-1 font-mono text-xs text-violet-100">
                {quest.quest_type}
              </span>
              <span className="font-mono text-sm text-text-muted">{quest.recurrence}</span>
              <span className="font-mono text-sm text-primary">{quest.xp_reward} XP</span>
            </div>
          ))}
        </div>
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
