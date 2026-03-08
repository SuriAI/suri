import type { BulkRegistrationResult } from "@/components/group/modals/types"

interface RegistrationResultsProps {
  results: BulkRegistrationResult[]
  successCount: number
  failedCount: number
  onClose: () => void
}

export function RegistrationResults({
  results,
  successCount,
  failedCount,
  onClose,
}: RegistrationResultsProps) {
  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg border border-cyan-400/30 bg-linear-to-br from-cyan-500/10 to-cyan-600/5 p-6">
          <div className="mb-1 text-3xl font-light text-cyan-200">{successCount}</div>
          <div className="text-xs tracking-wide text-cyan-300/70 uppercase">Registered</div>
        </div>
        <div className="rounded-lg border border-red-400/30 bg-linear-to-br from-red-500/10 to-red-600/5 p-6">
          <div className="mb-1 text-3xl font-light text-red-200">{failedCount}</div>
          <div className="text-xs tracking-wide text-red-300/70 uppercase">Failed</div>
        </div>
      </div>

      {/* Details */}
      {results.length > 0 && (
        <div className="max-h-64 space-y-2 overflow-y-auto">
          {results.map((result, idx) => (
            <div
              key={idx}
              className={`flex items-start gap-3 rounded-lg border p-3 ${
                result.success ?
                  "border-cyan-400/20 bg-cyan-500/5"
                : "border-red-400/20 bg-red-500/5"
              }`}>
              <div
                className={`flex h-6 w-6 items-center justify-center rounded-lg text-sm ${
                  result.success ? "bg-cyan-500/20" : "bg-red-500/20"
                }`}>
                {result.success ? "✓" : "✕"}
              </div>
              <div className="min-w-0 flex-1">
                <div
                  className={`text-sm font-medium ${result.success ? "text-cyan-200" : "text-red-200"}`}>
                  {result.memberName || result.personId}
                </div>
                {result.error && <div className="mt-1 text-xs text-red-300/80">{result.error}</div>}
                {result.qualityWarning && (
                  <div className="mt-1 text-xs text-yellow-300/80">⚠️ {result.qualityWarning}</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <button
        onClick={onClose}
        className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/70 transition-all hover:bg-white/10 hover:text-white">
        Done
      </button>
    </div>
  )
}
