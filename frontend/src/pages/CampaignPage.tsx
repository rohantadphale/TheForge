import { useQuery } from '@tanstack/react-query'
import { getDashboard } from '../api/dashboard'
import { Panel } from '../components/Panel'

export function CampaignPage() {
  const query = useQuery({ queryKey: ['dashboard'], queryFn: getDashboard })
  const campaign = query.data?.active_campaign

  return (
    <Panel title="Active Campaign">
      {query.isLoading ? <p className="text-text-muted">Loading campaign...</p> : null}
      {campaign ? (
        <div className="space-y-3">
          <p className="font-mono text-xs uppercase tracking-normal text-primary">{campaign.domain}</p>
          <h1 className="text-3xl font-bold text-text-primary">{campaign.name}</h1>
          <p className="max-w-3xl leading-7 text-text-muted">{campaign.description}</p>
        </div>
      ) : (
        <p className="text-text-muted">No active campaign.</p>
      )}
    </Panel>
  )
}
