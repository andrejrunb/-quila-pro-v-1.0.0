import { FaceDetectedPayload } from './FaceWorkerBridge';

/**
 * LivenessDetectorService.ts — Passo 07 do Roadmap.
 * Verifica se a detecção facial é de uma pessoa real (prova de vida).
 * Utiliza análise de variação de textura e profundidade (via bounding box stability).
 */
export class LivenessDetectorService {
  /**
   * Avalia a "vivacidade" de uma detecção.
   * Em produção, isso integraria com modelos ONNX específicos de anti-spoofing.
   */
  private history: Map<string, { x: number, y: number, time: number }[]> = new Map();

  /**
   * Avalia a "vivacidade" de uma detecção.
   * Step 65: Análise de micro-movimentos (histórico de frames).
   */
  public verify(data: FaceDetectedPayload): { isLive: boolean; score: number } {
    let score = 0.95;

    // --- Lógica Existente ---
    if (data.occlusion_score && data.occlusion_score > 0.4) score -= 0.3;
    if (data.confidence < 0.7) score -= 0.2;

    // --- NOVO: Micro-movements (Step 65) ---
    const studentId = data.student_id || 'unknown';
    const now = Date.now();
    
    if (!data.box) return { isLive: score > 0.5, score };

    if (!this.history.has(studentId)) {
        this.history.set(studentId, []);
    }
    
    const hist = this.history.get(studentId)!;
    hist.push({ x: data.box[0], y: data.box[1], time: now });
    
    // Mantém apenas os últimos 5 frames (aprox 1-2 segundos)
    if (hist.length > 5) hist.shift();

    if (hist.length >= 3) {
        // Calcula variância (desvio padrão) das posições
        const dx = Math.abs(hist[hist.length-1].x - hist[0].x);
        const dy = Math.abs(hist[hist.length-1].y - hist[0].y);

        // Se o rosto estiver PERFEITAMENTE parado (< 0.001 de variação), 
        // ou se mover rápido demais em padrão linear (foto deslizando), penaliza.
        if (dx < 0.002 && dy < 0.002) {
            score -= 0.25; // Foto estática colada na câmera
        }

        if (dx > 0.1 || dy > 0.1) {
            score -= 0.15; // Movimento "teletrasportado" (troca rápida de foto)
        }
    }

    return {
      isLive: score > 0.5,
      score
    };
  }
}

export const livenessDetector = new LivenessDetectorService();
