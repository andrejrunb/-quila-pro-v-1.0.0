/**
 * INSTITUTIONAL BUDGET SERVICE (v4002 - Safe Proxy)
 * ------------------------------------------------
 */

export interface BudgetReport {
  totalRevenue: number;
  totalExpenses: number;
  totalPayroll: number;
  operationalCosts: number;
  pedagogicalInvestment: number;
  surplus: number;
  transparencyScore: number;
  timestamp: string;
  lastUpdate: string;
}

export class InstitutionalBudgetServiceProxy {
  private static instance: InstitutionalBudgetServiceProxy;

  public static getInstance(): InstitutionalBudgetServiceProxy {
    if (!InstitutionalBudgetServiceProxy.instance) {
      InstitutionalBudgetServiceProxy.instance = new InstitutionalBudgetServiceProxy();
    }
    return InstitutionalBudgetServiceProxy.instance;
  }

  private async invoke(method: string, ...args: any[]): Promise<any> {
    if (typeof window !== 'undefined' && window.aquila) {
      return window.aquila.invoke(`budget:${method}`, ...args);
    }
    return null;
  }

  public async getTransparencyReport(): Promise<BudgetReport> {
    return this.invoke('getTransparencyReport');
  }

  public async logOperationalInvestment(activity: string, cost: number): Promise<void> {
    return this.invoke('logOperationalInvestment', activity, cost);
  }
}

export const institutionalBudgetService = InstitutionalBudgetServiceProxy.getInstance();
export default institutionalBudgetService;
