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
