import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { ipcMain } from 'electron';
import microExpressionService from '../MicroExpressionService';
import behavioralAuditService from '../BehavioralAuditService';
import { behavioralAnalyticsService } from '../BehavioralAnalyticsService';
import { LGPDService } from '../LGPDService';
import { initializeBiometricPipelineWithQuarantineGate } from '../../orchestrator';
import { FaceVectorIndex } from '../FaceVectorIndex';
import { FaceRecognition } from '../FaceRecognition';
import { securityService } from '../SecurityService';
import { licenseService } from '../LicenseService';
import { seamlessIdentityService } from '../SeamlessIdentityService';
import { biometricSelfHealingService } from '../BiometricSelfHealingService';
import {
  evaluateStageAiPolicy,
  calculateAgeYears,
  inferEducationStageFromContext,
  isTeacherMediatedSessionAllowed,
  evaluateStudentAiAccess,
} from '../CneStagePolicyService';
import { EducationalAIIntegration } from '../EducationalAIIntegration';
import { integrityService } from '../IntegrityService';
import { omrCorrectionService } from '../OmrCorrectionService';
import { sovereignEssayService } from '../SovereignEssayService';
import { colabGpuBridge } from '../ColabGpuBridge';
import { db, Database } from '../../../database/Database';
import { registerIPCHandlers } from '../../../ipc/handlers';

describe('CNE/CP nº 15/2026 & ANPD NT 4/2026 Governance Suite (Electron)', () => {
  const originalEnvBio = process.env.BIOMETRIC_ATTENDANCE_ENABLED;

  beforeEach(() => {
    delete process.env.BIOMETRIC_ATTENDANCE_ENABLED;
  });

  afterEach(() => {
    jest.restoreAllMocks();
    if (originalEnvBio === undefined) {
      delete process.env.BIOMETRIC_ATTENDANCE_ENABLED;
    } else {
      process.env.BIOMETRIC_ATTENDANCE_ENABLED = originalEnvBio;
    }
  });

  describe('1. Neutralização de Inferência Emocional / Social Scoring', () => {
    it('MicroExpressionService permanece bloqueado e retorna apenas métricas zeradas sem timers ativos', () => {
      expect(microExpressionService.isBlocked()).toBe(true);
      expect(() => microExpressionService.stop()).not.toThrow();

      const analysis = microExpressionService.getLiveAnalysis('stu-emotion-1');
      expect(analysis.blocked).toBe(true);
      expect(analysis.complianceCode).toBe('CNE_15_2026_PROHIBITED_EMOTION_INFERENCE');
      expect(analysis.riskScore).toBe(0);
      expect(analysis.emotions).toEqual({
        stress: 0,
        anxiety: 0,
        aggression: 0,
        fatigue: 0,
        engagement: 0,
        neutral: 1,
      });
      expect(analysis.physicalSigns).toEqual({
        pupilDilation: false,
        heavyBreathingDetected: false,
        rapidEyeMovement: false,
        eyeClosureRate: 0,
      });

      const explanation = behavioralAuditService.explainDecision(analysis);
      expect(explanation).toContain('Parecer CNE/CP nº 15/2026');
      expect(behavioralAuditService.getEthicalSafeguards().some((s) => s.includes('CNE/CP nº 15/2026'))).toBe(true);
    });

    it('BehavioralAnalyticsService remove perfis mockados (Andrej/Alice/etc.) e bloqueia telemetria afetiva', async () => {
      const benchmark = behavioralAnalyticsService.getClassBenchmark('F-EF26A');
      expect(benchmark.blocked).toBe(true);
      expect(benchmark.complianceCode).toBe('CNE_15_2026_PROHIBITED_EMOTION_INFERENCE');
      expect(benchmark.totalStudents).toBe(0);
      expect(behavioralAnalyticsService.getStudentComparison('stu-1')).toBeNull();
      expect(behavioralAnalyticsService.getHighRiskAlerts()).toEqual([]);

      const telemetry = await behavioralAnalyticsService.getLiveTelemetry('stu-1');
      expect(telemetry.blocked).toBe(true);
      expect(telemetry.telemetryBlocked).toBe(true);
      expect(telemetry.complianceCode).toBe('CNE_15_2026_PROHIBITED_EMOTION_INFERENCE');
      expect(telemetry.history).toEqual([]);
      expect(telemetry.riskScore).toBe(0);
      expect(JSON.stringify(telemetry)).not.toContain('Andrej');
    });
  });

  describe('2. Quarentena Biométrica ANPD (Despacho 2/2026 & NT 4/2026)', () => {
    it('bloqueia startup biométrico no orchestrator e FaceRecognition por padrão', async () => {
      const mockDb: any = {
        get: jest.fn().mockResolvedValue(null),
        all: jest.fn().mockResolvedValue([]),
        run: jest.fn().mockResolvedValue({ changes: 1 }),
        getStudentCount: jest.fn().mockResolvedValue(0),
        getFaceEmbeddings: jest.fn().mockResolvedValue([]),
      };

      const lgpd = new LGPDService(mockDb);
      const status = await lgpd.getBiometricQuarantineStatus();
      expect(status.enabled).toBe(false);
      expect(status.defaultPath).toBe('QR_CARD_OR_NOMINAL_CALL');

      await expect(
        lgpd.assertBiometricAttendanceAllowed({ studentId: 'stu-q1' })
      ).rejects.toMatchObject({ code: 'ANPD_BIOMETRIC_QUARANTINE_ACTIVE' });

      const startBiometricPipeline = jest.fn(async () => {});
      const onQuarantined = jest.fn();
      const auditRecord = jest.fn(async () => ({ id: 1 }));

      const gateRes = await initializeBiometricPipelineWithQuarantineGate({
        lgpdService: lgpd,
        auditService: { record: auditRecord },
        startBiometricPipeline,
        onQuarantined,
      });

      expect(gateRes.started).toBe(false);
      expect(startBiometricPipeline).not.toHaveBeenCalled();
      expect(onQuarantined).toHaveBeenCalledTimes(1);
      expect(auditRecord).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'ANPD_PARANA_BIOMETRIC_QUARANTINE_BLOCKED',
          consentVerified: false,
        })
      );

      const faceRec = new FaceRecognition(mockDb, undefined, '/tmp/aquila-bio-test', lgpd);
      await expect(faceRec.loadModel()).rejects.toMatchObject({ code: 'ANPD_BIOMETRIC_QUARANTINE_ACTIVE' });
      await expect(faceRec.recognize(Buffer.from('fake-img'))).rejects.toMatchObject({
        code: 'ANPD_BIOMETRIC_QUARANTINE_ACTIVE',
      });
      await expect(faceRec.addFace('stu-q1', Buffer.from('fake-img'))).rejects.toMatchObject({
        code: 'ANPD_BIOMETRIC_QUARANTINE_ACTIVE',
      });
      await expect(
        faceRec.addMultiAngleFace('stu-q1', { front: 'AAAA', left: 'AAAA', right: 'AAAA' })
      ).rejects.toMatchObject({ code: 'ANPD_BIOMETRIC_QUARANTINE_ACTIVE' });
    });

    it('permite startup biométrico somente quando env flag e RIPD institucional estão aprovados', async () => {
      process.env.BIOMETRIC_ATTENDANCE_ENABLED = 'true';
      const mockDb: any = {
        get: jest.fn().mockResolvedValue({ id: 42 }),
      };
      const lgpd = new LGPDService(mockDb);
      const startBiometricPipeline = jest.fn(async () => {});

      const gateRes = await initializeBiometricPipelineWithQuarantineGate({
        lgpdService: lgpd,
        startBiometricPipeline,
      });

      expect(gateRes.started).toBe(true);
      expect(gateRes.status.enabled).toBe(true);
      expect(gateRes.status.ripdApproved).toBe(true);
      expect(startBiometricPipeline).toHaveBeenCalledTimes(1);
    });
  });

  describe('3. Integridade de Embeddings, HNSW (128 vs 512), AES-256-GCM e role=student', () => {
    it('FaceVectorIndex suporta transição dinâmica 128-dim <-> 512-dim e evita NaN em vetores incompatíveis', () => {
      const index = new FaceVectorIndex(512, 16, 64, 'cosine');
      expect(index.getDimensions()).toBe(512);

      const vec128 = Array.from({ length: 128 }, (_, i) => (i === 0 ? 1 : 0));
      index.add('stu-128_front', vec128);
      expect(index.getDimensions()).toBe(128);
      expect(index.search(vec128, 1, 0.5)[0]?.id).toBe('stu-128_front');

      // Consulta com dimensão divergente não deve retornar NaN nem quebrar
      const vec512 = Array.from({ length: 512 }, (_, i) => (i === 0 ? 1 : 0));
      expect(index.search(vec512, 1, 0.5)).toEqual([]);

      // Inserção de novo vetor 512-dim reconfigura o índice com segurança
      index.add('stu-512_front', vec512);
      expect(index.getDimensions()).toBe(512);
      const hits = index.search(vec512, 1, 0.5);
      expect(hits).toHaveLength(1);
      expect(hits[0]?.id).toBe('stu-512_front');
      expect(Number.isFinite(hits[0].score)).toBe(true);
    });

    it('FaceRecognition: base64 puro sem prefixo, AES-256-GCM getEmbeddingById e role=student em recognize()', async () => {
      jest.spyOn(licenseService, 'assertStudentLimit').mockResolvedValue(undefined);
      const presenceSpy = jest.spyOn(seamlessIdentityService, 'reportPresence').mockImplementation(() => {});
      const healingSpy = jest
        .spyOn(biometricSelfHealingService, 'attemptSelfHealing')
        .mockResolvedValue(false as any);

      const vec512 = Array.from({ length: 512 }, (_, i) => (i === 0 ? 0.99 : 0.01));
      const encryptedHex = securityService
        .encryptBuffer(Buffer.from(JSON.stringify(vec512), 'utf8'))
        .toString('hex');

      const mockDb: any = {
        getStudentCount: jest.fn().mockResolvedValue(1),
        getFaceEmbeddings: jest.fn().mockResolvedValue([
          { faceId: 'stu-42_front', studentId: 'stu-42', embedding: vec512 },
        ]),
        saveFaceEmbedding: jest.fn().mockResolvedValue(undefined),
        all: jest.fn().mockImplementation(async (sql: string, params: any[]) => {
          if (sql.includes('WHERE face_id = ?') && params[0] === 'stu-42_front') {
            return [{ embedding: encryptedHex }];
          }
          if (sql.includes('WHERE face_id = ?') && params[0] === 'stu-42_json') {
            return [{ embedding: JSON.stringify(vec512) }];
          }
          return [];
        }),
      };

      const unlockedLgpd: any = {
        getBiometricQuarantineStatus: jest.fn().mockResolvedValue({ enabled: true }),
        assertBiometricAttendanceAllowed: jest.fn().mockResolvedValue({ enabled: true }),
      };

      const mockWorkerBridge: any = {
        isReady: jest.fn().mockReturnValue(true),
        loadEmbeddings: jest.fn().mockResolvedValue(undefined),
        extractEmbedding: jest.fn().mockResolvedValue(vec512),
      };

      const faceRec = new FaceRecognition(mockDb, mockWorkerBridge, '/tmp/aquila-bio-unlocked', unlockedLgpd);
      await faceRec.loadModel();

      // Decriptação AES-256-GCM e fallback JSON consultando face_id
      const decVec = await faceRec.getEmbeddingById('stu-42_front');
      expect(decVec).toHaveLength(512);
      expect(decVec[0]).toBeCloseTo(0.99, 5);
      const jsonVec = await faceRec.getEmbeddingById('stu-42_json');
      expect(jsonVec).toHaveLength(512);

      // addMultiAngleFace com base64 puro sem 'data:image/jpeg;base64,' não lança TypeError
      const rawBase64 = Buffer.from('mock-jpeg-bytes').toString('base64');
      await expect(
        faceRec.addMultiAngleFace('stu-42', { front: rawBase64, left: '', right: '' })
      ).resolves.not.toThrow();
      expect(mockDb.saveFaceEmbedding).toHaveBeenCalledWith('stu-42', vec512, 'stu-42_front');

      // recognize() reporta presença como 'student' (nunca 'teacher') e passa match.faceId ao self-healing
      const match = await faceRec.recognize(Buffer.from('frame'));
      expect(match?.studentId).toBe('stu-42');
      expect(match?.faceId).toBe('stu-42_front');
      expect(presenceSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'stu-42',
          role: 'student',
        })
      );
      expect(healingSpy).toHaveBeenCalledWith(
        'stu-42',
        vec512,
        expect.arrayContaining([0.99]),
        'stu-42_front'
      );
    });
  });

  describe('4. Política Etária CNE/CP nº 15/2026 & Neutralização de Detectores de IA', () => {
    it('evaluateStageAiPolicy e evaluateStudentAiAccess bloqueiam Infantil e 1º–5º ano EF sem mediação docente', async () => {
      expect(evaluateStageAiPolicy('EDUCACAO_INFANTIL')).toMatchObject({
        directStudentAiAllowed: false,
        autonomousChatbotAllowed: false,
        policyMode: 'BLOCKED_INFANTIL_DOCENTE_ONLY',
      });
      expect(evaluateStageAiPolicy('EF_ANOS_INICIAIS')).toMatchObject({
        directStudentAiAllowed: false,
        autonomousChatbotAllowed: false,
        policyMode: 'SUPERVISED_TEACHER_MEDIATED_ONLY',
      });
      expect(evaluateStageAiPolicy('EF_ANOS_FINAIS')).toMatchObject({
        directStudentAiAllowed: true,
        autonomousChatbotAllowed: true,
      });
      expect(evaluateStageAiPolicy('ENSINO_MEDIO')).toMatchObject({
        directStudentAiAllowed: true,
        autonomousChatbotAllowed: true,
      });

      expect(calculateAgeYears('2019-06-01', new Date('2026-11-12T12:00:00Z'))).toBe(7);
      expect(inferEducationStageFromContext({ className: '3º Ano A' }).stage).toBe('EF_ANOS_INICIAIS');
      expect(isTeacherMediatedSessionAllowed('teacher')).toBe(true);
      expect(isTeacherMediatedSessionAllowed('student')).toBe(false);

      // Bloqueio via DB lookup por studentId (aluno 8 anos / 3º ano)
      const mockDb: any = {
        get: jest.fn(async (sql: string) => {
          if (sql.includes('FROM students')) {
            return {
              id: 'stu-ef1',
              classId: 'F-EF13A',
              birthDate: '2018-04-10',
              className: '3º Ano A',
              classGrade: '3º Ano EF',
              metadata: null,
            };
          }
          return null;
        }),
      };

      const blockedDirect = await evaluateStudentAiAccess({
        db: mockDb,
        studentId: 'stu-ef1',
        channel: 'pedagogy:ask-copilot',
      });
      expect(blockedDirect.blocked).toBe(true);
      expect(blockedDirect.code).toBe('CNE_15_2026_EARLY_STAGE_AI_BLOCKED');

      // Tentativa de spoof teacherMediated=true com papel 'student' continua bloqueada
      const blockedSpoof = await evaluateStudentAiAccess({
        db: mockDb,
        studentId: 'stu-ef1',
        teacherMediated: true,
        actorRole: 'student',
        channel: 'pedagogy:ask-copilot',
      });
      expect(blockedSpoof.blocked).toBe(true);

      // Mediação docente autenticada é permitida
      const allowedTeacher = await evaluateStudentAiAccess({
        db: mockDb,
        studentId: 'stu-ef1',
        teacherMediated: true,
        actorRole: 'teacher',
        actorId: 'prof-1',
        channel: 'pedagogy:ask-copilot',
      });
      expect(allowedTeacher.allowed).toBe(true);
      expect(allowedTeacher.blocked).toBe(false);
      expect(allowedTeacher.teacherMediatedApplied).toBe(true);

      // Anos Finais / Ensino Médio permitidos
      const allowedEm = await evaluateStudentAiAccess({
        gradeLevel: '2ª Série EM',
        channel: 'pedagogy:ask-copilot',
      });
      expect(allowedEm.allowed).toBe(true);
      expect(allowedEm.blocked).toBe(false);
    });

    it('detectAIUsage e IntegrityService não aplicam sanções punitivas por detector de IA', async () => {
      const eduAi = new EducationalAIIntegration('test-key');
      const detectRes = await eduAi.detectAIUsage(
        'Portanto, desta forma, em conclusão, vale ressaltar.',
        'redacao'
      );
      expect(detectRes.advisoryOnly).toBe(true);
      expect(detectRes.aiDetectionAdvisoryOnly).toBe(true);
      expect(detectRes.punitiveSanctionProhibited).toBe(true);
      expect(detectRes.complianceCode).toBe('CNE_15_2026_AI_DETECTOR_ADVISORY_ONLY');

      const queueBefore = integrityService.getCoordinationQueue().length;
      integrityService.reportViolation({
        type: 'ai_suspicion',
        studentId: 'stu-ai-1',
        materialId: 'mat-1',
        timestamp: new Date(),
        details: 'Suspeita automática',
        severity: 'high',
      });
      const queueAfter = integrityService.getCoordinationQueue();
      expect(queueAfter.length).toBe(queueBefore);
      expect(queueAfter.filter((t) => t.type === 'ai_fraud')).toHaveLength(0);

      const blockAttempt = integrityService.blockStudentAI('stu-ai-1', 7, 'detector IA');
      expect(blockAttempt.blocked).toBe(false);
      expect(blockAttempt.aiDetectionAdvisoryOnly).toBe(true);
      expect(blockAttempt.punitiveSanctionProhibited).toBe(true);
      expect(integrityService.isAIBlocked('stu-ai-1').blocked).toBe(false);

      const cadence = integrityService.monitorTypingCadence({ text: 'texto de exemplo', events: [] });
      expect(cadence.aiDetectionAdvisoryOnly).toBe(true);
      expect(cadence.punitiveSanctionProhibited).toBe(true);
    });
  });

  describe('5. HITL OMR & Redação (RASCUNHO_IA -> Validação Docente + Contestação)', () => {
    it('OmrCorrectionService exige validação docente e suporta aprovação/contestação', async () => {
      await db.initialize();
      const dbInstance = Database.getInstance();
      jest.spyOn(dbInstance, 'getOmrTemplate').mockResolvedValue({
        id: 'tpl-cne-1',
        title: 'Simulado CNE',
        totalQuestions: 2,
        optionsCount: 5,
        answerKey: { '1': 'A', '2': 'B' },
        weights: { '1': 5, '2': 5 },
      });
      jest.spyOn(dbInstance, 'saveOmrCorrection').mockResolvedValue('omr-corr-1');
      jest.spyOn(dbInstance, 'approveOmrCorrectionReview').mockResolvedValue({ success: true });
      jest.spyOn(dbInstance, 'contestOmrCorrection').mockResolvedValue({ success: true });
      jest.spyOn(colabGpuBridge, 'getStatus').mockReturnValue({ online: false } as any);
      jest.spyOn(omrCorrectionService, 'runLocalDeterministicOmrKernel').mockReturnValue({
        answers: { '1': 'A', '2': 'C' },
        confidenceAvg: 0.94,
      });

      const report = await omrCorrectionService.correctExam({
        templateId: 'tpl-cne-1',
        imageBuffer: Buffer.alloc(64, 1),
        studentId: 'stu-omr-1',
        studentName: 'Estudante Teste',
      });

      expect(report.reviewStatus).toBe('PRE_CORRECAO_IA_PENDENTE_DOCENTE');
      expect(report.requiresHumanTeacherValidation).toBe(true);
      expect(report.contestationChannelEnabled).toBe(true);
      expect(report.legalComplianceNotice).toContain('Parecer CNE/CP nº 15/2026');
      expect(report.score).toBe(5);

      const approved = await omrCorrectionService.approveTeacherReview('omr-corr-1', 'prof-10');
      expect(approved.reviewStatus).toBe('APROVADA_DOCENTE');
      expect(approved.requiresHumanTeacherValidation).toBe(false);

      const contested = await omrCorrectionService.contestCorrection('omr-corr-1', 'Questão 2 rasurada pelo scanner', 'stu-omr-1');
      expect(contested.reviewStatus).toBe('CONTESTADA');
      expect(contested.contestationReason).toContain('Questão 2');
    });

    it('SovereignEssayService registra contestação formal da pré-correção', async () => {
      await db.initialize();
      const dbInstance = Database.getInstance();
      const contestDbSpy = jest.spyOn(dbInstance, 'contestStudentEssay').mockResolvedValue({ success: true });
      const res = await sovereignEssayService.contestPreCorrection('essay-99', 'Solicito revisão da Competência 5', 'stu-99');
      expect(contestDbSpy).toHaveBeenCalledWith('essay-99', 'Solicito revisão da Competência 5', 'stu-99');
      expect(res.reviewStatus).toBe('CONTESTADA');
      expect(res.contestationReason).toBe('Solicito revisão da Competência 5');
    });
  });

  describe('6. Deduplicação IPC, Compatibilidade de Contratos e Gates em handlers.ts', () => {
    it('registra zero canais duplicados e aplica gates ANPD / CNE / HITL corretamente', async () => {
      (ipcMain as any).removeHandler = jest.fn();
      (ipcMain.handle as jest.Mock).mockClear();

      const mockDb: any = {
        get: jest.fn(async (sql: string) => {
          if (sql.includes('FROM students')) {
            return {
              id: 'stu-inf',
              classId: 'F-EF11A',
              birthDate: '2020-02-01',
              className: '1º Ano A',
              classGrade: '1º Ano EF',
              metadata: null,
            };
          }
          if (sql.includes('COUNT(*) as total FROM students')) return { total: 100 };
          if (sql.includes('events')) return { total: 82 };
          if (sql.includes('attendance_logs') && sql.includes('COUNT')) return { total: 85 };
          if (sql.includes('attendance') && sql.includes("status = 'late'")) return { total: 4 };
          if (sql.includes('attendance')) return { total: 80 };
          return null;
        }),
        all: jest.fn().mockResolvedValue([]),
        run: jest.fn().mockResolvedValue({ changes: 1 }),
        validatePresence: jest.fn().mockResolvedValue({ valid: true, mode: 'object' }),
      };

      const mockSeating: any = {
        validatePresence: jest.fn().mockResolvedValue({ valid: true, mode: 'positional' }),
      };

      const mockAttendanceMonitor: any = {
        getTelemetry: jest.fn().mockResolvedValue({
          totalEnrolled: 100,
          currentStudents: 80,
          percentage: 80,
          lastUpdate: '2026-11-12T12:00:00Z',
        }),
      };

      const mockContext: any = {
        db: mockDb,
        lgpdService: new LGPDService(mockDb),
        seatingIntelligenceService: mockSeating,
        attendanceMonitor: mockAttendanceMonitor,
        authService: {
          getCurrentUser: jest.fn().mockResolvedValue({ id: 'stu-inf', role: 'student' }),
        },
        globalRateLimiter: {
          isRateLimited: jest.fn().mockReturnValue(false),
        },
      };

      registerIPCHandlers(mockContext);

      const registered = (ipcMain.handle as jest.Mock).mock.calls;
      const channelNames = registered.map((call) => call[0] as string);
      const uniqueNames = new Set(channelNames);
      expect(channelNames.length).toBeGreaterThan(400);
      expect(channelNames.length).toBe(uniqueNames.size);

      const handlerMap = new Map<string, (...args: any[]) => Promise<any>>();
      for (const [ch, fn] of registered) {
        handlerMap.set(ch as string, fn as any);
      }

      const fakeEvent: any = { sender: { id: 1 } };

      // 1) seating:validate-presence aceita objeto e args posicionais
      const objPresence = await handlerMap.get('seating:validate-presence')!(fakeEvent, {
        studentId: 'stu-1',
        classId: 'cls-1',
        seatId: 'A1',
      });
      expect(objPresence).toEqual({ valid: true, mode: 'object' });
      expect(mockDb.validatePresence).toHaveBeenCalledWith('stu-1', 'cls-1', 'A1');

      const posPresence = await handlerMap.get('seating:validate-presence')!(fakeEvent, 'cls-1', 'room-9');
      expect(posPresence).toEqual({ valid: true, mode: 'positional' });
      expect(mockSeating.validatePresence).toHaveBeenCalledWith('cls-1', 'room-9');

      // 2) behavioral:get-emotional-telemetry bloqueado
      const emoTelemetry = await handlerMap.get('behavioral:get-emotional-telemetry')!(fakeEvent, 'stu-1');
      expect(emoTelemetry).toMatchObject({
        history: [],
        telemetryBlocked: true,
        blocked: true,
        reason: 'CNE_15_2026_PROHIBITED_EMOTION_INFERENCE',
      });

      // 3) attendance:get-telemetry e get-attendance-telemetry unificados
      const att1 = await handlerMap.get('attendance:get-telemetry')!(fakeEvent);
      const att2 = await handlerMap.get('get-attendance-telemetry')!(fakeEvent);
      for (const att of [att1, att2]) {
        expect(att.success).toBe(true);
        expect(att.totalToday).toBe(100);
        expect(att.presentNow).toBe(85);
        expect(att.absentToday).toBe(15);
        expect(att.data.late).toBe(4);
      }

      // 4) Quarentena biométrica nos canais secretaria:register-face e start-recognition
      const regFaceRes = await handlerMap.get('secretaria:register-face')!(fakeEvent, {
        studentId: 'stu-1',
        base64Image: 'AAAA',
      });
      expect(regFaceRes.blocked).toBe(true);
      expect(regFaceRes.code).toBe('ANPD_BIOMETRIC_QUARANTINE_ACTIVE');

      const startRecRes = await handlerMap.get('start-recognition')!(fakeEvent, []);
      expect(startRecRes.blocked).toBe(true);
      expect(startRecRes.code).toBe('ANPD_BIOMETRIC_QUARANTINE_ACTIVE');

      // 5) Gate etário CNE/CP 15/2026 em pedagogy:ask-copilot, ai:vision-analyze e essay:submit-and-audit
      const copilotBlocked = await handlerMap.get('pedagogy:ask-copilot')!(fakeEvent, {
        studentId: 'stu-inf',
        question: 'Quanto é 2+2?',
      });
      expect(copilotBlocked.blocked).toBe(true);
      expect(copilotBlocked.code).toBe('CNE_15_2026_EARLY_STAGE_AI_BLOCKED');

      const visionBlocked = await handlerMap.get('ai:vision-analyze')!(fakeEvent, {
        gradeLevel: 'Educação Infantil',
        prompt: 'Analisar',
        image: 'AAAA',
      });
      expect(visionBlocked.blocked).toBe(true);
      expect(visionBlocked.code).toBe('CNE_15_2026_EARLY_STAGE_AI_BLOCKED');

      const essayBlocked = await handlerMap.get('essay:submit-and-audit')!(fakeEvent, {
        studentId: 'stu-inf',
        theme: 'Meio ambiente',
      });
      expect(essayBlocked.blocked).toBe(true);
      expect(essayBlocked.code).toBe('CNE_15_2026_EARLY_STAGE_AI_BLOCKED');

      // 6) Canais HITL registrados
      expect(handlerMap.has('grading:approve-omr-review')).toBe(true);
      expect(handlerMap.has('grading:contest-omr')).toBe(true);
      expect(handlerMap.has('essay:approve-teacher-review')).toBe(true);
      expect(handlerMap.has('essay:contest-precorrection')).toBe(true);
    });
  });
});
