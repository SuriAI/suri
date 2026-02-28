import type {
  FaceRecognitionResponse,
  FaceRegistrationResponse,
  PersonRemovalResponse,
  PersonUpdateResponse,
  SimilarityThresholdResponse,
  DatabaseStatsResponse,
  PersonInfo,
} from "../types/recognition";
import type {
  WebSocketDetectionResponse,
  WebSocketConnectionMessage,
  WebSocketErrorMessage,
} from "../components/main/types";
import { ElectronAdapter } from "./adapters/ElectronAdapter";

interface DetectionRequest {
  image: string;
  model_type?: string;
  confidence_threshold?: number;
  nms_threshold?: number;
  enable_liveness_detection?: boolean;
}

interface DetectionResponse {
  faces: Array<{
    bbox: [number, number, number, number];
    confidence: number;
    landmarks_5?: number[][];
  }>;
  model_used: string;
  session_id?: string;
}

interface BackendConfig {
  baseUrl: string;
  timeout: number;
  retryAttempts: number;
}

interface ModelInfo {
  name: string;
  description?: string;
  version?: string;
}

export type WebSocketStatus =
  | "disconnected"
  | "connecting"
  | "connected"
  | "error";

export interface WebSocketEventMap {
  connection: WebSocketConnectionMessage;
  detection_response: WebSocketDetectionResponse;
  error: WebSocketErrorMessage;
  config_ack: { success: boolean; timestamp: number };
  pong: { client_id: string; timestamp: number };
}

export class BackendService {
  private config: BackendConfig;
  private adapter: ElectronAdapter;

  private enableLivenessDetection: boolean = true;
  private ws: WebSocket | null = null;
  private wsStatus: WebSocketStatus = "disconnected";
  private messageHandlers: Map<
    keyof WebSocketEventMap,
    Set<(data: any) => void> // eslint-disable-line @typescript-eslint/no-explicit-any
  > = new Map();
  private clientId: string;

  constructor(config?: Partial<BackendConfig>) {
    this.config = {
      baseUrl: "http://127.0.0.1:8700",
      timeout: 30000,
      retryAttempts: 3,
      ...config,
    };

    this.clientId = `client_${Math.random().toString(36).substring(2, 11)}_${Date.now()}`;
    this.adapter = new ElectronAdapter();
  }

  getWebSocketStatus(): WebSocketStatus {
    return this.wsStatus;
  }

  isWebSocketReady(): boolean {
    return (
      this.wsStatus === "connected" && this.ws?.readyState === WebSocket.OPEN
    );
  }

  async connectWebSocket(): Promise<void> {
    if (this.wsStatus === "connected" || this.wsStatus === "connecting") {
      return;
    }

    return new Promise((resolve, reject) => {
      try {
        this.wsStatus = "connecting";
        const wsUrl = `${this.config.baseUrl.replace(/^http/, "ws")}/ws/detect/${this.clientId}`;
        this.ws = new WebSocket(wsUrl);
        this.ws.binaryType = "arraybuffer";

        this.ws.onopen = () => {
          this.wsStatus = "connected";
          this.notifyHandlers("connection", {
            status: "connected",
            message: "Connected to detector",
          });

          if (this.ws) {
            this.ws.send(
              JSON.stringify({
                type: "config",
                enable_liveness_detection: this.enableLivenessDetection,
              }),
            );
          }
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type) {
              this.notifyHandlers(data.type, data);
            } else if (data.faces || data.model_used) {
              // Legacy/Direct detection response
              this.notifyHandlers("detection_response", data);
            }
          } catch (e) {
            console.error("Failed to parse WebSocket message:", e);
          }
        };

        this.ws.onclose = () => {
          const prevStatus = this.wsStatus;
          this.wsStatus = "disconnected";
          this.ws = null;
          if (prevStatus !== "disconnected") {
            this.notifyHandlers("connection", {
              status: "disconnected",
              message: "Disconnected from detector",
            });
          }
        };

        this.ws.onerror = (error) => {
          this.wsStatus = "error";
          this.notifyHandlers("error", { message: "WebSocket error occurred" });
          reject(error);
        };
      } catch (error) {
        this.wsStatus = "error";
        reject(error);
      }
    });
  }

  disconnect(): void {
    if (this.ws) {
      this.wsStatus = "disconnected";
      this.ws.close();
      this.ws = null;
    }
  }

  onMessage<K extends keyof WebSocketEventMap>(
    topic: K,
    handler: (data: WebSocketEventMap[K]) => void,
  ): void {
    if (!this.messageHandlers.has(topic)) {
      this.messageHandlers.set(topic, new Set());
    }
    this.messageHandlers.get(topic)!.add(handler);
  }

  offMessage<K extends keyof WebSocketEventMap>(
    topic: K,
    handler?: (data: WebSocketEventMap[K]) => void,
  ): void {
    if (!handler) {
      this.messageHandlers.delete(topic);
    } else {
      const handlers = this.messageHandlers.get(topic);
      if (handlers) {
        handlers.delete(handler);
        if (handlers.size === 0) {
          this.messageHandlers.delete(topic);
        }
      }
    }
  }

  private notifyHandlers<K extends keyof WebSocketEventMap>(
    topic: K,
    data: WebSocketEventMap[K],
  ): void {
    const handlers = this.messageHandlers.get(topic);
    if (handlers) {
      handlers.forEach((handler) => {
        try {
          handler(data);
        } catch (e) {
          console.error(`Error in WebSocket handler for ${topic}:`, e);
        }
      });
    }
  }

  async sendDetectionRequest(frameData: ArrayBuffer): Promise<void> {
    if (!this.isWebSocketReady()) {
      throw new Error("WebSocket not ready");
    }

    this.ws!.send(frameData);
  }

  async isBackendAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${this.config.baseUrl}/`, {
        method: "GET",
        signal: AbortSignal.timeout(5000),
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  async checkReadiness(): Promise<{
    ready: boolean;
    modelsLoaded: boolean;
    error?: string;
  }> {
    try {
      const isAvailable = await this.isBackendAvailable();
      if (!isAvailable) {
        return {
          ready: false,
          modelsLoaded: false,
          error: "Backend not available",
        };
      }

      const models = await this.getAvailableModels();
      const requiredModels = ["face_detector", "face_recognizer"];
      const loadedModels = Object.keys(models).filter((key) =>
        requiredModels.some((required) =>
          key.toLowerCase().includes(required.toLowerCase()),
        ),
      );

      const modelsLoaded = loadedModels.length >= requiredModels.length;

      return {
        ready: modelsLoaded,
        modelsLoaded,
        error: modelsLoaded
          ? undefined
          : "Required face recognition models not loaded",
      };
    } catch (error) {
      console.error("Failed to check backend readiness:", error);
      return {
        ready: false,
        modelsLoaded: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  async getAvailableModels(): Promise<Record<string, ModelInfo>> {
    try {
      const response = await fetch(`${this.config.baseUrl}/models`, {
        method: "GET",
        signal: AbortSignal.timeout(this.config.timeout),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Failed to get available models:", error);
      throw error;
    }
  }

  async detectFaces(
    imageData: string,
    options: {
      model_type?: string;
      confidence_threshold?: number;
      nms_threshold?: number;
    } = {},
  ): Promise<DetectionResponse> {
    try {
      const request: DetectionRequest = {
        image: imageData,
        model_type: options.model_type || "face_detector",
        confidence_threshold: options.confidence_threshold || 0.5,
        nms_threshold: options.nms_threshold || 0.3,
        enable_liveness_detection: this.enableLivenessDetection,
      };

      const response = await fetch(`${this.config.baseUrl}/detect`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
        signal: AbortSignal.timeout(this.config.timeout),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Face detection failed:", error);
      throw error;
    }
  }

  setLivenessDetection(enabled: boolean): void {
    this.enableLivenessDetection = enabled;
    if (this.isWebSocketReady()) {
      this.ws!.send(
        JSON.stringify({
          type: "config",
          enable_liveness_detection: enabled,
        }),
      );
    }
  }

  async recognizeFace(
    imageData: ArrayBuffer,
    bbox: number[],
    groupId: string,
    landmarks_5: number[][],
  ): Promise<FaceRecognitionResponse> {
    try {
      const blob = new Blob([imageData], { type: "image/jpeg" });
      const dataUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });
      const base64Image = dataUrl.split(",")[1];

      return await this.adapter.recognizeFace(
        base64Image,
        bbox,
        groupId,
        landmarks_5,
        this.enableLivenessDetection,
      );
    } catch (error) {
      console.error("Face recognition failed:", error);
      throw error;
    }
  }

  async registerFace(
    imageData: string,
    personId: string,
    bbox: number[],
    groupId: string,
    landmarks_5: number[][],
  ): Promise<FaceRegistrationResponse> {
    try {
      return await this.adapter.registerFace(
        imageData,
        personId,
        bbox,
        groupId,
        landmarks_5,
        this.enableLivenessDetection,
      );
    } catch (error) {
      console.error("Face registration failed:", error);
      throw error;
    }
  }

  async removePerson(personId: string): Promise<PersonRemovalResponse> {
    try {
      return await this.adapter.removePerson(personId);
    } catch (error) {
      console.error("Person removal failed:", error);
      throw error;
    }
  }

  async updatePerson(
    oldPersonId: string,
    newPersonId: string,
  ): Promise<PersonUpdateResponse> {
    try {
      return await this.adapter.updatePerson(oldPersonId, newPersonId);
    } catch (error) {
      console.error("Person update failed:", error);
      throw error;
    }
  }

  async getAllPersons(): Promise<PersonInfo[]> {
    try {
      const result = await this.adapter.getAllPersons();
      return result.persons || [];
    } catch (error) {
      console.error("Failed to get persons:", error);
      throw error;
    }
  }

  async setSimilarityThreshold(
    threshold: number,
  ): Promise<SimilarityThresholdResponse> {
    try {
      return await this.adapter.setThreshold(threshold);
    } catch (error) {
      console.error("Failed to set similarity threshold:", error);
      throw error;
    }
  }

  async clearDatabase(): Promise<{ success: boolean; message: string }> {
    try {
      return await this.adapter.clearDatabase();
    } catch (error) {
      console.error("Failed to clear database:", error);
      throw error;
    }
  }

  async clearCache(): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(
        `${this.config.baseUrl}/face/cache/invalidate`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          signal: AbortSignal.timeout(this.config.timeout),
        },
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      return {
        success: true,
        message:
          typeof result?.message === "string"
            ? result.message
            : "Cache invalidated",
      };
    } catch (error) {
      console.error("Failed to clear cache:", error);
      return {
        success: false,
        message: `Failed to clear cache: ${error}`,
      };
    }
  }

  async getDatabaseStats(): Promise<DatabaseStatsResponse> {
    try {
      return await this.adapter.getFaceStats();
    } catch (error) {
      console.error("Failed to get database stats:", error);
      throw error;
    }
  }
}

export const backendService = new BackendService();
