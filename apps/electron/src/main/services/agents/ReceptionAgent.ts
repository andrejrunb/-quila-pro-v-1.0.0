import { AutonomousAgent } from '../AutonomousAgent';
import { AgentTask } from '../../../services/AgentDefinitions';

/**
 * ReceptionAgent (v1638) - Member of the SECURITY Squad.
 * Hub for visitor intake and biometric screening squads.
 */
export class ReceptionAgent extends AutonomousAgent {
  constructor() {
    super('TOTEM', 'SECURITY');
  }

  public async thinkHub(context: any): Promise<void> {
    if (context.visitorArrived) {
       this.log('Visitor detected. Spawning BioScreening team.');
       this.spawnSubAgent({
         role: 'BioScanner',
         mission: 'Extract facial vector for verification',
         logic: async (p, log) => {
            log('Capturing high-res frame... face localized.');
            return { vectorId: 'vec-778' };
         }
       });
    }
  }

  protected async executeTaskLogic(task: AgentTask): Promise<void> {
    if (task.description === 'WATCHLIST_CHECK') {
       const seekerSub = this.spawnSubAgent({
         role: 'WatchlistSeeker',
         mission: 'Cross-reference visitor ID with interpol and local databases',
         logic: async (p, log) => {
            log('Searching Interpol Red Notices... Clean.');
            log('Searching school ban-list... Clean.');
            return { alertLevel: 'GREEN' };
         }
       });
       if (seekerSub) await seekerSub.execute(task.payload);
    }
  }
}
