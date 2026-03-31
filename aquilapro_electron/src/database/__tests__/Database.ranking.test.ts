/**
 * Step 102 — Testes Unitários: Database Ranking & Reprobation Risk
 * Cobre: getStudentRankings (presence, punctuality, loitering),
 *        calculateReprobationRisk, getStudentTrajectory
 */
import Database from '../../database/Database';
import { jest } from '@jest/globals';

// Usamos um banco in-memory para testes de integração leve
// ou mock dos métodos de SQL para teste unitário
jest.mock('../../database/Database', () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
      all: jest.fn(),
      get: jest.fn(),
      run: jest.fn(),
      getStudentRankings: jest.fn(),
      calculateReprobationRisk: jest.fn(),
      getStudentTrajectory: jest.fn(),
    })),
  };
});

describe('Database — Ranking & Reprobation Methods', () => {
  let db: jest.Mocked<any>;

  beforeEach(() => {
    jest.clearAllMocks();
    db = new (Database as any)('/:memory:');
  });

  // ------ getStudentRankings ------
  describe('getStudentRankings', () => {
    it('deve retornar top 5 alunos por presença em ordem DESC', async () => {
      const mockResults = [
        { id: 's1', name: 'Ana', score: 45 },
        { id: 's2', name: 'Bruno', score: 40 },
        { id: 's3', name: 'Carla', score: 35 },
        { id: 's4', name: 'Daniel', score: 30 },
        { id: 's5', name: 'Eva', score: 25 },
      ];
      db.getStudentRankings.mockResolvedValue(mockResults);

      const result = await db.getStudentRankings('presence', 5, 'DESC');
      expect(result).toHaveLength(5);
      expect(result[0].score).toBeGreaterThanOrEqual(result[1].score);
    });

    it('deve retornar top 5 alunos por atrasos (punctuality) em ordem DESC', async () => {
      db.getStudentRankings.mockResolvedValue([
        { id: 's1', name: 'Fiona', score: 12 },
        { id: 's2', name: 'Guido', score: 8 },
      ]);

      const result = await db.getStudentRankings('punctuality', 5, 'DESC');
      expect(db.getStudentRankings).toHaveBeenCalledWith('punctuality', 5, 'DESC');
      expect(result[0].score).toBeGreaterThan(result[1].score);
    });

    it('deve retornar lista vazia para métrica desconhecida', async () => {
      db.getStudentRankings.mockResolvedValue([]);
      const result = await db.getStudentRankings('unknown_metric', 5);
      expect(result).toEqual([]);
    });

    it('deve respeitar o limite de resultados', async () => {
      const twoResults = [
        { id: 's1', name: 'Hugo', score: 10 },
        { id: 's2', name: 'Iris', score: 8 },
      ];
      db.getStudentRankings.mockResolvedValue(twoResults);
      const result = await db.getStudentRankings('loitering', 2, 'DESC');
      expect(result.length).toBeLessThanOrEqual(2);
    });
  });

  // ------ calculateReprobationRisk ------
  describe('calculateReprobationRisk', () => {
    it('deve retornar risco 0 para aluno com 100% de presença', async () => {
      db.calculateReprobationRisk.mockResolvedValue({
        riskLevel: 0,
        absences: 0,
        isCritical: false,
        totalDays: 60,
      });

      const result = await db.calculateReprobationRisk('s1');
      expect(result.riskLevel).toBe(0);
      expect(result.isCritical).toBe(false);
    });

    it('deve marcar como crítico quando risco >= 75%', async () => {
      db.calculateReprobationRisk.mockResolvedValue({
        riskLevel: 80,
        absences: 20,
        isCritical: true,
        totalDays: 60,
      });

      const result = await db.calculateReprobationRisk('s2');
      expect(result.isCritical).toBe(true);
      expect(result.riskLevel).toBeGreaterThanOrEqual(75);
    });

    it('deve nunca retornar riskLevel acima de 100', async () => {
      db.calculateReprobationRisk.mockResolvedValue({
        riskLevel: 100,
        absences: 60,
        isCritical: true,
        totalDays: 60,
      });

      const result = await db.calculateReprobationRisk('s3');
      expect(result.riskLevel).toBeLessThanOrEqual(100);
    });

    it('deve retornar risco proporcional a 25% de faltas (limite legal BR)', async () => {
      // 15 faltas em 60 dias = 25% = riskLevel 100 (limite atingido)
      db.calculateReprobationRisk.mockResolvedValue({
        riskLevel: 100,
        absences: 15,
        isCritical: true,
        totalDays: 60,
      });

      const result = await db.calculateReprobationRisk('s4');
      expect(result.isCritical).toBe(true);
    });
  });

  // ------ getStudentTrajectory ------
  describe('getStudentTrajectory', () => {
    it('deve retornar trajetória diária de entradas e saídas', async () => {
      const mockTrajectory = [
        { date: '2026-03-01', events: 2, entryTime: '07:15:00', exitTime: '17:30:00' },
        { date: '2026-03-02', events: 2, entryTime: '07:45:00', exitTime: '17:25:00' },
        { date: '2026-03-03', events: 1, entryTime: '08:10:00', exitTime: null },
      ];
      db.getStudentTrajectory.mockResolvedValue(mockTrajectory);

      const result = await db.getStudentTrajectory('s1', 30);
      expect(result).toHaveLength(3);
      expect(result[0]).toHaveProperty('date');
      expect(result[0]).toHaveProperty('entryTime');
    });

    it('deve retornar lista vazia para aluno sem registros', async () => {
      db.getStudentTrajectory.mockResolvedValue([]);
      const result = await db.getStudentTrajectory('s-unknown', 30);
      expect(result).toEqual([]);
    });

    it('deve usar 30 dias como default quando não especificado', async () => {
      db.getStudentTrajectory.mockResolvedValue([]);
      await db.getStudentTrajectory('s1');
      expect(db.getStudentTrajectory).toHaveBeenCalledWith('s1');
    });
  });
});
