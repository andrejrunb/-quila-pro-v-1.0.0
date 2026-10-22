import { sovereignEncryptionService } from '../main/services/SovereignEncryptionService';
import { logger } from '../main/logger';

/**
 * ARK Performance Benchmark
 * Testa a latência de criptografia e descriptografia fim-a-fim usando chaves ARK.
 */
async function runArkBenchmark() {
  const iterations = 1000;
  const payload = {
    taskId: 'test-task-123',
    type: 'inference_request',
    data: 'x'.repeat(1024 * 10), // 10KB de dados
    timestamp: Date.now()
  };
  
  const arkKey = 'ark_session_test_key_quantum_safe_2026';
  
  console.log(`[ARK-BENCHMARK] Iniciando teste com ${iterations} iterações (Payload: 10KB)...`);
  
  const start = performance.now();
  
  for (let i = 0; i < iterations; i++) {
    const encrypted = sovereignEncryptionService.encryptPayload(payload, arkKey);
    const decrypted = sovereignEncryptionService.decryptPayload(encrypted, arkKey);
    
    if (i === 0 && (!decrypted || (decrypted as any).taskId !== payload.taskId)) {
      throw new Error('Falha na integridade dos dados ARK!');
    }
  }
  
  const end = performance.now();
  const totalTime = end - start;
  const avgTime = totalTime / iterations;
  
  console.log('--------------------------------------------------');
  console.log(`Tempo Total: ${totalTime.toFixed(2)}ms`);
  console.log(`Média por Operação (E+D): ${avgTime.toFixed(4)}ms`);
  console.log(`Throughput: ${(1000 / avgTime).toFixed(2)} ops/s`);
  console.log('--------------------------------------------------');
  
  if (avgTime > 1.0) {
    console.warn('[WARNING] Latência ARK acima do esperado (>1ms por par)!');
  } else {
    console.log('[SUCCESS] Performance ARK validada (Elite Level).');
  }
}

runArkBenchmark().catch(console.error);
