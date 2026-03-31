import { EventEmitter } from 'events';

export interface SyncPacket {
  id: string;
  sourceUnit: string;
  timestamp: number;
  payload: any;
  status: 'pending' | 'synced' | 'failed';
}

/**
 * Phase 510: CloudMirrorService
 * Simula a sincronização resiliente de dados locais com o QG Central (Cloud Mirroring).
 */
class CloudMirrorService extends EventEmitter {
  private syncQueue: SyncPacket[] = [];
  private isOnline: boolean = true;

  constructor() {
    super();
    this.startAutoSync();
  }

  public queueData(payload: any) {
    const packet: SyncPacket = {
      id: `sync_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      sourceUnit: 'Campus-Central-01',
      timestamp: Date.now(),
      payload,
      status: 'pending'
    };
    
    this.syncQueue.push(packet);
    this.emit('packet-queued', packet);
    return packet;
  }

  private async startAutoSync() {
    setInterval(() => {
      if (this.isOnline && this.syncQueue.length > 0) {
        const packet = this.syncQueue.find(p => p.status !== 'synced');
        if (packet) {
          this.performSync(packet);
        }
      }
    }, 10000);
  }

  private performSync(packet: SyncPacket) {
    // Simular latência de rede
    setTimeout(() => {
      packet.status = 'synced';
      console.log(`[CloudMirror] Sync Success: ${packet.id} uploaded to HQ.`);
      this.emit('sync-success', packet);
    }, 2000);
  }

  public setConnectionStatus(status: boolean) {
    this.isOnline = status;
    this.emit('connection-changed', status);
  }

  public getPendingCount() {
    return this.syncQueue.filter(p => p.status !== 'synced').length;
  }
}

export const cloudMirrorService = new CloudMirrorService();
