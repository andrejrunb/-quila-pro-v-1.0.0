/**
 * Step 110 — Mutation Testing: Stryker.js
 * Executa com: npx stryker run
 */
/** @type {import('@stryker-mutator/api/core').PartialStrykerOptions} */
module.exports = {
  packageManager: 'npm',
  reporters: ['html', 'clear-text', 'progress'],
  testRunner: 'jest',
  coverageAnalysis: 'perTest',
  jest: {
    projectType: 'custom',
    configFile: 'jest.config.js',
    enableFindRelatedTests: true,
  },
  mutate: [
    // Focar nas funções críticas de LGPD e segurança
    'src/services/SyncService.ts',
    'src/services/WhatsAppQueue.ts',
    'src/services/LGPDService.ts',
    'src/database/Database.ts',
    '!src/**/__tests__/**/*.ts',
    '!src/tests/**/*.ts',
  ],
  thresholds: {
    high: 75,
    low: 60,
    break: 50,
  },
  timeoutMS: 30_000,
  timeoutFactor: 2,
  htmlReporter: {
    fileName: 'reports/mutation/index.html',
  },
};
