interface StatsCardProps {
  type: "present" | "absent" | "late" | "active"
  value: number
  total?: number
  label?: string
}

export function StatsCard({ type, value, total, label }: StatsCardProps) {
  return (
    <div className="flex flex-col gap-3 py-6">
      <p className="text-[11px] font-black tracking-wider text-white/35 uppercase">{label}</p>
      <div className="flex items-baseline gap-1.5">
        <span className="text-4xl font-semibold tracking-tight text-white">{value ?? 0}</span>
        {total !== undefined && (type === "present" || type === "absent") && (
          <span className="text-xl font-bold text-white/40">/ {total}</span>
        )}
      </div>
    </div>
  )
}
