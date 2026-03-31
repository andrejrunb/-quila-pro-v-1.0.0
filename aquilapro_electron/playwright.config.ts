import { defineConfig } from '@playwright/test';

/**
 * Step 103 — Playwright E2E Configuration
 * Testa o app web do Áquila Pro no Electron/browser.
 * Executa com: npx playwright test
 */
import { defineConfig, devices } from '@playwright/test';

/**
 * Step 103 — Playwright E2E Configuration (Electron v28)
 * Testa o app Áquila Pro rodando no Electron.
 */
export default defineConfig({
  testDir: './e2e',
  timeout: 45_000,
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 1,
  workers: 1, // Electron tests usually require sequential execution
  reporter: [['html', { open: 'never' }], ['list']],
  use: {
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'electron',
      use: { 
        ...devices['Desktop Chrome'],
      },
    },
  ],
});

