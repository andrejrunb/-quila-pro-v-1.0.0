/**
 * AquilaConnectorService (Safe Proxy)
 */
export class AquilaConnectorServiceProxy {
  private static instance: AquilaConnectorServiceProxy;
  public static getInstance(): AquilaConnectorServiceProxy {
    if (!AquilaConnectorServiceProxy.instance) AquilaConnectorServiceProxy.instance = new AquilaConnectorServiceProxy();
    return AquilaConnectorServiceProxy.instance;
  }
  private async invoke(method: string, ...args: any[]): Promise<any> {
    if (typeof window !== 'undefined' && (window as any).aquila) return (window as any).aquila.invoke(':' + method, ...args);
    return null;
  }
  // Generic placeholders for methods used in UI
  public async getStatus(): Promise<any> { return this.invoke('getStatus'); }
  public async getData(): Promise<any> { return this.invoke('getData'); }
}
export const aquilaConnectorService = AquilaConnectorServiceProxy.getInstance();
export default aquilaConnectorService;
