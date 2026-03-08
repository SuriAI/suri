import { useMemo, memo } from "react"
import { MemberTooltip } from "@/components/shared"
import { createDisplayNameMap } from "@/utils"
import type { DetectionResult, TrackedFace } from "@/components/main/types"
import type { AttendanceMember } from "@/types/recognition"
import type { ExtendedFaceRecognitionResponse } from "@/components/main/utils"

interface DetectionPanelProps {
  currentDetections: DetectionResult | null
  currentRecognitionResults: Map<number, ExtendedFaceRecognitionResponse>
  recognitionEnabled: boolean
  trackedFaces: Map<string, TrackedFace>
  groupMembers: AttendanceMember[]
  isStreaming: boolean
  isVideoLoading: boolean
}

const DetectionCard = memo(
  ({
    index,
    recognitionResult,
    isRecognized,
    displayName,
    member,
    trackedFace,
  }: {
    index: number
    recognitionResult: ExtendedFaceRecognitionResponse | undefined
    isRecognized: boolean
    displayName: string
    member?: AttendanceMember | null
    trackedFace: TrackedFace | undefined
  }) => {
    const getStatusStyles = () => {
      if (isRecognized) {
        return {
          textColor: "text-cyan-400",
        }
      }

      return {
        textColor: "text-white/40",
      }
    }

    const statusStyles = getStatusStyles()
    const hasName = isRecognized && recognitionResult?.person_id && displayName

    return (
      <div
        key={index}
        className={`min-h-10 rounded-lg border border-white/5 bg-white/2 p-2.5 transition-all ${trackedFace?.isLocked ? "border-cyan-500/30 bg-cyan-500/3" : ""} ${hasName ? "shadow-sm shadow-black/20" : ""} `}>
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            {hasName ?
              <MemberTooltip member={member} position="right" role="Recognized">
                <span
                  className={`cursor-help truncate text-sm font-semibold ${statusStyles.textColor}`}>
                  {displayName}
                </span>
              </MemberTooltip>
            : <span className="text-xs text-white/40 italic">Unknown</span>}
          </div>
        </div>
      </div>
    )
  },
)

DetectionCard.displayName = "DetectionCard"

export function DetectionPanel({
  currentDetections,
  currentRecognitionResults,
  recognitionEnabled,
  trackedFaces,
  groupMembers,
  isStreaming,
  isVideoLoading,
}: DetectionPanelProps) {
  const displayNameMap = useMemo(() => {
    return createDisplayNameMap(groupMembers)
  }, [groupMembers])

  const trackedFacesArray = useMemo(() => Array.from(trackedFaces.values()), [trackedFaces])

  const memberMap = useMemo(() => {
    const map = new Map<string, AttendanceMember>()
    groupMembers.forEach((m) => map.set(m.person_id, m))
    return map
  }, [groupMembers])

  const filteredFaces = useMemo(() => {
    if (!currentDetections?.faces) return []

    const faces = currentDetections.faces

    return [...faces].sort((a, b) => {
      const aIsLive = a.liveness?.status === "real"
      const bIsLive = b.liveness?.status === "real"

      if (aIsLive && !bIsLive) return -1 // a comes first
      if (!aIsLive && bIsLive) return 1 // b comes first
      return 0 // maintain original order for same status
    })
  }, [currentDetections])

  const hasDetections = filteredFaces.length > 0

  return (
    <>
      {!hasDetections ?
        <div className="flex min-h-0 flex-1 items-center justify-center">
          <div className="relative flex flex-col items-center gap-4">
            <div className="relative h-20 w-20">
              {isVideoLoading ?
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="h-14 w-14 animate-spin rounded-full border-2 border-white/20 border-t-white/60"></div>
                </div>
              : <>
                  <div
                    className={`absolute inset-0 rounded-xl border ${isStreaming ? "ai-pulse-ring border-cyan-500/30" : "border-white/20"}`}
                  />

                  <div className="absolute inset-1 overflow-hidden rounded-lg">
                    {isStreaming && (
                      <div className="ai-scan-line absolute right-0 left-0 h-0.5 bg-linear-to-r from-transparent via-cyan-400 to-transparent" />
                    )}

                    <svg
                      className={`h-full w-full p-4 ${isStreaming ? "text-cyan-400/50" : "animate-pulse text-white/30"}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                      />
                    </svg>
                  </div>

                  <div
                    className={`absolute top-0 left-0 h-3 w-3 rounded-tl-lg border-t-2 border-l-2 ${isStreaming ? "border-cyan-400/40" : "border-white/20"}`}
                  />
                  <div
                    className={`absolute top-0 right-0 h-3 w-3 rounded-tr-lg border-t-2 border-r-2 ${isStreaming ? "border-cyan-400/40" : "border-white/20"}`}
                  />
                  <div
                    className={`absolute bottom-0 left-0 h-3 w-3 rounded-bl-lg border-b-2 border-l-2 ${isStreaming ? "border-cyan-400/40" : "border-white/20"}`}
                  />
                  <div
                    className={`absolute right-0 bottom-0 h-3 w-3 rounded-br-lg border-r-2 border-b-2 ${isStreaming ? "border-cyan-400/40" : "border-white/20"}`}
                  />
                </>
              }
            </div>

            <div
              className={`text-[11px] font-bold transition-opacity duration-500 ${isStreaming ? "animate-pulse text-cyan-400/60" : "text-white/35"}`}>
              {isVideoLoading ?
                null
              : isStreaming ?
                "Tracking"
              : "Ready"}
            </div>
          </div>
        </div>
      : <div className="w-full space-y-1.5 py-2">
          {filteredFaces.map((face, index) => {
            const trackId = face.track_id!
            const recognitionResult = currentRecognitionResults.get(trackId)
            const isRecognized = recognitionEnabled && !!recognitionResult?.person_id
            const displayName =
              recognitionResult?.person_id ?
                displayNameMap.get(recognitionResult.person_id) || "Unknown"
              : ""

            const trackedFace = trackedFacesArray.find(
              (track) =>
                track.personId === recognitionResult?.person_id ||
                (Math.abs(track.bbox.x - face.bbox.x) < 30 &&
                  Math.abs(track.bbox.y - face.bbox.y) < 30),
            )

            return (
              <DetectionCard
                key={trackId}
                index={index}
                recognitionResult={recognitionResult}
                isRecognized={isRecognized}
                displayName={displayName}
                member={
                  recognitionResult?.person_id ? memberMap.get(recognitionResult.person_id) : null
                }
                trackedFace={trackedFace}
              />
            )
          })}
        </div>
      }
    </>
  )
}
