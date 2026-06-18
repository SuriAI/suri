import { useState } from "react"
import type { AttendanceGroup } from "@/components/main/types"
import { Modal } from "@/components/common"

interface DeleteConfirmationModalProps {
  showDeleteConfirmation: boolean
  groupToDelete: AttendanceGroup | null
  currentGroup: AttendanceGroup | null
  cancelDeleteGroup: () => void
  confirmDeleteGroup: () => void
}

export function DeleteConfirmationModal({
  showDeleteConfirmation,
  groupToDelete,
  currentGroup,
  cancelDeleteGroup,
  confirmDeleteGroup,
}: DeleteConfirmationModalProps) {
  const [confirmationInput, setConfirmationInput] = useState("")
  const [groupSnapshot, setGroupSnapshot] = useState<AttendanceGroup | null>(null)

  if (groupToDelete && groupToDelete !== groupSnapshot) {
    setGroupSnapshot(groupToDelete)
  }

  const isConfirmationMatch = confirmationInput.trim() === (groupSnapshot?.name ?? "")

  return (
    <Modal
      isOpen={showDeleteConfirmation}
      onClose={cancelDeleteGroup}
      title="Delete group"
      icon={<i className="fa-solid fa-triangle-exclamation text-red-300"></i>}
      maxWidth="md">
      {!groupSnapshot ? null : (
        <>
          <div className="mb-6">
            <p className="mb-4 text-sm text-white/80">
              Confirm deletion of the group{" "}
              <strong className="text-white">&quot;{groupSnapshot.name}&quot;</strong>?
            </p>
            <div className="mb-4 rounded-lg border border-red-500/30 bg-red-900/20 p-3">
              <p className="text-xs text-red-300">
                <strong>Warning:</strong> This action cannot be undone. All group data, members, and
                attendance records will be permanently removed.
              </p>
            </div>
            {currentGroup?.id === groupSnapshot.id && (
              <div className="rounded-lg border border-amber-500/30 bg-amber-900/20 p-3">
                <p className="text-xs text-amber-300">
                  <strong>Note:</strong> This is the currently active group. Deleting it will clear
                  the current selection.
                </p>
              </div>
            )}
            <div className="mt-4 space-y-1.5">
              <label className="text-xs font-medium text-white/65">
                Type <span className="font-mono text-white/70">{groupSnapshot.name}</span> to
                continue
              </label>
              <input
                type="text"
                value={confirmationInput}
                onChange={(e) => setConfirmationInput(e.target.value)}
                placeholder={groupSnapshot.name}
                className="w-full rounded-lg border border-white/10 bg-[rgba(22,28,36,0.68)] px-3 py-2 text-xs text-white transition-all duration-300 outline-none focus:border-white/20 focus:bg-[rgba(28,35,44,0.82)] focus-visible:ring-2 focus-visible:ring-cyan-500/50 focus-visible:outline-none"
              />
            </div>
          </div>

          <div className="mt-8 flex justify-end gap-3">
            <button
              onClick={() => {
                setConfirmationInput("")
                cancelDeleteGroup()
              }}
              className="rounded-lg px-4 py-2 text-[11px] font-medium text-white/55 transition-all duration-200 hover:bg-white/5 hover:text-white/80 focus-visible:ring-2 focus-visible:ring-white/20 focus-visible:ring-offset-1 focus-visible:ring-offset-[var(--bg-secondary)] focus-visible:outline-none active:scale-[0.97]">
              Cancel
            </button>
            <button
              onClick={() => {
                setConfirmationInput("")
                confirmDeleteGroup()
              }}
              disabled={!isConfirmationMatch}
              className="btn-error rounded-lg px-6 py-2 text-[11px] font-bold tracking-wider transition-all duration-200 focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-1 focus-visible:ring-offset-[var(--bg-secondary)] focus-visible:outline-none active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-30">
              Delete Group
            </button>
          </div>
        </>
      )}
    </Modal>
  )
}
