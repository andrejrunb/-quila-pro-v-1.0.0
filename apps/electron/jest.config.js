module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      diagnostics: { ignoreCodes: [2345, 2322, 7017] },
      isolatedModules: true,
    }],
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^uuid$': '<rootDir>/src/tests/__mocks__/uuid.ts',
  },
  setupFilesAfterEnv: ['<rootDir>/src/tests/setup.ts'],
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'json-summary'],
  collectCoverageFrom: [
    'src/services/SyncService.ts',
    'src/services/WhatsAppQueue.ts',
    'src/services/AlertEngine.ts',
    'src/database/Database.ts',
    'src/services/LGPDService.ts',
    '!src/**/__tests__/**',
    '!src/tests/**',
  ],
  // [FIX] "worker process failed to exit gracefully"
  // Causa: setInterval em AquilaSentinel, AutoPurgeService, BackupManager,
  //        ChurnMonitorService, CortexEvolutionService mantêm o event loop vivo.
  // forceExit: encerra o processo após todos os testes sem false negatives.
  // openHandlesTimeout: 2000ms — loga handles abertos antes de encerrar.
  forceExit: true,
  openHandlesTimeout: 2000,
};
