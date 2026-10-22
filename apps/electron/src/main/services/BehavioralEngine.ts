import { EventEmitter } from 'events';

interface BehavioralEvent {
  type: 'tailgating' | 'loitering' | 'reid_match';
  studentId: string;
  zoneId: string;
  timestamp: string;
  confidence: number;
}

/**
 * BehavioralEngine.ts — AG-009
 * Analisa a sequência temporal de eventos de reconhecimento para 
 * identificar padrões anômalos ou comportamentais.
 */
class BehavioralEngine extends EventEmitter {
  private recentDetections = new Map<string, { studentId: string; ts: number }>(); // zoneId -> last detection
  private zoneStayTracking = new Map<string, { studentId: string; entryTs: number }>(); // combined key -> entryTs
  
  private readonly TAILGATING_THRESHOLD_MS = 2500; // 2.5s entre pessoas na mesma entrada
  private readonly LOITERING_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutos parado na mesma zona

  constructor() {
    super();
  }

  /**
   * Processa um evento de reconhecimento facial único para inferir comportamentos.
   */
  public processRecognition(data: { studentId: string; zoneId: string; ts: number }) {
    const now = Date.now();
    const { studentId, zoneId } = data;

    // 1. Detecção de Tailgating (Item 71)
    const lastZoneEvent = this.recentDetections.get(zoneId);
    if (lastZoneEvent && lastZoneEvent.studentId !== studentId) {
      const diff = now - lastZoneEvent.ts;
      if (diff < this.TAILGATING_THRESHOLD_MS) {
        this.emit('behavioral-alert', {
          type: 'tailgating',
          studentId,
          zoneId,
          timestamp: new Date().toISOString(),
          confidence: 0.85 // Baseado na proximidade temporal
        } as BehavioralEvent);
      }
    }
    this.recentDetections.set(zoneId, { studentId, ts: now });

    // 2. Detecção de Loitering (Item 72)
    const stayKey = `${studentId}:${zoneId}`;
    const stayInfo = this.zoneStayTracking.get(stayKey);
    
    if (!stayInfo) {
      this.zoneStayTracking.set(stayKey, { studentId, entryTs: now });
    } else {
      const stayDuration = now - stayInfo.entryTs;
      if (stayDuration > this.LOITERING_THRESHOLD_MS) {
        this.emit('behavioral-alert', {
          type: 'loitering',
          studentId,
          zoneId,
          timestamp: new Date().toISOString(),
          confidence: 0.9
        } as BehavioralEvent);
        
        // Resetar para não emitir alertas duplicados a cada frame (cool-down de 10 min)
        this.zoneStayTracking.set(stayKey, { studentId, entryTs: now + (10 * 60 * 1000) });
      }
    }

    // 3. Limpeza Periódica de cache (Otimização)
    this.periodicCleanup(now);
  }

  private periodicCleanup(now: number) {
    // Se não houver reID ou atualização em 15 min, limpar stayTracking
    for (const [key, val] of this.zoneStayTracking.entries()) {
      if (now - val.entryTs > 30 * 60 * 1000) {
        this.zoneStayTracking.delete(key);
      }
    }
  }
}

export const behavioralEngine = new BehavioralEngine();
export default behavioralEngine;

