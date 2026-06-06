export interface FaceDetectionResult {
  faces?: Array<{
    confidence?: number
    bbox?: number[] | [number, number, number, number]
    landmarks_5?: number[][]
    [key: string]: unknown
  }>
}

export interface ValidatedFace {
  confidence: number
  bbox: [number, number, number, number]
  landmarks_5: number[][]
  [key: string]: unknown
}

export function validateAndGetBestFace(detection: FaceDetectionResult): ValidatedFace {
  if (!detection.faces || detection.faces.length === 0) {
    throw new Error("No face detected.")
  }

  const bestFace = detection.faces.reduce(
    (best, current) => ((current.confidence ?? 0) > (best.confidence ?? 0) ? current : best),
    detection.faces[0],
  )

  if (!bestFace.bbox || bestFace.bbox.length < 4) {
    throw new Error("Face detected but bounding box missing.")
  }

  if (!bestFace.landmarks_5 || bestFace.landmarks_5.length !== 5) {
    throw new Error(
      "Biometric signature detected, but facial features are missing. Ensure the subject is clearly visible and try again.",
    )
  }

  return {
    ...bestFace,
    confidence: bestFace.confidence ?? 1,
    bbox: bestFace.bbox as [number, number, number, number],
    landmarks_5: bestFace.landmarks_5,
  }
}
