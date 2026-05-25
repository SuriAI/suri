import type { AttendanceMember } from "@/types/recognition"

interface EnrollmentStatusProps {
  members: AttendanceMember[]
}

export function EnrollmentStatus({ members }: EnrollmentStatusProps) {
  const total = members.length
  const enrolled = members.filter((member) => member.has_face_data).length

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-white/70">Enrolled:</span>
      {total === 0 ?
        <span className="text-sm text-white/65 italic">No members yet</span>
      : <span className="text-sm font-semibold text-white">
          {enrolled} out of {total} {total === 1 ? "member" : "members"}
        </span>
      }
    </div>
  )
}
