import Database from '../database/Database';

export interface StaffRecord {
  id: string;
  name: string;
  role: string;
  email?: string;
  phone?: string;
  biometricId?: string;
  baseSalary: number;
  contractType: 'CLT' | 'PJ' | 'MEI';
  taxHoldingIRRF: number;
  performanceScore: number;
  onboardingStep: number;
  status: string;
}

class HRSovereigntyService {
  private static instance: HRSovereigntyService;
  private db: Database | null = null;

  private constructor() {}

  public static getInstance(): HRSovereigntyService {
    if (!HRSovereigntyService.instance) {
      HRSovereigntyService.instance = new HRSovereigntyService();
    }
    return HRSovereigntyService.instance;
  }

  public init(db: Database) {
    this.db = db;
    this.seedInitialStaff();
  }

  private async seedInitialStaff() {
    if (!this.db) return;
    const staff = await this.db.getStaff();
    if (staff.length === 0) {
      await this.db.upsertStaff(
        { id: 'stf-001', name: 'Dr. Andrej', role: 'Principal Architect', email: 'andrej@aquila.io', biometricId: 'BIO-001', status: 'active' },
        { baseSalary: 15000, contractType: 'CLT', admissionDate: '2024-01-01', taxHoldingIRRF: 0, performanceScore: 92, onboardingStep: 100 }
      );
      console.log('[HRSovereignty] Initial staff seeded.');
    }
  }

  /**
   * Calculates monthly payroll including tax deductions.
   */
  public async calculatePayroll(staffId: string): Promise<any> {
    if (!this.db) return null;
    const details = await this.db.getStaffDetails(staffId);
    if (!details) return null;

    let netSalary = details.baseSalary;
    let inss = details.baseSalary * 0.11;
    let irrf = 0;

    if (details.baseSalary > 4664.68) {
      irrf = (details.baseSalary * 0.275) - 869.36;
    }

    netSalary = details.baseSalary - inss - irrf;

    return {
      base: details.baseSalary,
      deductions: { inss, irrf },
      net: netSalary,
      status: 'CALCULATED'
    };
  }

  /**
   * Calculates a dynamic performance score based on presence.
   */
  public async calculatePerformanceIndex(staffId: string): Promise<number> {
    if (!this.db) return 0;
    const history = await this.db.getStaffPontoHistory(staffId, 10);
    const details = await this.db.getStaffDetails(staffId);
    if (!details) return 0;

    // Lógica real: +2 por cada ponto IN, -5 se não houver ponto nos últimos 3 dias
    const hasRecentPonto = history.length > 0 && (Date.now() - new Date(history[0].timestamp).getTime()) < 259200000;
    let score = details.performanceScore;

    if (hasRecentPonto) score = Math.min(100, score + 2);
    else score = Math.max(0, score - 5);

    return score;
  }

  public async getAllStaff(): Promise<StaffRecord[]> {
    if (!this.db) return [];
    return this.db.getStaff();
  }
}

export const hrSovereigntyService = HRSovereigntyService.getInstance();
