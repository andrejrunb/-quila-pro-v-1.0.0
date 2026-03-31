import { defineConfig } from '@playwright/test';

/**
 * Step 103 — Playwright E2E Configuration
 * Testa o app web do Áquila Pro no Electron/browser.
 * Executa com: npx playwright test
 */
export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  retries: 1,
  reporter: [['html', { open: 'never' }], ['list']],
  use: {
    baseURL: 'http://localhost:5173', // Vite dev server
    headless: true,
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
