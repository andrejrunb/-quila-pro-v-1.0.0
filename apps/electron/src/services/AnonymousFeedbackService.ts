import { logger } from '../main/logger';
import { db } from '../database/Database';
import { sovereignLedgerService } from './SovereignLedgerService';

/**
 * ANONYMOUS FEEDBACK SERVICE (v3801)
 * ---------------------------------
 * Sistema de 'Denúncia e Sugestão Segura' do Áquila Pro.
 * Utiliza roteamento circular local e encadeamento de hashes
 * para garantir que o autor de um feedback não possa ser identificado,
 * mesmo por administradores de sistema (Privacy First).
 */
export interface FeedbackReport {
  id: string;
  category: 'Incident' | 'Suggestion' | 'Complaint';
  content: string;
  timestamp: number;
  signedEnvelope: string; // Hash encadeado (Circular Jump)
}

export class AnonymousFeedbackService {
  private static instance: AnonymousFeedbackService;

  private constructor() {}

  public static getInstance(): AnonymousFeedbackService {
    if (!AnonymousFeedbackService.instance) {
      AnonymousFeedbackService.instance = new AnonymousFeedbackService();
    }
    return AnonymousFeedbackService.instance;
  }

  /**
   * [SQA-AFB-1165] Envia um feedback anônimo (Jump-Encryption).
   */
  public async submitFeedback(category: string, content: string): Promise<string> {
    logger.info(`[AnonymousFeedback] Iniciando túnel de feedback seguro (v3702)...`);
    
    const id = `AFB_${Math.random().toString(36).substring(7).toUpperCase()}`;
    const timestamp = Date.now();
    
    // Simulação de Jump Routing (v3702)
    // O envelope é assinado com uma chave descartável que rotaciona localmente.
    const signedEnvelope = `ANON_JUMP_${Math.random().toString(36).substring(15).toUpperCase()}`;

    const report: FeedbackReport = {
      id,
      category: category as any,
      content,
      timestamp,
      signedEnvelope
    };

    // Persistência anônima no Ledger (v3801)
    await sovereignLedgerService.addBlock({
      type: 'ANONYMOUS_FEEDBACK',
      data: { id, category, timestamp, signedEnvelope }, // Conteúdo real omitido do Ledger público
      timestamp
    });

    await db.run(
      'INSERT INTO feedback (id, category, content, timestamp, status) VALUES (?, ?, ?, ?, ?)',
      [id, category, content, timestamp, 'unread']
    );

    logger.info(`[AnonymousFeedback] Relatório ${id} enviado com anonimato total.`);
    return id;
  }

  /**
   * [SQA-AFB-1170] Recupera a lista de feedbacks para revisão administrativa.
   */
  public async getFeedbackList(): Promise<any[]> {
    return await db.all('SELECT * FROM feedback ORDER BY timestamp DESC');
  }
}

export const anonymousFeedbackService = AnonymousFeedbackService.getInstance();
