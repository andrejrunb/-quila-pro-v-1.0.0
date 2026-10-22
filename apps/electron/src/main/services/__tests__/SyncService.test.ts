/**
 * Step 101 — Testes Unitários: SyncService
 * Alinhado com a implementação real:
 *   - enroll() → fetch /enroll → db.saveSettings()
 *   - sendHeartbeat() → verifica this.cloudId + this.cloudApiKey → _sendToCloud()
 *   - _sanitizePayload() → recebe OutboxItem com payload JSON string
 *   - start()/stop() → gerencia intervalHandle
 */
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { SyncService } = require('../SyncService');
import { jest } from '@jest/globals';

// Mock os module
jest.mock('os', () => ({
  cpus: () => [{ times: { user: 500, nice: 0, sys: 200, idle: 300, irq: 0 } }],
  totalmem: () => 8 * 1024 * 1024 * 1024,
  freemem: () => 4 * 1024 * 1024 * 1024,
  uptime: () => 86400,
  loadavg: () => [0.5, 0.3, 0.2],
  hostname: () => 'test-host',
  platform: () => 'linux',
}));

// Typed mock for fetch
const mockFetch: jest.Mock = jest.fn();
(global as any).fetch = mockFetch;

// Fresh mock DB factory — (jest.fn() as any) avoids strict 'never' inference
const makeMockDb = (): any => ({
  getSettings: (jest.fn() as any).mockResolvedValue({}),
  saveSettings: (jest.fn() as any).mockResolvedValue(undefined),
  getOutboxItems: (jest.fn() as any).mockResolvedValue([]),
  markOutboxSynced: (jest.fn() as any).mockResolvedValue(undefined),
});

describe('SyncService', () => {
  let syncService: any;
  let mockDb: any;

  beforeEach(() => {
    mockFetch.mockReset();
    mockDb = makeMockDb();
    syncService = new SyncService(mockDb, 'https://api.test.aquilapro.com');
  });

  afterEach(async () => {
    await syncService.stop();
  });

  // ─── _sanitizePayload ──────────────────────────────────────────────
  describe('_sanitizePayload (via OutboxItem)', () => {
    it('deve remover photoPath e faceEncoding do payload JSON', () => {
      const item = {
        id: 'item-1',
        event_type: 'ENTRY',
        created_at: '2026-03-22T00:00:00Z',
        synced: 0,
        payload: JSON.stringify({
          studentId: 'abc',
          photoPath: '/photos/a.jpg',
          faceEncoding: [0.1, 0.2],
          eventType: 'entry',
        }),
      };
      const clean = syncService._sanitizePayload(item);
      expect(clean).not.toBeNull();
      expect(clean.data?.photoPath).toBeUndefined();
      expect(clean.data?.faceEncoding).toBeUndefined();
      expect(clean.event_type).toBe('ENTRY');
    });

    it('deve retornar null para payload JSON inválido', () => {
      const item = {
        id: 'item-bad',
        event_type: 'ENTRY',
        created_at: '2026-03-22T00:00:00Z',
        synced: 0,
        payload: 'NOT_JSON{{{',
      };
      const result = syncService._sanitizePayload(item);
      expect(result).toBeNull();
    });
  });

  // ─── enroll ──────────────────────────────────────────────────────
  describe('enroll', () => {
    it('deve retornar success:true e chamar db.saveSettings com cloudId', async () => {
      (mockFetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          cloudId: 'cloud-uuid-123',
          apiKey: 'api-key-secret-456',
        }),
      });

      const result = await syncService.enroll('admin-token-abc');
      expect(result.success).toBe(true);
      expect(result.cloudId).toBe('cloud-uuid-123');
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.test.aquilapro.com/enroll',
        expect.objectContaining({ method: 'POST' })
      );
      expect(mockDb.saveSettings).toHaveBeenCalledWith(
        expect.objectContaining({ cloud_id: 'cloud-uuid-123' })
      );
    });

    it('deve retornar success:false quando servidor responde com erro HTTP', async () => {
      (mockFetch as any).mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ message: 'Token inválido' }),
      });
      const result = await syncService.enroll('bad-token');
      expect(result.success).toBe(false);
      expect(result.message).toBeTruthy();
    });

    it('deve retornar success:false e message em caso de erro de rede', async () => {
      (mockFetch as any).mockRejectedValueOnce(new Error('Network failure'));
      const result = await syncService.enroll('any-token');
      expect(result.success).toBe(false);
      expect(result.message).toBe('Network failure');
    });
  });

  // ─── sendHeartbeat ───────────────────────────────────────────────
  describe('sendHeartbeat', () => {
    it('deve chamar _sendToCloud quando cloudId e cloudApiKey estão definidos', async () => {
      // Injetar cloudId e cloudApiKey diretamente na instância privada
      syncService.cloudId = 'cloud-id-xyz';
      syncService.cloudApiKey = 'api-key-xyz';
      // _sendToCloud usa fetch com cloudEndpoint
      (mockFetch as any).mockResolvedValueOnce({ ok: true } as any);

      await syncService.sendHeartbeat();

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.test.aquilapro.com',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({ 'X-Aquila-Api-Key': 'api-key-xyz' }),
        })
      );
    });

    it('não deve chamar fetch se cloudId for null', async () => {
      syncService.cloudId = null;
      syncService.cloudApiKey = null;
      await syncService.sendHeartbeat();
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  // ─── start / stop ────────────────────────────────────────────────
  describe('start / stop', () => {
    it('deve definir intervalHandle após start() e limpá-lo após stop()', async () => {
      await syncService.start();
      expect(syncService.intervalHandle).not.toBeNull();

      await syncService.stop();
      expect(syncService.intervalHandle).toBeNull();
    });

    it('segunda chamada a start() não deve sobrescrever o handle existente', async () => {
      await syncService.start();
      const first = syncService.intervalHandle;
      await syncService.start();
      expect(syncService.intervalHandle).toBe(first);
    });
  });
});
