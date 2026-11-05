export interface AquilaPulseInsight {
  id: string;
  type: 'pedagogical_optimization' | 'system_critical' | 'evolutionary_milestone' | 'risk_detected';
  content: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface AquilaCortexHealth {
  npuLoad: number;
  graphComplexity: number;
  totalInsights: number;
  isLearning: boolean;
}

export interface AquilaOrgStrategy {
  maturityStage: string;
  focusArea: string;
  strategyText: string;
  roiEstimate: number;
  lessonsLearned: number;
}

export interface AquilaMeshNode {
  id: string;
  name?: string;
  isLocal: boolean;
  status: string;
  npuLoad: number;
  address?: string;
}

export interface AquilaMeshTask {
  id: string;
  type: string;
  status: string;
  assignedTo: string;
  consensus: number;
}

declare global {
  interface Window {
    aquila: {
      getRecentPulse: () => Promise<AquilaPulseInsight[]>;
      getCortexHealth: () => Promise<AquilaCortexHealth>;
      generateOrganizationalStrategy: () => Promise<AquilaOrgStrategy>;
      onCortexPulse: (callback: (insight: AquilaPulseInsight) => void) => () => void;
      inference: {
        dispatch: (type: string, payload: Record<string, unknown>, consensus: number) => Promise<unknown>;
        getTasks: () => Promise<AquilaMeshTask[]>;
        getNodes: () => Promise<AquilaMeshNode[]>;
        getInferenceState: () => Promise<{
          nodes: AquilaMeshNode[];
          tasks: AquilaMeshTask[];
          security?: {
            encryption: string;
            layer: string;
            status: string;
          };
          wasm?: {
            activeModules: number;
            totalMemoryLimitMb: number;
            securityViolations: number;
          };
          pulse?: {
            localHash: string;
            globalConsensusHash: string | null;
            agreementRate: number;
            peerCount: number;
          };
        }>;
      };
      invoke: (channel: string, ...args: unknown[]) => Promise<unknown>;
      on: (channel: string, callback: (...args: unknown[]) => void) => () => void;
    };
  }
}
