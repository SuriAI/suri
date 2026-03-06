import type { CooldownInfo } from "@/components/main/types";
import { AnimatePresence, motion } from "framer-motion";
import { useState, useEffect } from "react";

interface CooldownOverlayProps {
  persistentCooldowns: Map<string, CooldownInfo>;
  attendanceCooldownSeconds: number;
}

export function CooldownOverlay({ persistentCooldowns }: CooldownOverlayProps) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (persistentCooldowns.size === 0) return;
    // Re-render every 50ms for perfectly smooth unmount sync with Framer Motion progress bar!
    const interval = setInterval(() => setNow(Date.now()), 50);
    return () => clearInterval(interval);
  }, [persistentCooldowns.size]);

  const activeCooldowns = Array.from(persistentCooldowns.entries())
    .filter(([, info]) => {
      return now - info.startTime < info.cooldownDurationSeconds * 1000;
    })
    .sort((a, b) => b[1].startTime - a[1].startTime)
    .slice(0, 3); // Only show top 3 recent ones

  return (
    <div className="absolute top-6 left-6 z-100 flex flex-col gap-2 pointer-events-none">
      <AnimatePresence mode="popLayout">
        {activeCooldowns.map(([personId, info]) => (
          <motion.div
            layout
            key={`${personId}-${info.startTime}`}
            initial={{ opacity: 0, x: -20, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
            transition={{
              duration: 0.3,
              ease: "easeOut",
              layout: { duration: 0.2 },
            }}
            className="group relative"
          >
            {/* Main Card */}
            <div className="relative flex items-center gap-3 bg-[#0a0a0b]/90  border border-white/10 rounded-xl p-3 shadow-2xl min-w-50 overflow-hidden">
              {/* Smaller Avatar */}
              <div className="shrink-0 w-7 h-7 rounded-full bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20">
                <i className="fa-solid fa-check text-cyan-400 text-xs"></i>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 flex flex-col justify-center pr-1">
                <div className="flex items-center justify-between gap-3">
                  <h4 className="text-white text-[13px] font-bold truncate leading-tight">
                    {info.memberName || "Authorized Personnel"}
                  </h4>
                  <span className="text-[9px] font-bold text-cyan-400 uppercase tracking-wider bg-cyan-500/10 px-1.5 py-0.5 rounded-md border border-cyan-500/20">
                    Logged
                  </span>
                </div>
              </div>
            </div>

            {/* Subtle Aura */}
            <div className="absolute -inset-0.5 bg-cyan-500/10 blur-xl opacity-0 group-hover:opacity-100 transition-opacity rounded-xl" />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
