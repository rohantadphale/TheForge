import { useQuery } from '@tanstack/react-query'
import { getWeeklyReviews } from '../api/weekly'
import { Panel } from '../components/Panel'

export function WeeklyPage() {
  const query = useQuery({ queryKey: ['weekly'], queryFn: getWeeklyReviews })

  return (
    <Panel title="Weekly Reviews">
      {query.isLoading ? <p className="text-text-muted">Loading weekly reviews...</p> : null}
      {query.data?.length === 0 ? <p className="text-text-muted">No weekly reviews recorded yet.</p> : null}
      <div className="space-y-3">
        {query.data?.map((review) => (
          <article key={review.id} className="rounded-md border border-border bg-bg-elevated p-4">
            <div className="flex flex-wrap justify-between gap-3">
              <h3 className="font-mono text-text-primary">Week of {review.week_start}</h3>
              <p className="font-mono text-sm text-primary">{review.xp_gained} XP · <span className="text-gold">{review.gold_gained} Gold</span></p>
            </div>
            <p className="mt-2 text-sm text-text-muted">{review.summary ?? 'No summary.'}</p>
            <p className="mt-3 font-mono text-xs text-text-muted">{review.quests_completed} quests completed</p>
          </article>
        ))}
      </div>
    </Panel>
  )
}
