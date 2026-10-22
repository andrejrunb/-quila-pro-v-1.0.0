import { Database } from '../database/Database';
import { consensusEngine } from '../main/services/ConsensusEngine';
import { sovereignSwarm } from '../main/services/SovereignSwarm';

async function runAudit() {
  console.log('--- POST-ZENITH STRUCTURAL AUDIT (v2.1.0) ---');
  
  // 1. DB Integrity
  const db = Database.getInstance();
  await db.initialize();
  const integrity = await db.checkIntegrity();
  console.log(`[Audit] Database Integrity: ${integrity.healthy ? 'OK' : 'FAIL'}`);
  
  // 2. Swarm Quorum Test
  console.log('[Audit] Testing Swarm Quorum (60% Rule)...');
  const swarmStatus = sovereignSwarm.getSwarmStatus();
  console.log(`[Audit] Active Agents: ${swarmStatus.agents.filter(a => a.status === 'active').length}`);
  
  const approval = await consensusEngine.requestHighRiskApproval('test-audit-action', { test: true });
  console.log(`[Audit] Consensus Result: ${approval ? 'APPROVED' : 'REJECTED'}`);
  
  // 3. Service Registry Check
  // (In production this would check if all services are bound)
  
  console.log('--- AUDIT COMPLETE ---');
  process.exit(0);
}

runAudit().catch(err => {
  console.error(err);
  process.exit(1);
});
