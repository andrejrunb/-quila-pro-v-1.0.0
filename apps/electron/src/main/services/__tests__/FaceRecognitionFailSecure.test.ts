import { FaceRecognition } from '../FaceRecognition';
import Database from '../../../database/Database';

describe('FaceRecognition Fail-Secure (Zero Random Biometrics)', () => {
  let faceRecognition: FaceRecognition;
  let db: any;

  beforeEach(() => {
    db = new Database(':memory:');
    // Instanciar SEM workerBridge para simular worker offline / indisponível
    faceRecognition = new FaceRecognition(db, undefined as any);
  });

  test('extractEmbedding must return null when worker bridge is not ready (NEVER random vectors)', async () => {
    const dummyImage = Buffer.from('fake_image_data');
    const embedding = await faceRecognition.extractEmbedding(dummyImage);

    // Deve ser estritamente nulo - proibir qualquer geração de identidade sintética/aleatória
    expect(embedding).toBeNull();
  });

  test('recognize must fail-secure and emit recognition:unavailable when extraction yields null', async () => {
    // Carregar índice vazio
    await faceRecognition.loadModel();

    let eventEmitted: any = null;
    faceRecognition.on('recognition:unavailable', (payload) => {
      eventEmitted = payload;
    });

    const dummyImage = Buffer.from('fake_image_data');
    const match = await faceRecognition.recognize(dummyImage);

    expect(match).toBeNull();
    expect(eventEmitted).not.toBeNull();
    expect(eventEmitted.reason).toBe('BIOMETRIC_WORKER_OR_MODEL_UNAVAILABLE');
  });
});
