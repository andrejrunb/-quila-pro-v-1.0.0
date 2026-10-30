/**
 * TurnstileAccessContract.ts
 * ============================================================================
 * Contrato Rigoroso de Controle de Acesso Físico & Máquina de Estados (FSM)
 * ============================================================================
 * Princípio Fundamental:
 * "Enviei o comando" NÃO comprova "a catraca abriu".
 * "A catraca abriu" NÃO comprova "o estudante passou".
 * 
 * Este módulo estabelece a FSM determinística que distingue cada fase do ciclo
 * físico e monitora sensores reais de giro mecânico e timeouts de segurança.
 * ============================================================================
 */

import { EventEmitter } from 'events';

export type TurnstileLifecycleState =
  | 'DISCONNECTED'
  | 'AUTHENTICATING'
  | 'IDLE_LOCKED'
  | 'COMMAND_REQUESTED'
  | 'COMMAND_ACKNOWLEDGED'
  | 'RELAY_ENERGIZED'
  | 'PASSAGE_IN_PROGRESS'
  | 'PASSAGE_COMPLETED'
  | 'TIMEOUT_NO_PASSAGE'
  | 'ALARM_FORCED_ENTRY'
  | 'COMMUNICATION_FAILURE';

export interface PassageCommandRequest {
  transactionId: string;
  deviceId: string;
  direction: 'ENTRANCE' | 'EXIT';
  authorizedEntityId: string; // ID do estudante ou funcionário
  authMethod: 'BIOMETRIC_SHADOW' | 'MANUAL_BADGE' | 'OPERATOR_OVERRIDE';
  requestedAt: number;
}

export interface TurnstileTelemetryEvent {
  transactionId: string;
  deviceId: string;
  previousState: TurnstileLifecycleState;
  currentState: TurnstileLifecycleState;
  timestamp: number;
  details?: string;
}

export class TurnstileAccessContract extends EventEmitter {
  private deviceState: Map<string, TurnstileLifecycleState> = new Map();
  private processedTransactions: Set<string> = new Set();
  private activeTimers: Map<string, NodeJS.Timeout> = new Map();

  constructor() {
    super();
  }

  public getDeviceState(deviceId: string): TurnstileLifecycleState {
    return this.deviceState.get(deviceId) || 'DISCONNECTED';
  }

  public setDeviceState(deviceId: string, state: TurnstileLifecycleState, details?: string): void {
    const previous = this.getDeviceState(deviceId);
    this.deviceState.set(deviceId, state);

    const event: TurnstileTelemetryEvent = {
      transactionId: '',
      deviceId,
      previousState: previous,
      currentState: state,
      timestamp: Date.now(),
      details,
    };

    this.emit('state:changed', event);
  }

  /**
   * 1. SOLICITAÇÃO DE COMANDO
   * Impede comandos duplicados via nonce idempotente (transactionId).
   */
  public requestPassage(request: PassageCommandRequest): { accepted: boolean; reason?: string } {
    if (this.processedTransactions.has(request.transactionId)) {
      return { accepted: false, reason: 'DUPLICATE_COMMAND_REJECTED' };
    }

    const currentState = this.getDeviceState(request.deviceId);
    if (currentState !== 'IDLE_LOCKED') {
      return {
        accepted: false,
        reason: `DEVICE_NOT_READY: Estado atual '${currentState}' não permite novo comando.`,
      };
    }

    this.processedTransactions.add(request.transactionId);
    this.setDeviceState(request.deviceId, 'COMMAND_REQUESTED', `Para ${request.authorizedEntityId}`);

    return { accepted: true };
  }

  /**
   * 2. CONFIRMAÇÃO DE RECEBIMENTO PELO HARDWARE (ACK)
   */
  public onHardwareAck(deviceId: string, transactionId: string): void {
    if (this.getDeviceState(deviceId) !== 'COMMAND_REQUESTED') return;
    this.setDeviceState(deviceId, 'COMMAND_ACKNOWLEDGED', `ACK recebido para ${transactionId}`);
  }

  /**
   * 3. RELÉ ACIONADO (SOLENÓIDE DESTRAVADO)
   * Dispara janela de timeout de passagem (ex: 5 segundos para o aluno empurrar o braço).
   */
  public onRelayEnergized(deviceId: string, transactionId: string, timeoutMs: number = 5000): void {
    this.setDeviceState(deviceId, 'RELAY_ENERGIZED', `Solenóide energizado. Janela: ${timeoutMs}ms`);

    // Iniciar timer de segurança
    const timer = setTimeout(() => {
      if (this.getDeviceState(deviceId) === 'RELAY_ENERGIZED') {
        this.setDeviceState(
          deviceId,
          'TIMEOUT_NO_PASSAGE',
          'Solenóide rearmado. Nenhuma rotação física detectada dentro da janela.'
        );
        // Retorna ao estado travado seguro
        this.setDeviceState(deviceId, 'IDLE_LOCKED', 'Catraca travada novamente após timeout.');
      }
    }, timeoutMs);

    this.activeTimers.set(deviceId, timer);
  }

  /**
   * 4. SENSOR ÓPTICO DE GIRO: ROTAÇÃO INICIADA
   */
  public onArmRotationStarted(deviceId: string): void {
    const state = this.getDeviceState(deviceId);
    if (state === 'RELAY_ENERGIZED') {
      this.setDeviceState(deviceId, 'PASSAGE_IN_PROGRESS', 'Giro dos braços em andamento.');
    } else if (state === 'IDLE_LOCKED') {
      // Alarme de invasão / pulo de catraca / giro forçado sem autorização!
      this.setDeviceState(deviceId, 'ALARM_FORCED_ENTRY', 'ALERTA: Giro mecânico forçado detectado sem autorização prévia!');
    }
  }

  /**
   * 5. SENSOR ÓPTICO DE GIRO: ROTAÇÃO COMPLETA (PASSAGEM EFETIVAMENTE CONCLUÍDA)
   */
  public onPassageCompleted(deviceId: string, transactionId: string): void {
    const timer = this.activeTimers.get(deviceId);
    if (timer) {
      clearTimeout(timer);
      this.activeTimers.delete(deviceId);
    }

    this.setDeviceState(deviceId, 'PASSAGE_COMPLETED', `Passagem confirmada fisicamente por sensor para ${transactionId}.`);
    // Retorna ao repouso travado
    this.setDeviceState(deviceId, 'IDLE_LOCKED', 'Pronto para próxima passagem.');
  }
}
