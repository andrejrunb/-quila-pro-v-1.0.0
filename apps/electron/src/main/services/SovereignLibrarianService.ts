import { app, shell } from 'electron';
import Database from '../../database/Database';
import { logger } from '../logger';
import { GenerativeAIService } from './GenerativeAIService';
import { attendanceAuditService } from './AttendanceAuditService';
import { predictiveSafetyService } from './PredictiveSafetyService';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import * as path from 'path';
import { sovereignParentLinkService } from './SovereignParentLinkService';

/**
 * SovereignLibrarianService (v1.0.0)
 * Centraliza a gestão de materiais pedagógicos gerados por IA a partir de fontes locais.
 */
export let sovereignLibrarianService: SovereignLibrarianService;

export class SovereignLibrarianService {
  private static instance: SovereignLibrarianService;
  private db: Database;
  private ai: GenerativeAIService;
  private baseDir: string;

  private constructor(db: Database, ai: GenerativeAIService) {
    this.db = db;
    this.ai = ai;
    this.baseDir = path.join(process.cwd(), 'docs', 'pedagogical');
  }

  public static getInstance(db?: Database, ai?: GenerativeAIService): SovereignLibrarianService {
    if (!SovereignLibrarianService.instance) {
      if (!db || !ai) {
        throw new Error('[Librarian] Database and AI service required for initialization');
      }
      SovereignLibrarianService.instance = new SovereignLibrarianService(db, ai);
      sovereignLibrarianService = SovereignLibrarianService.instance;
    }
    return SovereignLibrarianService.instance;
  }

  public async init() {
    if (!fs.existsSync(this.baseDir)) {
      await fs.promises.mkdir(this.baseDir, { recursive: true });
    }
    
    // Inicializa o ledger de inteligência global
    await this.db.run(`
      CREATE TABLE IF NOT EXISTS global_intelligence_ledger (
        id TEXT PRIMARY KEY,
        sourceNodeId TEXT,
        type TEXT,
        content TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    logger.info(`[Librarian] Diretório base pedagógico e Ledger Global inicializados.`);
  }

  /**
   * [Fase 1.6.0] Inicia o ciclo de descoberta de novos materiais pedagógicos.
   */
  public startDiscoveryLoop() {
    const INTERVAL = 30 * 60 * 1000; // 30 minutos
    setInterval(async () => {
      logger.info('[Librarian] Iniciando ciclo de descoberta de materiais...');
      // Lógica para escanear diretórios ou novos arquivos (v1.6.0)
    }, INTERVAL);
  }

  async processTeacherContent(params: {
    classId: string,
    type: 'pdf' | 'audio' | 'image' | 'text',
    title: string,
    rawContent: string | Buffer,
    generateOptions?: ('summary' | 'flashcards' | 'questions' | 'exercise_list' | 'form')[],
    privacyTag?: 'PUBLIC_SWARM' | 'LOCAL_ONLY'
  }) {
    logger.info(`[Librarian] Processando novo conteúdo: ${params.title} (${params.type})`);
    
    let extractedText = "";
    const options = params.generateOptions || ['summary', 'flashcards', 'youtube_links'];
    const privacy = params.privacyTag || 'LOCAL_ONLY';

    try {
      if (params.type === 'text') {
        extractedText = params.rawContent.toString();
      } else if (params.type === 'image') {
        extractedText = await this.ai.analyzeWithGeminiVision([params.rawContent.toString()], "Extraia todo o texto pedagógico desta imagem (lousa/lista).");
      } else if (params.type === 'audio') {
        extractedText = await this.ai.chatWithSovereignContext(`Transcreva e resuma este conteúdo de áudio para fins pedagógicos: ${params.rawContent.toString()}`).then(r => r.content);
      } else if (params.type === 'pdf') {
        extractedText = params.rawContent.toString().substring(0, 10000); 
      }

      const generated: any = {};
      for (const opt of options) {
        generated[opt] = await this.ai.generatePedagogicalMaterial(opt as any, extractedText);
      }

      if (generated['youtube_links'] && Array.isArray(generated['youtube_links'])) {
        generated['youtube_summaries'] = await this.summarizeYouTubeLessons(generated['youtube_links']);
      }

      const resourceId = uuidv4();
      await this.db.run(`
        INSERT INTO pedagogical_resources (id, classId, type, title, content, aiSummary, youtubeLinks, sourceFile, privacyTag)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        resourceId,
        params.classId || null,
        'enriched_content',
        params.title,
        JSON.stringify(generated['flashcards'] || extractedText),
        generated['summary'] || null,
        JSON.stringify(generated['youtube_links'] || []),
        `${params.type}_ref_${resourceId.substring(0,8)}`,
        privacy
      ]);

      if (privacy === 'PUBLIC_SWARM') {
        const { sovereignMeshService } = await import('./SovereignMeshService');
        await sovereignMeshService.broadcast({
          id: `announcement_${uuidv4()}`,
          sourceNode: sovereignMeshService.getNodeId(),
          targetNode: 'ALL',
          timestamp: Date.now(),
          payloadType: 'RESOURCE_ANNOUNCEMENT',
          payload: {
            title: params.title,
            type: 'enriched_content',
            excerpt: generated['summary'] ? generated['summary'].substring(0, 200) : "Complex Resource",
            resourceId: resourceId
          },
          securityLevel: 'low_privacy'
        });
      }

      return { success: true, materials: Object.keys(generated) };
    } catch (err) {
      logger.error(`[Librarian] Erro ao processar conteúdo: ${err}`);
      throw err;
    }
  }

  async getResourceForClass(classId: string) {
    return await this.db.all(`SELECT * FROM pedagogical_resources WHERE classId = ? ORDER BY createdAt DESC`, [classId]);
  }

  async browseLibrary(filters?: { type?: string, collectionId?: string, isFavorite?: boolean }) {
    let sql = `SELECT * FROM pedagogical_resources WHERE 1=1`;
    const params: any[] = [];

    if (filters?.type) { sql += ` AND type = ?`; params.push(filters.type); }
    if (filters?.collectionId) { sql += ` AND collectionId = ?`; params.push(filters.collectionId); }
    if (filters?.isFavorite !== undefined) { sql += ` AND isFavorite = ?`; params.push(filters.isFavorite ? 1 : 0); }

    sql += ` ORDER BY createdAt DESC`;
    return await this.db.all(sql, params);
  }

  async toggleFavorite(resourceId: string) {
    const res = await this.db.get(`SELECT isFavorite FROM pedagogical_resources WHERE id = ?`, [resourceId]);
    if (!res) throw new Error("Recurso não encontrado.");
    const newValue = res.isFavorite ? 0 : 1;
    await this.db.run(`UPDATE pedagogical_resources SET isFavorite = ? WHERE id = ?`, [newValue, resourceId]);
    return { success: true, isFavorite: !!newValue };
  }

  async getCollections() {
    return await this.db.all(`SELECT * FROM pedagogical_collections ORDER BY createdAt DESC`);
  }

  async createCollection(name: string, description: string) {
    const id = `COL-${uuidv4().substring(0,8)}`;
    await this.db.run(`
      INSERT INTO pedagogical_collections (id, name, description)
      VALUES (?, ?, ?)
    `, [id, name, description]);
    return { id, name };
  }

  async assignToCollection(resourceId: string, collectionId: string) {
    await this.db.run(`UPDATE pedagogical_resources SET collectionId = ? WHERE id = ?`, [collectionId, resourceId]);
    return { success: true };
  }

  async searchSemantic(query: string, limit: number = 5) {
    // @ts-ignore
    const rag = this.ai['ragService'];
    if (rag) return await rag.searchSemantic(query, limit);

    return await this.db.all(`
      SELECT * FROM pedagogical_resources 
      WHERE title LIKE ? OR aiSummary LIKE ? 
      ORDER BY createdAt DESC LIMIT ?
    `, [`%${query}%`, `%${query}%`, limit]);
  }

  async generateExecutiveDigest(resourceIds: string[]) {
    try {
      const resources: any[] = [];
      for (const id of resourceIds) {
        const res = await this.db.get(`SELECT * FROM pedagogical_resources WHERE id = ?`, [id]);
        if (res) resources.push(res);
      }
      if (resources.length === 0) throw new Error("Nenhum recurso encontrado.");

      const context = resources.map(r => `TÍTULO: ${r.title}\nRESUMO: ${r.aiSummary}\nCONTEÚDO: ${r.content}\n---\n`).join('\n');
      const prompt = `Analise os materiais e crie um RELATÓRIO EXECUTIVO: ${context}`;
      const reportContent = await this.ai.generateText(prompt);

      const reportId = `REP-${uuidv4().substring(0,8)}`;
      await this.db.run(`
        INSERT INTO pedagogical_resources (id, type, title, content, aiSummary, privacyTag)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [reportId, 'executive_digest', `Relatório Executivo: ${resources.length} Materiais`, reportContent, "Relatório consolidado.", 'LOCAL_ONLY']);

      return { success: true, reportId, content: reportContent };
    } catch (err) {
      logger.error(`[Librarian] Erro ao gerar Digest: ${err}`);
      throw err;
    }
  }

  async getKnowledgeMap() {
    // @ts-ignore
    const rag = this.ai['ragService'];
    return rag ? { nodes: rag.getKnowledgeMap() } : { nodes: [] };
  }

  async exportDigestToPDF(title: string, content: string) {
    const { PDFDocument, rgb, StandardFonts } = await import('pdf-lib');
    const pdfDoc = await PDFDocument.create();
    const timesRomanFont = await pdfDoc.embedFont(StandardFonts.TimesRoman);
    const timesRomanBoldFont = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);

    let page = pdfDoc.addPage();
    const { width, height } = page.getSize();
    const margin = 50;
    let currentY = height - margin;

    page.drawText('ÁQUILA PRO - SOVEREIGN LIBRARIAN', { x: margin, y: currentY, size: 10, font: timesRomanBoldFont, color: rgb(0.1, 0.4, 0.8) });
    currentY -= 30;
    page.drawText(title.toUpperCase(), { x: margin, y: currentY, size: 18, font: timesRomanBoldFont });
    currentY -= 40;

    const lines = content.split('\n');
    for (const line of lines) {
      if (currentY < margin + 20) { page = pdfDoc.addPage(); currentY = height - margin; }
      const isBold = line.startsWith('#');
      const text = line.replace(/#/g, '').trim();
      if (!text) { currentY -= 10; continue; }
      page.drawText(text, { x: margin, y: currentY, size: isBold ? 14 : 12, font: isBold ? timesRomanBoldFont : timesRomanFont });
      currentY -= isBold ? 20 : 15;
    }

    const pdfBytes = await pdfDoc.save();
    const fileName = `digest_${Date.now()}.pdf`;
    const filePath = path.join(process.cwd(), 'exports', fileName);
    if (!fs.existsSync(path.join(process.cwd(), 'exports'))) fs.mkdirSync(path.join(process.cwd(), 'exports'));
    fs.writeFileSync(filePath, pdfBytes);
    try { shell.showItemInFolder(filePath); } catch (e) {}
    return { success: true, filePath, fileName };
  }

  private async summarizeYouTubeLessons(links: { title: string, url: string }[]) {
    const summaries: any[] = [];
    for (const link of links) {
      try {
        const res = await this.ai.chatWithSovereignContext(`Resuma este vídeo: ${link.title} (${link.url})`);
        summaries.push({ title: link.title, url: link.url, summary: res.content });
      } catch (err) {}
    }
    return summaries;
  }

  /**
   * [Fase 3] Consolida contexto pedagógico e de segurança para insights estratégicos.
   */
  public async getPedagogicalContext(): Promise<any> {
    try {
      const stats = await attendanceAuditService.getAuditStats();
      const currentRisk = predictiveSafetyService.getCurrentRiskLevel();
      const safetyStatus = predictiveSafetyService.getSafetyStatus();
      const anomalies = await attendanceAuditService.getDiscrepancies();

      return {
        stats,
        currentRisk,
        safetyStatus,
        anomalies: anomalies.slice(0, 5),
        trendAlerts: [
          { id: 1, type: 'pedagogical', message: 'Tendência de evasão detectada no 9º Ano B', severity: 'warning' },
          { id: 2, type: 'safety', message: 'Aumento de correrias no Corredor Norte', severity: 'info' }
        ]
      };
    } catch (e) {
      logger.error(`[Librarian] Erro ao obter contexto: ${e}`);
      return null;
    }
  }

  /**
   * [Fase 3/4] Sintetiza tendências institucionais usando o motor de IA Soberano com contexto expandido.
   */
  public async synthesizeInstitutionalTrends(): Promise<string> {
    if (!this.ai) return "Serviço de IA indisponível.";
    const context = await this.getPedagogicalContext();
    
    const prompt = `
      [SISTEMA DE INTELIGÊNCIA INSTITUCIONAL ÁQUILA PRO]
      CONTEXTO ATUAL:
      - Risco Institucional: ${context.currentRisk}% (${context.safetyStatus})
      - Frequência Crítica: ${context.stats.irregularitiesDetected} irregularidades detectadas.
      - Alertas de Tendência: ${context.trendAlerts.map((a: any) => a.message).join(', ')}
      - Anomalias de Presença: ${context.anomalies.length} casos recentes.

      TAREFA: Gere 3 a 5 recomendações estratégicas curtas e acionáveis para a coordenação. 
      Foque na estabilidade institucional e bem-estar pedagógico. Use um tom profissional e urgente se o risco for > 70%.
    `;

    try {
      return await this.ai.generateText(prompt);
    } catch (e) {
      logger.error(`[Librarian] Erro na síntese: ${e}`);
      return "Erro ao processar síntese de IA.";
    }
  }

  /**
   * [Fase 4] Salva um insight gerado pela IA no arquivo soberano para consulta futura.
   */
  public async saveTrendInsight(content: string, riskLevel: number) {
    const id = `INS-${uuidv4().substring(0,8)}`;
    await this.db.run(`
      INSERT INTO pedagogical_resources (id, type, title, content, aiSummary, privacyTag)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [
      id, 
      'institutional_insight', 
      `Insight Estratégico: ${new Date().toLocaleDateString()}`, 
      content, 
      `Nível de Risco na Geração: ${riskLevel}%`, 
      'LOCAL_ONLY'
    ]);
    
    // Tenta vincular ao Grafo de Conhecimento se disponível
    // @ts-ignore
    const rag = this.ai['ragService'];
    if (rag && rag.addKnowledgeNode) {
      await rag.addKnowledgeNode({
        id,
        label: `Insight ${riskLevel}%`,
        type: 'insight',
        content: content.substring(0, 100)
      });
    }

    return { id, success: true };
  }

  /**
   * [Fase 4] Recupera insights arquivados.
   */
  public async getArchivedInsights() {
    return await this.db.all(`
      SELECT * FROM pedagogical_resources 
      WHERE type = 'institutional_insight' 
      ORDER BY createdAt DESC LIMIT 10
    `);
  }

  /**
   * [Fase 501] Exporta um insight arquivado para o Portal de Pais via ParentLink.
   */
  public async shareInsightWithParents(insightId: string) {
    return await sovereignParentLinkService.shareInsightWithParents(insightId);
  }

  /**
   * [Fase 600] Transmite um insight institucional para o enxame Nexus.
   */
  public async broadcastInstitutionalInsight(insightId: string) {
    const insight = await this.db.get(`SELECT * FROM pedagogical_resources WHERE id = ?`, [insightId]);
    if (!insight) throw new Error("Insight não encontrado.");

    const { sovereignMeshService } = await import('./SovereignMeshService');
    await sovereignMeshService.broadcast({
      id: `fed_${uuidv4()}`,
      sourceNode: sovereignMeshService.getNodeId(),
      targetNode: 'ALL',
      timestamp: Date.now(),
      payloadType: 'FEDERATED_INSIGHT' as any,
      payload: {
        id: insight.id,
        title: insight.title,
        content: insight.content,
        riskLevel: insight.aiSummary // O riskLevel é salvo no aiSummary no saveTrendInsight
      },
      securityLevel: 'medium_sovereignty'
    });

    logger.info(`[Librarian] Insight ${insightId} transmitido para a Federação.`);
    return { success: true };
  }

  /**
   * [Fase 600] Processa um insight vindo de outro Hub.
   */
  public async handleIncomingFederatedInsight(data: any) {
    logger.info(`[Librarian] Integrando insight federado: ${data.title} de ${data.sourceNodeId}`);
    
    await this.db.run(`
      INSERT OR REPLACE INTO global_intelligence_ledger (id, sourceNodeId, type, content)
      VALUES (?, ?, ?, ?)
    `, [data.id, data.sourceNodeId, 'federated_insight', JSON.stringify(data)]);

    // Emitir para a UI se houver listeners
  }

  /**
   * [Fase 600] Recupera insights da federação armazenados localmente.
   */
  public async getFederatedInsights() {
    return await this.db.all(`SELECT * FROM global_intelligence_ledger ORDER BY timestamp DESC LIMIT 20`);
  }

  /**
   * [Phase 1200] Inicia uma busca descentralizada no enxame Swarm.
   */
  public async querySwarm(query: string) {
    logger.info(`[Librarian] Iniciando busca Swarm: ${query}`);
    const { sovereignMeshService } = await import('./SovereignMeshService');
    
    await sovereignMeshService.broadcast({
      id: `swarm_q_${uuidv4().substring(0,8)}`,
      sourceNode: sovereignMeshService.getNodeId(),
      targetNode: 'ALL',
      timestamp: Date.now(),
      payloadType: 'SWARM_SEARCH_REQUEST' as any,
      payload: { query },
      securityLevel: 'medium_sovereignty'
    });

    return { success: true, message: "Busca transmitida para o enxame." };
  }

  /**
   * [Phase 1200] Recupera resultados cacheados vindos de outros Hubs.
   */
  public async getSwarmCache() {
    return await this.db.all(`SELECT * FROM swarm_resources_cache ORDER BY createdAt DESC LIMIT 50`);
  }

  /**
   * [Phase 1400] Endossa a qualidade de um recurso federado (Reputation Vouch).
   */
  public async vouchForResource(resourceId: string, comment: string = "Endossado via Hub Local") {
    logger.info(`[Librarian] Endossando recurso ${resourceId}`);
    const { sovereignMeshService } = await import('./SovereignMeshService');

    await sovereignMeshService.broadcast({
      id: `vouch_${uuidv4().substring(0,8)}`,
      sourceNode: sovereignMeshService.getNodeId(),
      targetNode: 'ALL',
      timestamp: Date.now(),
      payloadType: 'REPUTATION_VOUCH' as any,
      payload: { resourceId, comment },
      securityLevel: 'medium_sovereignty'
    });

    return { success: true };
  }

  /**
   * [Phase 1600] Descarta um risco pedagógico detectado pela IA com justificativa.
   */
  public async dismissRisk(studentId: string, riskType: string = "GENERIC", reason: string = "Nenhuma justificativa fornecida") {
    logger.info(`[Librarian] Descartando risco (${riskType}) para aluno: ${studentId}. Motivo: ${reason}`);
    
    await this.db.run(`
      UPDATE behavioral_logs 
      SET riskScore = 0, observationLevel = 0 
      WHERE studentId = ?
    `, [studentId]);

    await this.db.run(`
      UPDATE students 
      SET observationLevel = 0 
      WHERE id = ?
    `, [studentId]);

    // Auditoria Zero-Bypass com detalhes enriquecidos
    await this.db.run(`
      INSERT INTO zero_bypass_audits (userId, action, details)
      VALUES (?, ?, ?)
    `, ['STAFF', 'RISK_DISMISSED', `Risco (${riskType}) descartado para aluno ${studentId}. Justificativa: ${reason}`]);

    return { success: true };
  }

  /**
   * [Level 50+] Recupera materiais salvos por um aluno específico.
   */
  public async getStudentMaterials(studentId: string) {
    const student = await this.db.get(`SELECT classId FROM students WHERE id = ?`, [studentId]);
    const classId = student?.classId || null;

    const resources = await this.db.all(`
      SELECT * FROM pedagogical_resources 
      WHERE (studentId = ? OR classId = ? OR privacyTag = 'PUBLIC_SWARM')
      ORDER BY createdAt DESC
    `, [studentId, classId]);

    // Separa tarefas de materiais de apoio se necessário, ou retorna tudo em recursos
    return {
      resources,
      tasks: resources.filter(r => r.type === 'task' || r.type === 'exercise_list')
    };
  }

  /**
   * [Level 50+] Salva um novo material gerado no Student AI Lab.
   */
  public async saveStudentMaterial(studentId: string, material: any) {
    const id = `STUDENT-RES-${uuidv4().substring(0,8)}`;
    await this.db.run(`
      INSERT INTO pedagogical_resources (id, studentId, type, title, content, aiSummary, privacyTag)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      id,
      studentId,
      material.type || 'student_notes',
      material.title,
      material.content,
      material.summary || null,
      'PRIVATE_STUDENT'
    ]);
    return { success: true, id };
  }

  /**
   * [Level 50+] Marca uma tarefa como concluída e aciona mitigação de risco se necessário.
   */
  public async completeTask(studentId: string, taskId: string) {
    logger.info(`[Librarian] Aluno ${studentId} concluiu tarefa ${taskId}`);
    
    // Atualiza status da tarefa
    await this.db.run(`
      UPDATE pedagogical_resources 
      SET status = 'COMPLETED', updatedAt = CURRENT_TIMESTAMP 
      WHERE id = ? AND studentId = ?
    `, [taskId, studentId]);

    // Lógica Aureus: Conclusão de tarefas reduz score de risco pedagógico
    const currentRisk = await this.db.get(`SELECT riskScore FROM behavioral_logs WHERE studentId = ?`, [studentId]);
    let recoveryTriggered = false;

    if (currentRisk && currentRisk.riskScore > 15) {
      const reduction = 10;
      await this.db.run(`
        UPDATE behavioral_logs 
        SET riskScore = MAX(0, riskScore - ?), observationLevel = MAX(0, observationLevel - 1) 
        WHERE studentId = ?
      `, [reduction, studentId]);
      recoveryTriggered = true;
      logger.info(`[Librarian] Recovery acionado para ${studentId}: -${reduction} pontos de risco.`);
    }

    return { success: true, recoveryTriggered };
  }
}
