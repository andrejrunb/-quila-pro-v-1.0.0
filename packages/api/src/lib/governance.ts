import { createHash, randomUUID } from 'node:crypto';
import { TRPCError } from '@trpc/server';
import { and, desc, eq, inArray, or } from 'drizzle-orm';
import {
  auditLogs,
  classes,
  edgeSyncCommands,
  edgeSyncEvents,
  grades,
  guardiansStudents,
  revokedSessions,
  students,
  userInstitutions,
  users,
  type AquilaDatabase,
} from '@aquila/db';
import type { AuthUser } from '../trpc';

let lastMonotonicTimestampMs = 0;

/**
 * Gera timestamp em milissegundos estritamente crescente no processo para desambiguar
 * eventos gravados no mesmo segundo UNIX (ex.: opt-in e revogação LGPD em sequência rápida).
 */
export function nextMonotonicTimestampMs(): number {
  const now = Date.now();
  lastMonotonicTimestampMs = now > lastMonotonicTimestampMs ? now : lastMonotonicTimestampMs + 1;
  return lastMonotonicTimestampMs;
}

export function computeSha256(payload: unknown): string {
  return createHash('sha256').update(JSON.stringify(payload)).digest('hex');
}

export async function recordAuditEvent(
  db: AquilaDatabase,
  input: {
    userId?: string | null;
    action: string;
    entity: string;
    entityId: string;
    details?: Record<string, unknown> | string | null;
    ipAddress?: string;
  }
): Promise<string> {
  const createdAt = new Date();
  const detailsText =
    typeof input.details === 'string'
      ? input.details
      : input.details
        ? JSON.stringify(input.details)
        : null;

  const integrityHashSha256 = computeSha256({
    userId: input.userId ?? null,
    action: input.action,
    entity: input.entity,
    entityId: input.entityId,
    details: detailsText,
    createdAt: createdAt.toISOString(),
  });

  await db.insert(auditLogs).values({
    id: `aud_${randomUUID()}`,
    userId: input.userId ?? null,
    action: input.action,
    entity: input.entity,
    entityId: input.entityId,
    details: detailsText,
    ipAddress: input.ipAddress ?? null,
    integrityHashSha256,
    createdAt,
  });

  return integrityHashSha256;
}

export function sanitizeOutboundStudentRow<
  T extends { faceEncoding?: unknown; faceEmbeddingHash?: unknown }
>(row: T): Omit<T, 'faceEncoding' | 'faceEmbeddingHash'> {
  const { faceEncoding: _enc, faceEmbeddingHash: _hash, ...safe } = row;
  void _enc;
  void _hash;
  return safe;
}

export async function verifyActiveUserAndSession(
  db: AquilaDatabase,
  user: AuthUser
): Promise<void> {
  if (user.jti) {
    const revoked = await db
      .select({ jti: revokedSessions.jti })
      .from(revokedSessions)
      .where(eq(revokedSessions.jti, user.jti))
      .limit(1);
    if (revoked[0]) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'Sessão encerrada ou revogada. Faça login novamente.',
      });
    }
  }

  const userRows = await db
    .select()
    .from(users)
    .where(eq(users.id, user.id))
    .limit(1);
  const dbUser = userRows[0];

  if (dbUser) {
    if (!dbUser.active) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'Conta desativada ou suspensa pela instituição.',
      });
    }
    if (
      user.sessionIssuedAt !== undefined &&
      dbUser.sessionRevokedBefore !== null &&
      dbUser.sessionRevokedBefore !== undefined &&
      user.sessionIssuedAt < dbUser.sessionRevokedBefore
    ) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'Sessão invalidada após revogação administrativa ou troca de credencial.',
      });
    }
    if (user.institutionId && dbUser.institutionId !== user.institutionId) {
      const membership = await db
        .select({ id: userInstitutions.id })
        .from(userInstitutions)
        .where(
          and(
            eq(userInstitutions.userId, user.id),
            eq(userInstitutions.institutionId, user.institutionId),
            eq(userInstitutions.status, 'active')
          )
        )
        .limit(1);
      if (!membership[0]) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Acesso negado: usuário sem vínculo ativo nesta instituição.',
        });
      }
    }
  }
}

export async function resolveAccessibleStudentIds(
  db: AquilaDatabase,
  user: AuthUser
): Promise<string[]> {
  await verifyActiveUserAndSession(db, user);

  if (user.role === 'admin' || user.role === 'coordinator') {
    const rows = user.institutionId
      ? await db
          .select({ id: students.id })
          .from(students)
          .where(eq(students.institutionId, user.institutionId))
      : await db.select({ id: students.id }).from(students);
    return rows.map((r) => r.id);
  }

  if (user.role === 'teacher') {
    const teacherClasses = user.institutionId
      ? await db
          .select({ id: classes.id })
          .from(classes)
          .where(and(eq(classes.teacherId, user.id), eq(classes.institutionId, user.institutionId)))
      : await db.select({ id: classes.id }).from(classes).where(eq(classes.teacherId, user.id));

    const classIds = teacherClasses.map((c) => c.id);
    if (classIds.length === 0) {
      return [];
    }
    const rows = await db
      .select({ id: students.id })
      .from(students)
      .where(inArray(students.classId, classIds));
    return rows.map((r) => r.id);
  }

  if (user.role === 'parent') {
    const guardianLinks = await db
      .select({ studentId: guardiansStudents.studentId })
      .from(guardiansStudents)
      .where(
        user.institutionId
          ? and(
              eq(guardiansStudents.guardianUserId, user.id),
              eq(guardiansStudents.institutionId, user.institutionId),
              eq(guardiansStudents.status, 'active')
            )
          : and(
              eq(guardiansStudents.guardianUserId, user.id),
              eq(guardiansStudents.status, 'active')
            )
      );

    const directStudents = await db
      .select({ id: students.id })
      .from(students)
      .where(
        user.institutionId
          ? and(eq(students.parentUserId, user.id), eq(students.institutionId, user.institutionId))
          : eq(students.parentUserId, user.id)
      );

    // Somente vínculos ativos persistidos no banco autorizam acesso; linkedStudentIds do JWT nunca concede acesso.
    const ids = new Set<string>([
      ...guardianLinks.map((g) => g.studentId),
      ...directStudents.map((s) => s.id),
    ]);
    return Array.from(ids);
  }

  // student role
  const ownRows = await db
    .select({ id: students.id })
    .from(students)
    .where(
      user.institutionId
        ? and(eq(students.studentUserId, user.id), eq(students.institutionId, user.institutionId))
        : eq(students.studentUserId, user.id)
    );
  return ownRows.map((r) => r.id);
}

export async function assertStudentAccess(
  db: AquilaDatabase,
  user: AuthUser,
  studentId: string
): Promise<typeof students.$inferSelect> {
  await verifyActiveUserAndSession(db, user);

  const found = await db
    .select()
    .from(students)
    .where(
      user.institutionId
        ? and(eq(students.id, studentId), eq(students.institutionId, user.institutionId))
        : eq(students.id, studentId)
    )
    .limit(1);

  const student = found[0];
  if (!student) {
    throw new TRPCError({ code: 'NOT_FOUND', message: 'Estudante não localizado neste contexto.' });
  }

  if (user.role === 'admin' || user.role === 'coordinator') {
    return student;
  }

  const allowedIds = await resolveAccessibleStudentIds(db, user);
  if (!allowedIds.includes(studentId)) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Acesso negado: vínculo institucional/familiar não autorizado para este estudante.',
    });
  }

  return student;
}

export async function findTeacherClassIds(
  db: AquilaDatabase,
  user: AuthUser
): Promise<string[]> {
  await verifyActiveUserAndSession(db, user);

  if (user.role === 'admin' || user.role === 'coordinator') {
    const rows = user.institutionId
      ? await db.select({ id: classes.id }).from(classes).where(eq(classes.institutionId, user.institutionId))
      : await db.select({ id: classes.id }).from(classes);
    return rows.map((c) => c.id);
  }
  const rows = user.institutionId
    ? await db
        .select({ id: classes.id })
        .from(classes)
        .where(and(eq(classes.teacherId, user.id), eq(classes.institutionId, user.institutionId)))
    : await db.select({ id: classes.id }).from(classes).where(eq(classes.teacherId, user.id));
  return rows.map((c) => c.id);
}

export async function assertTeacherClassAccess(
  db: AquilaDatabase,
  user: AuthUser,
  classId: string
): Promise<typeof classes.$inferSelect> {
  await verifyActiveUserAndSession(db, user);

  const found = await db
    .select()
    .from(classes)
    .where(
      user.institutionId
        ? and(eq(classes.id, classId), eq(classes.institutionId, user.institutionId))
        : eq(classes.id, classId)
    )
    .limit(1);

  const cls = found[0];
  if (!cls) {
    throw new TRPCError({ code: 'NOT_FOUND', message: 'Turma não encontrada neste contexto.' });
  }
  if (user.role === 'teacher' && cls.teacherId !== user.id) {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Acesso proibido a turma de outro docente.' });
  }
  return cls;
}

export type EdgeCommandDomain =
  | 'attendance'
  | 'lesson_diary'
  | 'grade_publication'
  | 'consent'
  | 'occurrence_ack'
  | 'finance';

export async function enqueueEdgeSyncCommand(
  db: AquilaDatabase,
  input: {
    institutionId: string;
    schoolCloudId?: string;
    targetDomain: EdgeCommandDomain;
    action: string;
    payload: Record<string, unknown>;
    actorUserId?: string | null;
    conflictPolicy?: string;
  }
): Promise<{ commandId: string; status: 'pending_at_edge' }> {
  const now = new Date();
  const commandId = `cmd_${randomUUID()}`;
  await db.insert(edgeSyncCommands).values({
    id: `ecmd_${randomUUID().slice(0, 12)}`,
    commandId,
    institutionId: input.institutionId,
    schoolCloudId: input.schoolCloudId ?? `edge_${input.institutionId}`,
    targetDomain: input.targetDomain,
    action: input.action,
    payloadJson: JSON.stringify(input.payload),
    actorUserId: input.actorUserId ?? null,
    status: 'pending_at_edge',
    conflictPolicy: input.conflictPolicy ?? 'edge_authoritative_reconciliation',
    createdAt: now,
    updatedAt: now,
  });

  return { commandId, status: 'pending_at_edge' };
}

export interface InstitutionSyncStatus {
  state: 'received_by_server' | 'pending_at_edge' | 'applied_by_edge' | 'sync_stale';
  pendingCommandCount: number;
  lastSyncedAt: string | null;
  staleReason: string | null;
}

export async function resolveInstitutionSyncStatus(
  db: AquilaDatabase,
  institutionId?: string
): Promise<InstitutionSyncStatus> {
  if (!institutionId) {
    return {
      state: 'received_by_server',
      pendingCommandCount: 0,
      lastSyncedAt: null,
      staleReason: null,
    };
  }

  const pendingCmds = await db
    .select({ id: edgeSyncCommands.id, status: edgeSyncCommands.status, updatedAt: edgeSyncCommands.updatedAt })
    .from(edgeSyncCommands)
    .where(
      and(
        eq(edgeSyncCommands.institutionId, institutionId),
        eq(edgeSyncCommands.status, 'pending_at_edge')
      )
    )
    .limit(20);

  const failedCmds = await db
    .select({ id: edgeSyncCommands.id })
    .from(edgeSyncCommands)
    .where(
      and(
        eq(edgeSyncCommands.institutionId, institutionId),
        or(eq(edgeSyncCommands.status, 'failed'), eq(edgeSyncCommands.status, 'rejected_by_edge'))
      )
    )
    .limit(5);

  const syncRows = await db
    .select({ status: edgeSyncEvents.status, receivedAt: edgeSyncEvents.receivedAt })
    .from(edgeSyncEvents)
    .where(eq(edgeSyncEvents.institutionId, institutionId))
    .orderBy(desc(edgeSyncEvents.receivedAt))
    .limit(5);

  const latestSync = syncRows[0];
  const state: InstitutionSyncStatus['state'] =
    failedCmds.length > 0 || latestSync?.status === 'rejected_lgpd' || latestSync?.status === 'rejected_schema'
      ? 'sync_stale'
      : pendingCmds.length > 0
        ? 'pending_at_edge'
        : latestSync?.status === 'accepted'
          ? 'applied_by_edge'
          : 'received_by_server';

  return {
    state,
    pendingCommandCount: pendingCmds.length,
    lastSyncedAt: latestSync?.receivedAt ? latestSync.receivedAt.toISOString() : null,
    staleReason:
      state === 'sync_stale'
        ? 'Último ciclo de sincronização com o Edge apresentou rejeição ou falha.'
        : null,
  };
}

export interface DomainSyncCommandSummary {
  commandId: string;
  status: string;
  updatedAt: string | null;
  edgeAckAt: string | null;
}

/**
 * Busca o último comando enfileirado para um domínio de sincronização Edge em determinada instituição.
 */
export async function resolveLatestCommandByDomain(
  db: AquilaDatabase,
  institutionId: string | undefined,
  targetDomain: EdgeCommandDomain
): Promise<DomainSyncCommandSummary | null> {
  if (!institutionId) return null;

  const rows = await db
    .select({
      commandId: edgeSyncCommands.commandId,
      status: edgeSyncCommands.status,
      updatedAt: edgeSyncCommands.updatedAt,
      edgeAckAt: edgeSyncCommands.edgeAckAt,
    })
    .from(edgeSyncCommands)
    .where(
      and(
        eq(edgeSyncCommands.institutionId, institutionId),
        eq(edgeSyncCommands.targetDomain, targetDomain)
      )
    )
    .orderBy(desc(edgeSyncCommands.createdAt))
    .limit(1);

  const row = rows[0];
  if (!row) return null;

  return {
    commandId: row.commandId,
    status: row.status,
    updatedAt: row.updatedAt ? row.updatedAt.toISOString() : null,
    edgeAckAt: row.edgeAckAt ? row.edgeAckAt.toISOString() : null,
  };
}

/**
 * Formaliza o direito à contestação de avaliação publicada (Parecer CNE/CP nº 15/2026)
 * por responsável vinculado ou pelo próprio estudante, enfileirando reconciliação com o Edge.
 */
export async function contestPublishedGrade(
  db: AquilaDatabase,
  user: AuthUser,
  input: { gradeId: string; reason: string },
  ipAddress?: string
) {
  if (!['parent', 'student', 'admin', 'coordinator'].includes(user.role)) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Apenas estudantes, responsáveis vinculados ou gestão escolar podem registrar contestação formal.',
    });
  }

  const found = await db
    .select()
    .from(grades)
    .where(eq(grades.id, input.gradeId))
    .limit(1);

  const grade = found[0];
  if (!grade) {
    throw new TRPCError({ code: 'NOT_FOUND', message: 'Avaliação não localizada.' });
  }

  const student = await assertStudentAccess(db, user, grade.studentId);

  if (grade.status !== 'published') {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'Somente avaliações publicadas podem ser contestadas formalmente.',
    });
  }

  const reason = input.reason.trim();
  if (reason.length < 10) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'Descreva o motivo pedagógico da contestação com pelo menos 10 caracteres.',
    });
  }

  const contestedAt = new Date();
  const institutionId = user.institutionId ?? student.institutionId;

  const edgeCmd = await enqueueEdgeSyncCommand(db, {
    institutionId,
    targetDomain: 'grade_publication',
    action: 'GRADE_CONTESTED',
    actorUserId: user.id,
    conflictPolicy: 'guardian_explicit_latest',
    payload: {
      gradeId: grade.id,
      studentId: grade.studentId,
      classId: grade.classId,
      subject: grade.subject,
      period: grade.period,
      contestationStatus: 'contested',
      contestationReason: reason,
      contestedAt: contestedAt.toISOString(),
      contestedByUserId: user.id,
      actorRole: user.role,
    },
  });

  await db
    .update(grades)
    .set({
      contestationStatus: 'contested',
      contestationReason: reason,
      contestedAt,
      contestedByUserId: user.id,
      propagationStatus: 'pending_at_edge',
      edgeCommandId: edgeCmd.commandId,
    })
    .where(eq(grades.id, grade.id));

  await recordAuditEvent(db, {
    userId: user.id,
    action: 'GRADE_CONTESTED_CNE_15_2026',
    entity: 'grades',
    entityId: grade.id,
    details: {
      studentId: grade.studentId,
      subject: grade.subject,
      period: grade.period,
      actorRole: user.role,
      reasonHashSha256: computeSha256({ gradeId: grade.id, reason, contestedAt: contestedAt.toISOString() }),
      commandId: edgeCmd.commandId,
      legalBasis: 'Parecer CNE/CP 15/2026 — Direito à Contestação',
    },
    ipAddress,
  });

  return {
    ok: true,
    gradeId: grade.id,
    contestationStatus: 'contested' as const,
    contestationReason: reason,
    contestedAt: contestedAt.toISOString(),
    propagationStatus: 'pending_at_edge' as const,
    commandId: edgeCmd.commandId,
  };
}

export { or };
