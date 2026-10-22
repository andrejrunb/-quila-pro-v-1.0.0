import { Database } from '../../database/Database';
import { logger } from '../logger';

export interface LifecycleInsight {
  type: 'PROGRESS' | 'DEFICIT' | 'STABLE';
  subject: string;
  intensity: number; // 0-1
  description: string;
  recommendation?: string;
}

/**
 * [SQA-LC-4000] StudentLifecycleService
 * Motor de Inteligência para análise de longo prazo (Multi-year analysis).
 */
export class StudentLifecycleService {
  private static instance: StudentLifecycleService;
  private db: Database;

  private constructor() {
    this.db = Database.getInstance();
  }

  public static getInstance(): StudentLifecycleService {
    if (!StudentLifecycleService.instance) {
      StudentLifecycleService.instance = new StudentLifecycleService();
    }
    return StudentLifecycleService.instance;
  }

  /**
   * Obtém o estado da economia gamificada do aluno (XP, Nível, Aureus).
   */
  async getStudentEconomy(studentId: string): Promise<any> {
    const row = await this.db.get(`SELECT * FROM student_economy WHERE student_id = ?`, [studentId]);
    
    if (!row) {
      // Semeia se não existir (First-time access)
      await this.db.run(
        `INSERT INTO student_economy (student_id, balance, level, xp) VALUES (?, 1000, 1, 0)`,
        [studentId]
      );
      return {
        studentId,
        aureusBalance: 1000,
        level: 1,
        xp: 0,
        achievements: [],
        nextLevelXp: 1000
      };
    }

    return {
      studentId,
      aureusBalance: row.balance,
      level: row.level,
      xp: row.xp,
      achievements: ['ASSIDUIDADE_MAXIMA'], // Mock achievements por enquanto
      nextLevelXp: row.level * 1000
    };
  }

  /**
   * Analisa o progresso do aluno cruzando dados históricos.
   */
  async analyzeLongitudinalProgress(studentId: string): Promise<LifecycleInsight[]> {
    try {
      const history = await this.db.getStudentLifeCycleHistory(studentId);
      const insights: LifecycleInsight[] = [];

      // 1. Análise de Notas (Tendência)
      if (history.grades.length > 2) {
        const recent = history.grades.slice(0, 3).reduce((acc: number, g: any) => acc + g.value, 0) / 3;
        const older = history.grades.slice(-3).reduce((acc: number, g: any) => acc + g.value, 0) / 3;

        if (recent > older + 1) {
          insights.push({
            type: 'PROGRESS',
            subject: 'Desempenho Geral',
            intensity: 0.8,
            description: 'Melhora consistente nas avaliações recentes em comparação ao histórico inicial.',
            recommendation: 'Manter estratégias de reforço atuais e incentivar novos desafios.'
          });
        } else if (recent < older - 1) {
          insights.push({
            type: 'DEFICIT',
            subject: 'Desempenho Geral',
            intensity: 0.9,
            description: 'Queda detectada no desempenho acadêmico em relação aos anos anteriores.',
            recommendation: 'Agendar reunião pedagógica para identificar fatores externos ou lacunas de base.'
          });
        }
      }

      // 2. Análise de Engajamento (Behavioral Trends)
      const engagementTrend = history.behavioralTrends.slice(0, 10);
      if (engagementTrend.length > 5) {
        const lowEngagement = engagementTrend.filter((l: any) => l.engagement < 0.5).length;
        if (lowEngagement > 3) {
          insights.push({
            type: 'DEFICIT',
            subject: 'Engajamento Comportamental',
            intensity: 0.7,
            description: 'Padrão frequente de baixo engajamento nas últimas sessões registradas.',
            recommendation: 'Aplicar técnicas de gamificação ou monitoramento SRS mais próximo.'
          });
        }
      }

      // 3. Análise de Snapshots de Portfólio
      if (history.snapshots.length > 1) {
        const latest = history.snapshots[0];
        const previous = history.snapshots[1];
        
        // Exemplo: Comparação de metadados qualitativos do Córtex
        if (latest.aiSynthesis && previous.aiSynthesis && latest.aiSynthesis.length > previous.aiSynthesis.length) {
          insights.push({
            type: 'PROGRESS',
            subject: 'Complexidade do Portfólio',
            intensity: 0.6,
            description: 'Aumento na profundidade e volume das sínteses qualitativas anuais.',
          });
        }
      }

      return insights;
    } catch (err) {
      logger.error(`[LifecycleService] Erro ao analisar progresso do aluno ${studentId}: ${err}`);
      return [];
    }
  }

  async getLifecycleMetrics(): Promise<any> {
    try {
      const stats = await this.db.getLifecycleStats();
      
      // Cálculo dinâmico do índice de engajamento médio (behavioral_logs)
      const engagementRow = await this.db.get('SELECT AVG(engagement) as avgEngagement FROM behavioral_logs');
      const engagementIndex = engagementRow?.avgEngagement ? Math.round(engagementRow.avgEngagement * 100) : 75;

      return {
        totalStudents: stats.totalStudents,
        atRisk: stats.atRisk,
        recovered: stats.recovered,
        retentionRate: stats.retentionRate,
        interventionEfficiency: stats.interventionEfficiency,
        engagementIndex: engagementIndex
      };
    } catch (err) {
      logger.error(`[LifecycleService] Erro ao obter métricas globais: ${err}`);
      return { totalStudents: 0, atRisk: 0, recovered: 0, retentionRate: 0, interventionEfficiency: 0, engagementIndex: 0 };
    }
  }




  /**
   * Prediz o risco de evasão de um aluno específico.
   */
  async predictEvasionRisk(studentId: string): Promise<any> {
    try {
      const student = await this.db.getStudent(studentId);
      const history = await this.db.getStudentLifeCycleHistory(studentId);
      const attendance = await this.db.getAverageAttendance(studentId);
      
      const gradeTrend = history.grades.length > 0 ? history.grades[0].value : 7;
      
      let riskScore = 0;
      if (attendance < 75) riskScore += 0.4;
      if (gradeTrend < 6) riskScore += 0.3;
      if (student.observationLevel > 1) riskScore += 0.3;

      return {
        score: Math.min(riskScore, 1),
        factors: [
          attendance < 75 ? 'Frequência abaixo da média (crítico)' : null,
          gradeTrend < 6 ? 'Desempenho acadêmico em declínio' : null,
          student.observationLevel > 2 ? 'Alto nível de observação comportamental' : null
        ].filter(Boolean),
        recommendation: riskScore > 0.6 ? 'Intervenção imediata e reunião com responsáveis' : riskScore > 0.3 ? 'Monitoramento preventivo intensificado' : 'Estável'
      };
    } catch (err) {
      return { score: 0, factors: [], recommendation: 'Dados insuficientes' };
    }
  }

  /**
   * Calcula o ROI de intervenções pedagógicas (Impacto Financeiro).
   */
  async calculateInterventionROI(): Promise<any> {
    const stats = await this.db.getLifecycleStats();
    const avgTuition = await this.db.getAverageTuition();
    const monthsRemaining = 6; // Estimativa para o semestre atual
    const operationalCost = 15000; // Custo base de psicólogos/coordenação

    const grossValue = stats.recovered * avgTuition * monthsRemaining;
    const roi = operationalCost > 0 ? ((grossValue - operationalCost) / operationalCost) * 100 : 0;

    return {
      revenueSaved: grossValue,
      costOfInterventions: operationalCost,
      roi: Math.round(roi),
      recoveredCount: stats.recovered,
      impactLabel: 'Economia de Evasão (Retenção Direta)'
    };
  }

  /**
   * Retorna métricas detalhadas de um aluno para o perfil.
   */
  async getStudentLifecycleMetrics(studentId: string): Promise<any> {
    const insights = await this.analyzeLongitudinalProgress(studentId);
    const risk = await this.predictEvasionRisk(studentId);
    
    return {
      insights,
      risk,
      symbiosisLevel: Math.round((1 - risk.score) * 100),
      engagementScore: 0.85,
      performanceScore: 0.78
    };
  }

  /**
   * Retorna a lista de alunos com maior risco de evasão para o dashboard.
   */
  async getRiskyStudents(): Promise<any[]> {
    try {
      // Busca alunos com problemas (nível de observação ou inadimplência)
      const students = await this.db.all(`
        SELECT s.*, 
        (SELECT status FROM billing WHERE studentHash = s.id ORDER BY dueDate DESC LIMIT 1) as lastBillStatus
        FROM students s 
        WHERE s.observationLevel > 0 OR lastBillStatus = 'pending'
        ORDER BY s.observationLevel DESC 
        LIMIT 6
      `);
      
      const result = await Promise.all(students.map(async (s) => {
        const riskPrediction = await this.predictEvasionRisk(s.id);
        return {
          id: s.id,
          name: s.name,
          financialStatus: s.lastBillStatus === 'pending' ? 'Inadimplente' : 'Em dia',
          engagement: Math.max(10, 100 - (s.observationLevel * 20)),
          riskScore: riskPrediction.score,
          suggestedAction: riskPrediction.recommendation
        };
      }));

      return result;
    } catch (err) {
      logger.error(`[LifecycleService] Erro ao obter lista de alunos em risco: ${err}`);
      return [];
    }
  }

  /**
   * Retorna as tendências de intervenção para o gráfico do dashboard.
   */
  async getInterventionTrends(): Promise<any[]> {
    try {
      // Agregação temporal de riscos/intervenções baseada em ai_insights_review
      const trends = await this.db.all(`
        SELECT 
          strftime('%Y-%m', timestamp) as month,
          COUNT(*) as interventionCount
        FROM ai_insights_review 
        WHERE category = 'PEDAGOGICAL' 
        GROUP BY month 
        ORDER BY month ASC 
        LIMIT 12
      `);
      return trends || [];
    } catch (err) {
      logger.error(`[LifecycleService] Erro ao obter tendências: ${err}`);
      return [];
    }
  }

  /**
   * Gera um relatório de "Ciclo de Vida" para o dossiê de evidências.
   */
  async generateLifecycleSummary(studentId: string): Promise<string> {
    const insights = await this.analyzeLongitudinalProgress(studentId);
    if (insights.length === 0) return 'Dados insuficientes para análise de ciclo de vida.';

    let summary = '### Análise de Ciclo de Vida (Histórico Multi-Anual)\n\n';
    insights.forEach(insight => {
        const icon = insight.type === 'PROGRESS' ? '📈' : insight.type === 'DEFICIT' ? '⚠️' : '➡️';
        summary += `**${icon} ${insight.subject}:** ${insight.description}\n`;
        if (insight.recommendation) {
            summary += `> *Sugestão:* ${insight.recommendation}\n\n`;
        }
    });

    return summary;
  }

  /**
   * [Phase 1600] Descarta um risco pedagógico detectado pela IA com justificativa.
   * Centralizado no LifecycleService para garantir consistência e auditoria.
   */
  async dismissRisk(studentId: string, riskType: string = "GENERIC", reason: string = "Nenhuma justificativa fornecida") {
    logger.info(`[LifecycleService] Descartando risco (${riskType}) para aluno: ${studentId}. Motivo: ${reason}`);
    
    try {
      // 1. Resetar scores de comportamento (riskScore e observationLevel)
      await this.db.run(`
        UPDATE behavioral_logs 
        SET riskScore = 0, observationLevel = 0 
        WHERE studentId = ?
      `, [studentId]);

      // 2. Resetar nível de observação no cadastro do aluno
      await this.db.run(`
        UPDATE students 
        SET observationLevel = 0 
        WHERE id = ?
      `, [studentId]);

      // 3. Auditoria Zero-Bypass (Compulsória para compliance v1.5.0)
      await this.db.run(`
        INSERT INTO zero_bypass_audits (userId, action, details, timestamp)
        VALUES (?, ?, ?, CURRENT_TIMESTAMP)
      `, ['STAFF', 'RISK_DISMISSED', `Risco (${riskType}) descartado para aluno ${studentId}. Justificativa: ${reason}`]);

      return { success: true };
    } catch (err) {
      logger.error(`[LifecycleService] Erro ao descartar risco: ${err}`);
      throw err;
    }
  }
}
