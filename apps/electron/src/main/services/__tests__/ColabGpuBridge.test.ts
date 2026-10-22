import { ColabGpuBridge, colabGpuBridge } from '../ColabGpuBridge';

describe('ColabGpuBridge Unit Tests', () => {
  let bridge: ColabGpuBridge;

  beforeEach(() => {
    bridge = ColabGpuBridge.getInstance();
    // Parar health check para isolamento dos testes
    bridge.destroy();
    // Resetar estado interno se necessário via configure com string vazia
    (bridge as any).baseUrl = '';
    (bridge as any).isOnline = false;
    (bridge as any).lastHealth = null;
    (bridge as any).requestCount = 0;
    (bridge as any).errorCount = 0;
  });

  afterAll(() => {
    if (bridge) {
      bridge.destroy();
    }
  });

  test('Deve ser um Singleton retornando a mesma instância', () => {
    const instanceA = ColabGpuBridge.getInstance();
    const instanceB = ColabGpuBridge.getInstance();
    expect(instanceA).toBe(instanceB);
    expect(instanceA).toBe(colabGpuBridge);
  });

  test('Deve configurar a URL base removendo barras extras ao final', () => {
    bridge.configure('https://aquila-colab.trycloudflare.com///');
    const status = bridge.getStatus();
    expect(status.url).toBe('https://aquila-colab.trycloudflare.com');
  });

  test('Deve lançar erro ao configurar URL com protocolo inválido ou formato incorreto', () => {
    expect(() => bridge.configure('ftp://malicious-host.com')).toThrow(
      'Protocolo deve ser http ou https'
    );
    expect(() => bridge.configure('')).toThrow('URL inválida fornecida');
  });

  test('Deve retornar estado inicial como offline e sem métricas', () => {
    const status = bridge.getStatus();
    expect(status.online).toBe(false);
    expect(status.health).toBeNull();
    expect(status.stats.requests).toBe(0);
    expect(status.stats.errors).toBe(0);
  });

  test('Deve lançar erro ao chamar extractFaceEmbeddings com URL não configurada', async () => {
    const dummyBuffer = Buffer.from('fake-image');
    await expect(bridge.extractFaceEmbeddings(dummyBuffer)).rejects.toThrow(
      'URL não configurada'
    );
  });

  test('Deve lançar erro ao chamar extractFaceEmbeddings quando offline', async () => {
    bridge.configure('https://aquila-colab.trycloudflare.com');
    // Forçar status offline
    (bridge as any).isOnline = false;
    const dummyBuffer = Buffer.from('fake-image');

    await expect(bridge.extractFaceEmbeddings(dummyBuffer)).rejects.toThrow(
      'Colab GPU está offline'
    );
  });

  test('Deve lançar erro ao chamar detectObjects quando offline', async () => {
    bridge.configure('https://aquila-colab.trycloudflare.com');
    (bridge as any).isOnline = false;
    const dummyBuffer = Buffer.from('fake-frame');

    await expect(bridge.detectObjects(dummyBuffer, 0.5)).rejects.toThrow(
      'Colab GPU está offline'
    );
  });

  test('Deve lançar erro ao chamar processImage quando offline', async () => {
    bridge.configure('https://aquila-colab.trycloudflare.com');
    (bridge as any).isOnline = false;
    const dummyBuffer = Buffer.from('fake-image');

    await expect(bridge.processImage(dummyBuffer)).rejects.toThrow(
      'Colab GPU está offline'
    );
  });

  test('Deve lançar erro ao chamar benchmark quando offline', async () => {
    bridge.configure('https://aquila-colab.trycloudflare.com');
    (bridge as any).isOnline = false;

    await expect(bridge.benchmark()).rejects.toThrow(
      'Colab GPU está offline'
    );
  });

  test('Deve parar o health check e limpar listeners no destroy()', () => {
    bridge.configure('https://aquila-colab.trycloudflare.com');
    expect((bridge as any).healthInterval).not.toBeNull();

    bridge.destroy();
    expect((bridge as any).healthInterval).toBeNull();
    expect(bridge.listenerCount('online')).toBe(0);
    expect(bridge.listenerCount('offline')).toBe(0);
  });

  test('Deve retornar OFFLINE no checkHealth quando a conexão falhar', async () => {
    bridge.configure('http://127.0.0.1:59999'); // Porta inexistente garantindo erro de rede rápido
    const health = await bridge.checkHealth();

    expect(health.status).toBe('OFFLINE');
    expect(bridge.getStatus().online).toBe(false);
  });
});
