import { courtyardTelemetryService, TelemetryConfig } from '../CourtyardTelemetryService';
import { colabGpuBridge } from '../ColabGpuBridge';
import { colabTunnelWatchdog } from '../ColabTunnelWatchdog';

// Mocks
jest.mock('../ColabGpuBridge', () => ({
  colabGpuBridge: {
    getStatus: jest.fn(),
    detectObjects: jest.fn()
  }
}));

jest.mock('../ColabTunnelWatchdog', () => ({
  colabTunnelWatchdog: {
    enqueueTask: jest.fn()
  }
}));

jest.mock('../../../database/Database', () => ({
  Database: {
    getInstance: jest.fn().mockReturnValue({})
  }
}));

describe('CourtyardTelemetryService', () => {
  const dummyBuffer = Buffer.from('test');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('deve enfileirar task se Colab estiver offline', async () => {
    (colabGpuBridge.getStatus as jest.Mock).mockReturnValue({ online: false });
    
    courtyardTelemetryService.configureCamera('cam-1', {
      cameraId: 'cam-1',
      crowdThreshold: 5,
      nightSentryMode: false,
      zones: []
    });

    const alerts = await courtyardTelemetryService.processFrame('cam-1', dummyBuffer);
    expect(alerts).toHaveLength(0);
    expect(colabTunnelWatchdog.enqueueTask).toHaveBeenCalledWith('yolo_detect', expect.any(Object), 2);
  });

  test('deve detectar intrusão se NightSentryMode estiver ativo', async () => {
    (colabGpuBridge.getStatus as jest.Mock).mockReturnValue({ online: true });
    (colabGpuBridge.detectObjects as jest.Mock).mockResolvedValue({
      detections: [
        { class_id: 0, class_name: 'person', confidence: 0.9, bbox: [10, 10, 50, 150] } // 40w x 140h
      ]
    });

    courtyardTelemetryService.configureCamera('cam-2', {
      cameraId: 'cam-2',
      crowdThreshold: 5,
      nightSentryMode: true,
      zones: []
    });

    const alerts = await courtyardTelemetryService.processFrame('cam-2', dummyBuffer);
    expect(alerts).toHaveLength(1);
    expect(alerts[0].type).toBe('INTRUSION');
  });

  test('deve detectar aglomeração', async () => {
    (colabGpuBridge.getStatus as jest.Mock).mockReturnValue({ online: true });
    
    // Simula 6 pessoas (limite é 5)
    const detections = Array(6).fill(null).map(() => ({
      class_id: 0, class_name: 'person', confidence: 0.8, bbox: [0, 0, 10, 50]
    }));
    
    (colabGpuBridge.detectObjects as jest.Mock).mockResolvedValue({ detections });

    courtyardTelemetryService.configureCamera('cam-3', {
      cameraId: 'cam-3',
      crowdThreshold: 5,
      nightSentryMode: false,
      zones: []
    });

    const alerts = await courtyardTelemetryService.processFrame('cam-3', dummyBuffer);
    // Deve ter 1 alerta de CROWD
    expect(alerts.filter(a => a.type === 'CROWD')).toHaveLength(1);
  });

  test('deve detectar queda (aspect ratio > 1.8)', async () => {
    (colabGpuBridge.getStatus as jest.Mock).mockReturnValue({ online: true });
    
    (colabGpuBridge.detectObjects as jest.Mock).mockResolvedValue({
      detections: [
        // width = 100, height = 30 -> ratio 3.33 -> Fall
        { class_id: 0, class_name: 'person', confidence: 0.8, bbox: [0, 0, 100, 30] }
      ]
    });

    courtyardTelemetryService.configureCamera('cam-4', {
      cameraId: 'cam-4',
      crowdThreshold: 5,
      nightSentryMode: false,
      zones: []
    });

    const alerts = await courtyardTelemetryService.processFrame('cam-4', dummyBuffer);
    expect(alerts).toHaveLength(1);
    expect(alerts[0].type).toBe('FALL');
  });

  test('deve detectar violação de geofence (privacidade)', async () => {
    (colabGpuBridge.getStatus as jest.Mock).mockReturnValue({ online: true });
    
    (colabGpuBridge.detectObjects as jest.Mock).mockResolvedValue({
      detections: [
        // center: cx = 50, cy = 50
        { class_id: 0, class_name: 'person', confidence: 0.8, bbox: [0, 0, 100, 100] }
      ]
    });

    // Quadrado de exclusão entre 40,40 e 60,60
    const zone = {
      id: 'banheiro-masc',
      name: 'Banheiro Masculino',
      type: 'EXCLUSION' as const,
      polygon: [
        {x: 40, y: 40},
        {x: 60, y: 40},
        {x: 60, y: 60},
        {x: 40, y: 60}
      ]
    };

    courtyardTelemetryService.configureCamera('cam-5', {
      cameraId: 'cam-5',
      crowdThreshold: 5,
      nightSentryMode: false,
      zones: [zone]
    });

    const alerts = await courtyardTelemetryService.processFrame('cam-5', dummyBuffer);
    expect(alerts).toHaveLength(1);
    expect(alerts[0].type).toBe('PRIVACY_VIOLATION');
  });
});
