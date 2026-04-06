import { EventEmitter } from 'events';
import { SecurityEvent } from './AiTypes';

export interface ActionPolicy {
  id: string;
  triggerEvent: string | 'SIGNAL_THRESHOLD';
  thresholdDistance?: number;
  poiType?: string;
  action: 'LOCK' | 'ALARM' | 'LOCKDOWN';
  enabled: boolean;
}

/**
 * AutonomousActionService (v1609)
 * Motor de Resposta Ativa para o ecossistema Áquila Pro.
 * Conecta dados de sinais (RuView) e visão (Guardian) a atuadores físicos (IoT).
 */
class AutonomousActionService extends EventEmitter {
  private policies: ActionPolicy[] = [];

  constructor() {
    super();
    this.loadDefaultPolicies();
  }

  private loadDefaultPolicies() {
    this.policies = [
      {
        id: 'auto_lock_entrance',
        triggerEvent: 'SIGNAL_THRESHOLD',
        thresholdDistance: 1.5,
        poiType: 'entrance',
        action: 'LOCK',
        enabled: true
      },
      {
        id: 'alarm_weapon_detected',
        triggerEvent: 'weapon',
        action: 'LOCKDOWN',
        enabled: true
      }
    ];
  }

  /**
   * Avalia eventos de IA (Visão)
   */
  async evaluateEvent(event: SecurityEvent): Promise<void> {
    const policy = this.policies.find(p => p.enabled && p.triggerEvent === event.type);
    if (policy) {
      console.log(`[Autonomous] Regra ${policy.id} disparada por evento ${event.type}!`);
      this.executeAction(policy.action, { zone: event.zone });
    }
  }

  /**
   * Avalia proximidade de sinal a POIs (v1609)
   */
  async evaluateSignal(data: { x: number, y: number, intensity: number }, poi: { x: number, y: number, type: string }): Promise<void> {
    const distance = Math.sqrt(Math.pow(data.x - poi.x, 2) + Math.pow(data.y - poi.y, 2));
    
    const policy = this.policies.find(p => 
      p.enabled && 
      p.triggerEvent === 'SIGNAL_THRESHOLD' && 
      p.poiType === poi.type &&
      distance < (p.thresholdDistance || 1.0)
    );

    if (policy) {
      console.log(`[Autonomous] ALVO DETECTADO a ${distance.toFixed(1)}m de ${poi.type}! Executando ${policy.action}...`);
      this.executeAction(policy.action, { poiType: poi.type });
    }
  }

  private async executeAction(action: string, metadata: any) {
    // Interfere diretamente com o IoTManager via IPC ou Evento Global
    this.emit('trigger-action', { action, metadata, timestamp: Date.now() });
    
    // Log de Auditoria Crítico (Assinado via SyncService v1606)
    console.log(`[Autonomous][AUDIT] Ação ${action} executada autonomamente.`);
  }

  getPolicies(): ActionPolicy[] {
    return this.policies;
  }
}

export const autonomousActionService = new AutonomousActionService();
