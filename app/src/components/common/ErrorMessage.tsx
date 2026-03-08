interface ErrorMessageProps {
  message: string
  onClose?: () => void
  className?: string
}

export function ErrorMessage({ message, onClose, className = "" }: ErrorMessageProps) {
  return (
    <div
      className={`rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-2 text-[11px] font-semibold text-red-300 ${className}`}>
      <div className="flex items-center justify-between">
        <span>{message}</span>
        {onClose && (
          <button
            onClick={onClose}
            className="group text-red-200 transition-colors hover:text-red-100">
            <div className="relative h-3 w-3">
              <div className="absolute top-1/2 left-1/2 h-0.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rotate-45 bg-red-300/50 transition-all duration-200 group-hover:bg-red-300"></div>
              <div className="absolute top-1/2 left-1/2 h-0.5 w-2.5 -translate-x-1/2 -translate-y-1/2 -rotate-45 bg-red-300/50 transition-all duration-200 group-hover:bg-red-300"></div>
            </div>
          </button>
        )}
      </div>
    </div>
  )
}
