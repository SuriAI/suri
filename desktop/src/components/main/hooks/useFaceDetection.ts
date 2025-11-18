import { useState, useRef, useCallback, useEffect } from "react";
import type { BackendService } from "../../../services/BackendService";
import type { DetectionResult } from "../types";

interface UseFaceDetectionOptions {
  backendServiceRef: React.MutableRefObject<BackendService | null>;
  isScanningRef: React.MutableRefObject<boolean>;
  isStreamingRef: React.MutableRefObject<boolean>;
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
  const { backendServiceRef, isScanningRef, isStreamingRef, captureFrame, lastDetectionFrameRef, frameCounterRef, skipFramesRef, lastFrameTimestampRef, lastDetectionRef, processCurrentFrameRef, fpsTrackingRef } = options;

  const [detectionFps, setDetectionFps] = useState<number>(0);
  const [currentDetections, setCurrentDetections] = useState<DetectionResult | null>(null);

  const processCurrentFrame = useCallback(async () => {
    if (
      !backendServiceRef.current?.isWebSocketReady() ||
      !isScanningRef.current ||
      !isStreamingRef.current
    ) {
      return;
    }

    frameCounterRef.current += 1;

    if (frameCounterRef.current % (skipFramesRef.current + 1) !== 0) {
      requestAnimationFrame(() => processCurrentFrameRef.current());
      return;
    }

    try {
      const frameData = await captureFrame();
      if (!frameData) {
        requestAnimationFrame(() => processCurrentFrameRef.current());
        return;
      }

      lastDetectionFrameRef.current = frameData;

      backendServiceRef.current
        .sendDetectionRequest(frameData)
        .catch((error) => {
          console.error("❌ WebSocket detection request failed:", error);
          requestAnimationFrame(() => processCurrentFrameRef.current());
        });
    } catch (error) {
      console.error("❌ Frame capture failed:", error);
      requestAnimationFrame(() => processCurrentFrameRef.current());
    }
  }, [captureFrame, backendServiceRef, isScanningRef, isStreamingRef]);

  useEffect(() => {
    processCurrentFrameRef.current = processCurrentFrame;
  }, [processCurrentFrame]);

  return {
    detectionFps,
    setDetectionFps,
    currentDetections,
    setCurrentDetections,
  };
}

