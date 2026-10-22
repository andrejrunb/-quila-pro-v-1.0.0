import { EventEmitter } from 'events';

export interface SiteInfo {
  id: string;
  name: string;
  endpoint: string;
  status: 'online' | 'offline';
  activeAlerts: number;
}

/**
 * MultiSiteService.ts — AG-022
 * Gerenciamento federado de múltiplas instâncias Áquila Pro.
 */
class MultiSiteService extends EventEmitter {
  private sites: SiteInfo[] = [
    { id: 'S_01', name: 'Unidade Central', endpoint: 'localhost', status: 'online', activeAlerts: 0 },
    { id: 'S_02', name: 'Unidade Sul', endpoint: '192.168.1.50', status: 'online', activeAlerts: 2 },
    { id: 'S_03', name: 'Unidade Norte', endpoint: '10.0.0.8', status: 'offline', activeAlerts: 0 },
  ];

  public async getSitesStatus(): Promise<SiteInfo[]> {
    return this.sites;
  }

  public async switchSite(siteId: string): Promise<boolean> {
    console.log(`[MultiSite] Trocando visualização para unidade ${siteId}`);
    return true;
  }
}

export const multiSiteService = new MultiSiteService();
export default multiSiteService;

