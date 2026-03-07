import { motion, AnimatePresence } from "framer-motion";
import type { AttendanceSettings } from "@/components/settings/types";

interface AttendanceProps {
  attendanceSettings: AttendanceSettings;
  onLateThresholdChange: (minutes: number) => void;
  onLateThresholdToggle: (enabled: boolean) => void;
  onReLogCooldownChange: (seconds: number) => void;
  onSpoofDetectionToggle: (enabled: boolean) => void;
  onTrackCheckoutToggle: (enabled: boolean) => void;
  onDataRetentionChange: (days: number) => void;
  hasSelectedGroup?: boolean;
}

export function Attendance({
  attendanceSettings,
  onLateThresholdChange,
  onLateThresholdToggle,
  onReLogCooldownChange,
  onSpoofDetectionToggle,
  onTrackCheckoutToggle,
  onDataRetentionChange,
  hasSelectedGroup = false,
}: AttendanceProps) {
  return (
    <div className="space-y-6 max-w-auto pt-4 px-10 pb-10">
      {/* 1. Core Logic & Rules */}
      <div className="overflow-hidden">
        <div className="py-2 border-b border-white/5">
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-400/50 flex items-center gap-2">
            <i className="fa-solid fa-clock-rotate-left text-[9px]"></i>
            Attendance Logic
          </h3>
        </div>

        <div className="py-2">
          {/* Time In & Time Out */}
          <div className="flex flex-col">
            <div
              className={`flex items-center py-4 gap-4 ${hasSelectedGroup ? "" : ""}`}
            >
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-white/90">
                  Time In & Time Out
                </div>
                <div className="min-h-4 relative">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={`${hasSelectedGroup}-${attendanceSettings.trackCheckout}`}
                      initial={{ opacity: 0, y: -2 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 2 }}
                      transition={{ duration: 0.15 }}
                      className="text-xs text-white/40 font-normal"
                    >
                      {!hasSelectedGroup
                        ? "Select a group to enable this feature"
                        : attendanceSettings.trackCheckout
                          ? "ON: Records both when people arrive and when they leave."
                          : "OFF: Only records when people show up."}
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>

              <button
                onClick={() =>
                  onTrackCheckoutToggle(!attendanceSettings.trackCheckout)
                }
                disabled={!hasSelectedGroup}
                className={`relative w-10 h-5.5 rounded-full focus:outline-none transition-colors duration-200 shrink-0 flex items-center ml-auto ${
                  attendanceSettings.trackCheckout
                    ? "bg-cyan-500/30"
                    : "bg-white/10"
                } disabled:opacity-50 disabled:cursor-not-allowed group/toggle`}
              >
                <div
                  className={`absolute left-0.5 w-4.5 h-4.5 bg-white rounded-full shadow-sm transition-transform duration-200 ${
                    attendanceSettings.trackCheckout
                      ? "translate-x-4.5"
                      : "translate-x-0"
                  }`}
                ></div>
              </button>
            </div>

            <AnimatePresence>
              {hasSelectedGroup && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className="overflow-hidden"
                >
                  <div className="flex items-center pb-5 pt-1 gap-4 pl-4 relative">
                    <div className="absolute left-0 top-0 bottom-1/2 w-px bg-white/10 rounded-bl-xs"></div>
                    <div className="absolute left-0 top-1/2 w-3 h-px bg-white/10 -translate-y-1/2 rounded-bl-xs"></div>

                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-white/40 mt-0.5">
                        <AnimatePresence mode="wait">
                          <motion.div
                            key={
                              attendanceSettings.trackCheckout
                                ? "session"
                                : "prevention"
                            }
                            initial={{ opacity: 0, x: -5 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 5 }}
                            transition={{ duration: 0.15 }}
                          >
                            {attendanceSettings.trackCheckout
                              ? `Min Stay: Wait at least ${Math.floor(
                                  (attendanceSettings.reLogCooldownSeconds ??
                                    1800) / 60,
                                )} minutes before scanning to leave.`
                              : `Spam Filter: Ignore the same person if they scan again within ${Math.floor(
                                  (attendanceSettings.reLogCooldownSeconds ??
                                    1800) / 60,
                                )} minutes.`}
                          </motion.div>
                        </AnimatePresence>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 ml-auto">
                      <span
                        className={`text-[10px] font-black uppercase tracking-widest min-w-10 text-right whitespace-nowrap transition-colors duration-150 ${
                          attendanceSettings.trackCheckout
                            ? "text-cyan-400"
                            : "text-white/20"
                        }`}
                      >
                        {Math.floor(
                          (attendanceSettings.reLogCooldownSeconds ?? 1800) /
                            60,
                        )}{" "}
                        min
                      </span>
                      <input
                        type="range"
                        min="60"
                        max="3600"
                        step="60"
                        value={attendanceSettings.reLogCooldownSeconds ?? 1800}
                        onChange={(e) =>
                          onReLogCooldownChange(parseInt(e.target.value))
                        }
                        className={`w-24 h-1 px-1 rounded-full cursor-pointer transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed appearance-none bg-white/5 ${
                          attendanceSettings.trackCheckout
                            ? "accent-cyan-500"
                            : "accent-white/20"
                        }`}
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="h-px bg-white/5 w-full" />

          {/* Late Tracking */}
          <div className="flex flex-col">
            <div className={`flex items-center py-4 gap-4`}>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-white/90">
                  Late Tracking
                </div>
                <div className="min-h-4 relative">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={`${hasSelectedGroup}-${attendanceSettings.lateThresholdEnabled}`}
                      initial={{ opacity: 0, y: -2 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 2 }}
                      transition={{ duration: 0.15 }}
                      className="text-xs text-white/40 font-normal"
                    >
                      {!hasSelectedGroup
                        ? "Select a group to enable late tracking"
                        : attendanceSettings.lateThresholdEnabled
                          ? "ON: Automatically checking for late members."
                          : "OFF: Late tracking is disabled."}
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>

              <button
                onClick={() =>
                  onLateThresholdToggle(
                    !attendanceSettings.lateThresholdEnabled,
                  )
                }
                disabled={!hasSelectedGroup}
                className={`relative w-10 h-5.5 rounded-full focus:outline-none transition-colors duration-200 shrink-0 flex items-center ml-auto ${
                  attendanceSettings.lateThresholdEnabled
                    ? "bg-cyan-500/30"
                    : "bg-white/10"
                } disabled:opacity-50 disabled:cursor-not-allowed group/toggle`}
              >
                <div
                  className={`absolute left-0.5 w-4.5 h-4.5 bg-white rounded-full shadow-md transition-transform duration-200 ${
                    attendanceSettings.lateThresholdEnabled
                      ? "translate-x-4.5"
                      : "translate-x-0"
                  }`}
                ></div>
              </button>
            </div>

            <AnimatePresence>
              {attendanceSettings.lateThresholdEnabled && hasSelectedGroup && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className="overflow-hidden"
                >
                  <div className="flex items-center pb-5 pt-1 gap-4 pl-4 relative">
                    <div className="absolute left-0 top-0 bottom-1/2 w-px bg-white/10 rounded-bl-xs"></div>
                    <div className="absolute left-0 top-1/2 w-3 h-px bg-white/10 -translate-y-1/2 rounded-bl-xs"></div>

                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-white/40 mt-0.5">
                        Late threshold in minutes.
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 ml-auto">
                      <span className="text-cyan-400 text-[10px] font-black uppercase tracking-widest min-w-10 text-right whitespace-nowrap">
                        {attendanceSettings.lateThresholdMinutes} min
                      </span>
                      <input
                        type="range"
                        min="0"
                        max="60"
                        step="5"
                        value={attendanceSettings.lateThresholdMinutes}
                        onChange={(e) =>
                          onLateThresholdChange(parseInt(e.target.value))
                        }
                        className="w-24 h-1 px-1 rounded-full cursor-pointer appearance-none bg-white/5 accent-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* 2. Security & Compliance */}
      <div className="overflow-hidden">
        <div className="py-2 border-b border-white/5">
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-400/50 flex items-center gap-2">
            <i className="fa-solid fa-shield-halved text-[9px]"></i>
            Security & Compliance
          </h3>
        </div>

        <div className="py-2">
          {/* Anti-Spoof Detection */}
          <div className="flex items-center py-4 gap-4">
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-white/90">
                Anti-Spoof Detection
              </div>
              <div className="min-h-4 relative">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={attendanceSettings.enableSpoofDetection ? "on" : "off"}
                    initial={{ opacity: 0, y: -2 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 2 }}
                    transition={{ duration: 0.15 }}
                    className="text-xs text-white/40 font-normal"
                  >
                    {attendanceSettings.enableSpoofDetection
                      ? "ON: Extra security against fake faces or photos."
                      : "OFF: Standard scanning speed."}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>

            <button
              onClick={() =>
                onSpoofDetectionToggle(!attendanceSettings.enableSpoofDetection)
              }
              className={`relative w-10 h-5.5 rounded-full focus:outline-none transition-colors duration-200 shrink-0 flex items-center ml-auto ${
                attendanceSettings.enableSpoofDetection
                  ? "bg-cyan-500/30"
                  : "bg-white/10"
              } disabled:opacity-50 disabled:cursor-not-allowed group/toggle`}
            >
              <div
                className={`absolute left-0.5 w-4.5 h-4.5 bg-white rounded-full shadow-sm transition-transform duration-200 ${
                  attendanceSettings.enableSpoofDetection
                    ? "translate-x-4.5"
                    : "translate-x-0"
                }`}
              ></div>
            </button>
          </div>

          <div className="h-px bg-white/5 w-full" />

          {/* Data Retention */}
          <div className="flex items-center py-4 gap-4">
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-white/90">
                Data Retention
              </div>
              <div className="text-xs text-white/40 mt-0.5">
                {attendanceSettings.dataRetentionDays &&
                attendanceSettings.dataRetentionDays > 0
                  ? `Records older than ${attendanceSettings.dataRetentionDays} days are deleted automatically.`
                  : "Records are kept forever."}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0 ml-auto">
              <span className="text-[10px] uppercase font-black tracking-widest text-white/20">
                days
              </span>
              <input
                type="number"
                min={0}
                max={3650}
                value={attendanceSettings.dataRetentionDays ?? 0}
                onChange={(e) =>
                  onDataRetentionChange(
                    Math.max(0, parseInt(e.target.value) || 0),
                  )
                }
                className="w-14 bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-center text-white focus:outline-none focus:border-cyan-400/30 transition-all font-bold"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
