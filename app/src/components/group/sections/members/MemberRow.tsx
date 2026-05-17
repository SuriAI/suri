import { motion } from "framer-motion"
import { Tooltip } from "@/components/shared"
import type { AttendanceMember } from "@/types/recognition"
import { RegistrationAction } from "./RegistrationAction"

interface MemberRowProps {
  member: AttendanceMember & { displayName: string }
  isSelected?: boolean
  isSelectionMode?: boolean
  onToggleSelect?: (personId: string) => void
  onEdit: (member: AttendanceMember) => void
  onDelete: (member: AttendanceMember) => void
  onResetFace: (member: AttendanceMember) => void
}

export function MemberRow({
  member,
  isSelected,
  isSelectionMode,
  onToggleSelect,
  onEdit,
  onDelete,
  onResetFace,
}: MemberRowProps) {
  const isRegistered = !!member.has_face_data

  return (
    <motion.div
      layout
      onClick={() => onToggleSelect?.(member.person_id)}
      className={`group flex w-full items-center justify-between gap-4 border-b px-6 py-2.5 transition-all ${
        onToggleSelect ? "cursor-pointer" : ""
      } ${
        isSelected ?
          "border-cyan-500/20 bg-cyan-500/10"
        : "border-white/[0.03] hover:bg-white/[0.02]"
      }`}>
      <div className="flex min-w-0 flex-1 items-center">
        {onToggleSelect && (
          <div
            className={`flex shrink-0 items-center justify-center overflow-hidden transition-all duration-300 ${
              isSelected ? "w-8 pr-3 pl-1 opacity-100" : "w-0 px-0 opacity-0"
            }`}>
            <div
              className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors ${
                isSelected ? "border-cyan-500 bg-cyan-500 text-black" : "border-white/20 bg-white/5"
              }`}>
              {isSelected && <i className="fa-solid fa-check text-[10px]"></i>}
            </div>
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="mb-0.5 flex items-center gap-2 text-[13px] font-bold tracking-tight text-white/90">
            {member.displayName}
            {isRegistered && (
              <i
                className="fa-solid fa-face-smile text-[10px] text-cyan-400"
                title="Registered"></i>
            )}
            {!member.has_consent && (
              <span className="inline-flex items-center gap-1 rounded bg-amber-500/10 px-1.5 py-0.5 text-[8px] font-black tracking-widest text-amber-500/80 uppercase">
                No Consent
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 text-[11px] font-medium text-white/40">
            {member.role || "Member"}
            {member.email && (
              <div className="flex items-center gap-2">
                <span className="h-0.5 w-0.5 rounded-full bg-white/10" />
                {member.email}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-3">
        {!isSelectionMode && (
          <>
            {/* Row Actions (Ultra-Subtle) */}
            <div className="flex items-center gap-1 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
              <Tooltip content="Edit details">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onEdit(member)
                  }}
                  className="border-transparent bg-transparent p-1 text-white/20 transition-colors hover:bg-transparent hover:text-white">
                  <i className="fa-solid fa-pen text-[10px]"></i>
                </button>
              </Tooltip>

              {isRegistered && (
                <Tooltip content="Clear face data">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onResetFace(member)
                    }}
                    className="border-transparent bg-transparent p-1 text-white/20 transition-colors hover:bg-transparent hover:text-amber-500">
                    <i className="fa-solid fa-user-slash text-[10px]"></i>
                  </button>
                </Tooltip>
              )}

              <Tooltip content="Remove member">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onDelete(member)
                  }}
                  className="border-transparent bg-transparent p-1 text-white/20 transition-colors hover:bg-transparent hover:text-red-400">
                  <i className="fa-solid fa-trash-can text-[10px]"></i>
                </button>
              </Tooltip>
            </div>

            <div onClick={(e) => e.stopPropagation()}>
              <RegistrationAction memberId={member.person_id} isRegistered={isRegistered} />
            </div>
          </>
        )}
      </div>
    </motion.div>
  )
}
