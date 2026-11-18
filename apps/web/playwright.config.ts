import fs from 'fs';
import { defineConfig } from '@playwright/test';
import { E2E_BASE_URL, E2E_CREDENTIALS, E2E_DB_PATH, E2E_PORT } from './e2e/e2eEnv';

if (!process.env.TEST_WORKER_INDEX) {
  for (const suffix of ['', '-wal', '-shm']) {
    try {
      fs.rmSync(`${E2E_DB_PATH}${suffix}`, { force: true });
    } catch {
      // Ignored if another process already owns the E2E SQLite handle
    }
  }
}

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 45_000,
  use: {
    baseURL: E2E_BASE_URL,
    channel: process.env.CI ? undefined : 'chrome',
    trace: 'retain-on-failure',
  },
  webServer: {
    command: `npx next start -p ${E2E_PORT}`,
    url: `${E2E_BASE_URL}/login`,
    reuseExistingServer: false,
    timeout: 60_000,
    env: {
      ...process.env,
      NODE_ENV: 'production',
      AQUILA_AUTH_SECRET: 'e2e-playwright-ephemeral-secret-key-min-32-bytes',
      AQUILA_ENABLE_DEMO_SEED: 'true',
      AQUILA_WEB_DB_PATH: E2E_DB_PATH,
      AQUILA_TEACHER_USERNAME: E2E_CREDENTIALS.teacher.username,
      AQUILA_TEACHER_PASSWORD: E2E_CREDENTIALS.teacher.password,
      AQUILA_PARENT_USERNAME: E2E_CREDENTIALS.parent.username,
      AQUILA_PARENT_PASSWORD: E2E_CREDENTIALS.parent.password,
      AQUILA_STUDENT_USERNAME: E2E_CREDENTIALS.student.username,
      AQUILA_STUDENT_PASSWORD: E2E_CREDENTIALS.student.password,
      AQUILA_COORD_USERNAME: E2E_CREDENTIALS.coordinator.username,
      AQUILA_COORD_PASSWORD: E2E_CREDENTIALS.coordinator.password,
      AQUILA_WEB_ADMIN_USERNAME: E2E_CREDENTIALS.admin.username,
      AQUILA_WEB_ADMIN_PASSWORD: E2E_CREDENTIALS.admin.password,
    },
  },
});
