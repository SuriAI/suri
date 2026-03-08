import type { CaptureSource } from "@/components/group/sections/registration/types"

interface CaptureControlsProps {
  source: CaptureSource
  setSource: (source: CaptureSource) => void
  hasRequiredFrame: boolean
}

export function CaptureControls({ source, setSource, hasRequiredFrame }: CaptureControlsProps) {
  return (
    <div className="flex flex-col space-y-4">
      <div className="flex shrink-0 gap-2">
        {(["upload", "live"] as CaptureSource[]).map((option) => (
          <button
            key={option}
            onClick={() => setSource(option)}
            disabled={hasRequiredFrame}
            className={`flex-1 rounded-lg px-4 py-2.5 text-[11px] font-bold transition-all ${
              source === option ?
                "border border-white/20 bg-white/10 text-white shadow-sm"
              : "border border-white/10 bg-white/5 text-white/40 hover:bg-white/10 hover:text-white/60"
            } disabled:cursor-not-allowed disabled:opacity-50`}>
            {option === "upload" ? "Upload" : "Camera"}
          </button>
        ))}
      </div>
    </div>
  )
}
