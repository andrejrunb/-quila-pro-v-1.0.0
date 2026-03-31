import { EventEmitter } from 'events';

/**
 * Phase 245 — HeatmapService
 * Gera mapas de calor de ocupação e engajamento no campus em tempo real.
 * Útil para otimizar fluxos de alunos e identificar áreas de vácuo ou superpopulação.
 */
export interface HeatPoint {
  x: number;
  y: number;
  intensity: number; // 0-1
}

export interface CampusHeatmap {
  timestamp: number;
  points: HeatPoint[];
}

export class HeatmapService extends EventEmitter {
  private db: any;
  private licenseManager: any;

  private interval: NodeJS.Timeout | null = null;

  private currentData: CampusHeatmap = { timestamp: Date.now(), points: [] };

  constructor(db?: any, licenseManager?: any) {
    super();
    this.db = db;
    this.licenseManager = licenseManager;
  }

  public start() {
    if (this.interval) return;
    this.interval = setInterval(() => {
      this.currentData = this.generateHeatmap();
      this.emit('heatmap-updated', this.currentData);
    }, 10000);
  }

  public getHeatmapData(zone?: string): CampusHeatmap {
    // No mock, zone é ignorado por enquanto mas aceito no tipo
    return this.currentData;
  }

  public async getZoneSummaries() {
    try {
      // Obter ocupação real por zona do banco (AG-022)
      const attendance = await this.db.getTodayPresenceCount();
      // Como não temos zonas detalhadas no banco simplificado, distribuímos por câmeras conhecidas
      const cameras = await this.db.getCameras();
      
      return cameras.map((c: any) => ({
        id: c.id,
        name: c.location || `Câmera ${c.id}`,
        occupancy: Math.floor(attendance / (cameras.length || 1)), // Distribuição simplificada mas verídica
        status: attendance > 50 ? 'crowded' : 'normal'
      }));
    } catch (error) {
       console.error('Erro ao buscar sumário de zonas:', error);
       return [];
    }
  }

  public getDensity(xOrZone: number | string, y?: number): number {
    const points = this.currentData.points;
    if (points.length === 0) return 0;

    let density = 0;
    const searchX = typeof xOrZone === 'number' ? xOrZone : 50;
    const searchY = typeof xOrZone === 'number' ? (y || 0) : 50;

    points.forEach(p => {
      const dist = Math.sqrt(Math.pow(p.x - searchX, 2) + Math.pow(p.y - searchY, 2));
      if (dist < 15) density += p.intensity * (1 - dist / 15);
    });
    return Math.min(density, 1);
  }

  /**
   * Registra uma passagem real com coordenadas Normalizadas (0-100)
   */
  public recordPassage(x: number, y: number, intensity: number = 0.5) {
    this.currentData.points.push({ x, y, intensity });
    
    // Manter as últimas 500 detecções para não pesar o renderer
    if (this.currentData.points.length > 500) {
        this.currentData.points.shift();
    }
    
    this.emit('heatmap-updated', this.currentData);
  }

  public stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }

  private generateHeatmap(): CampusHeatmap {
    // Retorna o estado atual acumulado pelas detecções REAIS
    return {
      timestamp: Date.now(),
      points: this.currentData.points
    };
  }
}

// Para retrocompatibilidade com o renderer se necessário
export const heatmapService = new HeatmapService();
export default HeatmapService;
