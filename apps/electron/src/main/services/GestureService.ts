import { EventEmitter } from 'events';

export interface GestureEvent {
  studentId: string;
  gesture: 'thumbs_up' | 'thumbs_down' | 'none';
  ts: string;
}

/**
 * GestureService.ts — AG-015
 * Detecta gestos a partir de pontos fiduciais da face (via Python metadata).
 */
class GestureService extends EventEmitter {
  
  public processMetrics(studentId: string, metrics: any) {
    if (!metrics) return;

    // Lógica simplificada baseada no detector facial (Item 85)
    // No futuro, isso usará o MediaPipe no Python worker
    if (metrics.gesture === 'thumbs_up') {
        this.emit('gesture-detected', {
            studentId,
            gesture: 'thumbs_up',
            ts: new Date().toISOString()
        } as GestureEvent);
        console.log(`[GestureService] Aluno ${studentId} deu um Joinha! 👍`);
    }
  }
}

export const gestureService = new GestureService();
export default gestureService;

