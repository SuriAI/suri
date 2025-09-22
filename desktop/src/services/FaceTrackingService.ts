/**
 * Face Tracking Service for Multi-Face Scenarios
 * Maintains consistent person identification to prevent UI switching
 */

export interface TrackedFace {
  trackId: string;
  personId: string | null;
  confidence: number;
  similarity: number;
  bbox: [number, number, number, number];
  lastSeen: number;
  firstSeen: number;
  detectionCount: number;
  stabilityScore: number;
  isStable: boolean;
}

export interface FaceTrackingConfig {
  maxTrackingDistance: number;
  trackTimeoutMs: number;
  minDetectionsForStability: number;
  stabilityThreshold: number;
  positionWeight: number;
  sizeWeight: number;
  confidenceWeight: number;
}

export class FaceTrackingService {
  private trackedFaces = new Map<string, TrackedFace>();
  private nextTrackId = 1;
  private config: FaceTrackingConfig;
  private primaryTrackId: string | null = null;

  constructor(config?: Partial<FaceTrackingConfig>) {
    this.config = {
      maxTrackingDistance: 100, // Maximum pixel distance for face matching
      trackTimeoutMs: 2000, // Remove tracks after 2 seconds of no detection
      minDetectionsForStability: 5, // Minimum detections before considering stable
      stabilityThreshold: 0.8, // Stability score threshold
      positionWeight: 0.4,
      sizeWeight: 0.3,
      confidenceWeight: 0.3,
      ...config
    };
  }

  /**
   * Update tracking with new detections
   */
  public updateTracks(detections: Array<{
    bbox: [number, number, number, number];
    confidence: number;
    recognition?: { personId: string | null; similarity: number };
  }>): TrackedFace[] {
    const currentTime = Date.now();
    
    // Remove expired tracks
    this.cleanupExpiredTracks(currentTime);
    
    // Match detections to existing tracks
    const matchedTracks = new Set<string>();
    const updatedTracks: TrackedFace[] = [];
    
    for (const detection of detections) {
      const bestMatch = this.findBestTrackMatch(detection);
      
      if (bestMatch) {
        // Update existing track
        const track = this.trackedFaces.get(bestMatch.trackId)!;
        this.updateTrack(track, detection, currentTime);
        matchedTracks.add(bestMatch.trackId);
        updatedTracks.push(track);
      } else {
        // Create new track
        const newTrack = this.createNewTrack(detection, currentTime);
        this.trackedFaces.set(newTrack.trackId, newTrack);
        updatedTracks.push(newTrack);
      }
    }
    
    // Mark unmatched tracks as not seen
    for (const [trackId, track] of this.trackedFaces) {
      if (!matchedTracks.has(trackId)) {
        track.lastSeen = currentTime;
      }
    }
    
    // Update primary track selection
    this.updatePrimaryTrack();
    
    return updatedTracks;
  }

  /**
   * Get the primary (most stable/prominent) tracked face
   */
  public getPrimaryTrack(): TrackedFace | null {
    if (!this.primaryTrackId) return null;
    return this.trackedFaces.get(this.primaryTrackId) || null;
  }

  /**
   * Get all active tracks
   */
  public getAllTracks(): TrackedFace[] {
    return Array.from(this.trackedFaces.values());
  }

  /**
   * Get track by ID
   */
  public getTrack(trackId: string): TrackedFace | null {
    return this.trackedFaces.get(trackId) || null;
  }

  /**
   * Clear all tracks
   */
  public clearTracks(): void {
    this.trackedFaces.clear();
    this.primaryTrackId = null;
    this.nextTrackId = 1;
  }

  private findBestTrackMatch(detection: {
    bbox: [number, number, number, number];
    confidence: number;
    recognition?: { personId: string | null; similarity: number };
  }): { trackId: string; distance: number } | null {
    let bestMatch: { trackId: string; distance: number } | null = null;
    let minDistance = this.config.maxTrackingDistance;

    for (const [trackId, track] of this.trackedFaces) {
      const distance = this.calculateTrackDistance(track, detection);
      
      if (distance < minDistance) {
        minDistance = distance;
        bestMatch = { trackId, distance };
      }
    }

    return bestMatch;
  }

  private calculateTrackDistance(
    track: TrackedFace,
    detection: {
      bbox: [number, number, number, number];
      confidence: number;
      recognition?: { personId: string | null; similarity: number };
    }
  ): number {
    // Calculate center points
    const trackCenterX = track.bbox[0] + track.bbox[2] / 2;
    const trackCenterY = track.bbox[1] + track.bbox[3] / 2;
    const detectionCenterX = detection.bbox[0] + detection.bbox[2] / 2;
    const detectionCenterY = detection.bbox[1] + detection.bbox[3] / 2;

    // Position distance
    const positionDistance = Math.sqrt(
      Math.pow(trackCenterX - detectionCenterX, 2) +
      Math.pow(trackCenterY - detectionCenterY, 2)
    );

    // Size difference
    const trackSize = track.bbox[2] * track.bbox[3];
    const detectionSize = detection.bbox[2] * detection.bbox[3];
    const sizeDistance = Math.abs(trackSize - detectionSize) / Math.max(trackSize, detectionSize);

    // Confidence difference
    const confidenceDistance = Math.abs(track.confidence - detection.confidence);

    // Person ID matching bonus
    let personIdBonus = 0;
    if (track.personId && detection.recognition?.personId) {
      personIdBonus = track.personId === detection.recognition.personId ? -20 : 10;
    }

    // Weighted distance
    const totalDistance = 
      positionDistance * this.config.positionWeight +
      sizeDistance * 100 * this.config.sizeWeight +
      confidenceDistance * 100 * this.config.confidenceWeight +
      personIdBonus;

    return totalDistance;
  }

  private updateTrack(
    track: TrackedFace,
    detection: {
      bbox: [number, number, number, number];
      confidence: number;
      recognition?: { personId: string | null; similarity: number };
    },
    currentTime: number
  ): void {
    // Update track properties with smoothing
    const alpha = 0.7; // Smoothing factor
    
    track.bbox = [
      track.bbox[0] * (1 - alpha) + detection.bbox[0] * alpha,
      track.bbox[1] * (1 - alpha) + detection.bbox[1] * alpha,
      track.bbox[2] * (1 - alpha) + detection.bbox[2] * alpha,
      track.bbox[3] * (1 - alpha) + detection.bbox[3] * alpha
    ];
    
    track.confidence = track.confidence * (1 - alpha) + detection.confidence * alpha;
    track.lastSeen = currentTime;
    track.detectionCount++;

    // Update person identification
    if (detection.recognition?.personId) {
      track.personId = detection.recognition.personId;
      track.similarity = detection.recognition.similarity;
    }

    // Update stability score
    track.stabilityScore = Math.min(1.0, track.detectionCount / this.config.minDetectionsForStability);
    
    // Enhanced stability criteria for multi-face scenarios
     const minConfidenceForStability = track.personId ? 0.75 : 0.7;
     track.isStable = track.stabilityScore >= this.config.stabilityThreshold && 
                      track.confidence > minConfidenceForStability;
  }

  private createNewTrack(
    detection: {
      bbox: [number, number, number, number];
      confidence: number;
      recognition?: { personId: string | null; similarity: number };
    },
    currentTime: number
  ): TrackedFace {
    const trackId = `track_${this.nextTrackId++}`;
    
    return {
      trackId,
      personId: detection.recognition?.personId || null,
      confidence: detection.confidence,
      similarity: detection.recognition?.similarity || 0,
      bbox: [...detection.bbox],
      lastSeen: currentTime,
      firstSeen: currentTime,
      detectionCount: 1,
      stabilityScore: 0,
      isStable: false
    };
  }

  private cleanupExpiredTracks(currentTime: number): void {
    for (const [trackId, track] of this.trackedFaces) {
      if (currentTime - track.lastSeen > this.config.trackTimeoutMs) {
        this.trackedFaces.delete(trackId);
        
        // Clear primary track if it was deleted
        if (this.primaryTrackId === trackId) {
          this.primaryTrackId = null;
        }
      }
    }
  }

  private updatePrimaryTrack(): void {
    const activeTracks = Array.from(this.trackedFaces.values());
    
    if (activeTracks.length === 0) {
      this.primaryTrackId = null;
      return;
    }

    // If current primary track is still valid and stable, keep it
    if (this.primaryTrackId) {
      const currentPrimary = this.trackedFaces.get(this.primaryTrackId);
      if (currentPrimary && currentPrimary.isStable && currentPrimary.personId) {
        return;
      }
    }

    // Find the best track to be primary
    let bestTrack: TrackedFace | null = null;
    let bestScore = -1;

    for (const track of activeTracks) {
      // Calculate primary score based on stability, confidence, and person identification
      let score = track.stabilityScore * 0.4 + track.confidence * 0.3;
      
      // Bonus for having person identification
      if (track.personId) {
        score += 0.3;
      }
      
      // Bonus for face size (larger faces are more prominent)
      const faceSize = track.bbox[2] * track.bbox[3];
      score += Math.min(0.2, faceSize / 10000); // Normalize face size contribution
      
      if (score > bestScore) {
        bestScore = score;
        bestTrack = track;
      }
    }

    this.primaryTrackId = bestTrack?.trackId || null;
  }

  /**
   * Get statistics about current tracking state
   */
  public getTrackingStats(): {
    totalTracks: number;
    stableTracks: number;
    identifiedTracks: number;
    primaryTrackId: string | null;
  } {
    const tracks = Array.from(this.trackedFaces.values());
    
    return {
      totalTracks: tracks.length,
      stableTracks: tracks.filter(t => t.isStable).length,
      identifiedTracks: tracks.filter(t => t.personId).length,
      primaryTrackId: this.primaryTrackId
    };
  }
}