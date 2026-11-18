import { createHmac } from 'node:crypto';
import { NextRequest } from 'next/server';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  attendance,
  auditLogs,
  biometricConsentLogs,
  biometricPurgeLogs,
  classes,
  edgeCredentials,
  edgeSyncCommands,
  edgeSyncEvents,
  getWebDb,
  grades,
  institutions,
  lessonDiaries,
  occurrences,
  resetWebDbCacheForTests,
  seedAcademicFixtures,
  students,
} from '@aquila/db';
import { appRouter, computeSha256 } from '@aquila/api';
import { resetRateLimitBuckets } from '@/lib/rateLimit';
import { eq } from 'drizzle-orm';
import { EDGE_CONTRACT_VERSION, GET, POST } from './route';

const TEST_SYNC_SECRET = 'test-edge-sync-secret-min-32-bytes-ok';

function signEdgeBody(body: string, secret = TEST_SYNC_SECRET): string {
  return createHmac('sha256', secret).update(body).digest('hex');
}

describe('GET & POST /api/sync/edge', () => {
  beforeEach(async () => {
    resetRateLimitBuckets();
    process.env.AQUILA_WEB_DB_PATH = ':memory:';
    process.env.AQUILA_EDGE_SYNC_SECRET = TEST_SYNC_SECRET;
    delete process.env.AQUILA_EDGE_API_KEY;
    delete process.env.AQUILA_EDGE_CREDENTIALS_JSON;
    resetWebDbCacheForTests();
    const db = await getWebDb();
    await seedAcademicFixtures(db);
  });

  afterEach(() => {
    delete process.env.AQUILA_EDGE_SYNC_SECRET;
    delete process.env.AQUILA_EDGE_API_KEY;
    delete process.env.AQUILA_EDGE_CREDENTIALS_JSON;
    resetWebDbCacheForTests();
  });

  it('returns 503 when AQUILA_EDGE_SYNC_SECRET and key credentials are missing', async () => {
    delete process.env.AQUILA_EDGE_SYNC_SECRET;
    const req = new NextRequest('http://localhost/api/sync/edge', {
      method: 'POST',
      body: JSON.stringify({
        contractVersion: EDGE_CONTRACT_VERSION,
        eventId: 'evt_1',
        schoolCloudId: 'edge_1',
        eventType: 'HEARTBEAT',
        data: {},
      }),
    });
    const res = await POST(req);
    expect(res.status).toBe(503);
  });

  it('rejects invalid HMAC signatures with 401', async () => {
    const body = JSON.stringify({
      contractVersion: EDGE_CONTRACT_VERSION,
      eventId: 'evt_bad_sig',
      schoolCloudId: 'edge_1',
      eventType: 'HEARTBEAT',
      data: {},
    });
    const req = new NextRequest('http://localhost/api/sync/edge', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-aquila-hmac-sha256': '0000deadbeef',
        'x-aquila-cloud-id': 'edge_1',
      },
      body,
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('rejects missing or unsupported contractVersion with 400', async () => {
    const body = JSON.stringify({
      eventId: 'evt_no_contract',
      schoolCloudId: 'edge_1',
      eventType: 'HEARTBEAT',
      data: {},
    });
    const req = new NextRequest('http://localhost/api/sync/edge', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-aquila-hmac-sha256': signEdgeBody(body),
      },
      body,
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('rejects institution or schoolCloudId spoofing with 403', async () => {
    const body = JSON.stringify({
      contractVersion: EDGE_CONTRACT_VERSION,
      eventId: 'evt_spoof_inst',
      schoolCloudId: 'edge_1',
      institutionId: 'inst_outra_escola',
      eventType: 'HEARTBEAT',
      data: {},
    });
    const req = new NextRequest('http://localhost/api/sync/edge', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-aquila-hmac-sha256': signEdgeBody(body),
      },
      body,
    });
    const res = await POST(req);
    expect(res.status).toBe(403);
    expect((await res.json()).error).toBe('INSTITUTION_SPOOFING_REJECTED');
  });

  it('supports credential rotation and rejects revoked credentials in DB', async () => {
    const graceSecret = 'grace-rotation-secret-min-32-chars!!';
    process.env.AQUILA_EDGE_CREDENTIALS_JSON = JSON.stringify([
      {
        keyId: 'key_rot_01',
        deviceId: 'dev_portaria_01',
        institutionId: 'inst_aquila_demo',
        schoolCloudId: 'edge_demo',
        secret: graceSecret,
        status: 'grace_rotation',
      },
    ]);

    const body = JSON.stringify({
      contractVersion: EDGE_CONTRACT_VERSION,
      eventId: 'evt_grace_ok',
      schoolCloudId: 'edge_demo',
      eventType: 'HEARTBEAT',
      data: { uptimeSeconds: 120 },
    });
    const okRes = await POST(
      new NextRequest('http://localhost/api/sync/edge', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-aquila-key-id': 'key_rot_01',
          'x-aquila-hmac-sha256': signEdgeBody(body, graceSecret),
        },
        body,
      })
    );
    expect(okRes.status).toBe(202);
    expect(okRes.headers.get('x-aquila-rotation-warning')).toBe('credential_in_grace_window');

    const db = await getWebDb();
    await db.insert(edgeCredentials).values({
      id: 'ecred_rev_01',
      keyId: 'key_rot_01',
      deviceId: 'dev_portaria_01',
      institutionId: 'inst_aquila_demo',
      schoolCloudId: 'edge_demo',
      secretHashSha256: computeSha256(graceSecret),
      status: 'revoked',
      createdAt: new Date(),
      revokedAt: new Date(),
    });

    const revRes = await POST(
      new NextRequest('http://localhost/api/sync/edge', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-aquila-key-id': 'key_rot_01',
          'x-aquila-hmac-sha256': signEdgeBody(body, graceSecret),
        },
        body,
      })
    );
    expect(revRes.status).toBe(401);
    expect((await revRes.json()).code).toBe('EDGE_CREDENTIAL_REVOKED');
  });

  it('blocks nested LGPD sensitive fields, attachments, logs and base64 images with 422', async () => {
    const body = JSON.stringify({
      contractVersion: EDGE_CONTRACT_VERSION,
      eventId: 'evt_lgpd_violation',
      schoolCloudId: 'edge_1',
      eventType: 'ATTENDANCE_QR',
      data: {
        id: 'att_blocked_01',
        studentId: 'std_001',
        classId: 'cls_2b',
        date: '2026-11-12',
        status: 'present',
        detectedBy: 'qr_badge',
        nested: {
          faceEncoding: [0.1, 0.2, 0.3],
          debugLogs: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUg==',
        },
      },
    });
    const req = new NextRequest('http://localhost/api/sync/edge', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-aquila-hmac-sha256': signEdgeBody(body),
        'x-aquila-cloud-id': 'edge_1',
      },
      body,
    });

    const res = await POST(req);
    expect(res.status).toBe(422);
    const json = (await res.json()) as { error: string; blockedFields: string[] };
    expect(json.error).toBe('LGPD_EDGE_BOUNDARY_VIOLATION');
    expect(json.blockedFields).toContain('nested.faceEncoding');
    expect(json.blockedFields).toContain('nested.debugLogs');

    const db = await getWebDb();
    const attRows = await db.select().from(attendance).where(eq(attendance.id, 'att_blocked_01'));
    expect(attRows).toHaveLength(0);

    const rejected = await db
      .select()
      .from(edgeSyncEvents)
      .where(eq(edgeSyncEvents.status, 'rejected_lgpd'));
    expect(rejected.length).toBeGreaterThanOrEqual(1);

    const audits = await db
      .select()
      .from(auditLogs)
      .where(eq(auditLogs.action, 'EDGE_SYNC_LGPD_BLOCKED'));
    expect(audits).toHaveLength(1);
  });

  it('blocks free-text base64 media payloads even inside allowed fields', async () => {
    const body = JSON.stringify({
      contractVersion: EDGE_CONTRACT_VERSION,
      eventId: 'evt_freetext_blob',
      schoolCloudId: 'edge_1',
      eventType: 'AUDIT_LOG',
      data: {
        action: 'TEST',
        entity: 'student',
        summary: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/',
      },
    });
    const res = await POST(
      new NextRequest('http://localhost/api/sync/edge', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-aquila-hmac-sha256': signEdgeBody(body),
        },
        body,
      })
    );
    expect(res.status).toBe(422);
    const json = await res.json();
    expect(json.blockedFields).toContain('summary[content_policy]');
  });

  it('rejects unlisted properties under positive allowlist (.strict()) with 400', async () => {
    const body = JSON.stringify({
      contractVersion: EDGE_CONTRACT_VERSION,
      eventId: 'evt_strict_extra',
      schoolCloudId: 'edge_1',
      eventType: 'ATTENDANCE_QR',
      data: {
        studentId: 'std_001',
        classId: 'cls_2b',
        date: '2026-11-12',
        status: 'present',
        detectedBy: 'qr_badge',
        undocumentedNote: 'campo fora do contrato',
      },
    });
    const res = await POST(
      new NextRequest('http://localhost/api/sync/edge', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-aquila-hmac-sha256': signEdgeBody(body),
        },
        body,
      })
    );
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe('EDGE_STRICT_SCHEMA_REJECTED');
  });

  it('accepts valid ATTENDANCE_QR, handles idempotent replay and rejects stale sequenceNumber with 409', async () => {
    const body1 = JSON.stringify({
      contractVersion: EDGE_CONTRACT_VERSION,
      eventId: 'evt_qr_001',
      schoolCloudId: 'edge_1',
      sequenceNumber: 10,
      eventType: 'ATTENDANCE_QR',
      data: {
        id: 'att_qr_sync_01',
        studentId: 'std_001',
        classId: 'cls_2b',
        date: '2026-11-12',
        status: 'present',
        detectedBy: 'qr_badge',
      },
    });

    const res1 = await POST(
      new NextRequest('http://localhost/api/sync/edge', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-aquila-hmac-sha256': signEdgeBody(body1),
          'x-aquila-cloud-id': 'edge_1',
        },
        body: body1,
      })
    );
    expect(res1.status).toBe(202);
    const json1 = (await res1.json()) as { status: string; digestSha256: string };
    expect(json1.status).toBe('accepted');
    expect(json1.digestSha256).toMatch(/^[a-f0-9]{64}$/);

    const res2 = await POST(
      new NextRequest('http://localhost/api/sync/edge', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-aquila-hmac-sha256': signEdgeBody(body1),
          'x-aquila-cloud-id': 'edge_1',
        },
        body: body1,
      })
    );
    expect(res2.status).toBe(200);
    expect(await res2.json()).toMatchObject({ status: 'already_processed', eventId: 'evt_qr_001' });

    const staleBody = JSON.stringify({
      contractVersion: EDGE_CONTRACT_VERSION,
      eventId: 'evt_qr_stale_seq',
      schoolCloudId: 'edge_1',
      sequenceNumber: 9,
      eventType: 'ATTENDANCE_QR',
      data: {
        id: 'att_qr_sync_02',
        studentId: 'std_001',
        classId: 'cls_2b',
        date: '2026-11-12',
        status: 'late',
        detectedBy: 'qr_badge',
      },
    });
    const staleRes = await POST(
      new NextRequest('http://localhost/api/sync/edge', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-aquila-hmac-sha256': signEdgeBody(staleBody),
        },
        body: staleBody,
      })
    );
    expect(staleRes.status).toBe(409);
    expect((await staleRes.json()).error).toBe('STALE_SEQUENCE_CONFLICT');
  });

  it('returns 207 Multi-Status on batch partial failures with per-event outcomes', async () => {
    const body = JSON.stringify({
      contractVersion: EDGE_CONTRACT_VERSION,
      batchId: 'batch_001',
      schoolCloudId: 'edge_1',
      events: [
        {
          contractVersion: EDGE_CONTRACT_VERSION,
          eventId: 'evt_batch_ok',
          schoolCloudId: 'edge_1',
          eventType: 'HEARTBEAT',
          data: { queueDepth: 0 },
        },
        {
          contractVersion: EDGE_CONTRACT_VERSION,
          eventId: 'evt_batch_bad',
          schoolCloudId: 'edge_1',
          eventType: 'AUDIT_LOG',
          data: { action: 'X', entity: 'Y', summary: 'ok', rawVideo: 'forbidden' },
        },
      ],
    });
    const res = await POST(
      new NextRequest('http://localhost/api/sync/edge', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-aquila-hmac-sha256': signEdgeBody(body),
        },
        body,
      })
    );
    expect(res.status).toBe(207);
    const json = await res.json();
    expect(json.summary).toEqual({ total: 2, accepted: 1, alreadyProcessed: 0, rejected: 1 });
    expect(json.results[0]).toMatchObject({ eventId: 'evt_batch_ok', status: 'accepted' });
    expect(json.results[1]).toMatchObject({ eventId: 'evt_batch_bad', status: 'rejected_boundary' });
  });

  it('polls pending commands via GET scoped to credential institution and processes COMMAND_ACK', async () => {
    const db = await getWebDb();
    await db
      .insert(institutions)
      .values({ id: 'inst_other', name: 'Outra Escola', cnpj: '99.999.999/0001-99', city: 'RJ', plan: 'pro', createdAt: new Date() })
      .onConflictDoNothing();

    await db.insert(biometricConsentLogs).values({
      id: 'cns_test_01',
      studentId: 'std_001',
      institutionId: 'inst_aquila_demo',
      guardianCpf: '12345678900',
      guardianName: 'Patrícia Andrade',
      consentVersion: 'termo-lgpd-v2.3',
      purpose: 'revocation_parent_portal',
      manifestationType: 'REVOCATION',
      propagationStatus: 'pending_at_edge',
      status: 'revoked',
      grantedAt: new Date(),
      revokedAt: new Date(),
      auditSignatureSha256: 'abc123',
    });

    await db.insert(edgeSyncCommands).values([
      {
        id: 'ecmd_1',
        commandId: 'cmd_consent_01',
        institutionId: 'inst_aquila_demo',
        schoolCloudId: 'edge_1',
        targetDomain: 'consent',
        action: 'BIOMETRIC_CONSENT_REVOKED',
        payloadJson: JSON.stringify({ studentId: 'std_001', granted: false }),
        status: 'pending_at_edge',
        conflictPolicy: 'lgpd_revocation_priority',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'ecmd_other',
        commandId: 'cmd_other_inst',
        institutionId: 'inst_other',
        schoolCloudId: 'edge_other',
        targetDomain: 'consent',
        action: 'BIOMETRIC_CONSENT_REVOKED',
        payloadJson: JSON.stringify({ studentId: 'std_999' }),
        status: 'pending_at_edge',
        conflictPolicy: 'lgpd_revocation_priority',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    const ts = '1794430000';
    const getRes = await GET(
      new NextRequest('http://localhost/api/sync/edge', {
        method: 'GET',
        headers: {
          'x-aquila-timestamp': ts,
          'x-aquila-hmac-sha256': signEdgeBody(`GET:/api/sync/edge:${ts}`),
        },
      })
    );
    expect(getRes.status).toBe(200);
    const getJson = await getRes.json();
    expect(getJson.commands).toHaveLength(1);
    expect(getJson.commands[0].commandId).toBe('cmd_consent_01');

    const ackBody = JSON.stringify({
      contractVersion: EDGE_CONTRACT_VERSION,
      eventId: 'evt_ack_01',
      schoolCloudId: 'edge_1',
      eventType: 'COMMAND_ACK',
      data: {
        commandId: 'cmd_consent_01',
        outcome: 'applied_by_edge',
        consentLogId: 'cns_test_01',
      },
    });
    const ackRes = await POST(
      new NextRequest('http://localhost/api/sync/edge', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-aquila-hmac-sha256': signEdgeBody(ackBody),
        },
        body: ackBody,
      })
    );
    expect(ackRes.status).toBe(202);

    const [updatedCmd] = await db
      .select()
      .from(edgeSyncCommands)
      .where(eq(edgeSyncCommands.commandId, 'cmd_consent_01'));
    expect(updatedCmd.status).toBe('applied_by_edge');

    const [updatedConsent] = await db
      .select()
      .from(biometricConsentLogs)
      .where(eq(biometricConsentLogs.id, 'cns_test_01'));
    expect(updatedConsent.propagationStatus).toBe('applied_by_edge');
  });

  it('propaga consentimento/revogação via payloadJson fallback, atualiza failed em rejected_by_edge, e sincroniza diários/ocorrências/notas', async () => {
    const db = await getWebDb();
    const parentCaller = appRouter.createCaller({
      db,
      user: { id: 'usr_parent_01', username: 'pais.patricia', role: 'parent', institutionId: 'inst_aquila_demo' },
    });
    const teacherCaller = appRouter.createCaller({
      db,
      user: { id: 'usr_teacher_01', username: 'prof.ricardo', role: 'teacher', institutionId: 'inst_aquila_demo' },
    });

    const revoked = await parentCaller.parent.setBiometricConsent({
      studentId: 'std_001',
      decision: 'revoke',
    });
    const diaryRes = await teacherCaller.teacher.saveLessonDiary({
      classId: 'cls_2b',
      date: '2026-11-12',
      subject: 'Física Aplicada',
      topic: 'Ondulatória',
      content: 'Equação fundamental da ondulatória.',
      bnccCodes: ['EM13CNT301'],
      sign: true,
    });
    const batchRes = await teacherCaller.teacher.saveGradesBatch({
      classId: 'cls_2b',
      subject: 'Física Aplicada',
      period: '4bim',
      entries: [{ studentId: 'std_001', score: 9.2 }],
    });
    const occRes = await parentCaller.parent.signOccurrence({
      occurrenceId: 'occ_001',
      manifestationType: 'DISAGREEMENT_CONTESTATION',
      contestationReason: 'Atividade entregue impressa em sala de aula.',
    });

    const ts = '1794430010';
    const getRes = await GET(
      new NextRequest('http://localhost/api/sync/edge', {
        method: 'GET',
        headers: {
          'x-aquila-timestamp': ts,
          'x-aquila-hmac-sha256': signEdgeBody(`GET:/api/sync/edge:${ts}`),
        },
      })
    );
    expect(getRes.status).toBe(200);
    const getJson = (await getRes.json()) as {
      commands: Array<{ commandId: string; payload: Record<string, unknown> }>;
    };
    const revokeCmd = getJson.commands.find((c) => c.commandId === revoked.edgeCommandId);
    expect(revokeCmd?.payload.consentLogId).toBe(revoked.consentLogId);

    // Send batch ACK: revocation + diary + occurrence applied_by_edge, grades batch rejected_by_edge -> failed!
    const ackBatchBody = JSON.stringify({
      contractVersion: EDGE_CONTRACT_VERSION,
      batchId: 'batch_ack_slice3',
      schoolCloudId: 'edge_1',
      events: [
        {
          contractVersion: EDGE_CONTRACT_VERSION,
          eventId: 'evt_ack_rev',
          schoolCloudId: 'edge_1',
          eventType: 'COMMAND_ACK',
          data: { commandId: revoked.edgeCommandId, outcome: 'applied_by_edge' },
        },
        {
          contractVersion: EDGE_CONTRACT_VERSION,
          eventId: 'evt_ack_dry',
          schoolCloudId: 'edge_1',
          eventType: 'COMMAND_ACK',
          data: { commandId: diaryRes.commandId, outcome: 'applied_by_edge' },
        },
        {
          contractVersion: EDGE_CONTRACT_VERSION,
          eventId: 'evt_ack_occ',
          schoolCloudId: 'edge_1',
          eventType: 'COMMAND_ACK',
          data: { commandId: occRes.edgeCommandId, outcome: 'applied_by_edge' },
        },
        {
          contractVersion: EDGE_CONTRACT_VERSION,
          eventId: 'evt_ack_grd_fail',
          schoolCloudId: 'edge_1',
          eventType: 'COMMAND_ACK',
          data: {
            commandId: batchRes.commandId,
            outcome: 'rejected_by_edge',
            conflictNote: 'Falha transitória no banco local',
          },
        },
      ],
    });
    const ackRes = await POST(
      new NextRequest('http://localhost/api/sync/edge', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-aquila-hmac-sha256': signEdgeBody(ackBatchBody),
        },
        body: ackBatchBody,
      })
    );
    expect(ackRes.status).toBe(202);

    const [consentAfter] = await db
      .select()
      .from(biometricConsentLogs)
      .where(eq(biometricConsentLogs.id, revoked.consentLogId));
    expect(consentAfter.propagationStatus).toBe('applied_by_edge');

    const [purgeAfter] = await db
      .select()
      .from(biometricPurgeLogs)
      .where(eq(biometricPurgeLogs.edgeCommandId, revoked.edgeCommandId));
    expect(purgeAfter.status).toBe('applied_by_edge');

    const [diaryAfter] = await db.select().from(lessonDiaries).where(eq(lessonDiaries.id, diaryRes.id));
    expect(diaryAfter.propagationStatus).toBe('applied_by_edge');

    const [occAfter] = await db.select().from(occurrences).where(eq(occurrences.id, 'occ_001'));
    expect(occAfter.propagationStatus).toBe('applied_by_edge');

    const [gradeAfter] = await db.select().from(grades).where(eq(grades.id, batchRes.gradeIds[0]));
    expect(gradeAfter.propagationStatus).toBe('failed');
  });

  it('rejeita campos proibidos aninhados (photo/emotionScore/rawEssayText), atualiza PUBLISHED_GRADE_UPSERT e bloqueia IDOR cross-tenant', async () => {
    const db = await getWebDb();

    const forbiddenBody = JSON.stringify({
      contractVersion: EDGE_CONTRACT_VERSION,
      eventId: 'evt_forbidden_nested',
      schoolCloudId: 'edge_1',
      eventType: 'AUDIT_LOG',
      data: {
        action: 'CLASSROOM_SCAN',
        entity: 'students',
        summary: 'Tentativa indevida',
        nestedTelemetry: {
          metrics: [{ attentionScore: 0.77, emotionScore: 0.4 }],
          essay: { rawEssayText: 'Texto completo da redação do menor' },
          photo: 'avatar.jpg',
        },
      },
    });
    const forbiddenRes = await POST(
      new NextRequest('http://localhost/api/sync/edge', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-aquila-hmac-sha256': signEdgeBody(forbiddenBody),
        },
        body: forbiddenBody,
      })
    );
    expect(forbiddenRes.status).toBe(422);
    const forbiddenJson = (await forbiddenRes.json()) as { blockedFields: string[] };
    expect(forbiddenJson.blockedFields).toEqual(
      expect.arrayContaining([
        'nestedTelemetry.metrics[0].attentionScore',
        'nestedTelemetry.metrics[0].emotionScore',
        'nestedTelemetry.essay.rawEssayText',
        'nestedTelemetry.photo',
      ])
    );

    // PUBLISHED_GRADE_UPSERT uses onConflictDoUpdate cleanly
    const gradeUpsertBody = JSON.stringify({
      contractVersion: EDGE_CONTRACT_VERSION,
      eventId: 'evt_grade_upsert_01',
      schoolCloudId: 'edge_1',
      eventType: 'PUBLISHED_GRADE_UPSERT',
      data: {
        id: 'grd_001',
        studentId: 'std_001',
        classId: 'cls_2b',
        teacherId: 'usr_teacher_01',
        subject: 'Matemática',
        evaluationType: 'prova',
        score: 9.8,
        maxScore: 10,
        period: '4bim',
        status: 'published',
      },
    });
    const gradeRes = await POST(
      new NextRequest('http://localhost/api/sync/edge', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-aquila-hmac-sha256': signEdgeBody(gradeUpsertBody),
        },
        body: gradeUpsertBody,
      })
    );
    expect(gradeRes.status).toBe(202);
    const [updatedGrade] = await db.select().from(grades).where(eq(grades.id, 'grd_001'));
    expect(updatedGrade.score).toBe(9.8);
    expect(updatedGrade.propagationStatus).toBe('applied_by_edge');

    // Cross-tenant grade ID overwrite protection
    await db.insert(institutions).values({
      id: 'inst_other',
      name: 'Colégio Externo',
      cnpj: '99.999.999/0001-99',
      plan: 'sovereign',
      createdAt: new Date(),
    });
    await db.insert(classes).values({
      id: 'cls_ext_01',
      institutionId: 'inst_other',
      name: '1ª Série X',
      grade: 10,
      shift: 'morning',
      year: 2026,
      teacherId: 'usr_teacher_01',
      maxStudents: 35,
    });
    await db.insert(students).values({
      id: 'std_ext_01',
      institutionId: 'inst_other',
      name: 'Aluno Externo',
      registrationNumber: 'EXT-001',
      classId: 'cls_ext_01',
      dateOfBirth: '2010-05-10',
      status: 'active',
      enrolledAt: new Date(),
    });
    await db.insert(grades).values({
      id: 'grd_ext_01',
      studentId: 'std_ext_01',
      classId: 'cls_ext_01',
      subject: 'História',
      evaluationType: 'prova',
      score: 6.0,
      maxScore: 10,
      period: '4bim',
      teacherId: 'usr_teacher_01',
      status: 'published',
      createdAt: new Date(),
    });

    const idorGradeBody = JSON.stringify({
      contractVersion: EDGE_CONTRACT_VERSION,
      eventId: 'evt_grade_idor',
      schoolCloudId: 'edge_1',
      eventType: 'PUBLISHED_GRADE_UPSERT',
      data: {
        id: 'grd_ext_01',
        studentId: 'std_001',
        classId: 'cls_2b',
        teacherId: 'usr_teacher_01',
        subject: 'História',
        evaluationType: 'prova',
        score: 10,
        maxScore: 10,
        period: '4bim',
        status: 'published',
      },
    });
    const idorRes = await POST(
      new NextRequest('http://localhost/api/sync/edge', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-aquila-hmac-sha256': signEdgeBody(idorGradeBody),
        },
        body: idorGradeBody,
      })
    );
    expect(idorRes.status).toBe(403);
    const [extGradeAfter] = await db.select().from(grades).where(eq(grades.id, 'grd_ext_01'));
    expect(extGradeAfter.score).toBe(6.0);
  });
});
