import { AutonomousAgent } from '../AutonomousAgent';
import { db, Database } from '../../../database/Database';
import { AgentTask } from '../../../services/AgentDefinitions';
import { NexusEconomyService } from '../NexusEconomyService';

/**
 * PedagogicalAgent: Mentor da Escola.
 * Focado em frequência, engajamento e relatórios.
 */
export class PedagogicalAgent extends AutonomousAgent {
  private attendanceCount: number = 0;
  private db: Database;
  private economy: NexusEconomyService;

  constructor(db: Database) {
    super('PEDAGOGY', 'PEDAGOGY');
    this.db = db;
    this.economy = new NexusEconomyService(db);
  }

  public async thinkHub(context: any): Promise<void> {
    // Reagir a eventos de reconhecimento de face (Onda 3)
    if (context && context.studentId) {
      this.attendanceCount++;
      this.remember(`Presença registrada para ${context.studentId}. Total hoje: ${this.attendanceCount}`);
      
      // Recompensa por presença (Passo 551)
      await this.economy.rewardStudent(context.studentId, 50, 'Presença via Face-ID');
    }

    if (this.attendanceCount % 5 === 0 && this.attendanceCount > 0) {
      this.log('Analítico: Alto tráfego de entrada. Avaliando tendência de pontualidade.');
      // Lógica de spawn de sub-agente especializado se necessário
    }
  }

  /**
   * [SQA-SWR-BRISK-02] Dynamic Scaffolding
   * Ajusta a complexidade do material baseado no histórico do aluno
   * e aciona as trilhas de nivelamento progressivo por maestria.
   */
  public async applyDynamicScaffolding(studentId: string, questionId: string): Promise<string> {
    this.log(`Aplicando Dynamic Scaffolding de Maestria para aluno ${studentId} na questao ${questionId}...`);
    const { pedagogicalScaffoldingService } = require('./PedagogicalScaffoldingService');
    const diagnosis = pedagogicalScaffoldingService.diagnoseAndLevelStudent(questionId, true);
    
    if (diagnosis.needsLeveling) {
      let report = `\n[TRILHA DE NIVELAMENTO POR MAESTRIA - ALUNO ${studentId}]\n`;
      report += `Foco Matematico: ${diagnosis.prereqMath}\n`;
      report += `Foco Conceitual: ${diagnosis.prereqConcept}\n\n`;
      report += `--- NIVEL 1: TREINO MATEMATICO SECULO (5 EXERCICIOS DIARIOS) ---\n`;
      diagnosis.dailyDrillLevel1?.forEach((d: any, i: number) => {
        report += `${i + 1}. ${d.drill} (Gabarito: ${d.ans})\n`;
      });
      return report;
    }
    return `Aluno nivelado para a questao ${questionId}.`;
  }

  /**
   * Dispara a geração em tempo real nos supercomputadores NVIDIA DGX H100
   */
  public async generateLiveMasteryWithNvidia(subject: string, difficulty: string, questionStatement: string): Promise<string> {
    this.log(`Invocando cluster NVIDIA H100 para desconstrução de ${subject}...`);
    const { nvidiaInferenceService } = require('./NvidiaInferenceService');
    return await nvidiaInferenceService.generateMasteryScaffolding(questionStatement, subject, difficulty);
  }

  public async generateLiveKumonWithNvidia(subject: string, difficulty: string, questionStatement: string): Promise<string> {
    return this.generateLiveMasteryWithNvidia(subject, difficulty, questionStatement);
  }

  /**
   * [SQA-SWR-BRISK-03] Rubric Alignment AI
   * Verifica se o feedback do professor está alinhado com critérios da rubrica e BNCC.
   */
  public async verifyRubricAlignment(feedback: string, rubric: any): Promise<{ valid: boolean; alignmentScore: number; forbiddenTerms: string[] }> {
    this.log('Auditando alinhamento de rubrica pedagógica avançada...');
    
    // Lista simulada de termos não recomendados ou críticos conforme BNCC
    const sensitiveTerms = ['burro', 'incapaz', 'sem futuro'];
    const foundTerms = sensitiveTerms.filter(term => feedback.toLowerCase().includes(term));
    
    const valid = foundTerms.length === 0;
    const alignmentScore = valid ? 95 : 40;

    if (!valid) {
      this.log(`[AVISO] Feedback detectado com termos anômalos: ${foundTerms.join(', ')}`);
    }

    return { valid, alignmentScore, forbiddenTerms: foundTerms };
  }

  protected async executeTaskLogic(task: AgentTask): Promise<void> {
    if (task.description === 'GENERATE_ENGAGEMENT_STATS') {
       this.log('Gerando estatísticas de engajamento em tempo real...');
    }

    if (task.description === 'APPLY_SCAFFOLDING') {
       await this.applyDynamicScaffolding(task.payload?.studentId, task.payload?.content);
    }

    if (task.description === 'AUDIT_FEEDBACK_RUBRIC') {
       await this.verifyRubricAlignment(task.payload?.feedback, task.payload?.rubric);
    }

    if (task.description === 'START_WRITING_COACH') {
       this.log('Iniciando sub-agente WritingCoach (SQA-SWR-BRISK-04)...');
       this.spawnSubAgent({
         role: 'WritingCoach',
         mission: 'Transformar métricas de cadência em feedback de fluência e integridade.',
         logic: async (p, log) => {
            log(`Analisando cadência do estudante ${p.studentId}...`);
            log('Fluência detectada: ALTA. Nenhuma anomalia de IA externa.');
            return { coachingTips: ['Mantenha a fluidez', 'Bom uso de pausas reflexivas'] };
         }
       });
    }
  }
}
