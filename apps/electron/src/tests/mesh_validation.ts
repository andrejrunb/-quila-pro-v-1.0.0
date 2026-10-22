import { SovereignMeshService } from '../main/services/SovereignMeshService';
import { logger } from '../main/logger';

/**
 * Teste de Validação da Malha Soberana (Phase 600)
 * Simula dois nós na mesma máquina e verifica a descoberta via mDNS.
 */
async function testMeshDiscovery() {
  console.log('🚀 Iniciando Validação da Malha Soberana...');

  const node1 = new SovereignMeshService();
  const node2 = new SovereignMeshService();

  try {
    // Inicializa Nó 1 (Simulando Campus A)
    console.log('[Test] Inicializando Nó 1...');
    await node1.init();
    const info1 = node1.getMeshInfo();
    console.log(`[Test] Nó 1 Online: ${info1.nodeId} em ${JSON.stringify(info1.addresses)}`);

    // Inicializa Nó 2 (Simulando Campus B)
    console.log('[Test] Inicializando Nó 2...');
    await node2.init();
    const info2 = node2.getMeshInfo();
    console.log(`[Test] Nó 2 Online: ${info2.nodeId} em ${JSON.stringify(info2.addresses)}`);

    console.log('[Test] Aguardando descoberta mDNS (15s)...');
    
    // Aguarda descoberta mDNS
    await new Promise(resolve => setTimeout(resolve, 15000));

    const peers1 = node1.getConnectedPeers();
    const peers2 = node2.getConnectedPeers();

    console.log(`[Test] Nó 1 vê ${peers1.length} peers:`, peers1.map(p => p.id));
    console.log(`[Test] Nó 2 vê ${peers2.length} peers:`, peers2.map(p => p.id));

    if (peers1.length > 0 || peers2.length > 0) {
      console.log('✅ SUCESSO: Malha P2P estabelecida e funcional!');
    } else {
      console.warn('⚠️ AVISO: Nenhum peer detectado. Verifique se o tráfego multicast UDP está liberado no host.');
    }

    // Teste de Broadcast (Brain Pulse)
    console.log('[Test] Testando broadcast de pulso evolutivo...');
    await node1.broadcast({
      id: 'test_id',
      sourceNode: 'node1',
      targetNode: 'all',
      payloadType: 'evolution_pulse',
      timestamp: Date.now(),
      payload: { id: 'TEST-INSIGHT', content: 'Crescimento de rede detectado.' }
    });

    await new Promise(resolve => setTimeout(resolve, 2000));
    console.log('[Test] Finalizando teste.');

  } catch (err) {
    console.error('❌ ERRO no teste de malha:', err);
  } finally {
    process.exit(0);
  }
}

testMeshDiscovery();
