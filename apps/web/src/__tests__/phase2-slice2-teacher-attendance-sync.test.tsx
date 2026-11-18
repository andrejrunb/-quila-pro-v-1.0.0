import { createHmac } from 'node:crypto';
import { render, screen, waitFor } from '@testing-library/react';
import { NextRequest } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { eq } from 'drizzle-orm';
import {
  attendance,
  edgeSyncCommands,
  getWebDb,
  resetWebDbCacheForTests,
  seedAcademicFixtures,
  students,
} from '@aquila/db';
import { signSession } from '@/lib/session';
import PortalProfessor from '@/app/portal/professor/page';
import { GET as getTeacherPortal, POST as postTeacherPortal } from '@/app/api/portal/professor/route';
import { GET as getEdgeSync, POST as postEdgeSync } from '@/app/api/sync/edge/route';

let mockSessionCookieValue: string | undefined;

vi.mock('next/headers', () => ({
  cookies: async () => ({
    get: (name: string) =>
      name === 'aquila_session' && mockSessionCookieValue
        ? { name, value: mockSessionCookieValue }
        : undefined,
  }),
}));

const EDGE_TEST_KEY_ID = 'edge_key_slice2';
const EDGE_TEST_SECRET = 'edge-slice2-hmac-secret-minimum-32-bytes';

function signEdgeMessage(message: string): string {
  return createHmac('sha256', EDGE_TEST_SECRET).update(message).digest('hex');
}

describe('Fase 2 — Fatia 2: Chamada Docente com Sincronização Edge e Reconciliação', () => {
  beforeEach(async () => {
    process.env.AQUILA_AUTH_SECRET = 'test-slice2-auth-secret-32-bytes-minimum';
    process.env.AQUILA_WEB_DB_PATH = ':memory:';
    process.env.AQUILA_EDGE_CREDENTIALS_JSON = JSON.stringify([
      {
        keyId: EDGE_TEST_KEY_ID,
        deviceId: 'edge-node-slice2',
        institutionId: 'inst_aquila_demo',
        schoolCloudId: 'edge_inst_aquila_demo',
        secret: EDGE_TEST_SECRET,
        status: 'active',
      },
    ]);
    mockSessionCookieValue = undefined;
    resetWebDbCacheForTests();
    const db = await getWebDb();
    await seedAcademicFixtures(db);
  });

  afterEach(() => {
    delete process.env.AQUILA_EDGE_CREDENTIALS_JSON;
  });

  it('bloqueia ?classId= de outro docente e estudante de outra turma em saveRosterAttendance', async () => {
    mockSessionCookieValue = await signSession({
      username: 'prof.ricardo',
      role: 'teacher',
      portal: '/portal/professor',
      userId: 'usr_teacher_01',
      institutionId: 'inst_aquila_demo',
    });

    // Turma cls_3a pertence a usr_teacher_02 (Profa. Ana Beatriz)
    const crossClassGet = await getTeacherPortal(
      new NextRequest('http://localhost/api/portal/professor?classId=cls_3a')
    );
    expect(crossClassGet.status).toBe(403);

    const db = await getWebDb();
    await db.insert(students).values({
      id: 'std_cls3a_test',
      name: 'Aluno Turma 3A',
      registrationNumber: '2026-3001',
      classId: 'cls_3a',
      institutionId: 'inst_aquila_demo',
      dateOfBirth: '2009-05-01',
      status: 'active',
      enrolledAt: new Date(),
    });

    // Tentar lançar aluno de cls_3a dentro da chamada de cls_2b deve ser rejeitado
    const mixedClassPost = await postTeacherPortal(
      new NextRequest('http://localhost/api/portal/professor', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          action: 'saveRosterAttendance',
          payload: {
            classId: 'cls_2b',
            date: '2026-11-12',
            entries: [{ studentId: 'std_cls3a_test', status: 'absent', detectedBy: 'manual' }],
          },
        }),
      })
    );
    expect(mixedClassPost.status).toBe(403);
  });

  it('fluxo completo: Portal -> BFF (pending_at_edge) -> Edge GET pull -> COMMAND_ACK (applied_by_edge / rejected_by_edge)', async () => {
    mockSessionCookieValue = await signSession({
      username: 'prof.ricardo',
      role: 'teacher',
      portal: '/portal/professor',
      userId: 'usr_teacher_01',
      institutionId: 'inst_aquila_demo',
    });

    const saveRes = await postTeacherPortal(
      new NextRequest('http://localhost/api/portal/professor', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          action: 'saveRosterAttendance',
          payload: {
            classId: 'cls_2b',
            date: '2026-11-12',
            entries: [
              { studentId: 'std_001', status: 'present', detectedBy: 'qr_badge' },
              { studentId: 'std_005', status: 'absent', detectedBy: 'manual' },
            ],
          },
        }),
      })
    );
    expect(saveRes.status).toBe(200);
    const saveJson = (await saveRes.json()) as {
      ok: boolean;
      commandId: string;
      syncStatus: string;
      syncHash: string;
    };
    expect(saveJson.ok).toBe(true);
    expect(saveJson.syncStatus).toBe('pending_at_edge');
    expect(saveJson.syncHash).toMatch(/^[a-f0-9]{64}$/);

    // Enquanto o Edge não confirmar, o BFF deve reportar pending_at_edge
    const pendingGet = await getTeacherPortal(
      new NextRequest('http://localhost/api/portal/professor?date=2026-11-12')
    );
    expect(pendingGet.status).toBe(200);
    const pendingData = (await pendingGet.json()) as {
      syncStatus: { state: string; pendingCommandCount: number };
      lastAttendanceSync: { commandId: string; status: string } | null;
      roster: Array<{ id: string; status: string; detectedBy: string }>;
    };
    expect(pendingData.syncStatus.state).toBe('pending_at_edge');
    expect(pendingData.lastAttendanceSync?.commandId).toBe(saveJson.commandId);
    expect(pendingData.lastAttendanceSync?.status).toBe('pending_at_edge');
    expect(pendingData.roster.find((r) => r.id === 'std_005')?.status).toBe('absent');

    // Edge consulta comandos pendentes via GET /api/sync/edge
    const ts = String(Date.now());
    const pullRes = await getEdgeSync(
      new NextRequest('http://localhost/api/sync/edge', {
        method: 'GET',
        headers: {
          'x-aquila-key-id': EDGE_TEST_KEY_ID,
          'x-aquila-timestamp': ts,
          'x-aquila-hmac-sha256': signEdgeMessage(`GET:/api/sync/edge:${ts}`),
        },
      })
    );
    expect(pullRes.status).toBe(200);
    const pullJson = (await pullRes.json()) as {
      commands: Array<{ commandId: string; targetDomain: string; action: string }>;
    };
    expect(
      pullJson.commands.some(
        (c) =>
          c.commandId === saveJson.commandId &&
          c.targetDomain === 'attendance' &&
          c.action === 'ROSTER_ATTENDANCE_SYNC'
      )
    ).toBe(true);

    // Edge confirma execução com COMMAND_ACK = applied_by_edge
    const ackBody = JSON.stringify({
      contractVersion: '2026-11-v1',
      eventId: 'evt_ack_att_slice2_ok',
      schoolCloudId: 'edge_inst_aquila_demo',
      eventType: 'COMMAND_ACK',
      data: {
        commandId: saveJson.commandId,
        outcome: 'applied_by_edge',
      },
    });
    const ackRes = await postEdgeSync(
      new NextRequest('http://localhost/api/sync/edge', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-aquila-key-id': EDGE_TEST_KEY_ID,
          'x-aquila-hmac-sha256': signEdgeMessage(ackBody),
        },
        body: ackBody,
      })
    );
    expect(ackRes.status).toBe(202);

    const appliedGet = await getTeacherPortal(
      new NextRequest('http://localhost/api/portal/professor?date=2026-11-12')
    );
    const appliedData = (await appliedGet.json()) as {
      syncStatus: { state: string };
      lastAttendanceSync: { status: string; edgeAckAt: string | null } | null;
    };
    expect(appliedData.syncStatus.state).toBe('applied_by_edge');
    expect(appliedData.lastAttendanceSync?.status).toBe('applied_by_edge');
    expect(appliedData.lastAttendanceSync?.edgeAckAt).toBeTruthy();

    // Se um comando subsequente for rejeitado no Edge, estado vira sync_stale
    const db = await getWebDb();
    await db
      .update(edgeSyncCommands)
      .set({ status: 'rejected_by_edge' })
      .where(eq(edgeSyncCommands.commandId, saveJson.commandId));

    const staleGet = await getTeacherPortal(
      new NextRequest('http://localhost/api/portal/professor?date=2026-11-12')
    );
    const staleData = (await staleGet.json()) as {
      syncStatus: { state: string };
      lastAttendanceSync: { status: string } | null;
    };
    expect(staleData.syncStatus.state).toBe('sync_stale');
    expect(staleData.lastAttendanceSync?.status).toBe('rejected_by_edge');
  });

  it('ATTENDANCE_QR do Edge reconcilia presença existente para a mesma data sem duplicar linha', async () => {
    const body = JSON.stringify({
      contractVersion: '2026-11-v1',
      eventId: 'evt_att_qr_upsert_01',
      schoolCloudId: 'edge_inst_aquila_demo',
      eventType: 'ATTENDANCE_QR',
      data: {
        studentId: 'std_001',
        classId: 'cls_2b',
        date: '2026-11-11',
        status: 'late',
        detectedBy: 'qr_badge',
      },
    });
    const res = await postEdgeSync(
      new NextRequest('http://localhost/api/sync/edge', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-aquila-key-id': EDGE_TEST_KEY_ID,
          'x-aquila-hmac-sha256': signEdgeMessage(body),
        },
        body,
      })
    );
    expect(res.status).toBe(202);

    const db = await getWebDb();
    const stdRows = await db.select().from(attendance).where(eq(attendance.studentId, 'std_001'));
    const nov11Rows = stdRows.filter((r) => r.date === '2026-11-11');
    expect(nov11Rows).toHaveLength(1);
    expect(nov11Rows[0].status).toBe('late');
  });

  it('PortalProfessor UI distingue pendente no Edge vs erro 403 em classId adulterado sem expor mock', async () => {
    const originalFetch = globalThis.fetch;
    try {
      globalThis.fetch = vi.fn(async () =>
        new Response(
          JSON.stringify({
            teacherName: 'Prof. Ricardo Silva',
            classes: [
              { id: 'cls_2b', name: '2º Ano B', grade: 11, shift: 'morning', year: 2026, roomId: 'SALA 08' },
            ],
            activeClass: { id: 'cls_2b', name: '2º Ano B', grade: 11, shift: 'morning', year: 2026, roomId: 'SALA 08' },
            roster: [
              {
                id: 'std_001',
                name: 'Lucas Andrade',
                registrationNumber: '2026-0842',
                seat: 'A1',
                status: 'present',
                detectedBy: 'qr_badge',
                confidence: 1.0,
                entryTime: '07:12',
              },
            ],
            diaries: [],
            assessments: [],
            pendingSubmissions: [],
            occurrences: [],
            grades: [],
            date: '2026-11-12',
            syncStatus: {
              state: 'pending_at_edge',
              pendingCommandCount: 1,
              lastSyncedAt: null,
              staleReason: null,
            },
            lastAttendanceSync: {
              commandId: 'cmd_slice2_pending',
              status: 'pending_at_edge',
              updatedAt: '2026-11-12T10:00:00.000Z',
              edgeAckAt: null,
            },
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        )
      ) as typeof fetch;

      const firstRender = render(<PortalProfessor />);
      await waitFor(() => {
        expect(screen.getByText('Portal Docente • Pendente na Escola (Edge)')).toBeInTheDocument();
      });
      expect(screen.getByTestId('teacher-sync-state-badge')).toHaveTextContent('PENDENTE NA ESCOLA (EDGE)');
      expect(screen.queryByText('SINCRONIZADO')).not.toBeInTheDocument();
      firstRender.unmount();

      window.history.replaceState(null, '', '/portal/professor?classId=cls_3a');
      const forbiddenFetch = vi.fn(async () =>
        new Response(
          JSON.stringify({ error: 'Acesso proibido a turma de outro docente.', code: 'FORBIDDEN' }),
          { status: 403, headers: { 'Content-Type': 'application/json' } }
        )
      );
      globalThis.fetch = forbiddenFetch as typeof fetch;

      render(<PortalProfessor />);
      await waitFor(() => {
        expect(screen.getByTestId('teacher-access-blocked')).toBeInTheDocument();
      });
      expect(forbiddenFetch).toHaveBeenCalledWith('/api/portal/professor?classId=cls_3a', {
        cache: 'no-store',
      });
      expect(screen.queryByText('Lucas Andrade')).not.toBeInTheDocument();
    } finally {
      window.history.replaceState(null, '', '/');
      globalThis.fetch = originalFetch;
    }
  });
});
