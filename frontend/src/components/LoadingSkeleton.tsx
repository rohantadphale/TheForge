export function LoadingSkeleton() {
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {Array.from({ length: 8 }).map((_, index) => (
        <div key={index} className="h-36 animate-pulse rounded-md border border-border bg-bg-surface" />
      ))}
    </div>
  )
}
