/**
 * State reset utility functions to eliminate code duplication
 * Used for resetting detection state and frame counters
 */

import type { DetectionResult } from "../types";
import type { ExtendedFaceRecognitionResponse } from "./recognitionHelpers";
import type { TrackedFace } from "../types";

/**
 * Resets detection-related state
 */
export function resetDetectionState(
  setCurrentDetections: (value: DetectionResult | null) => void,
  setCurrentRecognitionResults: (
    value: Map<number, ExtendedFaceRecognitionResponse>
  ) => void,
  setTrackedFaces: (value: Map<string, TrackedFace>) => void,
  lastDetectionRef: React.MutableRefObject<DetectionResult | null>
): void {
  setCurrentDetections(null);
  lastDetectionRef.current = null;
  setCurrentRecognitionResults(new Map());
  setTrackedFaces(new Map());
}

/**
 * Resets frame counter refs
 */
export function resetFrameCounters(
  frameCounterRef: React.MutableRefObject<number>,
  skipFramesRef: React.MutableRefObject<number>,
  lastFrameTimestampRef: React.MutableRefObject<number>
): void {
  frameCounterRef.current = 0;
  skipFramesRef.current = 0;
  lastFrameTimestampRef.current = 0;
}

