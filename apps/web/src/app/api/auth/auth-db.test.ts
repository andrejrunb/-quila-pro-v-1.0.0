import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { getWebDb, resetWebDbCacheForTests, seedAcademicFixtures } from '@aquila/db';
import { resetRateLimitBuckets } from '@/lib/rateLimit';
import { POST } from './route';

describe('database scrypt authentication in POST /api/auth', () => {
  beforeEach(async () => {
    process.env.AQUILA_AUTH_SECRET = 'test-auth-db-secret-key-min-32-bytes';
    process.env.AQUILA_WEB_DB_PATH = ':memory:';
    resetRateLimitBuckets();
    resetWebDbCacheForTests();
    const db = await getWebDb();
    await seedAcademicFixtures(db, {
      'prof.ricardo': 'Docente#Strong2026!',
      'pais.patricia': 'Familia#Strong2026!',
    });
  });

  afterEach(() => {
    resetWebDbCacheForTests();
  });

  it('authenticates seeded scrypt users, issues HTTP-only session with userId claims, and enforces portal match', async () => {
    const mismatchRes = await POST(
      new Request('http://localhost/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '203.0.113.60' },
        body: JSON.stringify({
          username: 'prof.ricardo',
          password: 'Docente#Strong2026!',
          portalId: 'pais',
        }),
      })
    );
    expect(mismatchRes.status).toBe(403);

    const teacherRes = await POST(
      new Request('http://localhost/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '203.0.113.61' },
        body: JSON.stringify({
          username: 'prof.ricardo',
          password: 'Docente#Strong2026!',
          portalId: 'professores',
        }),
      })
    );
    expect(teacherRes.status).toBe(200);
    const teacherJson = (await teacherRes.json()) as {
      success: boolean;
      redirect: string;
      user: { username: string; role: string; userId?: string; institutionId?: string };
    };
    expect(teacherJson.success).toBe(true);
    expect(teacherJson.redirect).toBe('/portal/professor');
    expect(teacherJson.user.userId).toBe('usr_teacher_01');
    expect(teacherJson.user.institutionId).toBe('inst_aquila_demo');
    expect(teacherRes.headers.get('set-cookie')).toContain('aquila_session=');

    const parentRes = await POST(
      new Request('http://localhost/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '203.0.113.62' },
        body: JSON.stringify({
          username: 'pais.patricia',
          password: 'Familia#Strong2026!',
        }),
      })
    );
    expect(parentRes.status).toBe(200);
    const parentJson = (await parentRes.json()) as {
      redirect: string;
      user: { role: string; linkedStudentIds?: string[] };
    };
    expect(parentJson.redirect).toBe('/portal/pais');
    expect(parentJson.user.role).toBe('parent');
    expect(parentJson.user.linkedStudentIds).toEqual(['std_001']);
  });
});
