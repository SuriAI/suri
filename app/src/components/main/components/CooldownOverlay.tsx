import type { CooldownInfo } from "@/components/main/types";
import { AnimatePresence, motion } from "framer-motion";

interface CooldownOverlayProps {
  persistentCooldowns: Map<string, CooldownInfo>;
  attendanceCooldownSeconds: number;
}

export function CooldownOverlay({ persistentCooldowns }: CooldownOverlayProps) {
  const sortedCooldowns = Array.from(persistentCooldowns.entries())
    .sort((a, b) => b[1].startTime - a[1].startTime)
    .slice(0, 3); // Only show top 3 recent ones

  if (sortedCooldowns.length === 0) return null;

  return (
    <div className="fixed top-24 right-6 z-100 flex flex-col gap-3 pointer-events-none">
      <AnimatePresence mode="popLayout">
        {sortedCooldowns.map(([personId, info]) => (
          <motion.div
            key={`${personId}-${info.startTime}`}
            initial={{ opacity: 0, x: 50, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
            className="group relative"
          >
            {/* Main Card */}
            <div className="relative flex items-center gap-4 bg-[#0a0a0b]/90 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-2xl min-w-[280px] overflow-hidden">
              {/* Dynamic Progress Background */}
              <div className="absolute inset-x-0 bottom-0 h-[3px] bg-white/5">
                <motion.div
                  initial={{ width: "100%" }}
                  animate={{ width: "0%" }}
                  transition={{
                    duration: info.cooldownDurationSeconds,
                    ease: "linear",
                  }}
                  className="h-full bg-cyan-500/50 shadow-[0_0_10px_rgba(6,182,212,0.5)]"
                />
              </div>

              {/* Icon Section */}
              <div className="shrink-0 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center border border-white/10">
                <i className="fa-solid fa-user-check text-cyan-400"></i>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">
                    Verification Log
                  </span>
                  <div className="flex items-center gap-1.5 bg-cyan-500/10 text-cyan-400 px-2 py-0.5 rounded-full border border-cyan-500/20">
                    <i className="fa-solid fa-circle-check text-[10px]"></i>
                    <span className="text-[10px] font-bold">DONE</span>
                  </div>
                </div>
                <h4 className="text-white text-sm font-bold truncate leading-tight">
                  {info.memberName || "Authorized Personnel"}
                </h4>
                <div className="flex items-center gap-2 mt-1.5">
                  <div className="flex items-center gap-1 text-[10px] text-white/30">
                    <i className="fa-regular fa-clock text-[10px]"></i>
                    <span>
                      Scan preserved for {info.cooldownDurationSeconds}s
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Subtle Aura */}
            <div className="absolute -inset-0.5 bg-cyan-500/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
