interface EmptyStateProps {
  title: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function EmptyState({ title, action, className = "" }: EmptyStateProps) {
  return (
    <div
      className={`flex flex-1 items-center justify-center min-h-0 h-full w-full ${className}`}
    >
      <div className="flex flex-col items-center justify-center space-y-3 text-center">
        <div className="text-white/50 text-xs font-medium tracking-tight">
          {title}
        </div>

        {action && (
          <button
            onClick={action.onClick}
            className="px-4 py-1.5 text-xs bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white/80 hover:text-white transition-colors flex items-center gap-2 active:scale-95 shadow-sm"
          >
            <i className="fa-solid fa-user-plus text-[10px]"></i>
            <span className="font-semibold">{action.label}</span>
          </button>
        )}
      </div>
    </div>
  );
}
