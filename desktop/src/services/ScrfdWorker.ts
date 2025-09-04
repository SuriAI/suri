// WebWorker for face detection to avoid main thread blocking
import { ClientSideScrfdService } from "./ClientSideScrfdService.js";

let scrfdService: ClientSideScrfdService | null = null;

self.onmessage = async (event) => {
  const { type, data } = event.data;
  
  try {
    switch (type) {
      case 'init': {
        scrfdService = new ClientSideScrfdService();
        await scrfdService.initialize();
        self.postMessage({ type: 'init-complete' });
        break;
      }
        
      case 'detect': {
        if (!scrfdService) {
          throw new Error('SCRFD service not initialized');
        }
        
        const { imageData } = data;
        const detections = await scrfdService.detect(imageData);
        
        self.postMessage({ 
          type: 'detection-result', 
          data: { detections }
        });
        break;
      }
        
      default:
        throw new Error(`Unknown message type: ${type}`);
    }
  } catch (error) {
    self.postMessage({ 
      type: 'error', 
      data: { 
        message: error instanceof Error ? error.message : 'Unknown error' 
      }
    });
  }
};
