import type { AttendanceMember } from "../../types/recognition";

interface RegistrationStatusProps {
  members: AttendanceMember[];
}

export function RegistrationStatus({ members }: RegistrationStatusProps) {
  const total = members.length;
  const registered = members.filter((member) => member.has_face_data).length;
  const progress = total > 0 ? (registered / total) * 100 : 0;

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2">
        <span className="text-sm text-white/70">Registered:</span>
        <span className="text-sm font-semibold text-white">
          {registered}/{total}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-20 h-1.5 bg-white/10 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ${
              progress === 100
                ? "bg-[#00ff88]"
                : progress > 0
                  ? "bg-[#fbbf24]"
                  : "bg-white/30"
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="text-xs text-white/50 min-w-[2.5rem]">
          {Math.round(progress)}%
        </span>
      </div>
    </div>
  );
}

