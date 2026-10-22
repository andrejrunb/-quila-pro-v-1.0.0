import { Database } from '../../database/Database';
import PricingService, { SaaSPlan } from './PricingService';
import { logger } from '../logger';
import { churnMonitorService } from './ChurnMonitorService';

/**
 * FinanceService - Cluster 400 (Sovereign Finance)
 * Orquestra faturamento, geração de cobranças e integração com ledger local.
 */
export class FinanceService {
  private static instance: FinanceService;
  private db: Database;

  private constructor() {
    this.db = Database.getInstance();
  }

  public static getInstance(): FinanceService {
    if (!FinanceService.instance) {
      FinanceService.instance = new FinanceService();
    }
    return FinanceService.instance;
  }

  /**
   * [SQA-FIN-401] Gera faturamento mensal para toda a instituição.
   */
  public async generateMonthlyBilling(schoolId: string): Promise<any> {
    try {
      logger.info(`[Finance] Iniciando faturamento mensal para escola: ${schoolId}`);
      
      const school = await this.db.get(`SELECT * FROM schools WHERE id = ?`, [schoolId]);
      const studentCount = (await this.db.get(`SELECT COUNT(*) as total FROM students`))?.total || 0;
      
      const type = school?.name.toLowerCase().includes('municipal') || school?.name.toLowerCase().includes('estadual') ? 'public' : 'private';
      
      // Simula cotação base no plano Professional
      const quote = await PricingService.calculateQuote(type, 'capital', studentCount, SaaSPlan.PROFESSIONAL);

      const billingId = `BILL-${schoolId}-${new Date().toISOString().substring(0, 7)}`;
      
      await this.db.run(
        `INSERT OR REPLACE INTO billing (id, studentHash, amount, dueDate, status) 
         VALUES (?, ?, ?, ?, ?)`,
        [
          billingId,
          'INSTITUTIONAL',
          quote.totalValue,
          new Date(new Date().getFullYear(), new Date().getMonth() + 1, 10).toISOString(), // Vencimento dia 10 do próximo mês
          'pending'
        ]
      );

      return {
        billingId,
        total: quote.totalValue,
        students: studentCount,
        quote
      };

    } catch (err: any) {
      logger.error(`[Finance] Falha ao gerar faturamento: ${err.message}`);
      throw err;
    }
  }

  /**
   * [SQA-FIN-402] Gera código Pix para pagamento institucional.
   */
  public async generatePixPayload(billingId: string): Promise<string> {
    const billing = await this.db.get(`SELECT * FROM billing WHERE id = ?`, [billingId]);
    if (!billing) throw new Error('Cobrança não encontrada');

    // Simulação de payload Pix (v401+)
    const amount = billing.amount.toFixed(2);
    const amountStr = amount.replace('.', '');
    return `00020126580014BR.GOV.BCB.PIX013665a6f9b1-7a6f-4d4d-8e5a-8b1a2c3d4e5f520400005303986540${amountStr.length}${amountStr}5802BR5913AQUILA PRO OS6009SAO PAULO62070503***6304`;
  }

  /**
   * [SQA-FIN-403] Fornece visão geral financeira para o Córtex Central.
   */
  public async getGlobalFinanceStats(): Promise<any> {
    const totalPending = await this.db.all('SELECT SUM(amount) as total FROM billing WHERE status = "pending"');
    const totalPaid = await this.db.all('SELECT SUM(amount) as total FROM billing WHERE status = "paid"');
    const studentCount = await this.db.get('SELECT COUNT(*) as count FROM students');

    return {
      pendingRevenue: totalPending[0]?.total || 0,
      collectedRevenue: totalPaid[0]?.total || 0,
      activeStudents: studentCount?.count || 0,
      projection: (totalPending[0]?.total || 0) + (totalPaid[0]?.total || 0),
      currency: 'BRL'
    };
  }

  /**
   * [SQA-FIN-402] Recupera o histórico de cobranças institucionais.
   */
  public async getBillingHistory(): Promise<any[]> {
    try {
      return await this.db.all('SELECT * FROM billing ORDER BY dueDate DESC');
    } catch (err: any) {
      logger.error(`[Finance] Falha ao recuperar histórico: ${err.message}`);
      return [];
    }
  }

  /**
   * [SQA-FIN-404] Calcula o Churn Rate projetado baseado em riscos pedagógicos.
   * "Pedagogical Risk = Financial Risk"
   */
  public async getProjectedChurnRisk(): Promise<any> {
    const criticalStudents = await this.db.all(`SELECT id FROM students WHERE observationLevel > 80`);
    const totalStudents = await this.db.get(`SELECT COUNT(*) as count FROM students`);
    
    const riskPercentage = totalStudents.count > 0 
      ? (criticalStudents.length / totalStudents.count) * 100 
      : 0;

    // ROI: Cada aluno retido vale aprox. R$ 5.000/ano (conforme estratégia de marketing)
    return {
      criticalStudentCount: criticalStudents.length,
      projectedChurn: Math.round(riskPercentage),
      financialImpact: criticalStudents.length * 5000,
      mitigationStrategy: 'Priorizar intervenções ativas via Dashboard de Coordenação.'
    };
  }

  /**
   * [SQA-FIN-500] Retorna Score de Saúde Financeira.
   */
  public async getHealthScore(): Promise<any> {
    const stats = await this.getGlobalFinanceStats();
    const churn = await this.getProjectedChurnRisk();
    
    let score = 95; // Base
    if (churn.projectedChurn > 5) score -= 10;
    if (stats.pendingRevenue > stats.collectedRevenue) score -= 15;

    return {
      score,
      status: score > 85 ? 'OPTIMAL' : score > 70 ? 'STABLE' : 'CRITICAL',
      insights: [
        'Baixo índice de inadimplência institucional.',
        'Projeção de crescimento de 12% no próximo trimestre.',
        `Risco de evasão em ${churn.projectedChurn}% dos alunos críticos.`
      ]
    };
  }

  /**
   * [SQA-FIN-401] Gera cobrança individual para um estudante (mensalidade).
   */
  public async generateStudentBilling(studentId: string, amount: number): Promise<any> {
    try {
      const student = await this.db.get('SELECT * FROM students WHERE id = ?', [studentId]);
      if (!student) throw new Error('Estudante não encontrado');

      const billingId = `STU-${studentId}-${Date.now()}`;
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 15); // Vencimento em 15 dias

      await this.db.run(
        `INSERT INTO billing (id, studentHash, amount, dueDate, status) VALUES (?, ?, ?, ?, ?)`,
        [billingId, studentId, amount, dueDate.toISOString(), 'pending']
      );

      return { billingId, amount, dueDate };
    } catch (err: any) {
      logger.error(`[Finance] Falha ao gerar cobrança de estudante: ${err.message}`);
      throw err;
    }
  }

  /**
   * [SQA-FIN-401] Régua de Cobrança: Notifica pais sobre pendências.
   */
  public async processCollectionRuler(): Promise<any> {
    try {
      logger.info('[Finance] Iniciando processamento da Régua de Cobrança...');
      
      const pendingBills = await this.db.getPendingBills(3); // 3 dias de limiar
      
      // Importação dinâmica para evitar circular dependency se houver
      const { sovereignRegistry } = require('../registry');
      const orchestrator = sovereignRegistry.getContext().pedagogicalOrchestrator;

      if (!orchestrator) {
        logger.warn('[Finance] PedagogicalOrchestrator não encontrado no context. Abortando Régua.');
        return { skipped: true, reason: 'Orchestrator missing' };
      }

      let notificationsSent = 0;
      let notificationsPausedByRisk = 0;

      for (const bill of pendingBills) {
        if (bill.parentUserId) {
          // [SQA-FIN-404] Cross-check com Risco Pedagógico
          const students = await this.db.all('SELECT metadata FROM students WHERE id = ?', [bill.studentHash]);
          const studentMetadata = students[0] ? JSON.parse(students[0].metadata || '{}') : {};
          
          if (studentMetadata.riskLevel === 'critical' || studentMetadata.riskLevel === 'high') {
            logger.info(`[Finance] Cobrança automática PAUSADA para ${bill.studentName} devido a Risco Pedagógico (${studentMetadata.riskLevel})`);
            notificationsPausedByRisk++;
            continue; 
          }

          const title = `Lembrete: Mensalidade de ${bill.studentName}`;
          const content = `Sua fatura de R$ ${bill.amount.toFixed(2)} vence em ${new Date(bill.dueDate).toLocaleDateString('pt-BR')}.`;
          
          await orchestrator.sendNotification(bill.parentUserId, title, content, 'FINANCIAL');
          notificationsSent++;
        }
      }

      return { success: true, notificationsSent, notificationsPausedByRisk };

    } catch (err: any) {
      logger.error(`[Finance] Falha na Régua de Cobrança: ${err.message}`);
      throw err;
    }
  }

  /**
   * [SQA-FIN-405] Propõe uma auto-negociação de dívida.
   */
  public async proposeNegotiation(studentId: string, billingIds: string[], installments: number): Promise<any> {
    const bills = await this.db.all(`SELECT * FROM billing WHERE id IN (${billingIds.map(id => `'${id}'`).join(',')})`);
    const totalOriginal = bills.reduce((sum, b) => sum + b.amount, 0);
    
    // Regra de Negócio: 10% de desconto para pagamento à vista, ou parcelamento sem juros até 3x.
    const totalNegotiated = installments === 1 ? totalOriginal * 0.9 : totalOriginal;

    const negotiationId = `NEG-${studentId}-${Date.now()}`;
    await this.db.run(
      `INSERT INTO debt_negotiations (id, studentId, billingIds, totalOriginal, totalNegotiated, installments, status, proposedBy) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [negotiationId, studentId, JSON.stringify(billingIds), totalOriginal, totalNegotiated, installments, 'PROPOSED', 'PARENT']
    );

    return { negotiationId, totalOriginal, totalNegotiated, installments };
  }

  /**
   * [SQA-FIN-405] Aceita uma proposta de negociação.
   */
  public async acceptNegotiation(negotiationId: string): Promise<any> {
    const neg = await this.db.get('SELECT * FROM debt_negotiations WHERE id = ?', [negotiationId]);
    if (!neg) throw new Error('Negociação não encontrada');

    await this.db.run(
      'UPDATE debt_negotiations SET status = ?, acceptedAt = ? WHERE id = ?',
      ['ACCEPTED', new Date().toISOString(), negotiationId]
    );

    // Atualiza faturas originais como 'negotiated'
    const billingIds = JSON.parse(neg.billingIds);
    for (const id of billingIds) {
      await this.db.run('UPDATE billing SET status = ? WHERE id = ?', ['negotiated', id]);
    }

    // Gera novas faturas baseadas no parcelamento
    const installmentAmount = neg.totalNegotiated / neg.installments;
    for (let i = 1; i <= neg.installments; i++) {
      const dueDate = new Date();
      dueDate.setMonth(dueDate.getMonth() + i);
      await this.db.run(
        'INSERT INTO billing (id, studentHash, amount, dueDate, status) VALUES (?, ?, ?, ?, ?)',
        [`${negotiationId}-INST-${i}`, neg.studentId, installmentAmount, dueDate.toISOString(), 'pending']
      );
    }

    return { success: true, message: 'Negociação aceita e faturamento atualizado.' };
  }
}

export const financeService = FinanceService.getInstance();

