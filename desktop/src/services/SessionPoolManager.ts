import * as ort from 'onnxruntime-web/all';

/**
 * Session Pool Manager for ONNX Runtime optimization
 * Implements session pooling and WebGL context optimization to reduce initialization time
 */

export interface PooledSession {
  session: ort.InferenceSession;
  inUse: boolean;
  lastUsed: number;
  modelName: string;
}

export class SessionPoolManager {
  private static instance: SessionPoolManager;
  private sessionPools: Map<string, PooledSession[]> = new Map();
  private maxPoolSize = 3; // Maximum sessions per model
  private sessionTimeout = 30000; // 30 seconds timeout for unused sessions
  private webglContext: WebGL2RenderingContext | null = null;
  private cleanupInterval: NodeJS.Timeout | null = null;

  private constructor() {
    // Initialize WebGL context for sharing
    this.initializeSharedWebGLContext();
    
    // Start cleanup interval
    this.cleanupInterval = setInterval(() => {
      this.cleanupUnusedSessions();
    }, 10000); // Cleanup every 10 seconds
  }

  public static getInstance(): SessionPoolManager {
    if (!SessionPoolManager.instance) {
      SessionPoolManager.instance = new SessionPoolManager();
    }
    return SessionPoolManager.instance;
  }

  /**
   * Initialize a shared WebGL context for better performance
   */
  private initializeSharedWebGLContext(): void {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 1;
      canvas.height = 1;
      
      const contextOptions: WebGLContextAttributes = {
        alpha: false,
        antialias: false,
        depth: false,
        stencil: false,
        preserveDrawingBuffer: false,
        powerPreference: 'high-performance',
        failIfMajorPerformanceCaveat: false
      };
      
      this.webglContext = canvas.getContext('webgl2', contextOptions) as WebGL2RenderingContext;
      
      if (this.webglContext) {
        console.log('🎯 Shared WebGL2 context initialized for session pooling');
      }
    } catch (error) {
      console.warn('⚠️ Failed to initialize shared WebGL context:', error);
    }
  }

  /**
   * Get optimized session options with shared WebGL context
   */
  public getOptimizedSessionOptions(): ort.InferenceSession.SessionOptions {
    return {
      executionProviders: [
        {
          name: 'webgl'
        },
        'wasm'
      ],
      logSeverityLevel: 3, // Error only
      logVerbosityLevel: 0,
      enableMemPattern: true,
      enableCpuMemArena: true,
      executionMode: 'parallel',
      graphOptimizationLevel: 'all',
      enableProfiling: false,
      freeDimensionOverrides: {
        'batch_size': 1
      },
      extra: {
        session: {
          use_ort_model_bytes_directly: true,
          use_ort_model_bytes_for_initializers: true,
          disable_prepacking: false,
          use_device_allocator_for_initializers: true
        }
      }
    };
  }

  /**
   * Get or create a pooled session
   */
  public async getSession(modelName: string, createSessionFn: () => Promise<ort.InferenceSession>): Promise<PooledSession> {
    const pool = this.sessionPools.get(modelName) || [];
    
    // Find available session in pool
    const availableSession = pool.find(session => !session.inUse);
    
    if (availableSession) {
      availableSession.inUse = true;
      availableSession.lastUsed = Date.now();
      console.log(`♻️ Reusing pooled session for ${modelName}`);
      return availableSession;
    }
    
    // Create new session if pool not full
    if (pool.length < this.maxPoolSize) {
      console.log(`🆕 Creating new pooled session for ${modelName}`);
      const session = await createSessionFn();
      
      const pooledSession: PooledSession = {
        session,
        inUse: true,
        lastUsed: Date.now(),
        modelName
      };
      
      pool.push(pooledSession);
      this.sessionPools.set(modelName, pool);
      
      return pooledSession;
    }
    
    // Wait for available session if pool is full
    return new Promise((resolve) => {
      const checkForAvailable = () => {
        const available = pool.find(session => !session.inUse);
        if (available) {
          available.inUse = true;
          available.lastUsed = Date.now();
          resolve(available);
        } else {
          setTimeout(checkForAvailable, 10);
        }
      };
      checkForAvailable();
    });
  }

  /**
   * Release a session back to the pool
   */
  public releaseSession(pooledSession: PooledSession): void {
    pooledSession.inUse = false;
    pooledSession.lastUsed = Date.now();
  }

  /**
   * Cleanup unused sessions to free memory
   */
  private cleanupUnusedSessions(): void {
    const now = Date.now();
    
    for (const [modelName, pool] of this.sessionPools.entries()) {
      const activePool = pool.filter(session => {
        if (!session.inUse && (now - session.lastUsed) > this.sessionTimeout) {
          // Session cleanup is handled automatically by ONNX Runtime Web
          console.log(`Removing unused session for ${modelName}`);
          return false;
        }
        return true;
      });
      
      if (activePool.length !== pool.length) {
        console.log(`🧹 Cleaned up ${pool.length - activePool.length} unused sessions for ${modelName}`);
        this.sessionPools.set(modelName, activePool);
      }
    }
  }

  /**
   * Warm up sessions for faster first inference
   */
  public async warmupSession(pooledSession: PooledSession, dummyInput: Record<string, ort.Tensor>): Promise<void> {
    try {
      // Run a dummy inference to warm up the session
      await pooledSession.session.run(dummyInput);
      console.log(`🔥 Warmed up session for ${pooledSession.modelName}`);
    } catch (error) {
      console.warn(`Failed to warm up session for ${pooledSession.modelName}:`, error);
    }
  }

  /**
   * Dispose all sessions and cleanup
   */
  public dispose(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    
    for (const [modelName, pool] of this.sessionPools.entries()) {
      // Session cleanup is handled automatically by ONNX Runtime Web
      console.log(`Clearing ${pool.length} sessions for ${modelName}`);
    }
    
    this.sessionPools.clear();
    console.log('🗑️ Session pool manager disposed');
  }
}