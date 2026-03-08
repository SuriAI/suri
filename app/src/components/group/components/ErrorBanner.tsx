interface ErrorBannerProps {
  error: string
  onDismiss: () => void
}

export function ErrorBanner({ error, onDismiss }: ErrorBannerProps) {
  return (
    <div className="flex items-center justify-between border-b border-red-500/40 bg-red-600/20 px-6 py-2 text-sm text-red-200">
      <span>{error}</span>
      <button
        onClick={onDismiss}
        className="group text-red-200 transition-colors hover:text-red-100"
        aria-label="Dismiss error">
        <div className="relative h-3 w-3">
          <div className="absolute top-1/2 left-1/2 h-0.5 w-2 -translate-x-1/2 -translate-y-1/2 rotate-45 bg-red-200 transition-all duration-200 group-hover:bg-red-100"></div>
          <div className="absolute top-1/2 left-1/2 h-0.5 w-2 -translate-x-1/2 -translate-y-1/2 -rotate-45 bg-red-200 transition-all duration-200 group-hover:bg-red-100"></div>
        </div>
      </button>
    </div>
  )
}
