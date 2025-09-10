import * as ort from 'onnxruntime-web/all';

export interface AntiSpoofingResult {
  isLive: boolean;
  confidence: number;
  score: number; // Raw model output score
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export class WebAntiSpoofingService {
  private session: ort.InferenceSession | null = null;
  private threshold: number = 0.5; // Real face probability threshold

  // Model specs
  private readonly INPUT_SIZE = 128;
  private readonly INPUT_MEAN = 0.5;
  private readonly INPUT_STD = 0.5;

  private frameCount = 0;

  /**
   * Initialize the ONNX model
   */
  async initialize(isDev?: boolean): Promise<void> {
    const isDevMode =
      isDev !== undefined
        ? isDev
        : typeof window !== 'undefined' && window.location.protocol === 'http:';
    const modelUrl = isDevMode
      ? '/weights/AntiSpoofing_bin_1.5_128.onnx'
      : './app.asar.unpacked/dist-react/weights/AntiSpoofing_bin_1.5_128.onnx';

    try {
      this.session = await ort.InferenceSession.create(modelUrl, {
        executionProviders: ['wasm'],
        logSeverityLevel: 0,
        logVerbosityLevel: 1,
        enableCpuMemArena: false,
        enableMemPattern: false,
        executionMode: 'sequential',
        graphOptimizationLevel: 'disabled',
      });

      console.log('✅ Anti-spoofing model loaded successfully');
      console.log('📊 Input names:', this.session.inputNames);
      console.log('📊 Output names:', this.session.outputNames);
    } catch (err) {
      console.error('❌ Failed to load anti-spoofing model:', err);
      throw new Error(`Anti-spoofing model initialization failed: ${err}`);
    }
  }

  /**
   * Detect if a face is live or spoofed
   * @param faceImageData - ImageData of the cropped face (should be square-ish)
   * @param bbox - Optional bounding box for increased cropping
   */
  async detectLiveness(
    faceImageData: ImageData,
    bbox?: BoundingBox,
    bboxInc: number = 1.5
  ): Promise<AntiSpoofingResult> {
    if (!this.session) {
      throw new Error('Anti-spoofing model not initialized');
    }

    try {
      this.frameCount++;

      // Apply increased crop if bbox is provided
      let processedImageData: ImageData;
      if (bbox) {
        processedImageData = this.increasedCrop(faceImageData, bbox, bboxInc);
      } else {
        processedImageData = faceImageData;
      }

      const tensor = this.preprocessFaceImage(processedImageData);

      if (this.frameCount === 1) {
        console.log('🔍 Model initialized - Input:', this.session.inputNames[0]);
        console.log('🔍 Tensor shape:', tensor.dims);
      }

      const feeds = { [this.session.inputNames[0]]: tensor };
      const outputs = await this.session.run(feeds);

      const outputTensor = outputs[this.session.outputNames[0]];
      const rawScore = outputTensor.data[0] as number;

      // Use raw score directly - more negative = more live
      // Real faces: ~-28, Fake faces: ~-12
      const liveThreshold = -20; // Threshold between real (-28) and fake (-12)
      const isLive = rawScore < liveThreshold;
      
      // Convert to 0-1 confidence based on distance from threshold
      const confidence = Math.min(1, Math.abs(rawScore - liveThreshold) / 10);

      console.log(`Raw score: ${rawScore}, IsLive: ${isLive}, Confidence: ${confidence}`);

      return {
        isLive,
        confidence,
        score: rawScore,
      };
    } catch (err) {
      console.error('❌ Anti-spoofing detection failed:', err);
      return {
        isLive: false,
        confidence: 0,
        score: 0,
      };
    }
  }

  /**
   * Apply increased crop like Python's increased_crop
   */
  private increasedCrop(
    imgData: ImageData,
    bbox: BoundingBox,
    bboxInc: number
  ): ImageData {
    const { width: imgW, height: imgH } = imgData;

    const { x, y, width, height } = bbox;
    const l = Math.max(width, height);
    const xc = x + width / 2;
    const yc = y + height / 2;

    const x1 = Math.max(0, Math.round(xc - (l * bboxInc) / 2));
    const y1 = Math.max(0, Math.round(yc - (l * bboxInc) / 2));
    const x2 = Math.min(imgW, Math.round(xc + (l * bboxInc) / 2));
    const y2 = Math.min(imgH, Math.round(yc + (l * bboxInc) / 2));

    const cropW = x2 - x1;
    const cropH = y2 - y1;

    const canvas = new OffscreenCanvas(this.INPUT_SIZE, this.INPUT_SIZE);
    const ctx = canvas.getContext('2d')!;

    // Create temporary source canvas
    const srcCanvas = new OffscreenCanvas(imgW, imgH);
    const srcCtx = srcCanvas.getContext('2d')!;
    srcCtx.putImageData(imgData, 0, 0);

    // Draw cropped region and pad to square if necessary
    ctx.drawImage(srcCanvas, x1, y1, cropW, cropH, 0, 0, this.INPUT_SIZE, this.INPUT_SIZE);

    return ctx.getImageData(0, 0, this.INPUT_SIZE, this.INPUT_SIZE);
  }

  /**
   * Preprocess face image for ONNX model
   */
private preprocessFaceImage(imageData: ImageData): ort.Tensor {
  const tensorData = new Float32Array(3 * this.INPUT_SIZE * this.INPUT_SIZE);
  const data = imageData.data;

  for (let i = 0; i < this.INPUT_SIZE * this.INPUT_SIZE; i++) {
    const idx = i * 4;
    const r = (data[idx] / 255 - this.INPUT_MEAN) / this.INPUT_STD;
    const g = (data[idx + 1] / 255 - this.INPUT_MEAN) / this.INPUT_STD;
    const b = (data[idx + 2] / 255 - this.INPUT_MEAN) / this.INPUT_STD;

    tensorData[i] = r;
    tensorData[this.INPUT_SIZE * this.INPUT_SIZE + i] = g;
    tensorData[2 * this.INPUT_SIZE * this.INPUT_SIZE + i] = b;
  }

  return new ort.Tensor('float32', tensorData, [1, 3, this.INPUT_SIZE, this.INPUT_SIZE]);
}


  setThreshold(threshold: number): void {
    this.threshold = Math.max(0, Math.min(1, threshold));
  }

  getThreshold(): number {
    return this.threshold;
  }

  getStats() {
    return {
      frameCount: this.frameCount,
      threshold: this.threshold,
      inputSize: this.INPUT_SIZE,
    };
  }

  dispose(): void {
    if (this.session) {
      // Explicitly dispose to free WASM memory
      if (typeof (this.session as unknown as { dispose?: () => void }).dispose === 'function') {
        (this.session as unknown as { dispose: () => void }).dispose();
      }
      this.session = null;
    }
  }
}
