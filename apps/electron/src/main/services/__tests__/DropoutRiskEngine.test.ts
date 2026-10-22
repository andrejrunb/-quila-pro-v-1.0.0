import { dropoutRiskEngine } from '../DropoutRiskEngine';

// Mocks do Database
jest.mock('../../../database/Database', () => ({
  Database: {
    getInstance: jest.fn().mockReturnValue({
      calculateAttendance: jest.fn(),
      run: jest.fn().mockResolvedValue(true),
      all: jest.fn().mockResolvedValue([])
    })
  }
}));

describe('DropoutRiskEngine (Evasão)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('deve calcular score de risco baseado nas 5 variáveis ponderadas', async () => {
    const assessment = await dropoutRiskEngine.assessStudentRisk('stu-1', 'class-1');
    expect(assessment).toBeDefined();
    expect(assessment.studentId).toBe('stu-1');
    expect(assessment.riskScore).toBeGreaterThanOrEqual(0);
    expect(assessment.riskScore).toBeLessThanOrEqual(100);
    expect(assessment.factors).toHaveLength(5);
  });

  test('deve emitir evento de high-risk se score > 75 (disparo automático)', async () => {
    // Força fatores extremamente ruins mockando o math.random globalmente ou no db
    jest.spyOn(Math, 'random').mockReturnValue(0.99); 
    // Com random alto, notas caem, faltas disparam (1-0.99 = 0.01), mood piora etc.
    // Atenção: a fórmula de attValue é 1 - (percent/100). 
    // Se mockarmos o DB, podemos forçar attendance baixo.
    
    const dbMock = require('../../../database/Database').Database.getInstance();
    dbMock.calculateAttendance.mockResolvedValue({ percentage: 5 }); // 5% de presença = 0.95 attValue

    const emitSpy = jest.spyOn(dropoutRiskEngine, 'emit');

    const assessment = await dropoutRiskEngine.assessStudentRisk('stu-2', 'class-2');
    
    // O score será altíssimo
    expect(assessment.riskScore).toBeGreaterThan(75);
    expect(assessment.actionProtocol).toBe('ALERTA_BUSCA_ATIVA');
    
    expect(emitSpy).toHaveBeenCalledWith('high-risk-detected', assessment);
    
    jest.restoreAllMocks();
  });

  test('deve retornar histórico de predição do banco de dados', async () => {
    const dbMock = require('../../../database/Database').Database.getInstance();
    dbMock.all.mockResolvedValue([
      { id: '1', studentId: 'stu-3', riskScore: 80, riskFactors: '[]', date: '2026-10-01', status: 'PENDING' },
      { id: '2', studentId: 'stu-3', riskScore: 82, riskFactors: '[]', date: '2026-10-08', status: 'PENDING' }
    ]);

    const history = await dropoutRiskEngine.getRiskHistory('stu-3');
    expect(history).toHaveLength(2);
    expect(history[0].riskScore).toBe(80);
  });
});
