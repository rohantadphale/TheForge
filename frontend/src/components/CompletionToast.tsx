import { useEffect } from 'react'
import { useAppStore, type CompletionToastItem } from '../stores/useAppStore'

type CompletionToastProps = {
  toast: CompletionToastItem
}

export function CompletionToast({ toast }: CompletionToastProps) {
  const dismissCompletionToast = useAppStore((store) => store.dismissCompletionToast)
  const removeCompletionToast = useAppStore((store) => store.removeCompletionToast)

  useEffect(() => {
    const dismissTimer = window.setTimeout(() => dismissCompletionToast(toast.id), 3600)
    const removeTimer = window.setTimeout(() => removeCompletionToast(toast.id), 4200)
    return () => {
      window.clearTimeout(dismissTimer)
      window.clearTimeout(removeTimer)
    }
  }, [dismissCompletionToast, removeCompletionToast, toast.id])

  const completion = toast.completion
  return (
    <div
      className={[
        'w-[min(380px,calc(100vw-2rem))] rounded-md border border-primary/50 bg-bg-elevated p-4 shadow-2xl',
        'transition-all duration-300 ease-out',
        toast.isLeaving ? 'translate-y-3 opacity-0' : 'translate-y-0 opacity-100',
      ].join(' ')}
    >
      <p className="font-mono text-xs font-semibold uppercase tracking-normal text-primary">Quest complete</p>
      <h3 className="mt-1 font-semibold text-text-primary">{toast.questTitle}</h3>
      <div className="mt-3 flex flex-wrap gap-3 font-mono text-sm">
        <span className="text-primary">+{completion.completion.xp_awarded} XP</span>
        <span className="text-gold">+{completion.completion.gold_awarded} Gold</span>
      </div>
      {completion.attribute_changes.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {completion.attribute_changes.map((change) => (
            <span key={change.key} className="rounded border border-border bg-bg-surface px-2 py-1 font-mono text-xs text-text-muted">
              {change.name} +{change.points_gained}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  )
}

export function CompletionToastViewport() {
  const toasts = useAppStore((store) => store.completionToasts)

  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-5 right-5 z-40 flex flex-col-reverse gap-3">
      {toasts.map((toast) => (
        <CompletionToast key={toast.id} toast={toast} />
      ))}
    </div>
  )
}
