/**
 * AIOraculum.ts
 * Sistema Áquila Pro - V3 Enterprise
 * 
 * Motor de síntese de dados para pais e responsáveis.
 * Gera narrativas semanais baseadas em presença, desempenho e comportamento.
 */

import { dropoutPredictor, StudentPresenceData } from './DropoutPredictor';

export interface WeeklySummary {
  studentId: string;
  studentName: string;
  attendanceRate: number;
  lateCount: number;
  consecutiveAbsences: number; // For V3.5
  behaviorNote?: string;
  riskTrend: 'improving' | 'stable' | 'declining';
  previousRiskScore?: number;
}

export interface OraculumReport {
  status: 'positive' | 'neutral' | 'attention';
  narrative: string;
  score: number;
  recommendation: string;
  generatedAt: string;
  insightFactors: string[]; // V3.5: Transparency
}

export class AIOraculum {
  private static instance: AIOraculum;

  private constructor() {}

  public static getInstance(): AIOraculum {
    if (!AIOraculum.instance) {
      AIOraculum.instance = new AIOraculum();
    }
    return AIOraculum.instance;
  }

  /**
   * Gera um resumo narrativo comportamental (Oraculum V3.5 Engine)
   */
  public generateWeeklyNarrative(studentWeight: WeeklySummary): OraculumReport {
    const analysis = dropoutPredictor.analyzeRisk({
      studentId: studentWeight.studentId,
      totalDays: 5,
      absences: 5 * (1 - studentWeight.attendanceRate / 100),
      lateArrivals: studentWeight.lateCount,
      lastPresenceDate: new Date().toISOString(),
      consecutiveAbsences: studentWeight.consecutiveAbsences,
      previousRiskScore: studentWeight.previousRiskScore
    });

    let status: OraculumReport['status'] = 'neutral';
    let narrative = '';
    let recommendation = '';

    // V3.5: Inteligência Adaptativa
    if (analysis.riskScore < 15) {
      status = 'positive';
      narrative = `Excelentes notícias! O(A) ${studentWeight.studentName} encerrou a semana com 100% de engajamento biometrizado. A constância e pontualidade são os pilares de seu sucesso.`;
      recommendation = 'Incentive a manutenção deste excelente ritmo na próxima semana.';
    } else if (analysis.level === 'critical' || analysis.riskScore > 75) {
      status = 'attention';
      narrative = `Atenção Prioritária: Detectamos um padrão crítico de ausência para ${studentWeight.studentName}. ${analysis.factors.includes('Faltas consecutivas') ? 'As faltas em sequência preocupam a equipe pedagógica.' : 'A instabilidade na frequência requer ação imediata.'}`;
      recommendation = 'A coordenação solicita uma chamada de vídeo para alinhamento urgente.';
    } else if (studentWeight.lateCount > 2) {
      status = 'neutral';
      narrative = `O(A) ${studentWeight.studentName} é assíduo, mas notamos atrasos recorrentes no primeiro tempo. Isso pode gerar defasagem no início das aulas.`;
      recommendation = 'Ajustar o horário de saída de casa em 10 minutos pode resolver o padrão.';
    } else {
      status = 'neutral';
      narrative = `Semana estável para ${studentWeight.studentName}. O engajamento se mantém dentro da média esperada da turma.`;
      recommendation = 'Continue acompanhando o boletim pelo Portal dos Pais.';
    }

    // Adicionar fator comportamental se existir
    if (studentWeight.behaviorNote) {
      narrative += ` Observação pedagógica: "${studentWeight.behaviorNote}"`;
    }

    return {
      status,
      narrative,
      score: 100 - analysis.riskScore,
      recommendation,
      generatedAt: new Date().toLocaleDateString('pt-BR'),
      insightFactors: analysis.factors
    };
  }
}

export const aiOraculum = AIOraculum.getInstance();
