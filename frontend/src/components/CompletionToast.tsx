import type { CompletionResponse } from '../api/types'

type CompletionToastProps = {
  completion: CompletionResponse | null
}

export function CompletionToast({ completion }: CompletionToastProps) {
  if (!completion) return null

  return (
    <div className="fixed bottom-5 right-5 z-40 w-[min(360px,calc(100vw-2rem))] rounded-md border border-primary/50 bg-bg-elevated p-4 shadow-2xl">
      <p className="font-mono text-sm font-semibold text-primary">Quest complete</p>
      <p className="mt-2 text-sm text-text-primary">
        +{completion.completion.xp_awarded} XP · +{completion.completion.gold_awarded} Gold
      </p>
      {completion.rank_changed ? (
        <p className="mt-2 rounded border border-gold/40 bg-gold-dim/30 px-3 py-2 font-mono text-xs text-gold">
          Rank up: {completion.new_rank.label}
        </p>
      ) : null}
    </div>
  )
}
