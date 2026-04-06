import { AutonomousAgent } from '../AutonomousAgent';
import { AgentTask } from '../AgentDefinitions';

/**
 * ArrivalAgent (v1638) - Member of the OPERATIONS Squad.
 * Hub for gateway announcements and the 'Airport-style' arrival board.
 */
export class ArrivalAgent extends AutonomousAgent {
  constructor() {
    super('TOTEM', 'OPERATIONS'); // Uses TOTEM role for public gateway displays
  }

  public async thinkHub(context: any): Promise<void> {
     if (context.parentArriving) {
        this.log(`Parent ${context.parentId} detected via Geofence. Spawning ArrivalOrganizerBot.`);
        this.spawnSubAgent({
           role: 'ArrivalOrganizerBot',
           mission: 'Coordinate with StudentAgent to prepare and move student to Gateway A',
           logic: async (p, log) => {
              log(`Instruction: Release student ${p.studentId} for arrival in 3 mins.`);
              return { gateReady: true };
           }
        });
     }
  }

  protected async executeTaskLogic(task: AgentTask): Promise<void> {
    if (task.description === 'ANNOUNCE_STUDENT') {
       const audioSub = this.spawnSubAgent({
         role: 'VoiceAnnouncer',
         mission: 'Generate text-to-speech announcement for the hallway',
         logic: async (p, log) => {
            log(`Announcing: ${p.studentName} - Pai está na porta.`);
            return { announced: true };
         }
       });
       if (audioSub) await audioSub.execute(task.payload);
    }
  }
}
