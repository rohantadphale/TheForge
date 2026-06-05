import { useEffect } from 'react'
import { useAppStore } from '../stores/useAppStore'

export function RankUpBanner() {
  const rankUpLabel = useAppStore((store) => store.rankUpLabel)
  const isRankUpLeaving = useAppStore((store) => store.isRankUpLeaving)
  const hideRankUp = useAppStore((store) => store.hideRankUp)
  const clearRankUp = useAppStore((store) => store.clearRankUp)

  useEffect(() => {
    if (!rankUpLabel) return undefined

    const hideTimer = window.setTimeout(() => hideRankUp(), 3000)
    const clearTimer = window.setTimeout(() => clearRankUp(), 3500)
    return () => {
      window.clearTimeout(hideTimer)
      window.clearTimeout(clearTimer)
    }
  }, [clearRankUp, hideRankUp, rankUpLabel])

  if (!rankUpLabel) return null

  return (
    <div
      className={[
        'fixed inset-x-0 top-0 z-50 bg-primary py-5 text-center font-mono text-2xl font-bold text-white shadow-2xl md:text-4xl',
        'transition-transform duration-500 ease-out',
        isRankUpLeaving ? '-translate-y-full' : 'translate-y-0',
      ].join(' ')}
    >
      RANK UP — {rankUpLabel}
    </div>
  )
}
