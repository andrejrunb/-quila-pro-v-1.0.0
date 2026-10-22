
import { sovereignRegistry } from './src/main/registry';
import { sovereignLifecycleService } from './src/main/services/SovereignLifecycleService';
import { Database } from './src/database/Database';
import { logger } from './src/main/logger';

async function testMetabolism() {
  console.log('--- INICIANDO TESTE DE METABOLISMO (PHASE 700) ---');
  
  try {
    // 1. Setup DB
    const db = new Database();
    await db.initialize();
    Database.setInstance(db);
    sovereignRegistry.setDatabase(db);
    
    console.log('[Test] Banco de dados inicializado.');

    // 2. Boot Metabolism
    console.log('[Test] Ativando ciclos vitais...');
    await sovereignLifecycleService.bootMetabolism();

    // 3. Trigger manual cycles for verification
    console.log('[Test] Forçando ciclo de Meta-Evolução...');
    const evolution = await sovereignLifecycleService.runMetaEvolutionCycle();
    console.log(`[Test] Meta-Evolução concluída: ${evolution.suggestions} sugestões geradas.`);

    console.log('[Test] Forçando Auditoria de Resiliência...');
    await sovereignLifecycleService.runResilienceAudit();
    console.log('[Test] Auditoria de Resiliência concluída.');

    // 4. Check results in DB
    const insights = await db.all("SELECT * FROM ai_insights_review ORDER BY createdAt DESC LIMIT 5");
    console.log('[Test] Insights gerados no banco:', insights.length);
    insights.forEach((i: any) => console.log(` - [${i.category}] ${i.content.substring(0, 50)}...`));

    console.log('--- TESTE DE METABOLISMO CONCLUÍDO COM SUCESSO ---');
    process.exit(0);
  } catch (err) {
    console.error('--- ERRO NO TESTE DE METABOLISMO ---');
    console.error(err);
    process.exit(1);
  }
}

testMetabolism();
