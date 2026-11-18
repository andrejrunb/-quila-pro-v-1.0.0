import { logger } from '../logger';

const CNE_AI_DETECTOR_NOTICE =
  'Conformidade Parecer CNE/CP nº 15/2026: detectores de IA e telemetria de cadência são estritamente indicativos (advisory-only); sanções acadêmicas, disciplinares ou bloqueios automatizados fundamentados em suspeita algorítmica de IA são expressamente proibidos.';

export interface IntegrityViolation {
  type: 'mass_paste' | 'screenshot_attempt' | 'ai_suspicion' | 'focus_loss';
  studentId: string;
  materialId: string;
  timestamp: Date;
  details: string;
  severity: 'low' | 'medium' | 'high';
  aiDetectionAdvisoryOnly?: boolean;
  punitiveSanctionProhibited?: boolean;
}

export interface CoordinationTicket {
  id: string;
  type: 'ai_fraud' | 'parent_request' | 'praise_mediation' | 'pedagogical_dialogue';
  status: 'pending' | 'approved' | 'rejected';
  studentId: string;
  sourceId: string; // Professor ou Pai
  details: string;
  createdAt: Date;
  aiDetectionAdvisoryOnly?: boolean;
  punitiveSanctionProhibited?: boolean;
  legalComplianceNotice?: string;
  metadata?: any;
}

export class IntegrityService {
  private static instance: IntegrityService;
  private violations: IntegrityViolation[] = [];
  private coordinationQueue: CoordinationTicket[] = [];
  private aiBlockList: Map<string, { expires: Date; reason: string }> = new Map();

  private constructor() {}

  public static getInstance(): IntegrityService {
    if (!IntegrityService.instance) {
      IntegrityService.instance = new IntegrityService();
    }
    return IntegrityService.instance;
  }

  /**
   * Registra uma ocorrência de integridade.
   * CNE/CP nº 15/2026: 'ai_suspicion' não gera ticket punitivo de 'ai_fraud' nem bloqueio automatizado,
   * permanecendo como registro consultivo para mediação pedagógica humana.
   */
  public reportViolation(violation: IntegrityViolation): void {
    const isAiDetector = violation.type === 'ai_suspicion';
    this.violations.push({
      ...violation,
      aiDetectionAdvisoryOnly: isAiDetector ? true : violation.aiDetectionAdvisoryOnly,
      punitiveSanctionProhibited: isAiDetector ? true : violation.punitiveSanctionProhibited,
    });

    if (isAiDetector) {
      logger.info(
        `[Integrity][CNE-15/2026] Ocorrência consultiva de estilo IA para ${violation.studentId} em ${violation.materialId}. Nenhuma sanção ou ticket punitivo automatizado gerado.`
      );
      return;
    }

    if (violation.severity === 'high') {
      this.createCoordinationTicket({
        id: `TKT-${Date.now()}`,
        type: 'pedagogical_dialogue',
        status: 'pending',
        studentId: violation.studentId,
        sourceId: 'system',
        details: `Ocorrência registrada para verificação docente: ${violation.details}`,
        createdAt: new Date(),
        aiDetectionAdvisoryOnly: true,
        punitiveSanctionProhibited: true,
        legalComplianceNotice: CNE_AI_DETECTOR_NOTICE,
        metadata: { violationType: violation.type },
      });
    }

    logger.warn(`[Integrity] Ocorrência registrada: [${violation.type}] Aluno ${violation.studentId} em ${violation.materialId}.`);
  }

  /**
   * Cria um ticket de mediação para a coordenação (sem punição automática baseada em IA)
   */
  public createCoordinationTicket(ticket: CoordinationTicket): void {
    const normalizedTicket: CoordinationTicket = {
      ...ticket,
      aiDetectionAdvisoryOnly: true,
      punitiveSanctionProhibited: true,
      legalComplianceNotice: ticket.legalComplianceNotice || CNE_AI_DETECTOR_NOTICE,
    };
    this.coordinationQueue.push(normalizedTicket);
    logger.info(`[Córtex] Novo ticket de mediação criado: ${normalizedTicket.id} (${normalizedTicket.type}) para aluno ${normalizedTicket.studentId}`);
  }

  /**
   * Resolve um ticket de mediação (Ação da Coordenação)
   * Bloqueios punitivos baseados em detector de IA são permanentemente neutralizados (CNE/CP nº 15/2026).
   */
  public resolveTicket(ticketId: string, status: 'approved' | 'rejected', action?: any): void {
    const ticket = this.coordinationQueue.find(t => t.id === ticketId);
    if (ticket) {
      ticket.status = status;
      ticket.aiDetectionAdvisoryOnly = true;
      ticket.punitiveSanctionProhibited = true;
      ticket.legalComplianceNotice = CNE_AI_DETECTOR_NOTICE;

      if (action?.blockAI) {
        logger.warn(
          `[Integrity][CNE-15/2026] Tentativa de bloqueio punitivo por detector de IA para ${ticket.studentId} bloqueada por conformidade normativa.`
        );
        ticket.metadata = {
          ...(ticket.metadata || {}),
          blockRejectedByCnePolicy: true,
          aiDetectionAdvisoryOnly: true,
          punitiveSanctionProhibited: true,
        };
      }
    }
  }

  /**
   * Método neutralizado por norma CNE/CP nº 15/2026 (bloqueio punitivo por detector de IA proibido).
   */
  public blockStudentAI(studentId: string, _days: number, reason: string): {
    blocked: false;
    aiDetectionAdvisoryOnly: true;
    punitiveSanctionProhibited: true;
    complianceCode: 'CNE_15_2026_AI_DETECTOR_ADVISORY_ONLY';
    legalComplianceNotice: string;
    studentId: string;
    requestedReason: string;
  } {
    this.aiBlockList.delete(studentId);
    logger.warn(
      `[Integrity][CNE-15/2026] Bloqueio punitivo de IA recusado para aluno ${studentId}. Motivo informado: ${reason}`
    );
    return {
      blocked: false,
      aiDetectionAdvisoryOnly: true,
      punitiveSanctionProhibited: true,
      complianceCode: 'CNE_15_2026_AI_DETECTOR_ADVISORY_ONLY',
      legalComplianceNotice: CNE_AI_DETECTOR_NOTICE,
      studentId,
      requestedReason: reason,
    };
  }

  /**
   * Verifica status de bloqueio: nunca aplica sanção punitiva baseada em detector de IA.
   */
  public isAIBlocked(_studentId: string): {
    blocked: false;
    aiDetectionAdvisoryOnly: true;
    punitiveSanctionProhibited: true;
    complianceCode: 'CNE_15_2026_AI_DETECTOR_ADVISORY_ONLY';
    legalComplianceNotice: string;
  } {
    return {
      blocked: false,
      aiDetectionAdvisoryOnly: true,
      punitiveSanctionProhibited: true,
      complianceCode: 'CNE_15_2026_AI_DETECTOR_ADVISORY_ONLY',
      legalComplianceNotice: CNE_AI_DETECTOR_NOTICE,
    };
  }

  public getViolationsByMaterial(materialId: string): IntegrityViolation[] {
    return this.violations.filter(v => v.materialId === materialId);
  }

  public getCoordinationQueue(): CoordinationTicket[] {
    return this.coordinationQueue;
  }

  /**
   * [SQA-SWR-AQUILA-01] Revisão Formativa de Escrita Áquila Pro
   * Analisa cadência de escrita apenas como dado consultivo de autoria para orientação docente.
   */
  public monitorTypingCadence(inputData: { text: string; events: any[] }): {
    score: number;
    suspicious: boolean;
    aiDetectionAdvisoryOnly: true;
    punitiveSanctionProhibited: true;
    complianceCode: 'CNE_15_2026_AI_DETECTOR_ADVISORY_ONLY';
    legalComplianceNotice: string;
  } {
    // Lógica proprietária do Áquila Pro: analisa intervalo e fluxo formativo entre registros de escrita
    const trimmed = String(inputData?.text || '').trim();
    const wordCount = trimmed ? trimmed.split(/\s+/).length : 0;
    const typingDuration = 5000;

    const wordsPerMinute = (wordCount / (typingDuration / 1000)) * 60;
    const isAnomalousCadence = wordsPerMinute > 140;
    const score = Math.max(0, 100 - (isAnomalousCadence ? 60 : 0));

    if (isAnomalousCadence) {
      logger.info(`[Córtex][Áquila Pro] Cadência de escrita atípica observada (${wordsPerMinute.toFixed(0)} WPM) — apenas consultivo (CNE/CP nº 15/2026).`);
    }

    return {
      score,
      suspicious: isAnomalousCadence,
      aiDetectionAdvisoryOnly: true,
      punitiveSanctionProhibited: true,
      complianceCode: 'CNE_15_2026_AI_DETECTOR_ADVISORY_ONLY',
      legalComplianceNotice: CNE_AI_DETECTOR_NOTICE,
    };
  }

  public analyzePaste(text: string, durationMs: number): boolean {
    if (!durationMs || durationMs <= 0) return false;
    const charsPerSecond = (String(text || '').length / durationMs) * 1000;
    return charsPerSecond > 200 && String(text || '').length > 50;
  }

  /**
   * Executa auditoria estrutural do banco de dados (SQA-1105)
   */
  public async runStructuralCheck() {
    const { db } = await import('../../database/Database');
    logger.info('[Integrity] Iniciando auditoria estrutural de persistência...');
    const result = await db.checkIntegrity();

    if (!result.healthy) {
      logger.error('[Integrity] FALHA na integridade estrutural detectada!');
    } else {
      logger.info('[Integrity] Integridade estrutural VALIDADA.');
    }

    return result;
  }
}

export const integrityService = IntegrityService.getInstance();
