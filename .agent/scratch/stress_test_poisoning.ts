import * as fs from 'fs';
import * as path from 'path';

// Mock Electron before any imports that might use it
(global as any).Electron = { BrowserWindow: class {} };
require('module').prototype.require = (function(originalRequire) {
  return function(this: any, name: string) {
    if (name === 'electron') {
      return {
        app: {
          getPath: () => 'C:/tmp/aquila-test',
          isReady: () => true,
        }
      };
    }
    return originalRequire.apply(this, arguments);
  };
})(require('module').prototype.require);

import { SovereignConsciousnessService } from 'c:/aquila/apps/electron/src/main/services/SovereignConsciousnessService';
import { sovereignResilienceService } from 'c:/aquila/apps/electron/src/main/services/SovereignResilienceService';

async function runPoisoningSimulation() {
  console.log('--- [START] FEDERATION POISONING SIMULATION ---');
  
  // 1. Setup Mock DB
  const mockDb = {
    all: async () => [
      { id: 'node_1', weight_hash: 'hash_a' },
      { id: 'node_2', weight_hash: 'hash_b' }, // Divergence!
      { id: 'node_3', weight_hash: 'hash_c' }
    ]
  };

  const service = SovereignConsciousnessService.getInstance(mockDb as any);
  
  // 2. Mock predictor and federation
  (service as any).detectFederationPoisoning = () => true; // Force poisoning detection
  
  console.log('Status Inicial Air-Gap:', process.env.AQUILA_AIRGAP_ACTIVE);
  
  // 3. Trigger self-synthesis cycle (which calls detectFederationPoisoning and triggerSovereignIsolation)
  console.log('Executando Ciclo de Auto-Sintese (Simulado)...');
  await (service as any).runSelfSynthesisCycle();
  
  // 3. Verify Result
  const isIsolated = process.env.AQUILA_AIRGAP_ACTIVE === 'true';
  
  if (isIsolated) {
    console.log('✅ SUCESSO: O sistema detectou a divergência e ativou o isolamento (AIR-GAP).');
  } else {
    console.log('❌ FALHA: O sistema não isolou após detecção de veneno na federação.');
  }

  console.log('--- [END] SIMULATION ---');
}

runPoisoningSimulation().catch(console.error);
