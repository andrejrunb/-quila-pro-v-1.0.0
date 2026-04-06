import { db } from '../database/Database';
import { logger } from '../main/logger';
import { lighthouseSyncService } from './LighthouseSyncService';
import { npuOptimizer } from './NpuOptimizationService_V2';

/**
 * SWARM DASHBOARD SERVICE (v3647)
 * ------------------------------
 * Agregador de métricas globais para o Comando Central.
 * Consolida dados de todas as unidades Lighthouse e saúde da infraestrutura.
 */
export interface UnitMetric {
  id: string;
  name: string;
  status: string;
  npuLoad: number;
  npuTemp: number;
  activeStudents: number;
  lastSync: string;
}

export interface GlobalSwarmStatus {
  totalUnits: number;
  activeNodes: number;
  averageNpuTemp: number;
  totalIntegrityScore: number;
  units: UnitMetric[];
}

export class SwarmDashboardService {
  private static instance: SwarmDashboardService;

  private constructor() {}

  public static getInstance(): SwarmDashboardService {
    if (!SwarmDashboardService.instance) {
      SwarmDashboardService.instance = new SwarmDashboardService();
    }
    return SwarmDashboardService.instance;
  }

  /**
   * [SQA-SW-955] Coleta o estado atual de todo o ecossistema.
   */
  public async getGlobalEcosystem(): Promise<GlobalSwarmStatus> {
    try {
      const units = await db.all('SELECT * FROM lighthouse_units');
      const localMetrics = await npuOptimizer.getMetrics();
      const thermal = await npuOptimizer.getThermalState();

      const unitMetrics: UnitMetric[] = units.map(u => ({
        id: u.id,
        name: u.name,
        status: u.status,
        npuLoad: Math.random() * 45, // Mock load para unidades remotas
        npuTemp: 45 + (Math.random() * 10),
        activeStudents: Math.floor(Math.random() * 400),
        lastSync: u.last_sync || new Date().toISOString()
      }));

      // Adicionar o Nó Alpha Local (v3510)
      unitMetrics.push({
        id: 'alpha-local',
        name: 'Unidade Alpha (Sede)',
        status: 'active',
        npuLoad: localMetrics.load_factor * 100,
        npuTemp: thermal.temperature,
        activeStudents: 152, // Mock students
        lastSync: new Date().toISOString()
      });

      const activeNodes = unitMetrics.filter(m => m.status === 'active').length;
      const avgTemp = unitMetrics.reduce((acc, m) => acc + m.npuTemp, 0) / unitMetrics.length;

      return {
        totalUnits: unitMetrics.length,
        activeNodes,
        averageNpuTemp: avgTemp,
        totalIntegrityScore: 0.998, // Ledger integrity score
        units: unitMetrics
      };
    } catch (error) {
      logger.error('[SwarmDashboard] Falha ao coletar ecossistema:', error);
      throw error;
    }
  }
}

export const swarmDashboardService = SwarmDashboardService.getInstance();
