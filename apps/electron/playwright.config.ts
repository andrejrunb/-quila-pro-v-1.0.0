import { defineConfig, devices } from '@playwright/test';

/**
 * Step 103 — Playwright E2E Configuration (Electron v28)
 * Testa o app Áquila Pro rodando no Electron.
 */
export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: 1, // Electron tests MUST be sequential
  reporter: [['html', { open: 'never' }], ['list'], ['json', { outputFile: 'e2e/results.json' }]],
  use: {
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'on-first-retry',
  },
  snapshotDir: './e2e/snapshots',
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

