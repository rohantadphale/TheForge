import type { Quest } from '../api/types'
import { QuestCard } from './QuestCard'

type QuestListProps = {
  quests: Quest[]
  completedIds?: Set<number>
  completingId?: number | null
  onComplete?: (quest: Quest) => void
}

export function QuestList({ quests, completedIds = new Set(), completingId, onComplete }: QuestListProps) {
  if (quests.length === 0) {
    return <div className="rounded-md border border-dashed border-border p-6 text-sm text-text-muted">No quests for today. Add one.</div>
  }

  return (
    <div className="space-y-3">
      {quests.map((quest) => (
        <QuestCard
          key={quest.id}
          quest={quest}
          completed={completedIds.has(quest.id)}
          isCompleting={completingId === quest.id}
          onComplete={onComplete}
        />
      ))}
    </div>
  )
}
