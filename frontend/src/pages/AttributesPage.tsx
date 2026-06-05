import { useQuery } from '@tanstack/react-query'
import { getAttributes } from '../api/attributes'
import { AttributeMilestoneGrid } from '../components/AttributeMilestoneGrid'
import { Panel } from '../components/Panel'

export function AttributesPage() {
  const query = useQuery({ queryKey: ['attributes'], queryFn: getAttributes })

  return (
    <Panel title="Attributes">
      {query.isLoading ? <p className="text-text-muted">Loading attributes...</p> : null}
      {query.data ? <AttributeMilestoneGrid attributes={query.data} /> : null}
    </Panel>
  )
}
