const messages = [
  'The System says: small quests compound into rank shifts.',
  'The System says: finish the visible objective before hunting new ones.',
  'The System says: proof beats intent.',
  'The System says: your future rank is negotiated today.',
  'The System says: consistency is a weapon.',
]

function dayOfYear() {
  const now = new Date()
  const start = new Date(now.getFullYear(), 0, 0)
  return Math.floor((Number(now) - Number(start)) / 86_400_000)
}

export function DailyBriefing() {
  const message = messages[dayOfYear() % messages.length]

  return (
    <div>
      <p className="font-mono text-xs uppercase tracking-normal text-primary">Daily Briefing</p>
      <p className="mt-3 text-sm leading-6 text-text-primary">{message}</p>
    </div>
  )
}
