import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { deleteQuest, getQuests } from '../api/quests'
import type { Quest, QuestType } from '../api/types'
import { Panel } from '../components/Panel'
import { QuestCard } from '../components/QuestCard'

const tabs: Array<{ label: string; type: QuestType | 'all' }> = [
  { label: 'All', type: 'all' },
  { label: 'Daily', type: 'daily' },
  { label: 'Weekly', type: 'weekly' },
  { label: 'Campaign', type: 'campaign' },
  { label: 'Trial', type: 'trial' },
]

export function QuestListPage() {
  const queryClient = useQueryClient()
  const [activeType, setActiveType] = useState<QuestType | 'all'>('all')

  const questsQuery = useQuery({
    queryKey: ['quests', 'list'],
    queryFn: () => getQuests({ archived: 0 }),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteQuest,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['quests'] }),
  })

  const filteredQuests = useMemo(() => {
    const quests = questsQuery.data ?? []
    return activeType === 'all' ? quests : quests.filter((quest) => quest.quest_type === activeType)
  }, [activeType, questsQuery.data])

  const handleDelete = (quest: Quest) => {
    if (window.confirm(`Delete "${quest.title}"?`)) {
      deleteMutation.mutate(quest.id)
    }
  }

  return (
    <div className="space-y-5">
      <Panel
        title="Quest Log"
        action={
          <Link className="rounded-md bg-primary px-4 py-2 font-mono text-sm font-semibold text-white hover:bg-violet-600" to="/quests/new">
            New Quest
          </Link>
        }
      >
        <div className="mb-5 flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.type}
              className={`rounded-md border px-3 py-2 font-mono text-sm ${
                activeType === tab.type
                  ? 'border-primary bg-primary text-white'
                  : 'border-border bg-bg-elevated text-text-muted hover:text-text-primary'
              }`}
              onClick={() => setActiveType(tab.type)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {questsQuery.isLoading ? <p className="text-text-muted">Loading quests...</p> : null}
        {questsQuery.isError ? <p className="text-danger">Could not load quests.</p> : null}
        {!questsQuery.isLoading && filteredQuests.length === 0 ? (
          <p className="rounded-md border border-dashed border-border p-6 text-text-muted">No quests match this filter.</p>
        ) : null}
        <div className="space-y-3">
          {filteredQuests.map((quest) => (
            <QuestCard key={quest.id} quest={quest} mode="manage" onDelete={handleDelete} />
          ))}
        </div>
      </Panel>
    </div>
  )
}
