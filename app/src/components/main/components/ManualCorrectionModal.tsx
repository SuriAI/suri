import { useState } from "react"

import { Modal } from "@/components/common"
import { attendanceManager } from "@/services/AttendanceManager"
import { useAttendanceStore, useUIStore } from "@/components/main/stores"
import type { AttendanceRecord } from "@/components/main/types"

interface ManualCorrectionModalProps {
  isOpen: boolean
  record: AttendanceRecord
  displayName: string
  onClose: () => void
  onVoided: () => void | Promise<void>
}

export function ManualCorrectionModal({
  isOpen,
  record,
  displayName,
  onClose,
  onVoided,
}: ManualCorrectionModalProps) {
  const { setSuccess } = useUIStore()
  const [reason, setReason] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const trimmedReason = reason.trim()

  const handleClose = () => {
    setReason("")
    setError(null)
    setIsSubmitting(false)
    onClose()
  }

  const handleSubmit = async () => {
    if (!trimmedReason || isSubmitting) {
      if (!trimmedReason) {
        setError("Please enter a short reason before removing this attendance entry.")
      }
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      await attendanceManager.voidRecord(record.id, trimmedReason, "desktop_admin")
      const store = useAttendanceStore.getState()
      store.setRecentAttendance(store.recentAttendance.filter((item) => item.id !== record.id))

      if (store.currentGroup) {
        const cooldownKey = `${record.person_id}-${store.currentGroup.id}`
        store.setPersistentCooldowns((prev) => {
          const next = new Map(prev)
          next.delete(cooldownKey)
          return next
        })
      }

      setSuccess(`${displayName} attendance entry removed`)
      await Promise.resolve(onVoided())
      handleClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove attendance entry.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        if (!isSubmitting) handleClose()
      }}
      title={<span className="text-[15px] font-semibold text-white/92">Remove Attendance</span>}
      maxWidth="sm">
      <div className="space-y-4">
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3">
          <p className="text-sm leading-relaxed break-words text-amber-100/90">
            This will remove the attendance entry for{" "}
            <strong className="break-all">{displayName}</strong> and update today&apos;s status.
          </p>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold tracking-wide text-white/65 uppercase">
            Reason Required
          </label>
          <p className="text-xs leading-relaxed text-white/55">
            Add a short note explaining why this attendance entry should be removed.
          </p>
          <textarea
            value={reason}
            onChange={(event) => {
              setReason(event.target.value)
              if (error) {
                setError(null)
              }
            }}
            placeholder="Example: Wrong member selected"
            rows={4}
            disabled={isSubmitting}
            className="custom-scroll min-h-24 w-full rounded-xl border border-white/10 bg-[rgba(22,28,36,0.68)] px-3 py-2.5 text-xs leading-relaxed text-white transition-all outline-none placeholder:text-white/40 focus:border-amber-500/30 focus:bg-[rgba(28,35,44,0.82)]"
          />
        </div>

        {error && (
          <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-[11px] font-medium text-red-200">
            {error}
          </div>
        )}

        <div className="flex justify-end gap-3 pt-1">
          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            className="rounded-lg px-4 py-2 text-[11px] font-medium text-white/55 transition-all duration-200 hover:bg-white/5 hover:text-white/80 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-30">
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={isSubmitting || !trimmedReason}
            className="rounded-lg bg-amber-500 px-6 py-2 text-[11px] font-bold tracking-wider text-slate-950 transition-all duration-200 hover:bg-amber-400 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-30">
            {isSubmitting ? "Removing..." : "Remove Entry"}
          </button>
        </div>
      </div>
    </Modal>
  )
}
