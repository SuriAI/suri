import * as ort from 'onnxruntime-web/all';

export interface DetectionResult {
  bbox: [number, number, number, number]; // [x1, y1, x2, y2]
  confidence: number;
  landmarks: number[][]; // 5 facial landmarks as [x, y] pairs
}

export class ClientSideScrfdService {
  private session: ort.InferenceSession | null = null;
  private inputSize = 320; // Smaller input size for better performance
  private confThreshold = 0.3; // Higher threshold to reduce detections
  private iouThreshold = 0.4;
  
  // SCRFD model parameters (exactly like Python)
  private readonly fmc = 3;
  private readonly featStrideFpn = [8, 16, 32];
  private readonly numAnchors = 2;
  private readonly useKps = true;
  
  private readonly mean = 127.5;
  private readonly std = 128.0;
  
  private centerCache = new Map<string, Float32Array>();

  async initialize(): Promise<void> {
    try {
      console.log('Loading Client-side SCRFD model...');
      
      // Load model from weights directory
      const modelUrl = '/weights/det_500m.onnx';
      
      // Create session with bundled runtime - no external WASM files needed
      this.session = await ort.InferenceSession.create(modelUrl, {
        executionProviders: ['cpu'], // Use CPU provider - always available
      });
      
      console.log('Client-side SCRFD model loaded successfully');
      console.log('Input names:', this.session.inputNames);
      console.log('Output names:', this.session.outputNames);
      
      // Log model metadata for debugging
      this.session.inputNames.forEach((name, idx) => {
        console.log(`Input ${idx}: ${name}`);
      });
      this.session.outputNames.forEach((name, idx) => {
        console.log(`Output ${idx}: ${name}`);
      });
    } catch (error) {
      console.error('Failed to load Client-side SCRFD model:', error);
      throw error;
    }
  }

  async detect(imageData: ImageData): Promise<DetectionResult[]> {
    if (!this.session) {
      throw new Error('Client-side SCRFD model not initialized');
    }

    try {
      const { width, height } = imageData;
      
      if (!width || !height || width <= 0 || height <= 0) {
        return [];
      }

      // Step 1: Resize with aspect ratio preservation (like Python)
      const imRatio = height / width;
      const modelRatio = this.inputSize / this.inputSize; // 1.0
      
      let newWidth: number, newHeight: number;
      if (imRatio > modelRatio) {
        newHeight = this.inputSize;
        newWidth = Math.floor(newHeight / imRatio);
      } else {
        newWidth = this.inputSize;
        newHeight = Math.floor(newWidth * imRatio);
      }
      
      const detScale = newHeight / height;
      
      // Step 2: Create tensor exactly like cv2.dnn.blobFromImage
      const tensor = this.createBlobFromImage(imageData, newWidth, newHeight);
      
      // Step 3: Run inference
      const feeds = { [this.session.inputNames[0]]: tensor };
      const outputs = await this.session.run(feeds);
      
      // Step 4: Postprocess exactly like Python
      const detections = this.postprocessOutputs(outputs, detScale);
      
      return detections;
    } catch (error) {
      console.error('Client-side SCRFD detection error:', error);
      return [];
    }
  }

  private createBlobFromImage(imageData: ImageData, newWidth: number, newHeight: number): ort.Tensor {
    const { data, width, height } = imageData;
    
    // Create padded image buffer with smaller size for speed
    const paddedImage = new Uint8Array(this.inputSize * this.inputSize * 3);
    
    // Fast nearest neighbor resize (skip fancy interpolation for speed)
    const scaleX = width / newWidth;
    const scaleY = height / newHeight;
    
    for (let y = 0; y < newHeight; y += 2) { // Skip every other row for speed
      for (let x = 0; x < newWidth; x += 2) { // Skip every other column for speed
        const srcX = Math.min(Math.floor(x * scaleX), width - 1);
        const srcY = Math.min(Math.floor(y * scaleY), height - 1);
        
        const srcIdx = (srcY * width + srcX) * 4; // RGBA
        const dstIdx = (y * this.inputSize + x) * 3; // RGB padded
        
        // Copy RGB (ignore alpha) - unroll loop for speed
        paddedImage[dstIdx] = data[srcIdx];
        paddedImage[dstIdx + 1] = data[srcIdx + 1];
        paddedImage[dstIdx + 2] = data[srcIdx + 2];
        
        // Duplicate to next pixel for speed
        if (x + 1 < newWidth) {
          paddedImage[dstIdx + 3] = data[srcIdx];
          paddedImage[dstIdx + 4] = data[srcIdx + 1];
          paddedImage[dstIdx + 5] = data[srcIdx + 2];
        }
      }
      
      // Duplicate row for speed
      if (y + 1 < newHeight) {
        const srcRowIdx = y * this.inputSize * 3;
        const dstRowIdx = (y + 1) * this.inputSize * 3;
        for (let i = 0; i < newWidth * 3; i++) {
          paddedImage[dstRowIdx + i] = paddedImage[srcRowIdx + i];
        }
      }
    }
    
    // Fast tensor conversion
    const tensorData = new Float32Array(3 * this.inputSize * this.inputSize);
    const scale = 1.0 / this.std;
    const meanScaled = this.mean / this.std;
    
    // Vectorized conversion for speed
    let tensorIdx = 0;
    for (let i = 0; i < this.inputSize * this.inputSize; i++) {
      const pixelIdx = i * 3;
      
      // Get RGB values
      const r = paddedImage[pixelIdx];
      const g = paddedImage[pixelIdx + 1];
      const b = paddedImage[pixelIdx + 2];
      
      // Store as BGR in CHW format
      tensorData[tensorIdx] = (b * scale) - meanScaled;
      tensorData[tensorIdx + this.inputSize * this.inputSize] = (g * scale) - meanScaled;
      tensorData[tensorIdx + 2 * this.inputSize * this.inputSize] = (r * scale) - meanScaled;
      
      tensorIdx++;
    }
    
    return new ort.Tensor('float32', tensorData, [1, 3, this.inputSize, this.inputSize]);
  }

  private postprocessOutputs(outputs: Record<string, ort.Tensor>, detScale: number): DetectionResult[] {
    const scoresList: Float32Array[] = [];
    const bboxesList: Float32Array[] = [];
    const kpssList: Float32Array[] = [];
    
    // Process each feature map exactly like Python forward() method
    for (let idx = 0; idx < this.featStrideFpn.length; idx++) {
      const stride = this.featStrideFpn[idx];
      
      const scores = outputs[this.session!.outputNames[idx]];
      const bboxPreds = outputs[this.session!.outputNames[idx + this.fmc]];
      const kpsPreds = this.useKps ? outputs[this.session!.outputNames[idx + this.fmc * 2]] : null;
      
      const height = Math.floor(this.inputSize / stride);
      const width = Math.floor(this.inputSize / stride);
      
      // Get anchor centers (cached like Python)
      const key = `${height},${width},${stride}`;
      let anchorCenters = this.centerCache.get(key);
      
      if (!anchorCenters) {
        anchorCenters = this.createAnchorCenters(height, width, stride);
        if (this.centerCache.size < 100) {
          this.centerCache.set(key, anchorCenters);
        }
      }
      
      const scoresData = scores.data as Float32Array;
      const bboxData = bboxPreds.data as Float32Array;
      const kpsData = kpsPreds ? (kpsPreds.data as Float32Array) : null;
      
      // Scale bbox and kps predictions by stride (like Python)
      const scaledBboxData = new Float32Array(bboxData.length);
      for (let i = 0; i < bboxData.length; i++) {
        scaledBboxData[i] = bboxData[i] * stride;
      }
      
      const scaledKpsData = kpsData ? new Float32Array(kpsData.length) : null;
      if (scaledKpsData && kpsData) {
        for (let i = 0; i < kpsData.length; i++) {
          scaledKpsData[i] = kpsData[i] * stride;
        }
      }
      
      // Find positive indices (like Python np.where(scores >= threshold)[0])
      const posIndices: number[] = [];
      for (let i = 0; i < scoresData.length; i++) {
        if (scoresData[i] >= this.confThreshold) {
          posIndices.push(i);
        }
      }
      
      if (posIndices.length === 0) continue;
      
      // Decode bboxes for positive indices
      const posScores = new Float32Array(posIndices.length);
      const posBboxes = new Float32Array(posIndices.length * 4);
      const posKpss = scaledKpsData ? new Float32Array(posIndices.length * 10) : null;
      
      for (let i = 0; i < posIndices.length; i++) {
        const idx = posIndices[i];
        
        // Extract score
        posScores[i] = scoresData[idx];
        
        // Decode bbox using distance2bbox
        const bbox = this.distance2bbox(anchorCenters, scaledBboxData, idx);
        posBboxes[i * 4] = bbox[0];
        posBboxes[i * 4 + 1] = bbox[1];
        posBboxes[i * 4 + 2] = bbox[2];
        posBboxes[i * 4 + 3] = bbox[3];
        
        // Decode keypoints if available
        if (posKpss && scaledKpsData && this.useKps) {
          const kps = this.distance2kps(anchorCenters, scaledKpsData, idx);
          for (let k = 0; k < 10; k++) {
            posKpss[i * 10 + k] = kps[k];
          }
        }
      }
      
      scoresList.push(posScores);
      bboxesList.push(posBboxes);
      if (posKpss) {
        kpssList.push(posKpss);
      }
    }
    
    if (scoresList.length === 0) {
      return [];
    }
    
    // Apply NMS and scale back to original image coordinates (like Python)
    return this.applyNMS(scoresList, bboxesList, kpssList, detScale);
  }

  private createAnchorCenters(height: number, width: number, stride: number): Float32Array {
    // Create anchor centers exactly like Python: np.stack(np.mgrid[:height, :width][::-1], axis=-1)
    const totalAnchors = height * width * this.numAnchors;
    const centers = new Float32Array(totalAnchors * 2);
    
    let idx = 0;
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        // Python does [::-1] which reverses [y, x] to [x, y]
        const centerX = x * stride;
        const centerY = y * stride;
        
        // Repeat for each anchor (if numAnchors > 1)
        for (let a = 0; a < this.numAnchors; a++) {
          centers[idx++] = centerX;
          centers[idx++] = centerY;
        }
      }
    }
    
    return centers;
  }

  private distance2bbox(points: Float32Array, distances: Float32Array, idx: number): Float32Array {
    const centerX = points[idx * 2] || 0;
    const centerY = points[idx * 2 + 1] || 0;
    
    const left = distances[idx * 4] || 0;
    const top = distances[idx * 4 + 1] || 0;
    const right = distances[idx * 4 + 2] || 0;
    const bottom = distances[idx * 4 + 3] || 0;
    
    return new Float32Array([
      centerX - left,   // x1
      centerY - top,    // y1
      centerX + right,  // x2
      centerY + bottom  // y2
    ]);
  }

  private distance2kps(points: Float32Array, distances: Float32Array, idx: number): Float32Array {
    const centerX = points[idx * 2] || 0;
    const centerY = points[idx * 2 + 1] || 0;
    
    const kps = new Float32Array(10); // 5 points * 2 coordinates
    
    // Python: for i in range(0, distance.shape[1], 2)
    // distance.shape[1] would be 10 for 5 keypoints
    for (let i = 0; i < 5; i++) {
      const dx = distances[idx * 10 + i * 2] || 0;
      const dy = distances[idx * 10 + i * 2 + 1] || 0;
      
      kps[i * 2] = centerX + dx;
      kps[i * 2 + 1] = centerY + dy;
    }
    
    return kps;
  }

  private applyNMS(scoresList: Float32Array[], bboxesList: Float32Array[], kpssList: Float32Array[], detScale: number): DetectionResult[] {
    if (scoresList.length === 0) return [];
    
    // Combine all detections from different feature maps (like Python np.vstack)
    let totalDetections = 0;
    for (const scores of scoresList) {
      totalDetections += scores.length;
    }
    
    if (totalDetections === 0) return [];
    
    // Create combined arrays
    const allScores = new Float32Array(totalDetections);
    const allBboxes = new Float32Array(totalDetections * 4);
    const allKpss = kpssList.length > 0 ? new Float32Array(totalDetections * 10) : null;
    
    let offset = 0;
    for (let i = 0; i < scoresList.length; i++) {
      const scores = scoresList[i];
      const bboxes = bboxesList[i];
      const kpss = i < kpssList.length ? kpssList[i] : null;
      
      for (let j = 0; j < scores.length; j++) {
        allScores[offset] = scores[j];
        
        // Copy bbox
        for (let k = 0; k < 4; k++) {
          allBboxes[offset * 4 + k] = bboxes[j * 4 + k];
        }
        
        // Copy keypoints if available
        if (allKpss && kpss) {
          for (let k = 0; k < 10; k++) {
            allKpss[offset * 10 + k] = kpss[j * 10 + k];
          }
        }
        
        offset++;
      }
    }
    
    // Create detection array for NMS (like Python pre_det)
    const detections: Array<{
      score: number;
      bbox: [number, number, number, number];
      kps?: number[][];
      index: number;
    }> = [];
    
    for (let i = 0; i < totalDetections; i++) {
      const bbox: [number, number, number, number] = [
        allBboxes[i * 4] / detScale,     // Scale back to original
        allBboxes[i * 4 + 1] / detScale,
        allBboxes[i * 4 + 2] / detScale,
        allBboxes[i * 4 + 3] / detScale
      ];
      
      let kps: number[][] | undefined;
      if (allKpss) {
        kps = [];
        for (let k = 0; k < 5; k++) {
          kps.push([
            allKpss[i * 10 + k * 2] / detScale,
            allKpss[i * 10 + k * 2 + 1] / detScale
          ]);
        }
      }
      
      detections.push({
        score: allScores[i],
        bbox,
        kps,
        index: i
      });
    }
    
    // Sort by score descending (like Python order = scores_ravel.argsort()[::-1])
    detections.sort((a, b) => b.score - a.score);
    
    // Apply NMS
    const keep: boolean[] = new Array(detections.length).fill(true);
    
    for (let i = 0; i < detections.length; i++) {
      if (!keep[i]) continue;
      
      for (let j = i + 1; j < detections.length; j++) {
        if (!keep[j]) continue;
        
        const iou = this.calculateIoU(
          new Float32Array(detections[i].bbox),
          new Float32Array(detections[j].bbox)
        );
        if (iou > this.iouThreshold) {
          keep[j] = false;
        }
      }
    }
    
    // Convert to final format
    const results: DetectionResult[] = [];
    
    for (let i = 0; i < detections.length; i++) {
      if (!keep[i]) continue;
      
      const det = detections[i];
      
      results.push({
        bbox: det.bbox,
        confidence: det.score,
        landmarks: det.kps || []
      });
    }
    
    return results;
  }

  private calculateIoU(bbox1: Float32Array, bbox2: Float32Array): number {
    const x1 = Math.max(bbox1[0], bbox2[0]);
    const y1 = Math.max(bbox1[1], bbox2[1]);
    const x2 = Math.min(bbox1[2], bbox2[2]);
    const y2 = Math.min(bbox1[3], bbox2[3]);
    
    if (x2 <= x1 || y2 <= y1) return 0;
    
    const intersection = (x2 - x1) * (y2 - y1);
    const area1 = (bbox1[2] - bbox1[0]) * (bbox1[3] - bbox1[1]);
    const area2 = (bbox2[2] - bbox2[0]) * (bbox2[3] - bbox2[1]);
    const union = area1 + area2 - intersection;
    
    return intersection / union;
  }
}
