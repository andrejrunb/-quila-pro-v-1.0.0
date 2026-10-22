import { logger } from '../logger';
import { hapticBridge } from './HapticBridgeService';
import { sensoryProfileService } from './SensoryProfileService';

export type HapticPattern = 'SUCCESS' | 'ERROR' | 'ALERT' | 'FOCUS_PULSE' | 'GENTLE_NUDGE' | 'HEARTBEAT';

/**
 * HapticMeshService (Nível 32)
 * Orquestra sequências sensoriais complexas e adaptativas.
 * Verifica o perfil sensorial do aluno antes de disparar qualquer feedback.
 */
export class HapticMeshService {
  private static instance: HapticMeshService;

  private constructor() {}

  public static getInstance(): HapticMeshService {
    if (!HapticMeshService.instance) {
      HapticMeshService.instance = new HapticMeshService();
    }
    return HapticMeshService.instance;
  }

  /**
   * Dispara um feedback sensorial respeitando o perfil do aluno.
   */
  public async triggerSensoryEvent(studentId: string, pattern: HapticPattern) {
    const profile = sensoryProfileService.getProfile(studentId);

    if (!profile.hapticEnabled) {
      logger.debug(`[HapticMesh] Ignorando evento para ${studentId}: Haptic desativado no perfil.`);
      return;
    }

    // Se o aluno tiver alta sensibilidade, suaviza o padrão
    const intensity = profile.tactileSensitivity === 'HIGH' ? profile.preferredIntensity * 0.5 : profile.preferredIntensity;

    logger.info(`[HapticMesh] Orquestrando ${pattern} para ${studentId} (Intensidade: ${intensity})`);
    
    // Mapeamento para o hardware bridge
    // (Simulação de envio com intensidade)
    (hapticBridge as any).triggerFeedback(pattern, intensity);
  }

  /**
   * Sequência rítmica para estados de foco profundo.
   */
  public async startFocusRhythm(studentId: string) {
    logger.info(`[HapticMesh] Iniciando ritmo de foco para ${studentId}`);
    // Dispara pulsos lentos e constantes
  }
}

export const hapticMeshService = HapticMeshService.getInstance();
