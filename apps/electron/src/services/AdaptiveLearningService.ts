import { Database } from "../database/Database";
import { logger } from '../main/logger';
import { NexusEconomyService } from "./NexusEconomyService";

export interface SRSState {
  id: string;
  studentId: string;
  materialId: string;
  interval: number; // Dias
  repetition: number;
  easeFactor: number;
  nextReview: string;
}

/**
 * AdaptiveLearningService (v3460)
 * Motor de Retenção de Conhecimento. Implementa algoritmos de repetição espaçada.
 */
export class AdaptiveLearningService {
  private db: Database;

  constructor(db: Database) {
    this.db = db;
  }

  /**
   * Calcula o próximo intervalo de revisão baseado na performance (SM-2 Algorithm).
   * @param quality 0 a 5 (0: Esquecimento total, 5: Resposta perfeita)
   */
  public calculateNextReview(currentState: SRSState, quality: number): SRSState {
    let { interval, repetition, easeFactor } = currentState;

    if (quality >= 3) {
      if (repetition === 0) {
        interval = 1;
      } else if (repetition === 1) {
        interval = 6;
      } else {
        interval = Math.round(interval * easeFactor);
      }
      repetition++;
    } else {
      repetition = 0;
      interval = 1;
    }

    // Ajustar Ease Factor
    easeFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
    if (easeFactor < 1.3) easeFactor = 1.3;

    const nextReviewDate = new Date();
    nextReviewDate.setDate(nextReviewDate.getDate() + interval);

    return {
      ...currentState,
      interval,
      repetition,
      easeFactor,
      nextReview: nextReviewDate.toISOString()
    };
  }

  /**
   * Registra uma sessão de estudo e atualiza o cronograma do aluno.
   */
  public async logStudySession(studentId: string, materialId: string, quality: number) {
    logger.info(`[SRS] Registrando sessão para Aluno: ${studentId}, Material: ${materialId}, Qualidade: ${quality}`);

    // Buscar estado atual
    let state = await this.db.get(`SELECT * FROM srs_schedules WHERE studentId = ? AND materialId = ?`, [studentId, materialId]);

    if (!state) {
      state = {
        interval: 0,
        repetition: 0,
        easeFactor: 2.5,
        studentId,
        materialId
      };
    }

    const newState = this.calculateNextReview(state as SRSState, quality);

    const query = `
      INSERT INTO srs_schedules (studentId, materialId, interval, repetition, easeFactor, nextReview)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(studentId, materialId) DO UPDATE SET
        interval = excluded.interval,
        repetition = excluded.repetition,
        easeFactor = excluded.easeFactor,
        nextReview = excluded.nextReview
    `;

    await this.db.run(query, [
      studentId, 
      materialId, 
      newState.interval, 
      newState.repetition, 
      newState.easeFactor, 
      newState.nextReview
    ]);

    // [SQA-GAM-552] Recompensa por Performance SRS
    const economy = new NexusEconomyService(this.db);
    if (quality === 5) {
      await economy.rewardStudent(studentId, 15, 'Revisão SRS Perfeita');
    } else if (quality >= 3) {
      await economy.rewardStudent(studentId, 5, 'Revisão SRS Concluída');
    }

    return newState;
  }

  /**
   * Recupera todos os flashcards que precisam de revisão hoje para um aluno (Cycle 9).
   */
  public async getDueFlashcards(studentId: string): Promise<SRSState[]> {
    const now = new Date().toISOString();
    return await this.db.all(`
      SELECT * FROM srs_schedules 
      WHERE studentId = ? AND nextReview <= ?
      ORDER BY nextReview ASC
    `, [studentId, now]);
  }

  /**
   * Atalho para registrar uma revisão individual requerida pelo main.ts.
   */
  public async recordReview(studentId: string, materialId: string, quality: number) {
    return await this.logStudySession(studentId, materialId, quality);
  }
}
