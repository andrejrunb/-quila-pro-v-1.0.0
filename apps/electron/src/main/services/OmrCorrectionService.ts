/**
 * OmrCorrectionService — Scanner Soberano de Provas & Gabaritos (Passos 141 a 146)
 * 
 * Integração entre Visão Computacional (GPU no Colab ou Kernel OMR Determinístico Local)
 * e o banco de dados SQLite para correção automatizada de provas escolares.
 */

import { EventEmitter } from 'events';
import { spawnSync } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import { db } from '../../database/Database';
import { colabGpuBridge } from './ColabGpuBridge';
import { colabTunnelWatchdog } from './ColabTunnelWatchdog';
import { ZeroBypassAuditService } from './ZeroBypassAuditService';

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
  reviewStatus: 'PRE_CORRECAO_IA_PENDENTE_DOCENTE' | 'APROVADA_DOCENTE' | 'CONTESTADA';
  requiresHumanTeacherValidation: boolean;
  contestationChannelEnabled: boolean;
  legalComplianceNotice: string;
  teacherApprovedBy?: string;
  teacherApprovedAt?: string;
  contestationReason?: string;
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
        console.warn('[OmrCorrectionService] Colab GPU falhou no scan OMR. Acionando Kernel OMR Determinístico Local (Sauvola + Homografia 3x3):', colabErr);
        const localScan = this.runLocalDeterministicOmrKernel(
          params.imageBuffer,
          template.totalQuestions,
          template.optionsCount || 5
        );
        if (localScan) {
          detectedAnswers = localScan.answers;
          confidence = localScan.confidenceAvg;
        } else {
          await colabTunnelWatchdog.enqueueTask('image_process', {
            templateId: params.templateId,
            studentId: params.studentId,
          });
          throw new Error('[OmrCorrectionService] Falha na Visão Computacional: worker GPU indisponível e imagem não pôde ser decodificada pelo Kernel OMR Determinístico local. Tarefa enfileirada no watchdog.');
        }
      }
    } else {
      // Executa Kernel OMR Determinístico Local (OpenCV Sauvola + Homografia 3x3)
      const localScan = this.runLocalDeterministicOmrKernel(
        params.imageBuffer,
        template.totalQuestions,
        template.optionsCount || 5
      );
      if (localScan) {
        detectedAnswers = localScan.answers;
        confidence = localScan.confidenceAvg;
      } else {
        // Fallback Resiliente Tier 3: NVIDIA NIM Multimodal Vision (meta/llama-3.2-90b-vision-instruct)
        const nvidiaScan = this.runNvidiaNimVisionOmr(
          params.imageBuffer,
          template.totalQuestions,
          template.optionsCount || 5
        );
        if (nvidiaScan) {
          detectedAnswers = nvidiaScan.answers;
          confidence = nvidiaScan.confidenceAvg;
        } else {
          throw new Error('[OmrCorrectionService] Leitura Óptica Offline Indisponível: a imagem fornecida não pôde ser processada pelo Kernel OMR Determinístico local (kernel_omr.py), pelo NVIDIA NIM Vision nem pelo worker GPU remoto.');
        }
      }
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

    const legalComplianceNotice =
      'Pré-correção óptica assistida por IA (Parecer CNE/CP nº 15/2026). A atribuição definitiva de nota depende de validação humana docente, com canal de contestação garantido.';

    // Salvar correção no banco de dados SQLite com estado HITL obrigatório
    const correctionId = await db.saveOmrCorrection({
      templateId: params.templateId,
      studentId: params.studentId,
      studentName: params.studentName,
      detectedAnswers,
      score: earnedPoints,
      totalPoints,
      accuracyPct,
      confidence,
      reviewStatus: 'PRE_CORRECAO_IA_PENDENTE_DOCENTE',
      requiresHumanTeacherValidation: true,
      contestationChannelEnabled: true,
      legalComplianceNotice,
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
      reviewStatus: 'PRE_CORRECAO_IA_PENDENTE_DOCENTE',
      requiresHumanTeacherValidation: true,
      contestationChannelEnabled: true,
      legalComplianceNotice,
      processedAt: new Date().toISOString(),
    };

    this.emit('exam:corrected', report);
    return report;
  }

  /**
   * Validação humana docente obrigatória (Parecer CNE/CP nº 15/2026) sobre pré-correção OMR.
   */
  public async approveTeacherReview(correctionId: string, teacherId: string) {
    if (!correctionId || !teacherId) {
      throw new Error('[OmrCorrectionService] correctionId e teacherId são obrigatórios para validação docente.');
    }

    const dbRes = await db.approveOmrCorrectionReview(correctionId, teacherId);
    const approvedAt = new Date().toISOString();

    try {
      const audit = ZeroBypassAuditService.getInstance(db);
      await audit.record({
        userId: teacherId,
        action: 'OMR_CORRECTION_TEACHER_APPROVED',
        details: `Pré-correção OMR ${correctionId} validada por docente humano (${teacherId}).`,
        metadata: { correctionId, teacherId, approvedAt },
        legalBasis: 'CNE_CP_15_2026',
        consentVerified: true,
      });
    } catch {
      // Fallback gracioso em testes sem trilha audit inicializada
    }

    const payload = {
      success: dbRes.success,
      correctionId,
      reviewStatus: 'APROVADA_DOCENTE' as const,
      requiresHumanTeacherValidation: false,
      teacherApprovedBy: teacherId,
      approvedAt,
    };
    this.emit('exam:teacher-approved', payload);
    return payload;
  }

  /**
   * Canal formal de contestação da pré-correção OMR (Parecer CNE/CP nº 15/2026).
   */
  public async contestCorrection(correctionId: string, reason: string, actorId: string) {
    if (!correctionId || !reason || !reason.trim()) {
      throw new Error('[OmrCorrectionService] correctionId e motivo da contestação são obrigatórios.');
    }

    const cleanActor = actorId || 'ACTOR_UNSPECIFIED';
    const dbRes = await db.contestOmrCorrection(correctionId, reason.trim(), cleanActor);
    const contestedAt = new Date().toISOString();

    try {
      const audit = ZeroBypassAuditService.getInstance(db);
      await audit.record({
        userId: cleanActor,
        action: 'OMR_CORRECTION_CONTESTED',
        details: `Pré-correção OMR ${correctionId} contestada: ${reason.trim()}`,
        metadata: { correctionId, actorId: cleanActor, reason: reason.trim(), contestedAt },
        legalBasis: 'CNE_CP_15_2026',
        consentVerified: true,
      });
    } catch {
      // Fallback gracioso em testes sem trilha audit inicializada
    }

    const payload = {
      success: dbRes.success,
      correctionId,
      reviewStatus: 'CONTESTADA' as const,
      contestationReason: reason.trim(),
      contestedBy: cleanActor,
      contestedAt,
    };
    this.emit('exam:contested', payload);
    return payload;
  }

  public async listTemplates(classId?: string): Promise<Record<string, unknown>[]> {
    return await db.listOmrTemplates(classId);
  }

  /**
   * Executa o Kernel OMR Determinístico Local em Python/OpenCV (`kernel_omr.py`):
   * - Binarização adaptativa de Sauvola via Imagem Integral
   * - Detecção de 4 fiduciais de canto + Homografia 3x3
   * - Densidade óptica circular vetorizada + margem tau >= 0.35
   * Proibido gerar respostas sequenciais (A, B, C, D, E) sem ler os pixels reais da imagem.
   */
  public runLocalDeterministicOmrKernel(
    imageBuffer: Buffer,
    totalQuestions: number,
    optionsCount: number
  ): { answers: Record<string, string>; confidenceAvg: number } | null {
    if (!imageBuffer || imageBuffer.length < 32) {
      return null;
    }

    const kernelPath = path.resolve(__dirname, '../python/kernel_omr.py');
    const proc = spawnSync(
      'python',
      [
        kernelPath,
        '--stdin-base64',
        '--questions',
        String(totalQuestions),
        '--options',
        String(optionsCount),
      ],
      {
        input: imageBuffer.toString('base64'),
        encoding: 'utf-8',
        timeout: 8000,
      }
    );

    if (proc.status !== 0 || !proc.stdout) {
      return null;
    }

    try {
      const parsed = JSON.parse(proc.stdout.trim()) as {
        answers?: Record<string, string | null>;
        confidence_avg?: number;
        error?: string;
      };
      if (parsed.error || !parsed.answers) {
        return null;
      }

      const sanitizedAnswers: Record<string, string> = {};
      for (const [qKey, val] of Object.entries(parsed.answers)) {
        if (typeof val === 'string' && val.length > 0) {
          sanitizedAnswers[qKey] = val;
        }
      }

      return {
        answers: sanitizedAnswers,
        confidenceAvg: typeof parsed.confidence_avg === 'number' ? parsed.confidence_avg : 0.85,
      };
    } catch {
      return null;
    }
  }

  /**
   * Executa fallback de Visão Multimodal com NVIDIA NIM (Llama 3.2 90B Vision)
   * quando o gabarito apresenta rasuras, baixa iluminação ou fiduciais danificados.
   */
  public runNvidiaNimVisionOmr(
    imageBuffer: Buffer,
    totalQuestions: number,
    optionsCount: number
  ): { answers: Record<string, string>; confidenceAvg: number } | null {
    if (!imageBuffer || imageBuffer.length < 32) return null;

    try {
      const tempPath = path.resolve(process.env.TEMP || 'C:\\Windows\\Temp', `aquila_omr_${Date.now()}.jpg`);
      fs.writeFileSync(tempPath, imageBuffer);

      const workerPath = path.resolve(process.cwd(), 'scripts/nvidia_vision_worker.py');
      if (!fs.existsSync(workerPath)) {
        try { fs.unlinkSync(tempPath); } catch {}
        return null;
      }

      const proc = spawnSync(
        'python',
        [
          workerPath,
          '--image',
          tempPath,
          '--omr',
          '--questions',
          String(totalQuestions)
        ],
        {
          encoding: 'utf-8',
          timeout: 45000,
        }
      );

      try { fs.unlinkSync(tempPath); } catch {}

      if (proc.status !== 0 || !proc.stdout) {
        return null;
      }

      const parsed = JSON.parse(proc.stdout.trim()) as {
        answers?: Record<string, string>;
        confidence_avg?: number;
      };

      if (parsed.answers && Object.keys(parsed.answers).length > 0) {
        return {
          answers: parsed.answers,
          confidenceAvg: typeof parsed.confidence_avg === 'number' ? parsed.confidence_avg : 0.92,
        };
      }
      return null;
    } catch {
      return null;
    }
  }
}

export const omrCorrectionService = OmrCorrectionService.getInstance();
