import { predictiveAnalyticsService } from '../PredictiveAnalyticsService';
import { socialGraphService } from '../SocialGraphService';
import { identityRecaptureService } from '../IdentityRecaptureService';

jest.mock('../SovereignEvolutionService', () => ({
  sovereignEvolutionService: {
    getCurrentConfidenceMultiplier: jest.fn().mockResolvedValue(1.0)
  }
}));

describe('Maturity Level 4: Predictive Analytics', () => {
  let mockDb: any;

  beforeEach(() => {
    mockDb = {
      all: jest.fn().mockResolvedValue([
        { id: 'STU-001', name: 'John Doe', frustrationScore: 8, status: 'active' }
      ]),
      get: jest.fn()
    };
    predictiveAnalyticsService.setDatabase(mockDb);
  });

  it('should identify CRITICAL risk for isolated and frustrated students', async () => {
    // Mock SocialGraph: Degree 0 (Isolated)
    (socialGraphService as any).graph = {
        degree: jest.fn().mockReturnValue(0),
        clear: jest.fn(),
        order: 1,
        size: 0
    };
    (socialGraphService as any).computeGraphFromEvents = jest.fn().mockResolvedValue(true);

    // Mock Attendance: Many lates
    mockDb.all.mockImplementation((sql: string, params: any[]) => {
        if (sql.includes('students')) return [{ id: 'STU-001', name: 'John Doe', frustrationScore: 8, status: 'active' }];
        if (sql.includes('attendance')) return [{ status: 'late' }, { status: 'late' }, { status: 'late' }, { status: 'late' }];
        return [];
    });

    const risks = await predictiveAnalyticsService.runGlobalInference();

    expect(risks.length).toBe(1);
    expect(risks[0].studentId).toBe('STU-001');
    expect(risks[0].score).toBeGreaterThan(70);
    expect(risks[0].classification).toBe('HIGH'); // 35 (Social) + 25 (Frustration) + 20 (Attendance) = 80
    expect(risks[0].factors).toContain('SOCIAL_ISOLATION');
    expect(risks[0].factors).toContain('HIGH_FRUSTRATION');
    expect(risks[0].factors).toContain('ATTENDANCE_INSTABILITY');
  });

  it('should infer POTENTIAL_DROPOUT incident correctly', async () => {
    (socialGraphService as any).graph.degree = jest.fn().mockReturnValue(0);
    mockDb.all.mockImplementation((sql: string) => {
        if (sql.includes('students')) return [{ id: 'STU-002', frustrationScore: 2, status: 'active' }];
        if (sql.includes('attendance')) return [{ status: 'late' }, { status: 'late' }, { status: 'late' }, { status: 'late' }];
        return [];
    });

    const risks = await predictiveAnalyticsService.runGlobalInference();
    expect(risks[0].predictedIncident).toBe('POTENTIAL_DROPOUT');
  });
});
