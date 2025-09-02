import cv from 'opencv4nodejs';
import { OpenCVDetectionService } from './OpenCVDetectionService.js';
import type { DetectionResult } from './OpenCVDetectionService.js';

export interface SerializableImageData {
  data: Uint8ClampedArray;
  width: number;
  height: number;
  colorSpace?: PredefinedColorSpace;
}

export interface PipelineResult {
  detections: Array<{
    bbox: [number, number, number, number];
    confidence: number;
    landmarks: number[][];
    recognition?: {
      personId: string | null;
      similarity: number;
    };
  }>;
  processingTime: number;
}

export class OpenCVPipeline {
  private detectionService: OpenCVDetectionService;
  private isInitialized = false;

  constructor() {
    this.detectionService = new OpenCVDetectionService();
  }

  async initialize(options?: {
    detectionModelPath?: string;
    recognitionModelPath?: string;
    similarityThreshold?: number;
  }): Promise<void> {
    try {
      console.log('Initializing OpenCV face recognition pipeline...');
      
      // Initialize detection service
      await this.detectionService.initialize(options?.detectionModelPath);
      
      this.isInitialized = true;
      console.log('OpenCV face recognition pipeline initialized successfully');
    } catch (error) {
      console.error('Failed to initialize OpenCV face recognition pipeline:', error);
      throw error;
    }
  }

  async processFrame(imageData: SerializableImageData): Promise<PipelineResult> {
    if (!this.isInitialized) {
      throw new Error('OpenCV Pipeline not initialized');
    }

    const startTime = performance.now();

    try {
      // Convert ImageData to OpenCV Mat (exactly like Python cv2.imread result)
      const imageMat = this.imageDataToMat(imageData);
      
      // Step 1: Detect faces using OpenCV preprocessing
      const detections = await this.detectionService.detect(imageMat);
      
      // Convert to pipeline result format
      const results = detections.map((detection: DetectionResult) => ({
        bbox: detection.bbox,
        confidence: detection.confidence,
        landmarks: detection.landmarks,
        recognition: undefined // We'll add recognition later
      }));

      const processingTime = performance.now() - startTime;

      return {
        detections: results,
        processingTime
      };
    } catch (error) {
      console.error('OpenCV frame processing error:', error);
      return {
        detections: [],
        processingTime: performance.now() - startTime
      };
    }
  }

  private imageDataToMat(imageData: SerializableImageData): cv.Mat {
    const { data, width, height } = imageData;
    
    // Convert RGBA ImageData to BGR Mat (like Python cv2.imread)
    const matData = new Uint8Array(width * height * 3);
    
    for (let i = 0; i < width * height; i++) {
      const srcIdx = i * 4; // RGBA
      const dstIdx = i * 3; // BGR
      
      // Convert RGBA to BGR
      matData[dstIdx] = data[srcIdx + 2];     // B
      matData[dstIdx + 1] = data[srcIdx + 1]; // G  
      matData[dstIdx + 2] = data[srcIdx];     // R
      // Skip Alpha channel
    }
    
    // Create OpenCV Mat from BGR data
    return new cv.Mat(Buffer.from(matData), height, width, cv.CV_8UC3);
  }

  async registerPerson(personId: string, imageData: SerializableImageData, landmarks: number[][]): Promise<boolean> {
    try {
      // TODO: Implement face recognition registration
      console.log(`Registration placeholder for ${personId}`);
      return true;
    } catch (error) {
      console.error('Failed to register person:', error);
      return false;
    }
  }

  removePerson(personId: string): boolean {
    // TODO: Implement person removal
    return true;
  }

  getAllPersons(): string[] {
    // TODO: Implement get all persons
    return [];
  }

  getDatabaseSize(): number {
    // TODO: Implement database size
    return 0;
  }

  dispose(): void {
    this.detectionService.dispose();
    this.isInitialized = false;
  }
}
