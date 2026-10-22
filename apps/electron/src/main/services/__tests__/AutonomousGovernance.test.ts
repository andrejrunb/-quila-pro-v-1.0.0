import { autonomousGovernanceOrchestrator } from '../AutonomousGovernanceOrchestrator';
import { predictiveAnalyticsService } from '../PredictiveAnalyticsService';
import { councilService } from '../SovereignCouncilService';
import { db } from '../../../database/Database';

// Mock do DB e Serviços
jest.mock('../PredictiveAnalyticsService', () => ({
  predictiveAnalyticsService: {
    getRiskReport: jest.fn(),
    calculateStudentRisk: jest.fn()
  }
}));

jest.mock('../SovereignCouncilService', () => ({
  councilService: {
    generateAiProposal: jest.fn()
  }
}));

jest.mock('../../../database/Database', () => ({
  db: {
    run: jest.fn(),
    all: jest.fn(),
    get: jest.fn()
  }
}));

describe('Maturity Level 5: Autonomous Governance', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Forçar isProcessing como false (se necessário via cast para teste)
    (autonomousGovernanceOrchestrator as any).isProcessing = false;
  });

  it('should automatically create a social proposal when critical isolation is detected', async () => {
    // 1. Setup: 3 alunos em risco crítico de isolamento
    const mockRiskReport = [
      { studentId: 's1', classification: 'CRITICAL', score: 0.9, details: 'Isolamento Social Alto' },
      { studentId: 's2', classification: 'CRITICAL', score: 0.88, details: 'Isolamento Social Alto' },
      { studentId: 's3', classification: 'CRITICAL', score: 0.92, details: 'Isolamento Social Alto' }
    ];

    (predictiveAnalyticsService.getRiskReport as jest.Mock).mockResolvedValue(mockRiskReport);
    (councilService.generateAiProposal as jest.Mock).mockResolvedValue('prop_123');
    (db.run as jest.Mock).mockResolvedValue({ lastID: 1 });
    (db.all as jest.Mock).mockResolvedValue([]); // Prevent evaluateDecisionImpacts from failing

    // 2. Executar Ciclo
    await autonomousGovernanceOrchestrator.runGovernanceCycle();

    // 3. Verificação
    expect(predictiveAnalyticsService.getRiskReport).toHaveBeenCalled();
    expect(councilService.generateAiProposal).toHaveBeenCalledWith('social');
    expect(db.run).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO governance_impact_links'),
      expect.arrayContaining(['prop_123'])
    );
  });

  it('should evaluate impact score correctly (Adaptive Feedback Loop)', async () => {
    // 1. Setup: Uma proposta fechada com link de impacto
    const mockActiveLinks = [{
      id: 'link_1',
      proposal_id: 'prop_123',
      target_data_json: JSON.stringify(['s1']),
      initial_risk_score: 0.9,
      status: 'closed'
    }];

    (predictiveAnalyticsService.getRiskReport as jest.Mock).mockResolvedValue([]);
    (db.all as jest.Mock).mockResolvedValue(mockActiveLinks);
    // Simular que o risco caiu de 0.9 para 0.4 após a intervenção
    (predictiveAnalyticsService.calculateStudentRisk as jest.Mock).mockResolvedValue({ score: 0.4 });

    // 2. Executar Ciclo
    await autonomousGovernanceOrchestrator.runGovernanceCycle();

    // 3. Verificação: Impacto deve ser 0.5 (0.9 - 0.4)
    expect(db.run).toHaveBeenCalledWith(
      expect.stringContaining('UPDATE governance_impact_links SET final_impact_score = ?'),
      expect.arrayContaining([0.5, 'link_1'])
    );
  });
});
