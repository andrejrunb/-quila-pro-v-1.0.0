import { EventEmitter } from 'events';

/**
 * EdgeGatewayProxy.ts — AG-027
 * Facilita o acesso externo ao Áquila Pro via túnel seguro ou roteamento UPnP.
 */
class EdgeGatewayProxy extends EventEmitter {
  private isTunnelActive = false;

  /**
   * Inicializa o túnel de acesso remoto.
   */
  public async enableRemoteAccess(): Promise<string> {
    console.log('[EdgeGateway] Solicitando porta segura no roteador (UPnP/NAT-PMP)...');
    this.isTunnelActive = true;
    
    // Simulação de endpoint seguro
    const remoteUrl = `https://aquilaremote.link/${Math.random().toString(36).slice(7)}`;
    this.emit('tunnel-active', { url: remoteUrl });
    
    return remoteUrl;
  }

  public getStatus() {
    return { active: this.isTunnelActive };
  }
}

export const edgeGateway = new EdgeGatewayProxy();
export default edgeGateway;
