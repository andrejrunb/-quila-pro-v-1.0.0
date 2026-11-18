import { and, eq, or } from 'drizzle-orm';
import {
  DEMO_INSTITUTION_ID,
  getWebDb,
  guardiansStudents,
  seedAcademicFixtures,
  students,
  users,
  verifyPasswordScrypt,
  type AquilaDatabase,
} from '@aquila/db';
import {
  recordAuditEvent,
  verifyActiveUserAndSession,
  type AuthUser,
} from '@aquila/api';
import { ROLE_DESTINATIONS } from './portalAccess';
import type { PortalRole, SessionPayload } from './session';

export interface AuthenticatedDbIdentity {
  userId: string;
  username: string;
  role: PortalRole;
  portal: string;
  institutionId: string;
  linkedStudentIds?: string[];
}

const DEMO_IDENTITY_BY_ROLE: Record<PortalRole, { userId: string; linkedStudentIds?: string[] }> = {
  admin: { userId: 'usr_admin_01' },
  coordinator: { userId: 'usr_coord_01' },
  teacher: { userId: 'usr_teacher_01' },
  parent: { userId: 'usr_parent_01', linkedStudentIds: ['std_001'] },
  student: { userId: 'usr_student_01', linkedStudentIds: ['std_001'] },
};

export function isDemoSeedAllowed(): boolean {
  return process.env.NODE_ENV !== 'production' || process.env.AQUILA_ENABLE_DEMO_SEED === 'true';
}

export async function getInitializedWebDb(): Promise<AquilaDatabase> {
  if (
    process.env.VITEST &&
    !process.env.VERCEL &&
    !process.env.VERCEL_ENV &&
    !process.env.AQUILA_WEB_DB_PATH &&
    !process.env.AQUILA_DATABASE_URL &&
    !process.env.TURSO_DATABASE_URL
  ) {
    process.env.AQUILA_WEB_DB_PATH = ':memory:';
  }
  const db = await getWebDb();
  if (isDemoSeedAllowed()) {
    await seedAcademicFixtures(db);
  }
  return db;
}

export async function resolveLinkedStudentsForUser(
  db: AquilaDatabase,
  userId: string,
  role: PortalRole
): Promise<string[]> {
  if (role === 'parent') {
    const guardianRows = await db
      .select({ studentId: guardiansStudents.studentId })
      .from(guardiansStudents)
      .where(
        and(
          eq(guardiansStudents.guardianUserId, userId),
          eq(guardiansStudents.status, 'active')
        )
      );
    const directRows = await db
      .select({ id: students.id })
      .from(students)
      .where(eq(students.parentUserId, userId));
    return Array.from(new Set([...guardianRows.map((r) => r.studentId), ...directRows.map((r) => r.id)]));
  }
  if (role === 'student') {
    const ownRows = await db
      .select({ id: students.id })
      .from(students)
      .where(eq(students.studentUserId, userId));
    return ownRows.map((r) => r.id);
  }
  return [];
}

export async function resolveEnvIdentityContext(
  username: string,
  role: PortalRole
): Promise<Omit<AuthenticatedDbIdentity, 'portal'>> {
  const demoFallback = DEMO_IDENTITY_BY_ROLE[role];
  try {
    const db = await getInitializedWebDb();
    const matched = await db
      .select()
      .from(users)
      .where(or(eq(users.username, username), eq(users.id, demoFallback.userId)))
      .limit(1);

    const row = matched[0];
    if (!row) {
      return {
        userId: demoFallback.userId,
        username,
        role,
        institutionId: DEMO_INSTITUTION_ID,
        linkedStudentIds: demoFallback.linkedStudentIds,
      };
    }

    const linkedStudentIds = await resolveLinkedStudentsForUser(db, row.id, role);
    return {
      userId: row.id,
      username,
      role,
      institutionId: row.institutionId,
      linkedStudentIds:
        linkedStudentIds.length > 0 ? linkedStudentIds : demoFallback.linkedStudentIds,
    };
  } catch {
    return {
      userId: demoFallback.userId,
      username,
      role,
      institutionId: DEMO_INSTITUTION_ID,
      linkedStudentIds: demoFallback.linkedStudentIds,
    };
  }
}

export async function authenticateDbUser(
  identifier: string,
  password: string
): Promise<AuthenticatedDbIdentity | null> {
  const db = await getInitializedWebDb();
  const rows = await db
    .select()
    .from(users)
    .where(or(eq(users.username, identifier), eq(users.email, identifier)))
    .limit(1);

  const user = rows[0];
  if (!user || !user.active) return null;
  if (!verifyPasswordScrypt(password, user.passwordHash)) return null;

  const linkedStudentIds = await resolveLinkedStudentsForUser(db, user.id, user.role);
  return {
    userId: user.id,
    username: user.username || user.email,
    role: user.role,
    portal: ROLE_DESTINATIONS[user.role],
    institutionId: user.institutionId,
    linkedStudentIds: linkedStudentIds.length > 0 ? linkedStudentIds : undefined,
  };
}

export async function tryRecordLoginAudit(input: {
  userId: string;
  username: string;
  role: PortalRole;
  portal: string;
  ipAddress?: string;
}): Promise<void> {
  try {
    const db = await getInitializedWebDb();
    await recordAuditEvent(db, {
      userId: input.userId,
      action: 'LOGIN_SUCCESS',
      entity: 'user_session',
      entityId: input.userId,
      details: { username: input.username, role: input.role, portal: input.portal },
      ipAddress: input.ipAddress,
    });
  } catch {
    // Audit logging must not block issuing an authenticated session if isolated test DB is absent
  }
}

export function sessionToAuthUser(session: SessionPayload): AuthUser {
  const demoFallback = DEMO_IDENTITY_BY_ROLE[session.role];
  return {
    id: session.userId ?? demoFallback.userId,
    username: session.username,
    role: session.role,
    institutionId: session.institutionId ?? DEMO_INSTITUTION_ID,
    linkedStudentIds: session.linkedStudentIds ?? demoFallback.linkedStudentIds,
    jti: session.jti,
    sessionIssuedAt: session.iat,
  };
}

export async function resolveLiveSessionUser(
  db: AquilaDatabase | null,
  session: SessionPayload
): Promise<AuthUser | null> {
  const authUser = sessionToAuthUser(session);
  if (!db) return authUser;
  try {
    await verifyActiveUserAndSession(db, authUser);
    return authUser;
  } catch {
    return null;
  }
}
