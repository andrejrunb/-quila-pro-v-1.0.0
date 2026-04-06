import { logger } from '../main/logger';
import * as crypto from 'crypto';

export interface LedgerBlock {
  index: number;
  timestamp: string;
  data: any;
  previousHash: string;
  hash: string;
}

/**
 * SovereignLedger — Persistência Imutável (Fase 714)
 * Implementa uma Hash-Chain local para garantir que registros pedagógicos não sejam alterados.
 */
export class SovereignLedger {
  private static instance: SovereignLedger;
  private chain: LedgerBlock[] = [];

  private constructor() {
    this.createGenesisBlock();
  }

  public static getInstance(): SovereignLedger {
    if (!SovereignLedger.instance) {
      SovereignLedger.instance = new SovereignLedger();
    }
    return SovereignLedger.instance;
  }

  private createGenesisBlock() {
    const genesis: LedgerBlock = {
      index: 0,
      timestamp: new Date().toISOString(),
      data: 'Áquila Pro Singularity Genesis',
      previousHash: '0',
      hash: this.calculateHash(0, '0', new Date().toISOString(), 'Genesis')
    };
    this.chain.push(genesis);
    logger.info('[Ledger] Gênese da Corrente Soberana estabelecida.');
  }

  private calculateHash(index: number, previousHash: string, timestamp: string, data: any): string {
    return crypto
      .createHash('sha256')
      .update(index + previousHash + timestamp + JSON.stringify(data))
      .digest('hex');
  }

  public addEntry(data: any) {
    const previousBlock = this.chain[this.chain.length - 1];
    const index = previousBlock.index + 1;
    const timestamp = new Date().toISOString();
    const hash = this.calculateHash(index, previousBlock.hash, timestamp, data);

    const newBlock: LedgerBlock = {
      index,
      timestamp,
      data,
      previousHash: previousBlock.hash,
      hash
    };

    this.chain.push(newBlock);
    logger.info(`[Ledger] Novo bloco adicionado: ${index} | Hash: ${hash.substring(0, 8)}...`);
    return newBlock;
  }

  public getChainStatus() {
    return {
      blockCount: this.chain.length,
      lastHash: this.chain[this.chain.length - 1].hash,
      isValid: this.validateChain()
    };
  }

  private validateChain(): boolean {
    for (let i = 1; i < this.chain.length; i++) {
      const current = this.chain[i];
      const previous = this.chain[i - 1];

      if (current.hash !== this.calculateHash(current.index, current.previousHash, current.timestamp, current.data)) return false;
      if (current.previousHash !== previous.hash) return false;
    }
    return true;
  }
}

export const sovereignLedger = SovereignLedger.getInstance();
