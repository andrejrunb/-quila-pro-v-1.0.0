/**
 * AffiliateService (Safe Proxy)
 */
export class AffiliateServiceProxy {
  private static instance: AffiliateServiceProxy;
  public static getInstance(): AffiliateServiceProxy {
    if (!AffiliateServiceProxy.instance) AffiliateServiceProxy.instance = new AffiliateServiceProxy();
    return AffiliateServiceProxy.instance;
  }
  private async invoke(method: string, ...args: any[]): Promise<any> {
    if (typeof window !== 'undefined' && (window as any).aquila) return (window as any).aquila.invoke(':' + method, ...args);
    return null;
  }
  // Generic placeholders for methods used in UI
  public async getStatus(): Promise<any> { return this.invoke('getStatus'); }
  public async getData(): Promise<any> { return this.invoke('getData'); }
}
export const affiliateService = AffiliateServiceProxy.getInstance();
export default affiliateService;
