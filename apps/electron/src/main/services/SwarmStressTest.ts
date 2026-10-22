import { sovereignSwarm } from './SovereignSwarm';
import { nexusSyncService as nexusSync } from './NexusSyncService';
import { Logger } from './Logger';

const logger = new Logger('SwarmStress');

export interface StressReport {
  timestamp: number;
  nodesAffected: number;
  previousMaster: string | null;
  newMaster: string | null;
  convergenceTimeMs: number;
  status: 'SUCCESS' | 'FAILED';
}

/**
 * SwarmStressTest - Motor de Resiliência (v3474)
 * Automatiza a validação de failover sob condições extremas.
 */
export class SwarmStressTest {
  private static instance: SwarmStressTest;

  private constructor() {}

  public static getInstance(): SwarmStressTest {
    if (!SwarmStressTest.instance) {
      SwarmStressTest.instance = new SwarmStressTest();
    }
    return SwarmStressTest.instance;
  }

  /**
   * Simula a queda do nó mestre e mede o tempo de recuperação.
   */
  public async runMasterFailoverTest(): Promise<StressReport> {
    const startTime = Date.now();
    const oldMaster = sovereignSwarm.masterNodeId;
    
    logger.warn(`[STRESS] Iniciando queda forçada do mestre: ${oldMaster}`);
    
    if (oldMaster) {
      nexusSync.simulateNodeFailure(oldMaster);
    }

    return new Promise((resolve) => {
      const checkElection = setInterval(() => {
        const newMaster = sovereignSwarm.masterNodeId;
        
        if (newMaster && newMaster !== oldMaster) {
          clearInterval(checkElection);
          const endTime = Date.now();
          const report: StressReport = {
            timestamp: endTime,
            nodesAffected: 1,
            previousMaster: oldMaster,
            newMaster: newMaster,
            convergenceTimeMs: endTime - startTime,
            status: endTime - startTime < 2000 ? 'SUCCESS' : 'FAILED'
          };
          
          logger.info(`[STRESS] Eleição concluída em ${report.convergenceTimeMs}ms. Novo Mestre: ${newMaster}`);
          resolve(report);
        }
      }, 100);

      // Timeout de 10 segundos
      setTimeout(() => {
        clearInterval(checkElection);
        resolve({
          timestamp: Date.now(),
          nodesAffected: 1,
          previousMaster: oldMaster,
          newMaster: null,
          convergenceTimeMs: -1,
          status: 'FAILED'
        });
      }, 10000);
    });
  }

  /**
   * Simula uma falha em cascata (nocauteia 50% do enxame).
   */
  public async runCascadeFailureTest() {
    const status = sovereignSwarm.getSwarmStatus();
    const nodes = status.agents;
    const toKill = nodes.slice(0, Math.floor(nodes.length / 2));
    
    logger.warn(`[STRESS] Iniciando falha em cascata em ${toKill.length} nós.`);
    
    toKill.forEach(agent => nexusSync.simulateNodeFailure(agent.id));
    
    return {
      startTime: Date.now(),
      killedNodes: toKill
    };
  }
}

export const swarmStressTest = SwarmStressTest.getInstance();

