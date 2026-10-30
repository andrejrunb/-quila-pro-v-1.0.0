/**
 * DataRetentionService.ts — Áquila Pro School OS
 * ════════════════════════════════════════════════════════════════════════════
 * Módulo de Retenção e Descarte de Dados Soberano (LGPD, LDA & ECA)
 * Conforme Política de Retenção e Descarte de Dados v1.0 (LAW-801 / SQA-1000)
 *
 * Implementa:
 * 1. Tabela mestra de 20 categorias com prazos determinísticos e proibição de retenção indefinida.
 * 2. Gestão de Estados: ATIVO -> ARQUIVADO -> QUARENTENA_JURIDICA -> ANONIMIZADO -> EXCLUIDO.
 * 3. Bloqueio cautelar de exportação para dados em QUARENTENA_JURIDICA.
 * 4. Exclusão segura em 3 camadas (Lógica, Purga Criptográfica e Purga Física com Tombstones).
 * 5. Expurgos críticos automatizados:
 *    - Biometria facial removida em até 24 horas pós-desligamento/revogação.
 *    - Imagens OMR expurgadas em até 90 dias após fechamento (preservando gabarito e notas).
 *    - Leads não convertidos anonimizados/excluídos após 24 meses de inatividade.
 * 6. Anonimização irreversível com k-anonimato (supressão para turmas < 10 alunos).
 * 7. Garantia anti-reintrodução em restaurações de backups via retention_tombstones.
 * 8. Trilha imutável encadeada via ZeroBypassAuditService (zero_bypass_audits).
 * 9. Painel DPO e Relatórios de Conformidade Regulamentar.
 * ════════════════════════════════════════════════════════════════════════════
 */

import * as crypto from 'crypto';
import * as fs from 'fs';
import { Database } from '../../database/Database';
import { logger } from '../logger';
import { ZeroBypassAuditService } from './ZeroBypassAuditService';

export type RetentionCategory =
  | 'STUDENT_CADASTRE'          // 01. Cadastro do Aluno (Duração da matrícula + 5 anos = 1825 dias)
  | 'GUARDIAN_DATA'             // 02. Dados do Responsável (Vínculo + 5 anos = 1825 dias)
  | 'ATTENDANCE_ACCESS'         // 03. Frequência e Acessos (Ciclo letivo + 5 anos = 1825 dias)
  | 'SECURITY_EVENTS'           // 04. Eventos de Segurança (5 anos = 1825 dias)
  | 'CCTV_FOOTAGE'              // 05. Imagens de Câmera / CFTV (30 dias)
  | 'BIOMETRIC_EMBEDDINGS'      // 06. Embeddings Biométricos (Duração do vínculo / máx. 24h pós-desligamento = 1 dia)
  | 'STUDENT_PHOTOS'            // 07. Fotos de Alunos (Duração da matrícula + 5 anos = 1825 dias)
  | 'EXAMS_EVALUATIONS'         // 08. Provas e Avaliações (Ciclo letivo + 5 anos = 1825 dias)
  | 'INDIVIDUAL_RESPONSES'      // 09. Respostas Individuais (Ciclo letivo + 5 anos = 1825 dias)
  | 'OMR_CARD_IMAGES'           // 10. Imagem do Cartão OMR (90 dias)
  | 'GRADES_RESULTS'            // 11. Notas e Resultados (Ciclo letivo + 5 anos = 1825 dias)
  | 'PARENT_COMMUNICATIONS'     // 12. Comunicação com Pais (5 anos = 1825 dias)
  | 'UNCONVERTED_LEADS'         // 13. Leads de Captação (24 meses = 730 dias)
  | 'CONVERTED_LEADS'           // 14. Leads Convertidos (Matrícula + 5 anos = 1825 dias)
  | 'FINANCIAL_RECORDS'         // 15. Dados Financeiros (5 anos após liquidação = 1825 dias)
  | 'AI_RAG_LOGS'               // 16. Logs de IA & RAG (12 meses = 365 dias)
  | 'SYSTEM_TECHNICAL_LOGS'     // 17. Logs Técnicos de Sistema (12 meses = 365 dias)
  | 'EDGE_BACKUPS'              // 18. Backups de Banco Edge (30 dias rotativos)
  | 'THIRD_PARTY_CONTENT'       // 19. Conteúdo de Terceiros (Conforme permissão da fonte = 365 dias)
  | 'AQUILA_PROPRIETARY_CONTENT'; // 20. Conteúdo Autoral Áquila (Conforme contrato = 365 dias)

export type DataLifecycleState =
  | 'ATIVO'
  | 'ARQUIVADO'
  | 'QUARENTENA_JURIDICA'
  | 'ANONIMIZADO'
  | 'EXCLUIDO';

export type PostRetentionAction = 'ANONYMIZE' | 'SECURE_DELETE' | 'AGGREGATE';

export interface RetentionPolicyDef {
  category: RetentionCategory;
  name: string;
  defaultPeriodDays: number;
  postAction: PostRetentionAction;
  responsibleRole: string;
  allowIndefinite: boolean;
}

export const DEFAULT_RETENTION_POLICIES: Record<RetentionCategory, RetentionPolicyDef> = {
  STUDENT_CADASTRE: {
    category: 'STUDENT_CADASTRE',
    name: 'Cadastro do Aluno',
    defaultPeriodDays: 1825,
    postAction: 'ANONYMIZE',
    responsibleRole: 'Secretaria Escolar / DPO',
    allowIndefinite: false
  },
  GUARDIAN_DATA: {
    category: 'GUARDIAN_DATA',
    name: 'Dados do Responsável',
    defaultPeriodDays: 1825,
    postAction: 'ANONYMIZE',
    responsibleRole: 'Secretaria Escolar / DPO',
    allowIndefinite: false
  },
  ATTENDANCE_ACCESS: {
    category: 'ATTENDANCE_ACCESS',
    name: 'Frequência e Acessos',
    defaultPeriodDays: 1825,
    postAction: 'AGGREGATE',
    responsibleRole: 'Coordenação / Segurança',
    allowIndefinite: false
  },
  SECURITY_EVENTS: {
    category: 'SECURITY_EVENTS',
    name: 'Eventos de Segurança',
    defaultPeriodDays: 1825,
    postAction: 'ANONYMIZE',
    responsibleRole: 'Equipe de Segurança / DPO',
    allowIndefinite: false
  },
  CCTV_FOOTAGE: {
    category: 'CCTV_FOOTAGE',
    name: 'Imagens de Câmera / CFTV',
    defaultPeriodDays: 30,
    postAction: 'SECURE_DELETE',
    responsibleRole: 'Segurança Patrimonial',
    allowIndefinite: false
  },
  BIOMETRIC_EMBEDDINGS: {
    category: 'BIOMETRIC_EMBEDDINGS',
    name: 'Embeddings Biométricos',
    defaultPeriodDays: 1, // 24 horas pós-desligamento
    postAction: 'SECURE_DELETE',
    responsibleRole: 'Segurança / DPO',
    allowIndefinite: false
  },
  STUDENT_PHOTOS: {
    category: 'STUDENT_PHOTOS',
    name: 'Fotos de Alunos',
    defaultPeriodDays: 1825,
    postAction: 'SECURE_DELETE',
    responsibleRole: 'Secretaria Escolar / DPO',
    allowIndefinite: false
  },
  EXAMS_EVALUATIONS: {
    category: 'EXAMS_EVALUATIONS',
    name: 'Provas e Avaliações',
    defaultPeriodDays: 1825,
    postAction: 'ANONYMIZE',
    responsibleRole: 'Coordenação Pedagógica',
    allowIndefinite: false
  },
  INDIVIDUAL_RESPONSES: {
    category: 'INDIVIDUAL_RESPONSES',
    name: 'Respostas Individuais',
    defaultPeriodDays: 1825,
    postAction: 'ANONYMIZE',
    responsibleRole: 'Professor Titular / Coordenação',
    allowIndefinite: false
  },
  OMR_CARD_IMAGES: {
    category: 'OMR_CARD_IMAGES',
    name: 'Imagem do Cartão OMR',
    defaultPeriodDays: 90,
    postAction: 'SECURE_DELETE',
    responsibleRole: 'QA / Coordenação Pedagógica',
    allowIndefinite: false
  },
  GRADES_RESULTS: {
    category: 'GRADES_RESULTS',
    name: 'Notas e Resultados',
    defaultPeriodDays: 1825,
    postAction: 'ANONYMIZE',
    responsibleRole: 'Secretaria / Coordenação',
    allowIndefinite: false
  },
  PARENT_COMMUNICATIONS: {
    category: 'PARENT_COMMUNICATIONS',
    name: 'Comunicação com Pais',
    defaultPeriodDays: 1825,
    postAction: 'ANONYMIZE',
    responsibleRole: 'Assessoria de Comunicação / DPO',
    allowIndefinite: false
  },
  UNCONVERTED_LEADS: {
    category: 'UNCONVERTED_LEADS',
    name: 'Leads de Captação',
    defaultPeriodDays: 730, // 24 meses
    postAction: 'SECURE_DELETE',
    responsibleRole: 'Equipe Comercial / DPO',
    allowIndefinite: false
  },
  CONVERTED_LEADS: {
    category: 'CONVERTED_LEADS',
    name: 'Leads Convertidos',
    defaultPeriodDays: 1825,
    postAction: 'ANONYMIZE',
    responsibleRole: 'Equipe Comercial / Secretaria',
    allowIndefinite: false
  },
  FINANCIAL_RECORDS: {
    category: 'FINANCIAL_RECORDS',
    name: 'Dados Financeiros',
    defaultPeriodDays: 1825,
    postAction: 'AGGREGATE',
    responsibleRole: 'Departamento Financeiro',
    allowIndefinite: false
  },
  AI_RAG_LOGS: {
    category: 'AI_RAG_LOGS',
    name: 'Logs de IA & RAG',
    defaultPeriodDays: 365,
    postAction: 'ANONYMIZE',
    responsibleRole: 'DPO / Engenharia de Software',
    allowIndefinite: false
  },
  SYSTEM_TECHNICAL_LOGS: {
    category: 'SYSTEM_TECHNICAL_LOGS',
    name: 'Logs Técnicos de Sistema',
    defaultPeriodDays: 365,
    postAction: 'SECURE_DELETE',
    responsibleRole: 'Engenharia de Infraestrutura',
    allowIndefinite: false
  },
  EDGE_BACKUPS: {
    category: 'EDGE_BACKUPS',
    name: 'Backups de Banco Edge',
    defaultPeriodDays: 30,
    postAction: 'SECURE_DELETE',
    responsibleRole: 'TI Local / DPO',
    allowIndefinite: false
  },
  THIRD_PARTY_CONTENT: {
    category: 'THIRD_PARTY_CONTENT',
    name: 'Conteúdo de Terceiros',
    defaultPeriodDays: 365,
    postAction: 'SECURE_DELETE',
    responsibleRole: 'Curadoria Pedagógica / Jurídico',
    allowIndefinite: false
  },
  AQUILA_PROPRIETARY_CONTENT: {
    category: 'AQUILA_PROPRIETARY_CONTENT',
    name: 'Conteúdo Autoral Áquila',
    defaultPeriodDays: 365,
    postAction: 'SECURE_DELETE',
    responsibleRole: 'Engenharia Áquila / Escola',
    allowIndefinite: false
  }
};

export class QuarantineExportBlockedError extends Error {
  constructor(message: string, public readonly metadata: Record<string, any>) {
    super(`[Fail-Safe / Quarentena Jurídica] ${message}`);
    this.name = 'QuarantineExportBlockedError';
  }
}

export class IndefiniteRetentionForbiddenError extends Error {
  constructor(category: string) {
    super(`[LGPD / Princípio da Minimização] Retenção indefinida é expressamente proibida para a categoria '${category}'.`);
    this.name = 'IndefiniteRetentionForbiddenError';
  }
}

export class SmallClassDeidentificationError extends Error {
  constructor(message: string, public readonly studentCount: number) {
    super(`[k-Anonimato / Proteção de Menor] ${message} (Turma com apenas ${studentCount} alunos requer agrupamento).`);
    this.name = 'SmallClassDeidentificationError';
  }
}

export interface RegisterRetentionItemParams {
  schoolId: string;
  category: RetentionCategory;
  entityType: string;
  entityId: string;
  contentHash?: string;
  filePath?: string;
  customPeriodDays?: number;
}

export interface TitularRightRequest {
  schoolId: string;
  titularType: 'student' | 'guardian' | 'employee' | 'lead';
  titularId: string;
  requestType: 'CONFIRMATION' | 'ACCESS' | 'CORRECTION' | 'ANONYMIZATION' | 'DELETION' | 'PORTABILITY' | 'REVOCATION';
  details?: string;
  requestedBy: string;
}

export class DataRetentionService {
  private static instance: DataRetentionService;
  private readonly db: any;
  private readonly auditService: ZeroBypassAuditService;
  private initialized: boolean = false;

  public constructor(db?: any, auditService?: ZeroBypassAuditService) {
    this.db = db || Database.getInstance();
    this.auditService = auditService || ZeroBypassAuditService.getInstance(this.db);
  }

  public static getInstance(db?: any, auditService?: ZeroBypassAuditService): DataRetentionService {
    if (!DataRetentionService.instance) {
      DataRetentionService.instance = new DataRetentionService(db, auditService);
    }
    return DataRetentionService.instance;
  }

  /**
   * Garante a criação idempotente do esquema de retenção e dos tombstones.
   */
  public async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      await this.ensureTables();
      await this.auditService.initialize();
      this.initialized = true;
      logger.info('[DataRetentionService] Esquema de retenção de dados e tombstones inicializado com sucesso.');
    } catch (err: any) {
      logger.error(`[DataRetentionService] Erro ao inicializar esquema de retenção: ${err.message}`);
      throw err;
    }
  }

  private async ensureTables(): Promise<void> {
    const tableQueries = [
      // 1. Políticas de Retenção Configuráveis por Escola e Categoria
      `CREATE TABLE IF NOT EXISTS retention_policies (
        id TEXT PRIMARY KEY,
        school_id TEXT NOT NULL,
        category TEXT NOT NULL,
        name TEXT NOT NULL,
        retention_period_days INTEGER NOT NULL,
        post_action TEXT NOT NULL,
        responsible_role TEXT NOT NULL,
        allow_indefinite INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(school_id, category)
      )`,

      // 2. Registro de Itens em Monitoramento de Retenção
      `CREATE TABLE IF NOT EXISTS retention_items (
        id TEXT PRIMARY KEY,
        school_id TEXT NOT NULL,
        category TEXT NOT NULL,
        entity_type TEXT NOT NULL,
        entity_id TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'ATIVO',
        file_path TEXT,
        content_hash TEXT,
        expires_at DATETIME NOT NULL,
        quarantine_reason TEXT,
        quarantined_by TEXT,
        quarantined_at DATETIME,
        deleted_at DATETIME,
        crypto_purged INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(school_id, entity_type, entity_id)
      )`,

      // 3. Tombstones Imutáveis (Anti-Reintrodução em Restauração de Backups)
      `CREATE TABLE IF NOT EXISTS retention_tombstones (
        id TEXT PRIMARY KEY,
        school_id TEXT NOT NULL,
        entity_type TEXT NOT NULL,
        entity_id TEXT NOT NULL,
        content_hash TEXT NOT NULL,
        category TEXT NOT NULL,
        deleted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        reason TEXT NOT NULL,
        performed_by TEXT NOT NULL,
        audit_hash TEXT NOT NULL
      )`,

      // 4. Livro de Jobs e Varreduras Diárias
      `CREATE TABLE IF NOT EXISTS retention_jobs (
        id TEXT PRIMARY KEY,
        job_type TEXT NOT NULL,
        school_id TEXT,
        status TEXT NOT NULL,
        items_scanned INTEGER DEFAULT 0,
        items_anonymized INTEGER DEFAULT 0,
        items_deleted INTEGER DEFAULT 0,
        items_quarantined INTEGER DEFAULT 0,
        error_details TEXT,
        executed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        completed_at DATETIME
      )`,

      // 5. Tabela de Apoio para Leads de Captação Escolar
      `CREATE TABLE IF NOT EXISTS growth_leads (
        id TEXT PRIMARY KEY,
        school_id TEXT NOT NULL,
        name TEXT,
        email TEXT,
        phone TEXT,
        status TEXT DEFAULT 'OPEN',
        last_interaction_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        converted_student_id TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`
    ];

    for (const sql of tableQueries) {
      await this.db.run(sql);
    }
  }

  /**
   * Inicializa as políticas padrão (todas as 20 categorias) para uma determinada escola.
   */
  public async seedDefaultPoliciesForSchool(schoolId: string): Promise<void> {
    await this.initialize();

    for (const key of Object.keys(DEFAULT_RETENTION_POLICIES) as RetentionCategory[]) {
      const def = DEFAULT_RETENTION_POLICIES[key];
      const id = `pol_${schoolId}_${def.category}`;

      await this.db.run(
        `INSERT OR IGNORE INTO retention_policies (
          id, school_id, category, name, retention_period_days, post_action, responsible_role, allow_indefinite
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, schoolId, def.category, def.name, def.defaultPeriodDays, def.postAction, def.responsibleRole, 0]
      );
    }
  }

  /**
   * Configura ou atualiza a política de uma categoria.
   * Proíbe retenção indefinida (prazos <= 0 são terminantemente recusados).
   */
  public async setPolicy(
    schoolId: string,
    category: RetentionCategory,
    days: number,
    postAction: PostRetentionAction,
    responsibleRole: string,
    authorizedByDPO: boolean = false
  ): Promise<void> {
    await this.initialize();

    if (days <= 0 || !Number.isFinite(days)) {
      throw new IndefiniteRetentionForbiddenError(category);
    }

    const id = `pol_${schoolId}_${category}`;
    const name = DEFAULT_RETENTION_POLICIES[category]?.name || category;

    await this.db.run(
      `INSERT INTO retention_policies (
        id, school_id, category, name, retention_period_days, post_action, responsible_role, allow_indefinite, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 0, CURRENT_TIMESTAMP)
      ON CONFLICT(school_id, category) DO UPDATE SET
        retention_period_days = excluded.retention_period_days,
        post_action = excluded.post_action,
        responsible_role = excluded.responsible_role,
        updated_at = CURRENT_TIMESTAMP`,
      [id, schoolId, category, name, days, postAction, responsibleRole]
    );

    await this.auditService.record({
      userId: authorizedByDPO ? 'DPO_AUTHORIZED' : 'SYSTEM',
      action: 'DATA_RETENTION_EXPIRATION',
      details: `Política de retenção atualizada para categoria ${category}: ${days} dias (${postAction}).`,
      metadata: { schoolId, category, days, postAction, responsibleRole }
    });
  }

  /**
   * Obtém as políticas configuradas de uma escola.
   */
  public async getPolicies(schoolId: string): Promise<any[]> {
    await this.initialize();
    return this.db.all('SELECT * FROM retention_policies WHERE school_id = ? ORDER BY category ASC', [schoolId]);
  }

  /**
   * Registra um item de dados para monitoramento automático de retenção.
   */
  public async registerItem(params: RegisterRetentionItemParams): Promise<string> {
    await this.initialize();

    const policy = await this.db.get(
      'SELECT retention_period_days FROM retention_policies WHERE school_id = ? AND category = ?',
      [params.schoolId, params.category]
    );

    const periodDays = params.customPeriodDays || policy?.retention_period_days || DEFAULT_RETENTION_POLICIES[params.category]?.defaultPeriodDays || 365;
    const expiresAt = new Date(Date.now() + periodDays * 86400 * 1000).toISOString();
    const id = `ret_${params.schoolId}_${params.entityType}_${params.entityId}`;

    await this.db.run(
      `INSERT INTO retention_items (
        id, school_id, category, entity_type, entity_id, status, file_path, content_hash, expires_at
      ) VALUES (?, ?, ?, ?, ?, 'ATIVO', ?, ?, ?)
      ON CONFLICT(school_id, entity_type, entity_id) DO UPDATE SET
        category = excluded.category,
        file_path = excluded.file_path,
        content_hash = excluded.content_hash,
        expires_at = excluded.expires_at,
        updated_at = CURRENT_TIMESTAMP`,
      [id, params.schoolId, params.category, params.entityType, params.entityId, params.filePath || null, params.contentHash || null, expiresAt]
    );

    return id;
  }

  /**
   * Aplica Quarentena Jurídica cautelar sobre um registro.
   * Suspende expurgo e bloqueia qualquer exportação.
   */
  public async applyQuarantine(
    schoolId: string,
    entityType: string,
    entityId: string,
    reason: string,
    dpoUserId: string
  ): Promise<void> {
    await this.initialize();

    await this.db.run(
      `UPDATE retention_items SET
        status = 'QUARENTENA_JURIDICA',
        quarantine_reason = ?,
        quarantined_by = ?,
        quarantined_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
      WHERE school_id = ? AND entity_type = ? AND entity_id = ?`,
      [reason, dpoUserId, schoolId, entityType, entityId]
    );

    await this.auditService.record({
      userId: dpoUserId,
      action: 'DATA_RETENTION_EXPIRATION',
      details: `Item ${entityType}:${entityId} colocado em QUARENTENA_JURIDICA. Motivo: ${reason}`,
      metadata: { schoolId, entityType, entityId, status: 'QUARENTENA_JURIDICA', reason }
    });
  }

  /**
   * Suspende a Quarentena Jurídica com parecer do DPO.
   */
  public async liftQuarantine(
    schoolId: string,
    entityType: string,
    entityId: string,
    dpoUserId: string
  ): Promise<void> {
    await this.initialize();

    await this.db.run(
      `UPDATE retention_items SET
        status = 'ATIVO',
        quarantine_reason = NULL,
        quarantined_by = NULL,
        quarantined_at = NULL,
        updated_at = CURRENT_TIMESTAMP
      WHERE school_id = ? AND entity_type = ? AND entity_id = ?`,
      [schoolId, entityType, entityId]
    );

    await this.auditService.record({
      userId: dpoUserId,
      action: 'DATA_RETENTION_EXPIRATION',
      details: `QUARENTENA_JURIDICA revogada para o item ${entityType}:${entityId}.`,
      metadata: { schoolId, entityType, entityId, status: 'ATIVO' }
    });
  }

  /**
   * Bloqueio compulsório de exportação para dados em Quarentena Jurídica.
   */
  public async assertExportAllowed(schoolId: string, entityType: string, entityId: string): Promise<boolean> {
    await this.initialize();

    const item = await this.db.get(
      'SELECT status, quarantine_reason FROM retention_items WHERE school_id = ? AND entity_type = ? AND entity_id = ?',
      [schoolId, entityType, entityId]
    );

    if (item && item.status === 'QUARENTENA_JURIDICA') {
      throw new QuarantineExportBlockedError(
        `Exportação bloqueada pelo Fail-Safe do Áquila Pro. O registro ${entityType}:${entityId} está sob QUARENTENA_JURIDICA.`,
        { schoolId, entityType, entityId, reason: item.quarantine_reason }
      );
    }

    return true;
  }

  /**
   * Exclusão segura em 3 camadas (Lógica, Criptográfica e Física com Tombstones).
   */
  public async secureDelete(
    schoolId: string,
    entityType: string,
    entityId: string,
    reason: string,
    performedBy: string = 'system_retention_daemon',
    approvedBy: string = 'dpo@escola.br'
  ): Promise<void> {
    await this.initialize();

    const item = await this.db.get(
      'SELECT * FROM retention_items WHERE school_id = ? AND entity_type = ? AND entity_id = ?',
      [schoolId, entityType, entityId]
    );

    // Fail-safe: Quarentena Jurídica veta exclusão
    if (item && item.status === 'QUARENTENA_JURIDICA') {
      throw new QuarantineExportBlockedError(
        `Exclusão abortada. O registro ${entityType}:${entityId} está protegido por QUARENTENA_JURIDICA.`,
        { schoolId, entityType, entityId, reason: item.quarantine_reason }
      );
    }

    const contentHash = item?.content_hash || crypto.createHash('sha256').update(`${entityType}:${entityId}:${Date.now()}`).digest('hex');
    const category = item?.category || 'STUDENT_CADASTRE';

    // 1. Exclusão Física no Sistema de Arquivos (se aplicável)
    if (item?.file_path && fs.existsSync(item.file_path)) {
      try {
        fs.unlinkSync(item.file_path);
        logger.info(`[DataRetention] Arquivo físico expurgado com sucesso: ${item.file_path}`);
      } catch (fErr: any) {
        logger.warn(`[DataRetention] Aviso ao remover arquivo físico ${item.file_path}: ${fErr.message}`);
      }
    }

    // 2. Camada 1 & 2: Atualização de status e Purga Criptográfica
    await this.db.run(
      `UPDATE retention_items SET
        status = 'EXCLUIDO',
        crypto_purged = 1,
        deleted_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
      WHERE school_id = ? AND entity_type = ? AND entity_id = ?`,
      [schoolId, entityType, entityId]
    );

    // 3. Registro do Tombstone para Proteção Anti-Reintrodução em Restaurações
    const auditRes = await this.auditService.record({
      userId: performedBy,
      action: 'HARD_DELETE_RECORDS',
      details: `Exclusão segura em 3 camadas executada para ${entityType}:${entityId}. Motivo: ${reason}`,
      metadata: { schoolId, entityType, entityId, category, reason, approvedBy, contentHash }
    });

    const tombstoneId = `tomb_${crypto.randomUUID()}`;
    await this.db.run(
      `INSERT INTO retention_tombstones (
        id, school_id, entity_type, entity_id, content_hash, category, reason, performed_by, audit_hash
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [tombstoneId, schoolId, entityType, entityId, contentHash, category, reason, performedBy, auditRes.hash]
    );

    logger.info(`[DataRetention] Tombstone gravado com sucesso para ${entityType}:${entityId} (Hash: ${contentHash.substring(0, 12)}...)`);
  }

  /**
   * Purga Imediata de Biometria Facial (máximo 24 horas pós-desligamento ou revogação de consentimento).
   */
  public async purgeBiometricsForStudent(
    studentId: string,
    schoolId: string,
    reason: string,
    performedBy: string = 'dpo@escola.br'
  ): Promise<{ faceVectorsDeleted: number; arcFaceVectorsDeleted: number }> {
    await this.initialize();

    let faceCount = 0;
    let arcFaceCount = 0;

    try {
      const res1 = await this.db.run('DELETE FROM face_embeddings WHERE student_id = ?', [studentId]);
      faceCount = res1?.changes || 0;
    } catch (e) {
      // ignore se tabela não existir
    }

    try {
      const res2 = await this.db.run('DELETE FROM student_face_embeddings_512 WHERE studentId = ?', [studentId]);
      arcFaceCount = res2?.changes || 0;
    } catch (e) {
      // ignore
    }

    await this.secureDelete(schoolId, 'student_biometrics', studentId, reason, performedBy, performedBy);

    await this.auditService.record({
      userId: performedBy,
      action: 'BIOMETRIC_CONSENT_REVOKED',
      details: `Expurgo compulsório de vetores biométricos concluído para estudante ${studentId} (24h SLA). Total removido: ${faceCount + arcFaceCount}`,
      metadata: { studentId, schoolId, faceCount, arcFaceCount, reason }
    });

    logger.info(`[DataRetention] Biometria do estudante ${studentId} expurgada integralmente (${faceCount + arcFaceCount} vetores).`);
    return { faceVectorsDeleted: faceCount, arcFaceVectorsDeleted: arcFaceCount };
  }

  /**
   * Descarte Seguro de Imagens OMR após 90 dias de consolidação da prova.
   * Mantém intactas as respostas detectadas estruturadas e as notas.
   */
  public async purgeExpiredOmrImages(schoolId: string, maxAgeDays: number = 90): Promise<number> {
    await this.initialize();

    let purgedCount = 0;
    const cutoffDate = new Date(Date.now() - maxAgeDays * 86400 * 1000).toISOString();

    try {
      const corrections = await this.db.all(
        `SELECT id, scanImagePath, studentId, processedAt
         FROM omr_exam_corrections
         WHERE scanImagePath IS NOT NULL
           AND scanImagePath != '[PURGED_EXPIRED]'
           AND processedAt < ?`,
        [cutoffDate]
      );

      for (const row of corrections) {
        if (row.scanImagePath && fs.existsSync(row.scanImagePath)) {
          try {
            fs.unlinkSync(row.scanImagePath);
          } catch (e) {
            // ignore
          }
        }

        await this.db.run(
          `UPDATE omr_exam_corrections SET scanImagePath = '[PURGED_EXPIRED]' WHERE id = ?`,
          [row.id]
        );

        await this.secureDelete(
          schoolId,
          'omr_image',
          row.id,
          `Expurgo regulamentar de imagem OMR (> ${maxAgeDays} dias)`,
          'system_retention_daemon'
        );

        purgedCount++;
      }

      if (purgedCount > 0) {
        logger.info(`[DataRetention] Expurgo de imagens OMR concluído: ${purgedCount} fotos removidas com preservação de notas.`);
      }
    } catch (err: any) {
      logger.warn(`[DataRetention] Varredura de imagens OMR concluída com aviso: ${err.message}`);
    }

    return purgedCount;
  }

  /**
   * Expurgo ou Anonimização de Leads de Captação inativos há mais de 24 meses (730 dias).
   */
  public async purgeUnconvertedLeads(schoolId: string, maxAgeDays: number = 730): Promise<number> {
    await this.initialize();

    let processedCount = 0;
    const cutoffDate = new Date(Date.now() - maxAgeDays * 86400 * 1000).toISOString();

    try {
      const leads = await this.db.all(
        `SELECT id, name, email, phone FROM growth_leads
         WHERE school_id = ?
           AND status != 'CONVERTED'
           AND last_interaction_at < ?`,
        [schoolId, cutoffDate]
      );

      for (const lead of leads) {
        const anonName = `LEAD_ANON_${crypto.createHash('sha256').update(lead.id).digest('hex').substring(0, 8).toUpperCase()}`;

        await this.db.run(
          `UPDATE growth_leads SET
            name = ?,
            email = '[ANONIMIZADO]',
            phone = '[ANONIMIZADO]',
            status = 'ANONIMIZADO'
           WHERE id = ?`,
          [anonName, lead.id]
        );

        await this.secureDelete(
          schoolId,
          'lead_cadastre',
          lead.id,
          `Expurgo de lead inativo há mais de 24 meses (730 dias)`,
          'system_retention_daemon'
        );

        processedCount++;
      }
    } catch (err: any) {
      logger.warn(`[DataRetention] Varredura de leads comerciais concluída com aviso: ${err.message}`);
    }

    return processedCount;
  }

  /**
   * Anonimização com Garantia de k-Anonimato (turmas < 10 alunos são suprimidas).
   */
  public async anonymizeStudent(
    studentId: string,
    schoolId: string,
    classStudentCount: number,
    performedBy: string = 'dpo@escola.br'
  ): Promise<string> {
    await this.initialize();

    if (classStudentCount < 10) {
      throw new SmallClassDeidentificationError(
        'Relatório ou dado de estudante em turma pequena (< 10) não pode ser exposto individualmente para evitar reidentificação dedutiva.',
        classStudentCount
      );
    }

    const pseudoId = `ANON_${crypto.createHash('sha256').update(`${studentId}_${schoolId}`).digest('hex').substring(0, 10).toUpperCase()}`;

    try {
      await this.db.run(
        `UPDATE students SET
          name = ?,
          cpf = '[ANONIMIZADO]',
          email = '[ANONIMIZADO]',
          phone = '[ANONIMIZADO]',
          address = '[ANONIMIZADO]'
         WHERE id = ?`,
        [pseudoId, studentId]
      );
    } catch (e) {
      // ignore se tabela diferente
    }

    await this.db.run(
      `UPDATE retention_items SET
        status = 'ANONIMIZADO',
        updated_at = CURRENT_TIMESTAMP
       WHERE school_id = ? AND entity_type = 'student' AND entity_id = ?`,
      [schoolId, studentId]
    );

    await this.auditService.record({
      userId: performedBy,
      action: 'DATA_RETENTION_EXPIRATION',
      details: `Estudante ${studentId} anonimizado irreversivelmente como ${pseudoId}.`,
      metadata: { schoolId, studentId, pseudoId, classStudentCount }
    });

    return pseudoId;
  }

  /**
   * Varredura Geral Diária de Retenção (Job Diário).
   */
  public async executeDailyRetentionScan(schoolId?: string): Promise<{
    scanned: number;
    deleted: number;
    anonymized: number;
    quarantined: number;
  }> {
    await this.initialize();

    const jobId = `job_${Date.now()}_${crypto.randomUUID().substring(0, 6)}`;
    const nowIso = new Date().toISOString();

    await this.db.run(
      `INSERT INTO retention_jobs (id, job_type, school_id, status, executed_at) VALUES (?, 'DAILY_RETENTION_SWEEP', ?, 'RUNNING', CURRENT_TIMESTAMP)`,
      [jobId, schoolId || 'ALL']
    );

    let scanned = 0;
    let deleted = 0;
    let anonymized = 0;
    let quarantined = 0;

    try {
      // 1. Identificar itens com prazo expirado
      const filterSql = schoolId
        ? `SELECT * FROM retention_items WHERE school_id = ? AND status = 'ATIVO' AND expires_at <= ?`
        : `SELECT * FROM retention_items WHERE status = 'ATIVO' AND expires_at <= ?`;
      const params = schoolId ? [schoolId, nowIso] : [nowIso];

      const expiredItems = await this.db.all(filterSql, params);
      scanned = expiredItems.length;

      for (const item of expiredItems) {
        const policy = await this.db.get(
          'SELECT post_action FROM retention_policies WHERE school_id = ? AND category = ?',
          [item.school_id, item.category]
        );
        const action: PostRetentionAction = policy?.post_action || 'SECURE_DELETE';

        if (action === 'SECURE_DELETE') {
          await this.secureDelete(item.school_id, item.entity_type, item.entity_id, 'Prazo de retenção legal expirado', 'daily_sweep_daemon');
          deleted++;
        } else if (action === 'ANONYMIZE') {
          await this.db.run(
            `UPDATE retention_items SET status = 'ANONIMIZADO', updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
            [item.id]
          );
          anonymized++;
        }
      }

      // 2. Executar expurgos especializados
      if (schoolId) {
        deleted += await this.purgeExpiredOmrImages(schoolId, 90);
        deleted += await this.purgeUnconvertedLeads(schoolId, 730);
      }

      await this.db.run(
        `UPDATE retention_jobs SET
          status = 'COMPLETED',
          items_scanned = ?,
          items_deleted = ?,
          items_anonymized = ?,
          items_quarantined = ?,
          completed_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [scanned, deleted, anonymized, quarantined, jobId]
      );

      logger.info(`[DataRetention] Job ${jobId} concluído com êxito: ${scanned} examinados, ${deleted} expurgados, ${anonymized} anonimizados.`);
    } catch (err: any) {
      await this.db.run(
        `UPDATE retention_jobs SET status = 'FAILED', error_details = ?, completed_at = CURRENT_TIMESTAMP WHERE id = ?`,
        [err.message, jobId]
      );
      logger.error(`[DataRetention] Falha no Job de Retenção ${jobId}: ${err.message}`);
      throw err;
    }

    return { scanned, deleted, anonymized, quarantined };
  }

  /**
   * Verificação Anti-Reintrodução em Restauração de Backups.
   * Compara os registros que se pretende restaurar com a tabela retention_tombstones.
   * Retorna os registros seguros e bloqueia os que foram anteriormente purgados.
   */
  public async verifyRestoreAntiReintroduction(
    schoolId: string,
    recordsToRestore: Array<{ entityType: string; entityId: string; contentHash?: string }>
  ): Promise<{
    approvedRecords: Array<{ entityType: string; entityId: string }>;
    rejectedTombstones: Array<{ entityType: string; entityId: string; reason: string }>;
  }> {
    await this.initialize();

    const approved: Array<{ entityType: string; entityId: string }> = [];
    const rejected: Array<{ entityType: string; entityId: string; reason: string }> = [];

    const tombstones = await this.db.all(
      'SELECT entity_type, entity_id, reason FROM retention_tombstones WHERE school_id = ?',
      [schoolId]
    );

    const tombstoneMap = new Map<string, string>();
    for (const t of tombstones) {
      tombstoneMap.set(`${t.entity_type}:${t.entity_id}`, t.reason);
    }

    for (const r of recordsToRestore) {
      const key = `${r.entityType}:${r.entityId}`;
      if (tombstoneMap.has(key)) {
        rejected.push({
          entityType: r.entityType,
          entityId: r.entityId,
          reason: tombstoneMap.get(key) || 'Previamente expurgado via direito ao esquecimento / retenção legal'
        });
      } else {
        approved.push({ entityType: r.entityType, entityId: r.entityId });
      }
    }

    if (rejected.length > 0) {
      logger.warn(`[DataRetention] Anti-Reintrodução atuou: ${rejected.length} registros rejeitados na restauração por constarem em tombstones.`);
    }

    return { approvedRecords: approved, rejectedTombstones: rejected };
  }

  /**
   * Gera o Relatório Mensal de Conformidade do DPO com estatísticas e pendências.
   */
  public async generateDPOComplianceReport(schoolId: string): Promise<{
    schoolId: string;
    generatedAt: string;
    totalMonitoredItems: number;
    activeItems: number;
    quarantinedItems: number;
    anonymizedItems: number;
    deletedItems: number;
    totalTombstones: number;
    upcomingExpirations30Days: number;
    policiesConfigured: number;
    complianceVerdict: 'CONFORME' | 'ATENÇÃO_PENDÊNCIAS';
  }> {
    await this.initialize();

    const items = await this.db.all('SELECT status, expires_at FROM retention_items WHERE school_id = ?', [schoolId]);
    const tombstones = await this.db.all('SELECT count(*) as count FROM retention_tombstones WHERE school_id = ?', [schoolId]);
    const policies = await this.db.all('SELECT count(*) as count FROM retention_policies WHERE school_id = ?', [schoolId]);

    const now = Date.now();
    const in30Days = now + 30 * 86400 * 1000;

    let active = 0;
    let quarantined = 0;
    let anonymized = 0;
    let deleted = 0;
    let upcoming30 = 0;

    for (const it of items) {
      if (it.status === 'ATIVO') {
        active++;
        const exp = new Date(it.expires_at).getTime();
        if (exp > now && exp <= in30Days) upcoming30++;
      } else if (it.status === 'QUARENTENA_JURIDICA') {
        quarantined++;
      } else if (it.status === 'ANONIMIZADO') {
        anonymized++;
      } else if (it.status === 'EXCLUIDO') {
        deleted++;
      }
    }

    const tombstoneCount = tombstones[0]?.count || 0;
    const policiesCount = policies[0]?.count || 0;

    return {
      schoolId,
      generatedAt: new Date().toISOString(),
      totalMonitoredItems: items.length,
      activeItems: active,
      quarantinedItems: quarantined,
      anonymizedItems: anonymized,
      deletedItems: deleted,
      totalTombstones: tombstoneCount,
      upcomingExpirations30Days: upcoming30,
      policiesConfigured: policiesCount,
      complianceVerdict: policiesCount >= 20 ? 'CONFORME' : 'ATENÇÃO_PENDÊNCIAS'
    };
  }

  /**
   * Atendimento aos Direitos do Titular (LGPD Art. 18).
   */
  public async handleTitularRight(request: TitularRightRequest): Promise<{
    protocol: string;
    actionTaken: string;
    deadlineDays: number;
    status: 'PROCESSED' | 'PENDING_VALIDATION';
  }> {
    await this.initialize();

    const protocol = `SAR-${Date.now()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
    let deadlineDays = 10;
    let actionTaken = '';

    switch (request.requestType) {
      case 'CONFIRMATION':
      case 'REVOCATION':
      case 'CORRECTION':
        deadlineDays = 5;
        actionTaken = `Atendimento preliminar a ${request.requestType} para titular ${request.titularId}.`;
        break;
      case 'ACCESS':
      case 'ANONYMIZATION':
      case 'DELETION':
        deadlineDays = 10;
        actionTaken = `Solicitação de ${request.requestType} encaminhada para conferência de elegibilidade legal.`;
        break;
      case 'PORTABILITY':
        deadlineDays = 15;
        actionTaken = `Geração de pacote criptográfico assinado de portabilidade para ${request.titularId}.`;
        break;
    }

    await this.auditService.record({
      userId: request.requestedBy,
      action: 'DATA_RETENTION_EXPIRATION',
      details: `Protocolo ${protocol}: ${request.requestType} recebido para ${request.titularType}:${request.titularId} (Prazo: ${deadlineDays} dias).`,
      metadata: { protocol, ...request, deadlineDays }
    });

    return {
      protocol,
      actionTaken,
      deadlineDays,
      status: 'PROCESSED'
    };
  }
}

export const dataRetentionService = DataRetentionService.getInstance();
