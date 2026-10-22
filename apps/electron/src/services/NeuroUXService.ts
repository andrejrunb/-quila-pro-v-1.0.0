/**
 * NEURO UX SERVICE (Safe Proxy)
 */
export class NeuroUXService {
  private async invoke(method: string, ...args: any[]): Promise<any> {
    if (typeof window !== 'undefined' && (window as any).aquila) {
      return (window as any).aquila.invoke('neuroux:' + method, ...args);
    }
    return null;
  }
  public async getStatus(): Promise<any> { return this.invoke('getStatus'); }
  public async getLiveness(): Promise<any> { return this.invoke('getLiveness'); }
}
export const neuroUXService = new NeuroUXService();
export default neuroUXService;
