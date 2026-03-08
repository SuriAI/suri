import type { AttendanceMember } from "@/types/recognition"
import type { DetectedFace } from "@/components/group/sections/registration/types"

interface FaceAssignmentGridProps {
  detectedFaces: DetectedFace[]
  members: AttendanceMember[]
  availableMembers: AttendanceMember[]
  assignedCount: number
  isRegistering: boolean
  onAssignMember: (faceId: string, personId: string) => void
  onUnassign: (faceId: string) => void
  onBulkRegister: () => void
}

export function FaceAssignmentGrid({
  detectedFaces,
  members,
  availableMembers,
  assignedCount,
  isRegistering,
  onAssignMember,
  onUnassign,
  onBulkRegister,
}: FaceAssignmentGridProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="text-2xl font-light text-white">
            {assignedCount}
            <span className="text-white/20">/{detectedFaces.length}</span>
          </div>
          <div className="text-[11px] font-medium text-white/40">assigned</div>
        </div>
        <div className="text-[11px] font-medium text-white/40">
          {availableMembers.length} members available
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
        {detectedFaces.map((face) => {
          const assignedMember =
            face.assignedPersonId ?
              members.find((m) => m.person_id === face.assignedPersonId)
            : null

          return (
            <div
              key={face.faceId}
              className={`group overflow-hidden rounded-lg border transition-all ${
                face.assignedPersonId ?
                  "border-cyan-400/40 bg-linear-to-br from-cyan-500/10 to-cyan-600/5"
                : face.isAcceptable ? "border-white/10 bg-white/5 hover:border-white/20"
                : "border-amber-400/30 bg-amber-500/5"
              }`}>
              <div className="relative aspect-square">
                <img
                  src={face.previewUrl}
                  alt="Detected face"
                  className="h-full w-full object-cover"
                />
                <div className="absolute top-2 right-2 flex items-center rounded-full border border-white/5 bg-black/80 p-1.5 shadow-sm">
                  <div
                    className={`h-2 w-2 rounded-full ${face.confidence > 0.8 ? "bg-cyan-400/80 shadow-[0_0_8px_rgba(34,211,238,0.3)]" : "bg-amber-400/80 shadow-[0_0_8px_rgba(251,191,36,0.3)]"}`}
                    title={face.confidence > 0.8 ? "High Confidence" : "Low Confidence"}
                  />
                </div>
                {!face.isAcceptable && (
                  <div className="absolute right-2 bottom-2 left-2 translate-z-0 transform rounded-lg bg-amber-500/90 px-2 py-1.5 text-center shadow-lg">
                    <div className="flex items-center justify-center gap-1.5 text-[11px] font-bold text-black">
                      <i className="fa-solid fa-triangle-exclamation text-[10px]"></i>
                      Quality Issue
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-2 p-3">
                {!face.assignedPersonId ?
                  <div className="relative">
                    <select
                      value=""
                      onChange={(e) => onAssignMember(face.faceId, e.target.value)}
                      className="w-full cursor-pointer appearance-none rounded-lg border border-white/10 bg-white/5 px-2.5 py-2 pr-7 text-xs text-white transition-all focus:border-cyan-400/50 focus:bg-white/10 focus:outline-none"
                      style={{ colorScheme: "dark" }}>
                      <option value="" className="bg-black text-white">
                        Select member...
                      </option>
                      {availableMembers.map((member) => (
                        <option
                          key={member.person_id}
                          value={member.person_id}
                          className="bg-black text-white">
                          {member.name}
                        </option>
                      ))}
                    </select>
                    {/* Custom dropdown arrow */}
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                      <svg
                        className="h-2.5 w-2.5 text-white/50 transition-colors duration-200"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2.5}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </div>
                  </div>
                : <div className="flex items-center gap-2 rounded-lg border border-cyan-400/20 bg-cyan-500/10 p-2">
                    <div className="flex-1 truncate text-[11px] font-semibold text-cyan-200">
                      {assignedMember?.name}
                    </div>
                    <button
                      onClick={() => onUnassign(face.faceId)}
                      className="flex h-6 w-6 items-center justify-center rounded-lg bg-white/5 text-white/50 transition hover:bg-red-500/20 hover:text-red-300">
                      <svg
                        className="h-3 w-3"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                }
              </div>
            </div>
          )
        })}
      </div>

      {assignedCount > 0 && (
        <button
          onClick={onBulkRegister}
          disabled={isRegistering}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-cyan-500/20 bg-cyan-500/10 px-4 py-4 text-sm font-medium text-cyan-400 transition-all hover:bg-cyan-500/20 active:scale-95 disabled:border-white/10 disabled:bg-white/5 disabled:text-white/20">
          {isRegistering ?
            <>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
              <span>Registering {assignedCount} faces...</span>
            </>
          : <>
              <span className="text-lg">✓</span>
              <span>
                Register {assignedCount} {assignedCount === 1 ? "Face" : "Faces"}
              </span>
            </>
          }
        </button>
      )}
    </div>
  )
}
