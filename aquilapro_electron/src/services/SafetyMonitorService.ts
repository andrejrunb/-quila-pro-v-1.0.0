import { EventEmitter } from 'events';
import { identityBridge } from './IdentityBridgeService';
import { locationZoneService } from './LocationZoneService';

export interface SafetyAlert {
  id?: string;
  type: 'FALL' | 'INACTIVITY' | 'STRANGE_PATTERN' | 'FALL_DETECTED' | 'LOITERING_DETECTED' | 'UNATTENDED_OBJECT' | 'AGGRESSION_DETECTED' | 'SLEEP_WARNING' | 'RESTLESSNESS' | 'POSTURE_ALERT';
  subjectId?: string;
  location: { x: number; y: number } | string;
  timestamp: string;
  severity: 'high' | 'medium' | 'low' | 'CRITICAL' | 'WARNING' | 'EMERGENCY';
  message?: string;
}

interface PersonState {
  id: string;
  startTime: number;
  lastLocation: string;
  isLoitering: boolean;
}

/**
 * SafetyMonitorService (v1613 - v1620)
 * Monitoramento proativo de segurança baseada em comportamento.
 * Integra detecção de quedas e análise de vadiagem (loitering).
 */
class SafetyMonitorService extends EventEmitter {
  private activeAlerts: Map<string, SafetyAlert> = new Map();
  private personTracking: Map<string, PersonState> = new Map();
  private staticObjects: Map<string, { firstSeen: number, location: { x: number, y: number } }> = new Map();
  private exitWatchdogs: Map<string, { studentId: string, authorizedType: string, startTime: number }> = new Map();
  
  private readonly LOITERING_THRESHOLD = 5 * 60 * 1000;
  private readonly OBJECT_THRESHOLD = 10 * 60 * 1000; // 10 min

  constructor() {
    super();
  }

  public processSignal(signal: any) {
    // 1. Detecção de Queda (v1613)
    if (signal.intensity > 15 && signal.type === 'fall_impact') {
      this.emitAlert('FALL_DETECTED', signal.location || 'Árvore de Banheiros', 'CRITICAL', 'Queda detectada!');
    }

    // 2. Detecção de Agressão / Luta (v1622)
    if (signal.frequency > 50 && signal.variance > 20) {
       this.emitAlert('AGGRESSION_DETECTED', signal.location, 'EMERGENCY', 'Alta dinâmica detectada: Possível briga ou pânico!');
    }

    // 3. Detecção de Objeto Abandonado (v1621)
    if (signal.type === 'static_object') {
       this.trackStaticObject(signal.id || 'obj_unknown', signal.location);
    }

    // 4. Detecção de Vadiagem / Loitering (v1620)
    if (signal.id && signal.location && signal.type === 'person') {
      this.trackMovement(signal.id, signal.location);
    }

    // 5. Comportamento em Sala (v1626)
    if (signal.id && signal.type === 'classroom_telemetry') {
       this.trackClassroomBehavior(signal);
    }
  }

  private emitAlert(type: any, location: string, severity: any, message: string) {
    this.emit('safety-alert', {
      type,
      location,
      severity,
      message,
      timestamp: new Date().toISOString()
    });
  }

  private trackMovement(id: string, location: string) {
    const now = Date.now();
    let state = this.personTracking.get(id);

    if (!state || state.lastLocation !== location) {
      // Nova pessoa ou mudou de ambiente - reseta timer
      this.personTracking.set(id, {
        id,
        startTime: now,
        lastLocation: location,
        isLoitering: false
      });
    } else {
      // Mesma pessoa no mesmo lugar
      const dwellTime = now - state.startTime;
      
      if (dwellTime > this.LOITERING_THRESHOLD && !state.isLoitering) {
        state.isLoitering = true;
        this.emitAlert('LOITERING_DETECTED', location, 'WARNING', `Presença prolongada detectada em ${location} (>5 min).`);
      }
    }
  }

  private trackStaticObject(id: string, location: { x: number, y: number }) {
    const now = Date.now();
    let obj = this.staticObjects.get(id);

    if (!obj) {
      this.staticObjects.set(id, { firstSeen: now, location });
    } else {
      const duration = now - obj.firstSeen;
      if (duration > this.OBJECT_THRESHOLD) {
        const locStr = `(${location.x}, ${location.y})`;
        this.emitAlert('UNATTENDED_OBJECT', locStr, 'WARNING', `Objeto abandonado detectado em ${locStr} (>10 min).`);
        // Remove para evitar spam
        this.staticObjects.delete(id);
      }
    }
  }

  private trackClassroomBehavior(signal: any) {
    // Sono (Baixa variância por longo tempo)
    if (signal.variance < 0.5 && signal.duration > 300000) { // 5 min parado
       this.emitAlert('SLEEP_WARNING', signal.location, 'low', `Aluno ${signal.id} apresenta imobilidade prolongada (possível sono).`);
    }

    // Inquietude (Alta variância e deslocamento micro)
    if (signal.variance > 15 && signal.displacement > 5) {
       this.emitAlert('RESTLESSNESS', signal.location, 'low', `Aluno ${signal.id} apresenta inquietude acentuada (levanta/anda muito).`);
    }

    // Postura (v1627)
    if (signal.type === 'classroom_telemetry' && !identityBridge.validateSeating(signal.id, signal.location)) {
       this.emitAlert('POSTURE_ALERT', signal.location, 'low', `Aluno ${signal.id} apresenta postura inadequada na cadeira designada.`);
    }

    // Rastreamento de Saída (v1629)
    const currentZone = locationZoneService.getZoneAt(signal.location.x, signal.location.y);
    const student = identityBridge.getIdentity(signal.id);
    
    if (student) {
      this.processPathWatchdog(student.studentId, currentZone, signal.location);
    }
  }

  private processPathWatchdog(studentId: string, currentZone: any, location: any) {
    const watchdog = this.exitWatchdogs.get(studentId);
    
    // Início da Saída (Detectado rastro em corredor vindo de sala)
    if (!watchdog && currentZone?.type === 'corridor') {
       this.exitWatchdogs.set(studentId, { 
         studentId, 
         authorizedType: 'bathroom', // Mock: assume banheiro por padrão
         startTime: Date.now() 
       });
       console.log(`[SafetyMonitor] Student ${studentId} exited to corridor. Watchdog active.`);
       return;
    }

    if (watchdog) {
       // Validar se o destino é condizente
       if (currentZone && currentZone.type !== 'corridor' && currentZone.type !== 'classroom') {
          if (currentZone.type !== watchdog.authorizedType) {
             this.emitAlert('STRANGE_PATTERN', location, 'medium', 
               `DESVIO DE ROTA: Aluno ${studentId} entrou em ${currentZone.name} (Destino autorizado: ${watchdog.authorizedType}).`);
             this.exitWatchdogs.delete(studentId);
          } else {
             console.log(`[SafetyMonitor] Student ${studentId} reached authorized destination: ${currentZone.name}`);
             this.exitWatchdogs.delete(studentId);
          }
       }
       
       // Timeout: Aluno sumiu ou demorou demais no corredor
       if (Date.now() - watchdog.startTime > 600000) { // 10 min
          this.emitAlert('INACTIVITY', location, 'medium', `ALERTA DE TEMPO: Aluno ${studentId} está fora da sala há mais de 10 min.`);
          this.exitWatchdogs.delete(studentId);
       }
    }
  }

  // The following methods are kept from the original document,
  // but their usage might be deprecated by the new `processSignal` logic.
  // They are retained as per instruction to only make specified changes.

  /**
   * Processa telemetria bruta do RuView para identificar riscos à saúde/segurança
   */
  public processTelemetry(point: any): void {
    if (point.fall_detected) {
      this.triggerFallAlert(point);
    }
  }

  private triggerFallAlert(point: any): void {
    const alertId = `fall_${point.id}_${Date.now()}`;
    
    // Evitar spam de alertas para o mesmo sujeito no mesmo minuto
    if (this.isRecentlyAlerted(point.id)) return;

    const alert: SafetyAlert = {
      id: alertId,
      type: 'FALL',
      subjectId: point.id,
      location: { x: point.x, y: point.y },
      timestamp: new Date().toISOString(),
      severity: 'high'
    };

    this.activeAlerts.set(point.id, alert);
    this.emit('safety-alert', alert);
    
    console.warn(`[SafetyMonitor] ALERTA DE QUEDA DETECTADO: Sujeito ${point.id} na posição (${point.x}, ${point.y})`);
  }

  private isRecentlyAlerted(subjectId: string): boolean {
    const lastAlert = this.activeAlerts.get(subjectId);
    if (!lastAlert) return false;

    const lastTime = new Date(lastAlert.timestamp).getTime();
    const now = Date.now();
    
    return (now - lastTime) < 60000; // 1 minuto de cooldown
  }

  public getActiveAlerts(): SafetyAlert[] {
    return Array.from(this.activeAlerts.values());
  }

  public clearAlert(subjectId: string): void {
    this.activeAlerts.delete(subjectId);
  }
}

export const safetyMonitor = new SafetyMonitorService();
