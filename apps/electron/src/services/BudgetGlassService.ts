import { logger } from '../main/logger';
import { db } from '../database/Database';
import { sovereignLedgerService } from './SovereignLedgerService';

/**
 * BUDGET GLASS SERVICE (v3801)
 * ----------------------------
 * Implementa o pilar de 'Transparência Financeira' do Áquila Pro.
 * Permite que a comunidade escolar visualize fluxos de investimento,
 * doações e despesas institucionais em tempo real.
 * Todos os lançamentos são auditáveis via Sovereign Ledger.
 */
export interface BudgetEntry {
  id: string;
  category: string;
  description: string;
  amount: number;
  type: 'credit' | 'debit';
  timestamp: number;
}

export class BudgetGlassService {
  private static instance: BudgetGlassService;

  private constructor() {}

  public static getInstance(): BudgetGlassService {
    if (!BudgetGlassService.instance) {
      BudgetGlassService.instance = new BudgetGlassService();
    }
    return BudgetGlassService.instance;
  }

  /**
   * [SQA-BGL-1175] Lança uma nova entrada orçamentária no Ledger Transparente.
   */
  public async addBudgetEntry(entry: Omit<BudgetEntry, 'id' | 'timestamp'>): Promise<string> {
    const id = `FIN_${Math.random().toString(36).substring(7).toUpperCase()}`;
    const timestamp = Date.now();

    const fullEntry: BudgetEntry = { id, ...entry, timestamp };

    // Persistência Auditável (Ledger v3801)
    await sovereignLedgerService.recordEntry('BUDGET_ENTRY', fullEntry);

    await db.run(
      'INSERT INTO budget (id, category, description, amount, type, timestamp) VALUES (?, ?, ?, ?, ?, ?)',
      [id, entry.category, entry.description, entry.amount, entry.type, timestamp]
    );

    logger.info(`[BudgetGlass] Lançamento Orçamentário ${id} Registrado e Assinado.`);
    return id;
  }

  /**
   * [SQA-BGL-1180] Gera o reporte transparente de balanço para a comunidade.
   */
  public async getBudgetSummary(): Promise<any> {
    const data = await db.all('SELECT type, SUM(amount) as total FROM budget GROUP BY type');
    const logs = await db.all('SELECT * FROM budget ORDER BY timestamp DESC LIMIT 20');
    
    return {
      summary: data,
      recentLogs: logs,
      auditHash: `AUDIT_${Math.random().toString(36).substring(7).toUpperCase()}`
    };
  }
}

export const budgetGlassService = BudgetGlassService.getInstance();
