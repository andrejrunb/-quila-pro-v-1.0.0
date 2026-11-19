import { randomUUID } from 'crypto';
import { isDedicatedDemoDatabase } from '../database/demoSeedGuard';
import {
  Mvp01Context,
  Mvp01Error,
  authorize,
  resolveMvp01Context,
  switchContext,
} from '../main/services/mvp01/Mvp01AuthorizationGuard';
import {
  Mvp01DomainService,
  Mvp01PortalType,
} from '../main/services/mvp01/Mvp01DomainService';
import {
  ensureMvp01Schema,
  mvp01Run,
  seedMvp01DemoData,
} from '../main/services/mvp01/Mvp01Schema';

export interface Mvp01IPCContext {
  db?: any;
  authService?: {
    getCurrentUser?: () => Promise<any | null>;
  };
  mvp01ResolveUser?: () => Promise<any | null>;
}

export type Mvp01ProtectedHandle = (
  channel: string,
  handler: (event: any, ...args: any[]) => any,
  options?: { windowMs?: number; max?: number }
) => void;

export type Mvp01IpcResponse<T = any> =
  | { success: true; status: number; data: T }
  | { success: false; status: number; code: string; error: string };

export const MVP01_IPC_CHANNELS = [
  'mvp01:get-context',
  'mvp01:switch-context',
  'mvp01:seed-demo',
  'mvp01:get-portal-overview',
  'mvp01:run-consistency-verification',
  'mvp01:save-enrollment-draft',
  'mvp01:validate-enrollment-draft',
  'mvp01:confirm-enrollment-draft',
  'mvp01:transfer-student-class',
  'mvp01:save-class-assignment',
  'mvp01:save-guardian-link',
  'mvp01:revoke-guardian-link',
  'mvp01:record-attendance-sheet',
  'mvp01:submit-absence-justification',
  'mvp01:review-absence-justification',
  'mvp01:save-grading-policy-version',
  'mvp01:record-grade-entry',
  'mvp01:close-academic-period',
  'mvp01:reopen-academic-period',
  'mvp01:create-incident',
  'mvp01:publish-incident-to-family',
  'mvp01:resolve-incident',
  'mvp01:ack-incident',
  'mvp01:publish-communication',
  'mvp01:record-communication-receipt',
  'mvp01:issue-document',
  'mvp01:verify-document-token',
  'mvp01:revoke-document',
  'mvp01:record-practice-session',
  'mvp01:save-task',
  'mvp01:complete-task',
  'mvp01:save-timetable-slot',
  'mvp01:upsert-calendar-holiday',
  'mvp01:update-academic-year-hours',
  'mvp01:create-user-invitation',
  'mvp01:list-user-invitations',
  'mvp01:revoke-user-invitation',
] as const;

const registeredSelectionMaps = new Set<Map<string, string>>();

export function clearMvp01SelectedContext(userId?: string): void {
  for (const map of registeredSelectionMaps) {
    if (userId) {
      map.delete(userId);
    } else {
      map.clear();
    }
  }
}

function sanitizePayload(payload: unknown): Record<string, any> {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return {};
  }
  return payload as Record<string, any>;
}

function toSafeErrorResponse(channel: string, err: unknown): Mvp01IpcResponse<never> {
  if (
    err instanceof Mvp01Error ||
    (err &&
      typeof err === 'object' &&
      typeof (err as any).status === 'number' &&
      typeof (err as any).code === 'string' &&
      typeof (err as any).message === 'string')
  ) {
    const mvpErr = err as Mvp01Error;
    return {
      success: false,
      status: mvpErr.status,
      code: mvpErr.code,
      error: mvpErr.message,
    };
  }

  console.error(`[MVP01 IPC][${channel}] Internal error:`, err);
  return {
    success: false,
    status: 500,
    code: 'INTERNAL_ERROR',
    error: 'Erro interno ao processar operação.',
  };
}

/**
 * Registra todos os handlers IPC `mvp01:*` com resolução obrigatória de contexto,
 * RBAC fail-closed no backend e sanitização estrita de erros.
 */
export function registerMvp01Handlers(
  context: Mvp01IPCContext,
  protectedHandle: Mvp01ProtectedHandle
): void {
  const selectedMembershipByUser = new Map<string, string>();
  registeredSelectionMaps.add(selectedMembershipByUser);
  const service = context.db ? new Mvp01DomainService(context.db) : null;

  async function resolveSessionUser(): Promise<any> {
    const user = context.mvp01ResolveUser
      ? await context.mvp01ResolveUser()
      : await context.authService?.getCurrentUser?.();
    if (!user || (!user.id && !user.userId)) {
      throw new Mvp01Error(401, 'UNAUTHENTICATED', 'Sessão não autenticada.');
    }
    return user;
  }

  async function ensureReadyAndContext(requestedMembershipId?: string): Promise<{
    ctx: Mvp01Context;
    domain: Mvp01DomainService;
  }> {
    if (!context.db || !service) {
      throw new Mvp01Error(503, 'SERVICE_UNAVAILABLE', 'Serviço de banco de dados indisponível.');
    }

    const sessionUser = await resolveSessionUser();
    await ensureMvp01Schema(context.db);

    const allowAutoSeed =
      process.env.AQUILA_MVP01_AUTO_SEED === 'true' ||
      isDedicatedDemoDatabase(context.db?.getDatabasePath?.(), 'AQUILA_ENABLE_DEMO_USERS');
    if (allowAutoSeed) {
      await seedMvp01DemoData(context.db);
    }

    const userId = String(sessionUser.id || sessionUser.userId);
    const cachedMembershipId = !requestedMembershipId ? selectedMembershipByUser.get(userId) : undefined;
    const effectiveMembershipId = requestedMembershipId || cachedMembershipId;

    let ctx: Mvp01Context;
    try {
      ctx = await resolveMvp01Context(context.db, sessionUser, effectiveMembershipId);
    } catch (err) {
      if (
        !requestedMembershipId &&
        cachedMembershipId &&
        err instanceof Mvp01Error &&
        (err.code === 'FORBIDDEN_INACTIVE_MEMBERSHIP' || err.code === 'FORBIDDEN_MEMBERSHIP')
      ) {
        selectedMembershipByUser.delete(userId);
        ctx = await resolveMvp01Context(context.db, sessionUser, undefined);
      } else {
        throw err;
      }
    }
    return { ctx, domain: service };
  }

  function handleMvp01<T = any>(
    channel: (typeof MVP01_IPC_CHANNELS)[number],
    fn: (ctx: Mvp01Context, domain: Mvp01DomainService, payload: any) => Promise<T>
  ): void {
    protectedHandle(channel, async (_event: any, rawPayload: unknown) => {
      try {
        const payloadObj = sanitizePayload(rawPayload);
        const requestedMembershipId =
          typeof payloadObj.membershipId === 'string' && payloadObj.membershipId.trim()
            ? payloadObj.membershipId.trim()
            : undefined;
        const { ctx, domain } = await ensureReadyAndContext(requestedMembershipId);
        const data = await fn(ctx, domain, rawPayload);
        return { success: true, status: 200, data };
      } catch (err) {
        return toSafeErrorResponse(channel, err);
      }
    });
  }

  protectedHandle('mvp01:get-context', async (_event: any, rawPayload: unknown) => {
    try {
      const requestedMembershipId =
        typeof rawPayload === 'string'
          ? rawPayload.trim() || undefined
          : typeof sanitizePayload(rawPayload).membershipId === 'string'
          ? sanitizePayload(rawPayload).membershipId.trim() || undefined
          : undefined;
      const { ctx } = await ensureReadyAndContext(requestedMembershipId);
      return { success: true, status: 200, data: ctx };
    } catch (err) {
      return toSafeErrorResponse('mvp01:get-context', err);
    }
  });

  protectedHandle('mvp01:switch-context', async (_event: any, rawPayload: unknown) => {
    try {
      if (!context.db) {
        throw new Mvp01Error(503, 'SERVICE_UNAVAILABLE', 'Serviço de banco de dados indisponível.');
      }
      const sessionUser = await resolveSessionUser();
      await ensureMvp01Schema(context.db);
      const membershipId =
        typeof rawPayload === 'string'
          ? rawPayload
          : sanitizePayload(rawPayload).membershipId;

      const switchedCtx = await switchContext(context.db, sessionUser, membershipId);
      selectedMembershipByUser.set(switchedCtx.userId, switchedCtx.membershipId);

      await mvp01Run(
        context.db,
        `INSERT INTO mvp01_audit_events
         (id, school_id, user_id, role, action, resource_type, resource_id, reason, metadata_json, created_at)
         VALUES (?, ?, ?, ?, 'CONTEXT_SWITCHED', 'membership', ?, NULL, ?, ?)`,
        [
          randomUUID(),
          switchedCtx.schoolId,
          switchedCtx.userId,
          switchedCtx.activeRole,
          switchedCtx.membershipId,
          JSON.stringify({ activeRole: switchedCtx.activeRole }),
          new Date().toISOString(),
        ]
      );

      return { success: true, status: 200, data: switchedCtx };
    } catch (err) {
      return toSafeErrorResponse('mvp01:switch-context', err);
    }
  });

  handleMvp01('mvp01:seed-demo', async (ctx) => {
    try {
      authorize(ctx, 'school.update', { schoolId: ctx.schoolId });
    } catch (err) {
      if (err instanceof Mvp01Error && err.code === 'FORBIDDEN_READ_ONLY_ROLE') {
        await mvp01Run(
          context.db,
          `INSERT INTO mvp01_audit_events
           (id, school_id, user_id, role, action, resource_type, resource_id, reason, metadata_json, created_at)
           VALUES (?, ?, ?, ?, 'FORBIDDEN_READ_ONLY_WRITE_ATTEMPT', 'school', ?, ?, ?, ?)`,
          [
            randomUUID(),
            ctx.schoolId,
            ctx.userId,
            ctx.activeRole,
            ctx.schoolId,
            `Tentativa de escrita bloqueada para papel somente leitura (${ctx.activeRole}): school.update`,
            JSON.stringify({ permission: 'school.update' }),
            new Date().toISOString(),
          ]
        );
      }
      throw err;
    }
    const seeded = await seedMvp01DemoData(context.db);
    return { seeded };
  });

  handleMvp01('mvp01:get-portal-overview', async (ctx, domain, rawPayload) => {
    const payload = sanitizePayload(rawPayload);
    const portal = (typeof rawPayload === 'string' ? rawPayload : payload.portal) as Mvp01PortalType;
    if (!portal) {
      throw new Mvp01Error(400, 'INVALID_PORTAL', 'Portal é obrigatório.');
    }
    return await domain.getPortalOverview(ctx, portal, {
      studentId: payload.studentId,
      classId: payload.classId,
    });
  });

  handleMvp01('mvp01:run-consistency-verification', async (ctx, domain) => {
    return await domain.runConsistencyVerification(ctx);
  });

  handleMvp01('mvp01:save-enrollment-draft', async (ctx, domain, rawPayload) => {
    return await domain.saveEnrollmentDraft(ctx, sanitizePayload(rawPayload) as any);
  });

  handleMvp01('mvp01:validate-enrollment-draft', async (ctx, domain, rawPayload) => {
    const payload = sanitizePayload(rawPayload);
    const draftId = typeof rawPayload === 'string' ? rawPayload : payload.draftId;
    return await domain.validateEnrollmentDraft(ctx, { draftId });
  });

  handleMvp01('mvp01:confirm-enrollment-draft', async (ctx, domain, rawPayload) => {
    return await domain.confirmEnrollmentDraft(ctx, sanitizePayload(rawPayload) as any);
  });

  handleMvp01('mvp01:transfer-student-class', async (ctx, domain, rawPayload) => {
    return await domain.transferStudentClass(ctx, sanitizePayload(rawPayload) as any);
  });

  handleMvp01('mvp01:save-class-assignment', async (ctx, domain, rawPayload) => {
    return await domain.saveClassAssignment(ctx, sanitizePayload(rawPayload) as any);
  });

  handleMvp01('mvp01:save-guardian-link', async (ctx, domain, rawPayload) => {
    return await domain.saveGuardianLink(ctx, sanitizePayload(rawPayload) as any);
  });

  handleMvp01('mvp01:revoke-guardian-link', async (ctx, domain, rawPayload) => {
    return await domain.revokeGuardianLink(ctx, sanitizePayload(rawPayload) as any);
  });

  handleMvp01('mvp01:record-attendance-sheet', async (ctx, domain, rawPayload) => {
    return await domain.recordAttendanceSheet(ctx, sanitizePayload(rawPayload) as any);
  });

  handleMvp01('mvp01:submit-absence-justification', async (ctx, domain, rawPayload) => {
    return await domain.submitAbsenceJustification(ctx, sanitizePayload(rawPayload) as any);
  });

  handleMvp01('mvp01:review-absence-justification', async (ctx, domain, rawPayload) => {
    return await domain.reviewAbsenceJustification(ctx, sanitizePayload(rawPayload) as any);
  });

  handleMvp01('mvp01:save-grading-policy-version', async (ctx, domain, rawPayload) => {
    return await domain.saveGradingPolicyVersion(ctx, sanitizePayload(rawPayload) as any);
  });

  handleMvp01('mvp01:record-grade-entry', async (ctx, domain, rawPayload) => {
    return await domain.recordGradeEntry(ctx, sanitizePayload(rawPayload) as any);
  });

  handleMvp01('mvp01:close-academic-period', async (ctx, domain, rawPayload) => {
    const payload = sanitizePayload(rawPayload);
    const periodId = typeof rawPayload === 'string' ? rawPayload : payload.periodId;
    return await domain.closeAcademicPeriod(ctx, { periodId });
  });

  handleMvp01('mvp01:reopen-academic-period', async (ctx, domain, rawPayload) => {
    return await domain.reopenAcademicPeriod(ctx, sanitizePayload(rawPayload) as any);
  });

  handleMvp01('mvp01:create-incident', async (ctx, domain, rawPayload) => {
    return await domain.createIncident(ctx, sanitizePayload(rawPayload) as any);
  });

  handleMvp01('mvp01:publish-incident-to-family', async (ctx, domain, rawPayload) => {
    return await domain.publishIncidentToFamily(ctx, sanitizePayload(rawPayload) as any);
  });

  handleMvp01('mvp01:resolve-incident', async (ctx, domain, rawPayload) => {
    return await domain.resolveIncident(ctx, sanitizePayload(rawPayload) as any);
  });

  handleMvp01('mvp01:ack-incident', async (ctx, domain, rawPayload) => {
    const payload = sanitizePayload(rawPayload);
    const incidentId = typeof rawPayload === 'string' ? rawPayload : payload.incidentId;
    return await domain.ackIncident(ctx, { incidentId });
  });

  handleMvp01('mvp01:publish-communication', async (ctx, domain, rawPayload) => {
    return await domain.publishCommunication(ctx, sanitizePayload(rawPayload) as any);
  });

  handleMvp01('mvp01:record-communication-receipt', async (ctx, domain, rawPayload) => {
    return await domain.recordCommunicationReceipt(ctx, sanitizePayload(rawPayload) as any);
  });

  handleMvp01('mvp01:issue-document', async (ctx, domain, rawPayload) => {
    return await domain.issueDocument(ctx, sanitizePayload(rawPayload) as any);
  });

  handleMvp01('mvp01:verify-document-token', async (ctx, domain, rawPayload) => {
    const payload = sanitizePayload(rawPayload);
    const token = typeof rawPayload === 'string' ? rawPayload : payload.token;
    return await domain.verifyDocumentToken(ctx, { token });
  });

  handleMvp01('mvp01:revoke-document', async (ctx, domain, rawPayload) => {
    return await domain.revokeDocument(ctx, sanitizePayload(rawPayload) as any);
  });

  handleMvp01('mvp01:record-practice-session', async (ctx, domain, rawPayload) => {
    return await domain.recordPracticeSession(ctx, sanitizePayload(rawPayload) as any);
  });

  handleMvp01('mvp01:save-task', async (ctx, domain, rawPayload) => {
    return await domain.saveTask(ctx, sanitizePayload(rawPayload) as any);
  });

  handleMvp01('mvp01:complete-task', async (ctx, domain, rawPayload) => {
    return await domain.completeTask(ctx, sanitizePayload(rawPayload) as any);
  });

  handleMvp01('mvp01:save-timetable-slot', async (ctx, domain, rawPayload) => {
    return await domain.saveTimetableSlot(ctx, sanitizePayload(rawPayload) as any);
  });

  handleMvp01('mvp01:upsert-calendar-holiday', async (ctx, domain, rawPayload) => {
    return await domain.upsertCalendarHoliday(ctx, sanitizePayload(rawPayload) as any);
  });

  handleMvp01('mvp01:update-academic-year-hours', async (ctx, domain, rawPayload) => {
    return await domain.updateAcademicYearHours(ctx, sanitizePayload(rawPayload) as any);
  });

  handleMvp01('mvp01:create-user-invitation', async (ctx, domain, rawPayload) => {
    return await domain.createUserInvitation(ctx, sanitizePayload(rawPayload) as any);
  });

  handleMvp01('mvp01:list-user-invitations', async (ctx, domain, rawPayload) => {
    return await domain.listUserInvitations(ctx, sanitizePayload(rawPayload) as any);
  });

  handleMvp01('mvp01:revoke-user-invitation', async (ctx, domain, rawPayload) => {
    return await domain.revokeUserInvitation(ctx, sanitizePayload(rawPayload) as any);
  });
}
