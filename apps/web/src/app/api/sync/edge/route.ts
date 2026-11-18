import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { and, asc, desc, eq, inArray, or } from 'drizzle-orm';
import { z } from 'zod';
import {
  attendance,
  biometricConsentLogs,
  biometricPurgeLogs,
  classes,
  DEMO_INSTITUTION_ID,
  edgeCredentials,
  edgeSyncCommands,
  edgeSyncEvents,
  grades,
  invoices,
  lessonDiaries,
  occurrences,
  students,
  type AquilaDatabase,
} from '@aquila/db';
import { computeSha256, recordAuditEvent } from '@aquila/api';
import { getInitializedWebDb } from '@/lib/authDb';
import { enforceApiRateLimit } from '@/lib/rateLimit';

export const EDGE_CONTRACT_VERSION = '2026-11-v1' as const;

const EDGE_BLOCKED_KEYS = new Set([
  'faceencoding',
  'face_encoding',
  'faceembeddinghash',
  'face_embedding_hash',
  'embedding',
  'rawvideo',
  'raw_video',
  'videoframe',
  'video_frame',
  'audiobuffer',
  'audio_buffer',
  'rawaudio',
  'raw_audio',
  'essayrawtext',
  'essay_raw_text',
  'biometrictemplate',
  'biometric_template',
  'biometricvector',
  'biometric_vector',
  'studentphoto',
  'student_photo',
  'photo',
  'foto',
  'photobase64',
  'photo_base64',
  'emotionscore',
  'emotion_score',
  'emotion',
  'emotions',
  'mood',
  'humor',
  'affectivescore',
  'affective_score',
  'attentionscore',
  'attention_score',
  'attentionlevel',
  'attention_level',
  'microexpression',
  'micro_expression',
  'aidetectorscore',
  'ai_detector_score',
  'socialscore',
  'social_score',
  'rawessaytext',
  'raw_essay_text',
  'cpffull',
  'cpf_full',
  'attachment',
  'attachments',
  'rawlog',
  'raw_log',
  'rawlogs',
  'raw_logs',
  'debuglogs',
  'debug_logs',
  'errordump',
  'error_dump',
  'stacktrace',
  'stack_trace',
  'stack',
  'stdout',
  'stderr',
  'cameraframe',
  'camera_frame',
]);

const BASE64_BLOB_REGEX = /(?:data:(?:image|audio|video|application\/octet-stream|application\/pdf)\/[^;\s]+;base64,|[A-Za-z0-9+/]{160,}={0,2})/i;
const STACK_OR_DUMP_REGEX = /(?:-----BEGIN [A-Z ]+-----|\n\s+at\s+\S+\s+\(|Traceback \(most recent call last\):)/;

const eventTypeEnum = z.enum([
  'HEARTBEAT',
  'ATTENDANCE_QR',
  'INVOICE_UPSERT',
  'PUBLISHED_GRADE_UPSERT',
  'COMMAND_ACK',
  'AUDIT_LOG',
]);

const singleEventSchema = z
  .object({
    contractVersion: z.literal(EDGE_CONTRACT_VERSION),
    eventId: z.string().min(4).max(120),
    schoolCloudId: z.string().min(2).max(120),
    institutionId: z.string().min(2).max(120).optional(),
    deviceId: z.string().min(2).max(120).optional(),
    sequenceNumber: z.number().int().nonnegative().optional(),
    eventType: eventTypeEnum,
    timestamp: z.string().optional(),
    data: z.record(z.string(), z.unknown()).default({}),
  })
  .strict();

const batchEnvelopeSchema = z
  .object({
    contractVersion: z.literal(EDGE_CONTRACT_VERSION),
    batchId: z.string().min(4).max(120).optional(),
    schoolCloudId: z.string().min(2).max(120),
    institutionId: z.string().min(2).max(120).optional(),
    deviceId: z.string().min(2).max(120).optional(),
    events: z.array(singleEventSchema).min(1).max(100),
  })
  .strict();

const heartbeatPayloadSchema = z
  .object({
    firmwareVersion: z.string().max(40).optional(),
    uptimeSeconds: z.number().nonnegative().optional(),
    queueDepth: z.number().int().nonnegative().optional(),
    cpuTempC: z.number().min(-20).max(120).optional(),
  })
  .strict();

const attendancePayloadSchema = z
  .object({
    id: z.string().min(2).max(80).optional(),
    studentId: z.string().min(1).max(80),
    classId: z.string().min(1).max(80),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    status: z.enum(['present', 'absent', 'late', 'justified']),
    detectedBy: z.enum(['qr_badge', 'manual', 'nfc']).default('qr_badge'),
  })
  .strict();

const invoicePayloadSchema = z
  .object({
    id: z.string().min(2).max(80),
    studentId: z.string().min(1).max(80),
    institutionId: z.string().min(1).max(80).optional(),
    description: z.string().min(3).max(200),
    amount: z.number().int().positive(),
    dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    status: z.enum(['pending', 'paid', 'overdue', 'cancelled']).default('pending'),
    pixPayload: z.string().max(512).optional(),
  })
  .strict();

const publishedGradePayloadSchema = z
  .object({
    id: z.string().min(2).max(80),
    studentId: z.string().min(1).max(80),
    classId: z.string().min(1).max(80),
    teacherId: z.string().min(1).max(80),
    subject: z.string().min(2).max(100),
    evaluationType: z.enum(['prova', 'trabalho', 'participacao']).default('prova'),
    score: z.number().min(0).max(100),
    maxScore: z.number().positive().max(100).default(10),
    period: z.enum(['1bim', '2bim', '3bim', '4bim']),
    status: z.literal('published'),
  })
  .strict();

const commandAckPayloadSchema = z
  .object({
    commandId: z.string().min(4).max(120),
    outcome: z.enum(['applied_by_edge', 'rejected_by_edge']),
    conflictNote: z.string().max(240).optional(),
    consentLogId: z.string().max(80).optional(),
    occurrenceId: z.string().max(80).optional(),
    diaryId: z.string().max(80).optional(),
    gradeId: z.string().max(80).optional(),
    gradeIds: z.array(z.string().max(80)).max(200).optional(),
    appliedAt: z.string().optional(),
  })
  .strict();

const auditLogPayloadSchema = z
  .object({
    action: z.string().min(2).max(80),
    entity: z.string().min(2).max(80),
    entityId: z.string().max(80).optional(),
    summary: z.string().min(2).max(240),
  })
  .strict();

const envCredentialEntrySchema = z.object({
  keyId: z.string().min(2).max(80),
  deviceId: z.string().min(2).max(80),
  institutionId: z.string().min(2).max(80),
  schoolCloudId: z.string().min(2).max(120),
  secret: z.string().min(16),
  status: z.enum(['active', 'grace_rotation', 'revoked']).default('active'),
  expiresAt: z.string().optional(),
});

interface AuthenticatedEdgeCredential {
  keyId: string;
  deviceId: string;
  institutionId: string;
  schoolCloudId: string;
  status: 'active' | 'grace_rotation';
}

function safeCompareHex(expectedHex: string, actualHeader: string): boolean {
  const cleanHeader = actualHeader.trim().replace(/^sha256=/i, '');
  if (!/^[a-f0-9]+$/i.test(cleanHeader)) return false;
  const a = Buffer.from(expectedHex.toLowerCase(), 'utf8');
  const b = Buffer.from(cleanHeader.toLowerCase(), 'utf8');
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

function safeCompareToken(expected: string, actual: string): boolean {
  const a = Buffer.from(expected, 'utf8');
  const b = Buffer.from(actual, 'utf8');
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

/**
 * Inspeciona recursivamente objetos aninhados e strings livres para garantir a política interna
 * do Áquila Pro de não enviar biometria, áudio/vídeo, anexos, redações integrais ou dumps/logs à nuvem.
 */
function collectBoundaryViolations(value: unknown, path = ''): string[] {
  if (value === null || value === undefined) return [];
  if (typeof value === 'string') {
    if (BASE64_BLOB_REGEX.test(value) || STACK_OR_DUMP_REGEX.test(value)) {
      return [path ? `${path}[content_policy]` : 'content_policy'];
    }
    return [];
  }
  if (typeof value !== 'object') return [];
  if (Array.isArray(value)) {
    return value.flatMap((item, index) => collectBoundaryViolations(item, `${path}[${index}]`));
  }

  const found: string[] = [];
  for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
    const normalized = key.toLowerCase();
    const fieldPath = path ? `${path}.${key}` : key;
    if (EDGE_BLOCKED_KEYS.has(normalized)) {
      found.push(fieldPath);
    }
    found.push(...collectBoundaryViolations(nested, fieldPath));
  }
  return found;
}

function loadEnvCredentials(): z.infer<typeof envCredentialEntrySchema>[] {
  const raw = process.env.AQUILA_EDGE_CREDENTIALS_JSON?.trim();
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((entry) => envCredentialEntrySchema.safeParse(entry))
      .filter((r): r is { success: true; data: z.infer<typeof envCredentialEntrySchema> } => r.success)
      .map((r) => r.data);
  } catch {
    return [];
  }
}

async function authenticateEdgeCredential(
  request: NextRequest,
  db: AquilaDatabase,
  signedMessage: string
): Promise<
  | { ok: true; credential: AuthenticatedEdgeCredential }
  | { ok: false; status: number; error: string; code: string }
> {
  const keyIdHeader = request.headers.get('x-aquila-key-id')?.trim();
  const signatureHeader = request.headers.get('x-aquila-hmac-sha256') ?? '';
  const apiKeyHeader = request.headers.get('x-aquila-api-key')?.trim() ?? '';

  if (keyIdHeader) {
    // Primeiro verifica override/estado no banco (permite revogação imediata)
    const dbCredRows = await db
      .select()
      .from(edgeCredentials)
      .where(eq(edgeCredentials.keyId, keyIdHeader))
      .limit(1);
    const dbCred = dbCredRows[0];
    if (dbCred) {
      if (dbCred.status === 'revoked') {
        return {
          ok: false,
          status: 401,
          code: 'EDGE_CREDENTIAL_REVOKED',
          error: 'Credencial do nó Edge revogada.',
        };
      }
      if (dbCred.expiresAt && dbCred.expiresAt.getTime() < Date.now()) {
        return {
          ok: false,
          status: 401,
          code: 'EDGE_CREDENTIAL_EXPIRED',
          error: 'Credencial do nó Edge expirada.',
        };
      }
    }

    const envCred = loadEnvCredentials().find((c) => c.keyId === keyIdHeader);
    if (envCred) {
      if (envCred.status === 'revoked') {
        return {
          ok: false,
          status: 401,
          code: 'EDGE_CREDENTIAL_REVOKED',
          error: 'Credencial do nó Edge revogada.',
        };
      }
      if (envCred.expiresAt && new Date(envCred.expiresAt).getTime() < Date.now()) {
        return {
          ok: false,
          status: 401,
          code: 'EDGE_CREDENTIAL_EXPIRED',
          error: 'Credencial do nó Edge expirada.',
        };
      }
      const expectedSig = createHmac('sha256', envCred.secret).update(signedMessage).digest('hex');
      const hmacValid = signatureHeader ? safeCompareHex(expectedSig, signatureHeader) : false;
      const bearerValid = apiKeyHeader ? safeCompareToken(envCred.secret, apiKeyHeader) : false;
      if (!hmacValid && !bearerValid) {
        return {
          ok: false,
          status: 401,
          code: 'EDGE_CREDENTIAL_INVALID',
          error: 'Credencial/assinatura do nó Edge inválida.',
        };
      }
      return {
        ok: true,
        credential: {
          keyId: envCred.keyId,
          deviceId: envCred.deviceId,
          institutionId: envCred.institutionId,
          schoolCloudId: envCred.schoolCloudId,
          status: envCred.status === 'grace_rotation' ? 'grace_rotation' : 'active',
        },
      };
    }

    if (dbCred) {
      if (!apiKeyHeader) {
        return {
          ok: false,
          status: 401,
          code: 'EDGE_CREDENTIAL_INVALID',
          error: 'Cabeçalho X-Aquila-Api-Key obrigatório para credencial gerenciada em banco.',
        };
      }
      const providedHash = computeSha256(apiKeyHeader);
      if (!safeCompareHex(dbCred.secretHashSha256, providedHash)) {
        return {
          ok: false,
          status: 401,
          code: 'EDGE_CREDENTIAL_INVALID',
          error: 'API Key do nó Edge inválida.',
        };
      }
      return {
        ok: true,
        credential: {
          keyId: dbCred.keyId,
          deviceId: dbCred.deviceId,
          institutionId: dbCred.institutionId,
          schoolCloudId: dbCred.schoolCloudId,
          status: dbCred.status === 'grace_rotation' ? 'grace_rotation' : 'active',
        },
      };
    }

    return {
      ok: false,
      status: 401,
      code: 'EDGE_CREDENTIAL_UNKNOWN',
      error: 'Credencial Edge não reconhecida.',
    };
  }

  // Modo single-secret legado vinculado obrigatoriamente a uma única instituição/escola configurada no ambiente
  const syncSecret = process.env.AQUILA_EDGE_SYNC_SECRET?.trim();
  if (!syncSecret || Buffer.byteLength(syncSecret, 'utf8') < 16) {
    return {
      ok: false,
      status: 503,
      code: 'EDGE_SYNC_UNCONFIGURED',
      error: 'Canal de sincronização Edge não configurado neste ambiente.',
    };
  }

  const configuredApiKey = process.env.AQUILA_EDGE_API_KEY?.trim();
  if (configuredApiKey && !safeCompareToken(configuredApiKey, apiKeyHeader)) {
    return {
      ok: false,
      status: 401,
      code: 'EDGE_API_KEY_INVALID',
      error: 'API Key do nó Edge inválida.',
    };
  }

  const expectedSignature = createHmac('sha256', syncSecret).update(signedMessage).digest('hex');
  if (!safeCompareHex(expectedSignature, signatureHeader)) {
    return {
      ok: false,
      status: 401,
      code: 'EDGE_HMAC_INVALID',
      error: 'Assinatura HMAC-SHA256 inválida.',
    };
  }

  return {
    ok: true,
    credential: {
      keyId: 'env_default',
      deviceId: process.env.AQUILA_EDGE_DEVICE_ID?.trim() || 'edge_device_default',
      institutionId: process.env.AQUILA_EDGE_INSTITUTION_ID?.trim() || DEMO_INSTITUTION_ID,
      schoolCloudId: process.env.AQUILA_EDGE_SCHOOL_CLOUD_ID?.trim() || 'edge_1',
      status: 'active',
    },
  };
}

function validateStrictPayload(eventType: z.infer<typeof eventTypeEnum>, data: unknown) {
  switch (eventType) {
    case 'HEARTBEAT':
      return heartbeatPayloadSchema.safeParse(data);
    case 'ATTENDANCE_QR':
      return attendancePayloadSchema.safeParse(data);
    case 'INVOICE_UPSERT':
      return invoicePayloadSchema.safeParse(data);
    case 'PUBLISHED_GRADE_UPSERT':
      return publishedGradePayloadSchema.safeParse(data);
    case 'COMMAND_ACK':
      return commandAckPayloadSchema.safeParse(data);
    case 'AUDIT_LOG':
      return auditLogPayloadSchema.safeParse(data);
  }
}

interface ProcessedEventOutcome {
  eventId: string;
  index: number;
  status:
    | 'accepted'
    | 'already_processed'
    | 'rejected_boundary'
    | 'rejected_schema'
    | 'rejected_conflict'
    | 'rejected_forbidden';
  httpStatus: number;
  code?: string;
  error?: string;
  blockedFields?: string[];
  digestSha256?: string;
  issues?: unknown;
}

async function verifyEntityBelongsToInstitution(
  db: AquilaDatabase,
  credentialInstitutionId: string,
  ids: { studentId?: string; classId?: string }
): Promise<string | null> {
  if (ids.studentId) {
    const s = await db
      .select({ institutionId: students.institutionId })
      .from(students)
      .where(eq(students.id, ids.studentId))
      .limit(1);
    if (s[0] && s[0].institutionId !== credentialInstitutionId) {
      return 'Estudante pertence a outra instituição; divergência de fronteira multi-tenant.';
    }
  }
  if (ids.classId) {
    const c = await db
      .select({ institutionId: classes.institutionId })
      .from(classes)
      .where(eq(classes.id, ids.classId))
      .limit(1);
    if (c[0] && c[0].institutionId !== credentialInstitutionId) {
      return 'Turma pertence a outra instituição; divergência de fronteira multi-tenant.';
    }
  }
  return null;
}

function parseCommandPayload(payloadJson: string): Record<string, unknown> {
  try {
    const parsed = JSON.parse(payloadJson);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : {};
  } catch {
    return {};
  }
}

async function handlePublishedGradeUpsert(
  db: AquilaDatabase,
  credential: AuthenticatedEdgeCredential,
  envelope: z.infer<typeof singleEventSchema>,
  index: number,
  row: z.infer<typeof publishedGradePayloadSchema>,
  now: Date
): Promise<ProcessedEventOutcome | null> {
  if (row.score > row.maxScore) {
    return {
      eventId: envelope.eventId,
      index,
      status: 'rejected_schema',
      httpStatus: 400,
      code: 'GRADE_SCORE_EXCEEDS_MAX',
      error: `Nota (${row.score}) excede o máximo permitido (${row.maxScore}).`,
    };
  }

  const [studentRows, classRows, existingGradeRows] = await Promise.all([
    db.select({ institutionId: students.institutionId }).from(students).where(eq(students.id, row.studentId)).limit(1),
    db.select({ institutionId: classes.institutionId }).from(classes).where(eq(classes.id, row.classId)).limit(1),
    db.select({ id: grades.id, classId: grades.classId }).from(grades).where(eq(grades.id, row.id)).limit(1),
  ]);

  if (!studentRows[0] || !classRows[0]) {
    return {
      eventId: envelope.eventId,
      index,
      status: 'rejected_forbidden',
      httpStatus: 403,
      code: 'CROSS_TENANT_ENTITY_REJECTED',
      error: 'Estudante ou turma não localizada na instituição autenticada.',
    };
  }
  if (
    studentRows[0].institutionId !== credential.institutionId ||
    classRows[0].institutionId !== credential.institutionId
  ) {
    return {
      eventId: envelope.eventId,
      index,
      status: 'rejected_forbidden',
      httpStatus: 403,
      code: 'CROSS_TENANT_ENTITY_REJECTED',
      error: 'Estudante ou turma pertence a outra instituição; divergência de fronteira multi-tenant.',
    };
  }

  if (existingGradeRows[0]) {
    const existingClass = await db
      .select({ institutionId: classes.institutionId })
      .from(classes)
      .where(eq(classes.id, existingGradeRows[0].classId))
      .limit(1);
    if (!existingClass[0] || existingClass[0].institutionId !== credential.institutionId) {
      return {
        eventId: envelope.eventId,
        index,
        status: 'rejected_forbidden',
        httpStatus: 403,
        code: 'CROSS_TENANT_ENTITY_REJECTED',
        error: 'ID de avaliação já pertence a outra instituição.',
      };
    }
  }

  await db
    .insert(grades)
    .values({
      id: row.id,
      studentId: row.studentId,
      classId: row.classId,
      subject: row.subject,
      evaluationType: row.evaluationType,
      score: row.score,
      maxScore: row.maxScore,
      period: row.period,
      teacherId: row.teacherId,
      status: 'published',
      reviewedByTeacherId: row.teacherId,
      propagationStatus: 'applied_by_edge',
      createdAt: now,
    })
    .onConflictDoUpdate({
      target: grades.id,
      set: {
        subject: row.subject,
        evaluationType: row.evaluationType,
        score: row.score,
        maxScore: row.maxScore,
        period: row.period,
        teacherId: row.teacherId,
        reviewedByTeacherId: row.teacherId,
        status: 'published',
        propagationStatus: 'applied_by_edge',
      },
    });

  return null;
}

/** Propaga a confirmação (ou falha) do Edge escolar às projeções de domínio da instituição. */
async function propagateCommandAckToDomainEntities(
  db: AquilaDatabase,
  institutionId: string,
  cmd: typeof edgeSyncCommands.$inferSelect,
  row: z.infer<typeof commandAckPayloadSchema>
) {
  const nextPropagationStatus = row.outcome === 'applied_by_edge' ? ('applied_by_edge' as const) : ('failed' as const);
  const cmdPayload = parseCommandPayload(cmd.payloadJson);

  if (cmd.targetDomain === 'consent') {
    const consentLogId =
      row.consentLogId ?? (typeof cmdPayload.consentLogId === 'string' ? cmdPayload.consentLogId : undefined);
    const consentCondition = consentLogId
      ? or(eq(biometricConsentLogs.id, consentLogId), eq(biometricConsentLogs.edgeCommandId, row.commandId))
      : eq(biometricConsentLogs.edgeCommandId, row.commandId);

    await db
      .update(biometricConsentLogs)
      .set({ propagationStatus: nextPropagationStatus })
      .where(and(eq(biometricConsentLogs.institutionId, institutionId), consentCondition));

    if (cmd.action === 'REVOCATION_PURGE') {
      const purgeLogId = typeof cmdPayload.purgeLogId === 'string' ? cmdPayload.purgeLogId : undefined;
      const purgeCondition = purgeLogId
        ? or(eq(biometricPurgeLogs.id, purgeLogId), eq(biometricPurgeLogs.edgeCommandId, row.commandId))
        : eq(biometricPurgeLogs.edgeCommandId, row.commandId);

      await db
        .update(biometricPurgeLogs)
        .set({
          status: nextPropagationStatus,
          notes:
            row.conflictNote ??
            (nextPropagationStatus === 'applied_by_edge'
              ? 'Expurgo biométrico confirmado pelo servidor Edge escolar.'
              : 'Falha reportada pelo Edge ao aplicar expurgo biométrico.'),
        })
        .where(and(eq(biometricPurgeLogs.institutionId, institutionId), purgeCondition));
    }
    return;
  }

  if (cmd.targetDomain === 'lesson_diary') {
    const diaryId = row.diaryId ?? (typeof cmdPayload.diaryId === 'string' ? cmdPayload.diaryId : undefined);
    const diaryCondition = diaryId
      ? or(eq(lessonDiaries.id, diaryId), eq(lessonDiaries.edgeCommandId, row.commandId))
      : eq(lessonDiaries.edgeCommandId, row.commandId);

    await db
      .update(lessonDiaries)
      .set({ propagationStatus: nextPropagationStatus })
      .where(and(eq(lessonDiaries.institutionId, institutionId), diaryCondition));
    return;
  }

  const instClassRows = await db
    .select({ id: classes.id })
    .from(classes)
    .where(eq(classes.institutionId, institutionId));
  const instClassIds = instClassRows.map((c) => c.id);
  if (instClassIds.length === 0) return;

  if (cmd.targetDomain === 'occurrence_ack') {
    const occurrenceId =
      row.occurrenceId ?? (typeof cmdPayload.occurrenceId === 'string' ? cmdPayload.occurrenceId : undefined);
    const occCondition = occurrenceId
      ? or(eq(occurrences.id, occurrenceId), eq(occurrences.edgeCommandId, row.commandId))
      : eq(occurrences.edgeCommandId, row.commandId);

    await db
      .update(occurrences)
      .set({ propagationStatus: nextPropagationStatus })
      .where(and(inArray(occurrences.classId, instClassIds), occCondition));
    return;
  }

  if (cmd.targetDomain === 'grade_publication') {
    const gradeIdSet = new Set<string>();
    if (row.gradeId) gradeIdSet.add(row.gradeId);
    if (row.gradeIds) row.gradeIds.forEach((id) => gradeIdSet.add(id));
    if (typeof cmdPayload.gradeId === 'string') gradeIdSet.add(cmdPayload.gradeId);
    if (Array.isArray(cmdPayload.gradeIds)) {
      for (const id of cmdPayload.gradeIds) {
        if (typeof id === 'string') gradeIdSet.add(id);
      }
    }

    const gradeIdsList = Array.from(gradeIdSet);
    const gradeCondition =
      gradeIdsList.length > 0
        ? or(inArray(grades.id, gradeIdsList), eq(grades.edgeCommandId, row.commandId))
        : eq(grades.edgeCommandId, row.commandId);

    await db
      .update(grades)
      .set({ propagationStatus: nextPropagationStatus })
      .where(and(inArray(grades.classId, instClassIds), gradeCondition));
  }
}

async function processSingleEvent(
  db: AquilaDatabase,
  credential: AuthenticatedEdgeCredential,
  envelope: z.infer<typeof singleEventSchema>,
  index: number
): Promise<ProcessedEventOutcome> {
  if (envelope.schoolCloudId !== credential.schoolCloudId) {
    return {
      eventId: envelope.eventId,
      index,
      status: 'rejected_forbidden',
      httpStatus: 403,
      code: 'SCHOOL_CLOUD_MISMATCH',
      error: 'Credencial autenticada não autorizada para este schoolCloudId.',
    };
  }
  if (envelope.institutionId && envelope.institutionId !== credential.institutionId) {
    return {
      eventId: envelope.eventId,
      index,
      status: 'rejected_forbidden',
      httpStatus: 403,
      code: 'INSTITUTION_SPOOFING_REJECTED',
      error: 'institutionId informado no payload diverge da credencial autenticada.',
    };
  }

  const boundaryViolations = collectBoundaryViolations(envelope.data);
  if (boundaryViolations.length > 0) {
    const now = new Date();
    const sanitizedDigest = computeSha256({
      eventId: envelope.eventId,
      schoolCloudId: credential.schoolCloudId,
      blockedFields: boundaryViolations,
    });
    await db
      .insert(edgeSyncEvents)
      .values({
        id: `sync_${randomUUID()}`,
        eventId: `${envelope.eventId}_rejected_${now.getTime()}`,
        schoolCloudId: credential.schoolCloudId,
        institutionId: credential.institutionId,
        deviceId: credential.deviceId,
        contractVersion: envelope.contractVersion,
        sequenceNumber: envelope.sequenceNumber ?? null,
        eventType: envelope.eventType,
        payloadJson: JSON.stringify({ blockedFields: boundaryViolations, digest: sanitizedDigest }),
        status: 'rejected_lgpd',
        receivedAt: now,
      })
      .onConflictDoNothing();

    await recordAuditEvent(db, {
      userId: null,
      action: 'EDGE_SYNC_LGPD_BLOCKED',
      entity: 'edge_sync_event',
      entityId: envelope.eventId,
      details: {
        schoolCloudId: credential.schoolCloudId,
        institutionId: credential.institutionId,
        deviceId: credential.deviceId,
        blockedFields: boundaryViolations,
      },
    });

    return {
      eventId: envelope.eventId,
      index,
      status: 'rejected_boundary',
      httpStatus: 422,
      code: 'LGPD_EDGE_BOUNDARY_VIOLATION',
      error:
        'Política interna de minimização do Áquila Pro: dados biométricos, mídia bruta, redações integrais, anexos ou logs/dumps de erro não podem deixar a borda local.',
      blockedFields: boundaryViolations,
    };
  }

  const existing = await db
    .select()
    .from(edgeSyncEvents)
    .where(eq(edgeSyncEvents.eventId, envelope.eventId))
    .limit(1);

  if (existing[0]?.status === 'accepted') {
    return {
      eventId: envelope.eventId,
      index,
      status: 'already_processed',
      httpStatus: 200,
    };
  }

  if (envelope.sequenceNumber !== undefined) {
    const latestSeqRows = await db
      .select({ sequenceNumber: edgeSyncEvents.sequenceNumber })
      .from(edgeSyncEvents)
      .where(
        and(
          eq(edgeSyncEvents.schoolCloudId, credential.schoolCloudId),
          eq(edgeSyncEvents.eventType, envelope.eventType),
          eq(edgeSyncEvents.status, 'accepted')
        )
      )
      .orderBy(desc(edgeSyncEvents.sequenceNumber))
      .limit(1);
    const latestSeq = latestSeqRows[0]?.sequenceNumber;
    if (latestSeq !== null && latestSeq !== undefined && envelope.sequenceNumber <= latestSeq) {
      return {
        eventId: envelope.eventId,
        index,
        status: 'rejected_conflict',
        httpStatus: 409,
        code: 'STALE_SEQUENCE_CONFLICT',
        error: `sequenceNumber ${envelope.sequenceNumber} fora de ordem (último aceito: ${latestSeq}).`,
      };
    }
  }

  const payloadParsed = validateStrictPayload(envelope.eventType, envelope.data);
  if (!payloadParsed.success) {
    await db
      .insert(edgeSyncEvents)
      .values({
        id: `sync_${randomUUID()}`,
        eventId: `${envelope.eventId}_schema_${Date.now()}`,
        schoolCloudId: credential.schoolCloudId,
        institutionId: credential.institutionId,
        deviceId: credential.deviceId,
        contractVersion: envelope.contractVersion,
        sequenceNumber: envelope.sequenceNumber ?? null,
        eventType: envelope.eventType,
        payloadJson: JSON.stringify({ error: 'strict_schema_rejected' }),
        status: 'rejected_schema',
        receivedAt: new Date(),
      })
      .onConflictDoNothing();

    return {
      eventId: envelope.eventId,
      index,
      status: 'rejected_schema',
      httpStatus: 400,
      code: 'EDGE_STRICT_SCHEMA_REJECTED',
      error: `Payload ${envelope.eventType} violou a lista positiva (.strict()) de campos permitidos.`,
      issues: payloadParsed.error.flatten(),
    };
  }

  const now = new Date();
  if (envelope.eventType === 'ATTENDANCE_QR') {
    const row = payloadParsed.data as z.infer<typeof attendancePayloadSchema>;
    const tenantError = await verifyEntityBelongsToInstitution(db, credential.institutionId, {
      studentId: row.studentId,
      classId: row.classId,
    });
    if (tenantError) {
      return {
        eventId: envelope.eventId,
        index,
        status: 'rejected_forbidden',
        httpStatus: 403,
        code: 'CROSS_TENANT_ENTITY_REJECTED',
        error: tenantError,
      };
    }
    const existingAtt = await db
      .select({ id: attendance.id })
      .from(attendance)
      .where(
        and(
          eq(attendance.studentId, row.studentId),
          eq(attendance.classId, row.classId),
          eq(attendance.date, row.date)
        )
      )
      .limit(1);

    if (existingAtt[0]) {
      await db
        .update(attendance)
        .set({
          status: row.status,
          detectedBy: row.detectedBy,
          timestamp: now,
        })
        .where(eq(attendance.id, existingAtt[0].id));
    } else {
      const attId = row.id ?? `att_sync_${envelope.eventId}`;
      await db
        .insert(attendance)
        .values({
          id: attId,
          studentId: row.studentId,
          classId: row.classId,
          date: row.date,
          status: row.status,
          detectedBy: row.detectedBy,
          confidence: 1.0,
          timestamp: now,
        })
        .onConflictDoNothing();
    }
  } else if (envelope.eventType === 'INVOICE_UPSERT') {
    const row = payloadParsed.data as z.infer<typeof invoicePayloadSchema>;
    if (row.institutionId && row.institutionId !== credential.institutionId) {
      return {
        eventId: envelope.eventId,
        index,
        status: 'rejected_forbidden',
        httpStatus: 403,
        code: 'INSTITUTION_SPOOFING_REJECTED',
        error: 'INVOICE_UPSERT.institutionId diverge da credencial do nó Edge.',
      };
    }
    const tenantError = await verifyEntityBelongsToInstitution(db, credential.institutionId, {
      studentId: row.studentId,
    });
    if (tenantError) {
      return {
        eventId: envelope.eventId,
        index,
        status: 'rejected_forbidden',
        httpStatus: 403,
        code: 'CROSS_TENANT_ENTITY_REJECTED',
        error: tenantError,
      };
    }
    await db
      .insert(invoices)
      .values({
        id: row.id,
        studentId: row.studentId,
        institutionId: credential.institutionId,
        description: row.description,
        amount: row.amount,
        dueDate: row.dueDate,
        status: row.status,
        pixPayload: row.pixPayload ?? null,
        createdAt: now,
      })
      .onConflictDoNothing();
  } else if (envelope.eventType === 'PUBLISHED_GRADE_UPSERT') {
    const row = payloadParsed.data as z.infer<typeof publishedGradePayloadSchema>;
    const rejected = await handlePublishedGradeUpsert(db, credential, envelope, index, row, now);
    if (rejected) return rejected;
  } else if (envelope.eventType === 'COMMAND_ACK') {
    const row = payloadParsed.data as z.infer<typeof commandAckPayloadSchema>;
    const cmdRows = await db
      .select()
      .from(edgeSyncCommands)
      .where(eq(edgeSyncCommands.commandId, row.commandId))
      .limit(1);
    const cmd = cmdRows[0];
    if (!cmd) {
      return {
        eventId: envelope.eventId,
        index,
        status: 'rejected_schema',
        httpStatus: 404,
        code: 'EDGE_COMMAND_NOT_FOUND',
        error: 'commandId não encontrado para confirmação.',
      };
    }
    if (cmd.institutionId !== credential.institutionId) {
      return {
        eventId: envelope.eventId,
        index,
        status: 'rejected_forbidden',
        httpStatus: 403,
        code: 'CROSS_TENANT_COMMAND_ACK_REJECTED',
        error: 'Comando pertence a outra instituição.',
      };
    }
    await db
      .update(edgeSyncCommands)
      .set({
        status: row.outcome,
        edgeAckAt: now,
        resultJson: JSON.stringify({
          conflictNote: row.conflictNote ?? null,
          appliedAt: row.appliedAt ?? now.toISOString(),
          deviceId: credential.deviceId,
        }),
        updatedAt: now,
      })
      .where(eq(edgeSyncCommands.commandId, row.commandId));

    await propagateCommandAckToDomainEntities(db, credential.institutionId, cmd, row);
  }

  const digestSha256 = computeSha256({
    contractVersion: envelope.contractVersion,
    eventId: envelope.eventId,
    institutionId: credential.institutionId,
    schoolCloudId: credential.schoolCloudId,
    deviceId: credential.deviceId,
    eventType: envelope.eventType,
    data: envelope.data,
  });

  await db
    .insert(edgeSyncEvents)
    .values({
      id: `sync_${randomUUID()}`,
      eventId: envelope.eventId,
      schoolCloudId: credential.schoolCloudId,
      institutionId: credential.institutionId,
      deviceId: credential.deviceId,
      contractVersion: envelope.contractVersion,
      sequenceNumber: envelope.sequenceNumber ?? null,
      eventType: envelope.eventType,
      payloadJson: JSON.stringify(envelope.data),
      status: 'accepted',
      receivedAt: now,
    })
    .onConflictDoNothing();

  await recordAuditEvent(db, {
    userId: null,
    action: `EDGE_SYNC_${envelope.eventType}`,
    entity: 'edge_sync_event',
    entityId: envelope.eventId,
    details: {
      institutionId: credential.institutionId,
      schoolCloudId: credential.schoolCloudId,
      deviceId: credential.deviceId,
      digestSha256,
    },
  });

  return {
    eventId: envelope.eventId,
    index,
    status: 'accepted',
    httpStatus: 202,
    digestSha256,
  };
}

/**
 * Canal de saída para o Edge escolar consultar comandos enfileirados nos portais (Zero Inbound WAN).
 */
export async function GET(request: NextRequest) {
  const rateLimited = enforceApiRateLimit(
    request,
    'sync-edge-get',
    { maxRequests: 120, windowMs: 60_000 },
    request.headers.get('x-aquila-key-id')?.trim() || undefined
  );
  if (rateLimited) return rateLimited;

  const db = await getInitializedWebDb();
  const timestampHeader = request.headers.get('x-aquila-timestamp')?.trim() ?? '';
  const signedMessage = `GET:/api/sync/edge:${timestampHeader}`;
  const auth = await authenticateEdgeCredential(request, db, signedMessage);

  if (!auth.ok) {
    return NextResponse.json({ error: auth.error, code: auth.code }, { status: auth.status });
  }

  const pendingCommands = await db
    .select({
      commandId: edgeSyncCommands.commandId,
      targetDomain: edgeSyncCommands.targetDomain,
      action: edgeSyncCommands.action,
      payloadJson: edgeSyncCommands.payloadJson,
      conflictPolicy: edgeSyncCommands.conflictPolicy,
      status: edgeSyncCommands.status,
      createdAt: edgeSyncCommands.createdAt,
    })
    .from(edgeSyncCommands)
    .where(
      and(
        eq(edgeSyncCommands.institutionId, auth.credential.institutionId),
        eq(edgeSyncCommands.status, 'pending_at_edge')
      )
    )
    .orderBy(asc(edgeSyncCommands.createdAt))
    .limit(50);

  const response = NextResponse.json({
    contractVersion: EDGE_CONTRACT_VERSION,
    institutionId: auth.credential.institutionId,
    schoolCloudId: auth.credential.schoolCloudId,
    deviceId: auth.credential.deviceId,
    commands: pendingCommands.map((cmd) => ({
      commandId: cmd.commandId,
      targetDomain: cmd.targetDomain,
      action: cmd.action,
      payload: parseCommandPayload(cmd.payloadJson),
      conflictPolicy: cmd.conflictPolicy,
      status: cmd.status,
      createdAt: cmd.createdAt.toISOString(),
    })),
  });
  if (auth.credential.status === 'grace_rotation') {
    response.headers.set('x-aquila-rotation-warning', 'credential_in_grace_window');
  }
  return response;
}

export async function POST(request: NextRequest) {
  const rateLimited = enforceApiRateLimit(
    request,
    'sync-edge-post',
    { maxRequests: 120, windowMs: 60_000 },
    request.headers.get('x-aquila-key-id')?.trim() || undefined
  );
  if (rateLimited) return rateLimited;

  const rawBody = await request.text();
  if (!rawBody) {
    return NextResponse.json({ error: 'Corpo da requisição vazio.' }, { status: 400 });
  }

  const db = await getInitializedWebDb();
  const auth = await authenticateEdgeCredential(request, db, rawBody);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error, code: auth.code }, { status: auth.status });
  }

  let jsonPayload: unknown;
  try {
    jsonPayload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'JSON malformado.' }, { status: 400 });
  }

  const schoolCloudHeader = request.headers.get('x-aquila-cloud-id')?.trim();
  if (schoolCloudHeader && schoolCloudHeader !== auth.credential.schoolCloudId) {
    return NextResponse.json(
      {
        error: 'Cabeçalho X-Aquila-Cloud-Id diverge da credencial autenticada.',
        code: 'SCHOOL_CLOUD_MISMATCH',
      },
      { status: 403 }
    );
  }

  // Suporte a lote com confirmação individual e falhas parciais (HTTP 207 Multi-Status)
  if (typeof jsonPayload === 'object' && jsonPayload !== null && 'events' in jsonPayload) {
    const batchParsed = batchEnvelopeSchema.safeParse(jsonPayload);
    if (!batchParsed.success) {
      return NextResponse.json(
        { error: 'Envelope de lote de sincronização inválido.', issues: batchParsed.error.flatten() },
        { status: 400 }
      );
    }

    const batch = batchParsed.data;
    if (batch.schoolCloudId !== auth.credential.schoolCloudId) {
      return NextResponse.json(
        { error: 'schoolCloudId do lote diverge da credencial.', code: 'SCHOOL_CLOUD_MISMATCH' },
        { status: 403 }
      );
    }
    if (batch.institutionId && batch.institutionId !== auth.credential.institutionId) {
      return NextResponse.json(
        { error: 'institutionId do lote diverge da credencial.', code: 'INSTITUTION_SPOOFING_REJECTED' },
        { status: 403 }
      );
    }

    const results: ProcessedEventOutcome[] = [];
    for (let i = 0; i < batch.events.length; i += 1) {
      const outcome = await processSingleEvent(db, auth.credential, batch.events[i], i);
      results.push(outcome);
    }

    const acceptedCount = results.filter((r) => r.status === 'accepted').length;
    const replayCount = results.filter((r) => r.status === 'already_processed').length;
    const rejectedCount = results.length - acceptedCount - replayCount;
    const httpStatus =
      rejectedCount === 0 ? 202 : acceptedCount + replayCount > 0 ? 207 : results[0]?.httpStatus ?? 400;

    const res = NextResponse.json(
      {
        contractVersion: EDGE_CONTRACT_VERSION,
        batchId: batch.batchId ?? null,
        credential: {
          keyId: auth.credential.keyId,
          deviceId: auth.credential.deviceId,
          institutionId: auth.credential.institutionId,
          schoolCloudId: auth.credential.schoolCloudId,
        },
        summary: {
          total: results.length,
          accepted: acceptedCount,
          alreadyProcessed: replayCount,
          rejected: rejectedCount,
        },
        results,
      },
      { status: httpStatus }
    );
    if (auth.credential.status === 'grace_rotation') {
      res.headers.set('x-aquila-rotation-warning', 'credential_in_grace_window');
    }
    return res;
  }

  const parsed = singleEventSchema.safeParse(jsonPayload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Envelope de sincronização inválido.', issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const outcome = await processSingleEvent(db, auth.credential, parsed.data, 0);
  if (outcome.status === 'already_processed') {
    return NextResponse.json({
      contractVersion: EDGE_CONTRACT_VERSION,
      status: 'already_processed',
      eventId: outcome.eventId,
    });
  }
  if (outcome.status !== 'accepted') {
    return NextResponse.json(
      {
        contractVersion: EDGE_CONTRACT_VERSION,
        error: outcome.code ?? outcome.status,
        message: outcome.error,
        blockedFields: outcome.blockedFields,
        issues: outcome.issues,
      },
      { status: outcome.httpStatus }
    );
  }

  const response = NextResponse.json(
    {
      contractVersion: EDGE_CONTRACT_VERSION,
      status: 'accepted',
      eventId: outcome.eventId,
      institutionId: auth.credential.institutionId,
      deviceId: auth.credential.deviceId,
      digestSha256: outcome.digestSha256,
    },
    { status: 202 }
  );
  if (auth.credential.status === 'grace_rotation') {
    response.headers.set('x-aquila-rotation-warning', 'credential_in_grace_window');
  }
  return response;
}
