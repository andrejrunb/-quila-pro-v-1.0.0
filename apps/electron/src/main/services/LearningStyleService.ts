import { Database } from '../../database/Database';
import { logger } from '../logger';

export type LearningStyle = 'AUDIO' | 'TEXT' | 'VISUAL' | 'KINESTHETIC';

/**
 * LearningStyleService (v3460)
 * Detector Neuro-Pedagógico. Analisa padrões de consumo para otimizar o aprendizado.
 */
export class LearningStyleService {
  private db: Database;

  constructor(db: Database) {
    this.db = db;
  }

  /**
   * Analisa as últimas interações do aluno com o App para inferir seu estilo.
   */
  public async detectPrimaryStyle(studentId: string): Promise<LearningStyle> {
    logger.info(`[Neuro] Analisando estilo de aprendizagem para o aluno: ${studentId}`);

    // Consulta métricas de consumo (quantas vezes ouviu áudio vs leu texto do Second Brain)
    const metrics = await this.db.get(`
      SELECT 
        SUM(CASE WHEN action = 'PLAY_AUDIO' THEN 1 ELSE 0 END) as audioCount,
        SUM(CASE WHEN action = 'READ_TEXT' THEN 1 ELSE 0 END) as textCount,
        SUM(CASE WHEN action = 'VIEW_IMAGE' THEN 1 ELSE 0 END) as visualCount
      FROM student_activity_logs 
      WHERE studentId = ?
    `, [studentId]);

    if (!metrics || (metrics.audioCount === 0 && metrics.textCount === 0)) {
       return 'TEXT'; // Default
    }

    const { audioCount, textCount, visualCount } = metrics;

    if (audioCount > textCount && audioCount > visualCount) return 'AUDIO';
    if (visualCount > textCount) return 'VISUAL';
    
    return 'TEXT';
  }

  /**
   * Sugestão de adaptação para o Professor.
   */
  public async getPedagogicalTip(studentId: string): Promise<string> {
    const style = await this.detectPrimaryStyle(studentId);
    
    const tips: Record<LearningStyle, string> = {
      AUDIO: 'Este aluno retém melhor informação via áudio. Sugira que ele grave resumos das aulas.',
      TEXT: 'Este aluno prefere fluxogramas e textos estruturados. Envie mapas mentais.',
      VISUAL: 'Este aluno responde bem a estímulos visuais. Use ferramentas de desenho na lousa.',
      KINESTHETIC: 'Este aluno aprende fazendo. Sugira atividades práticas de laboratório.'
    };

    return tips[style];
  }
}

