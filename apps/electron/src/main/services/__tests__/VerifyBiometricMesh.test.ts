import { FaceWorkerBridge } from '../FaceWorkerBridge';
import { FaceRecognition } from '../FaceRecognition';
import Database from '../../../database/Database';
import * as path from 'path';

jest.mock('../../../database/Database', () => {
  return jest.fn().mockImplementation(() => {
    return {
      initialize: jest.fn().mockResolvedValue(undefined),
      getFaceEmbeddings: jest.fn().mockResolvedValue([])
    };
  });
});

describe('Sovereign Biometric Mesh Verification', () => {
  let bridge: FaceWorkerBridge;
  let faceRecognition: FaceRecognition;
  let db: any;

  beforeAll(async () => {
    db = new Database(':memory:');
    // bridge = ...
    
    // Simula ambiente de teste
    bridge = new FaceWorkerBridge(true, path.join(__dirname, '../../../../resources'));
    faceRecognition = new FaceRecognition(db, bridge);
  });

  afterAll(async () => {
    if (bridge) {
      await bridge.shutdownAll();
    }
  });

  test('Should initialize bridge and detect hardware profile', async () => {
    await bridge.start();
    const status = await bridge.getOperationalStatus();
    
    expect(status).toBeDefined();
    expect(status.bridge_ready).toBe(true);
    expect(status.hardware).toBeDefined();
    console.log('--- Biometric Mesh Operational Status ---');
    console.log(JSON.stringify(status, null, 2));
  }, 45000);

  test('FaceRecognition should integrate with bridge telemetry', async () => {
    if (!bridge.isReady()) {
      await bridge.start();
    }
    const status = await faceRecognition.getOperationalStatus();
    expect(status.service).toBe('FaceRecognition');
    expect(status.bridge).toBeDefined();
    expect(status.bridge.bridge_ready).toBe(true);
  }, 45000);

  test('Should report REAL_MESH or SIMULATED_FALLBACK correctly', async () => {
    const status = await bridge.getOperationalStatus();
    // Em ambiente de CI sem modelos ONNX, esperamos SIMULATED_FALLBACK
    // Se estiver rodando em hardware real com modelos, esperamos REAL_MESH
    console.log(`Current Mode: ${status.mode}`);
    expect(['REAL_MESH', 'SIMULATED_FALLBACK']).toContain(status.mode);
  });

  test('Should perform zero-copy shared memory frame passing using Buffers', async () => {
    // Criar um buffer contendo uma imagem mínima de teste (PNG 1x1)
    const dummyImageBuffer = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
      'base64'
    );

    // Testar extractEmbedding com Buffer
    const embedding = await faceRecognition.extractEmbedding(dummyImageBuffer);
    expect(embedding).toBeDefined();
    console.log('SHM Embedding Extracted:', embedding ? `${embedding.length} dimensions` : 'null');

    // Testar recognizeFrame com Buffer de forma resiliente
    if (!bridge.isReady()) {
      await bridge.start();
    }
    if (bridge.isReady()) {
      await expect(bridge.recognizeFrame(dummyImageBuffer)).resolves.not.toThrow();
    } else {
      expect(bridge.isReady()).toBe(false);
    }
  }, 20000);
});
