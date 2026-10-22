import { EventEmitter } from 'events';

export interface SchoolUnit {
  id: string;
  name: string;
  status: 'secure' | 'warning' | 'alert';
  studentCount: number;
  safetyScore: number;
  activeIncidents: number;
  lastUpdate: number;
}

/**
 * UnitService (v1612-18)
 * Gerenciador central de unidades/campi da rede Áquila.
 * Sincroniza telemetria de segurança e ocupação via Eagle Cloud.
 */
class UnitService extends EventEmitter {
  private units: SchoolUnit[] = [];

  constructor() {
    super();
    this.initializeMockUnits();
    this.startTelemetrySimulation();
  }

  private initializeMockUnits() {
    this.units = [
      { id: 'S01', name: 'Escola Central Matriz', status: 'secure', studentCount: 1250, safetyScore: 98, activeIncidents: 0, lastUpdate: Date.now() },
      { id: 'S02', name: 'Unidade Jardim Botânico', status: 'warning', studentCount: 450, safetyScore: 82, activeIncidents: 1, lastUpdate: Date.now() },
      { id: 'S03', name: 'Colégio Áquila Sul', status: 'secure', studentCount: 890, safetyScore: 94, activeIncidents: 0, lastUpdate: Date.now() },
      { id: 'S04', name: 'Anexo Infantil Norte', status: 'alert', studentCount: 210, safetyScore: 65, activeIncidents: 3, lastUpdate: Date.now() },
    ];
  }

  private startTelemetrySimulation() {
    setInterval(() => {
      this.units = this.units.map(unit => {
        // Simular pequenas variações no Safety Score
        const drift = (Math.random() - 0.5) * 2;
        const newScore = Math.max(0, Math.min(100, unit.safetyScore + drift));
        
        let newStatus = unit.status;
        if (newScore < 70) newStatus = 'alert';
        else if (newScore < 85) newStatus = 'warning';
        else newStatus = 'secure';

        return {
          ...unit,
          safetyScore: Number(newScore.toFixed(1)),
          status: newStatus as any,
          lastUpdate: Date.now()
        };
      });
      this.emit('units-update', this.units);
    }, 5000);
  }

  getUnits(): SchoolUnit[] {
    return [...this.units];
  }

  getUnitById(id: string): SchoolUnit | undefined {
    return this.units.find(u => u.id === id);
  }

  getGlobalAverage(): number {
    if (this.units.length === 0) return 0;
    const total = this.units.reduce((acc, u) => acc + u.safetyScore, 0);
    return Number((total / this.units.length).toFixed(1));
  }

  /**
   * [SQA-UNIT-101] Listagem de todas as unidades para o dashboard.
   */
  public async listUnits(): Promise<SchoolUnit[]> {
    return this.getUnits();
  }

  /**
   * [SQA-UNIT-102] Detalhes de uma unidade específica.
   */
  public async getUnitDetails(id: string): Promise<SchoolUnit | undefined> {
    return this.getUnitById(id);
  }
}

export const unitService = new UnitService();

