import * as ort from 'onnxruntime-web';

interface RecognitionResult {
  personId: string | null;
  similarity: number;
  embedding: Float32Array;
}

// Reference facial landmarks for alignment (matching research paper)
// Currently unused but kept for future similarity transform implementation
// const REFERENCE_ALIGNMENT = new Float32Array([
//   38.2946, 51.6963,   // left eye
//   73.5318, 51.5014,   // right eye  
//   56.0252, 71.7366,   // nose
//   41.5493, 92.3655,   // left mouth corner
//   70.7299, 92.2041    // right mouth corner
// ]);

export class ClientSideEdgeFaceService {
  private session: ort.InferenceSession | null = null;
  private database: Map<string, Float32Array> = new Map();
  private similarityThreshold: number = 0.6; // 60% similarity threshold
  
  // Model specifications (matching research paper)
  private readonly INPUT_SIZE = 112; // EdgeFace input size: 112x112
  private readonly INPUT_MEAN = 127.5;
  private readonly INPUT_STD = 127.5;
  private readonly EMBEDDING_DIM = 512; // EdgeFace embedding dimension

  constructor(similarityThreshold: number = 0.6) {
    this.similarityThreshold = similarityThreshold;
  }

  async initialize(): Promise<void> {
    try {
      console.log('🚀 Initializing EdgeFace Recognition Service...');
      
      // Let ONNX.js automatically find WASM files from node_modules
      // No need to manually configure paths - it will find them automatically
      
      console.log('📁 Loading EdgeFace model from /weights/edgeface-recognition.onnx...');
      
      // Load EdgeFace ONNX model with simpler configuration
      this.session = await ort.InferenceSession.create('/weights/edgeface-recognition.onnx', {
        executionProviders: ['wasm']
      });
      
      console.log('✅ EdgeFace model loaded successfully');
      console.log('📊 EdgeFace Input Names:', this.session.inputNames);
      console.log('📊 EdgeFace Output Names:', this.session.outputNames);
      
      // Verify input/output shapes
      const inputInfo = this.session.inputNames[0];
      const outputInfo = this.session.outputNames[0];
      console.log('🔍 EdgeFace Input Info:', inputInfo);
      console.log('🔍 EdgeFace Output Info:', outputInfo);
      
    } catch (error) {
      console.error('❌ Failed to initialize EdgeFace service:', error);
      console.error('📋 Error details:', error);
      throw new Error(`EdgeFace initialization failed: ${error}`);
    }
  }

  /**
   * Extract face embedding from aligned face crop using facial landmarks
   */
  async extractEmbedding(imageData: ImageData, landmarks: number[][]): Promise<Float32Array> {
    if (!this.session) {
      throw new Error('EdgeFace service not initialized');
    }

    try {
      // Convert landmarks to required format (5 points x 2 coordinates)
      if (landmarks.length < 5) {
        throw new Error('Insufficient landmarks for face alignment (need 5 points)');
      }
      
      const landmarkPoints = new Float32Array(10);
      for (let i = 0; i < 5; i++) {
        landmarkPoints[i * 2] = landmarks[i][0];     // x coordinate
        landmarkPoints[i * 2 + 1] = landmarks[i][1]; // y coordinate
      }

      // 1. Align and crop face using landmarks
      const alignedFace = this.alignFace(imageData, landmarkPoints);
      
      // 2. Preprocess for EdgeFace model
      const inputTensor = this.preprocessImage(alignedFace);
      
      // 3. Run inference
      const feeds = { [this.session.inputNames[0]]: inputTensor };
      const results = await this.session.run(feeds);
      
      // 4. Extract and normalize embedding
      const outputTensor = results[this.session.outputNames[0]];
      const embedding = new Float32Array(outputTensor.data as Float32Array);
      
      // L2 normalization (critical for cosine similarity)
      const norm = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
      for (let i = 0; i < embedding.length; i++) {
        embedding[i] /= norm;
      }
      
      return embedding;
      
    } catch (error) {
      console.error('❌ Embedding extraction failed:', error);
      throw error;
    }
  }

  /**
   * Recognize face by comparing embedding with database
   */
  async recognizeFace(imageData: ImageData, landmarks: number[][]): Promise<RecognitionResult> {
    try {
      // Extract embedding from detected face
      const embedding = await this.extractEmbedding(imageData, landmarks);
      
      // Find best match in database
      const { personId, similarity } = this.findBestMatch(embedding);
      
      return {
        personId,
        similarity,
        embedding
      };
      
    } catch (error) {
      console.error('❌ Face recognition failed:', error);
      return {
        personId: null,
        similarity: 0,
        embedding: new Float32Array(this.EMBEDDING_DIM)
      };
    }
  }

  /**
   * Register a new person in the face database
   */
  async registerPerson(personId: string, imageData: ImageData, landmarks: number[][]): Promise<boolean> {
    try {
      console.log(`📝 Registering person: ${personId}`);
      
      // Extract high-quality embedding
      const embedding = await this.extractEmbedding(imageData, landmarks);
      
      // Store in database
      this.database.set(personId, embedding);
      
      console.log(`✅ Successfully registered ${personId} with ${embedding.length}D embedding`);
      return true;
      
    } catch (error) {
      console.error(`❌ Failed to register ${personId}:`, error);
      return false;
    }
  }

  /**
   * Get all registered persons
   */
  getAllPersons(): string[] {
    return Array.from(this.database.keys());
  }

  /**
   * Remove person from database
   */
  removePerson(personId: string): boolean {
    return this.database.delete(personId);
  }

  /**
   * Get database statistics
   */
  getStats() {
    return {
      totalPersons: this.database.size,
      threshold: this.similarityThreshold,
      embeddingDim: this.EMBEDDING_DIM
    };
  }

  // ================== PRIVATE METHODS ==================

  /**
   * Align face using facial landmarks (matching Python implementation)
   */
  private alignFace(imageData: ImageData, landmarks: Float32Array): ImageData {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    
    canvas.width = this.INPUT_SIZE;
    canvas.height = this.INPUT_SIZE;
    
    // Create source image canvas
    const sourceCanvas = document.createElement('canvas');
    const sourceCtx = sourceCanvas.getContext('2d')!;
    sourceCanvas.width = imageData.width;
    sourceCanvas.height = imageData.height;
    sourceCtx.putImageData(imageData, 0, 0);
    
    // Calculate similarity transform matrix (simplified version)
    // For production, you'd want to implement the full similarity transform
    // For now, using a simplified approach that focuses on eye alignment
    
    const leftEye = [landmarks[0], landmarks[1]];
    const rightEye = [landmarks[2], landmarks[3]];
    // const nose = [landmarks[4], landmarks[5]]; // For future use
    
    // Calculate eye center and angle
    const eyeCenterX = (leftEye[0] + rightEye[0]) / 2;
    const eyeCenterY = (leftEye[1] + rightEye[1]) / 2;
    const eyeAngle = Math.atan2(rightEye[1] - leftEye[1], rightEye[0] - leftEye[0]);
    
    // Calculate scale based on eye distance
    const eyeDistance = Math.sqrt(
      Math.pow(rightEye[0] - leftEye[0], 2) + Math.pow(rightEye[1] - leftEye[1], 2)
    );
    const targetEyeDistance = 40; // Target distance in 112x112 image
    const scale = targetEyeDistance / eyeDistance;
    
    // Apply transformation
    ctx.save();
    ctx.translate(this.INPUT_SIZE / 2, this.INPUT_SIZE / 2);
    ctx.rotate(-eyeAngle);
    ctx.scale(scale, scale);
    ctx.translate(-eyeCenterX, -eyeCenterY);
    ctx.drawImage(sourceCanvas, 0, 0);
    ctx.restore();
    
    return ctx.getImageData(0, 0, this.INPUT_SIZE, this.INPUT_SIZE);
  }

  /**
   * Preprocess aligned face for EdgeFace model input
   */
  private preprocessImage(alignedFace: ImageData): ort.Tensor {
    const { width, height, data } = alignedFace;
    
    // Convert RGBA to RGB and normalize
    const rgbData = new Float32Array(3 * width * height);
    
    for (let i = 0; i < width * height; i++) {
      const rgbaIndex = i * 4;
      const rgbIndex = i * 3;
      
      // Convert to RGB and normalize (0-255 -> -1 to 1)
      rgbData[rgbIndex] = (data[rgbaIndex] - this.INPUT_MEAN) / this.INPUT_STD;         // R
      rgbData[rgbIndex + 1] = (data[rgbaIndex + 1] - this.INPUT_MEAN) / this.INPUT_STD; // G  
      rgbData[rgbIndex + 2] = (data[rgbaIndex + 2] - this.INPUT_MEAN) / this.INPUT_STD; // B
    }
    
    // Rearrange to CHW format (Channel-Height-Width)
    const chwData = new Float32Array(3 * width * height);
    const channelSize = width * height;
    
    for (let c = 0; c < 3; c++) {
      for (let h = 0; h < height; h++) {
        for (let w = 0; w < width; w++) {
          const srcIndex = (h * width + w) * 3 + c;
          const dstIndex = c * channelSize + h * width + w;
          chwData[dstIndex] = rgbData[srcIndex];
        }
      }
    }
    
    // Create tensor in NCHW format [1, 3, 112, 112]
    return new ort.Tensor('float32', chwData, [1, 3, height, width]);
  }

  /**
   * Find best matching person in database using cosine similarity
   */
  private findBestMatch(queryEmbedding: Float32Array): { personId: string | null; similarity: number } {
    if (this.database.size === 0) {
      return { personId: null, similarity: 0 };
    }
    
    let bestMatch: string | null = null;
    let bestSimilarity = 0;
    
    for (const [personId, storedEmbedding] of this.database.entries()) {
      // Calculate cosine similarity (both embeddings are already normalized)
      let similarity = 0;
      for (let i = 0; i < queryEmbedding.length; i++) {
        similarity += queryEmbedding[i] * storedEmbedding[i];
      }
      
      // Update best match if similarity exceeds threshold
      if (similarity > bestSimilarity && similarity >= this.similarityThreshold) {
        bestSimilarity = similarity;
        bestMatch = personId;
      }
    }
    
    return { personId: bestMatch, similarity: bestSimilarity };
  }

  /**
   * Load face database from localStorage (for persistence)
   */
  loadDatabase(): boolean {
    try {
      const stored = localStorage.getItem('edgeface_database');
      if (stored) {
        const data = JSON.parse(stored);
        this.database.clear();
        
        for (const [personId, embeddingArray] of Object.entries(data)) {
          this.database.set(personId, new Float32Array(embeddingArray as number[]));
        }
        
        console.log(`📂 Loaded ${this.database.size} persons from database`);
        return true;
      }
    } catch (error) {
      console.error('❌ Failed to load database:', error);
    }
    return false;
  }

  /**
   * Save face database to localStorage
   */
  saveDatabase(): boolean {
    try {
      const data: Record<string, number[]> = {};
      for (const [personId, embedding] of this.database.entries()) {
        data[personId] = Array.from(embedding);
      }
      
      localStorage.setItem('edgeface_database', JSON.stringify(data));
      console.log(`💾 Saved ${this.database.size} persons to database`);
      return true;
    } catch (error) {
      console.error('❌ Failed to save database:', error);
      return false;
    }
  }
}
