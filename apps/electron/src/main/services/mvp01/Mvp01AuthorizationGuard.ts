import { randomUUID } from 'crypto';
import {
  MVP01_DEMO_SCHOOL_ID,
  Mvp01DbLike,
  ensureMvp01Schema,
  mvp01All,
  mvp01Get,
  mvp01Run,
} from './Mvp01Schema';

export type Mvp01Permission =
  | 'portal.overview.read'
  | 'school.read'
  | 'school.update'
  | 'academic_year.read'
  | 'academic_year.update'
  | 'academic_period.close'
  | 'academic_period.reopen'
  | 'enrollment.read'
  | 'enrollment.create'
  | 'enrollment.update'
  | 'enrollment.confirm'
  | 'enrollment.transfer'
  | 'class.read'
  | 'class.create'
  | 'class.update'
  | 'teaching_assignment.create'
  | 'teaching_assignment.update'
  | 'coordination_assignment.update'
  | 'guardian.read'
  | 'guardian.create'
  | 'guardian.update'
  | 'guardian.revoke'
  | 'consistency.read'
  | 'attendance.read'
  | 'attendance.record'
  | 'attendance.correct'
  | 'lesson.read'
  | 'lesson.record'
  | 'absence_justification.read'
  | 'absence_justification.submit'
  | 'absence_justification.review'
  | 'grading_policy.read'
  | 'grading_policy.create'
  | 'grading_policy.update'
  | 'grade.read'
  | 'grade.record'
  | 'grade.publish'
  | 'incident.read'
  | 'incident.internal.read'
  | 'incident.create'
  | 'incident.publish'
  | 'incident.resolve'
  | 'incident.ack'
  | 'student_health.read'
  | 'communication.read'
  | 'communication.publish'
  | 'communication.ack'
  | 'communication.decide'
  | 'document.read'
  | 'document.issue'
  | 'document.revoke'
  | 'document.verify.read'
  | 'task.read'
  | 'task.create'
  | 'task.update'
  | 'task.submit'
  | 'practice.read'
  | 'practice.submit'
  | 'calendar.read'
  | 'calendar.update'
  | 'timetable.read'
  | 'timetable.update'
  | 'timetable.publish'
  | 'audit.read'
  | 'membership.read'
  | 'membership.create'
  | 'membership.update'
  | 'invitation.read'
  | 'invitation.create'
  | 'invitation.revoke';

export type CanonicalMvp01Role =
  | 'admin'
  | 'director'
  | 'secretary'
  | 'coordinator'
  | 'teacher'
  | 'parent'
  | 'student';

export interface Mvp01MembershipSummary {
  membershipId: string;
  userId: string;
  personName: string | null;
  email: string | null;
  schoolId: string;
  role: string;
  status: 'ACTIVE' | 'INACTIVE';
  validUntil: string | null;
}

export interface Mvp01AssignedClass {
  classId: string;
  subject: string;
}

export interface Mvp01Context {
  userId: string;
  schoolId: string;
  membershipId: string;
  activeRole: string;
  availableMemberships: Mvp01MembershipSummary[];
  assignedClasses: Mvp01AssignedClass[];
  authorizedStudentIds: string[];
  coordinationClassIds: string[];
  ownStudentId?: string | null;
}

export interface Mvp01ResourceScope {
  schoolId?: string;
  classId?: string;
  subject?: string;
  studentId?: string;
  enrollmentId?: string;
  resourceType?: string;
  resourceId?: string;
}

export interface Mvp01SessionUser {
  id?: string;
  userId?: string;
  username?: string;
  name?: string;
  email?: string;
  role?: string;
  status?: string;
  isActive?: boolean | number;
}

export class Mvp01Error extends Error {
  public readonly status: number;
  public readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = 'Mvp01Error';
    this.status = status;
    this.code = code;
    Object.setPrototypeOf(this, Mvp01Error.prototype);
  }
}

const ROLE_ALIASES: Record<string, CanonicalMvp01Role> = {
  admin: 'admin',
  director: 'director',
  diretoria: 'director',
  secretary: 'secretary',
  secretaria: 'secretary',
  coordinator: 'coordinator',
  coordenacao: 'coordinator',
  teacher: 'teacher',
  docente: 'teacher',
  professor: 'teacher',
  parent: 'parent',
  pais: 'parent',
  responsavel: 'parent',
  student: 'student',
  aluno: 'student',
};

const ROLE_PERMISSIONS: Record<CanonicalMvp01Role, ReadonlySet<Mvp01Permission>> = {
  director: new Set<Mvp01Permission>([
    'portal.overview.read',
    'school.read',
    'academic_year.read',
    'enrollment.read',
    'class.read',
    'guardian.read',
    'consistency.read',
    'attendance.read',
    'lesson.read',
    'absence_justification.read',
    'grading_policy.read',
    'grade.read',
    'incident.read',
    'communication.read',
    'document.read',
    'document.verify.read',
    'task.read',
    'practice.read',
    'calendar.read',
    'timetable.read',
    'audit.read',
    'membership.read',
    'invitation.read',
  ]),
  admin: new Set<Mvp01Permission>([
    'portal.overview.read',
    'school.read',
    'school.update',
    'academic_year.read',
    'academic_year.update',
    'academic_period.close',
    'academic_period.reopen',
    'enrollment.read',
    'enrollment.create',
    'enrollment.update',
    'enrollment.confirm',
    'enrollment.transfer',
    'class.read',
    'class.create',
    'class.update',
    'teaching_assignment.create',
    'teaching_assignment.update',
    'coordination_assignment.update',
    'guardian.read',
    'guardian.create',
    'guardian.update',
    'guardian.revoke',
    'consistency.read',
    'attendance.read',
    'attendance.record',
    'attendance.correct',
    'lesson.read',
    'lesson.record',
    'absence_justification.read',
    'absence_justification.submit',
    'absence_justification.review',
    'grading_policy.read',
    'grading_policy.create',
    'grading_policy.update',
    'grade.read',
    'grade.record',
    'grade.publish',
    'incident.read',
    'incident.internal.read',
    'incident.create',
    'incident.publish',
    'incident.resolve',
    'incident.ack',
    'student_health.read',
    'communication.read',
    'communication.publish',
    'communication.ack',
    'communication.decide',
    'document.read',
    'document.issue',
    'document.revoke',
    'document.verify.read',
    'task.read',
    'task.create',
    'task.update',
    'task.submit',
    'practice.read',
    'practice.submit',
    'calendar.read',
    'calendar.update',
    'timetable.read',
    'timetable.update',
    'timetable.publish',
    'audit.read',
    'membership.read',
    'membership.create',
    'membership.update',
    'invitation.read',
    'invitation.create',
    'invitation.revoke',
  ]),
  secretary: new Set<Mvp01Permission>([
    'portal.overview.read',
    'school.read',
    'school.update',
    'academic_year.read',
    'academic_year.update',
    'academic_period.close',
    'academic_period.reopen',
    'enrollment.read',
    'enrollment.create',
    'enrollment.update',
    'enrollment.confirm',
    'enrollment.transfer',
    'class.read',
    'class.create',
    'class.update',
    'teaching_assignment.create',
    'teaching_assignment.update',
    'coordination_assignment.update',
    'guardian.read',
    'guardian.create',
    'guardian.update',
    'guardian.revoke',
    'consistency.read',
    'attendance.read',
    'absence_justification.read',
    'absence_justification.review',
    'grading_policy.read',
    'grading_policy.create',
    'grading_policy.update',
    'grade.read',
    'grade.publish',
    'incident.read',
    'student_health.read',
    'communication.read',
    'communication.publish',
    'document.read',
    'document.issue',
    'document.revoke',
    'document.verify.read',
    'calendar.read',
    'calendar.update',
    'timetable.read',
    'timetable.update',
    'timetable.publish',
    'audit.read',
    'membership.read',
    'membership.create',
    'membership.update',
    'invitation.read',
    'invitation.create',
    'invitation.revoke',
  ]),
  coordinator: new Set<Mvp01Permission>([
    'portal.overview.read',
    'school.read',
    'academic_year.read',
    'academic_year.update',
    'academic_period.close',
    'academic_period.reopen',
    'enrollment.read',
    'class.read',
    'class.update',
    'teaching_assignment.create',
    'teaching_assignment.update',
    'guardian.read',
    'consistency.read',
    'attendance.read',
    'lesson.read',
    'absence_justification.read',
    'absence_justification.review',
    'grading_policy.read',
    'grading_policy.create',
    'grading_policy.update',
    'grade.read',
    'grade.publish',
    'incident.read',
    'incident.internal.read',
    'incident.create',
    'incident.publish',
    'incident.resolve',
    'student_health.read',
    'communication.read',
    'communication.publish',
    'document.read',
    'document.verify.read',
    'task.read',
    'practice.read',
    'calendar.read',
    'calendar.update',
    'timetable.read',
    'timetable.update',
    'timetable.publish',
    'audit.read',
    'membership.read',
    'invitation.read',
  ]),
  teacher: new Set<Mvp01Permission>([
    'portal.overview.read',
    'school.read',
    'academic_year.read',
    'enrollment.read',
    'class.read',
    'attendance.read',
    'attendance.record',
    'attendance.correct',
    'lesson.read',
    'lesson.record',
    'absence_justification.read',
    'grading_policy.read',
    'grading_policy.create',
    'grading_policy.update',
    'grade.read',
    'grade.record',
    'grade.publish',
    'incident.read',
    'incident.internal.read',
    'incident.create',
    'incident.resolve',
    'communication.read',
    'communication.publish',
    'document.verify.read',
    'task.read',
    'task.create',
    'task.update',
    'practice.read',
    'calendar.read',
    'timetable.read',
  ]),
  parent: new Set<Mvp01Permission>([
    'portal.overview.read',
    'academic_year.read',
    'guardian.read',
    'attendance.read',
    'absence_justification.read',
    'absence_justification.submit',
    'grade.read',
    'incident.read',
    'incident.ack',
    'student_health.read',
    'communication.read',
    'communication.ack',
    'communication.decide',
    'document.read',
    'document.verify.read',
    'task.read',
    'practice.read',
    'calendar.read',
    'timetable.read',
  ]),
  student: new Set<Mvp01Permission>([
    'portal.overview.read',
    'academic_year.read',
    'attendance.read',
    'grade.read',
    'incident.read',
    'communication.read',
    'communication.ack',
    'document.verify.read',
    'task.read',
    'task.submit',
    'practice.read',
    'practice.submit',
    'calendar.read',
    'timetable.read',
  ]),
};

const TEACHER_CLASS_SCOPED_WRITES = new Set<Mvp01Permission>([
  'attendance.record',
  'attendance.correct',
  'grade.record',
  'lesson.record',
  'grade.publish',
  'task.create',
  'task.update',
  'grading_policy.create',
  'grading_policy.update',
  'communication.publish',
]);

const TEACHER_CLASS_SCOPED_READS = new Set<Mvp01Permission>([
  'attendance.read',
  'grade.read',
  'lesson.read',
  'task.read',
  'practice.read',
  'incident.read',
  'incident.internal.read',
  'absence_justification.read',
]);

const PARENT_STUDENT_SCOPED_PERMS = new Set<Mvp01Permission>([
  'attendance.read',
  'absence_justification.read',
  'absence_justification.submit',
  'grade.read',
  'incident.read',
  'incident.ack',
  'student_health.read',
  'communication.ack',
  'communication.decide',
  'document.read',
  'task.read',
  'practice.read',
]);

const STUDENT_OWN_SCOPED_PERMS = new Set<Mvp01Permission>([
  'portal.overview.read',
  'attendance.read',
  'grade.read',
  'incident.read',
  'task.read',
  'task.submit',
  'practice.read',
  'practice.submit',
  'communication.ack',
]);

export function canonicalizeMvp01Role(role?: string | null): CanonicalMvp01Role | null {
  if (!role || typeof role !== 'string') return null;
  return ROLE_ALIASES[role.trim().toLowerCase()] ?? null;
}

export function isDirectorReadOnlyRole(role?: string | null): boolean {
  const normalized = (role || '').trim().toLowerCase();
  return normalized === 'director' || normalized === 'diretoria';
}

function isMembershipCurrentlyValid(row: { status: string; valid_until: string | null }): boolean {
  if (row.status !== 'ACTIVE') return false;
  if (!row.valid_until) return true;
  const parsed = Date.parse(row.valid_until);
  if (Number.isNaN(parsed)) return false;
  return parsed > Date.now();
}

function mapMembershipRow(row: any): Mvp01MembershipSummary {
  return {
    membershipId: String(row.id),
    userId: String(row.user_id),
    personName: row.person_name ?? null,
    email: row.email ?? null,
    schoolId: String(row.school_id),
    role: String(row.role),
    status: row.status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE',
    validUntil: row.valid_until ?? null,
  };
}

function extractUserId(sessionUser: Mvp01SessionUser | null | undefined): string | null {
  const raw = sessionUser?.id || sessionUser?.userId;
  return typeof raw === 'string' && raw.trim().length > 0 ? raw.trim() : null;
}

function assertUserActive(sessionUser: Mvp01SessionUser): void {
  if (
    sessionUser.isActive === 0 ||
    sessionUser.isActive === false ||
    (typeof sessionUser.status === 'string' && sessionUser.status.toUpperCase() === 'INACTIVE')
  ) {
    throw new Mvp01Error(403, 'FORBIDDEN_INACTIVE_USER', 'Usuário inativo no sistema.');
  }
}

async function buildRoleScopedContext(
  db: Mvp01DbLike,
  selected: Mvp01MembershipSummary,
  availableMemberships: Mvp01MembershipSummary[]
): Promise<Mvp01Context> {
  const canonical = canonicalizeMvp01Role(selected.role);
  if (!canonical) {
    throw new Mvp01Error(403, 'FORBIDDEN_ROLE_PERMISSION', `Papel institucional inválido: '${selected.role}'.`);
  }

  let assignedClasses: Mvp01AssignedClass[] = [];
  let authorizedStudentIds: string[] = [];
  let coordinationClassIds: string[] = [];
  let ownStudentId: string | null = null;

  if (canonical === 'teacher') {
    const today = new Date().toISOString().slice(0, 10);
    const rows = await mvp01All<{ class_id: string; subject: string }>(
      db,
      `SELECT class_id, subject
       FROM mvp01_teaching_assignments
       WHERE school_id = ?
         AND teacher_user_id = ?
         AND COALESCE(active, 1) = 1
         AND (valid_from IS NULL OR TRIM(valid_from) = '' OR valid_from <= ?)
         AND (valid_until IS NULL OR TRIM(valid_until) = '' OR valid_until >= ?)`,
      [selected.schoolId, selected.userId, today, today]
    );
    assignedClasses = rows.map((r) => ({
      classId: String(r.class_id),
      subject: String(r.subject),
    }));
  } else if (canonical === 'parent') {
    const rows = await mvp01All<{ student_id: string }>(
      db,
      `SELECT DISTINCT student_id
       FROM mvp01_guardian_student_links
       WHERE school_id = ?
         AND guardian_user_id = ?
         AND can_view_portal = 1
         AND (revoked_at IS NULL OR TRIM(revoked_at) = '')
         AND COALESCE(has_judicial_restriction, 0) = 0`,
      [selected.schoolId, selected.userId]
    );
    authorizedStudentIds = rows.map((r) => String(r.student_id));
  } else if (canonical === 'coordinator') {
    const rows = await mvp01All<{ class_id: string | null; stage: string | null }>(
      db,
      `SELECT class_id, stage
       FROM mvp01_coordination_assignments
       WHERE school_id = ?
         AND coordinator_user_id = ?
         AND COALESCE(active, 1) = 1`,
      [selected.schoolId, selected.userId]
    );
    const classSet = new Set<string>();
    for (const row of rows) {
      if (row.class_id) {
        classSet.add(String(row.class_id));
      } else if (row.stage) {
        const stageClasses = await mvp01All<{ id: string }>(
          db,
          `SELECT id FROM mvp01_classes WHERE school_id = ? AND stage = ? AND status != 'CLOSED'`,
          [selected.schoolId, row.stage]
        );
        for (const cls of stageClasses) {
          classSet.add(String(cls.id));
        }
      }
    }
    coordinationClassIds = Array.from(classSet);
  } else if (canonical === 'student') {
    const studentRow = await mvp01Get<{ id: string }>(
      db,
      `SELECT id FROM mvp01_students
       WHERE school_id = ? AND (user_id = ? OR id = ?)
       LIMIT 1`,
      [selected.schoolId, selected.userId, selected.userId]
    );
    ownStudentId = studentRow?.id ? String(studentRow.id) : null;
    authorizedStudentIds = ownStudentId ? [ownStudentId] : [];
  }

  return {
    userId: selected.userId,
    schoolId: selected.schoolId,
    membershipId: selected.membershipId,
    activeRole: selected.role,
    availableMemberships,
    assignedClasses,
    authorizedStudentIds,
    coordinationClassIds,
    ownStudentId,
  };
}

/**
 * Resolve o contexto autoritativo MVP 0.1 a partir do usuário autenticado e seus vínculos no SQLite.
 * Nunca confia em role ou school_id arbitrário vindo sem vínculo ativo.
 */
export async function resolveMvp01Context(
  db: Mvp01DbLike,
  sessionUser: Mvp01SessionUser | null | undefined,
  requestedMembershipId?: string
): Promise<Mvp01Context> {
  const userId = extractUserId(sessionUser);
  if (!sessionUser || !userId) {
    throw new Mvp01Error(401, 'UNAUTHENTICATED', 'Sessão não autenticada.');
  }
  assertUserActive(sessionUser);

  await ensureMvp01Schema(db);

  let rawMemberships = await mvp01All<any>(
    db,
    `SELECT id, user_id, person_name, email, school_id, role, status, valid_until
     FROM mvp01_memberships
     WHERE user_id = ?
     ORDER BY rowid ASC`,
    [userId]
  );

  // Modo desktop piloto local: provisiona vínculo padrão para usuário legado que ainda não tem mvp01_memberships
  if (rawMemberships.length === 0) {
    if (requestedMembershipId) {
      throw new Mvp01Error(
        403,
        'FORBIDDEN_MEMBERSHIP',
        'Vínculo institucional solicitado não pertence ao usuário autenticado.'
      );
    }

    let dbUser: any = null;
    try {
      dbUser = await mvp01Get<any>(
        db,
        'SELECT id, username, name, email, role FROM users WHERE id = ?',
        [userId]
      );
    } catch {
      dbUser = null;
    }

    const candidateRole = (dbUser?.role || sessionUser.role || '').trim().toLowerCase();
    const canonicalPilotRole = canonicalizeMvp01Role(candidateRole);
    if (!canonicalPilotRole) {
      throw new Mvp01Error(
        403,
        'FORBIDDEN_NO_MEMBERSHIP',
        'Usuário sem vínculo institucional válido para o MVP 0.1.'
      );
    }

    const provisionedId = `mem-auto-${randomUUID()}`;
    const personName = dbUser?.name || sessionUser.name || sessionUser.username || userId;
    const email = dbUser?.email || sessionUser.email || null;

    await mvp01Run(
      db,
      `INSERT INTO mvp01_memberships
       (id, user_id, person_name, email, school_id, role, status, valid_until)
       VALUES (?, ?, ?, ?, ?, ?, 'ACTIVE', NULL)`,
      [provisionedId, userId, personName, email, MVP01_DEMO_SCHOOL_ID, candidateRole]
    );

    rawMemberships = await mvp01All<any>(
      db,
      `SELECT id, user_id, person_name, email, school_id, role, status, valid_until
       FROM mvp01_memberships
       WHERE user_id = ?
       ORDER BY rowid ASC`,
      [userId]
    );
  }

  const allSummaries = rawMemberships.map(mapMembershipRow);
  const activeSummaries = allSummaries.filter((m) =>
    isMembershipCurrentlyValid({ status: m.status, valid_until: m.validUntil })
  );

  let selected: Mvp01MembershipSummary | undefined;
  if (requestedMembershipId) {
    const matched = allSummaries.find((m) => m.membershipId === requestedMembershipId);
    if (!matched) {
      throw new Mvp01Error(
        403,
        'FORBIDDEN_MEMBERSHIP',
        'Vínculo institucional não pertence ao usuário autenticado.'
      );
    }
    if (!isMembershipCurrentlyValid({ status: matched.status, valid_until: matched.validUntil })) {
      throw new Mvp01Error(
        403,
        'FORBIDDEN_INACTIVE_MEMBERSHIP',
        'Vínculo institucional inativo ou expirado.'
      );
    }
    selected = matched;
  } else {
    selected = activeSummaries[0];
    if (!selected) {
      throw new Mvp01Error(
        403,
        'FORBIDDEN_INACTIVE_MEMBERSHIP',
        'Nenhum vínculo institucional ativo encontrado para este usuário.'
      );
    }
  }

  return await buildRoleScopedContext(db, selected, activeSummaries);
}

/**
 * Realiza troca explícita de contexto multi-papel validando titularidade e status ACTIVE,
 * recalculando estritamente as permissões do vínculo escolhido sem herança de outro papel.
 */
export async function switchContext(
  db: Mvp01DbLike,
  sessionUser: Mvp01SessionUser | null | undefined,
  membershipId: string
): Promise<Mvp01Context> {
  const userId = extractUserId(sessionUser);
  if (!sessionUser || !userId) {
    throw new Mvp01Error(401, 'UNAUTHENTICATED', 'Sessão não autenticada.');
  }
  if (!membershipId || typeof membershipId !== 'string' || membershipId.trim().length === 0) {
    throw new Mvp01Error(400, 'INVALID_MEMBERSHIP_ID', 'Identificador de vínculo inválido.');
  }

  await ensureMvp01Schema(db);

  const target = await mvp01Get<any>(
    db,
    `SELECT id, user_id, status, valid_until FROM mvp01_memberships WHERE id = ?`,
    [membershipId.trim()]
  );
  if (!target || String(target.user_id) !== userId) {
    throw new Mvp01Error(
      403,
      'FORBIDDEN_MEMBERSHIP',
      'Vínculo não encontrado ou não pertence ao usuário autenticado.'
    );
  }
  if (!isMembershipCurrentlyValid({ status: target.status, valid_until: target.valid_until })) {
    throw new Mvp01Error(
      403,
      'FORBIDDEN_INACTIVE_MEMBERSHIP',
      'Não é possível alternar para um vínculo inativo ou expirado.'
    );
  }

  return await resolveMvp01Context(db, sessionUser, membershipId.trim());
}

/**
 * Avalia autorização RBAC + escopo multi-escola/turma/família/estudante (negar por padrão).
 */
export function authorize(
  ctx: Mvp01Context,
  permission: Mvp01Permission,
  resource?: Mvp01ResourceScope
): void {
  if (!ctx || !ctx.userId || !ctx.schoolId || !ctx.activeRole) {
    throw new Mvp01Error(401, 'UNAUTHENTICATED', 'Contexto de autenticação ausente.');
  }

  if (resource?.schoolId && resource.schoolId !== ctx.schoolId) {
    throw new Mvp01Error(403, 'FORBIDDEN_CROSS_SCHOOL', 'Acesso negado a registros de outra escola.');
  }

  if (isDirectorReadOnlyRole(ctx.activeRole) && !permission.endsWith('.read')) {
    throw new Mvp01Error(
      403,
      'FORBIDDEN_READ_ONLY_ROLE',
      'Portal da Direção é estritamente somente leitura na versão MVP 0.1.'
    );
  }

  const canonical = canonicalizeMvp01Role(ctx.activeRole);
  if (!canonical) {
    throw new Mvp01Error(403, 'FORBIDDEN_ROLE_PERMISSION', `Papel desconhecido: '${ctx.activeRole}'.`);
  }

  const allowedSet = ROLE_PERMISSIONS[canonical];
  if (!allowedSet.has(permission)) {
    throw new Mvp01Error(
      403,
      'FORBIDDEN_ROLE_PERMISSION',
      `Papel '${ctx.activeRole}' não possui permissão para '${permission}'.`
    );
  }

  if (canonical === 'teacher') {
    const matchesAssignment = (classId?: string, subject?: string) =>
      !!classId &&
      ctx.assignedClasses.some(
        (a) =>
          a.classId === classId &&
          (!subject || a.subject.trim().toLowerCase() === subject.trim().toLowerCase())
      );

    if (TEACHER_CLASS_SCOPED_WRITES.has(permission)) {
      const requiresSubject = permission !== 'communication.publish' || resource?.subject !== undefined;
      const hasValidSubject =
        typeof resource?.subject === 'string' && resource.subject.trim().length > 0;
      if (
        !resource?.classId ||
        (requiresSubject && !hasValidSubject) ||
        !matchesAssignment(resource.classId, resource.subject)
      ) {
        throw new Mvp01Error(
          403,
          'FORBIDDEN_TEACHING_SCOPE',
          'Docente não possui vínculo ativo para esta turma ou disciplina.'
        );
      }
    } else if (
      permission === 'incident.create' ||
      permission === 'incident.resolve' ||
      permission === 'incident.publish'
    ) {
      if (!matchesAssignment(resource?.classId)) {
        throw new Mvp01Error(
          403,
          'FORBIDDEN_TEACHING_SCOPE',
          'Docente só pode registrar ou atualizar ocorrências em turmas com vínculo ativo.'
        );
      }
    } else if (TEACHER_CLASS_SCOPED_READS.has(permission) && resource?.classId) {
      if (!matchesAssignment(resource.classId, resource.subject)) {
        throw new Mvp01Error(
          403,
          'FORBIDDEN_TEACHING_SCOPE',
          'Docente não possui vínculo ativo nesta turma.'
        );
      }
    }
  }

  if (canonical === 'coordinator') {
    if (
      ctx.coordinationClassIds.length > 0 &&
      resource?.classId &&
      !ctx.coordinationClassIds.includes(resource.classId)
    ) {
      throw new Mvp01Error(
        403,
        'FORBIDDEN_COORDINATION_SCOPE',
        'Coordenação não possui atribuição ativa para esta turma.'
      );
    }
  }

  if (canonical === 'parent') {
    if (ctx.authorizedStudentIds.length === 0) {
      throw new Mvp01Error(
        403,
        'FORBIDDEN_GUARDIAN_SCOPE',
        'Vínculo familiar inativo, sem acesso ao portal ou com restrição judicial.'
      );
    }
    if (resource?.studentId && !ctx.authorizedStudentIds.includes(resource.studentId)) {
      throw new Mvp01Error(
        403,
        'FORBIDDEN_GUARDIAN_SCOPE',
        'Acesso negado: responsável sem autorização de portal para este estudante.'
      );
    }
    if (PARENT_STUDENT_SCOPED_PERMS.has(permission) && resource && 'studentId' in resource && !resource.studentId) {
      throw new Mvp01Error(
        403,
        'FORBIDDEN_GUARDIAN_SCOPE',
        'Identificador do estudante é obrigatório para acesso familiar.'
      );
    }
  }

  if (canonical === 'student') {
    if (!ctx.ownStudentId) {
      throw new Mvp01Error(
        403,
        'FORBIDDEN_STUDENT_SCOPE',
        'Perfil estudantil não vinculado a esta escola.'
      );
    }
    if (
      (STUDENT_OWN_SCOPED_PERMS.has(permission) || resource?.studentId !== undefined) &&
      resource?.studentId &&
      resource.studentId !== ctx.ownStudentId
    ) {
      throw new Mvp01Error(
        403,
        'FORBIDDEN_STUDENT_SCOPE',
        'Estudante só pode acessar e registrar dados do próprio perfil.'
      );
    }
  }
}
