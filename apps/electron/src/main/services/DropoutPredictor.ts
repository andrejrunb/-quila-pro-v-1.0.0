/**
 * DropoutPredictor.ts
 * Sistema Áquila Pro - V3 Enterprise
 * 
 * Motor de análise preditiva para evasão escolar.
 * Analisa padrões de presença, atrasos e comportamento para gerar um Score de Risco.
 */
import { sovereignGraphService } from './SovereignGraphService';
import { logger } from '../logger';

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
  
  // Nível 12: Pesos Dinâmicos Sincronizados com a Federação
  private weights = {
    attendance: 0.45,
    grades: 0.25,
    behavioral: 0.20,
    relational: 0.10
  };

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
  public async analyzeRisk(data: StudentPresenceData): Promise<RiskAnalysis> {
    const absenceRate = data.totalDays > 0 ? (data.absences / data.totalDays) * 100 : 0;
    const lateRate = data.totalDays > 0 ? (data.lateArrivals / data.totalDays) * 100 : 0;
    const factors: string[] = [];
    
    // 1. Pesos Dinâmicos (Nível 12 - Swarm Synchronized)
    let score = (absenceRate * this.weights.attendance) + (lateRate * (this.weights.attendance * 0.5));
    
    // Adição de fatores de Notas e Comportamento (Simulados se não providos)
    const gradeRisk = 30; // Mock: Seria extraído de data.grades
    const behavioralRisk = 10; // Mock: Seria extraído de data.behavioral
    
    score += (gradeRisk * this.weights.grades);
    score += (behavioralRisk * this.weights.behavioral);

    if (absenceRate > 20) factors.push('Falta excessiva');
    if (lateRate > 15) factors.push('Atrasos recorrentes');
    if (gradeRisk > 50) factors.push('Baixo desempenho acadêmico');

    // 1.1 Risco Relacional (Nível 11 - SKG Integration)
    // Se o aluno tem conexões fortes com outros alunos em risco crítico
    const relationalRisk = this.calculateRelationalRisk(data.studentId);
    if (relationalRisk > 0) {
      score += (relationalRisk * this.weights.relational);
      factors.push('Risco de influência social (Cluster Crítico)');
    }

    // 2. Fator de Persistência (Consecutive Absences)
    if (data.consecutiveAbsences >= 3) {
      score += (data.consecutiveAbsences * 5);
      factors.push(`${data.consecutiveAbsences} faltas consecutivas`);
    }

    // 3. Fator Temporal (Days since last presence)
    if (data.lastPresenceDate) {
      const daysSinceLastPresence = this.getDaysDifference(data.lastPresenceDate);
      if (daysSinceLastPresence > 7) {
        const temporalPenalty = Math.min((daysSinceLastPresence - 7) * 2, 30);
        score += temporalPenalty;
        factors.push('Ausência prolongada');
      }
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

    const analysis = {
      studentId: data.studentId,
      riskScore: Math.round(score),
      level,
      trend: this.calculateTrend(score, data.previousRiskScore),
      recommendation,
      factors
    };

    // Nível 11: Salvar Insight no Grafo Soberano
    await this.persistInsightToGraph(analysis);

    return analysis;
  }

  private calculateRelationalRisk(studentId: string): number {
    // Nível 11 Enterprise: Análise de Cluster Relacional
    // Se o aluno está em uma turma ou grupo com alta densidade de risco, o score sobe.
    try {
      const neighbors = sovereignGraphService.getNeighbors(studentId);
      if (!neighbors || neighbors.length === 0) return 0;

      const criticalNeighbors = neighbors.filter(n => {
        // Busca insights de risco associados aos vizinhos
        const neighborInsights = sovereignGraphService.getNeighbors(n.id, 'HAS_INSIGHT');
        return neighborInsights.some(insight => 
          insight.type === 'INSIGHT' && 
          (insight.metadata?.level === 'critical' || insight.metadata?.level === 'high')
        );
      });

      const riskRatio = criticalNeighbors.length / neighbors.length;
      
      // Se mais de 20% do círculo social imediato está em risco, aplica penalidade proporcional
      if (riskRatio > 0.2) {
        return Math.min(riskRatio * 50, 25); // Cap em 25 pontos de risco relacional
      }
      
      return 0;
    } catch (err) {
      logger.error(`[DropoutPredictor] Erro no cálculo relacional para ${studentId}:`, err);
      return 0;
    }
  }

  private async persistInsightToGraph(analysis: RiskAnalysis) {
    if (analysis.riskScore < 40) return; // Só persiste riscos relevantes para evitar poluição

    const insightId = `insight_dropout_${analysis.studentId}_${Date.now()}`;
    
    await sovereignGraphService.addEntity({
      id: insightId,
      type: 'INSIGHT',
      label: `Risco ${analysis.level.toUpperCase()}: Aluno ${analysis.studentId}`,
      metadata: {
        ...analysis,
        timestamp: new Date().toISOString()
      }
    });

    // SQA-1000: Associa o Insight ao Aluno no Grafo
    await sovereignGraphService.associate(analysis.studentId, insightId, 'HAS_INSIGHT');
  }

  /**
   * Permite que a Consciência Sistêmica ajuste os pesos do modelo (Auto-Sintese / Nível 12)
   */
  public updateWeights(newWeights?: Partial<typeof DropoutPredictor.prototype.weights>) {
    if (newWeights) {
      this.weights = { ...this.weights, ...newWeights };
    }
    logger.info(`[DropoutPredictor] Pesos evoluídos via Federação: ${JSON.stringify(this.weights)}`);
  }

  public getWeights() {
    return { ...this.weights };
  }

  /**
   * Analisa um grupo de estudantes (Coorte) para identificar tendências coletivas.
   */
  public async analyzeCohort(students: StudentPresenceData[]): Promise<{ 
    averageRisk: number, 
    criticalStudents: string[], 
    commonFactors: string[] 
  }> {
    const results = await Promise.all(students.map(s => this.analyzeRisk(s)));
    const totalScore = results.reduce((acc, curr) => acc + curr.riskScore, 0);
    const critical = results.filter(r => r.level === 'critical' || r.level === 'high').map(r => r.studentId);
    
    // Extrai fatores comuns
    const factorMap = new Map<string, number>();
    results.flatMap(r => r.factors).forEach(f => {
      factorMap.set(f, (factorMap.get(f) || 0) + 1);
    });

    const commonFactors = Array.from(factorMap.entries())
      .filter(([_, count]) => count > students.length / 3) // Fator presente em mais de 1/3 do grupo
      .map(([factor]) => factor);

    return {
      averageRisk: Math.round(totalScore / students.length) || 0,
      criticalStudents: critical,
      commonFactors
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

  /**
   * Ponte para análise individual via ID (Phase 9 Enterprise)
   */
  public async analyzeStudent(studentId: string): Promise<RiskAnalysis> {
    const { db } = await import('../../database/Database');
    
    // 1. Coleta básica de assiduidade
    const stats = await db.get(`
      SELECT 
        studentId, 
        COUNT(*) as totalDays,
        SUM(CASE WHEN status = 'absent' THEN 1 ELSE 0 END) as absences,
        SUM(CASE WHEN status = 'late' THEN 1 ELSE 0 END) as lateArrivals,
        MAX(date) as lastPresenceDate
      FROM attendance 
      WHERE studentId = ?
    `, [studentId]);

    if (!stats || stats.totalDays === 0) {
      return {
        studentId,
        riskScore: 0,
        level: 'low',
        trend: 'stable',
        factors: [],
        recommendation: 'Dados insuficientes para análise.'
      };
    }

    // 2. Cálculo de Faltas Consecutivas (V3.5 Real Logic)
    const recentLogs = await db.all(
      'SELECT status FROM attendance WHERE studentId = ? ORDER BY date DESC LIMIT 10',
      [studentId]
    );
    let consecutiveAbsences = 0;
    for (const log of recentLogs) {
      if (log.status === 'absent') consecutiveAbsences++;
      else break;
    }

    // 3. Busca de Histórico de Risco
    const lastRisk = await db.get(
      'SELECT risk_score FROM student_risk_history WHERE student_id = ? ORDER BY analyzed_at DESC LIMIT 1',
      [studentId]
    );

    const data: StudentPresenceData = {
      studentId,
      totalDays: stats.totalDays,
      absences: stats.absences,
      lateArrivals: stats.lateArrivals,
      lastPresenceDate: stats.lastPresenceDate,
      consecutiveAbsences,
      previousRiskScore: lastRisk?.risk_score || 0
    };

    const analysis = await this.analyzeRisk(data);

    // 4. Persistência de Histórico de Risco
    await db.run(
      'INSERT INTO student_risk_history (student_id, risk_score, factors, recommendation) VALUES (?, ?, ?, ?)',
      [studentId, analysis.riskScore, JSON.stringify(analysis.factors), analysis.recommendation]
    );

    return analysis;
  }
}

export const dropoutPredictor = DropoutPredictor.getInstance();

