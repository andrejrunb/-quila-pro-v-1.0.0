import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getWebDb, resetWebDbCacheForTests, seedAcademicFixtures } from '@aquila/db';
import { signSession } from '@/lib/session';
import { resetRateLimitBuckets } from '@/lib/rateLimit';

let currentCookieToken: string | undefined;

vi.mock('next/headers', () => ({
  cookies: async () => ({
    get: (name: string) => (name === 'aquila_session' && currentCookieToken ? { value: currentCookieToken } : undefined),
  }),
}));

describe('portal BFF routes RBAC and persistence', () => {
  beforeEach(async () => {
    resetRateLimitBuckets();
    process.env.AQUILA_AUTH_SECRET = 'test-portal-bff-auth-secret-32-bytes';
    process.env.AQUILA_WEB_DB_PATH = ':memory:';
    currentCookieToken = undefined;
    resetWebDbCacheForTests();
    const db = await getWebDb();
    await seedAcademicFixtures(db);
  });

  it('rejects unauthenticated access with 401 and cross-role access with 403', async () => {
    const profRoute = await import('./professor/route');
    const resUnauth = await profRoute.GET(new NextRequest('http://localhost/api/portal/professor'));
    expect(resUnauth.status).toBe(401);

    currentCookieToken = await signSession({
      username: 'aluno.lucas',
      portal: '/portal/aluno',
      role: 'student',
      userId: 'usr_student_01',
      institutionId: 'inst_aquila_demo',
      linkedStudentIds: ['std_001'],
    });
    const resForbidden = await profRoute.GET(new NextRequest('http://localhost/api/portal/professor'));
    expect(resForbidden.status).toBe(403);
  }, 15000);

  it('persists teacher diary + CNE grade approval and immediately reflects on parent portal', async () => {
    const profRoute = await import('./professor/route');
    const paisRoute = await import('./pais/route');

    currentCookieToken = await signSession({
      username: 'prof.ricardo',
      portal: '/portal/professor',
      role: 'teacher',
      userId: 'usr_teacher_01',
      institutionId: 'inst_aquila_demo',
    });

    const diaryRes = await profRoute.POST(
      new NextRequest('http://localhost/api/portal/professor', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          action: 'saveLessonDiary',
          payload: {
            classId: 'cls_2b',
            date: '2026-11-12',
            subject: 'Física Aplicada',
            topic: 'Termodinâmica — Máquinas Térmicas',
            content: 'Rendimento de Carnot e conservação de energia.',
            bnccCodes: ['EM13CNT102'],
            dinnerPrompt: 'Pergunte sobre como geladeiras trocam calor com o ambiente.',
            sign: true,
          },
        }),
      })
    );
    expect(diaryRes.status).toBe(200);
    const diaryJson = (await diaryRes.json()) as { signatureHashSha256: string };
    expect(diaryJson.signatureHashSha256).toMatch(/^[a-f0-9]{64}$/);

    // Teacher saves published grades for Lucas directly in boletim
    const batchRes = await profRoute.POST(
      new NextRequest('http://localhost/api/portal/professor', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          action: 'saveGradesBatch',
          payload: {
            classId: 'cls_2b',
            subject: 'Química Orgânica',
            period: '4bim',
            entries: [{ studentId: 'std_001', score: 9.7 }],
          },
        }),
      })
    );
    expect(batchRes.status).toBe(200);

    currentCookieToken = await signSession({
      username: 'pais.patricia',
      portal: '/portal/pais',
      role: 'parent',
      userId: 'usr_parent_01',
      institutionId: 'inst_aquila_demo',
      linkedStudentIds: ['std_001'],
    });

    const parentGet = await paisRoute.GET(new NextRequest('http://localhost/api/portal/pais'));
    expect(parentGet.status).toBe(200);
    const parentData = (await parentGet.json()) as {
      grades: Array<{ subject: string; score: number; status: string }>;
      dinnerConversations: Array<{ subject: string; prompt: string }>;
    };
    expect(parentData.grades.some((g) => g.subject === 'Química Orgânica' && g.score === 9.7)).toBe(true);
    expect(parentData.grades.every((g) => g.status === 'published')).toBe(true);
    expect(parentData.dinnerConversations.some((d) => d.subject === 'Física Aplicada')).toBe(true);
  });

  it('persists student mission progression and study sessions via /api/portal/aluno', async () => {
    const alunoRoute = await import('./aluno/route');
    currentCookieToken = await signSession({
      username: 'aluno.lucas',
      portal: '/portal/aluno',
      role: 'student',
      userId: 'usr_student_01',
      institutionId: 'inst_aquila_demo',
      linkedStudentIds: ['std_001'],
    });

    const logRes = await alunoRoute.POST(
      new NextRequest('http://localhost/api/portal/aluno', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          action: 'logStudySession',
          payload: { mode: 'kumon_3min', durationSeconds: 180, topic: 'Revisão diária concluída' },
        }),
      })
    );
    expect(logRes.status).toBe(200);
    const logJson = (await logRes.json()) as { earnedXp: number; mode: string };
    expect(logJson.earnedXp).toBeGreaterThan(0);
    expect(logJson.mode).toBe('focus_sprint_3min');

    const contestStudentRes = await alunoRoute.POST(
      new NextRequest('http://localhost/api/portal/aluno', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          action: 'CONTEST_GRADE',
          payload: {
            gradeId: 'grd_001',
            reason: 'Solicito revisão do critério de pontuação da segunda etapa da prova.',
          },
        }),
      })
    );
    expect(contestStudentRes.status).toBe(200);
    const contestStudentJson = (await contestStudentRes.json()) as { contestationStatus: string };
    expect(contestStudentJson.contestationStatus).toBe('contested');
  });

  it('aplica bloqueio etário CNE 15/2026 via /api/portal/aluno, suporta CONTEST_GRADE em /api/portal/pais e retorna 429 ao exceder rate limit', async () => {
    const alunoRoute = await import('./aluno/route');
    const paisRoute = await import('./pais/route');

    currentCookieToken = await signSession({
      username: 'aluno.sofia',
      portal: '/portal/aluno',
      role: 'student',
      userId: 'usr_student_03',
      institutionId: 'inst_aquila_demo',
      linkedStudentIds: ['std_006'],
    });

    const getEarly = await alunoRoute.GET(new NextRequest('http://localhost/api/portal/aluno?studentId=std_006'));
    expect(getEarly.status).toBe(200);
    const earlyData = (await getEarly.json()) as { aiPolicy: { blocked: boolean } };
    expect(earlyData.aiPolicy.blocked).toBe(true);

    const blockedTutor = await alunoRoute.POST(
      new NextRequest('http://localhost/api/portal/aluno', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          action: 'LOG_STUDY_SESSION',
          payload: { mode: 'socratic_tutor', durationSeconds: 60, topic: 'Tabuada' },
        }),
      })
    );
    expect(blockedTutor.status).toBe(403);

    currentCookieToken = await signSession({
      username: 'pais.patricia',
      portal: '/portal/pais',
      role: 'parent',
      userId: 'usr_parent_01',
      institutionId: 'inst_aquila_demo',
      linkedStudentIds: ['std_001'],
    });

    const parentContest = await paisRoute.POST(
      new NextRequest('http://localhost/api/portal/pais', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          action: 'CONTEST_GRADE',
          payload: {
            gradeId: 'grd_002',
            reason: 'Pedimos reavaliação da rubrica da redação argumentativa do 4º bimestre.',
          },
        }),
      })
    );
    expect(parentContest.status).toBe(200);

    // Trigger sliding-window rate limit (60 req/60s) on /api/portal/pais
    let hit429: Response | null = null;
    for (let i = 0; i < 65; i += 1) {
      const res = await paisRoute.POST(
        new NextRequest('http://localhost/api/portal/pais', {
          method: 'POST',
          headers: { 'content-type': 'application/json', 'x-forwarded-for': '203.0.113.77' },
          body: JSON.stringify({ action: 'INVALID_PROBE', payload: {} }),
        })
      );
      if (res.status === 429) {
        hit429 = res;
        break;
      }
    }
    expect(hit429?.status).toBe(429);
    expect(hit429?.headers.get('Retry-After')).toBeTruthy();
  });
});
