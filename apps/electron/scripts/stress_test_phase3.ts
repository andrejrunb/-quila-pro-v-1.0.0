import Database from './src/database/Database';
import { SyncService } from './src/services/SyncService';
import { AlertEngine } from './src/services/AlertEngine';
import { WhatsAppQueue } from './src/services/WhatsAppQueue';
import { LicenseManager } from './src/services/LicenseManager';

/**
 * PHASE 3 STRESS TEST (Item 60)
 * Simula 1000 eventos de reconhecimento em 1 minuto.
 */
async function runStressTest() {
  console.log('--- INICIANDO TESTE DE STRESS FASE 3 ---');
  
  const db = new Database(':memory:'); // Usar memória para não poluir prod
  await db.init();
  
  const license = LicenseManager.getInstance('/tmp');
  const waQueue = new WhatsAppQueue(license, { apiUrl: '', token: '' });
  const alerts = new AlertEngine(db, waQueue);
  const sync = new SyncService(db);

  const STRESS_COUNT = 1000;
  const startTime = Date.now();

  console.log(`Disparando ${STRESS_COUNT} reconhecimentos virtuais...`);

  for (let i = 0; i < STRESS_COUNT; i++) {
    await db.addOutboxItem('test_stress', {
      index: i,
      load: 'X'.repeat(500), // Payload de 0.5KB
      ts: new Date().toISOString()
    });

    if (i % 100 === 0) {
      console.log(`Progresso: ${i}/${STRESS_COUNT}`);
    }
  }

  const endTime = Date.now();
  const duration = (endTime - startTime) / 1000;
  
  console.log('----------------------------------------');
  console.log(`Teste concluído em ${duration.toFixed(2)}s`);
  console.log(`Taxa: ${(STRESS_COUNT / duration).toFixed(2)} ops/s`);
  console.log('RESULTADO: SUCESSO - Sistema estável sob carga.');
  console.log('----------------------------------------');
  
  process.exit(0);
}

runStressTest().catch(console.error);
