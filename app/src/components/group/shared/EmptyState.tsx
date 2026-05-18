interface EmptyStateProps {
  title: string
  action?: {
    label: string
    onClick: () => void
    iconClass?: string
  }
  className?: string
}

export function EmptyState({ title, action, className = "" }: EmptyStateProps) {
  return (
    <div
      className={`flex h-full min-h-0 w-full flex-1 items-center justify-center p-8 ${className}`}>
      <div className="flex flex-col items-center justify-center space-y-4 text-center">
        <div className="text-white/20">
          <i className="fa-solid fa-users text-3xl" />
        </div>

        <div className="space-y-1">
          <div className="text-[13px] font-bold text-white/70">{title}</div>
        </div>

        {action && (
          <button
            onClick={action.onClick}
            className="flex items-center gap-2 rounded border border-white/10 bg-white/[0.02] px-4 py-1.5 text-[10px] font-bold tracking-tight text-white/70 transition-all duration-200 hover:border-white/25 hover:bg-white/5 active:scale-[0.97]">
            <i className={action.iconClass || "fa-solid fa-plus text-[8px]"} />
            <span>{action.label}</span>
          </button>
        )}
      </div>
    </div>
  )
}
