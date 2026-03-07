import { Tooltip } from "./Tooltip";
import type { AttendanceMember } from "@/types/recognition";

interface MemberTooltipProps {
  member?: AttendanceMember | null;
  children: React.ReactElement;
  position?: "top" | "bottom" | "left" | "right";
  role?: string;
}

export function MemberTooltip({
  member,
  children,
  position = "right",
  role,
}: MemberTooltipProps) {
  const isRegistered = member?.has_face_data ?? false;
  const memberRole = role || member?.role || "Member";

  const content = (
    <div className="flex flex-col items-center gap-1.5 p-1 min-w-[120px] text-center">
      <div className="flex flex-col items-center">
        <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">
          {memberRole}
        </span>
      </div>

      <div className="flex items-center justify-center">
        <span
          className={`text-[10px] font-black uppercase tracking-widest ${
            isRegistered ? "text-cyan-400" : "text-white/30"
          }`}
        >
          {isRegistered ? "Registered" : "Not Registered"}
        </span>
      </div>

      {member?.email && (
        <div className="flex items-center justify-center gap-2 mt-0.5">
          <i className="fa-solid fa-envelope text-[9px] text-white/20"></i>
          <span className="text-[10px] text-white/50 truncate max-w-[140px]">
            {member.email}
          </span>
        </div>
      )}
    </div>
  );

  return (
    <Tooltip content={content} position={position} delay={300}>
      {children}
    </Tooltip>
  );
}
