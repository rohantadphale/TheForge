import type { Attribute } from '../api/types'

type AttributeGridProps = {
  attributes: Attribute[]
}

export function AttributeGrid({ attributes }: AttributeGridProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {attributes.map((attribute) => {
        const width = Math.min(attribute.score, 100)
        return (
          <article key={attribute.key} className="rounded-md border border-border bg-bg-elevated p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded border border-border bg-bg-surface text-lg">
                  {attribute.icon}
                </span>
                <div className="min-w-0">
                  <h3 className="truncate font-semibold text-text-primary">{attribute.name}</h3>
                  <p className="font-mono text-xs text-text-muted">{attribute.domain}</p>
                </div>
              </div>
              <span className="font-mono text-lg font-bold text-primary">{attribute.score}</span>
            </div>
            <div className="mt-4 h-2 overflow-hidden rounded-sm bg-bg-surface">
              <div className="h-full bg-primary" style={{ width: `${width}%` }} />
            </div>
          </article>
        )
      })}
    </div>
  )
}
