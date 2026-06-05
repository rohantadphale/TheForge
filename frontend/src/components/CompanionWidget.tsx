import type { Companion } from '../api/types'
import { useAppStore } from '../stores/useAppStore'

type CompanionWidgetProps = {
  companion: Companion | null
}

const stateCopy = {
  idle: 'Awaiting orders.',
  studying: 'Scanning the next objective.',
  celebrating: 'Progress confirmed.',
  briefing: 'Preparing the daily briefing.',
}

export function CompanionWidget({ companion }: CompanionWidgetProps) {
  const state = useAppStore((store) => store.companionState)

  return (
    <div className="flex items-center gap-4">
      <div className="grid h-16 w-16 shrink-0 place-items-center rounded-md border border-primary/40 bg-primary-dim/30 font-mono text-2xl text-primary">
        {companion?.name?.slice(0, 1) ?? 'A'}
      </div>
      <div className="min-w-0">
        <h3 className="font-semibold text-text-primary">{companion?.name ?? 'Axiom'}</h3>
        <p className="font-mono text-xs text-text-muted">{companion?.role ?? 'System Guide'} · {state}</p>
        <p className="mt-2 text-sm text-text-muted">{stateCopy[state]}</p>
      </div>
    </div>
  )
}
