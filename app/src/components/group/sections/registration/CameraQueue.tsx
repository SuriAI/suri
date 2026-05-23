import { useState, useCallback, useEffect, useMemo, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { attendanceManager, backendService } from "@/services"
import type { AttendanceGroup, AttendanceMember } from "@/types/recognition"
import { useCamera } from "@/components/group/sections/registration/hooks/useCamera"
import { Dropdown, InfoPopover } from "@/components/shared"
import { dataUrlToBlob } from "@/utils/dataUrl"
import { CameraFeed } from "@/components/group/sections/registration/components/CameraFeed"

type CaptureStatus = "pending" | "capturing" | "processing" | "completed" | "skipped" | "error"

interface QueuedMember {
  personId: string
  name: string
  role?: string
  status: CaptureStatus
  error?: string
  qualityWarning?: string
  previewUrl?: string
}

interface CameraQueueProps {
  group: AttendanceGroup
  members: AttendanceMember[]
  preselectedIds?: string[]
  onRefresh?: () => Promise<void> | void
  onClose?: () => void
}

export function CameraQueue({
  group,
  members,
  preselectedIds,
  onRefresh,
  onClose,
}: CameraQueueProps) {
  const [memberQueue, setMemberQueue] = useState<QueuedMember[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [queueStarted, setQueueStarted] = useState(false)
  const autoAdvance = true
  const [memberSearch, setMemberSearch] = useState("")
  const [registrationFilter, setRegistrationFilter] = useState<
    "all" | "registered" | "non-registered"
  >("all")

  const {
    videoRef,
    cameraDevices,
    selectedCamera,
    setSelectedCamera,
    isStreaming,
    isVideoReady,
    cameraError,
    startCamera,
    stopCamera,
  } = useCamera()

  const captureCanvasRef = useRef<HTMLCanvasElement | null>(null)

  const currentMember = memberQueue[currentIndex]
  const totalMembers = memberQueue.length
  const completedMembers = memberQueue.filter(
    (m) => m.status === "completed" || m.status === "skipped",
  ).length
  const isQueueFinished = useMemo(() => {
    return (
      memberQueue.length > 0 &&
      memberQueue.every(
        (m) => m.status === "completed" || m.status === "skipped" || m.status === "error",
      )
    )
  }, [memberQueue])

  const findNextPendingIndex = useCallback((queue: QueuedMember[], startFrom: number): number => {
    // 1. Search after startFrom
    for (let i = startFrom + 1; i < queue.length; i++) {
      if (queue[i].status === "pending") {
        return i
      }
    }
    // 2. Search from the beginning up to startFrom
    for (let i = 0; i < startFrom; i++) {
      if (queue[i].status === "pending") {
        return i
      }
    }
    // 3. If no pending members, return -1 (meaning queue is finished)
    return -1
  }, [])

  useEffect(() => {
    if (isQueueFinished) {
      stopCamera()
    }
  }, [isQueueFinished, stopCamera])
  const memberOrderMap = useMemo(
    () => new Map(members.map((member, index) => [member.person_id, index])),
    [members],
  )
  const filteredMembers = useMemo(() => {
    let result = members
    if (memberSearch.trim()) {
      const query = memberSearch.toLowerCase()
      result = result.filter(
        (member) =>
          member.name.toLowerCase().includes(query) ||
          member.person_id.toLowerCase().includes(query),
      )
    }
    if (registrationFilter !== "all") {
      result = result.filter((member) => {
        const isRegistered = member.has_face_data ?? false
        return registrationFilter === "registered" ? isRegistered : !isRegistered
      })
    }
    return result
  }, [members, memberSearch, registrationFilter])

  const setupQueue = useCallback((selectedMembers: AttendanceMember[]) => {
    const queue: QueuedMember[] = selectedMembers.map((member) => ({
      personId: member.person_id,
      name: member.name,
      role: member.role,
      status: "pending" as CaptureStatus,
    }))
    setMemberQueue(queue)
    setCurrentIndex(0)
  }, [])

  // Auto-start if preselectedIds are provided (initial load only)
  useEffect(() => {
    if (memberQueue.length === 0 && preselectedIds && preselectedIds.length > 0) {
      const preselectedMembers = members.filter((m) => preselectedIds.includes(m.person_id))
      setupQueue(preselectedMembers)
      setQueueStarted(true)
    }
  }, [preselectedIds, members, setupQueue, memberQueue.length])

  useEffect(() => {
    if (totalMembers > 0 && completedMembers === totalMembers && !isProcessing) {
      setSuccessMessage(`All ${totalMembers} members registered successfully!`)
    }
  }, [completedMembers, totalMembers, isProcessing])

  const capturePhoto = useCallback(async () => {
    if (!videoRef.current || !currentMember) {
      return
    }

    if (!captureCanvasRef.current) {
      captureCanvasRef.current = document.createElement("canvas")
    }

    const video = videoRef.current
    const canvas = captureCanvasRef.current
    const width = video.videoWidth
    const height = video.videoHeight

    if (!width || !height) {
      return
    }

    // Check for member-level consent
    const memberRecord = members.find((m) => m.person_id === currentMember.personId)
    if (!memberRecord?.has_consent) {
      setError(`Cannot capture: ${currentMember.name} has not provided biometric consent.`)
      return
    }

    // Update status
    setMemberQueue((prev) =>
      prev.map((m, idx) =>
        idx === currentIndex ? { ...m, status: "capturing" as CaptureStatus } : m,
      ),
    )

    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext("2d")
    if (!ctx) {
      setError("Unable to capture from camera context.")
      return
    }

    // Mirror the capture to match preview
    ctx.scale(-1, 1)
    ctx.drawImage(video, -width, 0, width, height)

    const dataUrl = canvas.toDataURL("image/jpeg", 0.92)

    setIsProcessing(true)
    setError(null)

    try {
      const blob = dataUrlToBlob(dataUrl)

      const detection = await backendService.detectFaces(blob, {
        model_type: "face_detector",
      })

      if (!detection.faces || detection.faces.length === 0) {
        throw new Error("No face detected. Please face the camera directly with good lighting.")
      }

      const bestFace = detection.faces.reduce(
        (best, current) => ((current.confidence ?? 0) > (best.confidence ?? 0) ? current : best),
        detection.faces[0],
      )

      if (!bestFace.bbox) {
        throw new Error("Face detected but bounding box missing.")
      }

      if (bestFace.landmarks_5?.length !== 5) {
        throw new Error(
          "Face detected but landmarks are missing. Please ensure the face is clearly visible and try again.",
        )
      }

      setMemberQueue((prev) =>
        prev.map((m, idx) =>
          idx === currentIndex ?
            {
              ...m,
              status: "processing" as CaptureStatus,
              previewUrl: dataUrl,
            }
          : m,
        ),
      )

      const result = await attendanceManager.registerFaceForGroupPerson(
        group.id,
        currentMember.personId,
        blob,
        bestFace.bbox,
        bestFace.landmarks_5,
        false, // liveness check is NOT needed during registration
      )

      if (!result.success) {
        throw new Error(result.error || "Registration failed")
      }

      const updatedQueue = memberQueue.map((m, idx) =>
        idx === currentIndex ?
          {
            ...m,
            status: "completed" as CaptureStatus,
            qualityWarning:
              bestFace.confidence && bestFace.confidence < 0.8 ?
                "Low confidence - consider retaking"
              : undefined,
          }
        : m,
      )
      setMemberQueue(updatedQueue)

      if (autoAdvance) {
        const nextPending = findNextPendingIndex(updatedQueue, currentIndex)
        if (nextPending !== -1) {
          setTimeout(() => setCurrentIndex(nextPending), 1000)
        } else {
          // All done
          setSuccessMessage(`All ${totalMembers} members registered successfully!`)
          if (onRefresh) {
            await onRefresh()
          }
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Capture failed"
      setMemberQueue((prev) =>
        prev.map((m, idx) =>
          idx === currentIndex ?
            {
              ...m,
              status: "pending" as CaptureStatus,
              error: message,
            }
          : m,
        ),
      )
      setError(message)
    } finally {
      setIsProcessing(false)
    }
  }, [
    currentMember,
    currentIndex,
    memberQueue,
    group.id,
    autoAdvance,
    totalMembers,
    onRefresh,
    videoRef,
    members,
    findNextPendingIndex,
  ])

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!queueStarted || !currentMember || isQueueFinished) return

      if (e.key === " " || e.key === "Enter") {
        e.preventDefault()
        if (!isProcessing && isVideoReady) {
          const mRecord = members.find((m) => m.person_id === currentMember.personId)
          if (mRecord?.has_consent) {
            void capturePhoto()
          } else {
            setError(`Consent required for ${currentMember.name}`)
          }
        }
      } else if (e.key === "n" || e.key === "N" || e.key === "ArrowRight") {
        e.preventDefault()
        // Next member
        if (currentIndex < memberQueue.length - 1) {
          setCurrentIndex((prev) => prev + 1)
          setError(null)
        }
      } else if (e.key === "p" || e.key === "P" || e.key === "ArrowLeft") {
        e.preventDefault()
        // Previous member
        if (currentIndex > 0) {
          setCurrentIndex((prev) => prev - 1)
          setError(null)
        }
      } else if (e.key === "r" || e.key === "R") {
        e.preventDefault()
        // Retry current
        setMemberQueue((prev) =>
          prev.map((m, idx) =>
            idx === currentIndex ?
              { ...m, status: "pending" as CaptureStatus, error: undefined }
            : m,
          ),
        )
        setError(null)
      } else if (e.key === "s" || e.key === "S") {
        e.preventDefault()
        // Skip current member
        const updatedQueue = memberQueue.map((m, idx) =>
          idx === currentIndex ? { ...m, status: "skipped" as CaptureStatus } : m,
        )
        setMemberQueue(updatedQueue)
        const nextPending = findNextPendingIndex(updatedQueue, currentIndex)
        if (nextPending !== -1) {
          setCurrentIndex(nextPending)
        }
      }
    }

    window.addEventListener("keydown", handleKeyPress)
    return () => window.removeEventListener("keydown", handleKeyPress)
  }, [
    queueStarted,
    currentMember,
    isProcessing,
    isVideoReady,
    currentIndex,
    memberQueue,
    capturePhoto,
    members,
    isQueueFinished,
    findNextPendingIndex,
  ])

  // Automatically start camera in queue mode if queue is started and not already streaming
  useEffect(() => {
    let active = true
    if (queueStarted && currentMember && !isStreaming && !successMessage && !isQueueFinished) {
      const timer = setTimeout(() => {
        if (active) {
          startCamera()
        }
      }, 100)
      return () => clearTimeout(timer)
    }
    return () => {
      active = false
    }
  }, [queueStarted, currentMember, isStreaming, successMessage, startCamera, isQueueFinished])

  useEffect(() => () => stopCamera(), [stopCamera])

  return (
    <div className="flex h-full flex-col overflow-hidden text-white">
      {error && !queueStarted && (
        <div className="mx-6 mt-4 flex shrink-0 items-center gap-3 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          <div className="h-1 w-1 animate-pulse rounded-full bg-red-400" />
          <span className="flex-1">{error}</span>
          <button
            onClick={() => setError(null)}
            className="border-none bg-transparent p-0 text-red-200/50 shadow-none transition hover:text-red-100">
            <i className="fa fa-times text-xs"></i>
          </button>
        </div>
      )}

      {successMessage && !queueStarted && (
        <div className="mx-6 mt-4 flex shrink-0 items-center gap-3 rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-4 py-3 text-sm text-cyan-200">
          <div className="h-1 w-1 animate-pulse rounded-full bg-cyan-400" />
          <span className="flex-1">{successMessage}</span>
          {onClose && (
            <button
              onClick={onClose}
              className="rounded-lg border border-cyan-500/30 bg-cyan-500/25 px-3 py-1.5 text-xs font-bold text-cyan-400 transition hover:bg-cyan-500/35">
              Done
            </button>
          )}
        </div>
      )}

      <div className="relative min-h-0 flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          {!queueStarted ?
            <motion.div
              key="setup"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              className="absolute inset-0 flex min-h-0 flex-col">
              <div className="custom-scroll flex-1 overflow-y-auto px-6 py-6">
                <div className="space-y-6">
                  <div>
                    <div className="mb-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold text-white">
                          Select Members to Register
                        </h3>
                        <InfoPopover
                          title="Privacy & Data Protection"
                          description="Facial features are converted into encrypted numeric signatures stored strictly on this device. No raw photos are saved, and data is never shared with third parties."
                          details={[
                            "100% on-device processing",
                            "Encrypted face signature database",
                            "Revokable authorization at any time",
                          ]}
                          side="right"
                        />
                      </div>
                      <div className="flex items-center gap-3">
                        {memberQueue.length > 0 && (
                          <button
                            onClick={() => setupQueue([])}
                            className="text-xs text-white/55 transition hover:text-white/70">
                            Clear
                          </button>
                        )}
                        {memberQueue.length < members.length && (
                          <button
                            onClick={() => setupQueue(members)}
                            className="text-xs text-cyan-300 transition hover:text-cyan-200">
                            Select All
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex flex-wrap gap-2">
                        <div className="group/search relative h-9 min-w-55 flex-1">
                          <svg
                            className="absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-white/25 transition-colors group-focus-within/search:text-white/45"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                            />
                          </svg>
                          <input
                            type="search"
                            value={memberSearch}
                            onChange={(e) => setMemberSearch(e.target.value)}
                            placeholder="Search members..."
                            className="h-full w-full rounded-lg border border-white/5 bg-white/5 pr-3 pl-8.5 text-xs font-medium text-white transition-all duration-300 outline-none placeholder:text-white/30 focus:border-white/20 focus:bg-white/[0.08]"
                          />
                        </div>
                        <Dropdown
                          options={[
                            { value: "all", label: "Filter: All" },
                            { value: "non-registered", label: "Not Registered" },
                            { value: "registered", label: "Registered" },
                          ]}
                          value={registrationFilter}
                          onChange={(value) => {
                            if (value) {
                              setRegistrationFilter(
                                value as "all" | "registered" | "non-registered",
                              )
                            }
                          }}
                          buttonClassName="!bg-white/5 !border-white/5 py-2.5 px-3 h-full min-w-[130px] rounded-md text-[11px] font-bold tracking-wider text-white hover:!bg-white/[0.08] hover:!border-white/10 focus:!border-white/20 focus:!bg-white/[0.08]"
                          optionClassName="text-[11px] font-bold tracking-wider"
                          iconClassName="text-[10px]"
                          showPlaceholderOption={false}
                          allowClear={false}
                          className="min-w-42.5"
                        />
                      </div>

                      <div className="custom-scroll max-h-64 space-y-1.5 overflow-y-auto">
                        {members.length === 0 && (
                          <div className="rounded-lg border border-dashed border-white/5 bg-white/5 px-3 py-8 text-center">
                            <div className="text-xs text-white/55">No members yet</div>
                          </div>
                        )}

                        {members.length > 0 && filteredMembers.length === 0 && (
                          <div className="rounded-lg border border-white/5 bg-white/5 px-3 py-6 text-center">
                            <div className="text-xs text-white/55">
                              {memberSearch.trim() ?
                                `No results for "${memberSearch}"`
                              : registrationFilter === "registered" ?
                                "No registered members"
                              : registrationFilter === "non-registered" ?
                                "All members are registered"
                              : "No members found"}
                            </div>
                          </div>
                        )}

                        {filteredMembers.map((member) => {
                          const isInQueue = memberQueue.some((m) => m.personId === member.person_id)
                          const isRegistered = member.has_face_data ?? false
                          return (
                            <button
                              key={member.person_id}
                              type="button"
                              onClick={() => {
                                if (isInQueue) {
                                  const memberIndex = memberQueue.findIndex(
                                    (m) => m.personId === member.person_id,
                                  )
                                  setMemberQueue((prev) =>
                                    prev.filter((m) => m.personId !== member.person_id),
                                  )
                                  if (memberIndex !== -1 && memberIndex < currentIndex) {
                                    setCurrentIndex((prev) => Math.max(0, prev - 1))
                                  }
                                  return
                                }
                                const newMember: QueuedMember = {
                                  personId: member.person_id,
                                  name: member.name,
                                  role: member.role,
                                  status: "pending",
                                }
                                setMemberQueue((prev) => {
                                  const next = [...prev, newMember]
                                  return next.sort(
                                    (a, b) =>
                                      (memberOrderMap.get(a.personId) ?? 0) -
                                      (memberOrderMap.get(b.personId) ?? 0),
                                  )
                                })
                              }}
                              className={`group w-full rounded-lg border px-3 py-2 text-left transition-all ${
                                isInQueue ?
                                  "border-cyan-400/50 bg-linear-to-br from-cyan-500/10 to-cyan-500/5"
                                : "border-white/5 bg-white/5 hover:border-white/10 hover:bg-white/10"
                              }`}>
                              <div className="flex items-center justify-between gap-3">
                                <div className="min-w-0">
                                  <div className="truncate text-sm font-medium text-white">
                                    {member.name}
                                  </div>
                                  {member.role && (
                                    <div className="truncate text-xs text-white/55">
                                      {member.role}
                                    </div>
                                  )}
                                </div>
                                <div className="flex items-center gap-2">
                                  {isRegistered && (
                                    <span className="text-[11px] font-black tracking-wider text-cyan-400/80">
                                      Registered
                                    </span>
                                  )}
                                  {isInQueue && (
                                    <span className="text-xs text-cyan-300">Queued</span>
                                  )}
                                </div>
                              </div>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  </div>

                  {memberQueue.length === 0 && (
                    <div className="text-xs text-white/55">
                      Select at least one member to start.
                    </div>
                  )}

                  {memberQueue.length > 0 && (
                    <button
                      onClick={() => setQueueStarted(true)}
                      className="flex w-full items-center justify-center gap-2 rounded-lg border border-cyan-500/20 bg-cyan-500/10 px-4 py-3 text-[11px] font-bold tracking-wider text-cyan-400 transition-all hover:bg-cyan-500/20 active:scale-95">
                      Start Queue ({memberQueue.length})
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          : <motion.div
              key="queue-active"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              className="absolute inset-0 flex flex-col items-center justify-center gap-4 overflow-hidden p-6">
              <div className="relative aspect-video min-h-0 w-full max-w-4xl shrink overflow-hidden rounded-xl">
                {isQueueFinished ?
                  <div className="animate-in fade-in absolute inset-0 z-30 flex flex-col items-center justify-center p-8 duration-300">
                    <h3 className="mb-1 text-xl font-bold text-white">Queue Completed</h3>
                    <p className="mb-6 max-w-xs text-center text-[11px] text-white/55">
                      All selected members have been processed.
                    </p>

                    {/* Summary counts - Calm design borderless typography */}
                    <div className="mb-8 flex items-center gap-10">
                      <div className="text-center">
                        <div className="text-2xl font-black text-cyan-400">
                          {memberQueue.filter((m) => m.status === "completed").length}
                        </div>
                        <div className="mt-0.5 text-[9px] font-bold tracking-wider text-white/40 uppercase">
                          Registered
                        </div>
                      </div>
                      <div className="h-8 w-px bg-white/10" />
                      <div className="text-center">
                        <div className="text-2xl font-black text-white/60">
                          {memberQueue.filter((m) => m.status === "skipped").length}
                        </div>
                        <div className="mt-0.5 text-[9px] font-bold tracking-wider text-white/40 uppercase">
                          Skipped
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-center">
                      <button
                        onClick={onClose}
                        className="rounded-lg border border-cyan-500/30 bg-cyan-500/20 px-8 py-2.5 text-[11px] font-bold tracking-wider text-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.1)] transition-all hover:bg-cyan-500/30 active:scale-95">
                        Close Queue
                      </button>
                    </div>
                  </div>
                : <>
                    <CameraFeed
                      videoRef={videoRef}
                      isStreaming={isStreaming}
                      isVideoReady={isVideoReady}
                      cameraError={cameraError}
                      onStart={startCamera}
                      onStop={stopCamera}
                      source="live"
                      cameraDevices={cameraDevices}
                      selectedCamera={selectedCamera}
                      setSelectedCamera={setSelectedCamera}
                    />

                    {/* Privacy Shield Overlay */}
                    {(() => {
                      const mRec = members.find((m) => m.person_id === currentMember?.personId)
                      if (currentMember && !mRec?.has_consent && isStreaming) {
                        return (
                          <div className="animate-in fade-in absolute inset-0 z-5 flex items-center justify-center bg-black/60 duration-700">
                            <div className="flex flex-col items-center gap-4 text-white/20">
                              <div className="relative">
                                <i className="fa-solid fa-shield-halved text-7xl opacity-10"></i>
                                <div className="absolute inset-0 flex translate-y-2 items-center justify-center">
                                  <i className="fa-solid fa-lock text-xl text-white opacity-30"></i>
                                </div>
                              </div>
                              <div className="flex flex-col items-center gap-1">
                                <div className="text-[10px] font-medium opacity-20">
                                  Privacy Shield
                                </div>
                                <div className="text-[9px] font-medium tracking-tight text-white/20">
                                  Biometric Authorization Required
                                </div>
                              </div>
                            </div>
                          </div>
                        )
                      }
                      return null
                    })()}

                    <AnimatePresence mode="wait">
                      {currentMember && (
                        <motion.div
                          key={currentMember.personId}
                          initial={{ opacity: 0, y: -8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -8 }}
                          transition={{ duration: 0.22, ease: "easeOut" }}
                          className="pointer-events-none absolute top-0 right-0 left-0 z-20 flex flex-col items-start bg-gradient-to-b from-black/80 via-black/40 to-transparent px-8 pt-6 pb-12">
                          <span className="mb-0.5 text-[10px] font-bold tracking-[0.15em] text-cyan-400/80 uppercase">
                            Queue ({currentIndex + 1} of {totalMembers})
                          </span>
                          <h2 className="w-full max-w-[60%] truncate text-xl font-bold tracking-tight text-white sm:max-w-[70%] sm:text-2xl">
                            {currentMember.name}
                          </h2>
                          {currentMember.role && (
                            <div className="text-[11px] font-medium text-white/55">
                              {currentMember.role}
                            </div>
                          )}
                          {(() => {
                            const mRec = members.find((m) => m.person_id === currentMember.personId)
                            if (!mRec?.has_consent) {
                              return (
                                <div className="pointer-events-auto mt-2 flex items-center gap-1.5 rounded-lg border border-amber-500/20 bg-amber-500/5 px-2.5 py-1.5 text-[10px] font-medium text-amber-200/60 shadow-[0_0_15px_rgba(245,158,11,0.05)]">
                                  <i className="fa-solid fa-shield-slash text-[9px]"></i>
                                  Biometric Consent Missing
                                </div>
                              )
                            }
                            return null
                          })()}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <div className="absolute inset-y-0 left-2 z-10 flex items-center">
                      <button
                        onClick={() => {
                          if (currentIndex > 0) {
                            setCurrentIndex((prev) => prev - 1)
                            setError(null)
                          }
                        }}
                        disabled={currentIndex === 0}
                        className="rounded-full border border-white/5 bg-white/5 p-2 text-white/65 transition-all hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-30">
                        <i className="fa-solid fa-chevron-left text-sm"></i>
                      </button>
                    </div>
                    <div className="absolute inset-y-0 right-2 z-10 flex items-center">
                      <button
                        onClick={() => {
                          if (currentIndex < memberQueue.length - 1) {
                            setCurrentIndex((prev) => prev + 1)
                            setError(null)
                          }
                        }}
                        disabled={currentIndex >= memberQueue.length - 1}
                        className="rounded-full border border-white/5 bg-white/5 p-2 text-white/65 transition-all hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-30">
                        <i className="fa-solid fa-chevron-right text-sm"></i>
                      </button>
                    </div>

                    <AnimatePresence>
                      {currentMember &&
                        currentMember.status !== "pending" &&
                        currentMember.status !== "capturing" && (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.15 }}
                            className="absolute inset-0 z-20 flex items-center justify-center bg-black/40">
                            <motion.div
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.9 }}
                              transition={{ duration: 0.2, ease: "easeOut" }}
                              className="flex flex-col items-center text-center drop-shadow-[0_4px_12px_rgba(0,0,0,0.85)] select-none">
                              <div
                                className={`mb-3 text-5xl ${
                                  currentMember.status === "completed" ?
                                    "text-cyan-400"
                                  : "text-white/75"
                                }`}>
                                {currentMember.status === "completed" && (
                                  <i className="fa-solid fa-circle-check animate-pulse"></i>
                                )}
                                {currentMember.status === "skipped" && (
                                  <i className="fa-solid fa-forward"></i>
                                )}
                              </div>
                              <div className="text-xs font-black tracking-[0.2em] text-white uppercase">
                                {currentMember.status === "completed" && "Registered"}
                                {currentMember.status === "skipped" && "Skipped"}
                              </div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setMemberQueue((prev) =>
                                    prev.map((m, idx) =>
                                      idx === currentIndex ?
                                        { ...m, status: "pending" as CaptureStatus }
                                      : m,
                                    ),
                                  )
                                  setError(null)
                                }}
                                className="pointer-events-auto mt-4 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-[9px] font-bold tracking-wider text-white/60 transition-all hover:bg-white/10 hover:text-white">
                                Register Again
                              </button>
                            </motion.div>
                          </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Sleek, non-blocking glassmorphic warning toast at the bottom center of viewport */}
                    <AnimatePresence>
                      {error && (
                        <motion.div
                          initial={{ opacity: 0, y: 10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 10, scale: 0.95 }}
                          transition={{ duration: 0.22, ease: "easeOut" }}
                          className="pointer-events-auto absolute bottom-4 left-1/2 z-20 flex max-w-[85%] -translate-x-1/2 items-center gap-2 rounded-lg border border-red-500/30 bg-red-950/85 px-4 py-2.5 text-center text-[11px] font-medium text-red-200">
                          <i className="fa-solid fa-circle-exclamation shrink-0 text-sm text-red-400"></i>
                          <span>{error}</span>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </>
                }
              </div>

              {/* Bottom Control Bar */}
              {!isQueueFinished && (
                <div className="flex w-full max-w-4xl items-center justify-between px-4">
                  {/* Left: Skip Button */}
                  <div className="w-40">
                    <button
                      onClick={() => {
                        if (currentMember) {
                          const updatedQueue = memberQueue.map((m, idx) =>
                            idx === currentIndex ? { ...m, status: "skipped" as CaptureStatus } : m,
                          )
                          setMemberQueue(updatedQueue)
                          const nextPending = findNextPendingIndex(updatedQueue, currentIndex)
                          if (nextPending !== -1) {
                            setCurrentIndex(nextPending)
                          }
                        }
                      }}
                      disabled={!currentMember || isProcessing}
                      className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[11px] font-bold tracking-wider text-white/65 transition-all hover:border-white/20 hover:bg-white/10 hover:text-white disabled:opacity-40">
                      Skip
                    </button>
                  </div>

                  {/* Center: Circular Trigger */}
                  <div className="flex flex-1 justify-center">
                    <button
                      onClick={() => void capturePhoto()}
                      disabled={
                        !isVideoReady ||
                        isProcessing ||
                        !currentMember ||
                        !!cameraError ||
                        !members.find((m) => m.person_id === currentMember?.personId)?.has_consent
                      }
                      className="group flex h-16 w-16 items-center justify-center rounded-full bg-white/10 p-1 transition-all hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-40"
                      title="Capture Face">
                      {isProcessing ?
                        <div className="flex h-full w-full items-center justify-center rounded-full bg-white/10">
                          <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                        </div>
                      : (() => {
                          const mRec = members.find((m) => m.person_id === currentMember?.personId)
                          if (currentMember && !mRec?.has_consent) {
                            return (
                              <div className="flex h-full w-full items-center justify-center rounded-full bg-white/5 text-white/25">
                                <i className="fa-solid fa-lock text-sm"></i>
                              </div>
                            )
                          }
                          return (
                            <div className="h-full w-full rounded-full bg-white shadow-[0_0_15px_rgba(255,255,255,0.3)] transition-transform group-active:scale-90" />
                          )
                        })()
                      }
                    </button>
                  </div>

                  {/* Right: Controls & Shortcuts Cluster */}
                  <div className="flex w-40 items-center justify-end gap-3">
                    {/* Keyboard shortcuts - Compact guide on the right side */}
                    <div className="flex shrink-0 flex-col items-end gap-1 text-[9px] leading-tight font-medium text-white/45">
                      <div className="flex items-center gap-1">
                        <kbd className="rounded bg-white/10 px-1 py-0.5 text-white/65">Space</kbd>
                        <span>Capture</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <kbd className="rounded bg-white/10 px-1 py-0.5 text-white/65">←</kbd>
                        <kbd className="rounded bg-white/10 px-1 py-0.5 text-white/65">→</kbd>
                        <span>Navigate</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <kbd className="rounded bg-white/10 px-1 py-0.5 text-white/65">S</kbd>
                        <span>Skip</span>
                        <kbd className="ml-1 rounded bg-white/10 px-1 py-0.5 text-white/65">R</kbd>
                        <span>Reset</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          }
        </AnimatePresence>
      </div>
    </div>
  )
}
