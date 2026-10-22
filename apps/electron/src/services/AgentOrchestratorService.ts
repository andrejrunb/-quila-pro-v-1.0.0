/**
 * AGENT ORCHESTRATOR SERVICE (Safe Proxy)
 */
export class AgentOrchestratorServiceProxy {
  private static instance: AgentOrchestratorServiceProxy;
  public static getInstance(): AgentOrchestratorServiceProxy {
    if (!AgentOrchestratorServiceProxy.instance) AgentOrchestratorServiceProxy.instance = new AgentOrchestratorServiceProxy();
    return AgentOrchestratorServiceProxy.instance;
  }
  private async invoke(method: string, ...args: any[]): Promise<any> {
    if (typeof window !== 'undefined' && window.aquila) return window.aquila.invoke(`agents:${method}`, ...args);
    return null;
  }
  public async setUnitContext(unitId: string): Promise<void> { return this.invoke('setUnitContext', unitId); }
  public async requestTask(task: any): Promise<void> { return this.invoke('requestTask', task); }
  public async getSwarmStatus(): Promise<any[]> { return this.invoke('getSwarmStatus'); }
  public async getActiveTasks(): Promise<any[]> { return this.invoke('getActiveTasks'); }
  public async getRecentActivity(): Promise<any[]> { return this.invoke('getRecentActivity'); }
}
export const agentOrchestratorService = AgentOrchestratorServiceProxy.getInstance();
export default agentOrchestratorService;
