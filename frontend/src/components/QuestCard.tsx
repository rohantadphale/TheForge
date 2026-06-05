import { Link } from 'react-router-dom'
import type { Quest } from '../api/types'

const typeStyles: Record<string, string> = {
  daily: 'border-primary/50 bg-primary-dim/40 text-violet-100',
  weekly: 'border-gold/50 bg-gold-dim/40 text-amber-100',
  campaign: 'border-success/50 bg-emerald-950/40 text-emerald-100',
  trial: 'border-danger/50 bg-red-950/40 text-red-100',
  reflection: 'border-sky-500/50 bg-sky-950/40 text-sky-100',
  recovery: 'border-slate-500/50 bg-slate-900/60 text-slate-100',
}

type QuestCardProps = {
  quest: Quest
  mode?: 'complete' | 'manage'
  completed?: boolean
  isCompleting?: boolean
  onComplete?: (quest: Quest) => void
  onDelete?: (quest: Quest) => void
}

export function QuestCard({
  quest,
  mode = 'complete',
  completed = false,
  isCompleting = false,
  onComplete,
  onDelete,
}: QuestCardProps) {
  return (
    <article className="rounded-md border border-border bg-bg-elevated p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <h3 className="text-base font-semibold text-text-primary">{quest.title}</h3>
            <span className={`rounded border px-2 py-0.5 font-mono text-xs ${typeStyles[quest.quest_type]}`}>
              {quest.quest_type}
            </span>
          </div>
          {quest.description ? <p className="text-sm leading-6 text-text-muted">{quest.description}</p> : null}
          <div className="mt-3 flex flex-wrap gap-3 font-mono text-xs">
            <span className="text-primary">{quest.xp_reward} XP</span>
            <span className="text-gold">{quest.gold_reward} Gold</span>
            <span className="text-text-muted">{quest.recurrence}</span>
          </div>
        </div>
        {mode === 'complete' ? (
          <button
            className="h-10 rounded-md bg-primary px-4 font-mono text-sm font-semibold text-white transition hover:bg-violet-600 disabled:cursor-not-allowed disabled:bg-bg-surface disabled:text-text-dim"
            disabled={completed || isCompleting}
            onClick={() => onComplete?.(quest)}
          >
            {completed ? 'Complete' : isCompleting ? 'Saving' : 'Complete'}
          </button>
        ) : (
          <div className="flex shrink-0 gap-2">
            <Link
              className="rounded-md border border-border px-3 py-2 font-mono text-sm text-text-primary hover:bg-bg-surface"
              to={`/quests/${quest.id}/edit`}
            >
              Edit
            </Link>
            <button
              className="rounded-md border border-danger/50 px-3 py-2 font-mono text-sm text-red-200 hover:bg-red-950/40"
              onClick={() => onDelete?.(quest)}
            >
              Delete
            </button>
          </div>
        )}
      </div>
    </article>
  )
}
