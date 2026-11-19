import { createHash, randomBytes, randomUUID } from 'crypto';
import {
  Mvp01Context,
  Mvp01Error,
  Mvp01Permission,
  Mvp01ResourceScope,
  authorize,
  canonicalizeMvp01Role,
  isDirectorReadOnlyRole,
} from './Mvp01AuthorizationGuard';
import {
  Mvp01DbLike,
  ensureMvp01Schema,
  mvp01All,
  mvp01Get,
  mvp01Run,
  withMvp01Transaction,
} from './Mvp01Schema';

export type Mvp01PortalType =
  | 'secretariat'
  | 'coordination'
  | 'teacher'
  | 'family'
  | 'direction'
  | 'student';

export type ConsistencySeverity = 'BLOQUEIO' | 'AVISO';

export interface ConsistencyIssue {
  id: string;
  affectedRecord: string;
  ruleApplied: string;
  severity: ConsistencySeverity;
  howToFix: string;
  responsible: string;
  lastRunAt: string;
}

export interface DirectionKpi {
  key: string;
  label: string;
  value: number | string;
  formula: string;
  period: string;
  updatedAt: string;
}

const PORTAL_ALLOWED_ROLES: Record<Mvp01PortalType, ReadonlySet<string>> = {
  secretariat: new Set(['admin', 'secretary']),
  coordination: new Set(['admin', 'coordinator']),
  teacher: new Set(['admin', 'teacher']),
  family: new Set(['admin', 'parent']),
  direction: new Set(['admin', 'director']),
  student: new Set(['admin', 'student']),
};

function canonicalStringify(value: unknown): string {
  if (value === null || typeof value !== 'object') {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map((item) => canonicalStringify(item)).join(',')}]`;
  }
  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj).sort();
  return `{${keys
    .map((k) => `${JSON.stringify(k)}:${canonicalStringify(obj[k])}`)
    .join(',')}}`;
}

function hashFingerprint(fingerprint: unknown): string {
  const serialized =
    typeof fingerprint === 'string' ? `str:${fingerprint}` : canonicalStringify(fingerprint);
  return createHash('sha256').update(serialized).digest('hex');
}

function assertNonEmptyString(value: unknown, code: string, message: string, minLen = 1): string {
  if (typeof value !== 'string' || value.trim().length < minLen) {
    throw new Mvp01Error(400, code, message);
  }
  return value.trim();
}

function parseJsonSafe<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export class Mvp01DomainService {
  constructor(private readonly db: Mvp01DbLike) {}

  private nowIso(): string {
    return new Date().toISOString();
  }

  private async authorizeAndAudit(
    ctx: Mvp01Context,
    permission: Mvp01Permission,
    resource?: Mvp01ResourceScope
  ): Promise<void> {
    await ensureMvp01Schema(this.db);
    try {
      authorize(ctx, permission, resource);
    } catch (err) {
      if (err instanceof Mvp01Error && err.code === 'FORBIDDEN_READ_ONLY_ROLE') {
        await this.recordAudit(ctx, {
          action: 'FORBIDDEN_READ_ONLY_WRITE_ATTEMPT',
          resourceType: resource?.resourceType || permission.split('.')[0],
          resourceId:
            resource?.resourceId ||
            resource?.studentId ||
            resource?.classId ||
            resource?.enrollmentId ||
            null,
          reason: `Tentativa de escrita bloqueada para papel somente leitura (${ctx.activeRole}): ${permission}`,
          metadata: { permission, resource: resource ?? null },
        });
      }
      throw err;
    }
  }

  private async rejectIfReadOnlyRole(
    ctx: Mvp01Context,
    permission: Mvp01Permission,
    resource?: Mvp01ResourceScope
  ): Promise<void> {
    if (isDirectorReadOnlyRole(ctx.activeRole) && !permission.endsWith('.read')) {
      await this.authorizeAndAudit(ctx, permission, resource);
    }
  }

  private async recordAudit(
    ctx: Mvp01Context,
    entry: {
      action: string;
      resourceType: string;
      resourceId?: string | null;
      reason?: string | null;
      metadata?: Record<string, unknown>;
    }
  ): Promise<void> {
    await mvp01Run(
      this.db,
      `INSERT INTO mvp01_audit_events
       (id, school_id, user_id, role, action, resource_type, resource_id, reason, metadata_json, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        randomUUID(),
        ctx.schoolId,
        ctx.userId,
        ctx.activeRole,
        entry.action,
        entry.resourceType,
        entry.resourceId ?? null,
        entry.reason ?? null,
        entry.metadata ? JSON.stringify(entry.metadata) : null,
        this.nowIso(),
      ]
    );
  }

  private async recordOutbox(
    schoolId: string,
    eventType: string,
    resourceId: string | null,
    payload: Record<string, unknown>
  ): Promise<void> {
    await mvp01Run(
      this.db,
      `INSERT INTO mvp01_outbox_events
       (id, school_id, event_type, resource_id, payload_json, status, attempts, created_at)
       VALUES (?, ?, ?, ?, ?, 'PENDING', 0, ?)`,
      [randomUUID(), schoolId, eventType, resourceId, JSON.stringify(payload), this.nowIso()]
    );
  }

  private async assertRowInSchool<T extends { school_id: string }>(
    ctx: Mvp01Context,
    sql: string,
    id: string,
    notFoundCode: string,
    notFoundMessage: string
  ): Promise<T> {
    const row = await mvp01Get<T>(this.db, sql, [id]);
    if (!row) {
      throw new Mvp01Error(404, notFoundCode, notFoundMessage);
    }
    if (row.school_id !== ctx.schoolId) {
      authorize(ctx, 'school.read', { schoolId: row.school_id });
    }
    return row;
  }

  /**
   * Executa operação transacional garantindo idempotência por idempotency_key + fingerprint.
   */
  public async runIdempotent<T>(
    ctx: Mvp01Context,
    operation: string,
    idempotencyKey: string,
    fingerprintInput: unknown,
    work: () => Promise<T>
  ): Promise<T> {
    await ensureMvp01Schema(this.db);
    const key = assertNonEmptyString(
      idempotencyKey,
      'INVALID_IDEMPOTENCY_KEY',
      'idempotencyKey é obrigatório.'
    );
    const fingerprint = hashFingerprint(fingerprintInput);

    return await withMvp01Transaction(this.db, async () => {
      const existing = await mvp01Get<any>(
        this.db,
        `SELECT school_id, operation, fingerprint, response_json
         FROM mvp01_idempotency_operations
         WHERE idempotency_key = ?`,
        [key]
      );

      if (existing) {
        if (
          existing.school_id !== ctx.schoolId ||
          existing.operation !== operation ||
          existing.fingerprint !== fingerprint
        ) {
          throw new Mvp01Error(
            409,
            'IDEMPOTENCY_CONFLICT',
            'Chave de idempotência já utilizada com operação ou conteúdo diferente.'
          );
        }
        return JSON.parse(existing.response_json) as T;
      }

      const result = await work();

      await mvp01Run(
        this.db,
        `INSERT INTO mvp01_idempotency_operations
         (idempotency_key, school_id, user_id, operation, fingerprint, response_json, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [key, ctx.schoolId, ctx.userId, operation, fingerprint, JSON.stringify(result), this.nowIso()]
      );

      return result;
    });
  }

  // ---------------------------------------------------------------------------
  // MATRÍCULAS, ENTURLAÇÃO E TRANSFERÊNCIA
  // ---------------------------------------------------------------------------

  public async saveEnrollmentDraft(
    ctx: Mvp01Context,
    input: {
      id?: string;
      studentId?: string | null;
      studentName: string;
      academicYearId: string;
      stage?: string | null;
      classId?: string | null;
      status?: 'RASCUNHO' | 'EM_CONFERENCIA' | 'CANCELADA';
      docStatus?: 'PENDENTE' | 'EM_ANALISE' | 'ACEITA' | 'RECUSADA';
      docChecklist?: Record<string, unknown> | null;
      payload?: Record<string, unknown> | null;
      expectedVersion?: number;
    }
  ) {
    const permission: Mvp01Permission = input.id ? 'enrollment.update' : 'enrollment.create';
    await this.authorizeAndAudit(ctx, permission, {
      schoolId: ctx.schoolId,
      classId: input.classId ?? undefined,
      resourceType: 'enrollment_draft',
      resourceId: input.id,
    });

    const studentName = assertNonEmptyString(
      input.studentName,
      'INVALID_STUDENT_NAME',
      'Nome do estudante é obrigatório.'
    );
    const academicYearId = assertNonEmptyString(
      input.academicYearId,
      'INVALID_ACADEMIC_YEAR',
      'Ano letivo é obrigatório.'
    );
    const status = input.status || 'RASCUNHO';
    if (!['RASCUNHO', 'EM_CONFERENCIA', 'CANCELADA'].includes(status)) {
      throw new Mvp01Error(400, 'INVALID_DRAFT_STATUS', 'Status inválido para rascunho de matrícula.');
    }
    const docStatus = input.docStatus || 'PENDENTE';
    if (!['PENDENTE', 'EM_ANALISE', 'ACEITA', 'RECUSADA'].includes(docStatus)) {
      throw new Mvp01Error(400, 'INVALID_DOC_STATUS', 'Status documental inválido.');
    }

    await this.assertRowInSchool<any>(
      ctx,
      'SELECT * FROM mvp01_academic_years WHERE id = ?',
      academicYearId,
      'ACADEMIC_YEAR_NOT_FOUND',
      'Ano letivo não encontrado.'
    );

    if (input.classId) {
      const cls = await this.assertRowInSchool<any>(
        ctx,
        'SELECT * FROM mvp01_classes WHERE id = ?',
        input.classId,
        'CLASS_NOT_FOUND',
        'Turma informada não encontrada.'
      );
      if (cls.academic_year_id !== academicYearId) {
        throw new Mvp01Error(409, 'INCOMPATIBLE_CLASS_YEAR', 'Turma pertence a outro ano letivo.');
      }
    }

    if (input.studentId) {
      await this.assertRowInSchool<any>(
        ctx,
        'SELECT id, school_id FROM mvp01_students WHERE id = ?',
        input.studentId,
        'STUDENT_NOT_FOUND',
        'Estudante informado não encontrado.'
      );
    }

    return await withMvp01Transaction(this.db, async () => {
      const now = this.nowIso();
      if (input.id) {
        const existing = await this.assertRowInSchool<any>(
          ctx,
          'SELECT * FROM mvp01_enrollment_drafts WHERE id = ?',
          input.id,
          'DRAFT_NOT_FOUND',
          'Rascunho de matrícula não encontrado.'
        );
        if (existing.status === 'CONFIRMADA' || existing.status === 'CANCELADA') {
          throw new Mvp01Error(409, 'DRAFT_ALREADY_FINALIZED', 'Rascunho já finalizado não pode ser editado.');
        }
        if (input.expectedVersion !== undefined && existing.version !== input.expectedVersion) {
          throw new Mvp01Error(409, 'VERSION_CONFLICT', 'Conflito de versão ao atualizar rascunho.');
        }

        const nextVersion = existing.version + 1;
        await mvp01Run(
          this.db,
          `UPDATE mvp01_enrollment_drafts
           SET student_id = ?, student_name = ?, academic_year_id = ?, stage = ?, class_id = ?,
               status = ?, doc_status = ?, doc_checklist_json = ?, payload_json = ?,
               version = ?, updated_by = ?, updated_at = ?
           WHERE id = ?`,
          [
            input.studentId !== undefined ? input.studentId : existing.student_id,
            studentName,
            academicYearId,
            input.stage !== undefined ? input.stage : existing.stage,
            input.classId !== undefined ? input.classId : existing.class_id,
            status,
            docStatus,
            input.docChecklist !== undefined
              ? JSON.stringify(input.docChecklist)
              : existing.doc_checklist_json,
            input.payload !== undefined ? JSON.stringify(input.payload) : existing.payload_json,
            nextVersion,
            ctx.userId,
            now,
            existing.id,
          ]
        );

        await this.recordAudit(ctx, {
          action: 'ENROLLMENT_DRAFT_UPDATED',
          resourceType: 'enrollment_draft',
          resourceId: existing.id,
          metadata: { version: nextVersion, status, docStatus },
        });
        return await mvp01Get(this.db, 'SELECT * FROM mvp01_enrollment_drafts WHERE id = ?', [existing.id]);
      }

      const id = `draft-${randomUUID()}`;
      await mvp01Run(
        this.db,
        `INSERT INTO mvp01_enrollment_drafts
         (id, school_id, student_id, student_name, academic_year_id, stage, class_id, status, doc_status, doc_checklist_json, payload_json, version, updated_by, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`,
        [
          id,
          ctx.schoolId,
          input.studentId ?? null,
          studentName,
          academicYearId,
          input.stage ?? null,
          input.classId ?? null,
          status,
          docStatus,
          input.docChecklist ? JSON.stringify(input.docChecklist) : null,
          input.payload ? JSON.stringify(input.payload) : null,
          ctx.userId,
          now,
        ]
      );

      await this.recordAudit(ctx, {
        action: 'ENROLLMENT_DRAFT_CREATED',
        resourceType: 'enrollment_draft',
        resourceId: id,
        metadata: { status, docStatus },
      });

      return await mvp01Get(this.db, 'SELECT * FROM mvp01_enrollment_drafts WHERE id = ?', [id]);
    });
  }

  public async validateEnrollmentDraft(ctx: Mvp01Context, input: { draftId: string }) {
    await this.authorizeAndAudit(ctx, 'enrollment.read', {
      schoolId: ctx.schoolId,
      resourceType: 'enrollment_draft',
      resourceId: input.draftId,
    });

    const draft = await this.assertRowInSchool<any>(
      ctx,
      'SELECT * FROM mvp01_enrollment_drafts WHERE id = ?',
      input.draftId,
      'DRAFT_NOT_FOUND',
      'Rascunho de matrícula não encontrado.'
    );

    const blockingIssues: string[] = [];
    const warnings: string[] = [];

    const ay = await mvp01Get<any>(
      this.db,
      'SELECT * FROM mvp01_academic_years WHERE id = ? AND school_id = ?',
      [draft.academic_year_id, ctx.schoolId]
    );
    if (!ay || ay.status !== 'OPEN') {
      blockingIssues.push('Ano letivo não está aberto para matrículas.');
    }

    if (!draft.class_id) {
      blockingIssues.push('Nenhuma turma selecionada para enturmação.');
    } else {
      const cls = await mvp01Get<any>(
        this.db,
        'SELECT * FROM mvp01_classes WHERE id = ? AND school_id = ?',
        [draft.class_id, ctx.schoolId]
      );
      if (!cls || cls.status !== 'ACTIVE') {
        blockingIssues.push('Turma selecionada não está ativa.');
      } else {
        const countRow = await mvp01Get<{ total: number }>(
          this.db,
          'SELECT COUNT(*) as total FROM mvp01_class_memberships WHERE school_id = ? AND class_id = ? AND ended_at IS NULL',
          [ctx.schoolId, cls.id]
        );
        if ((countRow?.total ?? 0) >= cls.capacity) {
          blockingIssues.push(`Turma ${cls.name} atingiu a capacidade máxima (${cls.capacity}).`);
        }
      }
    }

    if (draft.doc_status === 'RECUSADA') {
      blockingIssues.push('Documentação obrigatória foi recusada.');
    } else if (draft.doc_status !== 'ACEITA') {
      warnings.push(`Documentação com status '${draft.doc_status}'.`);
    }

    if (draft.student_id) {
      const dup = await mvp01Get<any>(
        this.db,
        `SELECT id FROM mvp01_enrollments
         WHERE school_id = ? AND student_id = ? AND academic_year_id = ? AND status = 'ATIVA'`,
        [ctx.schoolId, draft.student_id, draft.academic_year_id]
      );
      if (dup) {
        blockingIssues.push('Estudante já possui matrícula ATIVA neste ano letivo.');
      }
    }

    return {
      valid: blockingIssues.length === 0,
      blockingIssues,
      warnings,
      draft,
    };
  }

  public async confirmEnrollmentDraft(
    ctx: Mvp01Context,
    input: { draftId: string; expectedVersion: number; idempotencyKey: string }
  ) {
    await this.authorizeAndAudit(ctx, 'enrollment.confirm', {
      schoolId: ctx.schoolId,
      resourceType: 'enrollment_draft',
      resourceId: input.draftId,
    });

    const draftId = assertNonEmptyString(input.draftId, 'INVALID_DRAFT_ID', 'draftId é obrigatório.');
    if (!Number.isInteger(input.expectedVersion) || input.expectedVersion < 1) {
      throw new Mvp01Error(400, 'INVALID_EXPECTED_VERSION', 'expectedVersion inválido.');
    }

    return await this.runIdempotent(
      ctx,
      'confirmEnrollmentDraft',
      input.idempotencyKey,
      { draftId, expectedVersion: input.expectedVersion },
      async () => {
        const draft = await this.assertRowInSchool<any>(
          ctx,
          'SELECT * FROM mvp01_enrollment_drafts WHERE id = ?',
          draftId,
          'DRAFT_NOT_FOUND',
          'Rascunho de matrícula não encontrado.'
        );

        if (draft.status === 'CONFIRMADA' || draft.status === 'CANCELADA') {
          throw new Mvp01Error(409, 'DRAFT_ALREADY_FINALIZED', 'Rascunho já processado.');
        }
        if (draft.version !== input.expectedVersion) {
          throw new Mvp01Error(
            409,
            'VERSION_CONFLICT',
            `Conflito de versão: esperado ${input.expectedVersion}, atual ${draft.version}.`
          );
        }
        if (draft.doc_status === 'RECUSADA') {
          throw new Mvp01Error(409, 'DOCUMENTS_REJECTED', 'Não é possível confirmar matrícula com documentação recusada.');
        }
        if (!draft.class_id) {
          throw new Mvp01Error(400, 'DRAFT_CLASS_REQUIRED', 'Turma é obrigatória para confirmar matrícula.');
        }

        const ay = await this.assertRowInSchool<any>(
          ctx,
          'SELECT * FROM mvp01_academic_years WHERE id = ?',
          draft.academic_year_id,
          'ACADEMIC_YEAR_NOT_FOUND',
          'Ano letivo não encontrado.'
        );
        if (ay.status !== 'OPEN') {
          throw new Mvp01Error(409, 'ACADEMIC_YEAR_CLOSED', 'Ano letivo não está aberto.');
        }

        const cls = await this.assertRowInSchool<any>(
          ctx,
          'SELECT * FROM mvp01_classes WHERE id = ?',
          draft.class_id,
          'CLASS_NOT_FOUND',
          'Turma não encontrada.'
        );
        if (cls.status !== 'ACTIVE') {
          throw new Mvp01Error(409, 'CLASS_INACTIVE', 'Turma não está ativa para matrícula.');
        }

        const occupancy = await mvp01Get<{ total: number }>(
          this.db,
          `SELECT COUNT(*) as total
           FROM mvp01_class_memberships
           WHERE school_id = ? AND class_id = ? AND ended_at IS NULL`,
          [ctx.schoolId, cls.id]
        );
        if ((occupancy?.total ?? 0) >= cls.capacity) {
          throw new Mvp01Error(
            409,
            'CLASS_CAPACITY_EXCEEDED',
            `Capacidade máxima da turma (${cls.capacity}) atingida.`
          );
        }

        const now = this.nowIso();
        let studentId: string = draft.student_id;

        if (!studentId) {
          studentId = `stu-${randomUUID()}`;
          const payload = parseJsonSafe<Record<string, any>>(draft.payload_json, {});
          await mvp01Run(
            this.db,
            `INSERT INTO mvp01_students
             (id, school_id, user_id, full_name, birth_date, registration_code, photo_url, health_summary_restricted, allergies, pickup_notes, is_demo, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)`,
            [
              studentId,
              ctx.schoolId,
              payload.userId ?? null,
              draft.student_name,
              payload.birthDate ?? null,
              payload.registrationCode ?? `AQ-${Date.now().toString().slice(-6)}`,
              payload.photoUrl ?? null,
              payload.healthSummaryRestricted ?? null,
              payload.allergies ?? null,
              payload.pickupNotes ?? null,
              now,
            ]
          );
        } else {
          await this.assertRowInSchool<any>(
            ctx,
            'SELECT id, school_id FROM mvp01_students WHERE id = ?',
            studentId,
            'STUDENT_NOT_FOUND',
            'Estudante vinculado ao rascunho não encontrado.'
          );
        }

        const activeDup = await mvp01Get<any>(
          this.db,
          `SELECT id FROM mvp01_enrollments
           WHERE school_id = ? AND student_id = ? AND academic_year_id = ? AND status = 'ATIVA'`,
          [ctx.schoolId, studentId, draft.academic_year_id]
        );
        if (activeDup) {
          throw new Mvp01Error(
            409,
            'DUPLICATE_ACTIVE_ENROLLMENT',
            'Estudante já possui matrícula ativa neste ano letivo.'
          );
        }

        const enrollmentId = `enr-${randomUUID()}`;
        const classMembershipId = `cm-${randomUUID()}`;
        const nextVersion = draft.version + 1;

        await mvp01Run(
          this.db,
          `INSERT INTO mvp01_enrollments (id, school_id, student_id, academic_year_id, status, created_at, version)
           VALUES (?, ?, ?, ?, 'ATIVA', ?, 1)`,
          [enrollmentId, ctx.schoolId, studentId, draft.academic_year_id, now]
        );

        await mvp01Run(
          this.db,
          `INSERT INTO mvp01_class_memberships (id, school_id, enrollment_id, class_id, reason, started_at, ended_at)
           VALUES (?, ?, ?, ?, 'MATRICULA_INICIAL', ?, NULL)`,
          [classMembershipId, ctx.schoolId, enrollmentId, cls.id, now]
        );

        await mvp01Run(
          this.db,
          `UPDATE mvp01_enrollment_drafts
           SET status = 'CONFIRMADA', student_id = ?, confirmed_enrollment_id = ?, version = ?, updated_by = ?, updated_at = ?
           WHERE id = ?`,
          [studentId, enrollmentId, nextVersion, ctx.userId, now, draft.id]
        );

        await this.recordAudit(ctx, {
          action: 'ENROLLMENT_CONFIRMED',
          resourceType: 'enrollment',
          resourceId: enrollmentId,
          metadata: { draftId: draft.id, studentId, classId: cls.id, academicYearId: draft.academic_year_id },
        });

        await this.recordOutbox(ctx.schoolId, 'mvp01.enrollment.confirmed', enrollmentId, {
          enrollmentId,
          studentId,
          classId: cls.id,
          academicYearId: draft.academic_year_id,
        });

        return {
          success: true,
          enrollmentId,
          classMembershipId,
          studentId,
          draftId: draft.id,
          classId: cls.id,
          version: nextVersion,
        };
      }
    );
  }

  public async transferStudentClass(
    ctx: Mvp01Context,
    input: {
      enrollmentId: string;
      targetClassId: string;
      reason: string;
      idempotencyKey: string;
    }
  ) {
    await this.authorizeAndAudit(ctx, 'enrollment.transfer', {
      schoolId: ctx.schoolId,
      enrollmentId: input.enrollmentId,
      classId: input.targetClassId,
      resourceType: 'enrollment',
      resourceId: input.enrollmentId,
    });

    const enrollmentId = assertNonEmptyString(input.enrollmentId, 'INVALID_ENROLLMENT_ID', 'enrollmentId é obrigatório.');
    const targetClassId = assertNonEmptyString(input.targetClassId, 'INVALID_CLASS_ID', 'targetClassId é obrigatório.');
    const reason = assertNonEmptyString(
      input.reason,
      'INVALID_TRANSFER_REASON',
      'Motivo da transferência deve ter ao menos 3 caracteres.',
      3
    );

    return await this.runIdempotent(
      ctx,
      'transferStudentClass',
      input.idempotencyKey,
      { enrollmentId, targetClassId, reason },
      async () => {
        const enrollment = await this.assertRowInSchool<any>(
          ctx,
          'SELECT * FROM mvp01_enrollments WHERE id = ?',
          enrollmentId,
          'ENROLLMENT_NOT_FOUND',
          'Matrícula não encontrada.'
        );
        if (enrollment.status !== 'ATIVA') {
          throw new Mvp01Error(409, 'ENROLLMENT_NOT_ACTIVE', 'Apenas matrículas ativas podem ser transferidas de turma.');
        }

        const targetClass = await this.assertRowInSchool<any>(
          ctx,
          'SELECT * FROM mvp01_classes WHERE id = ?',
          targetClassId,
          'CLASS_NOT_FOUND',
          'Turma de destino não encontrada.'
        );
        if (targetClass.status !== 'ACTIVE') {
          throw new Mvp01Error(409, 'CLASS_INACTIVE', 'Turma de destino não está ativa.');
        }
        if (targetClass.academic_year_id !== enrollment.academic_year_id) {
          throw new Mvp01Error(409, 'INCOMPATIBLE_CLASS_YEAR', 'Turma de destino pertence a outro ano letivo.');
        }

        const currentMembership = await mvp01Get<any>(
          this.db,
          `SELECT * FROM mvp01_class_memberships
           WHERE school_id = ? AND enrollment_id = ? AND ended_at IS NULL`,
          [ctx.schoolId, enrollment.id]
        );
        if (currentMembership && currentMembership.class_id === targetClassId) {
          throw new Mvp01Error(409, 'SAME_CLASS_TRANSFER', 'Estudante já pertence à turma de destino.');
        }

        const occupancy = await mvp01Get<{ total: number }>(
          this.db,
          `SELECT COUNT(*) as total
           FROM mvp01_class_memberships
           WHERE school_id = ? AND class_id = ? AND ended_at IS NULL`,
          [ctx.schoolId, targetClass.id]
        );
        if ((occupancy?.total ?? 0) >= targetClass.capacity) {
          throw new Mvp01Error(
            409,
            'CLASS_CAPACITY_EXCEEDED',
            `Turma de destino atingiu capacidade máxima (${targetClass.capacity}).`
          );
        }

        const now = this.nowIso();
        if (currentMembership) {
          await mvp01Run(
            this.db,
            'UPDATE mvp01_class_memberships SET ended_at = ? WHERE id = ?',
            [now, currentMembership.id]
          );
        }

        const newMembershipId = `cm-${randomUUID()}`;
        await mvp01Run(
          this.db,
          `INSERT INTO mvp01_class_memberships (id, school_id, enrollment_id, class_id, reason, started_at, ended_at)
           VALUES (?, ?, ?, ?, ?, ?, NULL)`,
          [newMembershipId, ctx.schoolId, enrollment.id, targetClass.id, reason, now]
        );

        await mvp01Run(
          this.db,
          'UPDATE mvp01_enrollments SET version = version + 1 WHERE id = ?',
          [enrollment.id]
        );

        await this.recordAudit(ctx, {
          action: 'STUDENT_CLASS_TRANSFERRED',
          resourceType: 'enrollment',
          resourceId: enrollment.id,
          reason,
          metadata: {
            previousClassId: currentMembership?.class_id ?? null,
            targetClassId: targetClass.id,
            newMembershipId,
          },
        });

        await this.recordOutbox(ctx.schoolId, 'mvp01.enrollment.transferred', enrollment.id, {
          enrollmentId: enrollment.id,
          studentId: enrollment.student_id,
          previousClassId: currentMembership?.class_id ?? null,
          targetClassId: targetClass.id,
          reason,
        });

        return {
          success: true,
          enrollmentId: enrollment.id,
          previousClassId: currentMembership?.class_id ?? null,
          targetClassId: targetClass.id,
          newMembershipId,
        };
      }
    );
  }

  public async saveClassAssignment(
    ctx: Mvp01Context,
    input: {
      classData?: {
        id?: string;
        academicYearId: string;
        stage?: string;
        name: string;
        shift?: string;
        room?: string;
        capacity: number;
        status?: 'DRAFT' | 'ACTIVE' | 'CLOSED';
      };
      teachingAssignment?: {
        id?: string;
        teacherUserId: string;
        teacherName?: string;
        classId: string;
        subject: string;
        academicYearId?: string;
        validFrom?: string;
        validUntil?: string;
        active?: boolean | number;
      };
      coordinationAssignment?: {
        id?: string;
        coordinatorUserId: string;
        classId?: string | null;
        stage?: string | null;
        active?: boolean | number;
      };
    }
  ) {
    await this.rejectIfReadOnlyRole(ctx, 'class.update', {
      schoolId: ctx.schoolId,
      classId: input.classData?.id ?? input.teachingAssignment?.classId ?? input.coordinationAssignment?.classId ?? undefined,
      resourceType: 'class_assignment',
    });
    if (!input.classData && !input.teachingAssignment && !input.coordinationAssignment) {
      throw new Mvp01Error(400, 'INVALID_PAYLOAD', 'Informe turma, vínculo docente ou vínculo de coordenação.');
    }

    if (input.classData) {
      await this.authorizeAndAudit(ctx, input.classData.id ? 'class.update' : 'class.create', {
        schoolId: ctx.schoolId,
        classId: input.classData.id,
        resourceType: 'class',
        resourceId: input.classData.id,
      });
      if (!Number.isInteger(input.classData.capacity) || input.classData.capacity <= 0) {
        throw new Mvp01Error(400, 'INVALID_CAPACITY', 'Capacidade da turma deve ser maior que zero.');
      }
      assertNonEmptyString(input.classData.name, 'INVALID_CLASS_NAME', 'Nome da turma é obrigatório.');
      await this.assertRowInSchool<any>(
        ctx,
        'SELECT * FROM mvp01_academic_years WHERE id = ?',
        input.classData.academicYearId,
        'ACADEMIC_YEAR_NOT_FOUND',
        'Ano letivo não encontrado.'
      );
    }

    if (input.teachingAssignment) {
      await this.authorizeAndAudit(
        ctx,
        input.teachingAssignment.id ? 'teaching_assignment.update' : 'teaching_assignment.create',
        {
          schoolId: ctx.schoolId,
          classId: input.teachingAssignment.classId,
          subject: input.teachingAssignment.subject,
          resourceType: 'teaching_assignment',
          resourceId: input.teachingAssignment.id,
        }
      );
      assertNonEmptyString(input.teachingAssignment.teacherUserId, 'INVALID_TEACHER_ID', 'Docente obrigatório.');
      assertNonEmptyString(input.teachingAssignment.subject, 'INVALID_SUBJECT', 'Disciplina obrigatória.');
    }

    if (input.coordinationAssignment) {
      await this.authorizeAndAudit(ctx, 'coordination_assignment.update', {
        schoolId: ctx.schoolId,
        classId: input.coordinationAssignment.classId ?? undefined,
        resourceType: 'coordination_assignment',
        resourceId: input.coordinationAssignment.id,
      });
      assertNonEmptyString(
        input.coordinationAssignment.coordinatorUserId,
        'INVALID_COORDINATOR_ID',
        'Coordenador obrigatório.'
      );
    }

    return await withMvp01Transaction(this.db, async () => {
      let savedClassId = input.classData?.id ?? null;

      if (input.classData) {
        const cls = input.classData;
        savedClassId = cls.id || `class-${randomUUID()}`;
        const existing = cls.id
          ? await mvp01Get<any>(this.db, 'SELECT * FROM mvp01_classes WHERE id = ?', [cls.id])
          : null;
        if (existing && existing.school_id !== ctx.schoolId) {
          authorize(ctx, 'school.read', { schoolId: existing.school_id });
        }

        if (existing) {
          await mvp01Run(
            this.db,
            `UPDATE mvp01_classes
             SET academic_year_id = ?, stage = ?, name = ?, shift = ?, room = ?, capacity = ?, status = ?
             WHERE id = ?`,
            [
              cls.academicYearId,
              cls.stage ?? existing.stage,
              cls.name.trim(),
              cls.shift ?? existing.shift,
              cls.room ?? existing.room,
              cls.capacity,
              cls.status || existing.status,
              existing.id,
            ]
          );
        } else {
          await mvp01Run(
            this.db,
            `INSERT INTO mvp01_classes (id, school_id, academic_year_id, stage, name, shift, room, capacity, status)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              savedClassId,
              ctx.schoolId,
              cls.academicYearId,
              cls.stage ?? null,
              cls.name.trim(),
              cls.shift ?? null,
              cls.room ?? null,
              cls.capacity,
              cls.status || 'ACTIVE',
            ]
          );
        }
        await this.recordAudit(ctx, {
          action: existing ? 'CLASS_UPDATED' : 'CLASS_CREATED',
          resourceType: 'class',
          resourceId: savedClassId,
        });
      }

      let teachingAssignmentId: string | null = null;
      if (input.teachingAssignment) {
        const ta = input.teachingAssignment;
        await this.assertRowInSchool<any>(
          ctx,
          'SELECT id, school_id FROM mvp01_classes WHERE id = ?',
          ta.classId,
          'CLASS_NOT_FOUND',
          'Turma do vínculo docente não encontrada.'
        );

        teachingAssignmentId = ta.id || `ta-${randomUUID()}`;
        const existingTa = ta.id
          ? await mvp01Get<any>(this.db, 'SELECT * FROM mvp01_teaching_assignments WHERE id = ?', [ta.id])
          : null;
        if (existingTa && existingTa.school_id !== ctx.schoolId) {
          authorize(ctx, 'school.read', { schoolId: existingTa.school_id });
        }
        const activeInt = ta.active === false || ta.active === 0 ? 0 : 1;

        if (existingTa) {
          await mvp01Run(
            this.db,
            `UPDATE mvp01_teaching_assignments
             SET teacher_user_id = ?, teacher_name = ?, class_id = ?, subject = ?, academic_year_id = ?, valid_from = ?, valid_until = ?, active = ?
             WHERE id = ?`,
            [
              ta.teacherUserId,
              ta.teacherName ?? existingTa.teacher_name,
              ta.classId,
              ta.subject.trim(),
              ta.academicYearId ?? existingTa.academic_year_id,
              ta.validFrom ?? existingTa.valid_from,
              ta.validUntil ?? existingTa.valid_until,
              activeInt,
              existingTa.id,
            ]
          );
        } else {
          await mvp01Run(
            this.db,
            `INSERT INTO mvp01_teaching_assignments
             (id, school_id, teacher_user_id, teacher_name, class_id, subject, academic_year_id, valid_from, valid_until, active)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              teachingAssignmentId,
              ctx.schoolId,
              ta.teacherUserId,
              ta.teacherName ?? null,
              ta.classId,
              ta.subject.trim(),
              ta.academicYearId ?? null,
              ta.validFrom ?? null,
              ta.validUntil ?? null,
              activeInt,
            ]
          );
        }

        await this.recordAudit(ctx, {
          action: existingTa ? 'TEACHING_ASSIGNMENT_UPDATED' : 'TEACHING_ASSIGNMENT_CREATED',
          resourceType: 'teaching_assignment',
          resourceId: teachingAssignmentId,
          metadata: { teacherUserId: ta.teacherUserId, classId: ta.classId, subject: ta.subject, active: activeInt },
        });
      }

      let coordinationAssignmentId: string | null = null;
      if (input.coordinationAssignment) {
        const ca = input.coordinationAssignment;
        if (ca.classId) {
          await this.assertRowInSchool<any>(
            ctx,
            'SELECT id, school_id FROM mvp01_classes WHERE id = ?',
            ca.classId,
            'CLASS_NOT_FOUND',
            'Turma da coordenação não encontrada.'
          );
        }
        coordinationAssignmentId = ca.id || `ca-${randomUUID()}`;
        const existingCa = ca.id
          ? await mvp01Get<any>(this.db, 'SELECT * FROM mvp01_coordination_assignments WHERE id = ?', [ca.id])
          : null;
        if (existingCa && existingCa.school_id !== ctx.schoolId) {
          authorize(ctx, 'school.read', { schoolId: existingCa.school_id });
        }
        const activeInt = ca.active === false || ca.active === 0 ? 0 : 1;

        if (existingCa) {
          await mvp01Run(
            this.db,
            `UPDATE mvp01_coordination_assignments
             SET coordinator_user_id = ?, class_id = ?, stage = ?, active = ?
             WHERE id = ?`,
            [ca.coordinatorUserId, ca.classId ?? null, ca.stage ?? null, activeInt, existingCa.id]
          );
        } else {
          await mvp01Run(
            this.db,
            `INSERT INTO mvp01_coordination_assignments
             (id, school_id, coordinator_user_id, class_id, stage, active)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [coordinationAssignmentId, ctx.schoolId, ca.coordinatorUserId, ca.classId ?? null, ca.stage ?? null, activeInt]
          );
        }
        await this.recordAudit(ctx, {
          action: 'COORDINATION_ASSIGNMENT_SAVED',
          resourceType: 'coordination_assignment',
          resourceId: coordinationAssignmentId,
        });
      }

      return {
        success: true,
        classId: savedClassId,
        teachingAssignmentId,
        coordinationAssignmentId,
      };
    });
  }

  public async saveGuardianLink(
    ctx: Mvp01Context,
    input: {
      id?: string;
      guardianUserId: string;
      guardianName?: string;
      guardianPhone?: string;
      guardianEmail?: string;
      studentId: string;
      relationship?: string;
      isLegalGuardian?: boolean | number;
      canViewPortal?: boolean | number;
      isEmergencyContact?: boolean | number;
      canPickup?: boolean | number;
      isFinancialResponsible?: boolean | number;
      hasJudicialRestriction?: boolean | number;
    }
  ) {
    await this.authorizeAndAudit(ctx, input.id ? 'guardian.update' : 'guardian.create', {
      schoolId: ctx.schoolId,
      studentId: input.studentId,
      resourceType: 'guardian_link',
      resourceId: input.id,
    });

    assertNonEmptyString(input.guardianUserId, 'INVALID_GUARDIAN_ID', 'guardianUserId obrigatório.');
    await this.assertRowInSchool<any>(
      ctx,
      'SELECT id, school_id FROM mvp01_students WHERE id = ?',
      input.studentId,
      'STUDENT_NOT_FOUND',
      'Estudante não encontrado.'
    );

    const hasRestriction = input.hasJudicialRestriction ? 1 : 0;
    const canViewPortal = hasRestriction ? 0 : input.canViewPortal ? 1 : 0;
    const canPickup = hasRestriction ? 0 : input.canPickup ? 1 : 0;

    return await withMvp01Transaction(this.db, async () => {
      const now = this.nowIso();
      if (input.id) {
        const existing = await this.assertRowInSchool<any>(
          ctx,
          'SELECT * FROM mvp01_guardian_student_links WHERE id = ?',
          input.id,
          'GUARDIAN_LINK_NOT_FOUND',
          'Vínculo familiar não encontrado.'
        );
        await mvp01Run(
          this.db,
          `UPDATE mvp01_guardian_student_links
           SET guardian_user_id = ?, guardian_name = ?, guardian_phone = ?, guardian_email = ?,
               student_id = ?, relationship = ?, is_legal_guardian = ?, can_view_portal = ?,
               is_emergency_contact = ?, can_pickup = ?, is_financial_responsible = ?,
               has_judicial_restriction = ?
           WHERE id = ?`,
          [
            input.guardianUserId,
            input.guardianName ?? existing.guardian_name,
            input.guardianPhone ?? existing.guardian_phone,
            input.guardianEmail ?? existing.guardian_email,
            input.studentId,
            input.relationship ?? existing.relationship,
            input.isLegalGuardian ? 1 : 0,
            canViewPortal,
            input.isEmergencyContact ? 1 : 0,
            canPickup,
            input.isFinancialResponsible ? 1 : 0,
            hasRestriction,
            existing.id,
          ]
        );
        await this.recordAudit(ctx, {
          action: 'GUARDIAN_LINK_UPDATED',
          resourceType: 'guardian_link',
          resourceId: existing.id,
          metadata: { studentId: input.studentId, canViewPortal, hasRestriction },
        });
        return await mvp01Get(this.db, 'SELECT * FROM mvp01_guardian_student_links WHERE id = ?', [existing.id]);
      }

      const id = `glink-${randomUUID()}`;
      await mvp01Run(
        this.db,
        `INSERT INTO mvp01_guardian_student_links
         (id, school_id, guardian_user_id, guardian_name, guardian_phone, guardian_email, student_id, relationship,
          is_legal_guardian, can_view_portal, is_emergency_contact, can_pickup, is_financial_responsible, has_judicial_restriction, revoked_at, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, ?)`,
        [
          id,
          ctx.schoolId,
          input.guardianUserId,
          input.guardianName ?? null,
          input.guardianPhone ?? null,
          input.guardianEmail ?? null,
          input.studentId,
          input.relationship ?? null,
          input.isLegalGuardian ? 1 : 0,
          canViewPortal,
          input.isEmergencyContact ? 1 : 0,
          canPickup,
          input.isFinancialResponsible ? 1 : 0,
          hasRestriction,
          now,
        ]
      );

      await this.recordAudit(ctx, {
        action: 'GUARDIAN_LINK_CREATED',
        resourceType: 'guardian_link',
        resourceId: id,
        metadata: { studentId: input.studentId, canViewPortal, hasRestriction },
      });
      return await mvp01Get(this.db, 'SELECT * FROM mvp01_guardian_student_links WHERE id = ?', [id]);
    });
  }

  public async revokeGuardianLink(ctx: Mvp01Context, input: { linkId: string; reason?: string }) {
    await this.authorizeAndAudit(ctx, 'guardian.revoke', {
      schoolId: ctx.schoolId,
      resourceType: 'guardian_link',
      resourceId: input.linkId,
    });

    const link = await this.assertRowInSchool<any>(
      ctx,
      'SELECT * FROM mvp01_guardian_student_links WHERE id = ?',
      input.linkId,
      'GUARDIAN_LINK_NOT_FOUND',
      'Vínculo familiar não encontrado.'
    );

    const now = this.nowIso();
    await withMvp01Transaction(this.db, async () => {
      await mvp01Run(
        this.db,
        `UPDATE mvp01_guardian_student_links
         SET revoked_at = ?, can_view_portal = 0, can_pickup = 0
         WHERE id = ?`,
        [now, link.id]
      );
      await this.recordAudit(ctx, {
        action: 'GUARDIAN_LINK_REVOKED',
        resourceType: 'guardian_link',
        resourceId: link.id,
        reason: input.reason ?? 'Revogação administrativa de acesso familiar',
        metadata: { guardianUserId: link.guardian_user_id, studentId: link.student_id },
      });
      await this.recordOutbox(ctx.schoolId, 'mvp01.guardian.revoked', link.id, {
        linkId: link.id,
        guardianUserId: link.guardian_user_id,
        studentId: link.student_id,
      });
    });

    return { success: true, linkId: link.id, revokedAt: now };
  }

  // ---------------------------------------------------------------------------
  // CONSISTÊNCIA OPERACIONAL
  // ---------------------------------------------------------------------------

  public async runConsistencyVerification(ctx: Mvp01Context) {
    await this.authorizeAndAudit(ctx, 'consistency.read', {
      schoolId: ctx.schoolId,
      resourceType: 'consistency',
    });

    const lastRunAt = this.nowIso();
    const items: ConsistencyIssue[] = [];

    const orphanEnrollments = await mvp01All<any>(
      this.db,
      `SELECT e.id, s.full_name
       FROM mvp01_enrollments e
       JOIN mvp01_students s ON s.id = e.student_id
       LEFT JOIN mvp01_class_memberships cm ON cm.enrollment_id = e.id AND cm.ended_at IS NULL
       WHERE e.school_id = ? AND e.status = 'ATIVA' AND cm.id IS NULL`,
      [ctx.schoolId]
    );
    for (const row of orphanEnrollments) {
      items.push({
        id: `cons-enr-noclass-${row.id}`,
        affectedRecord: `Matrícula ${row.id} (${row.full_name})`,
        ruleApplied: 'Toda matrícula ATIVA deve possuir enturmação corrente ativa.',
        severity: 'BLOQUEIO',
        howToFix: 'Enturmar o estudante em uma turma ativa compatível com o ano letivo.',
        responsible: 'Secretaria',
        lastRunAt,
      });
    }

    const overCapClasses = await mvp01All<any>(
      this.db,
      `SELECT c.id, c.name, c.capacity, COUNT(cm.id) as occupied
       FROM mvp01_classes c
       JOIN mvp01_class_memberships cm ON cm.class_id = c.id AND cm.ended_at IS NULL
       WHERE c.school_id = ? AND c.status = 'ACTIVE'
       GROUP BY c.id, c.name, c.capacity
       HAVING COUNT(cm.id) > c.capacity`,
      [ctx.schoolId]
    );
    for (const row of overCapClasses) {
      items.push({
        id: `cons-cap-${row.id}`,
        affectedRecord: `Turma ${row.name} (${row.occupied}/${row.capacity})`,
        ruleApplied: 'Ocupação da turma não pode exceder a capacidade máxima configurada.',
        severity: 'BLOQUEIO',
        howToFix: 'Transferir excedentes ou revisar capacidade física da sala.',
        responsible: 'Secretaria',
        lastRunAt,
      });
    }

    const rejectedDrafts = await mvp01All<any>(
      this.db,
      `SELECT id, student_name FROM mvp01_enrollment_drafts
       WHERE school_id = ? AND status = 'EM_CONFERENCIA' AND doc_status = 'RECUSADA'`,
      [ctx.schoolId]
    );
    for (const row of rejectedDrafts) {
      items.push({
        id: `cons-draft-doc-${row.id}`,
        affectedRecord: `Pré-matrícula ${row.id} (${row.student_name})`,
        ruleApplied: 'Matrícula em conferência com documentação recusada requer regularização.',
        severity: 'BLOQUEIO',
        howToFix: 'Solicitar novo documento à família e atualizar checklist documental.',
        responsible: 'Secretaria',
        lastRunAt,
      });
    }

    const classesWithoutTeacher = await mvp01All<any>(
      this.db,
      `SELECT c.id, c.name
       FROM mvp01_classes c
       LEFT JOIN mvp01_teaching_assignments ta
         ON ta.class_id = c.id AND ta.school_id = c.school_id AND COALESCE(ta.active, 1) = 1
       WHERE c.school_id = ? AND c.status = 'ACTIVE' AND ta.id IS NULL`,
      [ctx.schoolId]
    );
    for (const row of classesWithoutTeacher) {
      items.push({
        id: `cons-noteacher-${row.id}`,
        affectedRecord: `Turma ${row.name}`,
        ruleApplied: 'Turma ativa deve possuir ao menos uma atribuição docente vigente.',
        severity: 'AVISO',
        howToFix: 'Vincular docente responsável na matriz de atribuições.',
        responsible: 'Coordenação',
        lastRunAt,
      });
    }

    const studentsWithoutPortalGuardian = await mvp01All<any>(
      this.db,
      `SELECT s.id, s.full_name
       FROM mvp01_students s
       JOIN mvp01_enrollments e ON e.student_id = s.id AND e.status = 'ATIVA'
       LEFT JOIN mvp01_guardian_student_links g
         ON g.student_id = s.id AND g.school_id = s.school_id
        AND g.can_view_portal = 1 AND g.revoked_at IS NULL AND COALESCE(g.has_judicial_restriction, 0) = 0
       WHERE s.school_id = ? AND g.id IS NULL`,
      [ctx.schoolId]
    );
    for (const row of studentsWithoutPortalGuardian) {
      items.push({
        id: `cons-noguardian-${row.id}`,
        affectedRecord: `Estudante ${row.full_name} (${row.id})`,
        ruleApplied: 'Estudante com matrícula ativa deve ter responsável legal habilitado no portal.',
        severity: 'AVISO',
        howToFix: 'Cadastrar ou habilitar vínculo familiar com permissão de portal.',
        responsible: 'Secretaria',
        lastRunAt,
      });
    }

    const conflictedSheets = await mvp01All<any>(
      this.db,
      `SELECT id, class_id, subject, lesson_date, sync_state
       FROM mvp01_attendance_sheets
       WHERE school_id = ? AND sync_state IN ('CONFLICT', 'PENDING_SYNC')`,
      [ctx.schoolId]
    );
    for (const row of conflictedSheets) {
      items.push({
        id: `cons-sync-${row.id}`,
        affectedRecord: `Chamada ${row.class_id} • ${row.subject} (${row.lesson_date})`,
        ruleApplied: 'Folha de chamada pendente ou em conflito de sincronização.',
        severity: row.sync_state === 'CONFLICT' ? 'BLOQUEIO' : 'AVISO',
        howToFix: 'Revisar versão mais recente e confirmar envio da chamada.',
        responsible: 'Docente',
        lastRunAt,
      });
    }

    const blockingCount = items.filter((i) => i.severity === 'BLOQUEIO').length;
    const warningCount = items.filter((i) => i.severity === 'AVISO').length;

    return {
      runAt: lastRunAt,
      totalIssues: items.length,
      blockingCount,
      warningCount,
      items,
    };
  }

  // ---------------------------------------------------------------------------
  // FREQUÊNCIA, DIÁRIO E JUSTIFICATIVAS DE FALTA
  // ---------------------------------------------------------------------------

  public async recordAttendanceSheet(
    ctx: Mvp01Context,
    input: {
      sheetId?: string;
      classId: string;
      subject: string;
      lessonDate: string;
      lessonTopic?: string;
      homeworkNote?: string;
      expectedVersion?: number;
      syncState?: 'LOCAL_SAVED' | 'PENDING_SYNC' | 'SERVER_CONFIRMED' | 'CONFLICT';
      correctionReason?: string;
      finalized?: boolean;
      idempotencyKey?: string;
      records: Array<{
        enrollmentId: string;
        studentId: string;
        status: 'PRESENT' | 'ABSENT' | 'LATE' | 'JUSTIFIED';
        correctionReason?: string;
      }>;
    }
  ) {
    await this.rejectIfReadOnlyRole(ctx, 'attendance.record', {
      schoolId: ctx.schoolId,
      classId: input.classId,
      subject: input.subject,
      resourceType: 'attendance_sheet',
      resourceId: input.sheetId,
    });
    const classId = assertNonEmptyString(input.classId, 'INVALID_CLASS_ID', 'classId obrigatório.');
    const subject = assertNonEmptyString(input.subject, 'INVALID_SUBJECT', 'Disciplina obrigatória.');
    const lessonDate = assertNonEmptyString(input.lessonDate, 'INVALID_LESSON_DATE', 'Data da aula obrigatória.');
    if (!Array.isArray(input.records) || input.records.length === 0) {
      throw new Mvp01Error(400, 'EMPTY_ATTENDANCE_RECORDS', 'Ao menos um registro de frequência é obrigatório.');
    }

    const cls = await this.assertRowInSchool<any>(
      ctx,
      'SELECT * FROM mvp01_classes WHERE id = ?',
      classId,
      'CLASS_NOT_FOUND',
      'Turma não encontrada.'
    );

    const preExistingSheet = input.sheetId
      ? await mvp01Get<any>(this.db, 'SELECT * FROM mvp01_attendance_sheets WHERE id = ?', [input.sheetId])
      : await mvp01Get<any>(
          this.db,
          `SELECT * FROM mvp01_attendance_sheets
           WHERE school_id = ? AND class_id = ? AND subject = ? AND lesson_date = ?`,
          [ctx.schoolId, classId, subject, lessonDate]
        );

    if (preExistingSheet && preExistingSheet.school_id !== ctx.schoolId) {
      authorize(ctx, 'school.read', { schoolId: preExistingSheet.school_id });
    }

    const perm: Mvp01Permission = preExistingSheet ? 'attendance.correct' : 'attendance.record';
    await this.authorizeAndAudit(ctx, perm, {
      schoolId: cls.school_id,
      classId,
      subject,
      resourceType: 'attendance_sheet',
      resourceId: preExistingSheet?.id || input.sheetId,
    });

    const executeSave = async () => {
      const closedPeriod = await mvp01Get<any>(
        this.db,
        `SELECT id, name FROM mvp01_academic_periods
         WHERE school_id = ? AND academic_year_id = ? AND status = 'CLOSED'
           AND start_date IS NOT NULL AND end_date IS NOT NULL
           AND start_date <= ? AND end_date >= ?
         LIMIT 1`,
        [ctx.schoolId, cls.academic_year_id, lessonDate, lessonDate]
      );
      if (closedPeriod) {
        throw new Mvp01Error(
          409,
          'ACADEMIC_PERIOD_CLOSED',
          `Período '${closedPeriod.name}' está fechado para lançamentos nesta data.`
        );
      }

      if (input.syncState === 'CONFLICT') {
        throw new Mvp01Error(409, 'SYNC_CONFLICT', 'Folha marcada em conflito exige reconciliação.');
      }

      const existingSheet = input.sheetId
        ? await mvp01Get<any>(this.db, 'SELECT * FROM mvp01_attendance_sheets WHERE id = ?', [input.sheetId])
        : await mvp01Get<any>(
            this.db,
            `SELECT * FROM mvp01_attendance_sheets
             WHERE school_id = ? AND class_id = ? AND subject = ? AND lesson_date = ?`,
            [ctx.schoolId, classId, subject, lessonDate]
          );

      if (existingSheet && existingSheet.school_id !== ctx.schoolId) {
        authorize(ctx, 'school.read', { schoolId: existingSheet.school_id });
      }
      if (existingSheet && !preExistingSheet) {
        await this.authorizeAndAudit(ctx, 'attendance.correct', {
          schoolId: cls.school_id,
          classId,
          subject,
          resourceType: 'attendance_sheet',
          resourceId: existingSheet.id,
        });
      }

      if (existingSheet) {
        if (input.expectedVersion !== undefined && existingSheet.version !== input.expectedVersion) {
          throw new Mvp01Error(
            409,
            'VERSION_CONFLICT',
            `Conflito de versão na chamada: esperado ${input.expectedVersion}, atual ${existingSheet.version}.`
          );
        }
        const existingRecords = await mvp01Get<{ total: number }>(
          this.db,
          'SELECT COUNT(*) as total FROM mvp01_attendance_records WHERE sheet_id = ?',
          [existingSheet.id]
        );
        if ((existingRecords?.total ?? 0) > 0 || existingSheet.finalized === 1) {
          const hasReason =
            (typeof input.correctionReason === 'string' && input.correctionReason.trim().length >= 3) ||
            input.records.every(
              (r) => typeof r.correctionReason === 'string' && r.correctionReason.trim().length >= 3
            );
          if (!hasReason) {
            throw new Mvp01Error(
              400,
              'CORRECTION_REASON_REQUIRED',
              'Justificativa de retificação (mín. 3 caracteres) é obrigatória para alterar chamada existente.'
            );
          }
        }
      }

      for (const rec of input.records) {
        if (!['PRESENT', 'ABSENT', 'LATE', 'JUSTIFIED'].includes(rec.status)) {
          throw new Mvp01Error(400, 'INVALID_ATTENDANCE_STATUS', `Status de frequência inválido: '${rec.status}'.`);
        }
        const enr = await this.assertRowInSchool<any>(
          ctx,
          'SELECT id, school_id, student_id, status FROM mvp01_enrollments WHERE id = ?',
          rec.enrollmentId,
          'ENROLLMENT_NOT_FOUND',
          `Matrícula '${rec.enrollmentId}' não encontrada.`
        );
        if (enr.student_id !== rec.studentId) {
          throw new Mvp01Error(400, 'ENROLLMENT_STUDENT_MISMATCH', 'Matrícula não pertence ao estudante informado.');
        }
        if (enr.status !== 'ATIVA') {
          throw new Mvp01Error(409, 'ENROLLMENT_NOT_ACTIVE', `Matrícula '${rec.enrollmentId}' não está ativa.`);
        }
        const activeInClass = await mvp01Get<any>(
          this.db,
          `SELECT id FROM mvp01_class_memberships
           WHERE school_id = ? AND enrollment_id = ? AND class_id = ? AND ended_at IS NULL`,
          [ctx.schoolId, rec.enrollmentId, classId]
        );
        if (!activeInClass) {
          throw new Mvp01Error(
            409,
            'STUDENT_NOT_IN_CLASS',
            `Matrícula '${rec.enrollmentId}' não possui enturmação ativa nesta turma.`
          );
        }
      }

      const now = this.nowIso();
      const sheetId = existingSheet ? existingSheet.id : input.sheetId || `att-${randomUUID()}`;
      const nextVersion = existingSheet ? existingSheet.version + 1 : 1;
      const syncState = input.syncState || 'SERVER_CONFIRMED';
      const finalizedInt = input.finalized ? 1 : existingSheet?.finalized ?? 0;

      if (existingSheet) {
        await mvp01Run(
          this.db,
          `UPDATE mvp01_attendance_sheets
           SET teacher_user_id = ?, lesson_topic = ?, homework_note = ?, sync_state = ?, version = ?, finalized = ?, updated_at = ?
           WHERE id = ?`,
          [
            ctx.userId,
            input.lessonTopic !== undefined ? input.lessonTopic : existingSheet.lesson_topic,
            input.homeworkNote !== undefined ? input.homeworkNote : existingSheet.homework_note,
            syncState,
            nextVersion,
            finalizedInt,
            now,
            sheetId,
          ]
        );
      } else {
        await mvp01Run(
          this.db,
          `INSERT INTO mvp01_attendance_sheets
           (id, school_id, class_id, subject, lesson_date, teacher_user_id, lesson_topic, homework_note, sync_state, version, finalized, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`,
          [
            sheetId,
            ctx.schoolId,
            classId,
            subject,
            lessonDate,
            ctx.userId,
            input.lessonTopic ?? null,
            input.homeworkNote ?? null,
            syncState,
            finalizedInt,
            now,
          ]
        );
      }

      for (const rec of input.records) {
        const reasonText = rec.correctionReason?.trim() || input.correctionReason?.trim() || null;
        await mvp01Run(
          this.db,
          `INSERT INTO mvp01_attendance_records
           (id, sheet_id, school_id, enrollment_id, student_id, status, correction_reason, updated_by, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON CONFLICT(sheet_id, enrollment_id) DO UPDATE SET
             status = excluded.status,
             correction_reason = COALESCE(excluded.correction_reason, mvp01_attendance_records.correction_reason),
             updated_by = excluded.updated_by,
             updated_at = excluded.updated_at`,
          [
            `attrec-${randomUUID()}`,
            sheetId,
            ctx.schoolId,
            rec.enrollmentId,
            rec.studentId,
            rec.status,
            reasonText,
            ctx.userId,
            now,
          ]
        );
      }

      await this.recordAudit(ctx, {
        action: existingSheet ? 'ATTENDANCE_CORRECTED' : 'ATTENDANCE_RECORDED',
        resourceType: 'attendance_sheet',
        resourceId: sheetId,
        reason: input.correctionReason?.trim() ?? null,
        metadata: { classId, subject, lessonDate, version: nextVersion, count: input.records.length },
      });

      await this.recordOutbox(ctx.schoolId, 'mvp01.attendance.saved', sheetId, {
        sheetId,
        classId,
        subject,
        lessonDate,
        version: nextVersion,
        syncState,
      });

      return {
        success: true,
        sheetId,
        version: nextVersion,
        syncState,
        recordsCount: input.records.length,
      };
    };

    if (input.idempotencyKey) {
      return await this.runIdempotent(ctx, 'recordAttendanceSheet', input.idempotencyKey, input, executeSave);
    }
    return await withMvp01Transaction(this.db, executeSave);
  }

  public async submitAbsenceJustification(
    ctx: Mvp01Context,
    input: {
      studentId: string;
      absenceDate: string;
      reason: string;
      attachmentName?: string;
      attachmentSizeBytes?: number;
    }
  ) {
    await this.authorizeAndAudit(ctx, 'absence_justification.submit', {
      schoolId: ctx.schoolId,
      studentId: input.studentId,
      resourceType: 'absence_justification',
    });

    await this.assertRowInSchool<any>(
      ctx,
      'SELECT id, school_id FROM mvp01_students WHERE id = ?',
      input.studentId,
      'STUDENT_NOT_FOUND',
      'Estudante não encontrado.'
    );
    const absenceDate = assertNonEmptyString(input.absenceDate, 'INVALID_DATE', 'Data da ausência obrigatória.');
    const reason = assertNonEmptyString(
      input.reason,
      'INVALID_REASON',
      'Justificativa deve ter ao menos 5 caracteres.',
      5
    );
    if (input.attachmentSizeBytes !== undefined && input.attachmentSizeBytes > 10 * 1024 * 1024) {
      throw new Mvp01Error(400, 'ATTACHMENT_TOO_LARGE', 'Anexo excede o limite de 10 MB.');
    }

    const id = `just-${randomUUID()}`;
    const now = this.nowIso();

    await withMvp01Transaction(this.db, async () => {
      await mvp01Run(
        this.db,
        `INSERT INTO mvp01_absence_justifications
         (id, school_id, student_id, guardian_user_id, absence_date, reason, attachment_name, attachment_size_bytes, status, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'PENDING_REVIEW', ?)`,
        [
          id,
          ctx.schoolId,
          input.studentId,
          ctx.userId,
          absenceDate,
          reason,
          input.attachmentName ?? null,
          input.attachmentSizeBytes ?? null,
          now,
        ]
      );
      await this.recordAudit(ctx, {
        action: 'ABSENCE_JUSTIFICATION_SUBMITTED',
        resourceType: 'absence_justification',
        resourceId: id,
        metadata: { studentId: input.studentId, absenceDate },
      });
      await this.recordOutbox(ctx.schoolId, 'mvp01.absence_justification.submitted', id, {
        justificationId: id,
        studentId: input.studentId,
        absenceDate,
      });
    });

    return await mvp01Get(this.db, 'SELECT * FROM mvp01_absence_justifications WHERE id = ?', [id]);
  }

  public async reviewAbsenceJustification(
    ctx: Mvp01Context,
    input: { justificationId: string; decision: 'APPROVED' | 'REJECTED'; reviewNote?: string }
  ) {
    await this.rejectIfReadOnlyRole(ctx, 'absence_justification.review', {
      schoolId: ctx.schoolId,
      resourceType: 'absence_justification',
      resourceId: input.justificationId,
    });
    const just = await this.assertRowInSchool<any>(
      ctx,
      'SELECT * FROM mvp01_absence_justifications WHERE id = ?',
      input.justificationId,
      'JUSTIFICATION_NOT_FOUND',
      'Justificativa de falta não encontrada.'
    );

    const activeMembership = await mvp01Get<{ class_id: string }>(
      this.db,
      `SELECT cm.class_id
       FROM mvp01_class_memberships cm
       JOIN mvp01_enrollments e ON e.id = cm.enrollment_id
       WHERE cm.school_id = ? AND e.student_id = ? AND e.status = 'ATIVA' AND cm.ended_at IS NULL
       LIMIT 1`,
      [ctx.schoolId, just.student_id]
    );

    await this.authorizeAndAudit(ctx, 'absence_justification.review', {
      schoolId: just.school_id,
      classId: activeMembership?.class_id,
      studentId: just.student_id,
      resourceType: 'absence_justification',
      resourceId: just.id,
    });

    if (!['APPROVED', 'REJECTED'].includes(input.decision)) {
      throw new Mvp01Error(400, 'INVALID_DECISION', 'Decisão deve ser APPROVED ou REJECTED.');
    }

    const now = this.nowIso();
    await withMvp01Transaction(this.db, async () => {
      const txJust = await mvp01Get<any>(
        this.db,
        'SELECT * FROM mvp01_absence_justifications WHERE id = ?',
        [just.id]
      );
      if (!txJust || txJust.status !== 'PENDING_REVIEW') {
        throw new Mvp01Error(409, 'JUSTIFICATION_ALREADY_REVIEWED', 'Justificativa já analisada.');
      }

      const upd = await mvp01Run(
        this.db,
        `UPDATE mvp01_absence_justifications
         SET status = ?, reviewed_by = ?, review_note = ?, reviewed_at = ?
         WHERE id = ? AND status = 'PENDING_REVIEW'`,
        [input.decision, ctx.userId, input.reviewNote ?? null, now, just.id]
      );
      if ((upd?.changes ?? 0) === 0) {
        throw new Mvp01Error(409, 'JUSTIFICATION_ALREADY_REVIEWED', 'Justificativa já analisada.');
      }

      if (input.decision === 'APPROVED') {
        await mvp01Run(
          this.db,
          `UPDATE mvp01_attendance_records
           SET status = 'JUSTIFIED', correction_reason = ?, updated_by = ?, updated_at = ?
           WHERE school_id = ? AND student_id = ? AND status = 'ABSENT'
             AND sheet_id IN (
               SELECT id FROM mvp01_attendance_sheets WHERE school_id = ? AND lesson_date = ?
             )`,
          [
            `Justificativa aprovada (${just.id})`,
            ctx.userId,
            now,
            ctx.schoolId,
            just.student_id,
            ctx.schoolId,
            just.absence_date,
          ]
        );
      }

      await this.recordAudit(ctx, {
        action: `ABSENCE_JUSTIFICATION_${input.decision}`,
        resourceType: 'absence_justification',
        resourceId: just.id,
        reason: input.reviewNote ?? null,
      });
      await this.recordOutbox(ctx.schoolId, 'mvp01.absence_justification.reviewed', just.id, {
        justificationId: just.id,
        decision: input.decision,
      });
    });

    return await mvp01Get(this.db, 'SELECT * FROM mvp01_absence_justifications WHERE id = ?', [just.id]);
  }

  // ---------------------------------------------------------------------------
  // AVALIAÇÃO, NOTAS E PERÍODOS LETIVOS
  // ---------------------------------------------------------------------------

  public async saveGradingPolicyVersion(
    ctx: Mvp01Context,
    input: {
      classId?: string | null;
      subject?: string | null;
      weights: Record<string, number>;
      scaleMax?: number;
      roundingRule?: string;
      passingGrade?: number;
      recoveryRule?: string;
    }
  ) {
    await this.authorizeAndAudit(ctx, 'grading_policy.create', {
      schoolId: ctx.schoolId,
      classId: input.classId ?? undefined,
      subject: input.subject ?? undefined,
      resourceType: 'grading_policy',
    });

    if (input.classId) {
      await this.assertRowInSchool<any>(
        ctx,
        'SELECT id, school_id FROM mvp01_classes WHERE id = ?',
        input.classId,
        'CLASS_NOT_FOUND',
        'Turma não encontrada.'
      );
    }

    const scaleMax = input.scaleMax ?? 10;
    const passingGrade = input.passingGrade ?? 6;
    if (scaleMax <= 0 || passingGrade < 0 || passingGrade > scaleMax) {
      throw new Mvp01Error(400, 'INVALID_GRADING_SCALE', 'Escala ou média mínima inválida.');
    }
    if (!input.weights || typeof input.weights !== 'object' || Object.keys(input.weights).length === 0) {
      throw new Mvp01Error(400, 'INVALID_POLICY_WEIGHTS', 'Pesos da política avaliativa são obrigatórios.');
    }

    const id = `pol-${randomUUID()}`;
    const now = this.nowIso();

    return await withMvp01Transaction(this.db, async () => {
      const latest = await mvp01Get<{ max_ver: number | null }>(
        this.db,
        `SELECT MAX(version_number) as max_ver
         FROM mvp01_grading_policy_versions
         WHERE school_id = ?
           AND COALESCE(class_id, '') = COALESCE(?, '')
           AND COALESCE(subject, '') = COALESCE(?, '')`,
        [ctx.schoolId, input.classId ?? '', input.subject ?? '']
      );
      const versionNumber = (latest?.max_ver ?? 0) + 1;

      await mvp01Run(
        this.db,
        `INSERT INTO mvp01_grading_policy_versions
         (id, school_id, class_id, subject, version_number, weights_json, scale_max, rounding_rule, passing_grade, recovery_rule, created_by, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          ctx.schoolId,
          input.classId ?? null,
          input.subject ?? null,
          versionNumber,
          JSON.stringify(input.weights),
          scaleMax,
          input.roundingRule || 'HALF_UP_0_5',
          passingGrade,
          input.recoveryRule || 'MAX_WITH_RECOVERY',
          ctx.userId,
          now,
        ]
      );

      await this.recordAudit(ctx, {
        action: 'GRADING_POLICY_VERSION_CREATED',
        resourceType: 'grading_policy',
        resourceId: id,
        metadata: { versionNumber, classId: input.classId ?? null, subject: input.subject ?? null },
      });

      return await mvp01Get(this.db, 'SELECT * FROM mvp01_grading_policy_versions WHERE id = ?', [id]);
    });
  }

  public async recordGradeEntry(
    ctx: Mvp01Context,
    input: {
      enrollmentId: string;
      studentId: string;
      classId: string;
      subject: string;
      periodId: string;
      policyVersionId?: string | null;
      n1?: number | null;
      n2?: number | null;
      n3?: number | null;
      recovery?: number | null;
      entryState?: 'PENDING' | 'GRADED' | 'EXEMPT';
      published?: boolean;
      expectedVersion?: number;
      idempotencyKey?: string;
    }
  ) {
    await this.rejectIfReadOnlyRole(ctx, 'grade.record', {
      schoolId: ctx.schoolId,
      classId: input.classId,
      subject: input.subject,
      studentId: input.studentId,
      enrollmentId: input.enrollmentId,
      resourceType: 'grade_entry',
    });
    const subject = assertNonEmptyString(input.subject, 'INVALID_SUBJECT', 'Disciplina é obrigatória.');

    await this.authorizeAndAudit(ctx, 'grade.record', {
      schoolId: ctx.schoolId,
      classId: input.classId,
      subject,
      studentId: input.studentId,
      enrollmentId: input.enrollmentId,
      resourceType: 'grade_entry',
    });

    if (input.published !== undefined) {
      await this.authorizeAndAudit(ctx, 'grade.publish', {
        schoolId: ctx.schoolId,
        classId: input.classId,
        subject,
      });
    }

    const executeRecord = async () => {
      const period = await this.assertRowInSchool<any>(
        ctx,
        'SELECT * FROM mvp01_academic_periods WHERE id = ?',
        input.periodId,
        'PERIOD_NOT_FOUND',
        'Período letivo não encontrado.'
      );
      if (period.status !== 'OPEN') {
        throw new Mvp01Error(409, 'ACADEMIC_PERIOD_CLOSED', `Período '${period.name}' está fechado.`);
      }

      const enrollment = await this.assertRowInSchool<any>(
        ctx,
        'SELECT * FROM mvp01_enrollments WHERE id = ?',
        input.enrollmentId,
        'ENROLLMENT_NOT_FOUND',
        'Matrícula não encontrada.'
      );
      if (enrollment.student_id !== input.studentId) {
        throw new Mvp01Error(400, 'ENROLLMENT_STUDENT_MISMATCH', 'Matrícula não pertence ao estudante.');
      }
      if (enrollment.status !== 'ATIVA') {
        throw new Mvp01Error(409, 'ENROLLMENT_NOT_ACTIVE', 'Apenas matrículas ativas podem receber lançamentos de nota.');
      }

      const cls = await this.assertRowInSchool<any>(
        ctx,
        'SELECT id, school_id, academic_year_id FROM mvp01_classes WHERE id = ?',
        input.classId,
        'CLASS_NOT_FOUND',
        'Turma não encontrada.'
      );
      if (cls.academic_year_id !== enrollment.academic_year_id) {
        throw new Mvp01Error(409, 'INCOMPATIBLE_CLASS_YEAR', 'Turma não pertence ao ano letivo da matrícula.');
      }
      if (period.academic_year_id !== enrollment.academic_year_id) {
        throw new Mvp01Error(409, 'INCOMPATIBLE_PERIOD_YEAR', 'Período letivo não pertence ao ano letivo da matrícula.');
      }

      const activeMembership = await mvp01Get<any>(
        this.db,
        `SELECT id FROM mvp01_class_memberships
         WHERE school_id = ? AND enrollment_id = ? AND class_id = ? AND ended_at IS NULL`,
        [ctx.schoolId, input.enrollmentId, input.classId]
      );
      if (!activeMembership) {
        throw new Mvp01Error(409, 'STUDENT_NOT_IN_CLASS', 'Estudante não possui enturmação ativa nesta turma.');
      }

      let policy: any = null;
      if (input.policyVersionId) {
        policy = await this.assertRowInSchool<any>(
          ctx,
          'SELECT * FROM mvp01_grading_policy_versions WHERE id = ?',
          input.policyVersionId,
          'POLICY_NOT_FOUND',
          'Regra de avaliação não encontrada.'
        );
      } else {
        policy = await mvp01Get<any>(
          this.db,
          `SELECT * FROM mvp01_grading_policy_versions
           WHERE school_id = ?
             AND (class_id = ? OR class_id IS NULL)
             AND (LOWER(TRIM(COALESCE(subject, ''))) = LOWER(TRIM(?)) OR subject IS NULL)
           ORDER BY CASE
             WHEN class_id IS NOT NULL AND subject IS NOT NULL THEN 0
             WHEN class_id IS NOT NULL THEN 1
             WHEN subject IS NOT NULL THEN 2
             ELSE 3
           END, version_number DESC
           LIMIT 1`,
          [ctx.schoolId, input.classId, subject]
        );
      }

      const scaleMax = Number(policy?.scale_max ?? 10);
      const isValidNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
      const scores = [input.n1, input.n2, input.n3, input.recovery].filter(isValidNum);
      for (const s of scores) {
        if (s < 0 || s > scaleMax) {
          throw new Mvp01Error(400, 'GRADE_OUT_OF_RANGE', `Nota ${s} fora da escala [0, ${scaleMax}].`);
        }
      }

      const hasAnyNumericGrade =
        isValidNum(input.n1) || isValidNum(input.n2) || isValidNum(input.n3) || isValidNum(input.recovery);

      if (input.entryState === 'GRADED' && !hasAnyNumericGrade) {
        throw new Mvp01Error(
          400,
          'GRADED_REQUIRES_NUMERIC_SCORE',
          'Estado GRADED exige ao menos uma nota numérica informada.'
        );
      }

      let resolvedState: 'PENDING' | 'GRADED' | 'EXEMPT';
      if (input.entryState === 'EXEMPT') {
        resolvedState = 'EXEMPT';
      } else if (input.entryState === 'PENDING' && !hasAnyNumericGrade) {
        resolvedState = 'PENDING';
      } else if (hasAnyNumericGrade) {
        resolvedState = 'GRADED';
      } else {
        resolvedState = 'PENDING';
      }

      let finalAverage: number | null = null;
      if (resolvedState === 'GRADED') {
        const weights = parseJsonSafe<Record<string, number>>(policy?.weights_json, {
          n1: 0.4,
          n2: 0.4,
          n3: 0.2,
        });
        let weightedSum = 0;
        let totalWeight = 0;
        const components: Array<[string, number | null | undefined]> = [
          ['n1', input.n1],
          ['n2', input.n2],
          ['n3', input.n3],
        ];
        for (const [key, val] of components) {
          if (isValidNum(val)) {
            const w = typeof weights[key] === 'number' ? weights[key] : 1;
            weightedSum += val * w;
            totalWeight += w;
          }
        }
        let baseAvg = totalWeight > 0 ? weightedSum / totalWeight : 0;
        if (isValidNum(input.recovery)) {
          baseAvg = Math.max(baseAvg, input.recovery);
        }
        finalAverage = Number(baseAvg.toFixed(2));
      }

      const existing = await mvp01Get<any>(
        this.db,
        `SELECT * FROM mvp01_grade_entries
         WHERE school_id = ? AND enrollment_id = ? AND subject = ? AND period_id = ?`,
        [ctx.schoolId, input.enrollmentId, subject, input.periodId]
      );

      if (existing && input.expectedVersion !== undefined && existing.version !== input.expectedVersion) {
        throw new Mvp01Error(409, 'VERSION_CONFLICT', 'Conflito de versão no lançamento de nota.');
      }

      const now = this.nowIso();
      const entryId = existing ? existing.id : `grade-${randomUUID()}`;
      const nextVersion = existing ? existing.version + 1 : 1;
      const publishedInt =
        input.published !== undefined ? (input.published ? 1 : 0) : (existing?.published ?? 0);

      if (existing) {
        await mvp01Run(
          this.db,
          `UPDATE mvp01_grade_entries
           SET class_id = ?, policy_version_id = ?, n1 = ?, n2 = ?, n3 = ?, recovery = ?,
               entry_state = ?, final_average = ?, published = ?, version = ?, updated_by = ?, updated_at = ?
           WHERE id = ?`,
          [
            input.classId,
            policy?.id ?? existing.policy_version_id ?? null,
            isValidNum(input.n1) ? input.n1 : null,
            isValidNum(input.n2) ? input.n2 : null,
            isValidNum(input.n3) ? input.n3 : null,
            isValidNum(input.recovery) ? input.recovery : null,
            resolvedState,
            finalAverage,
            publishedInt,
            nextVersion,
            ctx.userId,
            now,
            entryId,
          ]
        );
      } else {
        await mvp01Run(
          this.db,
          `INSERT INTO mvp01_grade_entries
           (id, school_id, enrollment_id, student_id, class_id, subject, period_id, policy_version_id, n1, n2, n3, recovery, entry_state, final_average, published, version, updated_by, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`,
          [
            entryId,
            ctx.schoolId,
            input.enrollmentId,
            input.studentId,
            input.classId,
            subject,
            input.periodId,
            policy?.id ?? null,
            isValidNum(input.n1) ? input.n1 : null,
            isValidNum(input.n2) ? input.n2 : null,
            isValidNum(input.n3) ? input.n3 : null,
            isValidNum(input.recovery) ? input.recovery : null,
            resolvedState,
            finalAverage,
            publishedInt,
            ctx.userId,
            now,
          ]
        );
      }

      await this.recordAudit(ctx, {
        action: 'GRADE_ENTRY_SAVED',
        resourceType: 'grade_entry',
        resourceId: entryId,
        metadata: {
          studentId: input.studentId,
          subject,
          periodId: input.periodId,
          entryState: resolvedState,
          finalAverage,
          published: publishedInt,
        },
      });
      await this.recordOutbox(ctx.schoolId, 'mvp01.grade.saved', entryId, {
        entryId,
        studentId: input.studentId,
        periodId: input.periodId,
        entryState: resolvedState,
        finalAverage,
      });

      return await mvp01Get(this.db, 'SELECT * FROM mvp01_grade_entries WHERE id = ?', [entryId]);
    };

    if (input.idempotencyKey) {
      return await this.runIdempotent(ctx, 'recordGradeEntry', input.idempotencyKey, input, executeRecord);
    }
    return await withMvp01Transaction(this.db, executeRecord);
  }

  public async closeAcademicPeriod(ctx: Mvp01Context, input: { periodId: string }) {
    await this.authorizeAndAudit(ctx, 'academic_period.close', {
      schoolId: ctx.schoolId,
      resourceType: 'academic_period',
      resourceId: input.periodId,
    });

    const period = await this.assertRowInSchool<any>(
      ctx,
      'SELECT * FROM mvp01_academic_periods WHERE id = ?',
      input.periodId,
      'PERIOD_NOT_FOUND',
      'Período letivo não encontrado.'
    );

    const now = this.nowIso();
    await withMvp01Transaction(this.db, async () => {
      await mvp01Run(
        this.db,
        `UPDATE mvp01_academic_periods
         SET status = 'CLOSED', closed_by = ?, closed_at = ?
         WHERE id = ?`,
        [ctx.userId, now, period.id]
      );
      await this.recordAudit(ctx, {
        action: 'ACADEMIC_PERIOD_CLOSED',
        resourceType: 'academic_period',
        resourceId: period.id,
      });
      await this.recordOutbox(ctx.schoolId, 'mvp01.academic_period.closed', period.id, {
        periodId: period.id,
        closedBy: ctx.userId,
        closedAt: now,
      });
    });

    return await mvp01Get(this.db, 'SELECT * FROM mvp01_academic_periods WHERE id = ?', [period.id]);
  }

  public async reopenAcademicPeriod(ctx: Mvp01Context, input: { periodId: string; reason: string }) {
    await this.authorizeAndAudit(ctx, 'academic_period.reopen', {
      schoolId: ctx.schoolId,
      resourceType: 'academic_period',
      resourceId: input.periodId,
    });

    const reason = assertNonEmptyString(
      input.reason,
      'INVALID_REOPEN_REASON',
      'Motivo de reabertura deve ter no mínimo 5 caracteres.',
      5
    );

    const period = await this.assertRowInSchool<any>(
      ctx,
      'SELECT * FROM mvp01_academic_periods WHERE id = ?',
      input.periodId,
      'PERIOD_NOT_FOUND',
      'Período letivo não encontrado.'
    );

    await withMvp01Transaction(this.db, async () => {
      await mvp01Run(
        this.db,
        `UPDATE mvp01_academic_periods
         SET status = 'OPEN', reopen_reason = ?
         WHERE id = ?`,
        [reason, period.id]
      );
      await this.recordAudit(ctx, {
        action: 'ACADEMIC_PERIOD_REOPENED',
        resourceType: 'academic_period',
        resourceId: period.id,
        reason,
      });
      await this.recordOutbox(ctx.schoolId, 'mvp01.academic_period.reopened', period.id, {
        periodId: period.id,
        reason,
      });
    });

    return await mvp01Get(this.db, 'SELECT * FROM mvp01_academic_periods WHERE id = ?', [period.id]);
  }

  // ---------------------------------------------------------------------------
  // OCORRÊNCIAS (COM SEGREGAÇÃO STRICT DE internal_notes)
  // ---------------------------------------------------------------------------

  public async createIncident(
    ctx: Mvp01Context,
    input: {
      studentId: string;
      classId?: string | null;
      category: 'DISCIPLINARY' | 'PEDAGOGICAL' | 'HEALTH_CARE' | 'PRAISE';
      title: string;
      internalNotes?: string | null;
      publishedSummary?: string | null;
      publishedToFamily?: boolean;
      responsibleUserId?: string | null;
      dueDate?: string | null;
    }
  ) {
    await this.rejectIfReadOnlyRole(ctx, 'incident.create', {
      schoolId: ctx.schoolId,
      classId: input.classId ?? undefined,
      studentId: input.studentId,
      resourceType: 'incident',
    });
    if (!['DISCIPLINARY', 'PEDAGOGICAL', 'HEALTH_CARE', 'PRAISE'].includes(input.category)) {
      throw new Mvp01Error(400, 'INVALID_INCIDENT_CATEGORY', 'Categoria de ocorrência inválida.');
    }
    const title = assertNonEmptyString(input.title, 'INVALID_INCIDENT_TITLE', 'Título da ocorrência é obrigatório.');

    await this.assertRowInSchool<any>(
      ctx,
      'SELECT id, school_id FROM mvp01_students WHERE id = ?',
      input.studentId,
      'STUDENT_NOT_FOUND',
      'Estudante não encontrado.'
    );

    let resolvedClassId = input.classId ?? null;
    if (!resolvedClassId) {
      const currentClass = await mvp01Get<{ class_id: string }>(
        this.db,
        `SELECT cm.class_id
         FROM mvp01_class_memberships cm
         JOIN mvp01_enrollments e ON e.id = cm.enrollment_id
         WHERE cm.school_id = ? AND e.student_id = ? AND e.status = 'ATIVA' AND cm.ended_at IS NULL
         LIMIT 1`,
        [ctx.schoolId, input.studentId]
      );
      resolvedClassId = currentClass?.class_id ?? null;
    } else {
      await this.assertRowInSchool<any>(
        ctx,
        'SELECT id, school_id FROM mvp01_classes WHERE id = ?',
        resolvedClassId,
        'CLASS_NOT_FOUND',
        'Turma não encontrada.'
      );
    }

    await this.authorizeAndAudit(ctx, 'incident.create', {
      schoolId: ctx.schoolId,
      classId: resolvedClassId ?? undefined,
      studentId: input.studentId,
      resourceType: 'incident',
    });

    const publishFlag = input.publishedToFamily ? 1 : 0;
    if (publishFlag === 1) {
      await this.authorizeAndAudit(ctx, 'incident.publish', {
        schoolId: ctx.schoolId,
        classId: resolvedClassId ?? undefined,
      });
      assertNonEmptyString(
        input.publishedSummary,
        'PUBLISHED_SUMMARY_REQUIRED',
        'Resumo publicado à família é obrigatório ao publicar ocorrência.',
        3
      );
    }

    const id = `inc-${randomUUID()}`;
    const now = this.nowIso();

    await withMvp01Transaction(this.db, async () => {
      await mvp01Run(
        this.db,
        `INSERT INTO mvp01_incidents
         (id, school_id, student_id, class_id, category, title, internal_notes, published_summary, published_to_family, responsible_user_id, due_date, status, created_by, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'OPEN', ?, ?)`,
        [
          id,
          ctx.schoolId,
          input.studentId,
          resolvedClassId,
          input.category,
          title,
          input.internalNotes ?? null,
          publishFlag === 1 ? input.publishedSummary?.trim() ?? null : input.publishedSummary ?? null,
          publishFlag,
          input.responsibleUserId ?? ctx.userId,
          input.dueDate ?? null,
          ctx.userId,
          now,
        ]
      );
      await this.recordAudit(ctx, {
        action: 'INCIDENT_CREATED',
        resourceType: 'incident',
        resourceId: id,
        metadata: { category: input.category, studentId: input.studentId, publishedToFamily: publishFlag },
      });
      await this.recordOutbox(ctx.schoolId, 'mvp01.incident.created', id, {
        incidentId: id,
        studentId: input.studentId,
        publishedToFamily: publishFlag,
      });
    });

    return await mvp01Get(this.db, 'SELECT * FROM mvp01_incidents WHERE id = ?', [id]);
  }

  public async publishIncidentToFamily(
    ctx: Mvp01Context,
    input: { incidentId: string; publishedSummary: string }
  ) {
    await this.rejectIfReadOnlyRole(ctx, 'incident.publish', {
      schoolId: ctx.schoolId,
      resourceType: 'incident',
      resourceId: input.incidentId,
    });

    const incident = await this.assertRowInSchool<any>(
      ctx,
      'SELECT * FROM mvp01_incidents WHERE id = ?',
      input.incidentId,
      'INCIDENT_NOT_FOUND',
      'Ocorrência não encontrada.'
    );

    await this.authorizeAndAudit(ctx, 'incident.publish', {
      schoolId: incident.school_id,
      classId: incident.class_id ?? undefined,
      studentId: incident.student_id,
      resourceType: 'incident',
      resourceId: incident.id,
    });

    const summary = assertNonEmptyString(
      input.publishedSummary,
      'PUBLISHED_SUMMARY_REQUIRED',
      'Resumo público para família deve ter ao menos 3 caracteres.',
      3
    );

    await withMvp01Transaction(this.db, async () => {
      await mvp01Run(
        this.db,
        `UPDATE mvp01_incidents
         SET published_summary = ?, published_to_family = 1
         WHERE id = ?`,
        [summary, incident.id]
      );
      await this.recordAudit(ctx, {
        action: 'INCIDENT_PUBLISHED_TO_FAMILY',
        resourceType: 'incident',
        resourceId: incident.id,
        metadata: { studentId: incident.student_id },
      });
      await this.recordOutbox(ctx.schoolId, 'mvp01.incident.published', incident.id, {
        incidentId: incident.id,
        studentId: incident.student_id,
      });
    });

    return await mvp01Get(this.db, 'SELECT * FROM mvp01_incidents WHERE id = ?', [incident.id]);
  }

  public async resolveIncident(
    ctx: Mvp01Context,
    input: { incidentId: string; resolutionNote: string; status?: 'IN_PROGRESS' | 'RESOLVED' }
  ) {
    await this.rejectIfReadOnlyRole(ctx, 'incident.resolve', {
      schoolId: ctx.schoolId,
      resourceType: 'incident',
      resourceId: input.incidentId,
    });
    const incident = await this.assertRowInSchool<any>(
      ctx,
      'SELECT * FROM mvp01_incidents WHERE id = ?',
      input.incidentId,
      'INCIDENT_NOT_FOUND',
      'Ocorrência não encontrada.'
    );

    await this.authorizeAndAudit(ctx, 'incident.resolve', {
      schoolId: incident.school_id,
      classId: incident.class_id ?? undefined,
      studentId: incident.student_id,
      resourceType: 'incident',
      resourceId: incident.id,
    });

    const resolutionNote = assertNonEmptyString(
      input.resolutionNote,
      'INVALID_RESOLUTION_NOTE',
      'Nota de resolução deve ter ao menos 3 caracteres.',
      3
    );
    const nextStatus = input.status || 'RESOLVED';
    if (!['IN_PROGRESS', 'RESOLVED'].includes(nextStatus)) {
      throw new Mvp01Error(400, 'INVALID_INCIDENT_STATUS', 'Status de resolução inválido.');
    }

    await withMvp01Transaction(this.db, async () => {
      await mvp01Run(
        this.db,
        `UPDATE mvp01_incidents SET resolution_note = ?, status = ? WHERE id = ?`,
        [resolutionNote, nextStatus, incident.id]
      );
      await this.recordAudit(ctx, {
        action: 'INCIDENT_RESOLVED',
        resourceType: 'incident',
        resourceId: incident.id,
        reason: resolutionNote,
        metadata: { status: nextStatus },
      });
      await this.recordOutbox(ctx.schoolId, 'mvp01.incident.resolved', incident.id, {
        incidentId: incident.id,
        status: nextStatus,
      });
    });

    return await mvp01Get(this.db, 'SELECT * FROM mvp01_incidents WHERE id = ?', [incident.id]);
  }

  public async ackIncident(ctx: Mvp01Context, input: { incidentId: string }) {
    await this.rejectIfReadOnlyRole(ctx, 'incident.ack', {
      schoolId: ctx.schoolId,
      resourceType: 'incident',
      resourceId: input.incidentId,
    });
    const incident = await this.assertRowInSchool<any>(
      ctx,
      'SELECT * FROM mvp01_incidents WHERE id = ?',
      input.incidentId,
      'INCIDENT_NOT_FOUND',
      'Ocorrência não encontrada.'
    );

    await this.authorizeAndAudit(ctx, 'incident.ack', {
      schoolId: incident.school_id,
      studentId: incident.student_id,
      resourceType: 'incident',
      resourceId: incident.id,
    });

    if (incident.published_to_family !== 1) {
      throw new Mvp01Error(403, 'FORBIDDEN_UNPUBLISHED_INCIDENT', 'Ocorrência não publicada para a família.');
    }

    const now = this.nowIso();
    await withMvp01Transaction(this.db, async () => {
      await mvp01Run(
        this.db,
        `UPDATE mvp01_incidents SET family_ack_at = ?, family_ack_by = ? WHERE id = ?`,
        [now, ctx.userId, incident.id]
      );
      await this.recordAudit(ctx, {
        action: 'INCIDENT_FAMILY_ACK',
        resourceType: 'incident',
        resourceId: incident.id,
      });
    });

    return {
      success: true,
      incidentId: incident.id,
      familyAckAt: now,
      familyAckBy: ctx.userId,
    };
  }

  // ---------------------------------------------------------------------------
  // COMUNICADOS E RECIBOS
  // ---------------------------------------------------------------------------

  public async publishCommunication(
    ctx: Mvp01Context,
    input: {
      title: string;
      body: string;
      targetScope: 'ALL_SCHOOL' | 'CLASS' | 'STUDENT' | string;
      targetClassId?: string | null;
      targetStudentId?: string | null;
      requiresAuthorization?: boolean;
      authorizationVersion?: number;
      status?: 'DRAFT' | 'PUBLISHED';
    }
  ) {
    await this.rejectIfReadOnlyRole(ctx, 'communication.publish', {
      schoolId: ctx.schoolId,
      classId: input.targetClassId ?? undefined,
      studentId: input.targetStudentId ?? undefined,
      resourceType: 'communication',
    });

    const title = assertNonEmptyString(input.title, 'INVALID_TITLE', 'Título do comunicado é obrigatório.');
    const body = assertNonEmptyString(input.body, 'INVALID_BODY', 'Texto do comunicado é obrigatório.');
    const targetScope = assertNonEmptyString(input.targetScope, 'INVALID_SCOPE', 'Escopo do comunicado é obrigatório.');
    if (!['ALL_SCHOOL', 'CLASS', 'STUDENT'].includes(targetScope)) {
      throw new Mvp01Error(400, 'INVALID_SCOPE', "Escopo deve ser 'ALL_SCHOOL', 'CLASS' ou 'STUDENT'.");
    }
    if (targetScope === 'CLASS' && (!input.targetClassId || !input.targetClassId.trim())) {
      throw new Mvp01Error(400, 'TARGET_CLASS_REQUIRED', 'targetClassId é obrigatório para escopo CLASS.');
    }
    if (targetScope === 'STUDENT' && (!input.targetStudentId || !input.targetStudentId.trim())) {
      throw new Mvp01Error(400, 'TARGET_STUDENT_REQUIRED', 'targetStudentId é obrigatório para escopo STUDENT.');
    }
    if (canonicalizeMvp01Role(ctx.activeRole) === 'teacher' && targetScope !== 'CLASS') {
      throw new Mvp01Error(
        403,
        'FORBIDDEN_TEACHING_SCOPE',
        'Docente só pode publicar comunicados com escopo CLASS para suas turmas atribuídas.'
      );
    }

    await this.authorizeAndAudit(ctx, 'communication.publish', {
      schoolId: ctx.schoolId,
      classId: input.targetClassId ?? undefined,
      studentId: input.targetStudentId ?? undefined,
      resourceType: 'communication',
    });

    if (input.targetClassId) {
      await this.assertRowInSchool<any>(
        ctx,
        'SELECT id, school_id FROM mvp01_classes WHERE id = ?',
        input.targetClassId,
        'CLASS_NOT_FOUND',
        'Turma alvo não encontrada.'
      );
    }
    if (input.targetStudentId) {
      await this.assertRowInSchool<any>(
        ctx,
        'SELECT id, school_id FROM mvp01_students WHERE id = ?',
        input.targetStudentId,
        'STUDENT_NOT_FOUND',
        'Estudante alvo não encontrado.'
      );
    }

    const id = `comm-${randomUUID()}`;
    const now = this.nowIso();
    const status = input.status === 'DRAFT' ? 'DRAFT' : 'PUBLISHED';

    await withMvp01Transaction(this.db, async () => {
      await mvp01Run(
        this.db,
        `INSERT INTO mvp01_communications
         (id, school_id, title, body, target_scope, target_class_id, target_student_id, requires_authorization, authorization_version, status, published_by, published_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          ctx.schoolId,
          title,
          body,
          targetScope,
          input.targetClassId ?? null,
          input.targetStudentId ?? null,
          input.requiresAuthorization ? 1 : 0,
          input.authorizationVersion ?? 1,
          status,
          ctx.userId,
          now,
        ]
      );
      await this.recordAudit(ctx, {
        action: 'COMMUNICATION_PUBLISHED',
        resourceType: 'communication',
        resourceId: id,
        metadata: { targetScope, requiresAuthorization: !!input.requiresAuthorization },
      });
      await this.recordOutbox(ctx.schoolId, 'mvp01.communication.published', id, {
        communicationId: id,
        targetScope,
      });
    });

    return await mvp01Get(this.db, 'SELECT * FROM mvp01_communications WHERE id = ?', [id]);
  }

  public async recordCommunicationReceipt(
    ctx: Mvp01Context,
    input: {
      communicationId: string;
      studentId: string;
      eventType: 'DELIVERED' | 'OPENED' | 'ACKNOWLEDGED' | 'AUTHORIZED' | 'DENIED';
      note?: string;
    }
  ) {
    await this.rejectIfReadOnlyRole(
      ctx,
      input.eventType === 'AUTHORIZED' || input.eventType === 'DENIED'
        ? 'communication.decide'
        : 'communication.ack',
      {
        schoolId: ctx.schoolId,
        studentId: input.studentId,
        resourceType: 'communication',
        resourceId: input.communicationId,
      }
    );
    if (!['DELIVERED', 'OPENED', 'ACKNOWLEDGED', 'AUTHORIZED', 'DENIED'].includes(input.eventType)) {
      throw new Mvp01Error(400, 'INVALID_RECEIPT_EVENT', 'Tipo de recibo inválido.');
    }

    const comm = await this.assertRowInSchool<any>(
      ctx,
      'SELECT * FROM mvp01_communications WHERE id = ?',
      input.communicationId,
      'COMMUNICATION_NOT_FOUND',
      'Comunicado não encontrado.'
    );

    const perm: Mvp01Permission =
      input.eventType === 'AUTHORIZED' || input.eventType === 'DENIED'
        ? 'communication.decide'
        : 'communication.ack';

    await this.authorizeAndAudit(ctx, perm, {
      schoolId: comm.school_id,
      studentId: input.studentId,
      resourceType: 'communication',
      resourceId: comm.id,
    });

    if (comm.status !== 'PUBLISHED') {
      throw new Mvp01Error(409, 'COMMUNICATION_NOT_PUBLISHED', 'Comunicado não publicado.');
    }
    if (comm.target_student_id && comm.target_student_id !== input.studentId) {
      throw new Mvp01Error(403, 'FORBIDDEN_TARGET_SCOPE', 'Comunicado direcionado a outro estudante.');
    }
    if (comm.target_class_id) {
      const enrolledInTargetClass = await mvp01Get<any>(
        this.db,
        `SELECT cm.id
         FROM mvp01_class_memberships cm
         JOIN mvp01_enrollments e ON e.id = cm.enrollment_id
         WHERE cm.school_id = ?
           AND e.student_id = ?
           AND e.status = 'ATIVA'
           AND cm.class_id = ?
           AND cm.ended_at IS NULL
         LIMIT 1`,
        [ctx.schoolId, input.studentId, comm.target_class_id]
      );
      if (!enrolledInTargetClass) {
        throw new Mvp01Error(403, 'FORBIDDEN_TARGET_SCOPE', 'Estudante não pertence à turma alvo deste comunicado.');
      }
    }
    if ((input.eventType === 'AUTHORIZED' || input.eventType === 'DENIED') && comm.requires_authorization !== 1) {
      throw new Mvp01Error(400, 'AUTHORIZATION_NOT_REQUIRED', 'Este comunicado não requer decisão de autorização.');
    }

    const now = this.nowIso();
    const id = `rcpt-${randomUUID()}`;

    await withMvp01Transaction(this.db, async () => {
      await mvp01Run(
        this.db,
        `INSERT INTO mvp01_communication_receipts
         (id, communication_id, school_id, user_id, student_id, event_type, note, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(communication_id, user_id, student_id, event_type) DO UPDATE SET
           note = excluded.note,
           created_at = excluded.created_at`,
        [id, comm.id, ctx.schoolId, ctx.userId, input.studentId, input.eventType, input.note ?? null, now]
      );
      await this.recordAudit(ctx, {
        action: `COMMUNICATION_RECEIPT_${input.eventType}`,
        resourceType: 'communication',
        resourceId: comm.id,
        metadata: { studentId: input.studentId, eventType: input.eventType },
      });
    });

    return await mvp01Get(
      this.db,
      `SELECT * FROM mvp01_communication_receipts
       WHERE communication_id = ? AND user_id = ? AND student_id = ? AND event_type = ?`,
      [comm.id, ctx.userId, input.studentId, input.eventType]
    );
  }

  // ---------------------------------------------------------------------------
  // DOCUMENTOS OFICIAIS E VERIFICAÇÃO
  // ---------------------------------------------------------------------------

  public async issueDocument(
    ctx: Mvp01Context,
    input: {
      studentId: string;
      enrollmentId?: string;
      docType: 'DECLARACAO_MATRICULA' | 'DECLARACAO_FREQUENCIA' | 'FICHA_INDIVIDUAL' | 'BOLETIM';
      policyVersionId?: string | null;
      idempotencyKey?: string;
    }
  ) {
    await this.authorizeAndAudit(ctx, 'document.issue', {
      schoolId: ctx.schoolId,
      studentId: input.studentId,
      resourceType: 'issued_document',
    });

    if (
      !['DECLARACAO_MATRICULA', 'DECLARACAO_FREQUENCIA', 'FICHA_INDIVIDUAL', 'BOLETIM'].includes(
        input.docType
      )
    ) {
      throw new Mvp01Error(400, 'INVALID_DOC_TYPE', 'Tipo de documento oficial inválido.');
    }

    const executeIssue = async () => {
      const student = await this.assertRowInSchool<any>(
        ctx,
        'SELECT id, school_id, full_name, birth_date, registration_code FROM mvp01_students WHERE id = ?',
        input.studentId,
        'STUDENT_NOT_FOUND',
        'Estudante não encontrado.'
      );

      let enrollment: any = null;
      if (input.enrollmentId) {
        enrollment = await this.assertRowInSchool<any>(
          ctx,
          'SELECT * FROM mvp01_enrollments WHERE id = ?',
          input.enrollmentId,
          'ENROLLMENT_NOT_FOUND',
          'Matrícula não encontrada.'
        );
        if (enrollment.student_id !== student.id) {
          throw new Mvp01Error(400, 'ENROLLMENT_STUDENT_MISMATCH', 'Matrícula não pertence ao estudante informado.');
        }
      } else {
        enrollment = await mvp01Get<any>(
          this.db,
          `SELECT * FROM mvp01_enrollments
           WHERE school_id = ? AND student_id = ?
           ORDER BY CASE WHEN status = 'ATIVA' THEN 0 ELSE 1 END, created_at DESC
           LIMIT 1`,
          [ctx.schoolId, student.id]
        );
      }

      const school = await mvp01Get<any>(
        this.db,
        'SELECT id, name, cnpj, city, state FROM mvp01_schools WHERE id = ?',
        [ctx.schoolId]
      );

      let resolvedPolicyId = input.policyVersionId ?? null;
      if (!resolvedPolicyId) {
        const latestPolicy = await mvp01Get<any>(
          this.db,
          `SELECT id FROM mvp01_grading_policy_versions
           WHERE school_id = ? ORDER BY version_number DESC LIMIT 1`,
          [ctx.schoolId]
        );
        resolvedPolicyId = latestPolicy?.id ?? null;
      }

      const grades =
        input.docType === 'BOLETIM' || input.docType === 'FICHA_INDIVIDUAL'
          ? enrollment
            ? await mvp01All<any>(
                this.db,
                `SELECT subject, period_id, entry_state, final_average, policy_version_id
                 FROM mvp01_grade_entries
                 WHERE school_id = ? AND student_id = ? AND enrollment_id = ?`,
                [ctx.schoolId, student.id, enrollment.id]
              )
            : await mvp01All<any>(
                this.db,
                `SELECT subject, period_id, entry_state, final_average, policy_version_id
                 FROM mvp01_grade_entries
                 WHERE school_id = ? AND student_id = ?`,
                [ctx.schoolId, student.id]
              )
          : [];

      const attendanceStats =
        input.docType === 'DECLARACAO_FREQUENCIA' ||
        input.docType === 'FICHA_INDIVIDUAL' ||
        input.docType === 'BOLETIM'
          ? enrollment
            ? await mvp01Get<any>(
                this.db,
                `SELECT
                   COUNT(*) as total_lessons,
                   SUM(CASE WHEN status IN ('PRESENT','LATE','JUSTIFIED') THEN 1 ELSE 0 END) as attended
                 FROM mvp01_attendance_records
                 WHERE school_id = ? AND student_id = ? AND enrollment_id = ?`,
                [ctx.schoolId, student.id, enrollment.id]
              )
            : await mvp01Get<any>(
                this.db,
                `SELECT
                   COUNT(*) as total_lessons,
                   SUM(CASE WHEN status IN ('PRESENT','LATE','JUSTIFIED') THEN 1 ELSE 0 END) as attended
                 FROM mvp01_attendance_records
                 WHERE school_id = ? AND student_id = ?`,
                [ctx.schoolId, student.id]
              )
          : null;

      const maxVersionRow = await mvp01Get<{ max_ver: number | null }>(
        this.db,
        `SELECT MAX(version) as max_ver
         FROM mvp01_issued_documents
         WHERE school_id = ? AND student_id = ? AND doc_type = ?`,
        [ctx.schoolId, student.id, input.docType]
      );
      const version = (maxVersionRow?.max_ver ?? 0) + 1;
      const now = this.nowIso();

      // Snapshot imutável sem dados restritos de saúde nem internal_notes
      const snapshot = {
        school: school || { id: ctx.schoolId },
        student: {
          id: student.id,
          fullName: student.full_name,
          registrationCode: student.registration_code,
          birthDate: student.birth_date,
        },
        enrollment: enrollment
          ? { id: enrollment.id, academicYearId: enrollment.academic_year_id, status: enrollment.status }
          : null,
        docType: input.docType,
        version,
        policyVersionId: resolvedPolicyId,
        grades,
        attendanceStats,
        issuedAt: now,
      };

      const snapshotJson = canonicalStringify(snapshot);
      const contentHashSha256 = createHash('sha256').update(snapshotJson).digest('hex');
      const verificationToken = randomBytes(16).toString('hex');
      const id = `doc-${randomUUID()}`;

      await mvp01Run(
        this.db,
        `INSERT INTO mvp01_issued_documents
         (id, school_id, student_id, enrollment_id, doc_type, version, policy_version_id, snapshot_json, content_hash_sha256, verification_token, issuer_user_id, status, revoked_reason, issued_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE', NULL, ?)`,
        [
          id,
          ctx.schoolId,
          student.id,
          enrollment?.id ?? null,
          input.docType,
          version,
          resolvedPolicyId,
          snapshotJson,
          contentHashSha256,
          verificationToken,
          ctx.userId,
          now,
        ]
      );

      await this.recordAudit(ctx, {
        action: 'DOCUMENT_ISSUED',
        resourceType: 'issued_document',
        resourceId: id,
        metadata: { docType: input.docType, version, studentId: student.id, contentHashSha256 },
      });
      await this.recordOutbox(ctx.schoolId, 'mvp01.document.issued', id, {
        documentId: id,
        docType: input.docType,
        version,
        verificationToken,
      });

      return {
        documentId: id,
        studentId: student.id,
        enrollmentId: enrollment?.id ?? null,
        docType: input.docType,
        version,
        policyVersionId: resolvedPolicyId,
        contentHashSha256,
        verificationToken,
        status: 'ACTIVE',
        issuedAt: now,
      };
    };

    if (input.idempotencyKey) {
      return await this.runIdempotent(ctx, 'issueDocument', input.idempotencyKey, input, executeIssue);
    }
    return await withMvp01Transaction(this.db, executeIssue);
  }

  public async verifyDocumentToken(
    ctx: Mvp01Context,
    input: string | { token: string }
  ) {
    await this.authorizeAndAudit(ctx, 'document.verify.read', {
      schoolId: ctx.schoolId,
      resourceType: 'issued_document',
    });

    const token = assertNonEmptyString(
      typeof input === 'string' ? input : input?.token,
      'INVALID_VERIFICATION_TOKEN',
      'Token de verificação é obrigatório.'
    );

    const doc = await mvp01Get<any>(
      this.db,
      `SELECT d.id, d.school_id, d.doc_type, d.version, d.content_hash_sha256,
              d.issuer_user_id, d.status, d.revoked_reason, d.issued_at,
              s.name as school_name,
              m.person_name as issuer_name
       FROM mvp01_issued_documents d
       LEFT JOIN mvp01_schools s ON s.id = d.school_id
       LEFT JOIN mvp01_memberships m
         ON m.user_id = d.issuer_user_id AND m.school_id = d.school_id
       WHERE d.verification_token = ?
       LIMIT 1`,
      [token]
    );

    if (!doc) {
      return { valid: false, status: 'NOT_FOUND' };
    }

    if (doc.school_id !== ctx.schoolId) {
      authorize(ctx, 'document.verify.read', { schoolId: doc.school_id });
    }

    // Retorna estritamente metadados de autenticidade/status/emissor, sem boletim ou saúde
    return {
      valid: doc.status === 'ACTIVE',
      documentId: doc.id,
      status: doc.status,
      docType: doc.doc_type,
      version: doc.version,
      contentHashSha256: doc.content_hash_sha256,
      issuedAt: doc.issued_at,
      schoolId: doc.school_id,
      schoolName: doc.school_name ?? null,
      issuerUserId: doc.issuer_user_id,
      issuerName: doc.issuer_name ?? doc.issuer_user_id,
      revokedReason: doc.revoked_reason ?? null,
    };
  }

  public async revokeDocument(ctx: Mvp01Context, input: { documentId: string; reason: string }) {
    await this.authorizeAndAudit(ctx, 'document.revoke', {
      schoolId: ctx.schoolId,
      resourceType: 'issued_document',
      resourceId: input.documentId,
    });

    const reason = assertNonEmptyString(
      input.reason,
      'INVALID_REVOKE_REASON',
      'Justificativa de revogação deve ter ao menos 3 caracteres.',
      3
    );

    const doc = await this.assertRowInSchool<any>(
      ctx,
      'SELECT * FROM mvp01_issued_documents WHERE id = ?',
      input.documentId,
      'DOCUMENT_NOT_FOUND',
      'Documento oficial não encontrado.'
    );

    await withMvp01Transaction(this.db, async () => {
      await mvp01Run(
        this.db,
        `UPDATE mvp01_issued_documents SET status = 'REVOKED', revoked_reason = ? WHERE id = ?`,
        [reason, doc.id]
      );
      await this.recordAudit(ctx, {
        action: 'DOCUMENT_REVOKED',
        resourceType: 'issued_document',
        resourceId: doc.id,
        reason,
      });
      await this.recordOutbox(ctx.schoolId, 'mvp01.document.revoked', doc.id, {
        documentId: doc.id,
        reason,
      });
    });

    return { success: true, documentId: doc.id, status: 'REVOKED', revokedReason: reason };
  }

  // ---------------------------------------------------------------------------
  // TRILHAS DE DOMÍNIO E TAREFAS
  // ---------------------------------------------------------------------------

  public async recordPracticeSession(
    ctx: Mvp01Context,
    input: {
      studentId: string;
      subject: string;
      skillCode: string;
      skillName?: string;
      questionsAnswered: number;
      independentCorrect: number;
      hintsUsed: number;
      durationSeconds?: number;
      completedReason?: string;
      consecutiveErrors?: number;
    }
  ) {
    await this.authorizeAndAudit(ctx, 'practice.submit', {
      schoolId: ctx.schoolId,
      studentId: input.studentId,
      resourceType: 'practice_session',
    });

    await this.assertRowInSchool<any>(
      ctx,
      'SELECT id, school_id FROM mvp01_students WHERE id = ?',
      input.studentId,
      'STUDENT_NOT_FOUND',
      'Estudante não encontrado.'
    );

    const subject = assertNonEmptyString(input.subject, 'INVALID_SUBJECT', 'Disciplina é obrigatória.');
    const skillCode = assertNonEmptyString(input.skillCode, 'INVALID_SKILL_CODE', 'Código da habilidade é obrigatório.');

    if (
      !Number.isInteger(input.questionsAnswered) ||
      input.questionsAnswered < 1 ||
      input.questionsAnswered > 8
    ) {
      throw new Mvp01Error(
        400,
        'PRACTICE_SESSION_QUESTION_LIMIT',
        'Cada sessão de prática deve ter entre 1 e 8 questões.'
      );
    }
    if (
      !Number.isInteger(input.independentCorrect) ||
      input.independentCorrect < 0 ||
      input.independentCorrect > input.questionsAnswered
    ) {
      throw new Mvp01Error(400, 'INVALID_INDEPENDENT_CORRECT', 'Contagem de acertos independentes inválida.');
    }
    if (!Number.isInteger(input.hintsUsed) || input.hintsUsed < 0) {
      throw new Mvp01Error(400, 'INVALID_HINTS_USED', 'Contagem de dicas inválida.');
    }

    const computeEstimate = (qCount: number, indCorrect: number, hints: number, consecutiveErrs: number) => {
      const rate = indCorrect / qCount;
      const hintPenalty = Math.min(0.25, (hints / Math.max(1, qCount)) * 0.15);
      const effectiveScore = Math.max(0, rate - hintPenalty);
      const estimatedLevel =
        effectiveScore >= 0.85 && qCount >= 5
          ? 'DOMINADO'
          : effectiveScore >= 0.65
          ? 'EM_CONSOLIDACAO'
          : effectiveScore >= 0.4
          ? 'EM_DESENVOLVIMENTO'
          : 'INICIAL';
      const confidenceLabel: 'BAIXA' | 'MEDIA' | 'ALTA' =
        qCount >= 6 && hints <= 1 ? 'ALTA' : qCount >= 3 ? 'MEDIA' : 'BAIXA';
      const needsTeacherReview = rate < 0.5 || consecutiveErrs >= 3 ? 1 : 0;
      return { estimatedLevel, confidenceLabel, needsTeacherReview };
    };

    const consecutiveErrors = input.consecutiveErrors ?? 0;
    const sessionMetrics = computeEstimate(
      input.questionsAnswered,
      input.independentCorrect,
      input.hintsUsed,
      consecutiveErrors
    );
    const sessionId = `prac-${randomUUID()}`;
    const now = this.nowIso();

    return await withMvp01Transaction(this.db, async () => {
      await mvp01Run(
        this.db,
        `INSERT INTO mvp01_practice_sessions
         (id, school_id, student_id, subject, skill_code, skill_name, questions_answered, independent_correct, hints_used, duration_seconds, completed_reason, consecutive_errors, estimated_level, confidence_label, needs_teacher_review, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          sessionId,
          ctx.schoolId,
          input.studentId,
          subject,
          skillCode,
          input.skillName ?? null,
          input.questionsAnswered,
          input.independentCorrect,
          input.hintsUsed,
          input.durationSeconds ?? 0,
          input.completedReason ?? 'COMPLETED',
          consecutiveErrors,
          sessionMetrics.estimatedLevel,
          sessionMetrics.confidenceLabel,
          sessionMetrics.needsTeacherReview,
          now,
        ]
      );

      const existingEst = await mvp01Get<any>(
        this.db,
        `SELECT * FROM mvp01_mastery_estimates
         WHERE school_id = ? AND student_id = ? AND subject = ? AND skill_code = ?`,
        [ctx.schoolId, input.studentId, subject, skillCode]
      );

      const totalQ = (existingEst?.questions_answered ?? 0) + input.questionsAnswered;
      const totalInd = (existingEst?.independent_correct ?? 0) + input.independentCorrect;
      const totalHints = (existingEst?.hints_used ?? 0) + input.hintsUsed;
      const totalDur = (existingEst?.duration_seconds ?? 0) + (input.durationSeconds ?? 0);
      const aggMetrics = computeEstimate(totalQ, totalInd, totalHints, consecutiveErrors);
      const finalReviewFlag =
        sessionMetrics.needsTeacherReview === 1 || aggMetrics.needsTeacherReview === 1 ? 1 : 0;

      if (existingEst) {
        await mvp01Run(
          this.db,
          `UPDATE mvp01_mastery_estimates
           SET skill_name = COALESCE(?, skill_name),
               questions_answered = ?, independent_correct = ?, hints_used = ?,
               duration_seconds = ?, completed_reason = ?, estimated_level = ?,
               confidence_label = ?, needs_teacher_review = ?, updated_at = ?
           WHERE id = ?`,
          [
            input.skillName ?? null,
            totalQ,
            totalInd,
            totalHints,
            totalDur,
            input.completedReason ?? 'COMPLETED',
            aggMetrics.estimatedLevel,
            aggMetrics.confidenceLabel,
            finalReviewFlag,
            now,
            existingEst.id,
          ]
        );
      } else {
        await mvp01Run(
          this.db,
          `INSERT INTO mvp01_mastery_estimates
           (id, school_id, student_id, subject, skill_code, skill_name, questions_answered, independent_correct, hints_used, duration_seconds, completed_reason, estimated_level, confidence_label, needs_teacher_review, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            `mast-${randomUUID()}`,
            ctx.schoolId,
            input.studentId,
            subject,
            skillCode,
            input.skillName ?? null,
            totalQ,
            totalInd,
            totalHints,
            totalDur,
            input.completedReason ?? 'COMPLETED',
            aggMetrics.estimatedLevel,
            aggMetrics.confidenceLabel,
            finalReviewFlag,
            now,
          ]
        );
      }

      await this.recordAudit(ctx, {
        action: 'PRACTICE_SESSION_RECORDED',
        resourceType: 'practice_session',
        resourceId: sessionId,
        metadata: {
          studentId: input.studentId,
          skillCode,
          estimatedLevel: aggMetrics.estimatedLevel,
          needsTeacherReview: finalReviewFlag,
        },
      });

      return {
        sessionId,
        studentId: input.studentId,
        subject,
        skillCode,
        questionsAnswered: input.questionsAnswered,
        independentCorrect: input.independentCorrect,
        hintsUsed: input.hintsUsed,
        estimatedLevel: aggMetrics.estimatedLevel,
        confidenceLabel: aggMetrics.confidenceLabel,
        needsTeacherReview: finalReviewFlag === 1,
      };
    });
  }

  public async saveTask(
    ctx: Mvp01Context,
    input: {
      id?: string;
      classId: string;
      subject?: string;
      title: string;
      description?: string;
      dueDate?: string;
    }
  ) {
    await this.rejectIfReadOnlyRole(ctx, input.id ? 'task.update' : 'task.create', {
      schoolId: ctx.schoolId,
      classId: input.classId,
      subject: input.subject,
      resourceType: 'task',
      resourceId: input.id,
    });

    const existing = input.id
      ? await this.assertRowInSchool<any>(
          ctx,
          'SELECT * FROM mvp01_tasks WHERE id = ?',
          input.id,
          'TASK_NOT_FOUND',
          'Tarefa não encontrada.'
        )
      : null;

    if (existing) {
      await this.authorizeAndAudit(ctx, 'task.update', {
        schoolId: existing.school_id,
        classId: existing.class_id,
        subject: existing.subject ?? undefined,
        resourceType: 'task',
        resourceId: existing.id,
      });
      await this.authorizeAndAudit(ctx, 'task.update', {
        schoolId: ctx.schoolId,
        classId: input.classId,
        subject: input.subject ?? existing.subject ?? undefined,
        resourceType: 'task',
        resourceId: existing.id,
      });
    } else {
      await this.authorizeAndAudit(ctx, 'task.create', {
        schoolId: ctx.schoolId,
        classId: input.classId,
        subject: input.subject,
        resourceType: 'task',
      });
    }

    await this.assertRowInSchool<any>(
      ctx,
      'SELECT id, school_id FROM mvp01_classes WHERE id = ?',
      input.classId,
      'CLASS_NOT_FOUND',
      'Turma não encontrada.'
    );
    const title = assertNonEmptyString(input.title, 'INVALID_TASK_TITLE', 'Título da tarefa é obrigatório.');
    const id = existing ? existing.id : `task-${randomUUID()}`;
    const now = this.nowIso();

    await withMvp01Transaction(this.db, async () => {
      if (existing) {
        await mvp01Run(
          this.db,
          `UPDATE mvp01_tasks
           SET class_id = ?, subject = ?, title = ?, description = ?, due_date = ?
           WHERE id = ?`,
          [
            input.classId,
            input.subject ?? existing.subject,
            title,
            input.description ?? existing.description,
            input.dueDate ?? existing.due_date,
            existing.id,
          ]
        );
      } else {
        await mvp01Run(
          this.db,
          `INSERT INTO mvp01_tasks
           (id, school_id, class_id, subject, title, description, due_date, teacher_user_id, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [id, ctx.schoolId, input.classId, input.subject ?? null, title, input.description ?? null, input.dueDate ?? null, ctx.userId, now]
        );
      }
      await this.recordAudit(ctx, {
        action: existing ? 'TASK_UPDATED' : 'TASK_CREATED',
        resourceType: 'task',
        resourceId: id,
      });
    });

    return await mvp01Get(this.db, 'SELECT * FROM mvp01_tasks WHERE id = ?', [id]);
  }

  public async completeTask(
    ctx: Mvp01Context,
    input: { taskId: string; studentId: string; completed: boolean }
  ) {
    await this.authorizeAndAudit(ctx, 'task.submit', {
      schoolId: ctx.schoolId,
      studentId: input.studentId,
      resourceType: 'task_completion',
      resourceId: input.taskId,
    });

    const task = await this.assertRowInSchool<any>(
      ctx,
      'SELECT * FROM mvp01_tasks WHERE id = ?',
      input.taskId,
      'TASK_NOT_FOUND',
      'Tarefa não encontrada.'
    );

    const activeMembership = await mvp01Get<any>(
      this.db,
      `SELECT cm.id
       FROM mvp01_class_memberships cm
       JOIN mvp01_enrollments e ON e.id = cm.enrollment_id
       WHERE cm.school_id = ?
         AND e.student_id = ?
         AND e.status = 'ATIVA'
         AND cm.class_id = ?
         AND cm.ended_at IS NULL
       LIMIT 1`,
      [ctx.schoolId, input.studentId, task.class_id]
    );
    if (!activeMembership) {
      throw new Mvp01Error(403, 'FORBIDDEN_TASK_SCOPE', 'Estudante não está enturmado na turma desta tarefa.');
    }

    const now = this.nowIso();
    const completedInt = input.completed ? 1 : 0;

    await withMvp01Transaction(this.db, async () => {
      await mvp01Run(
        this.db,
        `INSERT INTO mvp01_task_completions (id, task_id, student_id, completed, updated_at)
         VALUES (?, ?, ?, ?, ?)
         ON CONFLICT(task_id, student_id) DO UPDATE SET
           completed = excluded.completed,
           updated_at = excluded.updated_at`,
        [`tc-${randomUUID()}`, task.id, input.studentId, completedInt, now]
      );
      await this.recordAudit(ctx, {
        action: 'TASK_COMPLETION_SAVED',
        resourceType: 'task_completion',
        resourceId: task.id,
        metadata: { studentId: input.studentId, completed: completedInt },
      });
    });

    return { taskId: task.id, studentId: input.studentId, completed: input.completed, updatedAt: now };
  }

  // ---------------------------------------------------------------------------
  // GRADE HORÁRIA, CALENDÁRIO E CARGA HORÁRIA ANUAL
  // ---------------------------------------------------------------------------

  public async saveTimetableSlot(
    ctx: Mvp01Context,
    input: {
      id?: string;
      academicYearId: string;
      classId: string;
      dayOfWeek: number;
      slotIndex: number;
      startTime?: string;
      endTime?: string;
      subject: string;
      teacherUserId?: string;
      published?: boolean;
    }
  ) {
    await this.authorizeAndAudit(ctx, 'timetable.update', {
      schoolId: ctx.schoolId,
      classId: input.classId,
      resourceType: 'timetable_slot',
      resourceId: input.id,
    });
    if (input.published) {
      await this.authorizeAndAudit(ctx, 'timetable.publish', {
        schoolId: ctx.schoolId,
        classId: input.classId,
      });
    }

    await this.assertRowInSchool<any>(
      ctx,
      'SELECT id, school_id FROM mvp01_academic_years WHERE id = ?',
      input.academicYearId,
      'ACADEMIC_YEAR_NOT_FOUND',
      'Ano letivo não encontrado.'
    );
    await this.assertRowInSchool<any>(
      ctx,
      'SELECT id, school_id FROM mvp01_classes WHERE id = ?',
      input.classId,
      'CLASS_NOT_FOUND',
      'Turma não encontrada.'
    );
    const subject = assertNonEmptyString(input.subject, 'INVALID_SUBJECT', 'Disciplina obrigatória.');

    return await withMvp01Transaction(this.db, async () => {
      const existing = input.id
        ? await mvp01Get<any>(this.db, 'SELECT * FROM mvp01_timetable_slots WHERE id = ?', [input.id])
        : await mvp01Get<any>(
            this.db,
            `SELECT * FROM mvp01_timetable_slots
             WHERE school_id = ? AND academic_year_id = ? AND class_id = ? AND day_of_week = ? AND slot_index = ?`,
            [ctx.schoolId, input.academicYearId, input.classId, input.dayOfWeek, input.slotIndex]
          );

      if (existing && existing.school_id !== ctx.schoolId) {
        authorize(ctx, 'school.read', { schoolId: existing.school_id });
      }

      const id = existing ? existing.id : input.id || `slot-${randomUUID()}`;
      const nextVersion = existing ? existing.version + 1 : 1;
      const publishedInt = input.published === false ? 0 : 1;

      if (existing) {
        await mvp01Run(
          this.db,
          `UPDATE mvp01_timetable_slots
           SET start_time = ?, end_time = ?, subject = ?, teacher_user_id = ?, version = ?, published = ?
           WHERE id = ?`,
          [
            input.startTime ?? existing.start_time,
            input.endTime ?? existing.end_time,
            subject,
            input.teacherUserId ?? existing.teacher_user_id,
            nextVersion,
            publishedInt,
            id,
          ]
        );
      } else {
        await mvp01Run(
          this.db,
          `INSERT INTO mvp01_timetable_slots
           (id, school_id, academic_year_id, class_id, day_of_week, slot_index, start_time, end_time, subject, teacher_user_id, version, published)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)`,
          [
            id,
            ctx.schoolId,
            input.academicYearId,
            input.classId,
            input.dayOfWeek,
            input.slotIndex,
            input.startTime ?? null,
            input.endTime ?? null,
            subject,
            input.teacherUserId ?? null,
            publishedInt,
          ]
        );
      }

      await this.recordAudit(ctx, {
        action: 'TIMETABLE_SLOT_SAVED',
        resourceType: 'timetable_slot',
        resourceId: id,
        metadata: { classId: input.classId, dayOfWeek: input.dayOfWeek, slotIndex: input.slotIndex, version: nextVersion },
      });

      return await mvp01Get(this.db, 'SELECT * FROM mvp01_timetable_slots WHERE id = ?', [id]);
    });
  }

  public async upsertCalendarHoliday(
    ctx: Mvp01Context,
    input: {
      id?: string;
      academicYearId: string;
      date: string;
      name: string;
      origin: 'BRASIL_API' | 'ESCOLA' | 'ESTADUAL' | 'MUNICIPAL';
      status?: 'CANDIDATE' | 'APPROVED' | 'REJECTED';
    }
  ) {
    await this.authorizeAndAudit(ctx, 'calendar.update', {
      schoolId: ctx.schoolId,
      resourceType: 'calendar_holiday',
      resourceId: input.id,
    });

    await this.assertRowInSchool<any>(
      ctx,
      'SELECT id, school_id FROM mvp01_academic_years WHERE id = ?',
      input.academicYearId,
      'ACADEMIC_YEAR_NOT_FOUND',
      'Ano letivo não encontrado.'
    );
    const date = assertNonEmptyString(input.date, 'INVALID_DATE', 'Data do feriado é obrigatória.');
    const name = assertNonEmptyString(input.name, 'INVALID_NAME', 'Nome do feriado é obrigatório.');
    if (!['BRASIL_API', 'ESCOLA', 'ESTADUAL', 'MUNICIPAL'].includes(input.origin)) {
      throw new Mvp01Error(400, 'INVALID_HOLIDAY_ORIGIN', 'Origem de feriado inválida.');
    }
    const status = input.status || 'CANDIDATE';
    if (!['CANDIDATE', 'APPROVED', 'REJECTED'].includes(status)) {
      throw new Mvp01Error(400, 'INVALID_HOLIDAY_STATUS', 'Status de feriado inválido.');
    }

    const now = this.nowIso();
    const id = input.id || `hol-${randomUUID()}`;

    await withMvp01Transaction(this.db, async () => {
      await mvp01Run(
        this.db,
        `INSERT INTO mvp01_calendar_holidays
         (id, school_id, academic_year_id, date, name, origin, status, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(school_id, academic_year_id, date) DO UPDATE SET
           name = excluded.name,
           origin = excluded.origin,
           status = excluded.status,
           updated_at = excluded.updated_at`,
        [id, ctx.schoolId, input.academicYearId, date, name, input.origin, status, now]
      );
      await this.recordAudit(ctx, {
        action: 'CALENDAR_HOLIDAY_UPSERTED',
        resourceType: 'calendar_holiday',
        resourceId: id,
        metadata: { date, origin: input.origin, status },
      });
    });

    return await mvp01Get(
      this.db,
      'SELECT * FROM mvp01_calendar_holidays WHERE school_id = ? AND academic_year_id = ? AND date = ?',
      [ctx.schoolId, input.academicYearId, date]
    );
  }

  public async updateAcademicYearHours(
    ctx: Mvp01Context,
    input: {
      academicYearId: string;
      completedHours?: number;
      plannedDays?: number;
      plannedHours?: number;
      legalBasis?: string;
    }
  ) {
    await this.authorizeAndAudit(ctx, 'academic_year.update', {
      schoolId: ctx.schoolId,
      resourceType: 'academic_year',
      resourceId: input.academicYearId,
    });

    const ay = await this.assertRowInSchool<any>(
      ctx,
      'SELECT * FROM mvp01_academic_years WHERE id = ?',
      input.academicYearId,
      'ACADEMIC_YEAR_NOT_FOUND',
      'Ano letivo não encontrado.'
    );

    if (
      (input.completedHours !== undefined && input.completedHours < 0) ||
      (input.plannedDays !== undefined && input.plannedDays < 0) ||
      (input.plannedHours !== undefined && input.plannedHours < 0)
    ) {
      throw new Mvp01Error(400, 'INVALID_HOURS', 'Valores de dias e carga horária não podem ser negativos.');
    }

    await withMvp01Transaction(this.db, async () => {
      await mvp01Run(
        this.db,
        `UPDATE mvp01_academic_years
         SET completed_hours = ?, planned_days = ?, planned_hours = ?, legal_basis = ?
         WHERE id = ?`,
        [
          input.completedHours ?? ay.completed_hours,
          input.plannedDays ?? ay.planned_days,
          input.plannedHours ?? ay.planned_hours,
          input.legalBasis ?? ay.legal_basis,
          ay.id,
        ]
      );
      await this.recordAudit(ctx, {
        action: 'ACADEMIC_YEAR_HOURS_UPDATED',
        resourceType: 'academic_year',
        resourceId: ay.id,
        metadata: {
          completedHours: input.completedHours ?? ay.completed_hours,
          plannedDays: input.plannedDays ?? ay.planned_days,
          plannedHours: input.plannedHours ?? ay.planned_hours,
        },
      });
    });

    return await mvp01Get(this.db, 'SELECT * FROM mvp01_academic_years WHERE id = ?', [ay.id]);
  }

  // ---------------------------------------------------------------------------
  // CONVITES DE USUÁRIOS
  // ---------------------------------------------------------------------------

  public async createUserInvitation(
    ctx: Mvp01Context,
    input: {
      email: string;
      role: string;
      userId?: string | null;
      membershipId?: string | null;
      expiresInHours?: number;
    }
  ) {
    await this.authorizeAndAudit(ctx, 'invitation.create', {
      schoolId: ctx.schoolId,
      resourceType: 'user_invitation',
    });

    const email = assertNonEmptyString(input.email, 'INVALID_EMAIL', 'E-mail do convidado é obrigatório.').toLowerCase();
    if (!email.includes('@')) {
      throw new Mvp01Error(400, 'INVALID_EMAIL', 'Formato de e-mail inválido.');
    }
    const role = assertNonEmptyString(input.role, 'INVALID_ROLE', 'Papel institucional é obrigatório.').toLowerCase();
    if (!canonicalizeMvp01Role(role)) {
      throw new Mvp01Error(400, 'INVALID_ROLE', `Papel institucional inválido: '${role}'.`);
    }

    const expiresInHours = input.expiresInHours ?? 72;
    if (!Number.isFinite(expiresInHours) || expiresInHours < 1 || expiresInHours > 720) {
      throw new Mvp01Error(400, 'INVALID_EXPIRATION', 'Validade do convite deve estar entre 1 e 720 horas.');
    }

    const inviteToken = randomBytes(24).toString('hex');
    const inviteTokenHash = createHash('sha256').update(inviteToken).digest('hex');
    const id = `inv-${randomUUID()}`;
    const now = this.nowIso();
    const expiresAt = new Date(Date.now() + expiresInHours * 3600 * 1000).toISOString();

    await withMvp01Transaction(this.db, async () => {
      await mvp01Run(
        this.db,
        `INSERT INTO mvp01_user_invitations
         (id, school_id, user_id, membership_id, email, role, invite_token_hash, status, expires_at, created_by, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'PENDING', ?, ?, ?)`,
        [
          id,
          ctx.schoolId,
          input.userId ?? null,
          input.membershipId ?? null,
          email,
          role,
          inviteTokenHash,
          expiresAt,
          ctx.userId,
          now,
        ]
      );
      await this.recordAudit(ctx, {
        action: 'USER_INVITATION_CREATED',
        resourceType: 'user_invitation',
        resourceId: id,
        metadata: { email, role, expiresAt },
      });
      await this.recordOutbox(ctx.schoolId, 'mvp01.invitation.created', id, {
        invitationId: id,
        email,
        role,
        expiresAt,
      });
    });

    return {
      id,
      schoolId: ctx.schoolId,
      userId: input.userId ?? null,
      membershipId: input.membershipId ?? null,
      email,
      role,
      status: 'PENDING',
      expiresAt,
      createdBy: ctx.userId,
      createdAt: now,
      inviteToken,
    };
  }

  public async listUserInvitations(
    ctx: Mvp01Context,
    input?: { status?: 'PENDING' | 'ACCEPTED' | 'REVOKED' | 'EXPIRED' }
  ) {
    await this.authorizeAndAudit(ctx, 'invitation.read', {
      schoolId: ctx.schoolId,
      resourceType: 'user_invitation',
    });

    if (input?.status && !['PENDING', 'ACCEPTED', 'REVOKED', 'EXPIRED'].includes(input.status)) {
      throw new Mvp01Error(400, 'INVALID_INVITATION_STATUS', 'Status de convite inválido.');
    }

    const rows = input?.status
      ? await mvp01All<any>(
          this.db,
          `SELECT id, school_id, user_id, membership_id, email, role, status, expires_at, created_by, created_at
           FROM mvp01_user_invitations
           WHERE school_id = ? AND status = ?
           ORDER BY created_at DESC`,
          [ctx.schoolId, input.status]
        )
      : await mvp01All<any>(
          this.db,
          `SELECT id, school_id, user_id, membership_id, email, role, status, expires_at, created_by, created_at
           FROM mvp01_user_invitations
           WHERE school_id = ?
           ORDER BY created_at DESC`,
          [ctx.schoolId]
        );

    return rows;
  }

  public async revokeUserInvitation(
    ctx: Mvp01Context,
    input: { invitationId: string; reason?: string }
  ) {
    await this.authorizeAndAudit(ctx, 'invitation.revoke', {
      schoolId: ctx.schoolId,
      resourceType: 'user_invitation',
      resourceId: input.invitationId,
    });

    const invitation = await this.assertRowInSchool<any>(
      ctx,
      'SELECT * FROM mvp01_user_invitations WHERE id = ?',
      input.invitationId,
      'INVITATION_NOT_FOUND',
      'Convite não encontrado.'
    );

    if (invitation.status !== 'PENDING') {
      throw new Mvp01Error(409, 'INVITATION_NOT_PENDING', 'Apenas convites pendentes podem ser revogados.');
    }

    await withMvp01Transaction(this.db, async () => {
      const upd = await mvp01Run(
        this.db,
        `UPDATE mvp01_user_invitations SET status = 'REVOKED' WHERE id = ? AND status = 'PENDING'`,
        [invitation.id]
      );
      if ((upd?.changes ?? 0) === 0) {
        throw new Mvp01Error(409, 'INVITATION_NOT_PENDING', 'Apenas convites pendentes podem ser revogados.');
      }
      await this.recordAudit(ctx, {
        action: 'USER_INVITATION_REVOKED',
        resourceType: 'user_invitation',
        resourceId: invitation.id,
        reason: input.reason ?? 'Revogação administrativa de convite',
        metadata: { email: invitation.email, role: invitation.role },
      });
      await this.recordOutbox(ctx.schoolId, 'mvp01.invitation.revoked', invitation.id, {
        invitationId: invitation.id,
        email: invitation.email,
      });
    });

    return { success: true, invitationId: invitation.id, status: 'REVOKED' };
  }

  // ---------------------------------------------------------------------------
  // VISÃO AGREGADA AUTORIZADA POR PORTAL
  // ---------------------------------------------------------------------------

  public async getPortalOverview(
    ctx: Mvp01Context,
    portal: Mvp01PortalType,
    options?: { studentId?: string; classId?: string }
  ) {
    await this.authorizeAndAudit(ctx, 'portal.overview.read', {
      schoolId: ctx.schoolId,
      studentId: options?.studentId,
      classId: options?.classId,
      resourceType: 'portal',
      resourceId: portal,
    });

    const canonicalRole = canonicalizeMvp01Role(ctx.activeRole);
    const allowedRoles = PORTAL_ALLOWED_ROLES[portal];
    if (!allowedRoles || !canonicalRole || !allowedRoles.has(canonicalRole)) {
      throw new Mvp01Error(
        403,
        'FORBIDDEN_PORTAL_ACCESS',
        `Papel '${ctx.activeRole}' não tem acesso ao portal '${portal}'.`
      );
    }

    const school = await mvp01Get<any>(
      this.db,
      'SELECT id, name, cnpj, city, state FROM mvp01_schools WHERE id = ?',
      [ctx.schoolId]
    );
    const academicYears = await mvp01All<any>(
      this.db,
      'SELECT * FROM mvp01_academic_years WHERE school_id = ? ORDER BY year DESC, stage ASC',
      [ctx.schoolId]
    );
    const academicPeriods = await mvp01All<any>(
      this.db,
      'SELECT * FROM mvp01_academic_periods WHERE school_id = ? ORDER BY start_date ASC, id ASC',
      [ctx.schoolId]
    );

    if (portal === 'direction') {
      const updatedAt = this.nowIso();
      const activeEnrollRow = await mvp01Get<{ total: number }>(
        this.db,
        `SELECT COUNT(*) as total FROM mvp01_enrollments WHERE school_id = ? AND status = 'ATIVA'`,
        [ctx.schoolId]
      );
      const attRow = await mvp01Get<{ total: number; present_like: number }>(
        this.db,
        `SELECT
           COUNT(*) as total,
           SUM(CASE WHEN status IN ('PRESENT','LATE','JUSTIFIED') THEN 1 ELSE 0 END) as present_like
         FROM mvp01_attendance_records
         WHERE school_id = ?`,
        [ctx.schoolId]
      );
      const openIncidentsRow = await mvp01Get<{ total: number }>(
        this.db,
        `SELECT COUNT(*) as total FROM mvp01_incidents WHERE school_id = ? AND status != 'RESOLVED'`,
        [ctx.schoolId]
      );
      const docsRow = await mvp01Get<{ total: number }>(
        this.db,
        `SELECT COUNT(*) as total FROM mvp01_issued_documents WHERE school_id = ? AND status = 'ACTIVE'`,
        [ctx.schoolId]
      );
      const consistency = await this.runConsistencyVerification(ctx);

      const attTotal = Number(attRow?.total ?? 0);
      const attPresent = Number(attRow?.present_like ?? 0);
      const attendanceRate = attTotal > 0 ? Number(((attPresent / attTotal) * 100).toFixed(1)) : 100;

      const avgHoursPct =
        academicYears.length > 0
          ? Number(
              (
                (academicYears.reduce(
                  (acc, y) => acc + Number(y.completed_hours ?? 0) / Math.max(1, Number(y.min_hours ?? 800)),
                  0
                ) /
                  academicYears.length) *
                100
              ).toFixed(1)
            )
          : 0;

      const kpis: DirectionKpi[] = [
        {
          key: 'active_enrollments',
          label: 'Matrículas Ativas',
          value: Number(activeEnrollRow?.total ?? 0),
          formula: "COUNT(mvp01_enrollments WHERE status = 'ATIVA')",
          period: 'Ano Letivo Corrente',
          updatedAt,
        },
        {
          key: 'attendance_rate',
          label: 'Taxa Média de Frequência (%)',
          value: attendanceRate,
          formula: "(PRESENT + LATE + JUSTIFIED) / TOTAL * 100",
          period: 'Acumulado Letivo',
          updatedAt,
        },
        {
          key: 'academic_hours_progress',
          label: 'Cumprimento da Carga Horária Mínima (%)',
          value: avgHoursPct,
          formula: 'AVG(completed_hours / min_hours) * 100',
          period: 'Anos Letivos Abertos',
          updatedAt,
        },
        {
          key: 'consistency_blockers',
          label: 'Pendências Bloqueantes de Consistência',
          value: consistency.blockingCount,
          formula: "COUNT(consistency_issues WHERE severity = 'BLOQUEIO')",
          period: 'Execução Atual',
          updatedAt,
        },
        {
          key: 'open_incidents',
          label: 'Ocorrências em Acompanhamento',
          value: Number(openIncidentsRow?.total ?? 0),
          formula: "COUNT(mvp01_incidents WHERE status != 'RESOLVED')",
          period: 'Acumulado',
          updatedAt,
        },
        {
          key: 'active_documents',
          label: 'Documentos Oficiais Ativos',
          value: Number(docsRow?.total ?? 0),
          formula: "COUNT(mvp01_issued_documents WHERE status = 'ACTIVE')",
          period: 'Acumulado',
          updatedAt,
        },
      ];

      // Direção NÃO recebe internal_notes nem detalhes sensíveis de saúde
      const incidentSummaries = await mvp01All<any>(
        this.db,
        `SELECT id, student_id, class_id, category, title, published_summary, published_to_family, status, created_at
         FROM mvp01_incidents
         WHERE school_id = ?
         ORDER BY created_at DESC LIMIT 20`,
        [ctx.schoolId]
      );

      return {
        portal,
        readOnly: true,
        school,
        kpis,
        academicYears,
        academicPeriods,
        incidentSummaries,
        consistencySummary: {
          blockingCount: consistency.blockingCount,
          warningCount: consistency.warningCount,
        },
      };
    }

    if (portal === 'secretariat') {
      const classes = await mvp01All<any>(
        this.db,
        `SELECT c.*,
                (SELECT COUNT(*) FROM mvp01_class_memberships cm WHERE cm.class_id = c.id AND cm.ended_at IS NULL) as occupied
         FROM mvp01_classes c
         WHERE c.school_id = ?
         ORDER BY c.name ASC`,
        [ctx.schoolId]
      );
      const drafts = await mvp01All<any>(
        this.db,
        `SELECT * FROM mvp01_enrollment_drafts WHERE school_id = ? ORDER BY updated_at DESC`,
        [ctx.schoolId]
      );
      const enrollments = await mvp01All<any>(
        this.db,
        `SELECT e.*, s.full_name, s.registration_code, cm.class_id
         FROM mvp01_enrollments e
         JOIN mvp01_students s ON s.id = e.student_id
         LEFT JOIN mvp01_class_memberships cm ON cm.enrollment_id = e.id AND cm.ended_at IS NULL
         WHERE e.school_id = ?
         ORDER BY s.full_name ASC`,
        [ctx.schoolId]
      );
      const issuedDocuments = await mvp01All<any>(
        this.db,
        `SELECT id, student_id, enrollment_id, doc_type, version, policy_version_id, content_hash_sha256, verification_token, status, issued_at
         FROM mvp01_issued_documents
         WHERE school_id = ?
         ORDER BY issued_at DESC LIMIT 50`,
        [ctx.schoolId]
      );
      const consistency = await this.runConsistencyVerification(ctx);
      const calendarHolidays = await mvp01All<any>(
        this.db,
        'SELECT * FROM mvp01_calendar_holidays WHERE school_id = ? ORDER BY date ASC',
        [ctx.schoolId]
      );

      return {
        portal,
        school,
        academicYears,
        academicPeriods,
        classes,
        enrollmentDrafts: drafts,
        enrollments,
        issuedDocuments,
        consistency,
        calendarHolidays,
      };
    }

    if (portal === 'coordination') {
      const scopedClasses = ctx.coordinationClassIds;
      const classes =
        scopedClasses.length > 0
          ? await mvp01All<any>(
              this.db,
              `SELECT * FROM mvp01_classes
               WHERE school_id = ? AND id IN (${scopedClasses.map(() => '?').join(',')})`,
              [ctx.schoolId, ...scopedClasses]
            )
          : await mvp01All<any>(
              this.db,
              `SELECT * FROM mvp01_classes WHERE school_id = ?`,
              [ctx.schoolId]
            );

      const incidents =
        scopedClasses.length > 0
          ? await mvp01All<any>(
              this.db,
              `SELECT * FROM mvp01_incidents
               WHERE school_id = ? AND (class_id IS NULL OR class_id IN (${scopedClasses.map(() => '?').join(',')}))
               ORDER BY created_at DESC`,
              [ctx.schoolId, ...scopedClasses]
            )
          : await mvp01All<any>(
              this.db,
              `SELECT * FROM mvp01_incidents WHERE school_id = ? ORDER BY created_at DESC`,
              [ctx.schoolId]
            );

      const pendingJustifications =
        scopedClasses.length > 0
          ? await mvp01All<any>(
              this.db,
              `SELECT DISTINCT j.*, s.full_name as student_name
               FROM mvp01_absence_justifications j
               JOIN mvp01_students s ON s.id = j.student_id
               JOIN mvp01_enrollments e ON e.student_id = j.student_id AND e.school_id = j.school_id AND e.status = 'ATIVA'
               JOIN mvp01_class_memberships cm ON cm.enrollment_id = e.id AND cm.school_id = j.school_id AND cm.ended_at IS NULL
               WHERE j.school_id = ? AND j.status = 'PENDING_REVIEW'
                 AND cm.class_id IN (${scopedClasses.map(() => '?').join(',')})
               ORDER BY j.created_at DESC`,
              [ctx.schoolId, ...scopedClasses]
            )
          : await mvp01All<any>(
              this.db,
              `SELECT j.*, s.full_name as student_name
               FROM mvp01_absence_justifications j
               JOIN mvp01_students s ON s.id = j.student_id
               WHERE j.school_id = ? AND j.status = 'PENDING_REVIEW'
               ORDER BY j.created_at DESC`,
              [ctx.schoolId]
            );

      const masteryAlerts =
        scopedClasses.length > 0
          ? await mvp01All<any>(
              this.db,
              `SELECT DISTINCT me.*
               FROM mvp01_mastery_estimates me
               JOIN mvp01_enrollments e ON e.student_id = me.student_id AND e.school_id = me.school_id AND e.status = 'ATIVA'
               JOIN mvp01_class_memberships cm ON cm.enrollment_id = e.id AND cm.school_id = me.school_id AND cm.ended_at IS NULL
               WHERE me.school_id = ? AND me.needs_teacher_review = 1
                 AND cm.class_id IN (${scopedClasses.map(() => '?').join(',')})`,
              [ctx.schoolId, ...scopedClasses]
            )
          : await mvp01All<any>(
              this.db,
              `SELECT * FROM mvp01_mastery_estimates WHERE school_id = ? AND needs_teacher_review = 1`,
              [ctx.schoolId]
            );

      const calendarHolidays = await mvp01All<any>(
        this.db,
        'SELECT * FROM mvp01_calendar_holidays WHERE school_id = ? ORDER BY date ASC',
        [ctx.schoolId]
      );

      return {
        portal,
        school,
        academicYears,
        academicPeriods,
        classes,
        incidents,
        pendingJustifications,
        masteryAlerts,
        calendarHolidays,
      };
    }

    if (portal === 'teacher') {
      const classIds = Array.from(new Set(ctx.assignedClasses.map((a) => a.classId)));
      if (classIds.length === 0) {
        return {
          portal,
          school,
          academicPeriods,
          assignedClasses: [],
          classes: [],
          students: [],
          attendanceSheets: [],
          gradeEntries: [],
          tasks: [],
          incidents: [],
        };
      }

      const placeholders = classIds.map(() => '?').join(',');
      const pairClauses = ctx.assignedClasses
        .map(() => "(class_id = ? AND LOWER(TRIM(COALESCE(subject, ''))) = ?)")
        .join(' OR ');
      const pairParams = ctx.assignedClasses.flatMap((a) => [
        a.classId,
        a.subject.trim().toLowerCase(),
      ]);

      const classes = await mvp01All<any>(
        this.db,
        `SELECT * FROM mvp01_classes WHERE school_id = ? AND id IN (${placeholders})`,
        [ctx.schoolId, ...classIds]
      );
      // Omite health_summary_restricted na visão docente
      const students = await mvp01All<any>(
        this.db,
        `SELECT s.id, s.full_name, s.registration_code, cm.class_id, e.id as enrollment_id
         FROM mvp01_students s
         JOIN mvp01_enrollments e ON e.student_id = s.id AND e.status = 'ATIVA'
         JOIN mvp01_class_memberships cm ON cm.enrollment_id = e.id AND cm.ended_at IS NULL
         WHERE s.school_id = ? AND cm.class_id IN (${placeholders})
         ORDER BY s.full_name ASC`,
        [ctx.schoolId, ...classIds]
      );
      const attendanceSheets = await mvp01All<any>(
        this.db,
        `SELECT * FROM mvp01_attendance_sheets
         WHERE school_id = ? AND (${pairClauses})
         ORDER BY lesson_date DESC LIMIT 30`,
        [ctx.schoolId, ...pairParams]
      );
      const gradeEntries = await mvp01All<any>(
        this.db,
        `SELECT * FROM mvp01_grade_entries
         WHERE school_id = ? AND (${pairClauses})`,
        [ctx.schoolId, ...pairParams]
      );
      const tasks = await mvp01All<any>(
        this.db,
        `SELECT * FROM mvp01_tasks
         WHERE school_id = ? AND (${pairClauses})
         ORDER BY created_at DESC`,
        [ctx.schoolId, ...pairParams]
      );
      const incidents = await mvp01All<any>(
        this.db,
        `SELECT * FROM mvp01_incidents
         WHERE school_id = ? AND (class_id IN (${placeholders}) OR created_by = ?)
         ORDER BY created_at DESC`,
        [ctx.schoolId, ...classIds, ctx.userId]
      );

      return {
        portal,
        school,
        academicPeriods,
        assignedClasses: ctx.assignedClasses,
        classes,
        students,
        attendanceSheets,
        gradeEntries,
        tasks,
        incidents,
      };
    }

    if (portal === 'family') {
      let targetIds =
        canonicalRole === 'parent'
          ? options?.studentId
            ? [options.studentId]
            : ctx.authorizedStudentIds
          : options?.studentId
          ? [options.studentId]
          : ctx.authorizedStudentIds;

      if (canonicalRole === 'admin' && targetIds.length === 0) {
        const previewStudents = await mvp01All<{ id: string }>(
          this.db,
          'SELECT id FROM mvp01_students WHERE school_id = ? ORDER BY created_at ASC LIMIT 5',
          [ctx.schoolId]
        );
        targetIds = previewStudents.map((s) => s.id);
      }

      if (targetIds.length === 0) {
        return {
          portal,
          school,
          academicPeriods,
          students: [],
          attendance: [],
          grades: [],
          incidents: [],
          communications: [],
          receipts: [],
          justifications: [],
        };
      }

      const placeholders = targetIds.map(() => '?').join(',');

      // Omite health_summary_restricted em consultas gerais de portal se não solicitado ou mantém apenas dados permitidos ao responsável
      const students = await mvp01All<any>(
        this.db,
        `SELECT s.id, s.full_name, s.birth_date, s.registration_code, s.photo_url, s.pickup_notes,
                cm.class_id, c.name as class_name
         FROM mvp01_students s
         LEFT JOIN mvp01_enrollments e ON e.student_id = s.id AND e.status = 'ATIVA'
         LEFT JOIN mvp01_class_memberships cm ON cm.enrollment_id = e.id AND cm.ended_at IS NULL
         LEFT JOIN mvp01_classes c ON c.id = cm.class_id
         WHERE s.school_id = ? AND s.id IN (${placeholders})`,
        [ctx.schoolId, ...targetIds]
      );

      const classIds = Array.from(
        new Set(students.map((s) => s.class_id).filter((id): id is string => !!id))
      );

      const attendance = await mvp01All<any>(
        this.db,
        `SELECT ar.id, ar.student_id, ar.status, ar.updated_at, sh.subject, sh.lesson_date
         FROM mvp01_attendance_records ar
         JOIN mvp01_attendance_sheets sh ON sh.id = ar.sheet_id
         WHERE ar.school_id = ? AND ar.student_id IN (${placeholders})
         ORDER BY sh.lesson_date DESC LIMIT 100`,
        [ctx.schoolId, ...targetIds]
      );

      // Apenas notas publicadas
      const grades = await mvp01All<any>(
        this.db,
        `SELECT id, student_id, class_id, subject, period_id, n1, n2, n3, recovery, entry_state, final_average, updated_at
         FROM mvp01_grade_entries
         WHERE school_id = ? AND student_id IN (${placeholders}) AND published = 1`,
        [ctx.schoolId, ...targetIds]
      );

      // Apenas ocorrências publicadas à família e NUNCA inclui internal_notes
      const incidents = await mvp01All<any>(
        this.db,
        `SELECT id, student_id, class_id, category, title, published_summary, status, family_ack_at, family_ack_by, created_at
         FROM mvp01_incidents
         WHERE school_id = ? AND student_id IN (${placeholders}) AND published_to_family = 1
         ORDER BY created_at DESC`,
        [ctx.schoolId, ...targetIds]
      );

      const communications = await mvp01All<any>(
        this.db,
        `SELECT * FROM mvp01_communications
         WHERE school_id = ? AND status = 'PUBLISHED'
           AND (
             target_scope = 'ALL_SCHOOL'
             OR target_student_id IN (${placeholders})
             ${classIds.length > 0 ? `OR target_class_id IN (${classIds.map(() => '?').join(',')})` : ''}
           )
         ORDER BY published_at DESC`,
        [ctx.schoolId, ...targetIds, ...classIds]
      );

      const receipts = await mvp01All<any>(
        this.db,
        `SELECT * FROM mvp01_communication_receipts
         WHERE school_id = ? AND user_id = ? AND student_id IN (${placeholders})`,
        [ctx.schoolId, ctx.userId, ...targetIds]
      );

      const justifications = await mvp01All<any>(
        this.db,
        `SELECT * FROM mvp01_absence_justifications
         WHERE school_id = ? AND student_id IN (${placeholders})
         ORDER BY created_at DESC`,
        [ctx.schoolId, ...targetIds]
      );

      return {
        portal,
        school,
        academicPeriods,
        students,
        attendance,
        grades,
        incidents,
        communications,
        receipts,
        justifications,
      };
    }

    // portal === 'student'
    let ownId = canonicalRole === 'student' ? ctx.ownStudentId : options?.studentId || ctx.ownStudentId;
    if (canonicalRole === 'admin' && !ownId) {
      const firstStudent = await mvp01Get<{ id: string }>(
        this.db,
        'SELECT id FROM mvp01_students WHERE school_id = ? ORDER BY created_at ASC LIMIT 1',
        [ctx.schoolId]
      );
      ownId = firstStudent?.id ?? null;
    }

    if (!ownId) {
      return {
        portal,
        school,
        academicPeriods,
        student: null,
        grades: [],
        attendance: [],
        tasks: [],
        masteryEstimates: [],
      };
    }
    const student = await mvp01Get<any>(
      this.db,
      `SELECT s.id, s.full_name, s.registration_code, s.photo_url, cm.class_id, c.name as class_name
       FROM mvp01_students s
       LEFT JOIN mvp01_enrollments e ON e.student_id = s.id AND e.status = 'ATIVA'
       LEFT JOIN mvp01_class_memberships cm ON cm.enrollment_id = e.id AND cm.ended_at IS NULL
       LEFT JOIN mvp01_classes c ON c.id = cm.class_id
       WHERE s.school_id = ? AND s.id = ?`,
      [ctx.schoolId, ownId]
    );
    const grades = await mvp01All<any>(
      this.db,
      `SELECT id, subject, period_id, n1, n2, n3, recovery, entry_state, final_average
       FROM mvp01_grade_entries
       WHERE school_id = ? AND student_id = ? AND published = 1`,
      [ctx.schoolId, ownId]
    );
    const attendance = await mvp01All<any>(
      this.db,
      `SELECT ar.id, ar.status, sh.subject, sh.lesson_date
       FROM mvp01_attendance_records ar
       JOIN mvp01_attendance_sheets sh ON sh.id = ar.sheet_id
       WHERE ar.school_id = ? AND ar.student_id = ?
       ORDER BY sh.lesson_date DESC LIMIT 50`,
      [ctx.schoolId, ownId]
    );
    const tasks = student?.class_id
      ? await mvp01All<any>(
          this.db,
          `SELECT t.*, COALESCE(tc.completed, 0) as completed
           FROM mvp01_tasks t
           LEFT JOIN mvp01_task_completions tc ON tc.task_id = t.id AND tc.student_id = ?
           WHERE t.school_id = ? AND t.class_id = ?
           ORDER BY t.due_date ASC`,
          [ownId, ctx.schoolId, student.class_id]
        )
      : [];
    const masteryEstimates = await mvp01All<any>(
      this.db,
      `SELECT * FROM mvp01_mastery_estimates WHERE school_id = ? AND student_id = ?`,
      [ctx.schoolId, ownId]
    );

    return {
      portal,
      school,
      academicPeriods,
      student,
      grades,
      attendance,
      tasks,
      masteryEstimates,
    };
  }
}
