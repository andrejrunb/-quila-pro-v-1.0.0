import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { NextRequest } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { eq } from 'drizzle-orm';
import {
  auditLogs,
  classes,
  edgeSyncCommands,
  edgeSyncEvents,
  getWebDb,
  grades,
  guardiansStudents,
  institutions,
  resetWebDbCacheForTests,
  seedAcademicFixtures,
  students,
  users,
} from '@aquila/db';
import { appRouter } from '@aquila/api';
import { signSession } from '@/lib/session';
import { PortalSyncBanner } from '@/components/PortalSyncBanner';
import PortalPais from '@/app/portal/pais/page';
import { middleware } from '@/middleware';
import { GET as getSession } from '@/app/api/auth/session/route';
import { POST as postLogout } from '@/app/api/auth/logout/route';
import { GET as getParentPortal, POST as postParentPortal } from '@/app/api/portal/pais/route';

let mockSessionCookieValue: string | undefined;

vi.mock('next/headers', () => ({
  cookies: async () => ({
    get: (name: string) =>
      name === 'aquila_session' && mockSessionCookieValue
        ? { name, value: mockSessionCookieValue }
        : undefined,
  }),
}));

const TEST_AUTH_SECRET = 'test-auth-secret-phase2-slice1-min-32-chars!!';

describe('Fase 2 — Fatia 1 Gate: Responsável consulta notas publicadas com vínculo ativo', () => {
  beforeEach(async () => {
    process.env.AQUILA_WEB_DB_PATH = ':memory:';
    process.env.AQUILA_AUTH_SECRET = TEST_AUTH_SECRET;
    delete process.env.VERCEL;
    delete process.env.VERCEL_ENV;
    delete process.env.AQUILA_PORTALS_PUBLIC_ENABLED;
    mockSessionCookieValue = undefined;
    resetWebDbCacheForTests();
    const db = await getWebDb();
    await seedAcademicFixtures(db);
  });

  afterEach(() => {
    mockSessionCookieValue = undefined;
    delete process.env.VERCEL;
    delete process.env.VERCEL_ENV;
    delete process.env.AQUILA_PORTALS_PUBLIC_ENABLED;
    delete process.env.AQUILA_AUTH_SECRET;
    resetWebDbCacheForTests();
  });

  it('Critérios 1, 6 e 9: Responsável A consulta notas publicadas do estudante vinculado sem expor draft_ai nem campos proibidos', async () => {
    const db = await getWebDb();
    // Garante existência de uma nota em rascunho IA para std_001 que NÃO pode vazar ao portal
    await db.insert(grades).values({
      id: 'grd_draft_std001',
      studentId: 'std_001',
      classId: 'cls_2b',
      subject: 'Química Orgânica',
      evaluationType: 'prova',
      score: 4.5,
      maxScore: 10,
      period: '4bim',
      teacherId: 'usr_teacher_01',
      status: 'draft_ai',
      reviewedByTeacherId: null,
      createdAt: new Date(),
    });

    mockSessionCookieValue = await signSession({
      username: 'familia.andrade',
      role: 'parent',
      portal: '/portal/pais',
      userId: 'usr_parent_01',
      institutionId: 'inst_aquila_demo',
      linkedStudentIds: ['std_001'],
    });

    const res = await getParentPortal(new NextRequest('http://localhost/api/portal/pais'));
    expect(res.status).toBe(200);
    const json = await res.json();

    expect(json.activeStudent.id).toBe('std_001');
    expect(json.grades.length).toBeGreaterThanOrEqual(1);
    expect(json.grades.every((g: { status: string }) => g.status === 'published')).toBe(true);
    expect(json.grades.some((g: { subject: string }) => g.subject === 'Química Orgânica')).toBe(false);

    const serialized = JSON.stringify(json).toLowerCase();
    expect(serialized).not.toContain('faceencoding');
    expect(serialized).not.toContain('faceembeddinghash');
  });

  it('Critérios 2, 3 e 4: Bloqueia outro aluno da mesma escola, outra instituição e adulteração de studentId em URL ou corpo', async () => {
    const db = await getWebDb();
    const now = new Date();
    await db.insert(institutions).values({
      id: 'inst_outra_escola',
      name: 'Colégio Externo B',
      cnpj: '88.888.888/0001-88',
      city: 'Campinas',
      plan: 'pro',
      createdAt: now,
    });
    await db.insert(classes).values({
      id: 'cls_ext_1a',
      institutionId: 'inst_outra_escola',
      name: '1º Ano A',
      grade: 10,
      shift: 'morning',
      year: 2026,
      teacherId: null,
      roomId: 'SALA 01',
      maxStudents: 35,
    });
    await db.insert(students).values({
      id: 'std_other_inst',
      institutionId: 'inst_outra_escola',
      name: 'Aluno Externa B',
      registrationNumber: 'EXT-001',
      classId: 'cls_ext_1a',
      parentUserId: null,
      studentUserId: null,
      dateOfBirth: '2010-05-10',
      enrolledAt: now,
    });

    const caller = appRouter.createCaller({
      db,
      user: {
        id: 'usr_parent_01',
        username: 'familia.andrade',
        role: 'parent',
        institutionId: 'inst_aquila_demo',
        linkedStudentIds: ['std_001'],
      },
      ipAddress: '127.0.0.1',
    });

    // Critério 2: outro estudante da mesma escola (std_002)
    await expect(caller.parent.getWorkspace({ studentId: 'std_002' })).rejects.toMatchObject({
      code: 'FORBIDDEN',
    });

    // Critério 3: estudante de outra instituição
    await expect(caller.parent.getWorkspace({ studentId: 'std_other_inst' })).rejects.toMatchObject({
      code: 'FORBIDDEN',
    });

    // Critério 4: adulteração na URL e no corpo contra rota BFF real /api/portal/pais
    mockSessionCookieValue = await signSession({
      username: 'familia.andrade',
      role: 'parent',
      portal: '/portal/pais',
      userId: 'usr_parent_01',
      institutionId: 'inst_aquila_demo',
      linkedStudentIds: ['std_001'],
    });

    const urlTamperRes = await getParentPortal(
      new NextRequest('http://localhost/api/portal/pais?studentId=std_002')
    );
    expect([403, 404]).toContain(urlTamperRes.status);

    const bodyTamperRes = await postParentPortal(
      new NextRequest('http://localhost/api/portal/pais', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          action: 'setBiometricConsent',
          payload: { studentId: 'std_002', decision: 'revoke' },
        }),
      })
    );
    expect([403, 404]).toContain(bodyTamperRes.status);
  });

  it('Critério 5: Vínculo revogado no banco bloqueia acesso mesmo com claim linkedStudentIds[] antiga no JWT', async () => {
    const db = await getWebDb();
    await db
      .update(guardiansStudents)
      .set({ status: 'revoked', revokedAt: new Date() })
      .where(eq(guardiansStudents.guardianUserId, 'usr_parent_01'));
    await db.update(students).set({ parentUserId: null }).where(eq(students.id, 'std_001'));

    mockSessionCookieValue = await signSession({
      username: 'familia.andrade',
      role: 'parent',
      portal: '/portal/pais',
      userId: 'usr_parent_01',
      institutionId: 'inst_aquila_demo',
      linkedStudentIds: ['std_001'],
    });

    const caller = appRouter.createCaller({
      db,
      user: {
        id: 'usr_parent_01',
        username: 'familia.andrade',
        role: 'parent',
        institutionId: 'inst_aquila_demo',
        linkedStudentIds: ['std_001'],
      },
      ipAddress: '127.0.0.1',
    });

    await expect(caller.parent.getWorkspace({ studentId: 'std_001' })).rejects.toMatchObject({
      code: 'FORBIDDEN',
    });

    const httpRes = await getParentPortal(new NextRequest('http://localhost/api/portal/pais'));
    const data = await httpRes.json();
    expect(data.activeStudent).toBeNull();
    expect(data.grades).toEqual([]);
  });

  it('Critério 7: Sessão encerrada via /api/auth/logout ou usuário desativado não mantém acesso autorizado', async () => {
    mockSessionCookieValue = await signSession({
      username: 'familia.andrade',
      role: 'parent',
      portal: '/portal/pais',
      userId: 'usr_parent_01',
      institutionId: 'inst_aquila_demo',
      linkedStudentIds: ['std_001'],
    });

    const okBefore = await getSession();
    expect(okBefore.status).toBe(200);

    // Simula logout com replay posterior do mesmo token capturado anteriormente
    const logoutRes = await postLogout();
    expect(logoutRes.status).toBe(200);

    const blockedSession = await getSession();
    expect(blockedSession.status).toBe(401);

    const blockedPortal = await getParentPortal(new NextRequest('http://localhost/api/portal/pais'));
    expect(blockedPortal.status).toBe(401);

    // Nova sessão válida também é bloqueada se usuário for desativado no banco
    mockSessionCookieValue = await signSession({
      username: 'familia.andrade',
      role: 'parent',
      portal: '/portal/pais',
      userId: 'usr_parent_01',
      institutionId: 'inst_aquila_demo',
    });
    const db = await getWebDb();
    await db.update(users).set({ active: false }).where(eq(users.id, 'usr_parent_01'));

    const disabledSessionRes = await getSession();
    expect(disabledSessionRes.status).toBe(401);
    const disabledPortalRes = await getParentPortal(new NextRequest('http://localhost/api/portal/pais'));
    expect(disabledPortalRes.status).toBe(401);
  });

  it('Critério 8: Falha de sincronização ou comando pendente aparecem como desatualizado/pendente na UI, nunca sucesso', async () => {
    const db = await getWebDb();
    await db.insert(edgeSyncEvents).values({
      id: 'sync_fail_gate',
      eventId: 'evt_fail_gate',
      schoolCloudId: 'edge_1',
      institutionId: 'inst_aquila_demo',
      eventType: 'ATTENDANCE_QR',
      payloadJson: JSON.stringify({ blockedFields: ['faceEncoding'] }),
      status: 'rejected_lgpd',
      receivedAt: new Date(),
    });

    mockSessionCookieValue = await signSession({
      username: 'familia.andrade',
      role: 'parent',
      portal: '/portal/pais',
      userId: 'usr_parent_01',
      institutionId: 'inst_aquila_demo',
    });

    const staleRes = await getParentPortal(new NextRequest('http://localhost/api/portal/pais'));
    expect(staleRes.status).toBe(200);
    const staleJson = await staleRes.json();
    expect(staleJson.syncStatus.state).toBe('sync_stale');

    await db.delete(edgeSyncEvents).where(eq(edgeSyncEvents.id, 'sync_fail_gate'));
    await db.insert(edgeSyncCommands).values({
      id: 'ecmd_gate_pending',
      commandId: 'cmd_gate_pending',
      institutionId: 'inst_aquila_demo',
      schoolCloudId: 'edge_1',
      targetDomain: 'consent',
      action: 'BIOMETRIC_CONSENT_REVOKED',
      payloadJson: '{}',
      status: 'pending_at_edge',
      conflictPolicy: 'lgpd_revocation_priority',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const pendingRes = await getParentPortal(new NextRequest('http://localhost/api/portal/pais'));
    const pendingJson = await pendingRes.json();
    expect(pendingJson.syncStatus.state).toBe('pending_at_edge');

    const { rerender } = render(
      <PortalSyncBanner
        portalLabel="Portal das Famílias"
        loading={false}
        syncError={null}
        syncedFromDb={true}
        syncState={pendingJson.syncStatus.state}
        onRefresh={() => undefined}
        complianceNote="LGPD"
      />
    );
    expect(screen.getByText('Portal das Famílias • Pendente na Escola (Edge)')).toBeInTheDocument();
    expect(screen.queryByText(/BFF Sincronizado/i)).not.toBeInTheDocument();

    rerender(
      <PortalSyncBanner
        portalLabel="Portal das Famílias"
        loading={false}
        syncError={null}
        syncedFromDb={true}
        syncState={staleJson.syncStatus.state}
        onRefresh={() => undefined}
        complianceNote="LGPD"
      />
    );
    expect(
      screen.getByText('Portal das Famílias • Dado Desatualizado / Falha de Sincronização')
    ).toBeInTheDocument();
  });

  it('Gate de Persistência e Exposição Pública na Vercel: falha fechado para /tmp SQLite e bloqueia portais sem liberação explícita', async () => {
    process.env.VERCEL = '1';
    delete process.env.AQUILA_WEB_DB_PATH;
    delete process.env.AQUILA_DATABASE_URL;
    delete process.env.TURSO_DATABASE_URL;
    resetWebDbCacheForTests();

    await expect(getWebDb()).rejects.toThrow(/PERSISTENCE_NOT_CONFIGURED/);

    // Middleware e BFF mantêm bloqueio de exposição pública mesmo com cookie assinado
    process.env.AQUILA_WEB_DB_PATH = ':memory:';
    resetWebDbCacheForTests();
    const db = await getWebDb();
    await seedAcademicFixtures(db);

    mockSessionCookieValue = await signSession({
      username: 'familia.andrade',
      role: 'parent',
      portal: '/portal/pais',
      userId: 'usr_parent_01',
      institutionId: 'inst_aquila_demo',
    });

    const mwRes = await middleware(new NextRequest('https://aquila.vercel.app/portal/pais'));
    expect(mwRes.status).toBe(307);
    expect(mwRes.headers.get('location')).toContain('portals_blocked_pending_phase2');

    const directBffRes = await getParentPortal(new NextRequest('https://aquila.vercel.app/api/portal/pais'));
    expect(directBffRes.status).toBe(401);

    const logs = await db.select().from(auditLogs);
    expect(JSON.stringify(logs).toLowerCase()).not.toContain('faceencoding');
  });

  it('PortalPais UI: não exibe dados fictícios quando vínculo é revogado, nota está só em draft_ai ou query studentId retorna 403', async () => {
    const originalFetch = globalThis.fetch;
    try {
      // 1) Vínculo revogado (activeStudent === null)
      globalThis.fetch = vi.fn(async () =>
        new Response(
          JSON.stringify({
            guardianName: 'Sra. Patrícia Andrade',
            students: [],
            activeStudent: null,
            activeClass: null,
            attendanceTimeline: [],
            attendanceRate: 0,
            dinnerConversations: [],
            grades: [],
            invoices: [],
            occurrences: [],
            notifications: [],
            biometricConsent: { enabled: false, status: 'disabled', latestReceiptSha256: null },
            syncStatus: {
              state: 'received_by_server',
              pendingCommandCount: 0,
              lastSyncedAt: null,
              staleReason: null,
            },
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        )
      ) as typeof fetch;

      const { unmount } = render(<PortalPais />);
      await waitFor(() => {
        expect(screen.getByTestId('parent-no-active-student')).toBeInTheDocument();
      });
      expect(screen.queryByText('Lucas Andrade')).not.toBeInTheDocument();
      unmount();

      // 2) Vínculo ativo mas apenas draft_ai existente (BFF retorna grades: [])
      globalThis.fetch = vi.fn(async () =>
        new Response(
          JSON.stringify({
            guardianName: 'Sr. Roberto Lima',
            students: [
              { id: 'std_005', name: 'Matheus Lima', registrationNumber: '2026-0846', classId: 'cls_2b' },
            ],
            activeStudent: {
              id: 'std_005',
              name: 'Matheus Lima',
              registrationNumber: '2026-0846',
              classId: 'cls_2b',
            },
            activeClass: { id: 'cls_2b', name: '2º Ano B', roomId: 'SALA 08' },
            attendanceTimeline: [],
            attendanceRate: 100,
            dinnerConversations: [],
            grades: [],
            invoices: [],
            occurrences: [],
            notifications: [],
            biometricConsent: { enabled: false, status: 'disabled', latestReceiptSha256: null },
            syncStatus: {
              state: 'applied_by_edge',
              pendingCommandCount: 0,
              lastSyncedAt: '2026-11-11T10:00:00.000Z',
              staleReason: null,
            },
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        )
      ) as typeof fetch;

      const renderedEmpty = render(<PortalPais />);
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'Matheus Lima' })).toBeInTheDocument();
      });
      fireEvent.click(screen.getByRole('tab', { name: /Boletim & Rendimento/i }));
      expect(screen.getByTestId('empty-published-grades')).toBeInTheDocument();
      expect(screen.getByText('Média Geral: —')).toBeInTheDocument();
      expect(screen.queryByText('Redação ENEM')).not.toBeInTheDocument();
      renderedEmpty.unmount();

      // 3) Adulteração ?studentId=std_002 -> BFF retorna 403 FORBIDDEN
      window.history.replaceState(null, '', '/portal/pais?studentId=std_002');
      const fetchSpy = vi.fn(async () =>
        new Response(
          JSON.stringify({
            error: 'Acesso negado: o estudante informado não pertence ao vínculo ativo deste responsável.',
            code: 'FORBIDDEN',
          }),
          { status: 403, headers: { 'Content-Type': 'application/json' } }
        )
      );
      globalThis.fetch = fetchSpy as typeof fetch;

      render(<PortalPais />);
      await waitFor(() => {
        expect(screen.getByTestId('parent-access-blocked')).toBeInTheDocument();
      });
      expect(fetchSpy).toHaveBeenCalledWith('/api/portal/pais?studentId=std_002', { cache: 'no-store' });
      expect(screen.queryByText('Lucas Andrade')).not.toBeInTheDocument();
    } finally {
      window.history.replaceState(null, '', '/');
      globalThis.fetch = originalFetch;
    }
  });
});
