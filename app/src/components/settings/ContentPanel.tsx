import React, { useState, useMemo, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Display } from "@/components/settings/sections/Display"
import { Notifications } from "@/components/settings/sections/Notifications"
import { Database } from "@/components/settings/sections/Database"
import { Attendance } from "@/components/settings/sections/Attendance"
import { About } from "@/components/settings/sections/About"
import { Sync } from "@/components/settings/sections/Sync"
import { AntiSpoofDetectionModal } from "@/components/settings/AntiSpoofDetectionModal"
import { AuditLogExportModal } from "@/components/settings/AuditLogExportModal"
import { GroupPanel, type GroupSection } from "@/components/group"
import { SectionHeader } from "./components/SectionHeader"
import { useGroupModals } from "@/components/group/hooks"
import { useGroupUIStore } from "@/components/group/stores"
import { useUIStore } from "@/components/main/stores"
import { attendanceManager } from "@/services"
import type {
  QuickSettings,
  AttendanceSettings,
  AudioSettings,
  SettingsOverview,
  TimeHealthOverview,
} from "@/components/settings/types"
import type { AttendanceGroup, AttendanceMember } from "@/types/recognition"

interface ContentPanelProps {
  activeSection: string
  groupInitialSection: GroupSection | undefined
  setGroupInitialSection: (section: GroupSection) => void
  validInitialGroup: AttendanceGroup | null
  currentGroupMembers: AttendanceMember[]
  triggerCreateGroup: number
  deselectMemberTrigger: number
  setDeselectMemberTrigger: (trigger: number) => void
  setHasSelectedMember: (hasSelected: boolean) => void
  handleExportHandlersReady: (handlers: { exportCSV: () => void }) => void
  handleAddMemberHandlerReady: (handler: () => void) => void
  handleGroupsChanged: (newGroup?: AttendanceGroup) => void
  handleGroupBack: () => void
  quickSettings: QuickSettings
  toggleQuickSetting: (key: keyof QuickSettings) => void
  audioSettings: AudioSettings
  updateAudioSetting: (updates: Partial<AudioSettings>) => void
  attendanceSettings: AttendanceSettings
  updateAttendanceSetting: (updates: Partial<AttendanceSettings>) => void
  dropdownValue: string | null
  systemData: SettingsOverview
  timeHealthState: TimeHealthOverview
  groups: AttendanceGroup[]
  isLoading: boolean
  handleClearDatabase: () => void
  loadSystemData: () => void
  onGroupsChanged?: () => void
  members: AttendanceMember[]
  reportsExportHandlers: {
    exportCSV: () => void
  } | null
  addMemberHandler: (() => void) | null
  hasSelectedMember: boolean
  dropdownGroups: AttendanceGroup[]
  groupSections: { id: GroupSection; label: string; icon: string }[]
  setActiveSection: (section: string) => void
}

export const ContentPanel: React.FC<ContentPanelProps> = ({
  activeSection,
  groupInitialSection,
  setGroupInitialSection,
  validInitialGroup,
  currentGroupMembers,
  triggerCreateGroup,
  deselectMemberTrigger,
  setHasSelectedMember,
  handleExportHandlersReady,
  handleAddMemberHandlerReady,
  handleGroupsChanged,
  handleGroupBack,
  quickSettings,
  toggleQuickSetting,
  audioSettings,
  updateAudioSetting,
  attendanceSettings,
  updateAttendanceSetting,
  systemData,
  timeHealthState,
  groups,
  isLoading,
  handleClearDatabase,
  loadSystemData,
  onGroupsChanged,
  members,
  reportsExportHandlers,
  addMemberHandler,
  dropdownGroups,
  groupSections,
  setActiveSection,
}) => {
  const { openEditGroup } = useGroupModals()
  const registrationMode = useGroupUIStore((state) => state.lastRegistrationMode)
  const resetRegistration = useGroupUIStore((state) => state.resetRegistration)
  const antiSpoofDetectionInfoDismissed = useUIStore(
    (state) => state.antiSpoofDetectionInfoDismissed,
  )
  const setAntiSpoofDetectionInfoDismissed = useUIStore(
    (state) => state.setAntiSpoofDetectionInfoDismissed,
  )
  const setSuccess = useUIStore((state) => state.setSuccess)
  const setError = useUIStore((state) => state.setError)
  const [isAntiSpoofModalOpen, setIsAntiSpoofModalOpen] = useState(false)
  const [dontShowAntiSpoofInfoAgain, setDontShowAntiSpoofInfoAgain] = useState(false)
  const [isAuditLogModalOpen, setIsAuditLogModalOpen] = useState(false)

  /** Audit log export — owned here so the page header can surface the action. */
  const handleExportAuditLog = useCallback(
    async (startDate?: string, endDate?: string) => {
      try {
        await attendanceManager.downloadAuditLog(startDate, endDate)
        setSuccess("Audit log downloaded.")
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to export audit log.")
      }
    },
    [setSuccess, setError],
  )

  // Dynamic Header Logic
  const headerProps = useMemo(() => {
    const isGroupSection = activeSection === "group"

    const generalTitles: Record<string, string> = {
      attendance: "General",
      display: "Display",
      notifications: "Notifications",
      database: "Database",
      "remote-sync": "Sync",
      about: "About",
    }
    if (isGroupSection) {
      const groupName = validInitialGroup?.name || "Group Management"

      const sectionLabel =
        groupInitialSection ?
          groupSections.find((s) => s.id === groupInitialSection)?.label
        : "Overview"

      // Actions
      let actions: React.ReactNode = null
      if (
        groupInitialSection === "members" &&
        validInitialGroup &&
        addMemberHandler &&
        members.length > 0 &&
        !registrationMode
      ) {
        actions = (
          <div className="flex items-center gap-2">
            <button
              onClick={addMemberHandler}
              className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.02] px-3 py-1.5 text-[11px] font-bold tracking-wide text-white/70 transition-all duration-200 hover:border-white/25 hover:bg-white/5 active:scale-[0.97]">
              <i className="fa-solid fa-user-plus text-[10px]"></i>
              Add Member
            </button>
          </div>
        )
      } else if (groupInitialSection === "members" && registrationMode) {
        actions = (
          <button
            onClick={resetRegistration}
            className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.02] px-3 py-1.5 text-[11px] font-bold tracking-wide text-white/70 transition-all duration-200 hover:border-white/25 hover:bg-white/5 active:scale-[0.97]">
            <i className="fa-solid fa-arrow-left text-[10px]"></i>
            Back to Members
          </button>
        )
      } else if (groupInitialSection === "overview" && validInitialGroup) {
        actions = (
          <button
            onClick={openEditGroup}
            className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.02] px-3 py-1.5 text-[11px] font-bold tracking-wide text-white/70 transition-all duration-200 hover:border-white/25 hover:bg-white/5 active:scale-[0.97]">
            <i className="fa-solid fa-pen text-[10px]"></i>
            Edit Group
          </button>
        )
      } else if (groupInitialSection === "reports" && reportsExportHandlers) {
        actions = (
          <button
            onClick={reportsExportHandlers.exportCSV}
            className="flex items-center gap-2 rounded-lg border border-cyan-500/20 bg-cyan-500/[0.03] px-3 py-1.5 text-[11px] font-bold tracking-wide text-cyan-400 transition-all duration-200 hover:border-cyan-500/40 hover:bg-cyan-500/10 hover:text-cyan-300 active:scale-[0.97]">
            <i className="fa-solid fa-file-csv text-[10px]" />
            Export CSV
          </button>
        )
      }

      return {
        title: sectionLabel || "Overview",
        eyebrow: groupName,
        eyebrowColor: "text-white/45",
        actions,
        isGroupSection: true,
      }
    }

    return {
      title:
        generalTitles[activeSection] ||
        activeSection.charAt(0).toUpperCase() + activeSection.slice(1),
      eyebrow: "Preferences",
      eyebrowColor: "text-white/45",
      actions:
        activeSection === "database" ?
          <button
            onClick={() => setIsAuditLogModalOpen(true)}
            className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.02] px-3 py-1.5 text-[11px] font-bold tracking-wide text-white/70 transition-all duration-200 hover:border-white/25 hover:bg-white/5 active:scale-[0.97]">
            <i className="fa-solid fa-download text-[10px]" />
            AUDIT LOG
          </button>
        : null,
      isGroupSection: false,
    }
  }, [
    activeSection,
    groupInitialSection,
    groupSections,
    validInitialGroup,
    addMemberHandler,
    members.length,
    registrationMode,
    resetRegistration,
    openEditGroup,
    reportsExportHandlers,
  ])

  const handleSpoofDetectionToggle = (enabled: boolean) => {
    const isTurningOn = enabled && !attendanceSettings.enableSpoofDetection
    if (isTurningOn && !antiSpoofDetectionInfoDismissed) {
      setDontShowAntiSpoofInfoAgain(false)
      setIsAntiSpoofModalOpen(true)
      return
    }

    updateAttendanceSetting({ enableSpoofDetection: enabled })
  }

  const handleConfirmAntiSpoofDetection = () => {
    if (dontShowAntiSpoofInfoAgain) {
      setAntiSpoofDetectionInfoDismissed(true)
    }

    updateAttendanceSetting({ enableSpoofDetection: true })
    setIsAntiSpoofModalOpen(false)
  }

  const motionProps = {
    initial: { opacity: 0, scale: 0.995 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.995 },
    transition: { duration: 0.18, ease: "easeOut" as const },
    style: { willChange: "opacity, transform" } as React.CSSProperties,
  }

  return (
    <>
      <div className="flex flex-1 flex-col overflow-hidden bg-[var(--bg-secondary)]">
        <SectionHeader {...headerProps} />

        {/* Section Content */}
        <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
          <AnimatePresence mode="wait">
            {activeSection === "group" && (
              <motion.div
                key="group"
                {...motionProps}
                className="relative flex min-h-0 w-full flex-1 flex-col overflow-hidden">
                <div className="relative flex min-h-0 w-full flex-1 flex-col overflow-hidden">
                  <GroupPanel
                    onBack={handleGroupBack}
                    initialSection={groupInitialSection}
                    initialGroup={validInitialGroup}
                    embeddedGroups={dropdownGroups}
                    embeddedMembers={currentGroupMembers}
                    triggerCreateGroup={triggerCreateGroup}
                    deselectMemberTrigger={deselectMemberTrigger}
                    onHasSelectedMemberChange={setHasSelectedMember}
                    onExportHandlersReady={handleExportHandlersReady}
                    onAddMemberHandlerReady={handleAddMemberHandlerReady}
                    onGroupsChanged={handleGroupsChanged}
                    onSectionChange={setGroupInitialSection}
                    isEmbedded={true}
                  />
                </div>
              </motion.div>
            )}

            {activeSection === "display" && (
              <motion.div
                key="display"
                {...motionProps}
                className="custom-scroll relative flex min-h-0 w-full flex-1 flex-col overflow-x-hidden overflow-y-auto">
                <Display quickSettings={quickSettings} toggleQuickSetting={toggleQuickSetting} />
              </motion.div>
            )}

            {activeSection === "notifications" && (
              <motion.div
                key="notifications"
                {...motionProps}
                className="custom-scroll relative flex min-h-0 w-full flex-1 flex-col overflow-x-hidden overflow-y-auto">
                <Notifications
                  audioSettings={audioSettings}
                  onAudioSettingsChange={updateAudioSetting}
                />
              </motion.div>
            )}

            {activeSection === "attendance" && (
              <motion.div
                key="attendance"
                {...motionProps}
                className="custom-scroll relative flex min-h-0 w-full flex-1 flex-col overflow-x-hidden overflow-y-auto">
                <Attendance
                  attendanceSettings={attendanceSettings}
                  onLateThresholdChange={(minutes) =>
                    updateAttendanceSetting({ lateThresholdMinutes: minutes })
                  }
                  onLateThresholdToggle={(enabled) =>
                    updateAttendanceSetting({ lateThresholdEnabled: enabled })
                  }
                  onAttendanceCooldownChange={(seconds) =>
                    updateAttendanceSetting({ attendanceCooldownSeconds: seconds })
                  }
                  onSpoofDetectionToggle={handleSpoofDetectionToggle}
                  onMaxRecognitionFacesChange={(count) =>
                    updateAttendanceSetting({ maxRecognitionFacesPerFrame: count })
                  }
                  onTrackCheckoutToggle={(enabled) =>
                    updateAttendanceSetting({ trackCheckout: enabled })
                  }
                  onDataRetentionChange={(days) =>
                    updateAttendanceSetting({ dataRetentionDays: days })
                  }
                  onBiometricConsentToggle={(enabled) =>
                    updateAttendanceSetting({ biometricConsentCertified: enabled })
                  }
                  hasSelectedGroup={!!validInitialGroup}
                />
              </motion.div>
            )}

            {activeSection === "database" && (
              <motion.div
                key="database"
                {...motionProps}
                className="custom-scroll relative flex min-h-0 w-full flex-1 flex-col overflow-x-hidden overflow-y-auto">
                <Database
                  systemData={systemData}
                  timeHealthState={timeHealthState}
                  onRefreshTimeHealth={loadSystemData}
                  groups={groups}
                  isLoading={isLoading}
                  onClearDatabase={handleClearDatabase}
                  onGroupsChanged={() => {
                    loadSystemData()
                    if (onGroupsChanged) onGroupsChanged()
                  }}
                />
              </motion.div>
            )}

            {activeSection === "remote-sync" && (
              <motion.div
                key="remote-sync"
                {...motionProps}
                className="custom-scroll relative flex min-h-0 w-full flex-1 flex-col overflow-x-hidden overflow-y-auto">
                <Sync onNavigateToDB={() => setActiveSection("database")} />
              </motion.div>
            )}

            {activeSection === "about" && (
              <motion.div
                key="about"
                {...motionProps}
                className="custom-scroll relative flex min-h-0 w-full flex-1 flex-col overflow-x-hidden overflow-y-auto">
                <About />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      <AntiSpoofDetectionModal
        isOpen={isAntiSpoofModalOpen}
        dontShowAgain={dontShowAntiSpoofInfoAgain}
        onClose={() => setIsAntiSpoofModalOpen(false)}
        onConfirm={handleConfirmAntiSpoofDetection}
        onDontShowAgainChange={setDontShowAntiSpoofInfoAgain}
      />
      <AuditLogExportModal
        isOpen={isAuditLogModalOpen}
        onClose={() => setIsAuditLogModalOpen(false)}
        onExport={handleExportAuditLog}
      />
    </>
  )
}
