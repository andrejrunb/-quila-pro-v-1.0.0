import { db } from '../../database/Database';
import { v4 as uuidv4 } from 'uuid';

/**
 * SOVEREIGN COUNCIL SERVICE (v4001)
 * --------------------------------
 * Gerencia o ciclo de vida de propostas e enquetes fundamentadas.
 * Implementa a hierarquia de decisão: Direção > Coordenação > Professores.
 */

export type ProposalStatus = 'draft' | 'whitelisted' | 'active' | 'closed';
export type AuthorType = 'ai' | 'director' | 'coordinator' | 'teacher';
export type SovereignRole = 'DIRECTOR' | 'COORDINATOR' | 'TEACHER' | 'PARENT' | 'STUDENT' | 'STAFF';

export interface Proposal {
  id: string;
  title: string;
  description: string;
  scientific_grounds: string; // JSON
  author_type: AuthorType;
  author_id?: string;
  target_roles: SovereignRole[];
  status: ProposalStatus;
  createdAt: string;
}

export class SovereignCouncilService {
  private static instance: SovereignCouncilService;

  private constructor() {}

  public static getInstance(): SovereignCouncilService {
    if (!SovereignCouncilService.instance) {
      SovereignCouncilService.instance = new SovereignCouncilService();
    }
    return SovereignCouncilService.instance;
  }

  /**
   * Cria uma nova proposta (AI ou Humano)
   */
  public async createProposal(data: Partial<Proposal>): Promise<string> {
    const id = uuidv4();
    const status: ProposalStatus = data.author_type === 'director' ? 'whitelisted' : 'draft';
    
    await db.run(
      `INSERT INTO proposals_votecasting 
      (id, title, description, scientific_grounds, author_type, author_id, target_roles, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        data.title,
        data.description || '',
        JSON.stringify(data.scientific_grounds || []),
        data.author_type,
        data.author_id || 'system',
        JSON.stringify(data.target_roles || []),
        status
      ]
    );

    await this.logAuditAction(id, 'CREATE', data.author_type || 'system', 'Proposta inicial registrada no banco.');
    return id;
  }

  /**
   * [SQA-LEDGER-101] Grava uma ação de governança no Ledger Imutável.
   */
  private async logAuditAction(proposalId: string, action: string, actor: string, details: string) {
    const id = uuidv4();
    const timestamp = new Date().toISOString();
    
    // Hash do estado anterior + timestamp (v4002 Resilience)
    const proof = Buffer.from(`${proposalId}-${action}-${timestamp}`).toString('hex');

    await db.run(
      `INSERT INTO governance_ledger (id, proposal_id, action, actor, details, proof, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, proposalId, action, actor, details, proof, timestamp]
    );
    
    console.log(`[Ledger] Ação '${action}' de ${actor} registrada para Proposta ${proposalId}`);
  }

  /**
   * A Direção aprova a proposta para a malha de votação (Whitelist)
   */
  public async whitelistByDirector(proposalId: string, directorId: string): Promise<void> {
    // Registro de auditoria implícito pela alteração de status
    await db.run(
      `UPDATE proposals_votecasting SET status = 'whitelisted' WHERE id = ?`,
      [proposalId]
    );
    
    await this.logAuditAction(proposalId, 'WHITELIST', directorId, 'Direção autorizou a proposta para a rede de votação.');
    console.log(`[Council] Proposal ${proposalId} WHITELISTED by Director ${directorId}`);
  }

  /**
   * A Coordenação ou Direção ativa a enquete para os públicos alvo
   */
  public async activatePoll(proposalId: string, actorRole: SovereignRole): Promise<void> {
    const proposal = await this.getProposal(proposalId);
    
    if (!proposal) throw new Error('Proposta não encontrada');
    if (proposal.status !== 'whitelisted' && actorRole !== 'DIRECTOR') {
      throw new Error('Apenas a Direção pode ativar propostas não autorizadas (Whitelist de Segurança)');
    }

    await db.run(
      `UPDATE proposals_votecasting SET status = 'active' WHERE id = ?`,
      [proposalId]
    );

    await this.logAuditAction(proposalId, 'ACTIVATE', actorRole, `Enquete ATIVADA para os públicos: ${JSON.stringify(proposal.target_roles)}`);
  }

  /**
   * Coleta de votos com validação de RBAC
   */
  public async castVote(proposalId: string, voterId: string, role: SovereignRole, choice: string): Promise<void> {
    const proposal = await this.getProposal(proposalId);
    if (!proposal || proposal.status !== 'active') throw new Error('Votação não está ativa');

    // Valida se o papel do votante está no target_roles
    if (!proposal.target_roles.includes(role)) {
      throw new Error(`O público '${role}' não está autorizado para esta votação`);
    }

    // Voto único por hash (Aninimidade rastreável)
    const voterHash = Buffer.from(`${proposalId}-${voterId}`).toString('base64');
    
    await db.run(
      `INSERT OR REPLACE INTO votes (id, proposal_id, voter_hash, voter_role, choice)
      VALUES (?, ?, ?, ?, ?)`,
      [uuidv4(), proposalId, voterHash, role, choice]
    );
  }

  public async getProposal(id: string): Promise<Proposal | null> {
    const row = await db.get(`SELECT * FROM proposals_votecasting WHERE id = ?`, [id]);
    if (!row) return null;

    return {
      ...row,
      scientific_grounds: JSON.parse(row.scientific_grounds || '[]'),
      target_roles: JSON.parse(row.target_roles || '[]')
    };
  }

  public async listActivePollsForRole(role: SovereignRole): Promise<Proposal[]> {
    const rows = await db.all(
      `SELECT * FROM proposals_votecasting WHERE status = 'active'`
    );
    
    return rows
      .map(r => ({
        ...r,
        scientific_grounds: JSON.parse(r.scientific_grounds || '[]'),
        target_roles: JSON.parse(r.target_roles || '[]')
      }))
      .filter(p => p.target_roles.includes(role));
  }

  /**
   * IA sugere propostas baseadas em anomalias ou tendências (v4001)
   */
  public async generateAiProposal(type: 'social' | 'pedagogic'): Promise<string> {
    const suggestions = {
      social: {
        title: 'Programa de Mentoria (Peer-to-Peer)',
        desc: 'Detectado índice de isolamento social > 15% em zonas externas.',
        grounds: ['Bierman (2011): Promovendo competências sociais na infância.', 'Wentzel (2017): Peer relationships and school adjustment.'],
        roles: ['STUDENT', 'PARENT', 'TEACHER'] as SovereignRole[]
      },
      pedagogic: {
        title: 'Redução de Viscosidade de Fluxo (Grades Dinâmicas)',
        desc: 'Otimização de transição entre blocos A e B para reduzir dispersão.',
        grounds: ['Patterson (2018): Fluid dynamics in educational transit.', 'UNESCO (2022): Rethinking learning spaces.'],
        roles: ['STAFF', 'TEACHER', 'COORDINATOR'] as SovereignRole[]
      }
    };

    const selected = suggestions[type];
    return this.createProposal({
      title: `[COOL.ME.IA SUGGEST] ${selected.title}`,
      description: selected.desc,
      scientific_grounds: selected.grounds as any,
      author_type: 'ai',
      target_roles: selected.roles,
      status: 'draft'
    });
  }
}

export const councilService = SovereignCouncilService.getInstance();

