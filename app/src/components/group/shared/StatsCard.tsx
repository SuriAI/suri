interface StatsCardProps {
  type: "present" | "absent" | "late" | "active";
  value: number;
  total?: number;
  label?: string;
}

export function StatsCard({ type, value, total, label }: StatsCardProps) {
  return (
    <div className="flex flex-col gap-3 py-6">
      <p className="text-[11px] font-black text-white/35 uppercase tracking-wider">
        {label}
      </p>
      <div className="flex items-baseline gap-1.5">
        <span className="text-4xl font-semibold text-white tracking-tight">
          {value ?? 0}
        </span>
        {total !== undefined && (type === "present" || type === "absent") && (
          <span className="text-white/40 font-bold text-xl">/ {total}</span>
        )}
      </div>
    </div>
  );
}
