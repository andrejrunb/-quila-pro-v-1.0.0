import { logger } from '../logger';
import Database from '../../database/Database';
import { StaffRecord, StaffRole } from '../../services/AiTypes';

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
   * Calculates monthly payroll including tax deductions, FGTS and Benefits.
   */
  public async calculatePayroll(staffId: string): Promise<any> {
    if (!this.db) return null;
    const details = await this.db.getStaffDetails(staffId);
    if (!details) return null;

    const base = details.baseSalary;
    let inss = base * 0.11;
    let irrf = 0;

    if (base > 4664.68) {
      irrf = (base * 0.275) - 869.36;
    }

    const fgts = base * 0.08;
    const foodAllowance = 600; // VA/VR
    const netSalary = base - inss - irrf + foodAllowance;

    return {
      base,
      deductions: { inss, irrf },
      provisions: { fgts },
      benefits: { foodAllowance },
      net: netSalary,
      status: 'CALCULATED'
    } as any;
  }

  /**
   * Generates eSocial compliant event JSON (Mock for v1.0.0)
   */
  public async generateESocialEvent(staffId: string, eventType: 'S-1200' | 'S-2200'): Promise<any> {
    const staff = await this.getStaffById(staffId);
    const payroll = await this.calculatePayroll(staffId);
    if (!staff || !payroll) return null;

    if (eventType === 'S-1200') {
      return {
        evtRemun: {
          ideEvento: { indRetif: 1, tpAmb: 1, procEmi: 1, verProc: 'Aquila-v1.0.0' },
          ideEmpregador: { tpInsc: 1, nrInsc: '00000000000191' },
          ideTrabalhador: { cpfTrab: '000.000.000-00' },
          dmDev: {
            ideDmDev: 'DEMO-001',
            infoPerAnt: null,
            infoPerApur: {
              ideEstabLot: {
                tpInsc: 1,
                nrInsc: '00000000000191',
                codLotacao: '01',
                remunOutrEmpr: 'N',
                itensRemun: [
                  { codRubr: '1000', tpRubr: 1, vrRubr: payroll.base },
                  { codRubr: '9000', tpRubr: 2, vrRubr: payroll.deductions.inss }
                ]
              }
            }
          }
        }
      };
    }

    return { message: 'Event type not implemented in PoC' };
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
  /**
   * [SQA-HR-900] Persiste um evento de eSocial para auditoria posterior.
   */
  public async saveESocialEvent(staffId: string, type: string, payload: any): Promise<void> {
    if (!this.db) {
       console.error('[HR] Erro ao salvar evento eSocial: Database não inicializado.');
       return;
    }
    const id = `EVT-${type}-${Date.now()}`;
    await this.db.run(
      'INSERT INTO esocial_events (id, staffId, type, payload) VALUES (?, ?, ?, ?)',
      [id, staffId, type, JSON.stringify(payload)]
    );
    logger.info(`[HR] Evento eSocial ${type} salvo para o colaborador ${staffId}`);
  }

  /**
   * [SQA-HR-910] Retorna dados para o Dashboard de Compliance.
   */
  public async getComplianceDashboard(): Promise<any> {
    if (!this.db) {
       return {
         totalEvents: 0,
         pendingEvents: 0,
         complianceRate: 100,
         recentEvents: []
       };
    }
    const totalEvents = await this.db.get('SELECT COUNT(*) as count FROM esocial_events');
    const pendingEvents = await this.db.get("SELECT COUNT(*) as count FROM esocial_events WHERE status = 'PENDING'");
    const recentEvents = await this.db.all('SELECT * FROM esocial_events ORDER BY createdAt DESC LIMIT 10');
    
    return {
      totalEvents: totalEvents.count,
      pendingEvents: pendingEvents.count,
      complianceRate: totalEvents.count > 0 ? ((totalEvents.count - pendingEvents.count) / totalEvents.count) * 100 : 100,
      recentEvents
    };
  }
}

export const hrSovereigntyService = HRSovereigntyService.getInstance();

