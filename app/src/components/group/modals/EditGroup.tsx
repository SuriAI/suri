import { useState } from "react"
import { attendanceManager } from "@/services"
import type { AttendanceGroup } from "@/types/recognition"
import { ErrorMessage, FormInput, Modal } from "@/components/common"

interface EditGroupProps {
  isOpen: boolean
  group: AttendanceGroup
  onClose: () => void
  onSuccess: () => void
}

export function EditGroup({ isOpen, group, onClose, onSuccess }: EditGroupProps) {
  const [name, setName] = useState(group.name)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleClose = () => {
    setName(group.name)
    setError(null)
    setLoading(false)
    onClose()
  }

  const handleSave = async () => {
    if (!name.trim()) {
      return
    }

    setLoading(true)
    try {
      await attendanceManager.updateGroup(group.id, {
        name: name.trim(),
      })
      onSuccess()
      handleClose()
    } catch (err) {
      console.error("Error updating group:", err)
      setError(err instanceof Error ? err.message : "Failed to update group")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={
        <div>
          <h3 className="mb-2 text-xl font-semibold">Edit Group</h3>
          <p className="text-xs font-normal text-white/65">Update group information</p>
        </div>
      }
      maxWidth="md">
      <div className="mt-2">
        {error && <ErrorMessage message={error} />}

        <div className="grid gap-4">
          <FormInput
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Enter Group Name"
            focusColor="border-cyan-500/60"
          />
        </div>

        <div className="mt-8 flex justify-end gap-3">
          <button
            onClick={handleClose}
            className="rounded-lg border border-white/10 bg-white/[0.02] px-4 py-2 text-[11px] font-medium text-white/70 transition-all duration-200 hover:border-white/25 hover:bg-white/5 active:scale-[0.97]">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!name.trim() || loading}
            className="min-w-[120px] rounded-lg border border-cyan-500/15 bg-cyan-500/5 px-6 py-2 text-[11px] font-bold tracking-wider text-cyan-400 transition-all duration-200 hover:border-cyan-500/25 hover:bg-cyan-500/15 active:scale-[0.97] disabled:opacity-50">
            {loading ? "Saving…" : "Update Group"}
          </button>
        </div>
      </div>
    </Modal>
  )
}
