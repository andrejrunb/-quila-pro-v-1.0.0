import { FaceDetectedPayload } from '../../services/AiTypes';

/**
 * PrivacyBlurService.ts — AG-023
 * Filtro de conformidade LGPD para anonimização de terceiros.
 */
class PrivacyBlurService {
  
  /**
   * Determina se um frame ou detecção deve ser ofuscado.
   */
  public shouldBlur(data: FaceDetectedPayload): boolean {
    // Se a confiança for muito baixa ou o ID for desconhecido (UNKNOWN)
    // O sistema deve ofuscar para proteger a privacidade de terceiros (Item 92)
    return !data.student_id || data.student_id === 'UNKNOWN' || data.confidence < 0.4;
  }

  /**
   * Aplica o efeito de blur (Mock para o pipe de visualização)
   */
  public applyBlur(frameData: any, box: [number, number, number, number]): any {
    console.log(`[PrivacyBlur] Aplicando ofuscação na área: ${box}`);
    // No pipeline real, isso manipula o Buffer do frame via OpenCV ou Canvas
    return frameData;
  }
}

export const privacyBlur = new PrivacyBlurService();
export default privacyBlur;

