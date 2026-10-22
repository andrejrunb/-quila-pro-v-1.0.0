import { AgentRole } from '../../services/AgentDefinitions';

/**
 * SubAgent (v1638)
 * Lightweight logic unit spawned by a Hub Agent for a specific specialized task.
 */
export interface SubAgent {
  id: string;
  role: string; // e.g., 'FaceMatchBot', 'LockdownBot'
  parentRole: AgentRole;
  mission: string;
  status: 'ACTIVE' | 'IDLE' | 'TERMINATED';
  execute: (payload: any) => Promise<any>;
}

export interface SubAgentDefinition {
  role: string;
  mission: string;
  logic: (payload: any, log: (msg: string) => void) => Promise<any>;
}

