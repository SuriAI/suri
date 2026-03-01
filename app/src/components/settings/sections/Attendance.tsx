import type { AttendanceSettings } from "@/components/settings/types";

interface AttendanceProps {
  attendanceSettings: AttendanceSettings;
  onLateThresholdChange: (minutes: number) => void;
  onLateThresholdToggle: (enabled: boolean) => void;
  onReLogCooldownChange: (seconds: number) => void;
  onSpoofDetectionToggle: (enabled: boolean) => void;
  hasSelectedGroup?: boolean;
}

export function Attendance({
  attendanceSettings,
  onLateThresholdChange,
  onLateThresholdToggle,
  onReLogCooldownChange,
  onSpoofDetectionToggle,
  hasSelectedGroup = false,
}: AttendanceProps) {
  return (
    <div className="space-y-4 max-w-auto p-10">
      <div className="flex items-center py-3 border-b border-white/5 gap-4">
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-white/90">
            Anti-Spoof Detection
          </div>
          <div className="text-xs text-white/50 mt-0.5">
            {attendanceSettings.enableSpoofDetection
              ? "Protection enabled - blocks photo/video attacks"
              : "Disabled - accepts all faces"}
          </div>
        </div>

        <button
          onClick={() =>
            onSpoofDetectionToggle(!attendanceSettings.enableSpoofDetection)
          }
          className={`relative w-11 h-6 rounded-full focus:outline-none transition-colors duration-150 flex-shrink-0 flex items-center ml-auto ${attendanceSettings.enableSpoofDetection
            ? "bg-cyan-500/30"
            : "bg-white/10"
            } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          <div
            className={`absolute left-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-150 ${attendanceSettings.enableSpoofDetection
              ? "translate-x-5"
              : "translate-x-0"
              }`}
          ></div>
        </button>
      </div>

      <div className="flex items-center py-3 border-b border-white/5 gap-4">
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-white/90">
            Attendance Cooldown
          </div>
          <div className="text-xs text-white/50 mt-0.5">
            Ignores the same face for this duration to prevent accidental duplicate logs.
          </div>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0 ml-auto">
          <span className="text-cyan-400 font-semibold text-sm min-w-[2.5rem] text-right whitespace-nowrap">
            {Math.floor((attendanceSettings.reLogCooldownSeconds ?? 1800) / 60)}{" "}
            m
          </span>
          <input
            type="range"
            min="300"
            max="7200"
            step="300"
            value={attendanceSettings.reLogCooldownSeconds ?? 1800}
            onChange={(e) => onReLogCooldownChange(parseInt(e.target.value))}
            className="w-24 accent-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>
      </div>

      <div className="flex flex-col">
        <div
          className={`flex items-center py-3 gap-4 ${attendanceSettings.lateThresholdEnabled && hasSelectedGroup
            ? ""
            : "border-b border-white/5"
            }`}
        >
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-white/90">Late Tracking</div>
            <div className="text-xs text-white/50 mt-0.5">
              {!hasSelectedGroup
                ? "Select a group to enable late tracking"
                : "Flag members as late in reports based on the scheduled start time."}
            </div>
          </div>

          <button
            onClick={() =>
              onLateThresholdToggle(!attendanceSettings.lateThresholdEnabled)
            }
            disabled={!hasSelectedGroup}
            className={`relative w-11 h-6 rounded-full focus:outline-none transition-colors duration-150 flex-shrink-0 flex items-center ml-auto ${attendanceSettings.lateThresholdEnabled
              ? "bg-cyan-500/30"
              : "bg-white/10"
              } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <div
              className={`absolute left-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-150 ${attendanceSettings.lateThresholdEnabled
                ? "translate-x-5"
                : "translate-x-0"
                }`}
            ></div>
          </button>
        </div>

        {attendanceSettings.lateThresholdEnabled && hasSelectedGroup && (
          <div className="flex items-center pb-4 pt-1 border-b border-white/5 gap-4 pl-4 relative">
            {/* Visual indicator of nesting */}
            <div className="absolute left-0 top-0 bottom-4 w-px bg-white/10 rounded-bl-lg"></div>
            <div className="absolute left-0 bottom-4 w-3 h-px bg-white/10 rounded-bl-lg"></div>

            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-white/90">
                Late Grace Period
              </div>
              <div className="text-xs text-white/50 mt-0.5">
                Minutes after the start time before a member is marked as late.
              </div>
            </div>

            <div className="flex items-center gap-3 flex-shrink-0 ml-auto">
              <span className="text-cyan-400 font-semibold text-sm min-w-[2.5rem] text-right whitespace-nowrap">
                {attendanceSettings.lateThresholdMinutes} m
              </span>
              <input
                type="range"
                min="5"
                max="60"
                step="5"
                value={attendanceSettings.lateThresholdMinutes}
                onChange={(e) =>
                  onLateThresholdChange(parseInt(e.target.value))
                }
                className="w-24 accent-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
