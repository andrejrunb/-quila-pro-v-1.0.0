import { Database } from '../../database/Database';
import { GenerativeAIService } from './GenerativeAIService';
import { logger } from '../logger';
import { v4 as uuidv4 } from 'uuid';

export interface IncidentCase {
  id: string;
  title: string;
  description: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'OPEN' | 'UNDER_INVESTIGATION' | 'RESOLVED' | 'CLOSED';
  assignedTo: string | null;
  category: 'SECURITY' | 'DISCIPLINARY' | 'MEDICAL' | 'INFRASTRUCTURE' | 'OTHER';
  slaLimit: string;
  createdAt?: string;
  closedAt?: string | null;
}

export interface TimelineEvent {
  id: string;
  caseId: string;
  eventType: 'SYSTEM_ALERT' | 'USER_NOTE' | 'EVIDENCE_ADDED' | 'REASSIGNMENT' | 'STATUS_CHANGE' | 'AI_ACTION_SUGGESTION';
  content: string;
  mediaPath: string | null;
  createdAt?: string;
}

export class SovereignIncidentCaseService {
  private static instance: SovereignIncidentCaseService;
  private db!: Database;
  private ai!: GenerativeAIService;
  private initialized = false;

  private constructor() {}

  public static getInstance(): SovereignIncidentCaseService {
    if (!SovereignIncidentCaseService.instance) {
      SovereignIncidentCaseService.instance = new SovereignIncidentCaseService();
    }
    return SovereignIncidentCaseService.instance;
  }

  public init(db: Database, ai: GenerativeAIService) {
    this.db = db;
    this.ai = ai;
    this.initialized = true;
    logger.info('[SovereignIncidentCaseService] Inicializado.');
  }

  /**
   * Garante a criação das tabelas SQLite
   */
  public async ensureTables(): Promise<void> {
    if (!this.initialized) throw new Error('SovereignIncidentCaseService não inicializado');

    await this.db.run(`
      CREATE TABLE IF NOT EXISTS incident_cases (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        severity TEXT DEFAULT 'MEDIUM',
        status TEXT DEFAULT 'OPEN',
        assigned_to TEXT,
        category TEXT DEFAULT 'OTHER',
        sla_limit DATETIME NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        closed_at DATETIME
      )
    `);

    await this.db.run(`
      CREATE TABLE IF NOT EXISTS incident_case_timeline (
        id TEXT PRIMARY KEY,
        case_id TEXT NOT NULL,
        event_type TEXT NOT NULL,
        content TEXT NOT NULL,
        media_path TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (case_id) REFERENCES incident_cases(id) ON DELETE CASCADE
      )
    `);

    logger.info('[SovereignIncidentCaseService] Tabelas de incidentes verificadas.');
  }

  /**
   * Cria um novo caso de incidente escolar
   */
  public async createCase(caseData: Omit<IncidentCase, 'id' | 'status' | 'createdAt' | 'closedAt'>): Promise<string> {
    const id = `CASE-${uuidv4().substring(0, 8).toUpperCase()}`;
    
    await this.db.run(`
      INSERT INTO incident_cases (id, title, description, severity, status, assigned_to, category, sla_limit)
      VALUES (?, ?, ?, ?, 'OPEN', ?, ?, ?)
    `, [
      id,
      caseData.title,
      caseData.description,
      caseData.severity,
      caseData.assignedTo,
      caseData.category,
      caseData.slaLimit
    ]);

    // Adiciona evento de criação na linha do tempo
    await this.addTimelineEvent({
      caseId: id,
      eventType: 'SYSTEM_ALERT',
      content: `Caso de incidente criado: [${caseData.severity}] ${caseData.title}`,
      mediaPath: null
    });

    logger.info(`[IncidentCase] Caso ${id} registrado com sucesso.`);
    return id;
  }

  /**
   * Adiciona um evento de evidência ou atividade na linha do tempo
   */
  public async addTimelineEvent(event: Omit<TimelineEvent, 'id' | 'createdAt'>): Promise<string> {
    const id = `EVT-${uuidv4().substring(0, 8).toUpperCase()}`;
    
    await this.db.run(`
      INSERT INTO incident_case_timeline (id, case_id, event_type, content, media_path)
      VALUES (?, ?, ?, ?, ?)
    `, [
      id,
      event.caseId,
      event.eventType,
      event.content,
      event.mediaPath
    ]);

    logger.info(`[IncidentCase] Novo evento adicionado ao caso ${event.caseId}: ${event.eventType}`);
    return id;
  }

  /**
   * Retorna um caso específico
   */
  public async getCase(id: string): Promise<IncidentCase | null> {
    const row = await this.db.get(`SELECT * FROM incident_cases WHERE id = ?`, [id]);
    if (!row) return null;
    return this._mapCaseRow(row);
  }

  /**
   * Obtém a linha do tempo completa de um incidente
   */
  public async getTimeline(caseId: string): Promise<TimelineEvent[]> {
    const rows = await this.db.all(`
      SELECT * FROM incident_case_timeline
      WHERE case_id = ?
      ORDER BY created_at ASC
    `, [caseId]);
    return rows.map(r => this._mapEventRow(r));
  }

  /**
   * Atualiza o status e/ou responsável por um caso
   */
  public async updateStatus(
    id: string,
    status: IncidentCase['status'],
    assignedTo?: string | null
  ): Promise<void> {
    const isClosed = status === 'RESOLVED' || status === 'CLOSED';
    const closedQuery = isClosed ? `, closed_at = CURRENT_TIMESTAMP` : '';
    
    const currentCase = await this.getCase(id);
    if (!currentCase) throw new Error('Caso não encontrado.');

    if (assignedTo !== undefined) {
      await this.db.run(`
        UPDATE incident_cases
        SET status = ?, assigned_to = ? ${closedQuery}
        WHERE id = ?
      `, [status, assignedTo, id]);

      if (assignedTo !== currentCase.assignedTo) {
        await this.addTimelineEvent({
          caseId: id,
          eventType: 'REASSIGNMENT',
          content: `Caso atribuído para: ${assignedTo || 'Nenhum'}`,
          mediaPath: null
        });
      }
    } else {
      await this.db.run(`
        UPDATE incident_cases
        SET status = ? ${closedQuery}
        WHERE id = ?
      `, [status, id]);
    }

    if (status !== currentCase.status) {
      await this.addTimelineEvent({
        caseId: id,
        eventType: 'STATUS_CHANGE',
        content: `Status alterado de ${currentCase.status} para ${status}`,
        mediaPath: null
      });
    }
  }

  /**
   * Motor de triagem automática e sugestão de fluxos/checklists (ID 6)
   */
  public async autoTriage(caseId: string): Promise<any> {
    const incident = await this.getCase(caseId);
    if (!incident) throw new Error('Caso não encontrado.');

    logger.info(`[IncidentCase] Executando triagem automática para o caso: ${caseId}`);

    const prompt = `
      Você é um especialista em gerenciamento de riscos escolares. Baseado no incidente abaixo, crie um CHECKLIST DE INTERVENÇÃO e recomende a Severidade (LOW, MEDIUM, HIGH, CRITICAL) e Categoria (SECURITY, DISCIPLINARY, MEDICAL, INFRASTRUCTURE).
      
      INCIDENTE:
      Título: ${incident.title}
      Descrição: ${incident.description}
      
      REGRAS:
      - Responda apenas com um JSON contendo:
        {
          "suggestedSeverity": "LOW"|"MEDIUM"|"HIGH"|"CRITICAL",
          "suggestedCategory": "SECURITY"|"DISCIPLINARY"|"MEDICAL"|"INFRASTRUCTURE",
          "checklist": ["ação 1", "ação 2", "ação 3"],
          "reasoning": "Breve justificativa pedagógica/segurança"
        }
    `;

    const response = await this.ai.analyzeContent(prompt);
    
    let triageData: any = {};
    try {
      const jsonMatch = response.match(/\{.*\}/s);
      triageData = JSON.parse(jsonMatch ? jsonMatch[0] : response);
    } catch (err) {
      logger.error('[IncidentCase] Falha ao processar triagem automática via IA:', err);
      // Fallback
      triageData = {
        suggestedSeverity: incident.severity,
        suggestedCategory: incident.category,
        checklist: ['Verificar câmeras de segurança', 'Falar com alunos envolvidos', 'Notificar coordenação'],
        reasoning: 'Triagem simplificada devido a falha no parser de IA.'
      };
    }

    // Adiciona as ações sugeridas à linha do tempo do caso
    const checklistText = triageData.checklist.map((item: string, i: number) => `${i + 1}. ${item}`).join('\n');
    await this.addTimelineEvent({
      caseId,
      eventType: 'AI_ACTION_SUGGESTION',
      content: `Ações sugeridas pela IA:\n${checklistText}\n\nMotivo: ${triageData.reasoning}`,
      mediaPath: null
    });

    // Atualiza severidade e categoria se forem diferentes
    await this.db.run(`
      UPDATE incident_cases
      SET severity = ?, category = ?
      WHERE id = ?
    `, [triageData.suggestedSeverity, triageData.suggestedCategory, caseId]);

    return triageData;
  }

  /**
   * Recupera o contexto de reprodução do incidente (vídeos, histórico, atores) (ID 17)
   */
  public async getReplayContext(caseId: string): Promise<any> {
    const incident = await this.getCase(caseId);
    if (!incident) throw new Error('Caso não encontrado.');

    // Busca estudantes associados citados no texto ou título
    const students = await this.db.all('SELECT id, name FROM students');
    const involvedStudents = students.filter(s => 
      incident.title.toLowerCase().includes(s.name.toLowerCase()) || 
      incident.description.toLowerCase().includes(s.name.toLowerCase())
    );

    // Busca câmeras escolares na mesma Ala/Setor se descrita no incidente
    const cameras = await this.db.all('SELECT id, name, location FROM cameras');
    const matchedCameras = cameras.filter(c => 
      incident.description.toLowerCase().includes(c.location.toLowerCase()) ||
      incident.description.toLowerCase().includes(c.name.toLowerCase())
    );

    return {
      caseId,
      title: incident.title,
      createdAt: incident.createdAt,
      involvedStudents,
      matchedCameras,
      suggestedVideoFiles: matchedCameras.map(c => `/recorded_videos/${c.id}_incident_clip.mp4`)
    };
  }

  private _mapCaseRow(row: any): IncidentCase {
    return {
      id: row.id,
      title: row.title,
      description: row.description,
      severity: row.severity,
      status: row.status,
      assignedTo: row.assigned_to,
      category: row.category,
      slaLimit: row.sla_limit,
      createdAt: row.created_at,
      closedAt: row.closed_at
    };
  }

  private _mapEventRow(row: any): TimelineEvent {
    return {
      id: row.id,
      caseId: row.case_id,
      eventType: row.event_type,
      content: row.content,
      mediaPath: row.media_path,
      createdAt: row.created_at
    };
  }
}

export const sovereignIncidentCaseService = SovereignIncidentCaseService.getInstance();
