import type { Attribute } from '../api/types'

const domainOrder = ['Health', 'Mastery', 'Wealth', 'Happiness']

type AttributeMilestoneGridProps = {
  attributes: Attribute[]
}

function pointsToNextMilestone(score: number) {
  const remainder = score % 50
  return remainder === 0 ? 50 : 50 - remainder
}

function milestoneFill(score: number) {
  return Math.min(((score % 50) / 50) * 100, 100)
}

export function AttributeMilestoneGrid({ attributes }: AttributeMilestoneGridProps) {
  const grouped = domainOrder.map((domain) => ({
    domain,
    attributes: attributes
      .filter((attribute) => attribute.domain === domain)
      .sort((a, b) => a.name.localeCompare(b.name)),
  }))

  return (
    <div className="space-y-8">
      {grouped.map((group) =>
        group.attributes.length > 0 ? (
          <section key={group.domain}>
            <div className="mb-3 flex items-center gap-3">
              <h2 className="font-mono text-sm font-semibold uppercase tracking-normal text-text-muted">
                {group.domain}
              </h2>
              <div className="h-px flex-1 bg-border" />
            </div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {group.attributes.map((attribute) => {
                const toNext = pointsToNextMilestone(attribute.score)
                const fill = milestoneFill(attribute.score)
                return (
                  <article key={attribute.key} className="rounded-md border border-border bg-bg-elevated p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex min-w-0 items-center gap-4">
                        <span className="grid h-16 w-16 shrink-0 place-items-center rounded-md border border-border bg-bg-surface text-4xl">
                          {attribute.icon}
                        </span>
                        <div className="min-w-0">
                          <h3 className="truncate text-xl font-semibold text-text-primary">{attribute.name}</h3>
                          <span className="mt-2 inline-flex rounded border border-primary/40 bg-primary-dim/30 px-2 py-1 font-mono text-xs text-violet-100">
                            {attribute.domain}
                          </span>
                        </div>
                      </div>
                      <span className="font-mono text-4xl font-bold text-primary">{attribute.score}</span>
                    </div>
                    <div className="mt-5 h-3 overflow-hidden rounded-sm bg-bg-surface">
                      <div className="h-full bg-primary transition-[width] duration-500 ease-out" style={{ width: `${fill}%` }} />
                    </div>
                    <p className="mt-3 font-mono text-xs text-text-muted">
                      {toNext} points to next milestone
                    </p>
                  </article>
                )
              })}
            </div>
          </section>
        ) : null,
      )}
    </div>
  )
}
