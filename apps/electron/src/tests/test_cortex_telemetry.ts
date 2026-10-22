import Database from '../database/Database';
import { cortexEvolutionService } from '../main/services/CortexEvolutionService';

async function testTelemetry() {
  console.log('--- TESTE DE TELEMETRIA DO CÓRTEX (FASE 402) ---');
  
  const db = Database.getInstance();
  await db.initialize();
  
  // 1. Verificar Health Inicial
  console.log('[Test 1] Verificando Saúde Consolidada Inicial...');
  const initialHealth = await cortexEvolutionService.getConsolidatedHealth();
  console.log('Health Inicial:', initialHealth);

  if (typeof initialHealth.npuLoad !== 'number' || typeof initialHealth.graphComplexity !== 'number') {
    throw new Error('Formato de saúde inválido');
  }

  // 2. Mocking de Lição Aprendida para disparar evento
  console.log('[Test 2] Simulando Geração de Insight (Pulso)...');
  
  // Escutar evento (mock do listener do main.ts)
  cortexEvolutionService.on('cortex:pulse', (insight) => {
    console.log('[EVENTO RECEBIDO] cortex:pulse:', insight.content);
  });

  // Disparar manualmente para teste (normalmente disparado pelo StudySession)
  (cortexEvolutionService as any).emitInsight('pedagogical_optimization', 'Teste de otimização de fluxo cognitivo detectado.', { studentId: 'test' });

  // 3. Verificar Histórico (Pulse)
  console.log('[Test 3] Verificando Histórico de Pulso...');
  const pulse = cortexEvolutionService.getRecentPulse();
  console.log(`Itens no pulso: ${pulse.length}`);
  
  if (pulse.length > 0) {
    console.log('Último item do pulso:', pulse[0].content);
  } else {
    throw new Error('Pulso deveria conter o item simulado');
  }

  console.log('[SUCESSO] Telemetria validada com sucesso.');
  process.exit(0);
}

testTelemetry().catch(err => {
  console.error('[ERRO NO TESTE]', err);
  process.exit(1);
});
