import { Tooltip } from "./Tooltip"
import type { AttendanceMember } from "@/types/recognition"

interface MemberTooltipProps {
  member?: AttendanceMember | null
  children: React.ReactElement
  position?: "top" | "bottom" | "left" | "right"
  role?: string
  showEnrollment?: boolean
}

export function MemberTooltip({
  member,
  children,
  position = "right",
  role,
  showEnrollment = true,
}: MemberTooltipProps) {
  const isEnrolled = member?.has_face_data ?? false
  const memberRole = role || member?.role || "Member"

  const hasMultipleLines = showEnrollment || !!member?.email

  const content =
    hasMultipleLines ?
      <div className="flex flex-col items-center gap-0.5 text-center">
        <span className="text-[10px] font-medium text-white/90">{memberRole}</span>
        {showEnrollment && (
          <span
            className={`text-[10px] font-semibold ${isEnrolled ? "text-cyan-400" : "text-white/45"}`}>
            {isEnrolled ? "Enrolled" : "Not Enrolled"}
          </span>
        )}

        {member?.email && (
          <span className="mt-0.5 max-w-[140px] truncate text-[9px] text-white/45">
            {member.email}
          </span>
        )}
      </div>
    : memberRole

  return (
    <Tooltip content={content} position={position} delay={300}>
      {children}
    </Tooltip>
  )
}
