import type { ReactNode } from 'react'

type PanelProps = {
  title?: string
  action?: ReactNode
  children: ReactNode
  className?: string
}

export function Panel({ title, action, children, className = '' }: PanelProps) {
  return (
    <section className={`rounded-md border border-border bg-bg-surface p-5 ${className}`}>
      {(title || action) && (
        <div className="mb-4 flex items-center justify-between gap-4">
          {title ? <h2 className="font-mono text-sm font-semibold uppercase tracking-normal text-text-muted">{title}</h2> : null}
          {action}
        </div>
      )}
      {children}
    </section>
  )
}
