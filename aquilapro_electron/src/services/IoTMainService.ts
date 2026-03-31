/**
 * IoTMainService (Main Process)
 * Encapsula a lógica de comunicação real com hardware via sockets TCP/UDP ou Serial.
 */
import { EventEmitter } from 'events';
import { IoTDevice, DeviceConfig } from './IoTTypes';

import { networkDiscoveryService } from './NetworkDiscoveryService';

class IoTMainService extends EventEmitter {
  private devices: IoTDevice[] = [
    { id: 't1', name: 'Catraca Principal A', type: 'turnstile', status: 'online', lastSync: Date.now() },
    { id: 't2', name: 'Catraca Principal B', type: 'turnstile', status: 'online', lastSync: Date.now() },
    { id: 'l1', name: 'Portão Administrativo', type: 'lock', status: 'online', lastSync: Date.now() },
  ];

  constructor() {
    super();
    this.startDiscovery();
  }

  private startDiscovery() {
    // Polling real de hardware no Main Process
    setInterval(async () => {
      const discovered = await networkDiscoveryService.scan();
      
      // Manter os dispositivos fixos e adicionar/atualizar descobertos
      const fixedIds = new Set(['t1', 't2', 'l1']);
      const currentDiscovered = this.devices.filter(d => !fixedIds.has(d.id));
      
      // Unir listas (por simplicidade, apenas adiciona novos por enquanto)
      const newDevices = [...this.devices.filter(d => fixedIds.has(d.id)), ...discovered];
      
      this.devices = newDevices;
      this.emit('devices-updated', this.devices);
    }, 10000); // 10 segundos para não sobrecarregar a rede
  }

  public async connectDevice(config: DeviceConfig): Promise<boolean> {
    console.log(`[IoTMain] Conectando ao hardware em ${config.ip}:${config.port} (${config.brand})...`);
    // Simulação de socket TCP
    return true;
  }

  public async openGate(deviceId: string) {
    return this.triggerCommand(deviceId, 'open');
  }

  public async triggerCommand(deviceId: string, command: 'open' | 'close' | 'reset') {
    const device = this.devices.find(d => d.id === deviceId);
    if (!device) throw new Error('Dispositivo não encontrado');

    console.log(`[IoTMain] EXECUTANDO COMANDO FÍSICO: ${command} em ${device.name}`);
    
    // Simulação de envio de buffer via socket
    const result = { success: true, timestamp: Date.now() };
    this.emit('command-executed', { deviceId, command, result });
    return result;
  }

  public async toggleRelay(deviceId: string) {
    const device = this.devices.find(d => d.id === deviceId);
    if (device) {
       // Alternar entre open e close
       const nextCommand = device.status === 'online' ? 'close' : 'open'; 
       // Na simulação real, device.status mudaria. Aqui apenas logamos.
       console.log(`[IoTMain] Toggling ${deviceId} to ${nextCommand}`);
       return this.triggerCommand(deviceId, nextCommand as any);
    }
  }

  public async lockAll() {
    console.log('[IoTMain] ENVIADO COMANDO DE LOCKDOWN GLOBAL - BLOQUEANDO TODAS AS INTERFACES');
    this.emit('lockdown-active', { timestamp: Date.now() });
    return await Promise.all(this.devices.map(d => this.triggerCommand(d.id, 'close')));
  }

  /**
   * Alias sovereign para o SOC (Item 112)
   */
  public async forceLockdown() {
    return this.lockAll();
  }

  public async lockByPoiType(poiType: string) {
    console.log(`[IoTMain] EXECUÇÃO LOCALIZADA: Bloqueando dispositivos do tipo ${poiType}`);
    // Mapear tipos de POI para tipos de dispositivos
    const targetType = poiType === 'entrance' ? 'lock' : 'turnstile';
    const targets = this.devices.filter(d => d.type === targetType);
    return await Promise.all(targets.map(d => this.triggerCommand(d.id, 'close')));
  }

  public async unlockAll() {
    console.log('[IoTMain] SUSPENDENDO LOCKDOWN GLOBAL - LIBERANDO INTERFACES');
    return await Promise.all(this.devices.map(d => this.triggerCommand(d.id, 'open')));
  }

  public getDevices(): IoTDevice[] {
    return this.devices;
  }

  public isEdgeHubActive(): boolean {
    // Procura por dispositivo com id 'edge-hub-01' ou similar
    // Na fase v3.6.4, se não houver hardware real via NetworkDiscovery, retornamos false
    return this.devices.some(d => d.id.includes('edge') && d.status === 'online');
  }
}

export const ioTMainService = new IoTMainService();
export default ioTMainService;
