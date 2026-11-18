import { expect, test, type Page } from '@playwright/test';
import { E2E_CREDENTIALS } from './e2eEnv';

async function loginToPortal(
  page: Page,
  portalCardRegex: RegExp,
  username: string,
  password: string,
  expectedPath: string
) {
  await page.goto('/login');
  await page.getByRole('button', { name: portalCardRegex }).click();
  await page.getByPlaceholder('Digite seu usuário...').fill(username);
  await page.getByPlaceholder('••••••••').fill(password);
  await page.getByRole('button', { name: /Entrar no Portal/i }).click();
  await expect(page).toHaveURL(new RegExp(`${expectedPath}$`));
}

test.describe('Site Institucional e Portais Online BFF (Professor, Pais, Aluno)', () => {
  test('fluxo completo E2E: site público -> contato -> professor -> pais -> aluno mobile', async ({
    page,
  }) => {
    const consoleErrors: string[] = [];
    const pageErrors: string[] = [];
    const server5xx: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    page.on('pageerror', (err) => {
      pageErrors.push(err.message);
    });
    page.on('response', (res) => {
      if (res.status() >= 500) {
        server5xx.push(`${res.status()} ${res.url()}`);
      }
    });

    // 1. Desktop 1280x800: Public site & contact lead persistence
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/');
    const homeText = await page.locator('body').innerText();
    expect(homeText).not.toMatch(/ICP-Brasil|RFID|Aurochs|Simular Liquidação/i);

    await page.goto('/precos');
    await expect(page.getByText('Sob Consulta').first()).toBeVisible();

    await page.goto('/contato');
    await page.locator('#contact-name').fill('Coord. Camila Ferreira');
    await page.locator('#contact-school').fill('Colégio Horizonte Sul');
    await page.locator('#contact-email').fill('camila@horizontesul.edu.br');
    await page.locator('#contact-message').fill('Piloto 20 salas com Crachá QR e Portal das Famílias.');
    await page.locator('input[name="lgpdConsent"]').check();

    const [contactRes] = await Promise.all([
      page.waitForResponse((res) => res.url().includes('/api/contact') && res.request().method() === 'POST'),
      page.getByRole('button', { name: /Agendar Minha Apresentação/i }).click(),
    ]);
    expect(contactRes.status()).toBe(200);
    await expect(page.getByRole('status')).toContainText('Protocolo:');

    // Unauthenticated access redirects to /login
    await page.goto('/portal/professor');
    await expect(page).toHaveURL(/\/login\?redirect=%2Fportal%2Fprofessor/);

    // 2. Teacher Portal (Professor)
    await loginToPortal(
      page,
      /Portal do Professor/i,
      E2E_CREDENTIALS.teacher.username,
      E2E_CREDENTIALS.teacher.password,
      '/portal/professor'
    );
    await expect(
      page.getByText(/Portal Docente • (Recebido pelo Servidor|Pendente na Escola|Aplicado na Escola)/)
    ).toBeVisible();

    const [attendanceRes] = await Promise.all([
      page.waitForResponse(
        (res) => res.url().includes('/api/portal/professor') && res.request().method() === 'POST'
      ),
      page.getByTestId('quick-confirm-attendance-btn').click(),
    ]);
    expect(attendanceRes.status()).toBe(200);
    await expect(page.getByRole('status').first()).toContainText('SHA-256');

    await page.getByRole('tab', { name: /Preview A4 em Tempo Real/i }).click();
    await expect(page.getByTestId('cne-hitl-review-queue')).toBeVisible();
    await Promise.all([
      page.waitForResponse(
        (res) => res.url().includes('/api/portal/professor') && res.request().method() === 'POST'
      ),
      page.getByTestId('cne-hitl-review-queue').getByRole('button', { name: /Revisar & Publicar Nota/i }).first().click(),
    ]);
    await expect(page.getByTestId('cne-hitl-review-queue')).toContainText('PUBLICADA (HITL OK)');

    await page.getByRole('tab', { name: /Diário de Classe Digital/i }).click();
    await Promise.all([
      page.waitForResponse(
        (res) => res.url().includes('/api/portal/professor') && res.request().method() === 'POST'
      ),
      page.getByRole('button', { name: /Registrar & Assinar Diário SHA-256/i }).click(),
    ]);
    await expect(page.getByText(/Assinado Digitalmente \(SHA-256 \/ LDB\)/i)).toBeVisible();

    await page.getByRole('button', { name: 'Sair da sessão' }).click();
    await expect(page).toHaveURL(/\/login$/);

    // 3. Parent Portal (Pais) + Cross-role guard
    await loginToPortal(
      page,
      /Portal de Pais/i,
      E2E_CREDENTIALS.parent.username,
      E2E_CREDENTIALS.parent.password,
      '/portal/pais'
    );
    await expect(
      page.getByText(/Portal das Famílias • (Recebido pelo Servidor|Pendente na Escola|Aplicado na Escola)/)
    ).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Lucas Andrade' })).toBeVisible();

    await page.getByRole('tab', { name: /Boletim & Rendimento/i }).click();
    await expect(page.getByText(/Parecer CNE\/CP nº 15\/2026/i)).toBeVisible();
    await expect(page.getByText('Física Aplicada').first()).toBeVisible();

    await page.getByRole('tab', { name: /Financeiro & PIX/i }).click();
    await page.getByRole('button', { name: /Gerar PIX QR Code/i }).click();
    await expect(page.getByText('Simular Liquidação Instantânea')).toHaveCount(0);
    await Promise.all([
      page.waitForResponse(
        (res) => res.url().includes('/api/portal/pais') && res.request().method() === 'POST'
      ),
      page.getByRole('button', { name: /Confirmar Pagamento PIX/i }).click(),
    ]);
    await expect(page.getByText('Pagamento Confirmado!')).toBeVisible();

    await Promise.all([
      page.waitForResponse(
        (res) => res.url().includes('/api/portal/pais') && res.request().method() === 'POST'
      ),
      page.getByTestId('lgpd-revoke-purge-btn').click(),
    ]);
    await expect(page.getByRole('status').first()).toContainText('Revogação Art. 16 registrada no servidor');

    // Cross-role guard: parent cannot enter /portal/professor
    await page.goto('/portal/professor');
    await expect(page).toHaveURL(/\/portal\/pais$/);

    await page.getByRole('button', { name: 'Sair da sessão' }).click();
    await expect(page).toHaveURL(/\/login$/);

    // 4. Student Portal (Aluno) on mobile viewport 390x844
    await page.setViewportSize({ width: 390, height: 844 });
    await loginToPortal(
      page,
      /Portal do Aluno/i,
      E2E_CREDENTIALS.student.username,
      E2E_CREDENTIALS.student.password,
      '/portal/aluno'
    );
    await expect(
      page.getByText(/Portal do Estudante • (Recebido pelo Servidor|Pendente na Escola|Aplicado na Escola)/)
    ).toBeVisible();

    const [kumonRes] = await Promise.all([
      page.waitForResponse(
        (res) => res.url().includes('/api/portal/aluno') && res.request().method() === 'POST'
      ),
      page.getByRole('button', { name: 'Registrar Sprint Kumon' }).click(),
    ]);
    expect(kumonRes.status()).toBe(200);

    await page.getByRole('tab', { name: /Tutor IA Áquila/i }).click();
    await page.getByPlaceholder(/Pergunte ao Tutor IA/i).fill('Explique Termodinâmica.');
    await Promise.all([
      page.waitForResponse(
        (res) => res.url().includes('/api/portal/aluno') && res.request().method() === 'POST'
      ),
      page.getByPlaceholder(/Pergunte ao Tutor IA/i).press('Enter'),
    ]);
    await expect(page.getByText(/Primeira Lei da Termodinâmica|ΔU/i).first()).toBeVisible();

    await page.getByRole('tab', { name: /Trilha BNCC & Mentores/i }).click();
    await expect(page.getByText('EM13CNT102')).toBeVisible();
    await expect(page.getByText('Nicolas Carnot')).toBeVisible();

    const hasHorizontalOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth + 2
    );
    expect(hasHorizontalOverflow).toBe(false);

    expect(consoleErrors).toEqual([]);
    expect(pageErrors).toEqual([]);
    expect(server5xx).toEqual([]);
  });
});
