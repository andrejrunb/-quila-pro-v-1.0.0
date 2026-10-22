import { jest } from '@jest/globals';

// Mocks globais
jest.mock('electron', () => ({
  app: {
    getPath: jest.fn().mockReturnValue('/tmp/aquila-test'),
    isPackaged: false,
    on: jest.fn(),
    quit: jest.fn(),
  },
  ipcMain: {
    on: jest.fn(),
    handle: jest.fn(),
  },
  BrowserWindow: jest.fn().mockImplementation(() => ({
    loadURL: jest.fn(),
    on: jest.fn(),
    webContents: {
      send: jest.fn(),
    },
  })),
}));

// Mock para fs (opcional, dependendo do teste)
// jest.mock('fs');

// Global mock for better-sqlite3 to avoid loading native addon during Jest tests
jest.mock('better-sqlite3', () => {
  return jest.fn().mockImplementation(() => {
    const stmt = {
      run: jest.fn().mockReturnValue({ changes: 1, lastInsertRowid: 1 }),
      get: jest.fn().mockReturnValue({}),
      all: jest.fn().mockReturnValue([]),
    };
    return {
      prepare: jest.fn().mockReturnValue(stmt),
      exec: jest.fn(),
      pragma: jest.fn(),
      transaction: jest.fn().mockImplementation((fn: any) => fn),
      close: jest.fn(),
    };
  });
});

// Global mock for logger to allow jest.spyOn on its methods (avoiding ES6 Proxy wrapping issues)
jest.mock('../main/logger', () => {
  const mockLogger = {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn().mockImplementation((...args) => console.error('[MOCK_LOGGER_ERROR]', ...args)),
    debug: jest.fn(),
  };
  return {
    logger: mockLogger,
  };
});

