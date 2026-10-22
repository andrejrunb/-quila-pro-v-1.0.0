import { EventEmitter } from 'events';
import Database from '../../database/Database';

/**
 * Phase 401 — EvasionRiskService (Eagle Brain)
 * Algoritmo preditivo avançado de risco de evasão escolar.
 * Integra dados multidimensionais: Frequência, Loitering, Behavioral Score e Tendências.
 */
export interface EvasionProfile {
  studentId: string;
  name: string;
  riskProbability: number; // 0-100
  factors: string[];
  trend: 'rising' | 'declining' | 'stable';
  absences: number;
  engagement: number; // 0.0 - 1.0 (Calculado via Behavioral Index)
}

class EvasionRiskService extends EventEmitter {
  private profiles: EvasionProfile[] = [];
  private db: Database | null = null;

  constructor() {
    super();
  }

  public init(db: Database) {
    this.db = db;
    this.startPredictiveAnalysis();
  }

  private startPredictiveAnalysis() {
    // Auditamos a cada 1 hora em produção para economizar CPU, 1 min para dev/maratona
    setInterval(() => {
      this.performRiskAudit();
    }, 60000); 
    
    // Execução inicial imediata
    setTimeout(() => this.performRiskAudit(), 5000);
  }

  private async performRiskAudit() {
    if (!this.db) return;

    try {
      const students = await this.db.getStudents();
      const newProfiles: EvasionProfile[] = [];

      for (const student of students) {
        // 1. Obter Risco de Reprovação (Faltas)
        const riskData = await this.db.calculateReprobationRisk(student.id);
        
        // 2. Obter Comportamento Suspeito (Loitering/Anomalias)
        const behaviorStats = await this.db.all(
          "SELECT COUNT(*) as count FROM events WHERE studentId = ? AND eventType IN ('loitering', 'running', 'unauthorized_zone')",
          [student.id]
        );
        const loiteringCount = behaviorStats[0]?.count || 0;

        // 3. Obter Risco Financeiro (Inadimplência - Zero Debt Integrated)
        const overdueCount = await this.db.getStudentOverdueCount(student.id);

        // 4. Cálculo de Ponderação "Brain of Áquila" (Frequência 50%, Comportamento 30%, Financeiro 20%)
        let weightedRisk = (riskData.riskLevel * 0.5) + 
                           (Math.min(loiteringCount * 5, 40) * 0.3) +
                           (Math.min(overdueCount * 15, 60) * 0.2);
        
        const factors: string[] = [];
        if (riskData.riskLevel > 50) factors.push('Frequência crítica detectada');
        if (loiteringCount > 10) factors.push('Anomalias comportamentais persistentes');
        if (overdueCount > 0) factors.push(`Inadimplência detectada (${overdueCount} faturas)`);

        // 4. Determinação de Tendência (compara com histórico - Mockado p/ simplicidade mas funcional)
        const trend = weightedRisk > 70 ? 'rising' : 'stable';

        newProfiles.push({
          studentId: student.id,
          name: student.name,
          riskProbability: Math.round(weightedRisk),
          factors,
          trend,
          absences: riskData.absences,
          engagement: Math.max(0, 100 - weightedRisk) / 100
        });

        // 5. Persistir no Banco de Dados (Phase 250 Integrated)
        await this.db.updateEvasionProfile({
          studentId: student.id,
          riskProbability: Math.round(weightedRisk),
          factors,
          trend
        });

        // 6. Notificação de Alerta Máximo
        if (weightedRisk > 85) {
          this.notifyCoordination(student.name, student.id);
        }
      }

      this.profiles = newProfiles;
      this.emit('risk-audit-completed', this.profiles);
      
    } catch (err) {
      console.error('[EvasionRiskService] Erro na auditoria preditiva:', err);
    }
  }

  private notifyCoordination(name: string, studentId: string) {
    console.log(`[ÁQUILA BRAIN] High Evasion Risk Alert: ${name} (ID: ${studentId}) sent to COORDINATION.`);
    this.emit('risk-alert', {
      type: 'EVASION_CRITICAL',
      studentId,
      name,
      timestamp: new Date().toISOString()
    });
  }

  public getHighRiskProfiles(): EvasionProfile[] {
    return this.profiles.filter(p => p.riskProbability > 50);
  }

  public getAllProfiles(): EvasionProfile[] {
    return this.profiles;
  }
}

export const evasionRiskService = new EvasionRiskService();
export default evasionRiskService;

