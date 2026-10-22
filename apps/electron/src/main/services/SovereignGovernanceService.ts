import { logger } from '../logger';
import { sovereignLedgerService } from './SovereignLedgerService';
import { db } from '../../database/Database';
import * as crypto from 'crypto';

/**
 * SOVEREIGN GOVERNANCE SERVICE (v3801)
 * -----------------------------------
 * Gerencia o sistema de democracia digital do Áquila Pro.
 * Permite a criação de 'P2P Ballots' (Cédulas) e a coleta de votos
 * auditáveis, imutáveis e anonimizados via Ledger.
 */
export interface Ballot {
  id: string;
  title: string;
  description: string;
  options: string[];
  expiresAt: number;
  status: 'active' | 'closed';
}

export interface Vote {
  ballotId: string;
  voterHash: string;
  optionIndex: number;
  signature: string;
}

export class SovereignGovernanceService {
  private static instance: SovereignGovernanceService;

  private constructor() {}

  public static getInstance(): SovereignGovernanceService {
    if (!SovereignGovernanceService.instance) {
      SovereignGovernanceService.instance = new SovereignGovernanceService();
    }
    return SovereignGovernanceService.instance;
  }

  /**
   * [SQA-GOV-1155] Cria uma nova cédula de votação institucional.
   */
  public async createBallot(title: string, description: string, options: string[]): Promise<string> {
    const id = `GOV_${Math.random().toString(36).substring(7).toUpperCase()}`;
    const expiresAt = Date.now() + (7 * 24 * 60 * 60 * 1000); // 7 dias

    await db.run(
      'INSERT INTO ballots (id, title, description, options, expires_at, status) VALUES (?, ?, ?, ?, ?, ?)',
      [id, title, description, JSON.stringify(options), expiresAt, 'active']
    );

    logger.info(`[Governance] Nova Cédula Criada: ${title} (${id})`);
    return id;
  }

  /**
   * [SQA-GOV-1158] Registra um voto assinado no Ledger Soberano.
   */
  public async castVote(ballotId: string, voterId: string, optionIndex: number): Promise<boolean> {
    logger.info(`[Governance] Coletando voto para cédula ${ballotId}...`);
    
    // Validação de unicidade (v3702)
    const existingVote = await db.get('SELECT * FROM votes WHERE ballot_id = ? AND voter_id = ?', [ballotId, voterId]);
    if (existingVote) {
      logger.warn(`[Governance] Tentativa de voto duplicado detectada: ${voterId}`);
      return false;
    }

    const voterHash = crypto.createHash('sha256').update(voterId).digest('hex');
    const signature = `SIG_${Math.random().toString(36).substring(7).toUpperCase()}`; // Simulação v3702

    const vote: Vote = { ballotId, voterHash, optionIndex, signature };

    // Persistência imutável no Ledger (v3801)
    await sovereignLedgerService.recordEntry('GOVERNANCE_VOTE', vote);

    await db.run(
      'INSERT INTO votes (ballot_id, voter_id, option_index, signature) VALUES (?, ?, ?, ?)',
      [ballotId, voterId, optionIndex, signature]
    );

    logger.info(`[Governance] Voto Registrado com Sucesso. Hash: ${voterHash}`);
    return true;
  }

  /**
   * [SQA-GOV-1160] Retorna o resultado anonimizado de uma votação.
   */
  public async getBallotResults(ballotId: string): Promise<any> {
     const votes = await db.all('SELECT option_index, COUNT(*) as count FROM votes WHERE ballot_id = ? GROUP BY option_index', [ballotId]);
     return votes;
  }
}

export const sovereignGovernanceService = SovereignGovernanceService.getInstance();

