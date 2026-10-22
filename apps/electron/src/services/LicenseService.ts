/**
 * LICENSE SERVICE (v4001 - Safe Proxy)
 * ------------------------------------
 */

export interface LicenseInfo {
  id: string;
  key: string;
  type: 'standard' | 'premium' | 'enterprise';
  maxStudents: number;
  maxCameras: number;
  clientName: string;
  feature_flags: Record<string, boolean>;
  status: string;
  expiresAt?: string;
}

export class LicenseServiceProxy {
  private static instance: LicenseServiceProxy;

  private constructor() {}

  public static getInstance(): LicenseServiceProxy {
    if (!LicenseServiceProxy.instance) {
      LicenseServiceProxy.instance = new LicenseServiceProxy();
    }
    return LicenseServiceProxy.instance;
  }

  private async invoke(method: string, ...args: any[]): Promise<any> {
    if (typeof window !== 'undefined' && window.aquila) {
      return window.aquila.invoke(`license:${method}`, ...args);
    }
    throw new Error(`[LicenseProxy] IPC não disponível para ${method}`);
  }

  public async getActiveLicense(): Promise<LicenseInfo | null> {
    return this.invoke('get');
  }

  public async checkLimit(type: 'student' | 'camera'): Promise<boolean> {
    return this.invoke('check-limit', type);
  }

  public async activateLicense(key: string): Promise<boolean> {
    return this.invoke('activate', key);
  }
}

export const licenseService = LicenseServiceProxy.getInstance();
export default licenseService;
