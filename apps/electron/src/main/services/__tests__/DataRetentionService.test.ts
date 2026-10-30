/**
 * DataRetentionService.test.ts — Áquila Pro School OS
 * ════════════════════════════════════════════════════════════════════════════
 * Teste de Homologação da Política de Retenção e Descarte de Dados v1.0 (LAW-801)
 * Valida os 11 critérios de aceite em ambiente isolado e determinístico:
 * 1. 20 categorias com políticas configuráveis e proibição de retenção indefinida.
 * 2. Transição de estados: ATIVO -> ARQUIVADO -> QUARENTENA_JURIDICA -> ANONIMIZADO -> EXCLUIDO.
 * 3. Bloqueio fail-safe de exportação em QUARENTENA_JURIDICA.
 * 4. Exclusão segura em 3 camadas e registro de tombstones.
 * 5. Expurgo compulsório de biometria facial (SLA 24 horas).
 * 6. Descarte de imagens OMR após 90 dias com preservação de notas.
 * 7. Expurgo de leads inativos após 24 meses (730 dias).
 * 8. k-Anonimato e proteção de menores para turmas < 10 alunos.
 * 9. Garantia anti-reintrodução em restauração de backups.
 * 10. Relatório de conformidade do DPO e atendimento a direitos do titular (LGPD Art. 18).
 * ════════════════════════════════════════════════════════════════════════════
 */

import {
  DataRetentionService,
  DEFAULT_RETENTION_POLICIES,
  IndefiniteRetentionForbiddenError,
  QuarantineExportBlockedError,
  SmallClassDeidentificationError
} from '../DataRetentionService';
import { ZeroBypassAuditService } from '../ZeroBypassAuditService';

class StatefulMockDb {
  public policies = new Map<string, any>();
  public items = new Map<string, any>();
  public tombstones: any[] = [];
  public jobs = new Map<string, any>();
  public students = new Map<string, any>();
  public growthLeads = new Map<string, any>();
  public omrCorrections = new Map<string, any>();
  public faceEmbeddings: any[] = [];
  public studentFaceEmbeddings512: any[] = [];
  public audits: any[] = [];

  async run(sql: string, params: any[] = []): Promise<any> {
    const s = sql.trim().toUpperCase();

    if (s.startsWith('CREATE TABLE') || s.startsWith('ALTER TABLE') || s.startsWith('PRAGMA')) {
      return { changes: 0, lastInsertRowid: 0 };
    }

    if (s.includes('INSERT OR IGNORE INTO RETENTION_POLICIES') || s.includes('INSERT INTO RETENTION_POLICIES')) {
      const [id, schoolId, category, name, days, postAction, role, allowIndefinite] = params;
      const key = `${schoolId}_${category}`;
      const existing = this.policies.get(key);
      if (!existing || s.includes('DO UPDATE SET')) {
        this.policies.set(key, {
          id,
          school_id: schoolId,
          category,
          name,
          retention_period_days: days,
          post_action: postAction,
          responsible_role: role,
          allow_indefinite: allowIndefinite || 0
        });
        return { changes: 1, lastInsertRowid: 1 };
      }
      return { changes: 0, lastInsertRowid: 0 };
    }

    if (s.includes('INSERT INTO RETENTION_ITEMS')) {
      const [id, schoolId, category, entityType, entityId, filePath, contentHash, expiresAt] = params;
      const key = `${schoolId}_${entityType}_${entityId}`;
      const item = {
        id,
        school_id: schoolId,
        category,
        entity_type: entityType,
        entity_id: entityId,
        status: 'ATIVO',
        file_path: filePath,
        content_hash: contentHash,
        expires_at: expiresAt,
        crypto_purged: 0
      };
      this.items.set(key, item);
      return { changes: 1, lastInsertRowid: 1 };
    }

    if (s.includes('UPDATE RETENTION_ITEMS SET')) {
      if (s.includes("STATUS = 'QUARENTENA_JURIDICA'")) {
        const [reason, dpo, schoolId, entityType, entityId] = params;
        const key = `${schoolId}_${entityType}_${entityId}`;
        const item = this.items.get(key);
        if (item) {
          item.status = 'QUARENTENA_JURIDICA';
          item.quarantine_reason = reason;
          item.quarantined_by = dpo;
        }
        return { changes: 1 };
      }
      if (s.includes("STATUS = 'ATIVO'")) {
        const [schoolId, entityType, entityId] = params;
        const key = `${schoolId}_${entityType}_${entityId}`;
        const item = this.items.get(key);
        if (item) {
          item.status = 'ATIVO';
          item.quarantine_reason = null;
        }
        return { changes: 1 };
      }
      if (s.includes("STATUS = 'EXCLUIDO'")) {
        const [schoolId, entityType, entityId] = params;
        const key = `${schoolId}_${entityType}_${entityId}`;
        const item = this.items.get(key);
        if (item) {
          item.status = 'EXCLUIDO';
          item.crypto_purged = 1;
        }
        return { changes: 1 };
      }
      if (s.includes("STATUS = 'ANONIMIZADO'")) {
        const [schoolId, entityId] = params;
        const key = `${schoolId}_student_${entityId}`;
        const item = this.items.get(key);
        if (item) {
          item.status = 'ANONIMIZADO';
        }
        return { changes: 1 };
      }
    }

    if (s.includes('INSERT INTO RETENTION_TOMBSTONES')) {
      const [id, schoolId, entityType, entityId, contentHash, category, reason, performedBy, auditHash] = params;
      this.tombstones.push({
        id,
        school_id: schoolId,
        entity_type: entityType,
        entity_id: entityId,
        content_hash: contentHash,
        category,
        reason,
        performed_by: performedBy,
        audit_hash: auditHash
      });
      return { changes: 1, lastInsertRowid: this.tombstones.length };
    }

    if (s.includes('DELETE FROM FACE_EMBEDDINGS WHERE STUDENT_ID = ?')) {
      const before = this.faceEmbeddings.length;
      this.faceEmbeddings = this.faceEmbeddings.filter(f => f.student_id !== params[0]);
      return { changes: before - this.faceEmbeddings.length };
    }

    if (s.includes('DELETE FROM STUDENT_FACE_EMBEDDINGS_512 WHERE STUDENTID = ?')) {
      const before = this.studentFaceEmbeddings512.length;
      this.studentFaceEmbeddings512 = this.studentFaceEmbeddings512.filter(f => f.studentId !== params[0]);
      return { changes: before - this.studentFaceEmbeddings512.length };
    }

    if (s.includes('UPDATE OMR_EXAM_CORRECTIONS SET SCANIMAGEPATH =')) {
      const [id] = params;
      const corr = this.omrCorrections.get(id);
      if (corr) {
        corr.scanImagePath = '[PURGED_EXPIRED]';
      }
      return { changes: 1 };
    }

    if (s.includes('UPDATE GROWTH_LEADS SET')) {
      const [name, id] = params;
      const lead = this.growthLeads.get(id);
      if (lead) {
        lead.name = name;
        lead.email = '[ANONIMIZADO]';
        lead.phone = '[ANONIMIZADO]';
        lead.status = 'ANONIMIZADO';
      }
      return { changes: 1 };
    }

    if (s.includes('UPDATE STUDENTS SET')) {
      const [name, id] = params;
      const stu = this.students.get(id);
      if (stu) {
        stu.name = name;
        stu.cpf = '[ANONIMIZADO]';
        stu.email = '[ANONIMIZADO]';
        stu.phone = '[ANONIMIZADO]';
      }
      return { changes: 1 };
    }

    if (s.includes('INSERT INTO ZERO_BYPASS_AUDITS')) {
      this.audits.push({ id: this.audits.length + 1, hash: params[6], previous_hash: params[5] });
      return { changes: 1, lastInsertRowid: this.audits.length };
    }

    if (s.includes('INSERT INTO RETENTION_JOBS')) {
      this.jobs.set(params[0], { id: params[0], status: params[2] });
      return { changes: 1 };
    }

    return { changes: 1, lastInsertRowid: 1 };
  }

  async get(sql: string, params: any[] = []): Promise<any> {
    const s = sql.trim().toUpperCase();

    if (s.includes('FROM ZERO_BYPASS_AUDITS')) {
      return this.audits[this.audits.length - 1] || undefined;
    }

    if (s.includes('FROM RETENTION_POLICIES WHERE SCHOOL_ID = ? AND CATEGORY = ?')) {
      const key = `${params[0]}_${params[1]}`;
      return this.policies.get(key) || undefined;
    }

    if (s.includes('FROM RETENTION_ITEMS WHERE SCHOOL_ID = ? AND ENTITY_TYPE = ? AND ENTITY_ID = ?')) {
      const key = `${params[0]}_${params[1]}_${params[2]}`;
      return this.items.get(key) || undefined;
    }

    if (s.includes('FROM RETENTION_ITEMS WHERE ENTITY_ID = ?')) {
      for (const it of this.items.values()) {
        if (it.entity_id === params[0]) return it;
      }
      return undefined;
    }

    if (s.includes('FROM RETENTION_TOMBSTONES WHERE ENTITY_ID = ?')) {
      return this.tombstones.find(t => t.entity_id === params[0]) || undefined;
    }

    if (s.includes('COUNT(*) AS COUNT FROM FACE_EMBEDDINGS WHERE STUDENT_ID = ?')) {
      const count = this.faceEmbeddings.filter(f => f.student_id === params[0]).length;
      return { count };
    }

    if (s.includes('COUNT(*) AS COUNT FROM STUDENT_FACE_EMBEDDINGS_512 WHERE STUDENTID = ?')) {
      const count = this.studentFaceEmbeddings512.filter(f => f.studentId === params[0]).length;
      return { count };
    }

    if (s.includes('FROM OMR_EXAM_CORRECTIONS WHERE ID = ?')) {
      return this.omrCorrections.get(params[0]) || undefined;
    }

    if (s.includes('FROM GROWTH_LEADS WHERE ID = ?')) {
      return this.growthLeads.get(params[0]) || undefined;
    }

    if (s.includes('FROM STUDENTS WHERE ID = ?')) {
      return this.students.get(params[0]) || undefined;
    }

    return undefined;
  }

  async all(sql: string, params: any[] = []): Promise<any[]> {
    const s = sql.trim().toUpperCase();

    if (s.includes('PRAGMA TABLE_INFO')) {
      return [{ name: 'previous_hash' }, { name: 'hash' }, { name: 'legal_basis' }, { name: 'consent_verified' }];
    }

    if (s.includes('COUNT(*) AS COUNT FROM RETENTION_POLICIES WHERE SCHOOL_ID = ?')) {
      const count = Array.from(this.policies.values()).filter(p => p.school_id === params[0]).length;
      return [{ count }];
    }

    if (s.includes('COUNT(*) AS COUNT FROM RETENTION_TOMBSTONES WHERE SCHOOL_ID = ?')) {
      const count = this.tombstones.filter(t => t.school_id === params[0]).length;
      return [{ count }];
    }

    if (s.includes('FROM RETENTION_POLICIES WHERE SCHOOL_ID = ?')) {
      return Array.from(this.policies.values()).filter(p => p.school_id === params[0]);
    }

    if (s.includes('FROM RETENTION_ITEMS WHERE SCHOOL_ID = ?')) {
      return Array.from(this.items.values()).filter(i => i.school_id === params[0]);
    }

    if (s.includes('FROM RETENTION_TOMBSTONES WHERE SCHOOL_ID = ?')) {
      return this.tombstones.filter(t => t.school_id === params[0]);
    }

    if (s.includes('FROM OMR_EXAM_CORRECTIONS')) {
      const cutoff = params[0];
      return Array.from(this.omrCorrections.values()).filter(
        c => c.scanImagePath && c.scanImagePath !== '[PURGED_EXPIRED]' && c.processedAt < cutoff
      );
    }

    if (s.includes('FROM GROWTH_LEADS')) {
      const [schoolId, cutoff] = params;
      return Array.from(this.growthLeads.values()).filter(
        l => l.school_id === schoolId && l.status !== 'CONVERTED' && l.last_interaction_at < cutoff
      );
    }

    return [];
  }
}

describe('Política de Retenção e Descarte de Dados — Áquila Pro v1.0', () => {
  let db: StatefulMockDb;
  let auditService: ZeroBypassAuditService;
  let retentionService: DataRetentionService;
  const SCHOOL_ID = 'ESC-HOMOLOG-001';

  beforeEach(async () => {
    db = new StatefulMockDb();

    auditService = new ZeroBypassAuditService(db);
    await auditService.initialize();

    retentionService = new DataRetentionService(db, auditService);
    await retentionService.initialize();
  });

  test('1. Deve cadastrar todas as 20 categorias padrão com proibição de retenção indefinida', async () => {
    await retentionService.seedDefaultPoliciesForSchool(SCHOOL_ID);
    const policies = await retentionService.getPolicies(SCHOOL_ID);

    expect(policies.length).toBe(20);
    const categoriesInDb = policies.map((p: any) => p.category);

    const expectedCategories = Object.keys(DEFAULT_RETENTION_POLICIES);
    for (const cat of expectedCategories) {
      expect(categoriesInDb).toContain(cat);
    }

    // Todos devem proibir retenção indefinida
    policies.forEach((p: any) => {
      expect(p.allow_indefinite).toBe(0);
      expect(p.retention_period_days).toBeGreaterThan(0);
    });
  });

  test('2. Tentativa de configurar retenção indefinida (dias <= 0) deve ser terminantemente rejeitada', async () => {
    await expect(
      retentionService.setPolicy(SCHOOL_ID, 'BIOMETRIC_EMBEDDINGS', 0, 'SECURE_DELETE', 'Segurança')
    ).rejects.toThrow(IndefiniteRetentionForbiddenError);

    await expect(
      retentionService.setPolicy(SCHOOL_ID, 'STUDENT_CADASTRE', -10, 'ANONYMIZE', 'DPO')
    ).rejects.toThrow(IndefiniteRetentionForbiddenError);
  });

  test('3. Bloqueio fail-safe: dados em QUARENTENA_JURIDICA não podem ser exportados nem excluídos', async () => {
    await retentionService.seedDefaultPoliciesForSchool(SCHOOL_ID);

    await retentionService.registerItem({
      schoolId: SCHOOL_ID,
      category: 'INDIVIDUAL_RESPONSES',
      entityType: 'exam_response',
      entityId: 'RESP-999-LITIGIO'
    });

    // Colocar em Quarentena Jurídica
    await retentionService.applyQuarantine(
      SCHOOL_ID,
      'exam_response',
      'RESP-999-LITIGIO',
      'Ação civil pública / perícia grafotécnica',
      'dpo@escola.br'
    );

    // Tentativa de exportação deve lançar erro bloqueante
    await expect(
      retentionService.assertExportAllowed(SCHOOL_ID, 'exam_response', 'RESP-999-LITIGIO')
    ).rejects.toThrow(QuarantineExportBlockedError);

    // Tentativa de exclusão deve ser bloqueada
    await expect(
      retentionService.secureDelete(SCHOOL_ID, 'exam_response', 'RESP-999-LITIGIO', 'Expurgo solicitado')
    ).rejects.toThrow(QuarantineExportBlockedError);

    // Após liberação pelo DPO, a exportação é autorizada
    await retentionService.liftQuarantine(SCHOOL_ID, 'exam_response', 'RESP-999-LITIGIO', 'dpo@escola.br');
    const allowed = await retentionService.assertExportAllowed(SCHOOL_ID, 'exam_response', 'RESP-999-LITIGIO');
    expect(allowed).toBe(true);
  });

  test('4. Exclusão segura em 3 camadas: atualiza status para EXCLUIDO, purga criptograficamente e grava tombstone', async () => {
    await retentionService.seedDefaultPoliciesForSchool(SCHOOL_ID);

    await retentionService.registerItem({
      schoolId: SCHOOL_ID,
      category: 'CCTV_FOOTAGE',
      entityType: 'cctv_file',
      entityId: 'VIDEO-CORREDOR-01',
      contentHash: 'E3B0C44298FC1C149AFBF4C8996FB92427AE41E4649B934CA495991B7852B855'
    });

    await retentionService.secureDelete(
      SCHOOL_ID,
      'cctv_file',
      'VIDEO-CORREDOR-01',
      'Prazo regulamentar de 30 dias expirado',
      'cctv_worker',
      'seguranca@escola.br'
    );

    const item = await db.get(
      'SELECT status, crypto_purged FROM retention_items WHERE entity_id = ?',
      ['VIDEO-CORREDOR-01']
    );
    expect(item.status).toBe('EXCLUIDO');
    expect(item.crypto_purged).toBe(1);

    const tombstone = await db.get(
      'SELECT * FROM retention_tombstones WHERE entity_id = ?',
      ['VIDEO-CORREDOR-01']
    );
    expect(tombstone).toBeDefined();
    expect(tombstone.entity_type).toBe('cctv_file');
    expect(tombstone.reason).toContain('30 dias');
    expect(tombstone.audit_hash).toBeDefined();
  });

  test('5. Biometria facial: deve ser purgada imediatamente em até 24h após desligamento/revogação', async () => {
    const studentId = 'ALUNO-BIOM-01';

    // Inserir vetores nas tabelas de reconhecimento facial
    db.faceEmbeddings.push({ face_id: 'f1', student_id: studentId, embedding: '[0.12, 0.45, -0.89]' });
    db.studentFaceEmbeddings512.push({ id: 'emb1', studentId, vector: '[0.55, -0.33, 0.77]' });

    const result = await retentionService.purgeBiometricsForStudent(
      studentId,
      SCHOOL_ID,
      'Desligamento de matrícula e revogação de consentimento',
      'dpo@escola.br'
    );

    expect(result.faceVectorsDeleted).toBe(1);
    expect(result.arcFaceVectorsDeleted).toBe(1);

    // Verificar que as tabelas de biometria estão zeradas para este aluno
    const count1 = await db.get('SELECT count(*) as count FROM face_embeddings WHERE student_id = ?', [studentId]);
    const count2 = await db.get('SELECT count(*) as count FROM student_face_embeddings_512 WHERE studentId = ?', [studentId]);
    expect(count1.count).toBe(0);
    expect(count2.count).toBe(0);

    // Verificar tombstone gerado
    const tombstone = await db.get(
      'SELECT * FROM retention_tombstones WHERE entity_id = ?',
      [studentId]
    );
    expect(tombstone).toBeDefined();
    expect(tombstone.entity_type).toBe('student_biometrics');
  });

  test('6. Imagens OMR: expurga fotos após 90 dias mantendo notas e respostas intactas', async () => {
    const oldDate = new Date(Date.now() - 95 * 86400 * 1000).toISOString(); // 95 dias atrás

    db.omrCorrections.set('OMR-EXAM-001', {
      id: 'OMR-EXAM-001',
      studentId: 'ALUNO-01',
      detectedAnswers: JSON.stringify({ 1: 'A', 2: 'B', 3: 'C' }),
      score: 10.0,
      totalPoints: 10.0,
      accuracyPct: 100.0,
      confidence: 0.98,
      scanImagePath: '/tmp/scans/card_001.png',
      processedAt: oldDate
    });

    const purged = await retentionService.purgeExpiredOmrImages(SCHOOL_ID, 90);
    expect(purged).toBe(1);

    const record = await db.get('SELECT * FROM omr_exam_corrections WHERE id = ?', ['OMR-EXAM-001']);
    // Imagem expurgada
    expect(record.scanImagePath).toBe('[PURGED_EXPIRED]');
    // Dados pedagógicos preservados
    expect(record.score).toBe(10.0);
    expect(record.accuracyPct).toBe(100.0);
    expect(record.detectedAnswers).toContain('A');
  });

  test('7. Leads de captação inativos por 24 meses (730 dias) devem ser anonimizados', async () => {
    const oldLeadDate = new Date(Date.now() - 750 * 86400 * 1000).toISOString(); // 750 dias

    db.growthLeads.set('LEAD-OLD-01', {
      id: 'LEAD-OLD-01',
      school_id: SCHOOL_ID,
      name: 'Lead Interesses Antigos',
      email: 'lead@antigo.com',
      phone: '11999998888',
      status: 'OPEN',
      last_interaction_at: oldLeadDate
    });

    const count = await retentionService.purgeUnconvertedLeads(SCHOOL_ID, 730);
    expect(count).toBe(1);

    const lead = await db.get('SELECT * FROM growth_leads WHERE id = ?', ['LEAD-OLD-01']);
    expect(lead.status).toBe('ANONIMIZADO');
    expect(lead.email).toBe('[ANONIMIZADO]');
    expect(lead.phone).toBe('[ANONIMIZADO]');
    expect(lead.name).toContain('LEAD_ANON_');
  });

  test('8. Regra de k-Anonimato: turmas com menos de 10 alunos bloqueiam anonimização individual dedutiva', async () => {
    db.students.set('ALUNO-TURMA-PEQUENA', {
      id: 'ALUNO-TURMA-PEQUENA',
      name: 'Mariana Silva',
      cpf: '12345678900'
    });

    // Turma com 6 alunos (menos que o limiar de 10)
    await expect(
      retentionService.anonymizeStudent('ALUNO-TURMA-PEQUENA', SCHOOL_ID, 6, 'dpo@escola.br')
    ).rejects.toThrow(SmallClassDeidentificationError);

    // Turma com 15 alunos (permite anonimização segura)
    const pseudo = await retentionService.anonymizeStudent('ALUNO-TURMA-PEQUENA', SCHOOL_ID, 15, 'dpo@escola.br');
    expect(pseudo).toContain('ANON_');

    const updated = await db.get('SELECT * FROM students WHERE id = ?', ['ALUNO-TURMA-PEQUENA']);
    expect(updated.name).toBe(pseudo);
    expect(updated.cpf).toBe('[ANONIMIZADO]');
  });

  test('9. Garantia Anti-Reintrodução: Restauração de backup não pode reintegrar registros excluídos', async () => {
    // 1. Cadastrar e deletar um registro com tombstone
    await retentionService.registerItem({
      schoolId: SCHOOL_ID,
      category: 'STUDENT_CADASTRE',
      entityType: 'student',
      entityId: 'ALUNO-EXCLUIDO-DIREITO-ESQUECIMENTO'
    });

    await retentionService.secureDelete(
      SCHOOL_ID,
      'student',
      'ALUNO-EXCLUIDO-DIREITO-ESQUECIMENTO',
      'Exercício de direito de exclusão pelo responsável legal'
    );

    // 2. Simular uma tentativa de restauração de backup com esse registro e outros válidos
    const incomingBackupRecords = [
      { entityType: 'student', entityId: 'ALUNO-LEGITIMO-01' },
      { entityType: 'student', entityId: 'ALUNO-EXCLUIDO-DIREITO-ESQUECIMENTO' },
      { entityType: 'student', entityId: 'ALUNO-LEGITIMO-02' }
    ];

    const verification = await retentionService.verifyRestoreAntiReintroduction(SCHOOL_ID, incomingBackupRecords);

    // 2 registros legítimos autorizados
    expect(verification.approvedRecords.length).toBe(2);
    expect(verification.approvedRecords.map(r => r.entityId)).toEqual(['ALUNO-LEGITIMO-01', 'ALUNO-LEGITIMO-02']);

    // O registro em tombstone deve ser categoricamente rejeitado
    expect(verification.rejectedTombstones.length).toBe(1);
    expect(verification.rejectedTombstones[0].entityId).toBe('ALUNO-EXCLUIDO-DIREITO-ESQUECIMENTO');
    expect(verification.rejectedTombstones[0].reason).toContain('direito de exclusão');
  });

  test('10. Cockpit DPO: deve emitir relatório de conformidade e atender solicitações LGPD Art. 18', async () => {
    await retentionService.seedDefaultPoliciesForSchool(SCHOOL_ID);

    const report = await retentionService.generateDPOComplianceReport(SCHOOL_ID);
    expect(report.schoolId).toBe(SCHOOL_ID);
    expect(report.policiesConfigured).toBe(20);
    expect(report.complianceVerdict).toBe('CONFORME');

    // Atendimento ao Direito do Titular (LGPD Art. 18)
    const sar = await retentionService.handleTitularRight({
      schoolId: SCHOOL_ID,
      titularType: 'student',
      titularId: 'ALUNO-SAR-01',
      requestType: 'PORTABILITY',
      requestedBy: 'responsavel@familia.com'
    });

    expect(sar.protocol).toContain('SAR-');
    expect(sar.deadlineDays).toBe(15); // Portabilidade = 15 dias
    expect(sar.status).toBe('PROCESSED');
  });
});
