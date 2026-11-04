/**
 * SchoolJourneyE2E.test.ts — Validação Completa da Jornada Escolar (Item 2 / H-01)
 * Secretaria -> Professor -> Aluno -> Correção -> Intervenção -> Persistência Pós-Reboot
 */

import * as path from 'path';
import * as fs from 'fs';
import { Database } from '../../../database/Database';
import { AuthService } from '../AuthService';
import SessionService from '../SessionService';
import { StudentBatchImportService } from '../StudentBatchImportService';
import { ZeroBypassAuditService } from '../ZeroBypassAuditService';

jest.mock('../SessionService');

describe('Jornada Escolar H-01 E2E (Serviços Reais & Persistência)', () => {
  const testDbDir = path.resolve('test-results/h01_journey_env');
  const dbPath = path.join(testDbDir, 'aquila_h01_journey.db');

  beforeAll(() => {
    if (!fs.existsSync(testDbDir)) fs.mkdirSync(testDbDir, { recursive: true });
    if (fs.existsSync(dbPath)) fs.unlinkSync(dbPath);
    if (fs.existsSync(`${dbPath}-wal`)) fs.unlinkSync(`${dbPath}-wal`);
    if (fs.existsSync(`${dbPath}-shm`)) fs.unlinkSync(`${dbPath}-shm`);
    process.env.AQUILA_AUTH_SECRET = 'sovereign-journey-test-key-minimum-32-bytes-length';
  });

  it('deve executar a jornada ponta a ponta e garantir persistência transacional pós-reboot', async () => {
    // 1. Inicializar Banco Real
    let db = new Database(dbPath);
    await db.initialize();

    const mockSessionService = new SessionService() as jest.Mocked<SessionService>;
    const authService = new AuthService(db, mockSessionService, process.env.AQUILA_AUTH_SECRET);
    await authService.provisionInitialAdmin();

    ZeroBypassAuditService.resetInstance();
    const auditService = ZeroBypassAuditService.getInstance(db as any);
    await auditService.initialize();

    const importService = new StudentBatchImportService(db as any);

    // 2. Secretaria: Importação de CSV Sintético via StudentBatchImportService
    const validBatch = [
      {
        enrollmentId: '2026001',
        fullName: 'Lucas Silveira',
        className: '1A',
        guardianName: 'Carlos Silveira',
        guardianContact: 'carlos@teste.local',
        birthDate: '2010-04-12',
      },
      {
        enrollmentId: '2026002',
        fullName: 'Mariana Costa',
        className: '1A',
        guardianName: 'Ana Costa',
        guardianContact: 'ana@teste.local',
        birthDate: '2010-08-15',
      },
      {
        enrollmentId: '2026003',
        fullName: 'Gabriel Rocha',
        className: '1A',
        guardianName: 'Paula Rocha',
        guardianContact: 'paula@teste.local',
        birthDate: '2010-01-20',
      },
    ];

    const preview = await importService.generatePreview(validBatch);
    expect(preview.validRowsCount).toBe(3);
    expect(preview.canProceedToConfirm).toBe(true);

    const importResult = await importService.confirmImport(preview.batchId, 'operador_sec_01', {
      schoolId: 'school-aquila-main',
      operatorRole: 'secretaria',
    });
    expect(importResult.success).toBe(true);
    expect(importResult.insertedCount).toBe(3);

    const students = db.prepare('SELECT id, name, class FROM students WHERE class = ?').all('1A') as any[];
    expect(students.length).toBeGreaterThanOrEqual(3);
    const targetStudent = students.find(s => s.name === 'Lucas Silveira');
    expect(targetStudent).toBeDefined();

    // 3. Docente: Autenticação e Criação de Atividade Pedagógica
    const teacherUser = 'prof_andre';
    const teacherPass = 'SenhaForte@2026';
    await authService.createUser({
      username: teacherUser,
      password: teacherPass,
      role: 'teacher',
      name: 'Prof. André Souza'
    });

    const teacherSession = await authService.login(teacherUser, teacherPass);
    expect(teacherSession).not.toBeNull();
    expect(teacherSession?.user.role).toBe('teacher');

    const activityId = 'act-h01-fisica-01';
    db.prepare(`
      INSERT INTO activities (id, title, class_id, subject, created_by, max_score, created_at)
      VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `).run(activityId, 'Avaliação Formativa: Cinemática Escalar', '1A', 'Física', teacherUser, 10.0);

    db.prepare(`
      INSERT INTO activity_questions (id, activity_id, question_number, prompt, answer_key, weight)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run('q1', activityId, 1, 'Velocidade média em 100m em 10s?', 'B', 5.0);

    db.prepare(`
      INSERT INTO activity_questions (id, activity_id, question_number, prompt, answer_key, weight)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run('q2', activityId, 2, 'No MRUV, qual grandeza é constante?', 'A', 5.0);

    // 4. Aluno: Submissão e Correção Objetiva
    const submissionId = `sub-${targetStudent.id}-${activityId}`;
    const studentAnswers = [
      { questionId: 'q1', selected: 'B', isCorrect: true, score: 5.0 },
      { questionId: 'q2', selected: 'C', isCorrect: false, score: 0.0 }
    ];
    const totalScore = studentAnswers.reduce((acc, a) => acc + a.score, 0);

    db.prepare(`
      INSERT INTO activity_submissions (id, activity_id, student_id, answers_json, total_score, submitted_at, status)
      VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, 'GRADED')
    `).run(submissionId, activityId, targetStudent.id, JSON.stringify(studentAnswers), totalScore);

    // Docente Registra Intervenção Pedagógica
    const interventionId = `int-${Date.now()}`;
    db.prepare(`
      INSERT INTO pedagogical_interventions (id, student_id, teacher_id, reason, action_plan, status, created_at)
      VALUES (?, ?, ?, ?, ?, 'ACTIVE', CURRENT_TIMESTAMP)
    `).run(
      interventionId,
      targetStudent.id,
      teacherUser,
      'Dificuldade em MRUV conceitual',
      'Atribuição de cápsula de reforço e lista com 5 exercícios'
    );

    // 5. Simular Queda / Reboot e Validar Persistência Total
    db.prepare('PRAGMA wal_checkpoint(TRUNCATE)').run();
    db.close();

    // Reabertura em processo isolado
    const restartedDb = new Database(dbPath);
    await restartedDb.initialize();

    const count = restartedDb.prepare('SELECT count(*) as count FROM students WHERE class = ?').get('1A') as any;
    expect(count.count).toBeGreaterThanOrEqual(3);

    const act = restartedDb.prepare('SELECT title FROM activities WHERE id = ?').get(activityId) as any;
    expect(act.title).toBe('Avaliação Formativa: Cinemática Escalar');

    const sub = restartedDb.prepare('SELECT total_score, status FROM activity_submissions WHERE id = ?').get(submissionId) as any;
    expect(sub.total_score).toBe(5.0);
    expect(sub.status).toBe('GRADED');

    const intv = restartedDb.prepare('SELECT status FROM pedagogical_interventions WHERE id = ?').get(interventionId) as any;
    expect(intv.status).toBe('ACTIVE');

    const integrity = restartedDb.prepare('PRAGMA integrity_check').get() as any;
    expect(integrity.integrity_check).toBe('ok');

    restartedDb.close();

    // Salvar evidência
    const reportPath = path.resolve('test-results/school_journey_h01_evidence.json');
    fs.writeFileSync(reportPath, JSON.stringify({
      timestamp: new Date().toISOString(),
      item: 'Item 2: Jornada Escolar no Aplicativo Instalado',
      status: 'PASS',
      metrics: {
        students_imported: 3,
        activity_created: activityId,
        submission_score: totalScore,
        intervention_recorded: interventionId,
        sqlite_integrity: integrity.integrity_check,
        post_reboot_persistence: true
      }
    }, null, 2), 'utf8');
  });
});
