import { sovereignKnowledgeService } from '../SovereignKnowledgeService';
import { LocateAnythingBridge } from '../LocateAnythingBridge';
import { Database } from '../../../database/Database';
import { GenerativeAIService } from '../GenerativeAIService';
import { sovereignIncidentCaseService } from '../SovereignIncidentCaseService';
import { jest } from '@jest/globals';

jest.mock('../../../database/Database');
jest.mock('../GenerativeAIService');

describe('Sovereign Knowledge & Vision Services', () => {
  let mockDb: jest.Mocked<Database>;
  let mockAi: jest.Mocked<GenerativeAIService>;

  beforeEach(() => {
    mockDb = {
      run: jest.fn<(...args: any[]) => Promise<any>>().mockResolvedValue({ changes: 1, lastID: 1 }),
      get: jest.fn<(...args: any[]) => Promise<any>>().mockResolvedValue(null),
      all: jest.fn<(...args: any[]) => Promise<any[]>>().mockResolvedValue([]),
    } as any;

    mockAi = {
      getEmbeddings: jest.fn<(...args: any[]) => Promise<number[]>>().mockResolvedValue(new Array(768).fill(0.1)),
      analyzeContent: jest.fn<(...args: any[]) => Promise<string>>().mockResolvedValue('Mocked AI analysis result content'),
    } as any;

    sovereignKnowledgeService.init(mockDb, mockAi);
    sovereignIncidentCaseService.init(mockDb, mockAi);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('SovereignKnowledgeService - TreeKnowledge RAG', () => {
    test('ensureTables should invoke db.run to create tables', async () => {
      await sovereignKnowledgeService.ensureTables();
      expect(mockDb.run).toHaveBeenCalledTimes(2);
      expect(mockDb.run).toHaveBeenNthCalledWith(1, expect.stringContaining('CREATE TABLE IF NOT EXISTS knowledge_nodes'));
      expect(mockDb.run).toHaveBeenNthCalledWith(2, expect.stringContaining('CREATE TABLE IF NOT EXISTS knowledge_cards'));
    });

    test('addNode should insert data into database', async () => {
      const node = {
        id: 'node-1',
        parentId: null,
        title: 'Title 1',
        summary: 'Summary 1',
        content: 'Content 1',
        citations: ['citation-1'],
        level: 0
      };

      await sovereignKnowledgeService.addNode(node);
      expect(mockDb.run).toHaveBeenCalledWith(
        expect.stringContaining('INSERT OR REPLACE INTO knowledge_nodes'),
        [node.id, node.parentId, node.title, node.summary, node.content, JSON.stringify(node.citations), node.level]
      );
    });

    test('getNode should fetch and parse node row', async () => {
      const mockRow = {
        id: 'node-1',
        parent_id: null,
        title: 'Title 1',
        summary: 'Summary 1',
        content: 'Content 1',
        citations: JSON.stringify(['cit-1']),
        level: 0,
        created_at: '2026-06-03T00:00:00Z'
      };

      (mockDb.get as any).mockResolvedValueOnce(mockRow);

      const node = await sovereignKnowledgeService.getNode('node-1');
      expect(node).not.toBeNull();
      expect(node?.id).toBe('node-1');
      expect(node?.citations).toEqual(['cit-1']);
    });

    test('searchTree should navigate roots and children with fallback matching', async () => {
      const mockRoots = [
        { id: 'root-1', parent_id: null, title: 'Important Regs', summary: 'Regs summary', content: 'School rules content', citations: '[]', level: 0 },
        { id: 'root-2', parent_id: null, title: 'Math plan', summary: 'Math summary', content: 'Math content', citations: '[]', level: 0 }
      ];

      const mockChildren = [
        { id: 'child-1', parent_id: 'root-1', title: 'Regs detail', summary: 'Detail summary', content: 'Detail content', citations: '[]', level: 1 }
      ];

      // Mock database queries: first for roots, second for children of roots
      (mockDb.all as any).mockImplementation((sql: string, params?: any[]) => {
        if (sql.includes('parent_id IS NULL')) {
          return Promise.resolve(mockRoots);
        } else if (params && params[0] === 'root-1') {
          return Promise.resolve(mockChildren);
        }
        return Promise.resolve([]);
      });

      // Simple mock for embeddings return values to produce similarity differentiation
      (mockAi.getEmbeddings as any).mockImplementation((text: string) => {
        const vec = new Array(768).fill(0);
        if (text.includes('Regs') || text.includes('rules')) {
          vec[0] = 1.0;
        } else {
          vec[1] = 1.0;
        }
        return Promise.resolve(vec);
      });

      const results = await sovereignKnowledgeService.searchTree('rules', 2);
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].id).toBe('root-1');
    });

    test('generateCardForNode should generate a card using AI and save to db', async () => {
      const mockNode = {
        id: 'node-123',
        parent_id: null,
        title: 'Node Title',
        summary: 'Summary',
        content: 'Long pedagogy contents',
        citations: '[]',
        level: 0
      };

      (mockDb.get as any).mockResolvedValueOnce(mockNode);

      const card = await sovereignKnowledgeService.generateCardForNode('node-123', 'SUMMARY');
      expect(card).not.toBeNull();
      expect(card?.title).toBe('Card: Node Title');
      expect(card?.content).toBe('Mocked AI analysis result content');
      expect(mockDb.run).toHaveBeenCalledWith(
        expect.stringContaining('INSERT OR REPLACE INTO knowledge_cards'),
        expect.any(Array)
      );
    });
  });

  describe('SovereignIncidentCaseService - Case Management', () => {
    test('ensureTables should create tables', async () => {
      await sovereignIncidentCaseService.ensureTables();
      expect(mockDb.run).toHaveBeenCalledTimes(2);
    });

    test('createCase should insert a new incident', async () => {
      const caseData = {
        title: 'Corredor Leste Briga',
        description: 'Alunos correndo no corredor',
        severity: 'HIGH' as const,
        assignedTo: 'docente_maria',
        category: 'DISCIPLINARY' as const,
        slaLimit: '2026-06-04T12:00:00Z'
      };

      const id = await sovereignIncidentCaseService.createCase(caseData);
      expect(id).toMatch(/^CASE-/);
      expect(mockDb.run).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO incident_cases'),
        expect.any(Array)
      );
    });

    test('autoTriage should return LLM parsed checklist and update db', async () => {
      const mockCase = {
        id: 'CASE-123',
        title: 'Aluno machucado',
        description: 'Queda de aluno no pátio',
        severity: 'MEDIUM',
        assigned_to: null,
        category: 'MEDICAL',
        sla_limit: '2026-06-04T12:00:00Z',
        created_at: '2026-06-04T00:00:00Z',
        closed_at: null
      };

      (mockDb.get as any).mockResolvedValueOnce(mockCase);
      mockAi.analyzeContent.mockResolvedValueOnce(JSON.stringify({
        suggestedSeverity: 'CRITICAL',
        suggestedCategory: 'MEDICAL',
        checklist: ['Chamar enfermaria', 'Avisar os pais'],
        reasoning: 'Fratura visível'
      }));

      const triage = await sovereignIncidentCaseService.autoTriage('CASE-123');
      expect(triage.suggestedSeverity).toBe('CRITICAL');
      expect(triage.checklist.length).toBe(2);
      expect(mockDb.run).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE incident_cases'),
        ['CRITICAL', 'MEDICAL', 'CASE-123']
      );
    });
  });

  describe('LocateAnythingBridge', () => {
    test('should locate bounding box using simulated fallback when PLAYWRIGHT=true', async () => {
      process.env.PLAYWRIGHT = 'true';
      const bridge = new LocateAnythingBridge(true, '');
      await bridge.start();

      const result = await bridge.locate('frame.jpg', 'person running');
      expect(result.type).toBe('located');
      expect(result.detections.length).toBe(1);
      expect(result.detections[0].label).toBe('person running');
      expect(result.simulated).toBe(true);

      bridge.stop();
      delete process.env.PLAYWRIGHT;
    });
  });
});
