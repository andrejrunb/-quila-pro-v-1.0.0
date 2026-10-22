import { SovereignSwarm } from './main/services/SovereignSwarm';
import { nexusSyncService } from './main/services/NexusSyncService';

async function runFailoverTest() {
  console.log('--- TESTE DE ESTRESSE DE FAILOVER (v3472) ---');
  
  const swarm = SovereignSwarm.getInstance();
  
  // 1. Verificar Master inicial
  console.log(`Master Inicial: ${swarm.masterNodeId}`);
  
  // 2. Simular queda do Alpha Core (nexus_alpha)
  console.log('\n[!] Simulando queda do mestre (nexus_alpha)...');
  nexusSyncService.simulateNodeFailure('nexus_alpha');
  
  // 3. Aguardar detecção (failover no SovereignSwarm é síncrono no evento 'node-suspended')
  console.log(`Novo Master Eleito: ${swarm.masterNodeId}`);
  
  if (swarm.masterNodeId === 'nexus_alpha') {
    console.error('FAIL: nexus_alpha ainda é o master!');
  } else {
    console.log('SUCCESS: Transição de mestre concluída com sucesso.');
  }
  
  // 4. Restaurar malha
  console.log('\n[!] Restaurando mestre (nexus_alpha)...');
  nexusSyncService.restoreNode('nexus_alpha');
  
  // No algoritmo atual (Cycle 8), o Alpha volta a ser master pois é lexicograficamente o primeiro
  console.log(`Master após restauração: ${swarm.masterNodeId}`);
}

runFailoverTest().catch(console.error);
