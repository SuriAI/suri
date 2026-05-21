import { motion, AnimatePresence } from "framer-motion"
import type { AttendanceSettings } from "@/components/settings/types"
import { InfoPopover } from "@/components/shared"

interface AttendanceProps {
  attendanceSettings: AttendanceSettings
  onLateThresholdChange: (minutes: number) => void
  onLateThresholdToggle: (enabled: boolean) => void
  onAttendanceCooldownChange: (seconds: number) => void
  onSpoofDetectionToggle: (enabled: boolean) => void
  onMaxRecognitionFacesChange: (count: number) => void
  onTrackCheckoutToggle: (enabled: boolean) => void
  onDataRetentionChange: (days: number) => void
  onBiometricConsentToggle?: (enabled: boolean) => void
  hasSelectedGroup?: boolean
}

const SETTINGS_STATUS_SWAP_DURATION = 0.14
const SETTINGS_PANEL_ANIMATION_DURATION = 0.18

export function Attendance({
  attendanceSettings,
  onLateThresholdChange,
  onLateThresholdToggle,
  onAttendanceCooldownChange,
  onSpoofDetectionToggle,
  onMaxRecognitionFacesChange,
  onTrackCheckoutToggle,
  onDataRetentionChange,
  onBiometricConsentToggle,
  hasSelectedGroup = false,
}: AttendanceProps) {
  return (
    <div className="mx-auto w-full max-w-[900px] space-y-6 px-10 pt-8 pb-10">
      <div className="overflow-hidden">
        <div className="pt-6 pb-2">
          <h3 className="text-[10px] font-extrabold tracking-[0.2em] text-white/55 uppercase">
            Attendance
          </h3>
        </div>

        <div className="py-2">
          <div className="flex flex-col">
            <div className={`flex items-center gap-4 py-4 ${hasSelectedGroup ? "" : ""}`}>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <div className="text-sm font-medium text-white/90">Entry & Exit Tracking</div>
                  <InfoPopover
                    title="Entry & Exit Tracking"
                    description="Record two events per person per day: the first scan as arrival (Time In) and the most recent scan as departure (Time Out)."
                    details={[
                      "Single scans count as arrival only.",
                      "Subsequent scans update the departure time.",
                      "Total hours are calculated automatically.",
                    ]}
                    side="right"
                  />
                </div>
                <div className="relative min-h-4">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={`${hasSelectedGroup}-${attendanceSettings.trackCheckout}`}
                      initial={{ opacity: 0, y: -2 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 2 }}
                      transition={{ duration: SETTINGS_STATUS_SWAP_DURATION }}
                      className="text-xs font-normal text-white/65">
                      {!hasSelectedGroup ?
                        "Select a group to enable this feature"
                      : attendanceSettings.trackCheckout ?
                        "Record both arrival and departure times."
                      : "Only record arrival times."}
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>

              <button
                onClick={() => onTrackCheckoutToggle(!attendanceSettings.trackCheckout)}
                disabled={!hasSelectedGroup}
                className={`premium-switch ${attendanceSettings.trackCheckout ? "premium-switch-on" : "premium-switch-off"} group/toggle disabled:cursor-not-allowed disabled:opacity-50`}>
                <div
                  className={`premium-switch-thumb ${attendanceSettings.trackCheckout ? "premium-switch-thumb-on" : "premium-switch-thumb-off"}`}></div>
              </button>
            </div>
          </div>

          <div className="h-px w-full bg-white/8" />

          <div className="flex flex-col">
            <div className="flex items-center gap-4 py-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <div className="text-sm font-medium text-white/90">Late Tracking</div>
                  <InfoPopover
                    title="Late Tracking"
                    description="Automatically mark members as late if their arrival occurs after the scheduled start time plus the late threshold."
                    details={["If enabled, late status will be reflected in Overview and Reports."]}
                    side="right"
                  />
                </div>
                <div className="relative min-h-4">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={`${hasSelectedGroup}-${attendanceSettings.lateThresholdEnabled}`}
                      initial={{ opacity: 0, y: -2 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 2 }}
                      transition={{ duration: SETTINGS_STATUS_SWAP_DURATION }}
                      className="text-xs font-normal text-white/65">
                      {!hasSelectedGroup ?
                        "Select a group to enable late tracking"
                      : attendanceSettings.lateThresholdEnabled ?
                        "Automatically mark members as late based on scheduled start times."
                      : "Late tracking is disabled."}
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>

              <button
                onClick={() => onLateThresholdToggle(!attendanceSettings.lateThresholdEnabled)}
                disabled={!hasSelectedGroup}
                className={`premium-switch ${attendanceSettings.lateThresholdEnabled ? "premium-switch-on" : "premium-switch-off"} group/toggle disabled:cursor-not-allowed disabled:opacity-50`}>
                <div
                  className={`premium-switch-thumb ${attendanceSettings.lateThresholdEnabled ? "premium-switch-thumb-on" : "premium-switch-thumb-off"}`}></div>
              </button>
            </div>

            <AnimatePresence>
              {attendanceSettings.lateThresholdEnabled && hasSelectedGroup && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: SETTINGS_PANEL_ANIMATION_DURATION, ease: "easeOut" }}
                  className="overflow-hidden">
                  <div className="relative flex items-center gap-4 pt-2.5 pb-2.5 pl-4">
                    <div className="absolute top-0 bottom-1/2 left-0 w-px rounded-bl-xs bg-white/10"></div>
                    <div className="absolute top-1/2 left-0 h-px w-3 -translate-y-1/2 rounded-bl-xs bg-white/10"></div>

                    <div className="min-w-0 flex-1">
                      <div className="text-xs text-white/65">Late threshold:</div>
                    </div>

                    <div className="ml-auto flex shrink-0 items-center gap-4">
                      {([5, 10, 15, 30, 45, 60] as const).map((mins) => (
                        <button
                          key={mins}
                          type="button"
                          onClick={() => onLateThresholdChange(mins)}
                          className={`relative min-w-[24px] py-1 text-center text-[11px] font-extrabold tracking-wider transition-all duration-150 ${
                            attendanceSettings.lateThresholdMinutes === mins ?
                              "text-cyan-400"
                            : "text-white/40 hover:text-white/70"
                          }`}>
                          {mins}m
                          {attendanceSettings.lateThresholdMinutes === mins && (
                            <motion.div
                              layoutId="lateUnderline"
                              className="absolute right-1.5 bottom-[-3px] left-1.5 h-[2px] rounded-full bg-cyan-400"
                              transition={{ type: "spring", stiffness: 380, damping: 30 }}
                            />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="h-px w-full bg-white/8" />

          <div className="flex items-center gap-4 py-4">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <div className="text-sm font-medium text-white/90">Duplicate Prevention</div>
                <InfoPopover
                  title="Duplicate Prevention"
                  description="Automatically filters out repeated scans from the same person to keep your reports clean."
                  details={[
                    "Always active to ensure accurate attendance and reporting.",
                    "Short Window: Best for high-traffic areas or tracking movement.",
                    "Long Window: Recommended for simple daily attendance.",
                  ]}
                  side="right"
                />
              </div>
              <div className="mt-0.5 text-xs text-white/65">
                Automatically filters out repeated scans from the same person to maintain clean,
                accurate reports.
              </div>
            </div>

            <div className="ml-auto flex shrink-0 items-center gap-4">
              {([5, 30, 60, 300, 600, 1800] as const).map((secs) => (
                <button
                  key={secs}
                  type="button"
                  onClick={() => onAttendanceCooldownChange(secs)}
                  className={`relative min-w-[24px] py-1 text-center text-[11px] font-extrabold tracking-wider transition-all duration-150 ${
                    attendanceSettings.attendanceCooldownSeconds === secs ?
                      "text-cyan-400"
                    : "text-white/40 hover:text-white/70"
                  }`}>
                  {secs < 60 ? `${secs}s` : `${secs / 60}m`}
                  {attendanceSettings.attendanceCooldownSeconds === secs && (
                    <motion.div
                      layoutId="cooldownUnderline"
                      className="absolute right-1.5 bottom-[-3px] left-1.5 h-[2px] rounded-full bg-cyan-400"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="h-px w-full bg-white/8" />

          <div className="flex flex-col">
            <div className="flex items-center gap-4 py-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <div className="text-sm font-medium text-white/90">Recognition Limit</div>
                  <InfoPopover
                    title="Recognition Limit"
                    description="Limit how many faces are recognized per frame to optimize performance."
                    details={[
                      "If disabled, the system will attempt to recognize all faces detected in a frame.",
                      "Lower limits improve processing speed.",
                      "The system prioritizes the largest, closest faces.",
                    ]}
                    side="right"
                  />
                </div>
                <div className="relative min-h-4">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={attendanceSettings.maxRecognitionFacesPerFrame > 0 ? "on" : "off"}
                      initial={{ opacity: 0, y: -2 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 2 }}
                      transition={{ duration: SETTINGS_STATUS_SWAP_DURATION }}
                      className="text-xs font-normal text-white/65">
                      {attendanceSettings.maxRecognitionFacesPerFrame === 0 ?
                        "Process all detected faces."
                      : "Limit the maximum number of faces recognized per frame to optimize performance."
                      }
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>

              <button
                onClick={() => {
                  if (attendanceSettings.maxRecognitionFacesPerFrame === 0) {
                    onMaxRecognitionFacesChange(6)
                  } else {
                    onMaxRecognitionFacesChange(0)
                  }
                }}
                className={`premium-switch ${
                  attendanceSettings.maxRecognitionFacesPerFrame > 0 ?
                    "premium-switch-on"
                  : "premium-switch-off"
                }`}>
                <div
                  className={`premium-switch-thumb ${
                    attendanceSettings.maxRecognitionFacesPerFrame > 0 ?
                      "premium-switch-thumb-on"
                    : "premium-switch-thumb-off"
                  }`}
                />
              </button>
            </div>

            <AnimatePresence>
              {attendanceSettings.maxRecognitionFacesPerFrame > 0 && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: SETTINGS_PANEL_ANIMATION_DURATION, ease: "easeOut" }}
                  className="overflow-hidden">
                  <div className="relative flex items-center gap-4 pt-2.5 pb-2.5 pl-4">
                    <div className="absolute top-0 bottom-1/2 left-0 w-px rounded-bl-xs bg-white/10"></div>
                    <div className="absolute top-1/2 left-0 h-px w-3 -translate-y-1/2 rounded-bl-xs bg-white/10"></div>

                    <div className="min-w-0 flex-1">
                      <div className="text-xs text-white/65">Limit to:</div>
                    </div>

                    <div className="ml-auto flex shrink-0 items-center gap-4">
                      {([1, 2, 3, 5, 8, 10, 15, 20] as const).map((faces) => (
                        <button
                          key={faces}
                          type="button"
                          onClick={() => onMaxRecognitionFacesChange(faces)}
                          className={`relative min-w-[24px] py-1 text-center text-[11px] font-extrabold tracking-wider transition-all duration-150 ${
                            attendanceSettings.maxRecognitionFacesPerFrame === faces ?
                              "text-cyan-400"
                            : "text-white/40 hover:text-white/70"
                          }`}>
                          {faces}
                          {attendanceSettings.maxRecognitionFacesPerFrame === faces && (
                            <motion.div
                              layoutId="facesUnderline"
                              className="absolute right-1.5 bottom-[-3px] left-1.5 h-[2px] rounded-full bg-cyan-400"
                              transition={{ type: "spring", stiffness: 380, damping: 30 }}
                            />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <div className="overflow-hidden">
        <div className="pt-6 pb-2">
          <h3 className="text-[10px] font-extrabold tracking-[0.2em] text-white/55 uppercase">
            Security & Compliance
          </h3>
        </div>

        <div className="py-2">
          <div className="flex items-center gap-4 py-4">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <div className="text-sm font-medium text-white/90">Liveness Verification</div>
                <InfoPopover
                  title="Liveness Verification"
                  description="Requires a live face before showing identity or recording attendance, helping block photo and screen replay attempts."
                  details={[
                    "Uses liveness detection under the hood.",
                    "Can show guidance like Center your face, Move closer, or Verifying....",
                    "Works best with balanced lighting and a clear front-facing view.",
                    "May slightly reduce recognition speed when enabled.",
                  ]}
                  side="right"
                />
              </div>
              <div className="relative min-h-4">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={attendanceSettings.enableSpoofDetection ? "on" : "off"}
                    initial={{ opacity: 0, y: -2 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 2 }}
                    transition={{ duration: SETTINGS_STATUS_SWAP_DURATION }}
                    className="text-xs font-normal text-white/65">
                    {attendanceSettings.forceLiveness ?
                      "Enforced by central administration."
                    : attendanceSettings.enableSpoofDetection ?
                      "Prevent spoofing attempts using printed photos, video playback, or digital screens."
                    : "Skip liveness verification."}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>

            <button
              onClick={() =>
                !attendanceSettings.forceLiveness &&
                onSpoofDetectionToggle(!attendanceSettings.enableSpoofDetection)
              }
              disabled={attendanceSettings.forceLiveness}
              aria-label="Toggle anti-spoof detection"
              className={`premium-switch ${attendanceSettings.enableSpoofDetection || attendanceSettings.forceLiveness ? "premium-switch-on" : "premium-switch-off"} group/toggle disabled:cursor-not-allowed`}>
              <div
                className={`premium-switch-thumb ${attendanceSettings.enableSpoofDetection || attendanceSettings.forceLiveness ? "premium-switch-thumb-on" : "premium-switch-thumb-off"} flex items-center justify-center`}>
                {attendanceSettings.forceLiveness && (
                  <i className="fa-solid fa-lock text-[8px] text-cyan-900/60" />
                )}
              </div>
            </button>
          </div>

          <div className="h-px w-full bg-white/8" />

          <div className="flex items-center gap-4 py-4">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <div className="text-sm font-medium text-white/90">Global Group Consent</div>
                <InfoPopover
                  title="Global Group Consent"
                  description="Certify that explicit biometric consent forms have been signed off-system (e.g. in employment contracts) by all members of this group. Enabling this will remove repetitive consent checkboxes from manual registration and edit flows."
                  details={[
                    "Certifies that consent is managed off-system.",
                    "Removes manual checkbox prompts on member add/edit.",
                    "Enables immediate one-click registration.",
                  ]}
                  side="right"
                />
              </div>
              <div className="relative min-h-4">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={`${hasSelectedGroup}-${attendanceSettings.biometricConsentCertified}`}
                    initial={{ opacity: 0, y: -2 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 2 }}
                    transition={{ duration: SETTINGS_STATUS_SWAP_DURATION }}
                    className="text-xs font-normal text-white/65">
                    {!hasSelectedGroup ?
                      "Select a group to enable this feature"
                    : attendanceSettings.biometricConsentCertified ?
                      "Bypass manual consent checkboxes during member registration."
                    : "Require manual consent checkbox certification for each member."}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>

            <button
              onClick={() =>
                onBiometricConsentToggle?.(!attendanceSettings.biometricConsentCertified)
              }
              disabled={!hasSelectedGroup}
              className={`premium-switch ${attendanceSettings.biometricConsentCertified ? "premium-switch-on" : "premium-switch-off"} group/toggle disabled:cursor-not-allowed disabled:opacity-50`}>
              <div
                className={`premium-switch-thumb ${attendanceSettings.biometricConsentCertified ? "premium-switch-thumb-on" : "premium-switch-thumb-off"}`}></div>
            </button>
          </div>
        </div>
      </div>

      <div className="overflow-hidden">
        <div className="pt-10 pb-2">
          <h3 className="text-[10px] font-extrabold tracking-[0.25em] text-white/55 uppercase">
            Data Retention
          </h3>
        </div>

        <div className="py-2">
          <div className="flex items-center gap-4 py-4">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <div className="text-sm font-medium text-white/90">Retention Policy</div>
                <InfoPopover
                  title="Data Retention"
                  description="Controls how long attendance logs and biometric signatures are stored in your local database."
                  detailsNode={[
                    <div key="how-it-works" className="space-y-1.5">
                      <div className="font-semibold text-white/90">How it works:</div>
                      <ul className="list-disc space-y-1 pl-4 text-white/65">
                        <li>Pruning occurs automatically every 24 hours.</li>
                        <li>Expired records are permanently deleted.</li>
                        <li>Setting this to 0 disables automatic deletion.</li>
                      </ul>
                    </div>,
                    <div
                      key="tip"
                      data-hide-chevron
                      className="rounded-md bg-white/5 p-2 text-[11px] text-white/65">
                      <span className="font-medium text-white/65">Tip:</span> Shorter retention
                      periods keep the app faster and comply better with modern privacy laws.
                    </div>,
                  ]}
                />
              </div>
              <div className="mt-0.5 text-xs text-white/65">
                {(() => {
                  const totalDays = attendanceSettings.dataRetentionDays
                  if (!totalDays || totalDays <= 0) return "Keep all records forever."

                  const years = Math.floor(totalDays / 365)
                  const remainingDays = totalDays % 365
                  const months = Math.floor(remainingDays / 30)

                  let timeStr = ""
                  if (years > 0) {
                    timeStr += `${years} ${years === 1 ? "year" : "years"}`
                    if (months > 0) {
                      timeStr += ` and ${months} ${months === 1 ? "month" : "months"}`
                    }
                  } else if (months > 0) {
                    timeStr = `${months} ${months === 1 ? "month" : "months"}`
                  } else {
                    timeStr = `${totalDays} ${totalDays === 1 ? "day" : "days"}`
                  }

                  return `Delete records older than ${timeStr} automatically.`
                })()}
              </div>
            </div>
            <div className="ml-auto flex shrink-0 items-center gap-2">
              <span className="text-[11px] font-medium text-white/65">days</span>
              <input
                type="text"
                inputMode="numeric"
                value={attendanceSettings.dataRetentionDays ?? 0}
                onChange={(e) => {
                  const raw = e.target.value.replace(/\D/g, "")
                  const num = raw === "" ? 0 : parseInt(raw, 10)
                  onDataRetentionChange(Math.min(3650, num))
                }}
                className="w-14 rounded-lg border border-white/10 bg-[rgba(22,28,36,0.68)] px-2 py-1.5 text-center text-xs font-bold text-white transition-all duration-300 outline-none focus:border-white/20"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
