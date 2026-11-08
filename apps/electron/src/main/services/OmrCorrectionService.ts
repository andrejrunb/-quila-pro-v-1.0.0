/**
 * OmrCorrectionService — Scanner Soberano de Provas & Gabaritos (Passos 141 a 146)
 * 
 * Integração entre Visão Computacional (GPU no Colab ou fallback local)
 * e o banco de dados SQLite para correção automatizada de provas escolares.
 */

import { EventEmitter } from 'events';
import { db } from '../../database/Database';
import { colabGpuBridge } from './ColabGpuBridge';
import { colabTunnelWatchdog } from './ColabTunnelWatchdog';

export interface ExamQuestionResult {
  questionNumber: number;
  expectedAnswer: string;
  detectedAnswer: string | null;
  isCorrect: boolean;
  weight: number;
  pointsAwarded: number;
}

export interface ExamCorrectionReport {
  id: string;
  templateId: string;
  studentId?: string;
  studentName?: string;
  score: number;
  totalPoints: number;
  accuracyPct: number;
  confidence: number;
  questions: ExamQuestionResult[];
  processedAt: string;
}

export class OmrCorrectionService extends EventEmitter {
  private static instance: OmrCorrectionService;

  private constructor() {
    super();
  }

  public static getInstance(): OmrCorrectionService {
    if (!OmrCorrectionService.instance) {
      OmrCorrectionService.instance = new OmrCorrectionService();
    }
    return OmrCorrectionService.instance;
  }

  /**
   * Cria e persiste um gabarito oficial de prova no sistema.
   */
  public async createTemplate(params: {
    title: string;
    classId?: string;
    totalQuestions: number;
    optionsCount?: number;
    answerKey: Record<string, string>;
    weights?: Record<string, number>;
    items?: Array<{ id: string; status?: string }>;
  }): Promise<string> {
    // Governança HITL: bloqueio estrito de publicação se houver questões em RASCUNHO_IA
    if (params.items && Array.isArray(params.items)) {
      const unreviewed = params.items.filter(item => item.status === 'RASCUNHO_IA');
      if (unreviewed.length > 0) {
        throw new Error(
          `[OmrCorrectionService] Bloqueio de Publicação: ${unreviewed.length} questão(ões) em RASCUNHO_IA sem revisão docente.`
        );
      }
    }

    const templateId = await db.createOmrTemplate({
      title: params.title,
      classId: params.classId,
      totalQuestions: params.totalQuestions,
      optionsCount: params.optionsCount || 5,
      answerKey: params.answerKey,
      weights: params.weights,
    });

    this.emit('template:created', { templateId, title: params.title });
    return templateId;
  }

  /**
   * Processa e corrige uma folha de respostas/gabarito de prova.
   */
  public async correctExam(params: {
    templateId: string;
    imageBuffer: Buffer;
    studentId?: string;
    studentName?: string;
  }): Promise<ExamCorrectionReport> {
    const template = await db.getOmrTemplate(params.templateId);
    if (!template) {
      throw new Error(`[OmrCorrectionService] Gabarito/Template "${params.templateId}" não encontrado.`);
    }

    let detectedAnswers: Record<string, string> = {};
    let confidence = 1.0;

    // Tentativa 1: Colab GPU Neural OMR
    const colabStatus = colabGpuBridge.getStatus();
    if (colabStatus.online) {
      try {
        const scanResult = await colabGpuBridge.scanOmr(
          params.imageBuffer,
          template.totalQuestions,
          template.optionsCount || 5
        );
        detectedAnswers = scanResult.answers || {};
        confidence = scanResult.confidence_avg || 0.95;
      } catch (colabErr) {
        console.warn('[OmrCorrectionService] Colab GPU falhou no scan OMR. Enfileirando watchdog:', colabErr);
        await colabTunnelWatchdog.enqueueTask('image_process', {
          templateId: params.templateId,
          studentId: params.studentId,
        });
        const isTest = process.env.NODE_ENV === 'test' || Boolean(process.env.PLAYWRIGHT_TEST);
        if (!isTest) {
          throw new Error('[OmrCorrectionService] Falha na Visão Computacional Remota: worker GPU indisponível e motor de visão local desativado. Tarefa enfileirada no watchdog para reprocessamento assíncrono.');
        }
        detectedAnswers = this.localFallbackOmrDetection(template.totalQuestions);
        confidence = 0.70;
      }
    } else {
      // Fallback local caso Colab esteja offline
      const isTest = process.env.NODE_ENV === 'test' || Boolean(process.env.PLAYWRIGHT_TEST);
      if (!isTest) {
        throw new Error('[OmrCorrectionService] Leitura Óptica Offline Indisponível: o motor de visão computacional local não está inicializado e o worker GPU remoto está desconectado. Conecte o worker de visão antes de corrigir provas reais de alunos.');
      }
      detectedAnswers = this.localFallbackOmrDetection(template.totalQuestions);
      confidence = 0.70;
    }

    // Avaliação questão a questão
    const answerKey: Record<string, string> = template.answerKey;
    const weights: Record<string, number> = template.weights || {};

    let totalPoints = 0;
    let earnedPoints = 0;
    let correctCount = 0;
    const questionsReport: ExamQuestionResult[] = [];

    for (let q = 1; q <= template.totalQuestions; q++) {
      const qKey = String(q);
      const expected = (answerKey[qKey] || '').toUpperCase();
      const detected = (detectedAnswers[qKey] || null)?.toUpperCase() || null;
      const weight = weights[qKey] ?? 1.0;

      totalPoints += weight;
      const isCorrect = detected !== null && detected === expected;

      if (isCorrect) {
        earnedPoints += weight;
        correctCount++;
      }

      questionsReport.push({
        questionNumber: q,
        expectedAnswer: expected,
        detectedAnswer: detected,
        isCorrect,
        weight,
        pointsAwarded: isCorrect ? weight : 0,
      });
    }

    const accuracyPct = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 10000) / 100 : 0;

    // Salvar correção no banco de dados SQLite
    const correctionId = await db.saveOmrCorrection({
      templateId: params.templateId,
      studentId: params.studentId,
      studentName: params.studentName,
      detectedAnswers,
      score: earnedPoints,
      totalPoints,
      accuracyPct,
      confidence,
    });

    const report: ExamCorrectionReport = {
      id: correctionId,
      templateId: params.templateId,
      studentId: params.studentId,
      studentName: params.studentName,
      score: earnedPoints,
      totalPoints,
      accuracyPct,
      confidence,
      questions: questionsReport,
      processedAt: new Date().toISOString(),
    };

    this.emit('exam:corrected', report);
    return report;
  }

  public async listTemplates(classId?: string): Promise<any[]> {
    return await db.listOmrTemplates(classId);
  }

  /**
   * Algoritmo de fallback para leitura quando offline.
   */
  /**
   * Algoritmo de fallback para leitura quando offline em ambiente de teste/CI.
   * AVISO DE GOVERNANÇA: Proibido gerar notas fictícias em produção ou em provas reais de alunos.
   */
  private localFallbackOmrDetection(totalQuestions: number): Record<string, string> {
    const isTest = process.env.NODE_ENV === 'test' || Boolean(process.env.PLAYWRIGHT_TEST);
    if (!isTest) {
      throw new Error('[OmrCorrectionService] localFallbackOmrDetection bloqueado fora do ambiente de teste.');
    }
    const answers: Record<string, string> = {};
    const options = ['A', 'B', 'C', 'D', 'E'];
    for (let i = 1; i <= totalQuestions; i++) {
      answers[String(i)] = options[(i - 1) % options.length];
    }
    return answers;
  }
}

export const omrCorrectionService = OmrCorrectionService.getInstance();
