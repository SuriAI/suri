import type { AttendanceGroup, AttendanceMember } from "@/types/recognition"
import { useBulkRegistration } from "@/components/group/sections/registration/hooks/useBulkRegistration"
import { BulkUploadArea } from "@/components/group/shared"
import { FaceAssignmentGrid } from "@/components/group/sections/registration/components/FaceAssignmentGrid"
import { RegistrationResults } from "@/components/group/sections/registration/components/RegistrationResults"

interface BulkRegistrationProps {
  group: AttendanceGroup
  members: AttendanceMember[]
  onRefresh?: () => Promise<void> | void
  onClose: () => void
  className?: string
}

export function BulkRegistration({
  group,
  members,
  onRefresh,
  onClose,
  className,
}: BulkRegistrationProps) {
  const {
    uploadedFiles,
    detectedFaces,
    isDetecting,
    isRegistering,
    error,
    setError,
    registrationResults,
    availableMembers,
    pendingDuplicates,
    handleFilesSelected,
    handleConfirmDuplicates,
    handleCancelDuplicates,
    handleDismissDuplicates,
    handleAssignMember,
    handleUnassign,
    handleBulkRegister,
    handleClearFiles,
  } = useBulkRegistration(group, members, onRefresh)

  const assignedCount = detectedFaces.filter((f) => f.assignedPersonId).length
  const successCount = registrationResults?.filter((r) => r.success).length || 0
  const failedCount = registrationResults?.filter((r) => !r.success).length || 0

  return (
    <div className={`relative flex h-full flex-col overflow-hidden ${className ?? ""}`}>
      {/* Duplicate files dialog — floating, minimal */}
      {pendingDuplicates && (
        <>
          <div className="absolute inset-0 z-40 bg-black/60 backdrop-blur-[2px]" />

          <div className="absolute top-1/2 left-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 px-4">
            <div className="rounded-2xl bg-[#111318] px-6 py-5">
              {/* Header */}
              <div className="mb-1 flex items-center gap-2">
                <i className="fa-solid fa-triangle-exclamation text-[13px] text-amber-400" />
                <span className="text-[13px] font-semibold text-white">Duplicate files</span>
              </div>
              <p className="mb-4 pl-5 text-[11px] leading-relaxed text-white/45">
                {pendingDuplicates.duplicates.length} file
                {pendingDuplicates.duplicates.length !== 1 ? "s" : ""} already uploaded.
                {pendingDuplicates.newFiles.length > 0 &&
                  ` ${pendingDuplicates.newFiles.length} new file${pendingDuplicates.newFiles.length !== 1 ? "s" : ""} will be added.`}
              </p>

              {/* File list */}
              <div className="custom-scroll mb-5 max-h-28 space-y-0.5 overflow-y-auto pl-5">
                {pendingDuplicates.duplicates.map((file, idx) => (
                  <div key={idx} className="truncate text-[11px] text-white/35">
                    {file.name}
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-4">
                <button
                  onClick={() => void handleDismissDuplicates()}
                  className="text-[11px] font-medium text-white/40 transition-colors hover:text-white/70">
                  Cancel
                </button>
                {pendingDuplicates.newFiles.length > 0 && (
                  <button
                    onClick={() => void handleCancelDuplicates()}
                    className="text-[11px] font-medium text-white/55 transition-colors hover:text-white">
                    Skip duplicates
                  </button>
                )}
                <button
                  onClick={() => void handleConfirmDuplicates()}
                  className="text-[11px] font-semibold text-amber-400 transition-colors hover:text-amber-300">
                  Add anyway
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Error — inline, no border box */}
      {error && (
        <div className="flex shrink-0 items-center gap-2 px-8 pt-4 text-[11px] text-red-400">
          <i className="fa-solid fa-circle-exclamation text-[10px]" />
          <span className="flex-1">{error}</span>
          <button
            onClick={() => setError(null)}
            className="text-red-400/50 transition-colors hover:text-red-400">
            <i className="fa-solid fa-xmark text-[10px]" />
          </button>
        </div>
      )}

      {/* Main scroll area */}
      <div
        className={`custom-scroll flex-1 overflow-y-auto px-8 py-8 ${
          !registrationResults && uploadedFiles.length === 0 ? "flex flex-col justify-center" : ""
        }`}>
        {!registrationResults && (
          <BulkUploadArea
            uploadedCount={uploadedFiles.length}
            isDetecting={isDetecting}
            onFilesSelected={handleFilesSelected}
            onClear={handleClearFiles}
          />
        )}

        {detectedFaces.length > 0 && !registrationResults && (
          <FaceAssignmentGrid
            detectedFaces={detectedFaces}
            members={members}
            availableMembers={availableMembers}
            assignedCount={assignedCount}
            onAssignMember={handleAssignMember}
            onUnassign={handleUnassign}
          />
        )}

        {registrationResults && (
          <RegistrationResults
            results={registrationResults}
            successCount={successCount}
            failedCount={failedCount}
            onClose={onClose}
          />
        )}
      </div>

      {/* Sticky bottom — register CTA, only when faces are assigned */}
      {assignedCount > 0 && !registrationResults && (
        <div className="shrink-0 px-8 py-4">
          <button
            onClick={handleBulkRegister}
            disabled={isRegistering}
            className="flex w-full items-center justify-center gap-2.5 py-2.5 text-[13px] font-semibold text-cyan-400 transition-all hover:text-cyan-300 disabled:text-white/20">
            {isRegistering ?
              <>
                <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/15 border-t-cyan-400/60" />
                <span>
                  Registering {assignedCount} {assignedCount === 1 ? "face" : "faces"}…
                </span>
              </>
            : <span>
                Register {assignedCount} {assignedCount === 1 ? "Face" : "Faces"}
              </span>
            }
          </button>
        </div>
      )}
    </div>
  )
}
