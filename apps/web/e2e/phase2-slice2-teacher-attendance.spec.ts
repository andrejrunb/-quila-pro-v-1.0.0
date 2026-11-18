import { createHash } from 'node:crypto';
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

async function loginAsTeacher(page: Page) {
  await page.goto('/login');
  await page.getByRole('button', { name: /Portal do Professor/i }).click();
  await page.getByPlaceholder('Digite seu usuário...').fill(E2E_CREDENTIALS.teacher.username);
  await page.getByPlaceholder('••••••••').fill(E2E_CREDENTIALS.teacher.password);
  await page.getByRole('button', { name: /Entrar no Portal/i }).click();
  await page.waitForURL('**/portal/professor');
}

test.describe('Fase 2 — Fatia 2: Chamada Docente com Sincronização Edge e Reconciliação', () => {
  test('chamada docente grava pending_at_edge, Edge faz pull + COMMAND_ACK -> applied_by_edge, e bloqueia turma de outro docente', async ({
    page,
    request,
  }) => {
    await page.setViewportSize({ width: 1280, height: 860 });
    await loginAsTeacher(page);

    await expect(page.getByRole('heading', { name: 'Prof. Ricardo Silva' })).toBeVisible();
    await expect(page.getByText('Lucas Andrade')).toBeVisible();

    // Confirma chamada e verifica que UI exibe Pendente na Escola (Edge), nunca "SINCRONIZADO"
    const [saveRes] = await Promise.all([
      page.waitForResponse(
        (res) => res.url().includes('/api/portal/professor') && res.request().method() === 'POST'
      ),
      page.getByTestId('quick-confirm-attendance-btn').click(),
    ]);
    expect(saveRes.status()).toBe(200);
    const saveJson = (await saveRes.json()) as { commandId: string; syncStatus: string };
    expect(saveJson.syncStatus).toBe('pending_at_edge');

    await expect(page.getByTestId('teacher-sync-state-badge')).toHaveText('PENDENTE NA ESCOLA (EDGE)');
    await expect(page.getByText('Portal Docente • Pendente na Escola (Edge)')).toBeVisible();

    // Recarrega e confirma persistência do estado pendente
    await page.reload();
    await expect(page.getByTestId('teacher-sync-state-badge')).toHaveText('PENDENTE NA ESCOLA (EDGE)');

    // Credencial Edge em banco consulta GET /api/sync/edge e envia COMMAND_ACK = applied_by_edge
    const db = await openE2eDb();
    const edgeKeyId = 'edge_e2e_key_slice2';
    const edgeSecret = 'e2e-slice2-edge-api-secret-32-chars-minimum';
    const secretHash = createHash('sha256').update(JSON.stringify(edgeSecret)).digest('hex');
    const nowSec = Math.floor(Date.now() / 1000);

    try {
      db.prepare(
        `INSERT OR REPLACE INTO edge_credentials (id, key_id, device_id, institution_id, school_cloud_id, secret_hash_sha256, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      ).run(
        'ec_e2e_slice2',
        edgeKeyId,
        'edge_device_e2e',
        'inst_aquila_demo',
        'edge_inst_aquila_demo',
        secretHash,
        'active',
        nowSec
      );

      const pullRes = await request.get('/api/sync/edge', {
        headers: {
          'x-aquila-key-id': edgeKeyId,
          'x-aquila-api-key': edgeSecret,
          'x-aquila-timestamp': String(Date.now()),
        },
      });
      expect(pullRes.status()).toBe(200);
      const pullJson = (await pullRes.json()) as {
        commands: Array<{ commandId: string; targetDomain: string }>;
      };
      expect(pullJson.commands.some((c) => c.commandId === saveJson.commandId)).toBe(true);

      const ackRes = await request.post('/api/sync/edge', {
        headers: {
          'x-aquila-key-id': edgeKeyId,
          'x-aquila-api-key': edgeSecret,
        },
        data: {
          contractVersion: '2026-11-v1',
          eventId: `evt_e2e_ack_${Date.now()}`,
          schoolCloudId: 'edge_inst_aquila_demo',
          eventType: 'COMMAND_ACK',
          data: {
            commandId: saveJson.commandId,
            outcome: 'applied_by_edge',
          },
        },
      });
      expect(ackRes.status()).toBe(202);

      await page.reload();
      await expect(page.getByTestId('teacher-sync-state-badge')).toHaveText('APLICADO NA ESCOLA (EDGE)');
      await expect(page.getByText('Portal Docente • Aplicado na Escola (Edge)')).toBeVisible();

      // Bloqueia ?classId=cls_3a (turma de outra docente) via UI e API
      const forbiddenApi = await browserFetch(page, '/api/portal/professor?classId=cls_3a');
      expect(forbiddenApi.status).toBe(403);

      await page.goto('/portal/professor?classId=cls_3a');
      await expect(page.getByTestId('teacher-access-blocked')).toBeVisible();
      await expect(page.getByText('Lucas Andrade')).toHaveCount(0);
    } finally {
      db.prepare(`DELETE FROM edge_credentials WHERE id = 'ec_e2e_slice2'`).run();
      db.prepare(`DELETE FROM edge_sync_commands WHERE command_id = ?`).run(saveJson.commandId);
      db.close();
    }

    const logoutRes = await browserFetch(page, '/api/auth/logout', { method: 'POST' });
    expect(logoutRes.status).toBe(200);

    const afterLogout = await browserFetch(page, '/api/portal/professor');
    expect(afterLogout.status).toBe(401);

    await page.goto('/portal/professor');
    await page.waitForURL('**/login**');
  });
});
