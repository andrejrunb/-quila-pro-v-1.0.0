import { logger } from '../logger';

export interface IntegrityViolation {
  type: 'mass_paste' | 'screenshot_attempt' | 'ai_suspicion' | 'focus_loss';
  studentId: string;
  materialId: string;
  timestamp: Date;
  details: string;
  severity: 'low' | 'medium' | 'high';
}

export interface CoordinationTicket {
  id: string;
  type: 'ai_fraud' | 'parent_request' | 'praise_mediation';
  status: 'pending' | 'approved' | 'rejected';
  studentId: string;
  sourceId: string; // Professor ou Pai
  details: string;
  createdAt: Date;
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
   * Registra uma violação e encaminha para a coordenação se necessário
   */
  public reportViolation(violation: IntegrityViolation): void {
    this.violations.push(violation);
    
    // Se for alta severidade ou suspeita de IA, gera ticket automático
    if (violation.severity === 'high' || violation.type === 'ai_suspicion') {
      this.createCoordinationTicket({
        id: `TKT-${Date.now()}`,
        type: 'ai_fraud',
        status: 'pending',
        studentId: violation.studentId,
        sourceId: 'system',
        details: `Suspeita de fraude detectada: ${violation.details}`,
        createdAt: new Date(),
        metadata: { violationType: violation.type }
      });
    }

    logger.warn(`[Integrity] Alerta de Fraude: [${violation.type}] Aluno ${violation.studentId} em ${violation.materialId}.`);
  }

  /**
   * Cria um ticket de mediação para a coordenação
   */
  public createCoordinationTicket(ticket: CoordinationTicket): void {
    this.coordinationQueue.push(ticket);
    logger.info(`[Córtex] Novo ticket de mediação criado: ${ticket.id} (${ticket.type}) para aluno ${ticket.studentId}`);
  }

  /**
   * Resolve um ticket de mediação (Ação da Coordenação)
   */
  public resolveTicket(ticketId: string, status: 'approved' | 'rejected', action?: any): void {
    const ticket = this.coordinationQueue.find(t => t.id === ticketId);
    if (ticket) {
      ticket.status = status;
      
      // Se for fraude de IA aprovada e ação for bloqueio
      if (ticket.type === 'ai_fraud' && status === 'approved' && action?.blockAI) {
        this.blockStudentAI(ticket.studentId, action.days || 3, "Uso indevido recorrente detectado.");
      }
    }
  }

  /**
   * Bloqueia temporariamente o uso de IA para um aluno
   */
  private blockStudentAI(studentId: string, days: number, reason: string): void {
    const expires = new Date();
    expires.setDate(expires.getDate() + days);
    this.aiBlockList.set(studentId, { expires, reason });
    logger.info(`[!!!] [Integrity] IA BLOQUEADA para aluno ${studentId} até ${expires.toLocaleDateString()}. Motivo: ${reason}`);
  }

  /**
   * Verifica se o aluno está com IA bloqueada
   */
  public isAIBlocked(studentId: string): { blocked: boolean; reason?: string } {
    const block = this.aiBlockList.get(studentId);
    if (block && block.expires > new Date()) {
      return { blocked: true, reason: block.reason };
    }
    return { blocked: false };
  }

  public getViolationsByMaterial(materialId: string): IntegrityViolation[] {
    return this.violations.filter(v => v.materialId === materialId);
  }

  public getCoordinationQueue(): CoordinationTicket[] {
    return this.coordinationQueue;
  }

  /**
   * [SQA-SWR-BRISK-01] AI Writing Replay
   * Monitora a cadência de escrita para diferenciar humanos de injeções de IA.
   */
  public monitorTypingCadence(inputData: { text: string; events: any[] }): { score: number; suspicious: boolean } {
    // Lógica inspirada no Brisk Teaching: analisa intervalo entre teclas
    // Em um cenário real, inputData.events conteria timestamps de keydown/keyup
    const wordCount = inputData.text.split(/\s+/).length;
    const typingDuration = 5000; // Mock de duração em ms
    
    const wordsPerMinute = (wordCount / (typingDuration / 1000)) * 60;
    
    // Se a velocidade for sobre-humana (> 140 WPM sustentados)
    const isSuspicious = wordsPerMinute > 140;
    const score = Math.max(0, 100 - (isSuspicious ? 60 : 0));

    if (isSuspicious) {
      logger.warn(`[Córtex] AI Writing Replay detectou cadência anômala: ${wordsPerMinute.toFixed(0)} WPM.`);
    }

    return { score, suspicious: isSuspicious };
  }

  public analyzePaste(text: string, durationMs: number): boolean {
    const charsPerSecond = (text.length / durationMs) * 1000;
    // Detecção física: colagens maciças em milissegundos
    return charsPerSecond > 200 && text.length > 50;
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

