import { expect, test, type Page } from '@playwright/test';
import { E2E_CREDENTIALS, E2E_DB_PATH } from './e2eEnv';

interface SqliteStatement {
  run: (...params: unknown[]) => void;
}

interface SqliteDb {
  exec: (sql: string) => void;
  prepare: (sql: string) => SqliteStatement;
  close: () => void;
}

async function openE2eDb(): Promise<SqliteDb> {
  const sqliteBuiltin = 'node:sqlite';
  const { DatabaseSync } = (await import(sqliteBuiltin)) as {
    DatabaseSync: new (path: string) => SqliteDb;
  };
  const db = new DatabaseSync(E2E_DB_PATH);
  db.exec('PRAGMA busy_timeout = 3000;');
  return db;
}

async function browserFetch(
  page: Page,
  url: string,
  options?: { method?: string; body?: unknown }
): Promise<{ status: number; text: string }> {
  return page.evaluate(
    async ({ targetUrl, method, body }) => {
      const response = await fetch(targetUrl, {
        method: method ?? 'GET',
        headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
        body: body !== undefined ? JSON.stringify(body) : undefined,
      });
      return { status: response.status, text: await response.text() };
    },
    { targetUrl: url, method: options?.method, body: options?.body }
  );
}

async function loginAsParent(page: Page) {
  await page.goto('/login');
  await page.getByRole('button', { name: /Portal de Pais/i }).click();
  await page.getByPlaceholder('Digite seu usuário...').fill(E2E_CREDENTIALS.parent.username);
  await page.getByPlaceholder('••••••••').fill(E2E_CREDENTIALS.parent.password);
  await page.getByRole('button', { name: /Entrar no Portal/i }).click();
  await page.waitForURL('**/portal/pais');
}

test.describe('Fase 2 — Fatia 1: Consulta Autenticada de Notas Publicadas por Responsável (10 Critérios)', () => {
  test('Critérios 1–9: vínculo ativo, isolamento escolar/tenant, query tampering, revogação, draft_ai oculto, sync_stale/pending, LGPD payload e logout', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 860 });
    await loginAsParent(page);

    // Critério 1: Responsável A (pais.patricia) acessa apenas o estudante vinculado ativo (Lucas Andrade)
    await expect(page.getByRole('heading', { name: 'Lucas Andrade' })).toBeVisible();
    await expect(page.getByText('Sra. Patrícia Andrade')).toBeVisible();

    await page.getByRole('tab', { name: /Boletim & Rendimento/i }).click();
    const gradesPanel = page.getByTestId('parent-grades-panel');
    await expect(gradesPanel).toBeVisible();
    await expect(gradesPanel.getByText('Desempenho Pedagógico de Lucas Andrade')).toBeVisible();
    await expect(gradesPanel.getByText('Matemática Aplicada')).toBeVisible();
    await expect(gradesPanel.getByText('9.2', { exact: true }).first()).toBeVisible();
    await expect(gradesPanel.getByText('Física Aplicada')).toBeVisible();
    await expect(gradesPanel.getByText('8.9')).toBeVisible();

    // Critério 9: Payload da API não contém campos proibidos nem draft_ai
    const apiOkRes = await browserFetch(page, '/api/portal/pais');
    expect(apiOkRes.status).toBe(200);
    const apiOkLower = apiOkRes.text.toLowerCase();
    expect(apiOkLower).not.toContain('faceencoding');
    expect(apiOkLower).not.toContain('faceembeddinghash');
    expect(apiOkLower).not.toContain('passwordhash');
    expect(apiOkLower).not.toContain('draft_ai');

    // Critérios 2 e 4: Outro estudante da mesma escola (std_002 Sofia Costa) via URL ou API retorna 403 e UI bloqueia
    const sameSchoolApiRes = await browserFetch(page, '/api/portal/pais?studentId=std_002');
    expect(sameSchoolApiRes.status).toBe(403);

    const tamperBodyRes = await browserFetch(page, '/api/portal/pais', {
      method: 'POST',
      body: {
        action: 'setBiometricConsent',
        payload: { studentId: 'std_002', decision: 'revoke' },
      },
    });
    expect(tamperBodyRes.status).toBe(403);

    await page.goto('/portal/pais?studentId=std_002');
    await expect(page.getByTestId('parent-access-blocked')).toBeVisible();
    await expect(page.getByText('Sofia Costa')).toHaveCount(0);
    await expect(page.getByRole('heading', { name: 'Lucas Andrade' })).toHaveCount(0);

    // Volta para vínculo padrão
    await page.getByRole('button', { name: /Carregar Estudante Vinculado/i }).click();
    await expect(page.getByRole('heading', { name: 'Lucas Andrade' })).toBeVisible();

    const db = await openE2eDb();
    try {
      // Critério 3: Estudante de outra instituição permanece inacessível
      const nowSec = Math.floor(Date.now() / 1000);
      db.prepare(
        `INSERT OR IGNORE INTO institutions (id, name, cnpj, plan, created_at) VALUES (?, ?, ?, ?, ?)`
      ).run('inst_e2e_other', 'Escola Beta E2E', '99.888.777/0001-66', 'starter', nowSec);
      db.prepare(
        `INSERT OR IGNORE INTO classes (id, name, grade, shift, year, institution_id, max_students) VALUES (?, ?, ?, ?, ?, ?, ?)`
      ).run('cls_e2e_other', '1º Ano E2E', 10, 'morning', 2026, 'inst_e2e_other', 30);
      db.prepare(
        `INSERT OR IGNORE INTO students (id, name, registration_number, class_id, institution_id, date_of_birth, status, enrolled_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      ).run('std_e2e_other', 'Aluno Outra Escola', '2026-9991', 'cls_e2e_other', 'inst_e2e_other', '2011-02-02', 'active', nowSec);

      const crossInstRes = await browserFetch(page, '/api/portal/pais?studentId=std_e2e_other');
      expect(crossInstRes.status).toBe(403);

      // Critério 6: Nota em rascunho (draft_ai) para std_001 nunca aparece ao responsável
      db.prepare(
        `INSERT INTO grades (id, student_id, class_id, subject, evaluation_type, score, max_score, period, teacher_id, status, reviewed_by_teacher_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).run('grd_e2e_draft', 'std_001', 'cls_2b', 'Biologia Oculta Draft', 'prova', 3.5, 10, '4bim', 'usr_teacher_01', 'draft_ai', null, nowSec);

      await page.reload();
      await page.getByRole('tab', { name: /Boletim & Rendimento/i }).click();
      await expect(page.getByText('Biologia Oculta Draft')).toHaveCount(0);
      const draftCheckRes = await browserFetch(page, '/api/portal/pais');
      expect(draftCheckRes.text).not.toContain('Biologia Oculta Draft');

      // Critério 8: Falha de sincronização aparece como dado desatualizado / pendente, nunca como sucesso
      db.prepare(
        `INSERT INTO edge_sync_events (id, event_id, school_cloud_id, institution_id, event_type, payload_json, status, received_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      ).run('sync_e2e_stale', 'evt_e2e_stale', 'edge_e2e', 'inst_aquila_demo', 'ATTENDANCE_QR', '{}', 'rejected_lgpd', nowSec + 100);

      await page.reload();
      await expect(
        page.getByText('Portal das Famílias • Dado Desatualizado / Falha de Sincronização')
      ).toBeVisible();
      await expect(page.getByText(/BFF Sincronizado/i)).toHaveCount(0);

      db.prepare(`DELETE FROM edge_sync_events WHERE id = ?`).run('sync_e2e_stale');
      db.prepare(
        `INSERT INTO edge_sync_commands (id, command_id, institution_id, school_cloud_id, target_domain, action, payload_json, status, conflict_policy, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).run('ecmd_e2e_pending', 'cmd_e2e_pending', 'inst_aquila_demo', 'edge_e2e', 'consent', 'REVOCATION_PURGE', '{}', 'pending_at_edge', 'revocation_always_wins', nowSec, nowSec);

      await page.reload();
      await expect(page.getByText('Portal das Famílias • Pendente na Escola (Edge)')).toBeVisible();
      db.prepare(`DELETE FROM edge_sync_commands WHERE id = ?`).run('ecmd_e2e_pending');

      // Critério 5: Vínculo revogado deixa de permitir consulta imediatamente mesmo com JWT emitido antes
      db.prepare(`UPDATE guardians_students SET status = 'revoked', revoked_at = ? WHERE id = 'gs_001'`).run(nowSec);
      db.prepare(`UPDATE students SET parent_user_id = NULL WHERE id = 'std_001'`).run();

      const revokedStudentApi = await browserFetch(page, '/api/portal/pais?studentId=std_001');
      expect(revokedStudentApi.status).toBe(403);

      await page.reload();
      await expect(page.getByTestId('parent-no-active-student')).toBeVisible();
      await expect(page.getByRole('heading', { name: 'Lucas Andrade' })).toHaveCount(0);
    } finally {
      db.prepare(`UPDATE guardians_students SET status = 'active', revoked_at = NULL WHERE id = 'gs_001'`).run();
      db.prepare(`UPDATE students SET parent_user_id = 'usr_parent_01' WHERE id = 'std_001'`).run();
      db.prepare(`DELETE FROM edge_sync_events WHERE id = 'sync_e2e_stale'`).run();
      db.prepare(`DELETE FROM edge_sync_commands WHERE id = 'ecmd_e2e_pending'`).run();
      db.prepare(`DELETE FROM grades WHERE id = 'grd_e2e_draft'`).run();
      db.prepare(`DELETE FROM students WHERE id = 'std_e2e_other'`).run();
      db.prepare(`DELETE FROM classes WHERE id = 'cls_e2e_other'`).run();
      db.prepare(`DELETE FROM institutions WHERE id = 'inst_e2e_other'`).run();
      db.close();
    }

    // Critério 7: Sessão encerrada não mantém acesso autorizado (revoga jti no servidor)
    const logoutRes = await browserFetch(page, '/api/auth/logout', { method: 'POST' });
    expect(logoutRes.status).toBe(200);

    const afterLogoutApi = await browserFetch(page, '/api/portal/pais');
    expect(afterLogoutApi.status).toBe(401);

    const afterLogoutSession = await browserFetch(page, '/api/auth/session');
    expect(afterLogoutSession.status).toBe(401);

    await page.goto('/portal/pais');
    await page.waitForURL('**/login**');
  });
});
