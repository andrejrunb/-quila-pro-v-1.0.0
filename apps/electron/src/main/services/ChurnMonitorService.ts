import { Database } from "../../database/Database";
import { logger } from '../logger';
import { dropoutPredictor, StudentPresenceData } from "./DropoutPredictor";
import { NotificationManager } from "./NotificationManager";
import { sovereignMeshService } from "./SovereignMeshService";
import { sovereignGraphService } from "./SovereignGraphService";
import { academicRecordsService } from "./AcademicRecordsService";

/**
 * ChurnMonitorService (Cluster 9 - Predictive Intel)
 * -------------------------------------------------
 * Responsável por varrer a base de alunos e identificar riscos de evasão.
 * Integra com o DropoutPredictor para inteligência e Mesh para escala.
 */
export class ChurnMonitorService {
  private static instance: ChurnMonitorService;
  private db: Database;
  private isScanning: boolean = false;

  private constructor() {
    this.db = Database.getInstance();
  }

  public static getInstance(): ChurnMonitorService {
    if (!ChurnMonitorService.instance) {
      ChurnMonitorService.instance = new ChurnMonitorService();
    }
    return ChurnMonitorService.instance;
  }

  /**
   * Inicia uma varredura completa de risco para todos os alunos ativos.
   */
  public async runGlobalRiskScan() {
    if (this.isScanning) return;
    this.isScanning = true;
    
    logger.info('[ChurnMonitor] Iniciando Scan Global de Risco de Evasão...');

    // SQA-1000: Hidratação do Grafo para análise relacional
    await this.hydratePedagogicalGraph();

    try {
      const students = await this.db.all(`
        SELECT 
          s.id, 
          s.name, 
          s.classId,
          (SELECT COUNT(*) FROM attendance WHERE studentId = s.id) as totalDays,
          (SELECT COUNT(*) FROM attendance WHERE studentId = s.id AND status = 'absent') as absences,
          (SELECT MAX(date) FROM attendance WHERE studentId = s.id AND status = 'present') as lastPresenceDate,
          s.metadata
        FROM students s
        WHERE s.status = 'active'
      `);

      for (const student of students) {
        try {
          const metadata = JSON.parse(student.metadata || '{}');
          const consecutiveAbsences = await this.calculateConsecutiveAbsences(student.id);

          const presenceData: StudentPresenceData = {
            studentId: student.id,
            totalDays: student.totalDays || 0,
            absences: student.absences || 0,
            lateArrivals: 0,
            lastPresenceDate: student.lastPresenceDate || '',
            consecutiveAbsences,
            previousRiskScore: metadata.riskScore || 0
          };

          const analysis = await dropoutPredictor.analyzeRisk(presenceData);

          metadata.riskScore = analysis.riskScore;
          metadata.riskLevel = analysis.level;
          metadata.factors = analysis.factors;
          metadata.recommendation = analysis.recommendation;
          metadata.lastAnalysisDate = new Date().toISOString();

          await this.db.run(
            'UPDATE students SET metadata = ? WHERE id = ?',
            [JSON.stringify(metadata), student.id]
          );

          // SQA-1000: Persistir histórico de risco para auditoria longitudinal
          await this.db.run(
            'INSERT INTO student_risk_history (student_id, risk_score, factors, recommendation) VALUES (?, ?, ?, ?)',
            [student.id, analysis.riskScore, JSON.stringify(analysis.factors), analysis.recommendation]
          );

          if (analysis.level === 'critical' || analysis.level === 'high') {
            await this.dispatchRiskAlert(student.name, analysis);
          }
        } catch (innerErr: any) {
          logger.error(`[ChurnMonitor] Erro ao analisar aluno ${student.id}:`, innerErr.message);
        }
      }

      logger.info(`[ChurnMonitor] Scan concluído para ${students.length} alunos.`);
    } catch (err) {
      logger.error('[ChurnMonitor] Erro durante Scan Global:', err);
    } finally {
      this.isScanning = false;
    }
  }

  public async getGlobalRiskStats() {
    try {
      const students = await this.db.all('SELECT metadata FROM students WHERE status = "active"');
      let highRiskCount = 0;
      const totalCount = students.length;

      for (const student of students) {
        const metadata = JSON.parse(student.metadata || '{}');
        if (metadata.riskLevel === 'high' || metadata.riskLevel === 'critical') {
          highRiskCount++;
        }
      }

      const riskPercentage = totalCount > 0 ? (highRiskCount / totalCount) * 100 : 0;
      
      return {
        highRiskCount,
        totalCount,
        riskPercentage: parseFloat(riskPercentage.toFixed(1))
      };
    } catch (err) {
      logger.error('[ChurnMonitor] Erro ao obter stats globais:', err);
      return { highRiskCount: 0, totalCount: 0, riskPercentage: 0 };
    }
  }

  /**
   * [SQA-FIN-404] Evasion Radar: Cruza risco pedagógico com inadimplência.
   */
  public async getEvasionRadar() {
    try {
      const students = await this.db.all(`
        SELECT 
          s.id, 
          s.name, 
          s.metadata,
          (SELECT SUM(amount) FROM billing WHERE studentHash = s.id AND status = 'overdue') as totalOverdue,
          (SELECT COUNT(*) FROM billing WHERE studentHash = s.id AND status = 'overdue') as overdueCount
        FROM students s
        WHERE s.status = 'active'
      `);

      const radarPoints = students
        .map(s => {
          const metadata = JSON.parse(s.metadata || '{}');
          return {
            studentId: s.id,
            name: s.name,
            riskScore: metadata.riskScore || 0,
            riskLevel: metadata.riskLevel || 'low',
            totalOverdue: s.totalOverdue || 0,
            overdueCount: s.overdueCount || 0,
            hasDebt: s.overdueCount > 0
          };
        })
        .filter(s => s.riskLevel === 'high' || s.riskLevel === 'critical' || s.hasDebt)
        .sort((a, b) => {
          // Prioridade: Risco Crítico + Dívida > Risco Crítico > Dívida Alta
          const aPriority = (a.riskLevel === 'critical' ? 2 : (a.riskLevel === 'high' ? 1 : 0)) + (a.hasDebt ? 1 : 0);
          const bPriority = (b.riskLevel === 'critical' ? 2 : (b.riskLevel === 'high' ? 1 : 0)) + (b.hasDebt ? 1 : 0);
          return bPriority - aPriority || b.riskScore - a.riskScore;
        })
        .slice(0, 10);

      return radarPoints;
    } catch (err) {
      logger.error('[ChurnMonitor] Erro ao obter Evasion Radar:', err);
      return [];
    }
  }

  /**
   * Dispara alertas para a coordenação e sincroniza com a malha.
   */
  private async dispatchRiskAlert(studentName: string, analysis: any) {
    // 1. Notificação Local para a Coordenação
    const notificationManager = NotificationManager.getInstance(this.db);
    await notificationManager.create({
      type: 'EVASION_RISK',
      title: `Risco de Evasão: ${studentName}`,
      message: `Nível: ${analysis.level.toUpperCase()}. Motivos: ${analysis.factors.join(', ')}. Recomendação: ${analysis.recommendation}`,
      priority: analysis.level === 'critical' ? 'HIGH' : 'MEDIUM'
    });

    // 2. Broadcast via SovereignMesh (Cluster 9 Scale)
    await sovereignMeshService.broadcast({
      id: `churn_${analysis.studentId}_${Date.now()}`,
      sourceNode: sovereignMeshService.getNodeId(),
      targetNode: 'ALL',
      timestamp: Date.now(),
      payloadType: 'churn_alert',
      payload: {
        studentId: analysis.studentId,
        riskScore: analysis.riskScore,
        level: analysis.level,
        factors: analysis.factors
      },
      securityLevel: 'high_sovereignty'
    } as any);
  }

  private async calculateConsecutiveAbsences(studentId: string): Promise<number> {
    const recentAttendance = await this.db.all(`
      SELECT status FROM attendance 
      WHERE studentId = ? 
      ORDER BY date DESC LIMIT 10
    `, [studentId]);

    let count = 0;
    for (const record of recentAttendance) {
      if (record.status === 'absent') count++;
      else break;
    }
    return count;
  }

  /**
   * SQA-1000: Sincroniza a estrutura acadêmica com o Grafo Soberano (SKG).
   */
  private async hydratePedagogicalGraph() {
    try {
      const students = await academicRecordsService.getAllStudents();
      const classes = await this.db.all('SELECT id, name FROM classes');

      // 1. Registrar Turmas
      for (const cls of classes) {
        sovereignGraphService.addEntity({
          id: `class_${cls.id}`,
          type: 'CLASS',
          label: `Turma: ${cls.name}`,
          metadata: { databaseId: cls.id }
        });
      }

      // 2. Registrar Alunos e Associações
      for (const student of students) {
        sovereignGraphService.addEntity({
          id: student.id,
          type: 'PERSON',
          label: student.name,
          metadata: { classId: student.classId, enrollmentId: student.enrollmentId }
        });

        if (student.classId) {
          sovereignGraphService.associate(student.id, `class_${student.classId}`, 'MEMBER_OF');
          
          // Otimização: Conecta o aluno aos vizinhos de turma já processados
          const classmates = sovereignGraphService.getNeighbors(`class_${student.classId}`, 'MEMBER_OF');
          for (const classmate of classmates) {
            if (classmate.id !== student.id) {
              sovereignGraphService.associate(student.id, classmate.id, 'CLASSMATE');
              sovereignGraphService.associate(classmate.id, student.id, 'CLASSMATE');
            }
          }
        }
      }

      // 3. [v1.5.0] Registrar Relacionamentos Sociais/Pedagógicos
      const relationships = await this.db.all('SELECT * FROM student_relationships');
      for (const rel of relationships) {
        if (sovereignGraphService.hasNode(rel.student_id) && sovereignGraphService.hasNode(rel.related_student_id)) {
          sovereignGraphService.associate(rel.student_id, rel.related_student_id, rel.relationship_type);
        }
      }
      
      logger.info(`[ChurnMonitor] Grafo Pedagógico hidratado: ${students.length} alunos e ${relationships.length} relações.`);
    } catch (err) {
      logger.error('[ChurnMonitor] Erro ao hidratar Grafo Pedagógico:', err);
    }
  }
}

export const churnMonitorService = ChurnMonitorService.getInstance();
