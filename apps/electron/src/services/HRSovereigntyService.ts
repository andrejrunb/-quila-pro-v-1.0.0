import Database from '../database/Database';
import { StaffRecord, StaffRole } from './AiTypes';

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
        { id: 'stf-001', name: 'Dr. Andrej', role: 'ADMIN', department: 'Direção', email: 'andrej@aquila.io', status: 'active', nodeId: 'nexus_alpha' },
        { baseSalary: 15000, contractType: 'CLT', taxHoldingIRRF: 0, performanceScore: 92, onboardingStep: 100 }
      );
      await this.db.upsertStaff(
        { id: 'stf-002', name: 'Gabriel Zelador', role: 'JANITOR', department: 'Manutenção', email: 'gabriel@aquila.io', status: 'active', nodeId: 'nexus_delta' },
        { baseSalary: 3500, contractType: 'CLT', taxHoldingIRRF: 0, performanceScore: 88, onboardingStep: 100 }
      );
      await this.db.upsertStaff(
        { id: 'stf-003', name: 'Prof. Silva', role: 'TEACHER', department: 'Pedagógico', email: 'silva@aquila.io', status: 'active', nodeId: 'nexus_beta' },
        { baseSalary: 6000, contractType: 'CLT', taxHoldingIRRF: 0, performanceScore: 95, onboardingStep: 100 }
      );
      console.log('[HRSovereignty] Initial staff (Maestro/Zelador/Prof) seeded.');
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

  public async getStaffByRole(role: StaffRole): Promise<StaffRecord[]> {
    const all = await this.getAllStaff();
    return all.filter(s => s.role === role);
  }

  public async getStaffById(id: string): Promise<StaffRecord | null> {
    const all = await this.getAllStaff();
    return all.find(s => s.id === id) || null;
  }
}

export const hrSovereigntyService = HRSovereigntyService.getInstance();
