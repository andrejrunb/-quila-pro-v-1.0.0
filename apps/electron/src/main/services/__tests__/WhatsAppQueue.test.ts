import { WhatsAppQueue } from '../WhatsAppQueue';
import { LicenseManager } from '../LicenseManager';
import { LGPDNetworkGuard } from '../LGPDNetworkGuard';
import { db, Database } from '../../../database/Database';
import { jest } from '@jest/globals';

// Mock dependências
jest.mock('../LicenseManager');
jest.mock('../LGPDNetworkGuard');
jest.mock('../../../database/Database');

describe('WhatsAppQueue', () => {
  let waQueue: WhatsAppQueue;
  let mockLicense: jest.Mocked<LicenseManager>;
  let mockDb: jest.Mocked<Database>;
  let mockGateway: any;
  const mockConfig = { apiUrl: 'https://api.wa.test', token: 'fake-token' };

  beforeEach(() => {
    mockLicense = new (LicenseManager as any)() as jest.Mocked<LicenseManager>;
    mockLicense.getLimits.mockReturnValue({
      whatsappRatePerHour: 60,
      maxCameraStreams: 4,
      maxStudentFaces: 300,
      whatsappQueueEnabled: true,
      heatmapEnabled: false,
      multiUnitEnabled: false,
      hrEnabled: true,
      secretaryEnabled: true,
      messengerEnabled: false,
      gamificationEnabled: false
    });
    mockLicense.getTier.mockReturnValue('starter');

    mockDb = {
      addWhatsAppMessage: (jest.fn() as any).mockResolvedValue(undefined),
      getPendingWhatsAppMessages: (jest.fn() as any).mockResolvedValue([]),
      updateWhatsAppMessageStatus: (jest.fn() as any).mockResolvedValue(undefined),
      deleteWhatsAppMessage: (jest.fn() as any).mockResolvedValue(undefined),
      run: (jest.fn() as any).mockResolvedValue(undefined),
      get: (jest.fn() as any).mockResolvedValue(null),
      all: (jest.fn() as any).mockResolvedValue([]),
    } as any;
    waQueue = new WhatsAppQueue(mockDb, mockLicense, mockConfig);
    mockGateway = {
      send: jest.fn()
    };
    (waQueue as any).setGateway(mockGateway as any);
    (global as any).mockGateway = mockGateway; // Export to it blocks
    
    // Mock LGPD assert
    (LGPDNetworkGuard.assertSafePayload as jest.Mock).mockReturnValue(undefined);

    jest.clearAllMocks();
  });

  describe('enqueue', () => {
    it('deve enfileirar uma mensagem e truncar se exceder 1600 caracteres', async () => {
      const longBody = 'A'.repeat(1700);
      await waQueue.enqueue({ to: '556199999999', body: longBody, event_type: 'TEST' });
      
      const status = waQueue.getQueueStatus();
      expect(status.queued).toBe(1);
    });

    it('deve gerar IDs únicos para cada mensagem', async () => {
      await waQueue.enqueue({ to: '1', body: 'b1', event_type: 'T' });
      await waQueue.enqueue({ to: '2', body: 'b2', event_type: 'T' });
      
      // Acessando propriedade privada para o teste
      const queue = (waQueue as any).queue;
      expect(queue[0].id).not.toBe(queue[1].id);
    });
  });

  describe('processamento e Rate Limit', () => {
    it('deve respeitar o rate limit do plano Essencial (60/hora)', async () => {
      mockLicense.getLimits.mockReturnValue({ whatsappRatePerHour: 2 } as any);
      
      await waQueue.enqueue({ to: '1', body: 'b1', event_type: 'T' });
      await waQueue.enqueue({ to: '2', body: 'b2', event_type: 'T' });
      await waQueue.enqueue({ to: '3', body: 'b3', event_type: 'T' });

      mockGateway.send.mockResolvedValue(true);

      // Executa processamento manual
      await (waQueue as any)._process();

      const status = waQueue.getQueueStatus();
      expect(status.sentThisHour).toBe(2);
      expect(status.queued).toBe(1); // 1 sobrou na fila
    });

    it('deve permitir envio ilimitado se rateLimit for 0 (Enterprise)', async () => {
      mockLicense.getLimits.mockReturnValue({ whatsappRatePerHour: 0 } as any);
      
      for(let i=0; i<5; i++) {
        await waQueue.enqueue({ to: 'dest', body: `msg ${i}`, event_type: 'T' });
      }

      mockGateway.send.mockResolvedValue(true);

      await (waQueue as any)._process();

      const status = waQueue.getQueueStatus();
      expect(status.sentThisHour).toBe(5);
      expect(status.queued).toBe(0);
    });

    it('deve tentar novamente (retry) em caso de falha HTTP (até 3 vezes)', async () => {
      await waQueue.enqueue({ to: '1', body: 'fail', event_type: 'T' });

      // Primeira tentativa falha
      mockGateway.send.mockResolvedValueOnce(false);

      await (waQueue as any)._process();

      const status = waQueue.getQueueStatus();
      expect(status.sentThisHour).toBe(0);
      expect(status.queued).toBe(1);
      
      const msg = (waQueue as any).queue[0];
      expect(msg.attempts).toBe(1);
    });
  });
});
