type CurrencyBarProps = {
  totalXp: number
  gold: number
}

export function CurrencyBar({ totalXp, gold }: CurrencyBarProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="rounded-md border border-primary/30 bg-primary-dim/20 p-4 font-mono text-primary">
        <span className="text-text-muted">XP</span>
        <p className="mt-1 text-2xl font-bold">{totalXp}</p>
      </div>
      <div className="rounded-md border border-gold/30 bg-gold-dim/20 p-4 font-mono text-gold">
        <span className="text-text-muted">Gold</span>
        <p className="mt-1 text-2xl font-bold">{gold}</p>
      </div>
    </div>
  )
}
