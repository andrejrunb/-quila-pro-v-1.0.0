import { EventEmitter } from 'events';

export interface ReplaySnapshot {
  timestamp: number;
  data: any[];
}

/**
 * IncidentReplayService (v1608)
 * Gerencia a reconstrução histórica de sinais e eventos RuView.
 * Permite retroceder a visualização 3D para análise forense.
 */
class IncidentReplayService extends EventEmitter {
  private isPlaying: boolean = false;
  private currentSnapshotIndex: number = 0;
  private snapshots: ReplaySnapshot[] = [];
  private playbackRate: number = 1; // 1x, 2x, 4x, etc.

  constructor() {
    super();
  }

  /**
   * Carrega snapshots do banco de dados para um intervalo de tempo (Simulação v1608)
   */
  async loadPeriod(startTime: number, endTime: number): Promise<void> {
    console.log(`[Forensics] Carregando logs de ${new Date(startTime).toLocaleString()} até ${new Date(endTime).toLocaleString()}`);
    
    // Simulação: Gerar snapshots baseados em dados históricos
    this.snapshots = Array.from({ length: 20 }).map((_, i) => ({
      timestamp: startTime + (i * 5000),
      data: [
        { id: 'subj_01', x: 2 + (i * 0.3), y: 3 + (i * 0.2), intensity: 0.8, type: 'subject' },
        { id: 'poi_door_main', x: 8, y: 7, type: 'door', status: i > 15 ? 'crossed' : 'idle' }
      ]
    }));
    
    this.currentSnapshotIndex = 0;
    this.emit('loaded', this.snapshots.length);
  }

  /**
   * Inicia o replay
   */
  start(): void {
    if (this.isPlaying) return;
    this.isPlaying = true;
    this.playNext();
  }

  private playNext(): void {
    if (!this.isPlaying || this.currentSnapshotIndex >= this.snapshots.length) {
      this.isPlaying = false;
      this.emit('finished');
      return;
    }

    const snapshot = this.snapshots[this.currentSnapshotIndex];
    this.emit('snapshot', snapshot);
    
    this.currentSnapshotIndex++;
    setTimeout(() => this.playNext(), 1000 / this.playbackRate);
  }

  pause(): void {
    this.isPlaying = false;
    this.emit('paused');
  }

  jumpTo(index: number): void {
    if (index < 0 || index >= this.snapshots.length) return;
    this.currentSnapshotIndex = index;
    this.emit('snapshot', this.snapshots[index]);
  }

  setRate(rate: number): void {
    this.playbackRate = rate;
  }

  getSnapshotCount(): number {
    return this.snapshots.length;
  }
}

export const incidentReplayService = new IncidentReplayService();
