import { Tooltip } from "./Tooltip"
import type { AttendanceMember } from "@/types/recognition"

interface MemberTooltipProps {
  member?: AttendanceMember | null
  children: React.ReactElement
  position?: "top" | "bottom" | "left" | "right"
  role?: string
}

export function MemberTooltip({ member, children, position = "right", role }: MemberTooltipProps) {
  const isRegistered = member?.has_face_data ?? false
  const memberRole = role || member?.role || "Member"

  const content = (
    <div className="flex min-w-[120px] flex-col items-center gap-1.5 p-1 text-center">
      <div className="flex flex-col items-center">
        <span className="text-[11px] font-medium text-white/55">{memberRole}</span>
      </div>

      <div className="flex items-center justify-center">
        <span
          className={`text-[11px] font-semibold ${
            isRegistered ? "text-cyan-400" : "text-white/55"
          }`}>
          {isRegistered ? "Registered" : "Not Registered"}
        </span>
      </div>

      {member?.email && (
        <div className="mt-0.5 flex items-center justify-center gap-2">
          <i className="fa-solid fa-envelope text-[10px] text-white/55"></i>
          <span className="max-w-[140px] truncate text-[11px] text-white/65">{member.email}</span>
        </div>
      )}
    </div>
  )

  return (
    <Tooltip content={content} position={position} delay={300}>
      {children}
    </Tooltip>
  )
}
