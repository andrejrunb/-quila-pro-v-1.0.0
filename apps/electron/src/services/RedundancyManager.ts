/**
 * RedundancyManager (Safe Proxy)
 */
export class RedundancyManagerProxy {
  private static instance: RedundancyManagerProxy;
  public static getInstance(): RedundancyManagerProxy {
    if (!RedundancyManagerProxy.instance) RedundancyManagerProxy.instance = new RedundancyManagerProxy();
    return RedundancyManagerProxy.instance;
  }
  private async invoke(method: string, ...args: any[]): Promise<any> {
    if (typeof window !== 'undefined' && (window as any).aquila) return (window as any).aquila.invoke(':' + method, ...args);
    return null;
  }
  // Generic placeholders for methods used in UI
  public async getStatus(): Promise<any> { return this.invoke('getStatus'); }
  public async getData(): Promise<any> { return this.invoke('getData'); }
}
export const redundancyManager = RedundancyManagerProxy.getInstance();
export default redundancyManager;
