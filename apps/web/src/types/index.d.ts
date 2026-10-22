export {};

declare global {
  interface Window {
    aquila: {
      getRecentPulse: () => Promise<any>;
      getCortexHealth: () => Promise<any>;
      generateOrganizationalStrategy: () => Promise<any>;
      onCortexPulse: (callback: (insight: any) => void) => () => void;
      // ---- DISTRIBUTED INFERENCE ----
      inference: {
        dispatch: (type: string, payload: any, consensus: number) => Promise<any>;
        getTasks: () => Promise<any[]>;
        getNodes: () => Promise<any[]>;
        getInferenceState: () => Promise<{ 
          nodes: any[], 
          tasks: any[],
          security?: {
            encryption: string;
            layer: string;
            status: string;
          },
          wasm?: {
            activeModules: number;
            totalMemoryLimitMb: number;
            securityViolations: number;
          },
          pulse?: {
            localHash: string;
            globalConsensusHash: string | null;
            agreementRate: number;
            peerCount: number;
          }
        }>;
      };
      // -------------------------------
      invoke: (channel: string, ...args: any[]) => Promise<any>;
      on: (channel: string, callback: (...args: any[]) => void) => () => void;
    };
  }
}
