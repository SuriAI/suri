interface InfoBannerProps {
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  variant?: "inline" | "floating";
}

export function InfoBanner({
  message,
  action,
  variant = "inline",
}: InfoBannerProps) {
  const baseStyles =
    "flex items-center justify-between text-xs font-medium transition-all duration-300";
  const variants = {
    inline:
      "px-6 py-2 bg-cyan-500/10 border-b border-cyan-500/20 text-cyan-200",
    floating:
      "absolute bottom-6 left-1/2 -translate-x-1/2 px-4 py-3 bg-gray-950/90 text-cyan-100 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.4),0_0_20px_rgba(34,211,238,0.1)] z-20 min-w-[320px] max-w-[90%] animate-in fade-in slide-in-from-bottom-4 duration-500",
  };

  return (
    <div className={`${baseStyles} ${variants[variant]}`}>
      <div className="flex items-center gap-3">
        <span className="leading-tight">{message}</span>
      </div>
      {action && (
        <button
          onClick={action.onClick}
          className="ml-4 px-3 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-200 text-[9px] font-medium transition-all border border-cyan-500/30 whitespace-nowrap active:scale-95 shadow-lg"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
