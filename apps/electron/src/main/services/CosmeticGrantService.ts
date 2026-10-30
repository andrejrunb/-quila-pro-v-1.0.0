/**
 * CosmeticGrantService — Serviço Determinístico de Concessão de Cosméticos
 * =========================================================================
 * Regras de Governança e Compliance (ECA Digital Lei nº 15.211/2025, Decreto nº 12.880/2026, LGPD):
 *  1. Zero Pay-to-Win: Cosméticos NUNCA concedem vantagem acadêmica, nota, TRI ou tempo extra (effects === []).
 *  2. Propriedade Permanente: Nenhum item expira ou é perdido por ausência (expiresAt === null).
 *  3. Vedação de Mecânicas Predatórias: Zero loot boxes, gacha ou roletas pagas.
 *  4. Determinismo Estrito: Concessões são baseadas em regras e conquistas formativas objetivas (sem IA estocástica).
 *  5. Trilha de Auditoria Criptográfica: Toda concessão grava audit log imutável.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { ZeroBypassAuditService } from './ZeroBypassAuditService';

export type CosmeticCategory =
  | 'avatar_skin'
  | 'avatar_frame'
  | 'profile_theme'
  | 'title'
  | 'emote'
  | 'arena_theme';

export type CosmeticRarity =
  | 'common'
  | 'rare'
  | 'epic'
  | 'legendary'
  | 'champion';

export type AcquisitionType = 'achievement' | 'coins';

export interface CosmeticItemRecord {
  itemId: string;
  name: string;
  category: CosmeticCategory;
  rarity: CosmeticRarity;
  acquisitionType: AcquisitionType;
  priceCoins: number;
  purchaseAllowed: boolean;
  schoolId: string;
  subject: string | null;
  visualAssetHash: string;
  effects: string[];
  tradeable: false;
  refundable: false;
  expiresAt: null;
  requiredAchievement: string | null;
  description?: string;
  audit: {
    createdBy: string;
    createdAt: string;
    grantPolicy: string;
  };
}

export interface CosmeticCatalogData {
  version: string;
  updatedAt: string;
  schoolId: string;
  compliance: Record<string, unknown>;
  totalItems: number;
  categories: Record<string, number>;
  items: CosmeticItemRecord[];
}

export interface CosmeticGrantAuditEntry {
  auditId: string;
  studentId: string;
  itemId: string;
  itemName: string;
  category: CosmeticCategory;
  origin: 'achievement' | 'purchase' | 'school_direct_grant';
  coinsSpent: number;
  grantedBy: string;
  timestamp: string;
  signature: string;
}

export interface StudentCosmeticState {
  studentId: string;
  unlockedItemIds: string[];
  equippedSlots: Partial<Record<CosmeticCategory, string>>;
}

export class CosmeticGrantService {
  private static instance: CosmeticGrantService | null = null;
  private catalog: Map<string, CosmeticItemRecord> = new Map();
  private auditLog: CosmeticGrantAuditEntry[] = [];
  private studentStates: Map<string, StudentCosmeticState> = new Map();
  private readonly hmacSecret: string;
  private readonly auditService: ZeroBypassAuditService;

  public static getInstance(db?: any, customCatalogPath?: string): CosmeticGrantService {
    if (!CosmeticGrantService.instance) {
      CosmeticGrantService.instance = new CosmeticGrantService(db, customCatalogPath);
    }
    return CosmeticGrantService.instance;
  }

  public constructor(db?: any, customCatalogPath?: string) {
    this.auditService = ZeroBypassAuditService.getInstance(db);
    this.hmacSecret = process.env.AQUILA_COSMETICS_HMAC_SECRET || 'aquila-cosmetics-deterministic-key-2026';
    this.loadCatalog(customCatalogPath);
  }

  /**
   * Carrega e valida rigorosamente o catálogo versionado em disco.
   */
  public loadCatalog(catalogPath?: string): void {
    const defaultPath = path.resolve(__dirname, '../../database/cosmetics.catalog.json');
    const resolvedPath = catalogPath || defaultPath;

    if (!fs.existsSync(resolvedPath)) {
      throw new Error(`CATALOG_NOT_FOUND: Arquivo de catálogo de cosméticos não encontrado em '${resolvedPath}'`);
    }

    const raw = fs.readFileSync(resolvedPath, 'utf-8');
    const data: CosmeticCatalogData = JSON.parse(raw);

    this.catalog.clear();

    for (const item of data.items) {
      this.validateCatalogItem(item);
      this.catalog.set(item.itemId, item);
    }
  }

  /**
   * Validação estrita de compliance de cada item contra o schema e governança escolar.
   */
  public validateCatalogItem(item: CosmeticItemRecord): void {
    if (!item.itemId || typeof item.itemId !== 'string') {
      throw new Error(`INVALID_ITEM: itemId obrigatório`);
    }
    if (!item.name || typeof item.name !== 'string') {
      throw new Error(`INVALID_ITEM: name obrigatório para ${item.itemId}`);
    }
    const validRarities: CosmeticRarity[] = ['common', 'rare', 'epic', 'legendary', 'champion'];
    if (!validRarities.includes(item.rarity)) {
      throw new Error(`INVALID_ITEM: Rarity '${item.rarity}' inválida para ${item.itemId}. Valores permitidos: ${validRarities.join(', ')}`);
    }
    if (item.effects && item.effects.length > 0) {
      throw new Error(`COMPLIANCE_VIOLATION (Zero Pay-to-Win): Item '${item.itemId}' não pode conter efeitos mecânicos ou avaliativos.`);
    }
    if (item.expiresAt !== null) {
      throw new Error(`COMPLIANCE_VIOLATION (Propriedade Permanente): Item '${item.itemId}' não pode expirar.`);
    }
    if (item.tradeable !== false || item.refundable !== false) {
      throw new Error(`COMPLIANCE_VIOLATION: Item '${item.itemId}' não pode ser negociável ou reembolsável.`);
    }
    if (item.acquisitionType === 'achievement') {
      if (!item.requiredAchievement) {
        throw new Error(`INVALID_ITEM: requiredAchievement obrigatório para itens conquistáveis em ${item.itemId}`);
      }
      if (item.priceCoins !== 0) {
        throw new Error(`COMPLIANCE_VIOLATION: Item de conquista '${item.itemId}' deve ter priceCoins === 0.`);
      }
      if (item.purchaseAllowed !== false) {
        throw new Error(`COMPLIANCE_VIOLATION: Item de conquista '${item.itemId}' deve ter purchaseAllowed === false.`);
      }
    } else if (item.acquisitionType === 'coins') {
      if (item.priceCoins === undefined || item.priceCoins <= 0) {
        throw new Error(`INVALID_ITEM: priceCoins deve ser maior que zero para itens compráveis em ${item.itemId}`);
      }
      if (item.purchaseAllowed !== true) {
        throw new Error(`COMPLIANCE_VIOLATION: Item comprável por moeda '${item.itemId}' deve ter purchaseAllowed === true.`);
      }
    } else {
      throw new Error(`INVALID_ITEM: acquisitionType '${item.acquisitionType}' desconhecido para ${item.itemId}`);
    }
  }

  public getCatalog(): CosmeticItemRecord[] {
    return Array.from(this.catalog.values());
  }

  public getItem(itemId: string): CosmeticItemRecord | undefined {
    return this.catalog.get(itemId);
  }

  public getOrCreateStudentState(studentId: string): StudentCosmeticState {
    let state = this.studentStates.get(studentId);
    if (!state) {
      state = {
        studentId,
        unlockedItemIds: ['moldura_edicao_escolar'], // item básico inicial escolar
        equippedSlots: { avatar_frame: 'moldura_edicao_escolar' }
      };
      this.studentStates.set(studentId, state);
    }
    return state;
  }

  /**
   * Concessão determinística baseada em Conquista Formativa (Zero-AI Hallucination).
   */
  public grantByAchievement(
    studentId: string,
    achievementCode: string,
    grantedBy = 'system_deterministic_rule'
  ): {
    success: boolean;
    grantedItems: CosmeticItemRecord[];
    alreadyOwned: boolean;
    auditRecords: CosmeticGrantAuditEntry[];
  } {
    const matchingItems = Array.from(this.catalog.values()).filter(
      i => i.acquisitionType === 'achievement' && i.requiredAchievement === achievementCode
    );

    if (matchingItems.length === 0) {
      return { success: false, grantedItems: [], alreadyOwned: false, auditRecords: [] };
    }

    const state = this.getOrCreateStudentState(studentId);
    const newItems: CosmeticItemRecord[] = [];
    const auditRecords: CosmeticGrantAuditEntry[] = [];

    for (const item of matchingItems) {
      if (state.unlockedItemIds.includes(item.itemId)) {
        continue; // idempotente: nunca duplica
      }

      state.unlockedItemIds.push(item.itemId);
      newItems.push(item);

      const auditEntry = this.createAuditEntry(
        studentId,
        item,
        'achievement',
        0,
        grantedBy
      );
      this.auditLog.push(auditEntry);
      auditRecords.push(auditEntry);

      // Trilha ZeroBypass
      this.auditService.record({
        userId: studentId,
        action: 'COSMETIC_ACHIEVEMENT_GRANTED',
        details: `Item cosmético '${item.name}' (${item.itemId}) desbloqueado por conquista '${achievementCode}'`,
        metadata: { itemId: item.itemId, achievementCode, grantedBy }
      }).catch(() => {});
    }

    return {
      success: true,
      grantedItems: newItems,
      alreadyOwned: newItems.length === 0,
      auditRecords
    };
  }

  /**
   * Compra determinística por Moedas Pedagógicas (Aureus).
   */
  public purchaseByCoins(
    studentId: string,
    itemId: string,
    currentBalance: number,
    buyerId = studentId
  ): {
    success: boolean;
    item?: CosmeticItemRecord;
    newBalance: number;
    auditRecord?: CosmeticGrantAuditEntry;
    error?: string;
  } {
    const item = this.catalog.get(itemId);
    if (!item) {
      return { success: false, newBalance: currentBalance, error: 'ITEM_NOT_FOUND' };
    }

    if (item.acquisitionType !== 'coins' || !item.purchaseAllowed) {
      return {
        success: false,
        newBalance: currentBalance,
        error: 'ITEM_ACQUISITION_NOT_COINS: Este item só pode ser obtido por conquista pedagógica formativa.'
      };
    }

    const state = this.getOrCreateStudentState(studentId);
    if (state.unlockedItemIds.includes(itemId)) {
      return { success: false, newBalance: currentBalance, error: 'ALREADY_OWNED: O estudante já possui este item.' };
    }

    if (currentBalance < item.priceCoins) {
      return {
        success: false,
        newBalance: currentBalance,
        error: `INSUFFICIENT_FUNDS: Saldo insuficiente (${currentBalance} < ${item.priceCoins} Aureus).`
      };
    }

    const newBalance = currentBalance - item.priceCoins;
    state.unlockedItemIds.push(itemId);

    const auditEntry = this.createAuditEntry(
      studentId,
      item,
      'purchase',
      item.priceCoins,
      buyerId
    );
    this.auditLog.push(auditEntry);

    // Trilha ZeroBypass
    this.auditService.record({
      userId: studentId,
      action: 'COSMETIC_PURCHASED_BY_COINS',
      details: `Compra do item cosmético '${item.name}' (${item.itemId}) por ${item.priceCoins} Aureus`,
      metadata: { itemId: item.itemId, priceCoins: item.priceCoins, remainingBalance: newBalance }
    }).catch(() => {});

    return {
      success: true,
      item,
      newBalance,
      auditRecord: auditEntry
    };
  }

  /**
   * Equipa cosmético no slot correspondente da sua categoria.
   */
  public equipItem(studentId: string, itemId: string): { success: boolean; equippedSlots: Record<string, string>; error?: string } {
    const item = this.catalog.get(itemId);
    if (!item) {
      return { success: false, equippedSlots: {}, error: 'ITEM_NOT_FOUND' };
    }

    const state = this.getOrCreateStudentState(studentId);
    if (!state.unlockedItemIds.includes(itemId)) {
      return { success: false, equippedSlots: state.equippedSlots as Record<string, string>, error: 'NOT_OWNED: Item não desbloqueado.' };
    }

    state.equippedSlots[item.category] = itemId;

    return {
      success: true,
      equippedSlots: state.equippedSlots as Record<string, string>
    };
  }

  public getStudentState(studentId: string): StudentCosmeticState {
    return { ...this.getOrCreateStudentState(studentId) };
  }

  public getAuditTrail(studentId?: string): CosmeticGrantAuditEntry[] {
    if (studentId) {
      return this.auditLog.filter(a => a.studentId === studentId);
    }
    return [...this.auditLog];
  }

  private createAuditEntry(
    studentId: string,
    item: CosmeticItemRecord,
    origin: 'achievement' | 'purchase' | 'school_direct_grant',
    coinsSpent: number,
    grantedBy: string
  ): CosmeticGrantAuditEntry {
    const timestamp = new Date().toISOString();
    const auditId = `grant_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const payload = `${auditId}|${studentId}|${item.itemId}|${origin}|${coinsSpent}|${grantedBy}|${timestamp}`;
    const signature = crypto.createHmac('sha256', this.hmacSecret).update(payload).digest('hex');

    return {
      auditId,
      studentId,
      itemId: item.itemId,
      itemName: item.name,
      category: item.category,
      origin,
      coinsSpent,
      grantedBy,
      timestamp,
      signature
    };
  }
}

export default CosmeticGrantService;
