import { EventEmitter } from 'events';

/**
 * ObjectDetectionService.ts — AG-035
 * Identifica objetos perigosos (armas, facas) e anomalias físicas (fumaça).
 */
class ObjectDetectionService extends EventEmitter {
  
  /**
   * Processa detecções brutas do worker (YOLO/TensorFlow).
   */
  public processObjectDetection(data: { type: string; confidence: number; label: string }) {
    const dangerousLabels = ['weapon', 'handgun', 'knife', 'smoke', 'fire'];
    
    if (dangerousLabels.includes(data.label.toLowerCase()) && data.confidence > 0.65) {
        console.warn(`[ObjectDetection] OBJETO PERIGOSO DETECTADO: ${data.label} (${(data.confidence * 100).toFixed(1)}%)`);
        this.emit('security-threat', {
            type: data.label,
            severity: 'critical',
            ts: Date.now()
        });
    }
  }
}

export const objectDetection = new ObjectDetectionService();
export default objectDetection;

