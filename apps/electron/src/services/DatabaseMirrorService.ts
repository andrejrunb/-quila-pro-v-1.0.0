import * as fs from 'fs';
import * as path from 'path';
import { nexusSyncService } from './NexusSyncService';
import { sovereignSwarm } from './SovereignSwarm';

/**
 * DatabaseMirrorService.ts — AG-026
 * Mirroring de banco de dados para alta disponibilidade e prevenção de corrupção.
 */
class DatabaseMirrorService {
  private primaryDbPath: string;
  private mirrorPath: string;

  constructor(appDataPath: string) {
    this.primaryDbPath = path.join(appDataPath, 'aquila.db');
    this.mirrorPath = path.join(appDataPath, 'backup/aquila_mirror.db');
    
    if (!fs.existsSync(path.dirname(this.mirrorPath))) {
        fs.mkdirSync(path.dirname(this.mirrorPath), { recursive: true });
    }
  }

  /**
   * Executa a Replicação Tripla (Local Mirror + Swarm Push).
   */
  public async syncMirror(): Promise<void> {
    try {
        if (!fs.existsSync(this.primaryDbPath)) return;
        
        // 1. Espelhamento Local (v3480)
        fs.copyFileSync(this.primaryDbPath, this.mirrorPath);
        
        // 2. Replicação em Enxame (Triple Mirror)
        const swarmStatus = sovereignSwarm.getSwarmStatus();
        const otherNodes = swarmStatus.nodes.filter(id => id !== sovereignSwarm.masterNodeId);
        
        // Selecionar até 2 guardiões (Total = Master + 2 = 3)
        const guardians = otherNodes.slice(0, 2);
        
        if (guardians.length > 0) {
            const dbBuffer = fs.readFileSync(this.primaryDbPath);
            guardians.forEach(nodeId => {
                nexusSyncService.broadcastMessage({
                    type: 'HS_DB_PROTO_MIRROR',
                    payload: { data: dbBuffer.toString('base64'), timestamp: Date.now() }
                });
            });
            console.log(`[DatabaseMirror] Replicação tripla enviada para: ${guardians.join(', ')}`);
        }
        
        console.log(`[DatabaseMirror] Mirror local atualizado com sucesso.`);
    } catch (err) {
        console.error('[DatabaseMirror] Falha no triple-mirror:', err);
    }
  }
}

export { DatabaseMirrorService };
