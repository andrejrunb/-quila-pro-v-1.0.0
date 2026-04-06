/**
 * DropoutPredictor.ts
 * Sistema Áquila Pro - V3 Enterprise
 * 
 * Motor de análise preditiva para evasão escolar.
 * Analisa padrões de presença, atrasos e comportamento para gerar um Score de Risco.
 */

export interface StudentPresenceData {
  studentId: string;
  totalDays: number;
  absences: number;
  lateArrivals: number;
  lastPresenceDate: string;
  consecutiveAbsences: number; // New V3.5 Field
  previousRiskScore?: number;  // Persistence factor
}

export interface RiskAnalysis {
  studentId: string;
  riskScore: number; // 0 to 100
  level: 'low' | 'medium' | 'high' | 'critical';
  trend: 'improving' | 'stable' | 'declining';
  recommendation: string;
  factors: string[]; // V3.5: Transparent factors
}

export class DropoutPredictor {
  private static instance: DropoutPredictor;

  private constructor() {}

  public static getInstance(): DropoutPredictor {
    if (!DropoutPredictor.instance) {
      DropoutPredictor.instance = new DropoutPredictor();
    }
    return DropoutPredictor.instance;
  }

  /**
   * Calcula o risco de evasão baseado em dados históricos (Algoritmo V3.5 Enterprise)
   */
  public analyzeRisk(data: StudentPresenceData): RiskAnalysis {
    const absenceRate = (data.absences / data.totalDays) * 100;
    const lateRate = (data.lateArrivals / data.totalDays) * 100;
    const factors: string[] = [];
    
    // 1. Pesos Base (Absence 60%, Late 40%)
    let score = (absenceRate * 0.6) + (lateRate * 0.4);
    if (absenceRate > 20) factors.push('Falta excessiva');
    if (lateRate > 15) factors.push('Atrasos recorrentes');

    // 2. Fator de Persistência (Consecutive Absences)
    if (data.consecutiveAbsences >= 3) {
      score += (data.consecutiveAbsences * 5);
      factors.push(`${data.consecutiveAbsences} faltas consecutivas`);
    }

    // 3. Fator Temporal (Days since last presence)
    const daysSinceLastPresence = this.getDaysDifference(data.lastPresenceDate);
    if (daysSinceLastPresence > 7) {
      const temporalPenalty = Math.min((daysSinceLastPresence - 7) * 2, 30);
      score += temporalPenalty;
      factors.push('Ausência prolongada');
    }

    // 4. Sazonalidade (Simulada: Períodos críticos)
    const currentMonth = new Date().getMonth();
    if ([5, 6, 11, 12].includes(currentMonth)) { // Meses de prova/fim de semestre
      score *= 1.15;
      factors.push('Período acadêmico crítico');
    }

    // 5. Inércia de Risco (Persistence)
    if (data.previousRiskScore && data.previousRiskScore > 50) {
      score = (score * 0.7) + (data.previousRiskScore * 0.3);
      factors.push('Histórico de risco persistente');
    }

    // Normalizar score final (0-100)
    score = Math.min(Math.max(score, 0), 100);

    let level: RiskAnalysis['level'] = 'low';
    let recommendation = 'Manter monitoramento padrão.';

    if (score > 80) {
      level = 'critical';
      recommendation = 'Ação Imediata: Intervenção direta da direção e busca ativa.';
    } else if (score > 60) {
      level = 'high';
      recommendation = 'Alerta: Acionar protocolo de comunicação emergencial com pais.';
    } else if (score > 35) {
      level = 'medium';
      recommendation = 'Acompanhamento: Observar engajamento em atividades extracurriculares.';
    }

    return {
      studentId: data.studentId,
      riskScore: Math.round(score),
      level,
      trend: this.calculateTrend(score, data.previousRiskScore),
      recommendation,
      factors
    };
  }

  private calculateTrend(current: number, previous?: number): RiskAnalysis['trend'] {
    if (!previous) return 'stable';
    const diff = current - previous;
    if (diff > 5) return 'declining';
    if (diff < -5) return 'improving';
    return 'stable';
  }

  private getDaysDifference(dateString: string): number {
    const lastDate = new Date(dateString);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - lastDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
}

export const dropoutPredictor = DropoutPredictor.getInstance();
