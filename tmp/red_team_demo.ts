import { invasionSimulator } from '../apps/electron/src/services/agents/InvasionSimulator';
import { sovereignSwarm } from '../apps/electron/src/services/SovereignSwarm';

async function runDemo() {
  console.log('--- ÁQUILA PRO: RED TEAM SIMULATION START ---');
  
  // Ativação manual de agentes para a demo
  sovereignSwarm.setAgentStatus('sec-01', 'active', 'Scanning login vectors...');
  sovereignSwarm.setAgentStatus('sec-02', 'active', 'Verifying database integrity...');
  
  await invasionSimulator.runFullPentestSuite();
  
  console.log('--- SIMULATION LOGS (MOCK) ---');
  console.log('Detectadas 5 tentativas de brute force.');
  console.log('Tentativa de acesso a /data/biometrics INTERCEPTADA.');
  console.log('SQL Injection detectada e bloqueada pelo Audit Security.');
  
  console.log('--- RED TEAM SIMULATION END ---');
}

runDemo().catch(console.error);
