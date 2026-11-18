import { randomBytes, scryptSync } from 'node:crypto';
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

function hashScryptForE2e(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 64, {
    N: 16384,
    r: 8,
    p: 1,
    maxmem: 64 * 1024 * 1024,
  }).toString('hex');
  return `scrypt$16384$8$1$${salt}$${hash}`;
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

async function loginTo(
  page: Page,
  portalCard: RegExp,
  username: string,
  password: string,
  expectedUrl: string
) {
  await page.goto('/login');
  await page.getByRole('button', { name: portalCard }).click();
  await page.getByPlaceholder('Digite seu usuário...').fill(username);
  await page.getByPlaceholder('••••••••').fill(password);
  await page.getByRole('button', { name: /Entrar no Portal/i }).click();
  await expect(page).toHaveURL(new RegExp(`${expectedUrl}$`));
}

test.describe('Fase 2 — Fatia 3: Alinhamento E2E, CNE/CP nº 15/2026 & Contestações', () => {
  test('Aluno 2º EF bloqueia todas superfícies IA e usa focus_sprint_3min; Pais contesta ocorrência/nota e valida CPF LGPD; Professor lança notas com maxScore e rascunho diário', async ({
    page,
  }) => {
    const db = await openE2eDb();
    const sofiaPassword = 'E2E-Sofia-EF-Strong-2026!';
    const nowSec = Math.floor(Date.now() / 1000);
    const slice3GradeId = 'grd_slice3_sofia_01';
    const slice3OccId = 'occ_slice3_parent_01';

    try {
      // Provisiona credencial temporária para Sofia Martins (std_006 / cls_2ef — 2º ano EF)
      db.prepare(`UPDATE users SET password_hash = ? WHERE id = ?`).run(
        hashScryptForE2e(sofiaPassword),
        'usr_student_03'
      );

      // Nota publicada temporária para Sofia testar contestGrade
      db.prepare(
        `INSERT OR REPLACE INTO grades (id, student_id, class_id, subject, evaluation_type, score, max_score, period, teacher_id, status, reviewed_by_teacher_id, propagation_status, contestation_status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).run(
        slice3GradeId,
        'std_006',
        'cls_2ef',
        'Leitura & Letramento',
        'prova',
        8.0,
        10,
        '4bim',
        'usr_teacher_02',
        'published',
        'usr_teacher_02',
        'applied_by_edge',
        'none',
        nowSec
      );

      // Ocorrência temporária para teste de contestação + conflito 409 no Portal de Pais
      db.prepare(
        `INSERT OR REPLACE INTO occurrences (id, student_id, class_id, institution_id, created_by_user_id, category, severity, title, description, recommended_action, propagation_status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).run(
        slice3OccId,
        'std_001',
        'cls_2b',
        'inst_aquila_demo',
        'usr_teacher_01',
        'pedagogical',
        'low',
        'Ocorrência E2E Fatia 3',
        'Validação de contestação motivada pelos responsáveis.',
        'Acompanhar tarefa em sala.',
        'applied_by_edge',
        nowSec
      );

      // 1. Portal do Aluno (Sofia Martins — 2º Ano EF, bloqueada por CNE/CP nº 15/2026)
      await page.setViewportSize({ width: 1280, height: 860 });
      await loginTo(page, /Portal do Aluno/i, 'aluno.sofia.ef', sofiaPassword, '/portal/aluno');

      await expect(page.getByRole('heading', { name: 'Sofia Martins' })).toBeVisible();
      // Modo Kumon (não-IA) envia mode canônico focus_sprint_3min
      const [sprintReq, sprintRes] = await Promise.all([
        page.waitForRequest(
          (req) => req.url().includes('/api/portal/aluno') && req.method() === 'POST'
        ),
        page.waitForResponse(
          (res) => res.url().includes('/api/portal/aluno') && res.request().method() === 'POST'
        ),
        page.getByRole('button', { name: 'Registrar Sprint Kumon' }).click(),
      ]);
      expect(sprintRes.status()).toBe(200);
      expect(sprintReq.postData() || '').toContain('focus_sprint_3min');

      // Aba Tutor IA bloqueia chat + Redação IA + Flashcards SRS
      await page.getByRole('tab', { name: /Tutor IA Áquila/i }).click();
      await expect(page.getByTestId('tutor-cne-blocked-panel')).toBeVisible();
      await expect(page.getByTestId('ai-labs-cne-blocked-notice')).toBeVisible();
      const disabledAiBtns = page.getByRole('button', { name: /Bloqueado \(CNE\/CP nº 15\/2026\)/i });
      await expect(disabledAiBtns).toHaveCount(2);
      await expect(disabledAiBtns.nth(0)).toBeDisabled();
      await expect(disabledAiBtns.nth(1)).toBeDisabled();

      // Garantia server-side 403 em socratic_tutor e essay_lab
      const tutorApiRes = await browserFetch(page, '/api/portal/aluno', {
        method: 'POST',
        body: {
          action: 'logStudySession',
          payload: { mode: 'socratic_tutor', durationSeconds: 60, topic: 'Teste bypass' },
        },
      });
      expect(tutorApiRes.status).toBe(403);

      const essayApiRes = await browserFetch(page, '/api/portal/aluno', {
        method: 'POST',
        body: {
          action: 'logStudySession',
          payload: { mode: 'essay_lab', durationSeconds: 60, topic: 'Teste bypass' },
        },
      });
      expect(essayApiRes.status).toBe(403);

      // Aba Boletim -> contestGrade
      await page.getByRole('tab', { name: /Boletim & Desempenho/i }).click();
      await expect(page.getByText('Leitura & Letramento')).toBeVisible();
      await page.getByRole('button', { name: /Contestar Nota/i }).first().click();
      await page
        .getByPlaceholder(/Explique o motivo do pedido de revisão/i)
        .fill('Gostaria de revisar a pontuação do ditado.');
      const [contestRes] = await Promise.all([
        page.waitForResponse(
          (res) => res.url().includes('/api/portal/aluno') && res.request().method() === 'POST'
        ),
        page.getByRole('button', { name: /Enviar Contestação/i }).click(),
      ]);
      expect(contestRes.status()).toBe(200);
      await expect(page.getByText(/Contestação Enviada/i)).toBeVisible();

      await page.getByRole('button', { name: 'Sair da sessão' }).click();
      await expect(page).toHaveURL(/\/login$/);

      // 2. Portal das Famílias: ocorrência com DISAGREEMENT_CONTESTATION + 409 conflict + LGPD CPF validation
      await loginTo(
        page,
        /Portal de Pais/i,
        E2E_CREDENTIALS.parent.username,
        E2E_CREDENTIALS.parent.password,
        '/portal/pais'
      );

      // LGPD Modal valida CPF inválido sem fechar
      await page.getByTestId('lgpd-manage-consent-btn').click();
      await page.getByLabel(/Nome Completo do Responsável Legal/i).fill('Sra. Patrícia Andrade');
      await page.getByLabel(/CPF do Responsável/i).fill('111.111.111-11');
      await page.getByRole('button', { name: /Registrar Ciência e Consentimento/i }).click();
      await expect(page.getByRole('alert')).toContainText(/CPF inválido/i);

      await page.getByLabel(/CPF do Responsável/i).fill('123.456.789-01');
      const [grantRes] = await Promise.all([
        page.waitForResponse(
          (res) => res.url().includes('/api/portal/pais') && res.request().method() === 'POST'
        ),
        page.getByRole('button', { name: /Registrar Ciência e Consentimento/i }).click(),
      ]);
      expect(grantRes.status()).toBe(200);

      // Ocorrência -> contestação motivada
      await page.getByRole('tab', { name: /Ocorrências & Ciência/i }).click();
      await expect(page.getByText('Ocorrência E2E Fatia 3')).toBeVisible();
      const occCard = page.getByTestId(`occurrence-card-${slice3OccId}`);
      await occCard.getByRole('button', { name: /^Contestar$/i }).click();
      await occCard
        .getByPlaceholder(/Explique o ponto de discordância/i)
        .fill('O relatório experimental foi entregue antes do término do turno.');
      const [occContestRes] = await Promise.all([
        page.waitForResponse(
          (res) => res.url().includes('/api/portal/pais') && res.request().method() === 'POST'
        ),
        occCard.getByRole('button', { name: /Enviar Contestação/i }).click(),
      ]);
      expect(occContestRes.status()).toBe(200);
      await expect(page.getByText(/Contestação Registrada/i).first()).toBeVisible();

      // Sobrescrita conflitante via BFF retorna 409 CONFLICT
      const conflictRes = await browserFetch(page, '/api/portal/pais', {
        method: 'POST',
        body: {
          action: 'signOccurrence',
          payload: {
            occurrenceId: slice3OccId,
            manifestationType: 'SCIENCE_ACKNOWLEDGED',
          },
        },
      });
      expect(conflictRes.status).toBe(409);

      await page.getByRole('button', { name: 'Sair da sessão' }).click();
      await expect(page).toHaveURL(/\/login$/);

      // 3. Portal Docente: Notas Bimestrais com evaluationType & maxScore
      await loginTo(
        page,
        /Portal do Professor/i,
        E2E_CREDENTIALS.teacher.username,
        E2E_CREDENTIALS.teacher.password,
        '/portal/professor'
      );

      await page.getByRole('tab', { name: /Notas Bimestrais/i }).click();
      await page.getByLabel(/Tipo de avaliação/i).selectOption('trabalho');
      await page.getByLabel(/Nota máxima da avaliação/i).fill('20');
      await page.getByLabel(/Nota de Lucas Andrade/i).fill('17.5');

      const [gradesReq, gradesRes] = await Promise.all([
        page.waitForRequest(
          (req) => req.url().includes('/api/portal/professor') && req.method() === 'POST'
        ),
        page.waitForResponse(
          (res) => res.url().includes('/api/portal/professor') && res.request().method() === 'POST'
        ),
        page.getByRole('button', { name: /Salvar & Publicar Notas/i }).click(),
      ]);
      expect(gradesRes.status()).toBe(200);
      expect(gradesReq.postData() || '').toContain('"evaluationType":"trabalho"');
      expect(gradesReq.postData() || '').toContain('"maxScore":20');
      await expect(page.getByText(/Notas publicadas/i)).toBeVisible();
    } finally {
      // Restaura fixtures compartilhadas para specs subsequentes (portals-online.spec.ts)
      db.prepare(`DELETE FROM grades WHERE id = ? OR (evaluation_type = ? AND subject = ?)`).run(
        slice3GradeId,
        'trabalho',
        'Física Aplicada'
      );
      db.prepare(`DELETE FROM occurrences WHERE id = ?`).run(slice3OccId);
      db.prepare(`DELETE FROM study_sessions WHERE student_id = ?`).run('std_006');
      db.prepare(`DELETE FROM biometric_consent_logs WHERE student_id = ?`).run('std_001');
      db.prepare(`DELETE FROM sync_commands WHERE entity_id IN (?, ?, ?)`).run(
        slice3GradeId,
        slice3OccId,
        'std_001'
      );
      db.prepare(`UPDATE users SET password_hash = ? WHERE id = ?`).run(
        '!unprovisioned-account!',
        'usr_student_03'
      );
      db.close();
    }
  });
});
