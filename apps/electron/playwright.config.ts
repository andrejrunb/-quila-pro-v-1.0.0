import { defineConfig } from '@playwright/test';

/**
 * Playwright E2E Configuration — Áquila Pro (Electron v28)
 * Testa o app rodando no Electron nativo.
 * workers: 1 — testes Electron DEVEM ser sequenciais.
 * globalSetup: cria usuário playwright_admin antes dos testes.
 */
export default defineConfig({
  testDir: './e2e',
  timeout: 120_000,
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: 1,
  reporter: [
    ['html', { open: 'never' }],
    ['list'],
    ['json', { outputFile: 'e2e/results.json' }],
  ],
  use: {
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'on-first-retry',
    storageState: 'e2e/.auth/user.json',
  },
  snapshotDir: './e2e/snapshots',
  globalSetup: './e2e/global-setup.ts',
  projects: [
    {
      name: 'electron-v28-production',
      use: {
        viewport: { width: 1920, height: 1080 },
        ignoreHTTPSErrors: true,
      },
    },
  ],
});
