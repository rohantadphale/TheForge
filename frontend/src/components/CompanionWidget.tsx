import type { Companion } from '../api/types'
import type { CompanionState } from '../api/types'
import { companionMessageFor } from './companionMessages'
import { useEffect, useState } from 'react'

type CompanionWidgetProps = {
  companion: Companion | null
  companionState: CompanionState
}

function currentMinuteBucket() {
  return Math.floor(Date.now() / 60000)
}

export function CompanionWidget({ companion, companionState }: CompanionWidgetProps) {
  const [minuteBucket, setMinuteBucket] = useState(() => currentMinuteBucket())
  const message = companionMessageFor(companionState, minuteBucket)

  useEffect(() => {
    const interval = window.setInterval(() => setMinuteBucket(currentMinuteBucket()), 10_000)
    return () => window.clearInterval(interval)
  }, [])

  return (
    <div className="flex h-[200px] w-[160px] flex-col items-center justify-between rounded-md border border-primary/60 bg-bg-surface p-3 shadow-[0_0_24px_rgba(124,58,237,0.18)]">
      <div className={`companion-construct companion--${companionState}`} aria-label="Axiom companion construct">
        <svg viewBox="0 0 120 120" className="h-24 w-24" role="img">
          <defs>
            <radialGradient id="axiom-core" cx="50%" cy="40%" r="60%">
              <stop offset="0%" stopColor="var(--bg-elevated)" />
              <stop offset="100%" stopColor="var(--bg-base)" />
            </radialGradient>
          </defs>
          <path
            d="M39 66h42l8 34H31l8-34Z"
            fill="var(--bg-elevated)"
            stroke="var(--primary)"
            strokeWidth="3"
            strokeLinejoin="round"
          />
          <circle
            cx="60"
            cy="42"
            r="30"
            fill="url(#axiom-core)"
            stroke="var(--primary)"
            strokeWidth="3"
          />
          <path d="M45 42h10M65 42h10" stroke="var(--text-primary)" strokeWidth="4" strokeLinecap="round" />
          <path d="M49 57h22" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" opacity="0.65" />
          <path d="M32 92h56" stroke="var(--primary)" strokeWidth="2" opacity="0.5" />
        </svg>
      </div>
      <div className="w-full rounded border border-border bg-bg-elevated p-2">
        <p className="line-clamp-2 min-h-10 text-center text-xs leading-5 text-text-primary">{message}</p>
      </div>
      <div className="text-center">
        <h3 className="font-mono text-sm font-semibold text-text-primary">{companion?.name ?? 'Axiom'}</h3>
        <p className="font-mono text-[11px] uppercase tracking-normal text-text-muted">
          {companion?.role ?? 'System Guide'} · {companionState}
        </p>
      </div>
    </div>
  )
}
