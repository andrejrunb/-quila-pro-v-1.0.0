import { EventEmitter } from 'events';

export interface UnitSummary {
  id: string;
  name: string;
  onlineStudents: number;
  activeAlerts: number;
  serverStatus: 'healthy' | 'warning' | 'critical';
}

/**
 * Phase 510: GlobalAnalyticsService
 * Agrega dados de múltiplas unidades para a visão de QG Central.
 */
class GlobalAnalyticsService extends EventEmitter {
  private units: UnitSummary[] = [
    { id: 'u1', name: 'Unidade Centro', onlineStudents: 1240, activeAlerts: 0, serverStatus: 'healthy' },
    { id: 'u2', name: 'Unidade Norte', onlineStudents: 850, activeAlerts: 1, serverStatus: 'warning' },
    { id: 'u3', name: 'Unidade Sul (Expansão)', onlineStudents: 0, activeAlerts: 0, serverStatus: 'healthy' }
  ];

  public getGlobalSummary() {
    return {
      totalStudents: this.units.reduce((acc, u) => acc + u.onlineStudents, 0),
      totalAlerts: this.units.reduce((acc, u) => acc + u.activeAlerts, 0),
      unitsOnline: this.units.filter(u => u.serverStatus !== 'critical').length,
      units: this.units
    };
  }

  public refreshData() {
    // Simular flutuação de dados
    this.units.forEach(u => {
      if (u.id === 'u2') u.activeAlerts = Math.random() > 0.5 ? 1 : 0;
      u.onlineStudents += Math.floor(Math.random() * 10 - 5);
    });
    this.emit('data-refreshed', this.getGlobalSummary());
  }
}

export const globalAnalyticsService = new GlobalAnalyticsService();
