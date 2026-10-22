/**
 * NEXUS SYNC SERVICE (v3640 - Safe Proxy)
 * --------------------------------------
 */

export class NexusSyncServiceProxy {
  private static instance: NexusSyncServiceProxy;

  public static getInstance(): NexusSyncServiceProxy {
    if (!NexusSyncServiceProxy.instance) {
      NexusSyncServiceProxy.instance = new NexusSyncServiceProxy();
    }
    return NexusSyncServiceProxy.instance;
  }

  private async invoke(method: string, ...args: any[]): Promise<any> {
    if (typeof window !== 'undefined' && window.aquila) {
      return window.aquila.invoke(`nexus:${method}`, ...args);
    }
    return null;
  }

  public getNodes(): Promise<any[]> {
    return this.invoke('getNodes');
  }

  public isMeshAlive(): Promise<boolean> {
    return this.invoke('isMeshAlive');
  }

  public setMeshStatus(active: boolean): Promise<void> {
    return this.invoke('setMeshStatus', active);
  }

  // Event handlers would need a different IPC implementation (on/once)
  // For now, we focus on the request/response methods used in UI.
}

export const nexusSyncService = NexusSyncServiceProxy.getInstance();
export default nexusSyncService;
