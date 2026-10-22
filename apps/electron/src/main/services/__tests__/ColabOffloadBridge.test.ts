import { ColabOffloadBridge } from '../ColabOffloadBridge';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('ColabOffloadBridge — A100 Neural Engine Tests', () => {
  let bridge: ColabOffloadBridge;

  beforeEach(() => {
    bridge = new ColabOffloadBridge('https://aquila-colab.loca.lt');
    jest.clearAllMocks();
  });

  test('Should configure and retrieve endpoint URL correctly', () => {
    expect(bridge.getEndpoint()).toBe('https://aquila-colab.loca.lt');
    bridge.setEndpoint('https://new-tunnel.trycloudflare.com/');
    expect(bridge.getEndpoint()).toBe('https://new-tunnel.trycloudflare.com');
  });

  test('Should verify connection and detect A100 GPU telemetry', async () => {
    mockedAxios.get.mockResolvedValueOnce({
      data: {
        engine: 'Aquila_A100_Engine',
        status: 'READY',
        gpu: {
          device: 'NVIDIA A100-SXM4-40GB',
          vram_total_gb: 40.0,
          vram_allocated_gb: 2.1,
          bf16_supported: true
        }
      }
    });

    const result = await bridge.testConnection();
    expect(result.ok).toBe(true);
    expect(result.gpu?.device).toContain('A100');
    expect(result.gpu?.vram_total_gb).toBe(40.0);
    expect(result.gpu?.bf16_supported).toBe(true);
    expect(bridge.getStatus().connected).toBe(true);
  });

  test('Should successfully offload tensor crunch task to A100', async () => {
    mockedAxios.post.mockResolvedValueOnce({
      data: {
        task_id: 'task_bench_001',
        status: 'SUCCESS',
        duration_ms: 12.4,
        result: 1048576
      }
    });

    const taskResult = await bridge.offloadTask('task_bench_001', 'tensor_crunch', { dim: 16384 });
    expect(taskResult.status).toBe('SUCCESS');
    expect(taskResult.duration_ms).toBeLessThan(50);
    expect(mockedAxios.post).toHaveBeenCalledWith(
      'https://aquila-colab.loca.lt/execute',
      expect.objectContaining({
        task_id: 'task_bench_001',
        task_type: 'tensor_crunch'
      }),
      expect.any(Object)
    );
  });

  test('Should handle connection failure gracefully when Colab is offline', async () => {
    mockedAxios.get.mockRejectedValueOnce(new Error('Network Timeout'));

    const result = await bridge.testConnection();
    expect(result.ok).toBe(false);
    expect(result.error).toContain('Network Timeout');
    expect(bridge.getStatus().connected).toBe(false);
  });
});
