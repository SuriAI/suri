import type { AttendanceMember } from "@/types/recognition"
import type { DetectedFace } from "@/components/group/sections/registration/types"
import { Dropdown } from "@/components/shared"

interface FaceAssignmentGridProps {
  detectedFaces: DetectedFace[]
  members: AttendanceMember[]
  availableMembers: AttendanceMember[]
  assignedCount: number
  onAssignMember: (faceId: string, personId: string) => void
  onUnassign: (faceId: string) => void
}

export function FaceAssignmentGrid({
  detectedFaces,
  members,
  availableMembers,
  assignedCount,
  onAssignMember,
  onUnassign,
}: FaceAssignmentGridProps) {
  return (
    <div className="flex flex-col gap-6">
      {/* Meta row — no pills, just inline text */}
      <div className="flex items-baseline gap-2 text-[11px]">
        <span className="font-semibold text-white">
          {assignedCount}
          <span className="text-white/30">/{detectedFaces.length}</span>
        </span>
        <span className="text-white/35">assigned</span>
        {availableMembers.length > 0 && (
          <>
            <span className="text-white/15">·</span>
            <span className="text-white/35">
              {availableMembers.length} {availableMembers.length === 1 ? "member" : "members"}{" "}
              remaining
            </span>
          </>
        )}
      </div>

      {/* Face grid — auto-fill, cards fill available width */}
      <div
        className="grid gap-x-5 gap-y-7"
        style={{ gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))" }}>
        {detectedFaces.map((face) => {
          const assignedMember =
            face.assignedPersonId ?
              members.find((m) => m.person_id === face.assignedPersonId)
            : null

          return (
            <div key={face.faceId} className="group flex flex-col gap-2">
              {/* Image — full bleed, rounded, no border */}
              <div className="relative aspect-square overflow-hidden rounded-xl">
                <img
                  src={face.previewUrl}
                  alt="Detected face"
                  className={`h-full w-full object-cover transition-all duration-300 ${
                    face.assignedPersonId ? "brightness-90" : "brightness-75"
                  }`}
                />

                {/* Quality warning — bottom overlay strip */}
                {!face.isAcceptable && (
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-amber-950/90 to-transparent px-3 py-2.5">
                    <div className="flex items-center gap-1.5 text-[10px] font-semibold text-amber-300">
                      <i className="fa-solid fa-triangle-exclamation text-[9px]" />
                      Low quality
                    </div>
                  </div>
                )}

                {/* Unassign on hover — subtle overlay button */}
                {face.assignedPersonId && (
                  <button
                    onClick={() => onUnassign(face.faceId)}
                    className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-all duration-200 group-hover:bg-black/40 group-hover:opacity-100">
                    <span className="text-[11px] font-semibold text-white/80">Change</span>
                  </button>
                )}
              </div>

              {/* Assignment label / dropdown — below image, no container */}
              {!face.assignedPersonId ?
                <Dropdown
                  options={availableMembers.map((m) => ({
                    value: m.person_id,
                    label: m.name,
                  }))}
                  value=""
                  onChange={(val) => val && onAssignMember(face.faceId, val as string)}
                  placeholder="Assign member…"
                  showPlaceholderOption={true}
                  allowClear={false}
                  buttonClassName="!py-1.5 !text-[11px] !bg-transparent !border-0 !border-b !border-white/10 !rounded-none !px-0 hover:!border-white/25 focus:!border-cyan-500/50 transition-colors"
                />
              : <div className="flex items-center justify-between px-0.5">
                  <span className="truncate text-[12px] font-semibold text-white">
                    {assignedMember?.name}
                  </span>
                </div>
              }
            </div>
          )
        })}
      </div>
    </div>
  )
}
