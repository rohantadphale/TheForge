import type { Rank } from '../api/types'

type RankBadgeProps = {
  currentRank: Rank
  nextRank: Rank | null
  totalXp: number
  level: number
}

export function RankBadge({ currentRank, nextRank, totalXp, level }: RankBadgeProps) {
  const range = nextRank ? nextRank.min_xp - currentRank.min_xp : 1
  const gained = totalXp - currentRank.min_xp
  const progress = nextRank ? Math.min(Math.max((gained / range) * 100, 0), 100) : 100

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <span className="rounded border border-primary/60 bg-primary-dim/50 px-3 py-1 font-mono text-sm text-violet-100">
          {currentRank.label}
        </span>
        <span
          key={level}
          className="animate-[levelPulse_420ms_ease-out] font-mono text-3xl font-bold text-text-primary"
        >
          Lv. {level}
        </span>
      </div>
      <div>
        <div className="h-3 overflow-hidden rounded-sm bg-bg-elevated">
          <div className="h-full bg-primary transition-[width] duration-700 ease-out" style={{ width: `${progress}%` }} />
        </div>
        <div className="mt-2 flex justify-between font-mono text-xs text-text-muted">
          <span>{totalXp} XP</span>
          <span>{nextRank ? `${nextRank.min_xp} XP` : 'MAX RANK'}</span>
        </div>
      </div>
    </div>
  )
}
