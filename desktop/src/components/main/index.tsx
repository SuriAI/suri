import {
  useState,
  useEffect,
  useRef,
  useCallback,
} from "react";
import { Settings, type QuickSettings } from "../settings";
import type { GroupSection } from "../group";
import { attendanceManager } from "../../services/AttendanceManager";
import { ControlBar } from "./components/ControlBar";
import { VideoCanvas } from "./components/VideoCanvas";
import { Sidebar } from "./components/Sidebar";
import { GroupManagementModal } from "./components/GroupManagementModal";
import { DeleteConfirmationModal } from "./components/DeleteConfirmationModal";
import type {
  TrackedFace,
  DetectionResult,
} from "./types";
import type { ExtendedFaceRecognitionResponse } from "./utils/recognitionHelpers";

export type { ExtendedFaceRecognitionResponse };

// Import all hooks
import { useStreamState } from "./hooks/useStreamState";
import { useAttendanceCooldown } from "./hooks/useAttendanceCooldown";
import { useVideoStream } from "./hooks/useVideoStream";
import { useOverlayRendering } from "./hooks/useOverlayRendering";
import { useFaceDetection } from "./hooks/useFaceDetection";
import { useFaceRecognition } from "./hooks/useFaceRecognition";
import { useFaceTracking } from "./hooks/useFaceTracking";
import { useAttendanceGroups } from "./hooks/useAttendanceGroups";
import { useBackendService } from "./hooks/useBackendService";
import { BackendService } from "../../services/BackendService";
import { cleanupStream, cleanupVideo, cleanupAnimationFrame } from "./utils/cleanupHelpers";
import { resetDetectionState, resetFrameCounters } from "./utils/stateResetHelpers";

export default function Main() {
  // ===== REFS (Created in main, passed to hooks) =====
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | undefined>(undefined);
  const backendServiceRef = useRef<BackendService | null>(null);
  const isProcessingRef = useRef<boolean>(false);
  const isStreamingRef = useRef<boolean>(false);
  const lastDetectionFrameRef = useRef<ArrayBuffer | null>(null);
  const frameCounterRef = useRef(0);
  const skipFramesRef = useRef(0);

  const lastStartTimeRef = useRef<number>(0);
  const lastStopTimeRef = useRef<number>(0);
  const isStartingRef = useRef<boolean>(false);
  const isStoppingRef = useRef<boolean>(false);

  const lastDetectionRef = useRef<DetectionResult | null>(null);
  const lastFrameTimestampRef = useRef<number>(0);
  const processCurrentFrameRef = useRef<() => Promise<void>>(async () => {});
  const fpsTrackingRef = useRef({
    timestamps: [] as number[],
    maxSamples: 10,
    lastUpdateTime: Date.now(),
  });

  const backendServiceReadyRef = useRef(false);
  const isScanningRef = useRef(false);
  const videoRectRef = useRef<DOMRect | null>(null);
  const lastVideoRectUpdateRef = useRef<number>(0);

  // ===== STATE (UI-related, stays in main) =====
  const [isStreaming, setIsStreaming] = useState(false);
  const [isVideoLoading, setIsVideoLoading] = useState(false);
  const [, setCameraActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [isSettingsFullScreen, setIsSettingsFullScreen] = useState(false);
  const [groupInitialSection, setGroupInitialSection] = useState<
    GroupSection | undefined
  >(undefined);
  const [quickSettings, setQuickSettings] = useState<QuickSettings>({
    cameraMirrored: true,
    showFPS: false,
    showPreprocessing: false,
    showBoundingBoxes: true,
    showRecognitionNames: true,
    showLandmarks: true,
  });
  const [trackingMode, setTrackingMode] = useState<"auto" | "manual">("auto");
  const [attendanceCooldownSeconds, setAttendanceCooldownSeconds] =
    useState<number>(10);
  const [enableSpoofDetection, setEnableSpoofDetection] = useState<boolean>(
    () => {
      const saved = localStorage.getItem("suri_enable_spoof_detection");
      return saved !== null ? saved === "true" : true;
    },
  );
  const [trackedFaces, setTrackedFaces] = useState<Map<string, TrackedFace>>(
    new Map(),
  );

  const attendanceEnabled = true;
  const recognitionEnabled = true;

  // ===== HOOKS INITIALIZATION =====
  
  // 1. Stream State Hook (refs declared above, passed to hook)
  useStreamState({
    setIsStreaming,
    isProcessingRef,
    animationFrameRef,
    isScanningRef,
    isStreamingRef,
    isStartingRef,
    isStoppingRef,
    lastStartTimeRef,
    lastStopTimeRef,
  });

  // 2. Attendance Cooldown Hook
  const {
    persistentCooldowns,
    setPersistentCooldowns,
    persistentCooldownsRef,
  } = useAttendanceCooldown(attendanceCooldownSeconds);

  // 3. Face Tracking Hook
  const { calculateAngleConsistencyRef } = useFaceTracking({
    trackedFaces,
    setTrackedFaces,
  });

  // 4. Attendance Groups Hook
  const {
    currentGroup,
    setCurrentGroup,
    currentGroupRef,
    memberCacheRef,
    attendanceGroups,
    groupMembers,
    recentAttendance,
    showGroupManagement,
    setShowGroupManagement,
    showDeleteConfirmation,
    groupToDelete,
    newGroupName,
    setNewGroupName,
    loadAttendanceDataRef,
    handleSelectGroup,
    handleCreateGroup,
    handleDeleteGroup,
    confirmDeleteGroup,
    cancelDeleteGroup,
  } = useAttendanceGroups({
    setError,
    setAttendanceCooldownSeconds,
  });

  // 5. Video Stream Hook (isVideoLoading and setCameraActive declared above)
  const {
    cameraDevices,
    selectedCamera,
    setSelectedCamera,
    captureFrame,
    getCameraDevices,
  } = useVideoStream({
    videoRef,
    canvasRef,
    isStreamingRef,
    isScanningRef,
    setIsStreaming,
    setError,
    setCameraActive,
    videoRectRef,
    lastVideoRectUpdateRef,
    isStartingRef,
  });

  // 6. Face Detection Hook (refs declared above, passed to hook)
  const {
    detectionFps,
    setDetectionFps,
    currentDetections,
    setCurrentDetections,
  } = useFaceDetection({
    backendServiceRef,
    isScanningRef,
    isStreamingRef,
    captureFrame,
    lastDetectionFrameRef,
    frameCounterRef,
    skipFramesRef,
    lastFrameTimestampRef,
    lastDetectionRef,
    processCurrentFrameRef,
    fpsTrackingRef,
  });

  // 7. Face Recognition Hook
  const {
    currentRecognitionResults,
    setCurrentRecognitionResults,
    performFaceRecognition,
  } = useFaceRecognition({
    backendServiceRef,
    currentGroupRef,
    memberCacheRef,
    trackingMode,
    attendanceCooldownSeconds,
    attendanceEnabled,
    setTrackedFaces,
    calculateAngleConsistencyRef,
    persistentCooldownsRef,
    setPersistentCooldowns,
    setError,
    loadAttendanceDataRef,
  });

  // 8. Overlay Rendering Hook
  const { getVideoRect, calculateScaleFactors, animate, resetOverlayRefs } = useOverlayRendering({
    videoRef,
    overlayCanvasRef,
    currentDetections,
    isStreaming,
    currentRecognitionResults,
    recognitionEnabled,
    persistentCooldowns,
    attendanceCooldownSeconds,
    quickSettings,
    animationFrameRef,
    videoRectRef,
    lastVideoRectUpdateRef,
  });

  // ===== FUNCTIONS THAT STAY IN MAIN =====
  
  // 9. Backend Service Hook (stopCamera will be passed later via ref pattern)
  const stopCameraRef = useRef<((forceCleanup: boolean) => void) | null>(null);
  
  const {
    initializeWebSocket,
  } = useBackendService({
    backendServiceRef,
    isStreamingRef,
    isScanningRef,
    isStartingRef,
    setError,
    setIsStreaming,
    setIsVideoLoading,
    setCameraActive,
    enableSpoofDetection,
    recognitionEnabled,
    performFaceRecognition,
    setCurrentDetections,
    setDetectionFps,
    lastDetectionFrameRef,
    lastFrameTimestampRef,
    lastDetectionRef,
    fpsTrackingRef,
    skipFramesRef,
    processCurrentFrameRef,
    stopCamera: stopCameraRef,
    animationFrameRef,
    streamRef,
    videoRef,
    backendServiceReadyRef,
  });


  const startCamera = useCallback(async () => {
    try {
      const now = Date.now();
      const timeSinceLastStart = now - lastStartTimeRef.current;
      const timeSinceLastStop = now - lastStopTimeRef.current;

      if (isStartingRef.current || isStreamingRef.current) {
        return;
      }

      if (timeSinceLastStop < 100 || timeSinceLastStart < 200) {
        return;
      }

      isStartingRef.current = true;
      lastStartTimeRef.current = now;
      isStreamingRef.current = true;
      setIsStreaming(true);
      setIsVideoLoading(true);
      setError(null);

      const currentStatus = backendServiceRef.current?.getWebSocketStatus() || "disconnected";
      if (currentStatus !== "connected") {
        try {
          setError("Connecting to detection service...");
          await initializeWebSocket();
          setError(null);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : "Unknown error";
          setError(`Failed to connect to detection service: ${errorMessage}`);
          isStreamingRef.current = false;
          setIsStreaming(false);
          setIsVideoLoading(false);
          isStartingRef.current = false;
          return;
        }
      }

      await getCameraDevices();

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }

      const constraints: MediaStreamConstraints = {
        video: {
          deviceId: selectedCamera ? { exact: selectedCamera } : undefined,
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;

        const waitForVideoReady = () => {
          return new Promise<void>((resolve) => {
            const video = videoRef.current;
            if (!video) {
              resolve();
              return;
            }

            const checkVideoReady = () => {
              if (video.videoWidth > 0 && video.videoHeight > 0) {
                resolve();
              } else {
                setTimeout(checkVideoReady, 16);
              }
            };

            video
              .play()
              .then(() => {
                checkVideoReady();
              })
              .catch(() => {
                checkVideoReady();
              });
          });
        };

        await waitForVideoReady();
        setIsVideoLoading(false);
        setCameraActive(true);

        resetFrameCounters(frameCounterRef, skipFramesRef, lastFrameTimestampRef);

        isScanningRef.current = true;
        backendServiceReadyRef.current = true;
        
        if (backendServiceRef.current?.isWebSocketReady()) {
          processCurrentFrameRef.current();
        }
      }
    } catch (err) {
      console.error("Error starting camera:", err);
      setError("Failed to start camera. Please check permissions.");
      isStreamingRef.current = false;
      isScanningRef.current = false;
      setIsStreaming(false);
      setIsVideoLoading(false);
      setCameraActive(false);
    } finally {
      isStartingRef.current = false;
    }
  }, [selectedCamera, getCameraDevices, initializeWebSocket]);

  // Set the ref after stopCamera is defined
  const stopCamera = useCallback((forceCleanup: boolean = false) => {
    const now = Date.now();
    const timeSinceLastStop = now - lastStopTimeRef.current;

    if (!forceCleanup) {
      if (isStoppingRef.current || !isStreamingRef.current) {
        return;
      }

      if (timeSinceLastStop < 100) {
        return;
      }
    }

    isStoppingRef.current = true;
    lastStopTimeRef.current = now;

    isScanningRef.current = false;

    cleanupStream(streamRef);
    cleanupVideo(videoRef, !forceCleanup);

    isStreamingRef.current = false;
    isProcessingRef.current = false;
    setIsStreaming(false);
    setIsVideoLoading(false);
    setCameraActive(false);

    cleanupAnimationFrame(animationFrameRef);

    lastDetectionFrameRef.current = null;
    resetDetectionState(
      setCurrentDetections,
      setCurrentRecognitionResults,
      setTrackedFaces,
      lastDetectionRef
    );

    setDetectionFps(0);
    fpsTrackingRef.current = {
      timestamps: [],
      maxSamples: 10,
      lastUpdateTime: Date.now(),
    };

    resetFrameCounters(frameCounterRef, skipFramesRef, lastFrameTimestampRef);

    resetOverlayRefs();

    const overlayCanvas = overlayCanvasRef.current;
    if (overlayCanvas) {
      const ctx = overlayCanvas.getContext("2d");
      if (ctx) {
        ctx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
      }
    }

    isStoppingRef.current = false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Set the ref after stopCamera is defined
  useEffect(() => {
    stopCameraRef.current = stopCamera;
  }, [stopCamera]);

  const cleanupOnUnload = useCallback(() => {
    try {
      cleanupStream(streamRef);
      cleanupVideo(videoRef, true);
      cleanupAnimationFrame(animationFrameRef);

      if (backendServiceRef.current) {
        try {
          const wsStatus = backendServiceRef.current.getWebSocketStatus();
          if (wsStatus === "connected" || wsStatus === "connecting") {
            backendServiceRef.current.disconnect();
          }
        } catch {
          // Ignore cleanup errors
        }
      }

      isStreamingRef.current = false;
      isScanningRef.current = false;
      isProcessingRef.current = false;
      isStartingRef.current = false;
      isStoppingRef.current = false;
      backendServiceReadyRef.current = false;
    } catch {
      // Ignore cleanup errors
    }
  }, []);

  const handleManualLog = async (
    personId: string,
    _name: string,
    confidence: number,
  ) => {
    try {
      const attendanceEvent = await attendanceManager.processAttendanceEvent(
        personId,
        confidence,
        "LiveVideo Camera - Manual Log",
      );

      if (attendanceEvent) {
        setTimeout(async () => {
          await loadAttendanceDataRef.current();
        }, 100);
      }
      setError(null);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      console.error(`Manual attendance logging failed:`, errorMessage);
      setError(errorMessage || "Failed to log attendance manually");
    }
  };

  const handleOpenSettingsForRegistration = useCallback(() => {
    setGroupInitialSection("members");
    setShowSettings(true);
  }, []);

  // ===== REMAINING USEEFFECTS =====

  // Animation loop
  useEffect(() => {
    if (isStreaming) {
      animate();
    }
    return () => {
      cleanupAnimationFrame(animationFrameRef);
    };
  }, [isStreaming, animate]);

  // Group change reset
  useEffect(() => {
    resetDetectionState(
      setCurrentDetections,
      setCurrentRecognitionResults,
      setTrackedFaces,
      lastDetectionRef
    );

    if (isStreamingRef.current) {
      stopCamera(false);
    }
  }, [currentGroup, stopCamera, setCurrentRecognitionResults, setTrackedFaces, setCurrentDetections, isStreamingRef]);

  // Cleanup on unload
  useEffect(() => {
    let cleanupExecuted = false;

    const performCleanup = () => {
      if (cleanupExecuted) return;
      cleanupExecuted = true;
      cleanupOnUnload();
    };

    const handleBeforeUnload = () => {
      performCleanup();
    };

    const handlePageHide = () => {
      performCleanup();
    };

    window.addEventListener("beforeunload", handleBeforeUnload, { capture: true });
    window.addEventListener("pagehide", handlePageHide, { capture: true });
    window.addEventListener("unload", handlePageHide, { capture: true });

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload, { capture: true });
      window.removeEventListener("pagehide", handlePageHide, { capture: true });
      window.removeEventListener("unload", handlePageHide, { capture: true });
    };
  }, [cleanupOnUnload]);

  // ===== RENDER =====
  return (
    <div className="pt-9 pb-5 h-screen bg-black text-white flex flex-col overflow-hidden">
      {error && (
        <div className="mx-4 mt-3 bg-red-900 border border-red-600 p-3 rounded text-red-200">
          {error}
        </div>
      )}

      <div className="flex-1 flex min-h-0">
        <div className="flex-1 flex flex-col min-h-0">
          <div className="relative flex flex-1 min-h-0 items-center justify-center px-4 pt-4">
            <VideoCanvas
              videoRef={videoRef}
              canvasRef={canvasRef}
              overlayCanvasRef={overlayCanvasRef}
              quickSettings={quickSettings}
              detectionFps={detectionFps}
              isVideoLoading={isVideoLoading}
              isStreaming={isStreaming}
              trackingMode={trackingMode}
              currentDetections={currentDetections}
              currentRecognitionResults={currentRecognitionResults}
              recognitionEnabled={recognitionEnabled}
              groupMembers={groupMembers}
              handleManualLog={handleManualLog}
              getVideoRect={getVideoRect}
              calculateScaleFactors={calculateScaleFactors}
            />
          </div>

          <ControlBar
            cameraDevices={cameraDevices}
            selectedCamera={selectedCamera}
            setSelectedCamera={setSelectedCamera}
            isStreaming={isStreaming}
            startCamera={startCamera}
            stopCamera={stopCamera}
          />
        </div>

        <Sidebar
          currentDetections={currentDetections}
          currentRecognitionResults={currentRecognitionResults}
          recognitionEnabled={recognitionEnabled}
          trackedFaces={trackedFaces}
          trackingMode={trackingMode}
          persistentCooldowns={persistentCooldowns}
          attendanceCooldownSeconds={attendanceCooldownSeconds}
          attendanceEnabled={attendanceEnabled}
          attendanceGroups={attendanceGroups}
          currentGroup={currentGroup}
          recentAttendance={recentAttendance}
          groupMembers={groupMembers}
          handleSelectGroup={handleSelectGroup}
          setShowGroupManagement={setShowGroupManagement}
          setShowSettings={setShowSettings}
          onOpenSettingsForRegistration={handleOpenSettingsForRegistration}
        />
      </div>

      <GroupManagementModal
        showGroupManagement={showGroupManagement}
        setShowGroupManagement={setShowGroupManagement}
        attendanceGroups={attendanceGroups}
        currentGroup={currentGroup}
        newGroupName={newGroupName}
        setNewGroupName={setNewGroupName}
        handleCreateGroup={handleCreateGroup}
        handleSelectGroup={handleSelectGroup}
        handleDeleteGroup={handleDeleteGroup}
      />

      {showSettings && (
        <Settings
          onBack={() => {
            setShowSettings(false);
            setIsSettingsFullScreen(false);
            setGroupInitialSection(undefined);
            loadAttendanceDataRef.current();
          }}
          isFullScreen={isSettingsFullScreen}
          onToggleFullScreen={() => setIsSettingsFullScreen((prev) => !prev)}
          isModal={true}
          quickSettings={quickSettings}
          onQuickSettingsChange={setQuickSettings}
          attendanceSettings={{
            trackingMode: trackingMode,
            lateThresholdEnabled:
              (currentGroup?.settings as { late_threshold_enabled?: boolean })
                ?.late_threshold_enabled ?? false,
            lateThresholdMinutes:
              currentGroup?.settings?.late_threshold_minutes ?? 15,
            classStartTime: currentGroup?.settings?.class_start_time ?? "08:00",
            attendanceCooldownSeconds: attendanceCooldownSeconds,
            enableSpoofDetection: enableSpoofDetection,
          }}
          onAttendanceSettingsChange={async (updates) => {
            if (updates.trackingMode !== undefined) {
              setTrackingMode(updates.trackingMode);
            }

            if (updates.enableSpoofDetection !== undefined) {
              setEnableSpoofDetection(updates.enableSpoofDetection);
              localStorage.setItem(
                "suri_enable_spoof_detection",
                String(updates.enableSpoofDetection),
              );
            }

            if (updates.attendanceCooldownSeconds !== undefined) {
              setAttendanceCooldownSeconds(updates.attendanceCooldownSeconds);
              try {
                await attendanceManager.updateSettings({
                  attendance_cooldown_seconds:
                    updates.attendanceCooldownSeconds,
                });
              } catch (error) {
                console.error("Failed to update cooldown setting:", error);
              }
            }

            if (
              currentGroup &&
              (updates.lateThresholdEnabled !== undefined ||
                updates.lateThresholdMinutes !== undefined ||
                updates.classStartTime !== undefined)
            ) {
              const updatedSettings = {
                ...currentGroup.settings,
                ...(updates.lateThresholdEnabled !== undefined && {
                  late_threshold_enabled: updates.lateThresholdEnabled,
                }),
                ...(updates.lateThresholdMinutes !== undefined && {
                  late_threshold_minutes: updates.lateThresholdMinutes,
                }),
                ...(updates.classStartTime !== undefined && {
                  class_start_time: updates.classStartTime,
                }),
              };
              try {
                await attendanceManager.updateGroup(currentGroup.id, {
                  settings: updatedSettings,
                });
                setCurrentGroup({
                  ...currentGroup,
                  settings: updatedSettings,
                });
              } catch (error) {
                console.error("Failed to update attendance settings:", error);
              }
            }
          }}
          isStreaming={isStreaming}
          initialGroupSection={groupInitialSection}
          currentGroup={currentGroup}
          onGroupSelect={handleSelectGroup}
          onGroupsChanged={() => loadAttendanceDataRef.current()}
          initialGroups={attendanceGroups}
        />
      )}

      <DeleteConfirmationModal
        showDeleteConfirmation={showDeleteConfirmation}
        groupToDelete={groupToDelete}
        currentGroup={currentGroup}
        cancelDeleteGroup={cancelDeleteGroup}
        confirmDeleteGroup={confirmDeleteGroup}
      />
    </div>
  );
}
