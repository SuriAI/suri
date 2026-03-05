import { useCallback, useEffect } from "react";
import type { BackendService } from "@/services";
import type { DetectionResult } from "@/components/main/types";
import { useDetectionStore } from "@/components/main/stores";

interface UseFaceDetectionOptions {
  backendServiceRef: React.RefObject<BackendService | null>;
  isScanningRef: React.RefObject<boolean>;
  isStreamingRef: React.RefObject<boolean>;
  captureFrame: () => Promise<ArrayBuffer | null>;
  lastDetectionFrameRef: React.MutableRefObject<ArrayBuffer | null>;
  frameCounterRef: React.MutableRefObject<number>;
  skipFramesRef: React.MutableRefObject<number>;
  lastFrameTimestampRef: React.MutableRefObject<number>;
  lastDetectionRef: React.MutableRefObject<DetectionResult | null>;
  processCurrentFrameRef: React.MutableRefObject<() => Promise<void>>;
  fpsTrackingRef: React.MutableRefObject<{
    timestamps: number[];
    maxSamples: number;
    lastUpdateTime: number;
  }>;
}

export function useFaceDetection(options: UseFaceDetectionOptions) {
  const {
    backendServiceRef,
    isScanningRef,
    isStreamingRef,
    captureFrame,
    lastDetectionFrameRef,
    frameCounterRef,
    skipFramesRef,
    processCurrentFrameRef,
  } = options;

  const {
    detectionFps,
    currentDetections,
    setDetectionFps,
    setCurrentDetections,
  } = useDetectionStore();

  const processCurrentFrame = useCallback(async () => {
    if (
      !backendServiceRef.current?.isWebSocketReady() ||
      !isScanningRef.current ||
      !isStreamingRef.current
    ) {
      return;
    }

    frameCounterRef.current += 1;

    if (
      (frameCounterRef.current ?? 0) % ((skipFramesRef.current ?? 0) + 1) !==
      0
    ) {
      requestAnimationFrame(() => processCurrentFrameRef.current?.());
      return;
    }

    try {
      const frameData = await captureFrame();
      if (!frameData) {
        requestAnimationFrame(() => processCurrentFrameRef.current?.());
        return;
      }

      lastDetectionFrameRef.current = frameData;

      backendServiceRef.current
        .sendDetectionRequest(frameData)
        .catch((error) => {
          console.error("❌ WebSocket detection request failed:", error);
          requestAnimationFrame(() => processCurrentFrameRef.current?.());
        });
    } catch (error) {
      console.error("❌ Frame capture failed:", error);
      requestAnimationFrame(() => processCurrentFrameRef.current?.());
    }
  }, [
    captureFrame,
    backendServiceRef,
    isScanningRef,
    isStreamingRef,
    frameCounterRef,
    lastDetectionFrameRef,
    processCurrentFrameRef,
    skipFramesRef,
  ]);

  useEffect(() => {
    processCurrentFrameRef.current = processCurrentFrame;
  }, [processCurrentFrame, processCurrentFrameRef]);

  return {
    detectionFps,
    setDetectionFps,
    currentDetections,
    setCurrentDetections,
  };
}
