import { Database } from '../database/Database';
import { logger } from '../main/logger';

const db = Database.getInstance();

export interface BudgetReport {
  totalRevenue: number;
  totalExpenses: number; // Substituindo para matching com a UI
  totalPayroll: number;
  operationalCosts: number;
  pedagogicalInvestment: number;
  surplus: number;
  transparencyScore: number;
  timestamp: string;
  lastUpdate: string; // Proposto pelo usuário
}

/**
 * INSTITUTIONAL BUDGET SERVICE (v4002)
 * ------------------------------------
 * Provê transparência financeira (Budget Glass) para o Conselho Soberano.
 * Agrega dados de faturamento e RH para prestação de contas ética.
 */
export class InstitutionalBudgetService {
  private static instance: InstitutionalBudgetService;

  private constructor() {}

  public static getInstance(): InstitutionalBudgetService {
    if (!InstitutionalBudgetService.instance) {
      InstitutionalBudgetService.instance = new InstitutionalBudgetService();
    }
    return InstitutionalBudgetService.instance;
  }

  /**
   * [SQA-FIN-901] Gera o relatório de transparência (Vidro Institucional).
   */
  public async getTransparencyReport(): Promise<BudgetReport> {
    try {
      // 1. Calcular Receita Real (Mensalidades Pagas)
      const revenueData = await db.all(
        "SELECT SUM(amount) as total FROM billing WHERE status = 'paid'"
      );
      const totalRevenue = revenueData[0]?.total || 0;

      // 2. Calcular Folha de Pagamento (Salários Base)
      const payrollData = await db.all(
        "SELECT SUM(baseSalary) as total FROM staff_details"
      );
      const totalPayroll = payrollData[0]?.total || 0;

      // 3. Custos Operacionais (Estimados/Mockados p/ v4002)
      // Em uma integração real, isso viria de uma tabela 'expenses'
      const operationalCosts = totalRevenue * 0.15; // 15% para manutenção/energia

      const totalExpenses = totalPayroll + operationalCosts;
      const surplus = totalRevenue - totalExpenses;
      const pedagogicalInvestment = surplus > 0 ? surplus * 0.4 : 0; 

      return {
        totalRevenue,
        totalExpenses,
        totalPayroll,
        operationalCosts,
        pedagogicalInvestment,
        surplus,
        transparencyScore: 98,
        timestamp: new Date().toISOString(),
        lastUpdate: new Date().toLocaleTimeString('pt-BR')
      };
    } catch (error) {
      logger.error(`[BudgetService] Erro ao gerar relatório de transparência: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * [SQA-FIN-902] Registra custo operacional de uma plataforma (ex: CPU/IO de exportação).
   */
  public async logOperationalInvestment(activity: string, estimatedCost: number) {
    try {
      logger.info(`[Budget-Hardening] Registrando investimento operacional em '${activity}': R$ ${estimatedCost.toFixed(2)}`);
    } catch (error) {
      logger.error(`[BudgetService] Falha ao logar investimento operacional: ${(error as Error).message}`);
    }
  }
}

export const institutionalBudgetService = InstitutionalBudgetService.getInstance();
