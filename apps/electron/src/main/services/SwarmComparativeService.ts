import { Database } from '../../database/Database';
import { v4 as uuidv4 } from 'uuid';

export interface SwarmKPI {
  schoolId: string;
  schoolName: string;
  attendanceRate: number;
  averageBalance: number;
  incidentDensity: number; // Incidentes por 100 alunos
  updatedAt: Date;
}

export interface ComparativeAnalysis {
  unitId: string;
  unitName: string;
  localKPIs: Partial<SwarmKPI>;
  swarmAverages: Partial<SwarmKPI>;
  anomalies: string[];
}

class SwarmComparativeService {
  private get db() {
    return Database.getInstance();
  }

  /**
   * Coleta KPIs de todas as unidades ligadas ao Lighthouse (Swarm)
   * Nota: Em produção, isso usaria LighthouseSyncService para buscar dados remotos.
   * Aqui simulamos a agregação local dos dados sincronizados.
   */
  async getSwarmKPIs(): Promise<SwarmKPI[]> {
    const units = await this.db.all(`SELECT id, name FROM lighthouse_units WHERE status = 'active'`);
    
    // Mock de agregação por unidade para o MVP do Córtex
    const kpis: SwarmKPI[] = [];
    for (const unit of units) {
      // Coletar métricas reais integradas via Lighthouse
      const metrics = await this.db.get(`
        SELECT 
          (SELECT AVG(balance) FROM student_economy) as avgBalance,
          (SELECT COUNT(*) FROM audit_logs WHERE action = 'incident') as incidents
        FROM audit_logs LIMIT 1
      `);

      kpis.push({
        schoolId: unit.id,
        schoolName: unit.name,
        attendanceRate: 85 + Math.random() * 10, // Mocked for demonstration
        averageBalance: metrics?.avgBalance || 0,
        incidentDensity: (metrics?.incidents || 0) * 1.2,
        updatedAt: new Date()
      });
    }

    return kpis;
  }

  /**
   * Gera uma análise comparativa de uma unidade específica vs o resto do enxame (Swarm)
   */
  async getComparativeAnalysis(specificUnitId?: string): Promise<ComparativeAnalysis[]> {
    const swarmKPIs = await this.getSwarmKPIs();
    if (swarmKPIs.length === 0) return [];

    const swarmAverages = {
      attendanceRate: swarmKPIs.reduce((acc, k) => acc + k.attendanceRate, 0) / swarmKPIs.length,
      averageBalance: swarmKPIs.reduce((acc, k) => acc + k.averageBalance, 0) / swarmKPIs.length,
      incidentDensity: swarmKPIs.reduce((acc, k) => acc + k.incidentDensity, 0) / swarmKPIs.length,
    };

    const results: ComparativeAnalysis[] = [];

    // Se não pedir unidade específica, retorna todas (visão Áquila Admin)
    const targets = specificUnitId 
      ? swarmKPIs.filter(k => k.schoolId === specificUnitId)
      : swarmKPIs;

    for (const target of targets) {
      const anomalies: string[] = [];
      if (target.attendanceRate < swarmAverages.attendanceRate - 5) {
        anomalies.push(`Frequência ${target.attendanceRate.toFixed(1)}% significativamente abaixo da média do enxame (${swarmAverages.attendanceRate.toFixed(1)}%)`);
      }
      if (target.incidentDensity > swarmAverages.incidentDensity * 1.5) {
        anomalies.push(`Densidade de incidentes crítica: ${target.incidentDensity.toFixed(1)} vs média de ${swarmAverages.incidentDensity.toFixed(1)}`);
      }

      results.push({
        unitId: target.schoolId,
        unitName: target.schoolName,
        localKPIs: target,
        swarmAverages,
        anomalies
      });
    }

    return results;
  }
}

export const swarmComparativeService = new SwarmComparativeService();

