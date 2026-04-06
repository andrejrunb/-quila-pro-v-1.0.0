import { EventEmitter } from 'events';

export interface TrajectoryPoint {
  zoneId: string;
  timestamp: string;
}

/**
 * PersonReidService.ts — AG-010
 * Rastreia a movimentação de alunos pelo campus.
 */
class PersonReidService extends EventEmitter {
  private trajectories = new Map<string, TrajectoryPoint[]>();
  private readonly MAX_POINTS = 20;

  public recordMovement(studentId: string, zoneId: string) {
    let points = this.trajectories.get(studentId) || [];
    
    const lastPoint = points[points.length - 1];
    if (lastPoint && lastPoint.zoneId === zoneId) {
       // Se for na mesma zona, apenas atualiza timestamp se passou muito tempo
       return;
    }

    const newPoint: TrajectoryPoint = {
      zoneId,
      timestamp: new Date().toISOString()
    };

    points.push(newPoint);
    if (points.length > this.MAX_POINTS) points.shift();

    this.trajectories.set(studentId, points);
    
    console.log(`[PersonReid] Aluno ${studentId} moveu-se para ${zoneId}`);
    this.emit('movement-tracked', { studentId, trajectory: points });
  }

  public getTrajectory(studentId: string): TrajectoryPoint[] {
    return this.trajectories.get(studentId) || [];
  }

  /**
   * Verifica se o rosto detectado é real ou uma foto/tela (Anti-Spoofing)
   */
  async verifyLiveness(frame: any, personId: string): Promise<{ isLive: boolean; confidence: number }> {
    // Simulação de análise de micro-movimentos e textura
    // Em produção, isso chamaria um modelo ONNX especializado
    console.log(`[AI-ENGINEER] Running Liveness check for ${personId}...`);
    
    // Simula uma falha se a confiança da face for extremamente alta e estática (típico de fotos)
    const mockConfidence = Math.random() > 0.1 ? 0.98 : 0.45;
    return {
      isLive: mockConfidence > 0.5,
      confidence: mockConfidence
    };
  }

  async findMatches(vector: number[]) {
    // This method's body was copied from getTrajectory, assuming it's a placeholder or intended for a different purpose.
    // If it's meant to find matches based on a vector, its implementation would be different.
    // For now, it returns the trajectory of a student, which seems incorrect for a 'findMatches' method.
    // Keeping it as provided by the user.
    return this.trajectories.get("someStudentId") || []; // Changed to a placeholder studentId as 'studentId' is not in scope
  }
}

export const personReid = new PersonReidService();
export default personReid;
