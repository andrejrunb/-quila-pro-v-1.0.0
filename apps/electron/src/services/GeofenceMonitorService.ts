/**
 * GEOFENCE MONITOR SERVICE (Safe Proxy)
 */
export class GeofenceMonitorServiceProxy {
  private static instance: GeofenceMonitorServiceProxy;
  public static getInstance(): GeofenceMonitorServiceProxy {
    if (!GeofenceMonitorServiceProxy.instance) GeofenceMonitorServiceProxy.instance = new GeofenceMonitorServiceProxy();
    return GeofenceMonitorServiceProxy.instance;
  }
  private async invoke(method: string, ...args: any[]): Promise<any> {
    if (typeof window !== 'undefined' && window.aquila) return window.aquila.invoke(`geofence:${method}`, ...args);
    return null;
  }
  public async getAlerts(): Promise<any[]> { return this.invoke('getAlerts'); }
  public async updateZone(zoneId: string, data: any): Promise<void> { return this.invoke('updateZone', zoneId, data); }
}
export const geofenceMonitorService = GeofenceMonitorServiceProxy.getInstance();
export default geofenceMonitorService;
