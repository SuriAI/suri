// Cleanup helpers
export {
  cleanupStream,
  cleanupVideo,
  cleanupAnimationFrame,
} from "./cleanupHelpers";

// State reset helpers
export {
  resetLastDetectionRef,
  resetFrameCounters,
} from "./stateResetHelpers";

// Recognition helpers
export type { ExtendedFaceRecognitionResponse } from "./recognitionHelpers";
export {
  trimTrackingHistory,
  areRecognitionMapsEqual,
  isRecognitionResponseEqual,
} from "./recognitionHelpers";

// Member cache helpers
export { getMemberFromCache } from "./memberCacheHelpers";

// Overlay renderer
export { drawOverlays } from "./overlayRenderer";

