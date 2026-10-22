/**
 * UNIT SERVICE (Safe Proxy)
 */
export class UnitServiceProxy {
  private static instance: UnitServiceProxy;
  public static getInstance(): UnitServiceProxy {
    if (!UnitServiceProxy.instance) UnitServiceProxy.instance = new UnitServiceProxy();
    return UnitServiceProxy.instance;
  }
  private async invoke(method: string, ...args: any[]): Promise<any> {
    if (typeof window !== 'undefined' && window.aquila) return window.aquila.invoke(`unit:${method}`, ...args);
    return null;
  }
  public async listUnits(): Promise<any[]> { return this.invoke('listUnits'); }
  public async getUnitDetails(id: string): Promise<any> { return this.invoke('getUnitDetails', id); }
}
export const unitService = UnitServiceProxy.getInstance();
export default unitService;
