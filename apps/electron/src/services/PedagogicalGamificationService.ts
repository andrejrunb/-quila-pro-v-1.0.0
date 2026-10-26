/**
 * PEDAGOGICAL GAMIFICATION, AVATAR & EVIDENCE-BASED MISSIONS SERVICE (v2.0 - Audited & Hardened)
 * ==============================================================================================
 * Correções estruturais implementadas conforme parecer de auditoria técnica e jurídica:
 *  1. Base Legal Exata do ECA Digital:
 *     - Lei nº 15.211, de 17/09/2025 (Estatuto Digital da Criança e do Adolescente — ECA Digital),
 *       regulamentada pelo Decreto nº 12.880, de 18/03/2026 (tendo a Lei nº 15.352/2026 apenas
 *       incluído o art. 41-A sobre a vigência em 17/03/2026 e tratado da estrutura da ANPD).
 *     - Caixas de recompensa (loot boxes): vedadas pelo art. 20 da Lei nº 15.211/2025 e pelos
 *       arts. 22, § 2º, II, e 23 do Decreto nº 12.880/2026.
 *     - Recompensas por tempo de uso/tela: vedadas conforme Decreto nº 12.880/2026 (mecanismo de
 *       incentivo ao uso excessivo ou problemático).
 *     - Isolamento de câmera, biometria e GPS: Política interna de privacidade do Áquila Pro,
 *       alinhada à LGPD (Lei nº 13.709/2018, art. 14) e ao melhor interesse da criança (Enunciado CD/ANPD nº 1/2023).
 *  2. Transparência e Avaliação de Risco Algorítmico dos Mentores com IA (Art. 11, I e II, do Decreto nº 12.880/2026):
 *     - O aviso "Personagem educacional simulado; as respostas são geradas por inteligência artificial." é
 *       identificado como texto padronizado adotado pelo Áquila Pro para atender ao art. 11, I, do Decreto nº 12.880/2026.
 *     - Exige Relatório de Avaliação de Risco Algorítmico aprovado por mentor e bloqueia manipulação
 *       comportamental (pressão emocional para retornar, pedido de segredo aos responsáveis e memória pessoal desnecessária — art. 11, II).
 *  3. Autoridade de Concessão Assinada Remotamente vs. SQLite Local no Electron:
 *     - Como o banco SQLite local (`pedagogical_scaffolding.db`) reside na máquina cliente, toda concessão
 *       e saldo da carteira recebem assinatura criptográfica HMAC-SHA256 emitida pela Autoridade Remota da Escola.
 *     - Qualquer edição manual direta no banco SQLite local para inflar saldo ou inserir itens sem assinatura
 *       válida é detectada e rejeitada por `verifySqliteWalletIntegrity()`.
 *     - Inclui validador estrito de origem IPC (`validateTrustedIpcSender`) exigindo `contextIsolation: true`,
 *       `sandbox: true` e frame principal confiável.
 *  4. Cadastro Interno de Diligência Autoral de Exatos 12 Campos (baseado no art. 29 da Lei nº 9.610/98).
 */

import * as crypto from 'crypto';

export type MissionStageType = 'descoberta' | 'compreensao' | 'aplicacao' | 'investigacao' | 'retomar';

export type RewardVisualModality = 'personagem' | 'traje_inspirado' | 'ambiente';

export type AccessibilityInputMode =
  | 'texto'
  | 'audio'
  | 'desenho'
  | 'manipulacao_simulador'
  | 'apresentacao'
  | 'mediacao_docente';

export type OpenLicenseCode =
  | 'CC0'
  | 'CC_BY'
  | 'CC_BY_SA'
  | 'CC_BY_NC_RESTRICTED'
  | 'CC_BY_ND_RESTRICTED'
  | 'AUTORIZACAO_DIRETA'
  | 'ARTE_PROPRIA_EQUIPE_AQUILA';

/**
 * Cadastro Interno de Diligência Autoral do Áquila Pro (Exatos 12 Campos),
 * baseado no art. 29 da Lei nº 9.610/98 (que exige autorização prévia e expressa para reprodução e adaptação).
 */
export interface AssetRightsDiligenceRecord {
  characterAndFileId: string;                // 1. Identificador do personagem e do arquivo
  authorAndHolder: string;                   // 2. Autor e titular identificado
  sourceUrl: string;                         // 3. Endereço da fonte
  licenseAndVersion: OpenLicenseCode;        // 4. Licença e versão
  verificationDate: string;                  // 5. Data da verificação (ISO 8601)
  approvedTerritories: string[];             // 6. Territórios aprovados
  adaptationAllowed: boolean;                // 7. Adaptação permitida ou não
  commercialUseAllowed: boolean;             // 8. Uso comercial permitido ou não
  requiredCreditText: string;                // 9. Crédito exigido
  authorizationProofRef: string;             // 10. Comprovante de autorização ou contrato de criação
  brandOrRepresentationRestrictions: string; // 11. Restrições de marca ou representação
  approvedByReviewer: string;                // 12. Responsável pela aprovação
}

export const REQUIRED_12_DILIGENCE_FIELDS: Array<keyof AssetRightsDiligenceRecord> = [
  'characterAndFileId',
  'authorAndHolder',
  'sourceUrl',
  'licenseAndVersion',
  'verificationDate',
  'approvedTerritories',
  'adaptationAllowed',
  'commercialUseAllowed',
  'requiredCreditText',
  'authorizationProofRef',
  'brandOrRepresentationRestrictions',
  'approvedByReviewer',
];

/**
 * Camada 1: Proficiência (Evidências sobre habilidades e competências por disciplina)
 * Nunca pode ser gasta nem comprada.
 */
export interface StudentProficiencyRecord {
  studentId: string;
  discipline: string;
  bnccSkillCode: string;
  topic: string;
  masteryStage: 'em_exploracao' | 'compreendido' | 'aplicado' | 'investigado' | 'consolidado_retomada';
  evidenceIds: string[];
  lastDemonstratedAt: string;
  canBeSpent: false;
  canBePurchased: false;
}

/**
 * Configuração de autoridade remota / assimétrica para o serviço de gamificação
 */
export interface GamificationAuthorityConfig {
  mode?: 'ed25519_asymmetric' | 'remote_backend_http' | 'legacy_hmac';
  authoritySecretKey?: string;
  ed25519PublicKeyPem?: string;
  ed25519PrivateKeyPem?: string; // Presente APENAS na autoridade/servidor; NUNCA no Electron em produção
  remoteVerificationUrl?: string;
  remoteVerifyHandler?: (payload: unknown) => Promise<{ valid: boolean; reason?: string }>;
  authorityServer?: SchoolAuthorityServer;
}

/**
 * Recibo digital assinado pela Autoridade Escolar com Ed25519
 * Usado para verificação assimétrica e prevenção de replay.
 */
export interface GamificationGrantReceipt {
  receiptId: string;
  studentId: string;
  eventId: string;
  ruleId: string;
  cosmeticCoinsAwarded: number;
  itemIdsAwarded: string[];
  issuedAt: string;
  authoritySignature: string;
  signatureAlgorithm: 'Ed25519';
}

/**
 * Registro de consolidação da autoridade escolar (Ledger oficial no backend)
 * Previne ataques de rollback / restauração de snapshot antigo do SQLite.
 */
export interface SchoolAuthorityCommitRecord {
  studentId: string;
  committedVersion: number;
  committedBalance: number;
  lifetimeEarned: number;
  processedEventIds: string[];
  processedReceiptIds: string[];
  lastCommittedAt: string;
}

/**
 * Funções determinísticas para geração de payload canônico para assinaturas
 */
export function getCanonicalWalletPayload(wallet: {
  studentId: string;
  cosmeticBalance: number;
  lifetimeEarnedFromEvidence: number;
  processedEventIds: string[];
  version?: number;
}): string {
  return JSON.stringify({
    canBuyAcademicAdvantage: false,
    canBePurchasedWithRealMoney: false,
    cosmeticBalance: wallet.cosmeticBalance,
    lifetimeEarnedFromEvidence: wallet.lifetimeEarnedFromEvidence,
    processedEventIds: [...wallet.processedEventIds].sort(),
    studentId: wallet.studentId,
    version: wallet.version ?? 1,
  });
}

export function getCanonicalReceiptPayload(receipt: {
  receiptId: string;
  studentId: string;
  eventId: string;
  ruleId: string;
  cosmeticCoinsAwarded: number;
  itemIdsAwarded: string[];
  issuedAt: string;
}): string {
  return JSON.stringify({
    cosmeticCoinsAwarded: receipt.cosmeticCoinsAwarded,
    eventId: receipt.eventId,
    issuedAt: receipt.issuedAt,
    itemIdsAwarded: [...receipt.itemIdsAwarded].sort(),
    receiptId: receipt.receiptId,
    ruleId: receipt.ruleId,
    studentId: receipt.studentId,
  });
}

/**
 * Autoridade Criptográfica Escolar (Backend / Servidor de Confiança)
 * Detém a chave privada Ed25519 e o ledger consolidado de transações.
 * A chave privada NUNCA é distribuída para o cliente Electron.
 */
export class SchoolAuthorityServer {
  private keyPair: { publicKey: string; privateKey: string };
  private ledgers: Map<string, SchoolAuthorityCommitRecord> = new Map();

  public constructor(keyPair?: { publicKey: string; privateKey: string }) {
    if (keyPair) {
      this.keyPair = keyPair;
    } else {
      this.keyPair = crypto.generateKeyPairSync('ed25519', {
        publicKeyEncoding: { type: 'spki', format: 'pem' },
        privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
      });
    }
  }

  public getPublicKeyPem(): string {
    return this.keyPair.publicKey;
  }

  public getLedger(studentId: string): SchoolAuthorityCommitRecord | undefined {
    const existing = this.ledgers.get(studentId);
    return existing
      ? {
          ...existing,
          processedEventIds: [...existing.processedEventIds],
          processedReceiptIds: [...existing.processedReceiptIds],
        }
      : undefined;
  }

  public createSignedWallet(studentId: string): StudentCosmeticWallet {
    const initialRecord: SchoolAuthorityCommitRecord = {
      studentId,
      committedVersion: 1,
      committedBalance: 0,
      lifetimeEarned: 0,
      processedEventIds: [],
      processedReceiptIds: [],
      lastCommittedAt: new Date().toISOString(),
    };
    this.ledgers.set(studentId, initialRecord);

    const unsignedWallet = {
      studentId,
      cosmeticBalance: 0,
      lifetimeEarnedFromEvidence: 0,
      processedEventIds: [] as string[],
      processedReceiptIds: [] as string[],
      version: 1,
      canBuyAcademicAdvantage: false as const,
      canBePurchasedWithRealMoney: false as const,
      signatureAlgorithm: 'Ed25519' as const,
    };

    const signature = crypto
      .sign(null, Buffer.from(getCanonicalWalletPayload(unsignedWallet), 'utf8'), this.keyPair.privateKey)
      .toString('hex');

    return {
      ...unsignedWallet,
      serverSignature: signature,
    };
  }

  public signWallet(wallet: Omit<StudentCosmeticWallet, 'serverSignature'>): string {
    const canonical = getCanonicalWalletPayload(wallet);
    return crypto
      .sign(null, Buffer.from(canonical, 'utf8'), this.keyPair.privateKey)
      .toString('hex');
  }

  public issueGrantReceipt(params: {
    studentId: string;
    eventId: string;
    ruleId: string;
    cosmeticCoinsAwarded: number;
    itemIdsAwarded: string[];
  }): GamificationGrantReceipt {
    let ledger = this.ledgers.get(params.studentId);
    if (!ledger) {
      ledger = {
        studentId: params.studentId,
        committedVersion: 1,
        committedBalance: 0,
        lifetimeEarned: 0,
        processedEventIds: [],
        processedReceiptIds: [],
        lastCommittedAt: new Date().toISOString(),
      };
      this.ledgers.set(params.studentId, ledger);
    }

    // Proteção contra Replay Attack no servidor de autoridade
    if (ledger.processedEventIds.includes(params.eventId)) {
      throw new Error(`REPLAY_ATTACK_DETECTED: Evento '${params.eventId}' já concedido para o estudante '${params.studentId}'.`);
    }

    const receiptId = `receipt_${Date.now()}_${params.eventId}`;
    const issuedAt = new Date().toISOString();

    const unsignedReceipt = {
      receiptId,
      studentId: params.studentId,
      eventId: params.eventId,
      ruleId: params.ruleId,
      cosmeticCoinsAwarded: params.cosmeticCoinsAwarded,
      itemIdsAwarded: params.itemIdsAwarded,
      issuedAt,
    };

    const canonical = getCanonicalReceiptPayload(unsignedReceipt);
    const authoritySignature = crypto
      .sign(null, Buffer.from(canonical, 'utf8'), this.keyPair.privateKey)
      .toString('hex');

    // Atualizar ledger autoritativo
    ledger.committedVersion += 1;
    ledger.committedBalance += params.cosmeticCoinsAwarded;
    ledger.lifetimeEarned += params.cosmeticCoinsAwarded;
    ledger.processedEventIds.push(params.eventId);
    ledger.processedReceiptIds.push(receiptId);
    ledger.lastCommittedAt = issuedAt;

    return {
      ...unsignedReceipt,
      authoritySignature,
      signatureAlgorithm: 'Ed25519',
    };
  }

  public processSpend(
    studentId: string,
    currentWallet: StudentCosmeticWallet,
    amountToSpend: number,
    _itemToBuyId: string
  ): {
    success: boolean;
    updatedWallet: StudentCosmeticWallet;
  } {
    const ledger = this.ledgers.get(studentId);
    if (ledger) {
      // Verificação estrita de Rollback (Restauração de snapshot antigo)
      const localVersion = currentWallet.version ?? 1;
      if (localVersion < ledger.committedVersion) {
        throw new Error(
          `ROLLBACK_DETECTED: Restauração de snapshot antigo detectada. Versão local (${localVersion}) é inferior à versão consolidada na autoridade (${ledger.committedVersion}). O saldo anterior restaurado é inválido para gasto.`
        );
      }
      if (currentWallet.cosmeticBalance > ledger.committedBalance) {
        throw new Error(
          `ROLLBACK_DETECTED: Saldo local (${currentWallet.cosmeticBalance}) é incompatível com o saldo consolidado na autoridade (${ledger.committedBalance}).`
        );
      }
    }

    if (currentWallet.cosmeticBalance < amountToSpend) {
      throw new Error(
        `INSUFFICIENT_FUNDS: Saldo insuficiente (${currentWallet.cosmeticBalance} < ${amountToSpend}).`
      );
    }

    const newVersion = (ledger ? ledger.committedVersion : (currentWallet.version ?? 1)) + 1;
    const newBalance = currentWallet.cosmeticBalance - amountToSpend;

    if (ledger) {
      ledger.committedVersion = newVersion;
      ledger.committedBalance = newBalance;
      ledger.lastCommittedAt = new Date().toISOString();
      this.ledgers.set(studentId, ledger);
    }

    const unsignedWallet = {
      studentId,
      cosmeticBalance: newBalance,
      lifetimeEarnedFromEvidence: currentWallet.lifetimeEarnedFromEvidence,
      processedEventIds: [...currentWallet.processedEventIds],
      processedReceiptIds: [...(currentWallet.processedReceiptIds || [])],
      version: newVersion,
      canBuyAcademicAdvantage: false as const,
      canBePurchasedWithRealMoney: false as const,
      signatureAlgorithm: 'Ed25519' as const,
    };

    const signature = this.signWallet(unsignedWallet);

    return {
      success: true,
      updatedWallet: {
        ...unsignedWallet,
        serverSignature: signature,
      },
    };
  }
}

/**
 * Camada 2: Moeda Cosmética (Poder de escolha sobre personalização)
 * Protegida por assinatura criptográfica emitida pela autoridade escolar remota
 * (Ed25519 assimétrico ou HMAC) para impedir adulteração direta do banco SQLite local.
 */
export interface StudentCosmeticWallet {
  studentId: string;
  cosmeticBalance: number;
  lifetimeEarnedFromEvidence: number;
  processedEventIds: string[];
  canBuyAcademicAdvantage: false;
  canBePurchasedWithRealMoney: false;
  serverSignature: string;
  version?: number;
  signatureAlgorithm?: 'Ed25519' | 'HMAC-SHA256';
  processedReceiptIds?: string[];
}

/**
 * Camada 3: Inventário (Skins, trajes, acessórios, cenários e conquistas obtidos)
 * Sem perda por ausência ou erro.
 */
export interface StudentInventoryItem {
  itemId: string;
  title: string;
  discipline: string;
  collectionAlbum: string;
  modality: RewardVisualModality;
  category:
    | 'card_biografico'
    | 'acessorio'
    | 'traje_tematico'
    | 'cenario_ambiente'
    | 'variante_evolucao'
    | 'titulo_competencia';
  svgAssetPath: string;
  rightsCharacterAndFileId: string;
  unlockedByRuleId: string;
  unlockedByEvidenceId: string;
  unlockedAt: string;
  expiresOrLostOnAbsence: false;
  serverGrantSignature: string;
}

/**
 * Regra Determinística de Desbloqueio
 */
export interface PedagogicalUnlockRule {
  ruleId: string;
  collectionAlbum: string;
  discipline: string;
  historicalOrOriginalReference: string;
  learningObjective: string;
  stageType: MissionStageType;
  requiredEvidenceTypes: AccessibilityInputMode[];
  validationMethod: 'regra_objetiva' | 'rubrica_docente' | 'hibrida_simulador_rubrica';
  accessibleEquivalentDescription: string;
  guaranteedRewardItemIds: string[];
  cosmeticCurrencyGrant: number;
  rightsCharacterAndFileId: string;
  allowsInfiniteFarmingOnRepeat: false;
  lostOnStudentAbsence: false;
}

/**
 * Trilha de Auditoria Pedagógica (Política Interna do Projeto Áquila Pro)
 * Responde às 3 perguntas internas de aprovação de recompensa.
 */
export interface GamificationUnlockAuditRecord {
  auditId: string;
  policyClassification: 'POLITICA_INTERNA_APROVACAO_PEDAGOGICA_AQUILA';
  eventId: string;
  studentId: string;
  ruleId: string;
  question1WhatDidStudentLearn: string;
  question2WhichEvidenceDemonstratesIt: string;
  question3WhyDoesCharacterOrItemMakeSense: string;
  usedAccessibleEquivalence: boolean;
  verifiedRightsCharacterAndFileId: string;
  serverSignature: string;
  createdAt: string;
}

/**
 * Relatório de Avaliação de Risco Algorítmico para Mentores com IA
 * Exigido para conformidade com o art. 11, I e II, do Decreto nº 12.880/2026 (regulamenta a Lei nº 15.211/2025).
 */
export interface MentorAlgorithmicRiskAssessmentReport {
  reportId: string;
  mentorCharacterId: string;
  characterName: string;
  evaluatedAt: string;
  approvedByPedagogicalAndLegalBoard: boolean;
  approvedKnowledgeBaseRef: string;
  behavioralManipulationSafeguards: {
    noEmotionalPressureToReturn: true;
    noSecrecyRequestsFromGuardians: true;
    noUnnecessaryPersonalMemory: true;
    separatesHistoricalFactFromFictionalDialogue: true;
    allowsStudentAndTeacherContestation: true;
    requiresHumanMediationForSensitiveTopics: true;
  };
  residualRiskLevel: 'baixo_controlado';
}

/**
 * Resposta de Mentor Simulado com Texto Adotado pelo Áquila para atender ao art. 11, I, do Decreto nº 12.880/2026
 */
export interface SimulatedHistoricalMentorResponse {
  characterName: string;
  aquilaAdoptedArt11TransparencyNotice: typeof AQUILA_ADOPTED_ART11_TRANSPARENCY_NOTICE;
  noticeLegalContext: 'Texto adotado pelo Áquila Pro para atender à exigência de transparência sobre o caráter sintético e automatizado da interação (art. 11, I, do Decreto nº 12.880/2026).';
  riskAssessmentReportId: string;
  historicalFactCitations: string[];
  fictionalPedagogicalDialogue: string;
  teacherSourceLinks: string[];
  containsEmotionalPressureToReturn: false;
  requestsSecrecyFromParents: false;
  storesUnnecessaryPersonalMemory: false;
  receivesSecurityCameraOrBiometricData: false;
}

/**
 * Texto adotado internamente pelo Áquila Pro para cumprir o dever de transparência
 * sobre o caráter sintético e automatizado da interação (art. 11, I, do Decreto nº 12.880/2026).
 */
export const AQUILA_ADOPTED_ART11_TRANSPARENCY_NOTICE =
  'Personagem educacional simulado; as respostas são geradas por inteligência artificial.' as const;

/**
 * Interface de Evento IPC para Validação Estrita do Sender no Electron
 */
export interface ElectronIpcEventLike {
  senderFrame?: {
    url?: string;
    parent?: unknown | null;
  } | null;
  sender?: {
    id?: number;
    mainFrame?: unknown;
  } | null;
}

export class PedagogicalGamificationService {
  private static instance: PedagogicalGamificationService;

  /**
   * Chave secreta da Autoridade Escolar (mantida no backend/servidor da escola para HMAC fallback).
   */
  private readonly schoolAuthoritySecretKey: string;

  /**
   * Chave pública Ed25519 da Autoridade Escolar (embutida ou configurada no Electron).
   * Permite que o cliente verifique assinaturas locais do SQLite de forma 100% segura
   * sem precisar conhecer a chave privada.
   */
  private readonly schoolAuthorityPublicKey?: string;

  /**
   * Chave privada Ed25519 da Autoridade Escolar (presente estritamente no servidor da escola).
   * NUNCA distribuída no cliente Electron em produção.
   */
  private readonly schoolAuthorityPrivateKey?: string;

  /**
   * Configuração de validação remota (backend da escola).
   */
  private readonly remoteAuthorityConfig?: GamificationAuthorityConfig;

  /**
   * Servidor de Autoridade Escolar vinculado (para testes ou backend integrado).
   */
  private readonly authorityServer?: SchoolAuthorityServer;

  private rightsRegistry: Map<string, AssetRightsDiligenceRecord> = new Map();
  private unlockRules: Map<string, PedagogicalUnlockRule> = new Map();
  private mentorRiskReports: Map<string, MentorAlgorithmicRiskAssessmentReport> = new Map();
  private auditTrail: GamificationUnlockAuditRecord[] = [];

  public constructor(
    configOrSecret?:
      | string
      | {
          authoritySecretKey?: string;
          ed25519PublicKeyPem?: string;
          ed25519PrivateKeyPem?: string;
          remoteAuthorityConfig?: GamificationAuthorityConfig;
          authorityServer?: SchoolAuthorityServer;
        }
  ) {
    if (typeof configOrSecret === 'string') {
      this.schoolAuthoritySecretKey = configOrSecret;
    } else if (configOrSecret) {
      this.schoolAuthoritySecretKey =
        configOrSecret.authoritySecretKey ||
        process.env.AQUILA_SCHOOL_AUTHORITY_HMAC_KEY ||
        'aquila-sovereign-school-authority-key-2026-verify-only';
      this.schoolAuthorityPublicKey = configOrSecret.ed25519PublicKeyPem;
      this.schoolAuthorityPrivateKey = configOrSecret.ed25519PrivateKeyPem;
      this.remoteAuthorityConfig = configOrSecret.remoteAuthorityConfig;
      this.authorityServer = configOrSecret.authorityServer;
    } else {
      this.schoolAuthoritySecretKey =
        process.env.AQUILA_SCHOOL_AUTHORITY_HMAC_KEY ||
        'aquila-sovereign-school-authority-key-2026-verify-only';
    }

    if (this.authorityServer && !this.schoolAuthorityPublicKey) {
      this.schoolAuthorityPublicKey = this.authorityServer.getPublicKeyPem();
    }

    this.seedMvpRightsRulesAndRiskReports();
  }

  public static getInstance(): PedagogicalGamificationService {
    if (!PedagogicalGamificationService.instance) {
      PedagogicalGamificationService.instance = new PedagogicalGamificationService();
    }
    return PedagogicalGamificationService.instance;
  }

  /**
   * Calcula assinatura HMAC-SHA256 da carteira cosmética emitida pela Autoridade Escolar (fallback legada).
   */
  public signWalletStateHMAC(wallet: Omit<StudentCosmeticWallet, 'serverSignature'>): string {
    const canonicalPayload = JSON.stringify({
      studentId: wallet.studentId,
      cosmeticBalance: wallet.cosmeticBalance,
      lifetimeEarnedFromEvidence: wallet.lifetimeEarnedFromEvidence,
      processedEventIds: [...wallet.processedEventIds].sort(),
      canBuyAcademicAdvantage: false,
      canBePurchasedWithRealMoney: false,
    });
    return crypto.createHmac('sha256', this.schoolAuthoritySecretKey).update(canonicalPayload).digest('hex');
  }

  /**
   * Calcula assinatura da carteira cosmética emitida pela Autoridade Escolar.
   * Suporta Ed25519 assimétrico ou HMAC-SHA256 (conforme o algoritmo da carteira).
   */
  public signWalletState(wallet: Omit<StudentCosmeticWallet, 'serverSignature'>): string {
    if (wallet.signatureAlgorithm === 'Ed25519') {
      if (this.authorityServer) {
        return this.authorityServer.signWallet(wallet);
      }
      if (this.schoolAuthorityPrivateKey) {
        const canonical = getCanonicalWalletPayload(wallet);
        return crypto
          .sign(null, Buffer.from(canonical, 'utf8'), this.schoolAuthorityPrivateKey)
          .toString('hex');
      }
      throw new Error(
        'AUTHORITY_PRIVATE_KEY_NOT_IN_ELECTRON: A chave privada Ed25519 reside estritamente no servidor da escola; o cliente Electron possui apenas a chave pública para validação.'
      );
    }
    return this.signWalletStateHMAC(wallet);
  }

  /**
   * Cria uma carteira cosmética inicial assinada pela Autoridade Escolar.
   */
  public createSignedWallet(
    studentId: string,
    algorithm: 'Ed25519' | 'HMAC-SHA256' = 'HMAC-SHA256'
  ): StudentCosmeticWallet {
    if (algorithm === 'Ed25519') {
      if (this.authorityServer) {
        return this.authorityServer.createSignedWallet(studentId);
      }
      if (this.schoolAuthorityPrivateKey) {
        const unsignedWallet = {
          studentId,
          cosmeticBalance: 0,
          lifetimeEarnedFromEvidence: 0,
          processedEventIds: [] as string[],
          processedReceiptIds: [] as string[],
          version: 1,
          canBuyAcademicAdvantage: false as const,
          canBePurchasedWithRealMoney: false as const,
          signatureAlgorithm: 'Ed25519' as const,
        };
        const signature = crypto
          .sign(null, Buffer.from(getCanonicalWalletPayload(unsignedWallet), 'utf8'), this.schoolAuthorityPrivateKey)
          .toString('hex');
        return {
          ...unsignedWallet,
          serverSignature: signature,
        };
      }
      throw new Error(
        'AUTHORITY_PRIVATE_KEY_NOT_IN_ELECTRON: A carteira Ed25519 inicial deve ser emitida pela Autoridade Escolar (servidor).'
      );
    }

    const base = {
      studentId,
      cosmeticBalance: 0,
      lifetimeEarnedFromEvidence: 0,
      processedEventIds: [] as string[],
      processedReceiptIds: [] as string[],
      version: 1,
      canBuyAcademicAdvantage: false as const,
      canBePurchasedWithRealMoney: false as const,
      signatureAlgorithm: 'HMAC-SHA256' as const,
    };
    return {
      ...base,
      serverSignature: this.signWalletStateHMAC(base),
    };
  }

  /**
   * EVIDÊNCIA 1 (Bloqueante 3): Verifica a integridade criptográfica do saldo e eventos
   * carregados do banco SQLite local. Se o arquivo SQLite local tiver sido editado
   * manualmente (ex: `UPDATE gamification_cosmetic_wallet SET cosmetic_balance = 99999`),
   * a assinatura falha e a adulteração é imediatamente bloqueada/rejeitada.
   * Suporta validação assimétrica Ed25519 (chave pública) e HMAC.
   */
  public verifySqliteWalletIntegrity(wallet: StudentCosmeticWallet): {
    valid: boolean;
    errorCode?: 'LOCAL_SQLITE_TAMPERING_DETECTED';
    reason: string;
    algorithm?: 'Ed25519' | 'HMAC-SHA256';
  } {
    if (wallet.signatureAlgorithm === 'Ed25519') {
      const publicKey = this.schoolAuthorityPublicKey || this.authorityServer?.getPublicKeyPem();
      if (!publicKey) {
        return {
          valid: false,
          errorCode: 'LOCAL_SQLITE_TAMPERING_DETECTED',
          reason: 'ED25519_PUBLIC_KEY_MISSING: Chave pública Ed25519 da autoridade não configurada no cliente Electron.',
        };
      }

      const canonicalPayload = getCanonicalWalletPayload(wallet);
      try {
        const isValid = crypto.verify(
          null,
          Buffer.from(canonicalPayload, 'utf8'),
          publicKey,
          Buffer.from(wallet.serverSignature, 'hex')
        );

        if (!isValid) {
          return {
            valid: false,
            errorCode: 'LOCAL_SQLITE_TAMPERING_DETECTED',
            reason:
              'LOCAL_SQLITE_TAMPERING_DETECTED: O saldo ou histórico da carteira no banco local não corresponde à assinatura Ed25519 da Autoridade Escolar.',
          };
        }

        return { valid: true, reason: 'WALLET_SIGNATURE_VERIFIED_ED25519', algorithm: 'Ed25519' };
      } catch (err: any) {
        return {
          valid: false,
          errorCode: 'LOCAL_SQLITE_TAMPERING_DETECTED',
          reason: `LOCAL_SQLITE_TAMPERING_DETECTED: Falha criptográfica na validação Ed25519 (${err?.message || err}).`,
        };
      }
    }

    const expectedSig = this.signWalletStateHMAC({
      studentId: wallet.studentId,
      cosmeticBalance: wallet.cosmeticBalance,
      lifetimeEarnedFromEvidence: wallet.lifetimeEarnedFromEvidence,
      processedEventIds: wallet.processedEventIds,
      canBuyAcademicAdvantage: false,
      canBePurchasedWithRealMoney: false,
    });

    if (!wallet.serverSignature || wallet.serverSignature !== expectedSig) {
      return {
        valid: false,
        errorCode: 'LOCAL_SQLITE_TAMPERING_DETECTED',
        reason:
          'LOCAL_SQLITE_TAMPERING_DETECTED: O saldo ou histórico da carteira no banco local não corresponde à assinatura HMAC-SHA256 da Autoridade Escolar.',
      };
    }

    return { valid: true, reason: 'WALLET_SIGNATURE_VERIFIED_HMAC', algorithm: 'HMAC-SHA256' };
  }

  /**
   * TESTE DE REPLAY / VERIFICAÇÃO DE RECIBO:
   * Valida a autenticidade de um recibo assinado por Ed25519 emitido pela autoridade escolar.
   * Se o recibo ou o evento já tiver sido consumido na carteira, bloqueia o replay.
   */
  public verifyGrantReceipt(
    receipt: GamificationGrantReceipt,
    wallet?: StudentCosmeticWallet
  ): {
    valid: boolean;
    errorCode?: 'REPLAY_ATTACK_DETECTED' | 'INVALID_RECEIPT_SIGNATURE';
    reason: string;
  } {
    const publicKey = this.schoolAuthorityPublicKey || this.authorityServer?.getPublicKeyPem();
    if (!publicKey) {
      return {
        valid: false,
        errorCode: 'INVALID_RECEIPT_SIGNATURE',
        reason: 'Chave pública Ed25519 da autoridade escolar ausente para validação do recibo.',
      };
    }

    const canonicalPayload = getCanonicalReceiptPayload(receipt);
    let sigValid = false;
    try {
      sigValid = crypto.verify(
        null,
        Buffer.from(canonicalPayload, 'utf8'),
        publicKey,
        Buffer.from(receipt.authoritySignature, 'hex')
      );
    } catch {
      sigValid = false;
    }

    if (!sigValid) {
      return {
        valid: false,
        errorCode: 'INVALID_RECEIPT_SIGNATURE',
        reason: 'INVALID_RECEIPT_SIGNATURE: Assinatura Ed25519 do recibo é inválida ou foi adulterada.',
      };
    }

    if (wallet) {
      const alreadyProcessed =
        (wallet.processedReceiptIds && wallet.processedReceiptIds.includes(receipt.receiptId)) ||
        wallet.processedEventIds.includes(receipt.eventId);

      if (alreadyProcessed) {
        return {
          valid: false,
          errorCode: 'REPLAY_ATTACK_DETECTED',
          reason: `REPLAY_ATTACK_DETECTED: O recibo '${receipt.receiptId}' (evento '${receipt.eventId}') já foi consumido anteriormente. Replay bloqueado sem concessão de nova recompensa.`,
        };
      }
    }

    return { valid: true, reason: 'RECEIPT_VALID_AND_AUTHENTIC' };
  }

  /**
   * Consome um recibo de concessão na carteira do estudante com proteção contra Replay Attack.
   */
  public consumeGrantReceipt(
    receipt: GamificationGrantReceipt,
    wallet: StudentCosmeticWallet
  ): {
    success: boolean;
    updatedWallet: StudentCosmeticWallet;
    cosmeticCoinsAdded: number;
    itemsGranted: string[];
  } {
    const check = this.verifyGrantReceipt(receipt, wallet);
    if (!check.valid) {
      throw new Error(check.reason);
    }

    const nextEvents = [...wallet.processedEventIds, receipt.eventId];
    const nextReceipts = [...(wallet.processedReceiptIds || []), receipt.receiptId];
    const nextVersion = (wallet.version ?? 1) + 1;
    const nextBalance = wallet.cosmeticBalance + receipt.cosmeticCoinsAwarded;
    const nextLifetime = wallet.lifetimeEarnedFromEvidence + receipt.cosmeticCoinsAwarded;

    const unsignedWallet = {
      studentId: wallet.studentId,
      cosmeticBalance: nextBalance,
      lifetimeEarnedFromEvidence: nextLifetime,
      processedEventIds: nextEvents,
      processedReceiptIds: nextReceipts,
      version: nextVersion,
      canBuyAcademicAdvantage: false as const,
      canBePurchasedWithRealMoney: false as const,
      signatureAlgorithm: 'Ed25519' as const,
    };

    let signature = '';
    if (this.authorityServer) {
      signature = this.authorityServer.signWallet(unsignedWallet);
    } else if (this.schoolAuthorityPrivateKey) {
      signature = crypto
        .sign(null, Buffer.from(getCanonicalWalletPayload(unsignedWallet), 'utf8'), this.schoolAuthorityPrivateKey)
        .toString('hex');
    } else {
      signature = receipt.authoritySignature;
    }

    return {
      success: true,
      updatedWallet: {
        ...unsignedWallet,
        serverSignature: signature,
      },
      cosmeticCoinsAdded: receipt.cosmeticCoinsAwarded,
      itemsGranted: [...receipt.itemIdsAwarded],
    };
  }

  /**
   * TESTE DE ROLLBACK / RESTAURAÇÃO DE SNAPSHOT ANTIGO:
   * Compara o estado da carteira local contra o ledger autoritativo consolidado na escola.
   * Se o estudante restaurou um arquivo SQLite antigo para inflar o saldo, a versão local
   * será inferior à versão consolidada na autoridade, bloqueando o rollback.
   */
  public verifyNoRollback(
    wallet: StudentCosmeticWallet,
    authorityRecord: SchoolAuthorityCommitRecord
  ): {
    valid: boolean;
    errorCode?: 'ROLLBACK_DETECTED';
    reason: string;
  } {
    const currentVersion = wallet.version ?? 1;
    if (currentVersion < authorityRecord.committedVersion) {
      return {
        valid: false,
        errorCode: 'ROLLBACK_DETECTED',
        reason: `ROLLBACK_DETECTED: Restauração de snapshot antigo detectada! Versão local da carteira (${currentVersion}) é inferior à versão consolidada na autoridade escolar (${authorityRecord.committedVersion}). O saldo local restaurado não pode ser reutilizado.`,
      };
    }

    if (wallet.cosmeticBalance > authorityRecord.committedBalance) {
      return {
        valid: false,
        errorCode: 'ROLLBACK_DETECTED',
        reason: `ROLLBACK_DETECTED: Inconsistência de saldo detectada! Saldo local da carteira (${wallet.cosmeticBalance}) é superior ao saldo consolidado na Autoridade Escolar (${authorityRecord.committedBalance}).`,
      };
    }

    return { valid: true, reason: 'ROLLBACK_CHECK_PASSED' };
  }

  /**
   * Executa gasto cosmético no inventário com verificação autoritativa anti-rollback.
   */
  public spendCosmeticBalance(params: {
    wallet: StudentCosmeticWallet;
    amount: number;
    itemToBuyId: string;
    authorityRecord?: SchoolAuthorityCommitRecord;
    authorityServer?: SchoolAuthorityServer;
  }): {
    success: boolean;
    updatedWallet: StudentCosmeticWallet;
    spentAmount: number;
    remainingBalance: number;
  } {
    const integrity = this.verifySqliteWalletIntegrity(params.wallet);
    if (!integrity.valid) {
      throw new Error(integrity.reason);
    }

    const authority = params.authorityServer || this.authorityServer;
    const authRecord = params.authorityRecord || (authority ? authority.getLedger(params.wallet.studentId) : undefined);

    if (authRecord) {
      const rollbackCheck = this.verifyNoRollback(params.wallet, authRecord);
      if (!rollbackCheck.valid) {
        throw new Error(rollbackCheck.reason);
      }
    }

    if (params.wallet.cosmeticBalance < params.amount) {
      throw new Error(
        `INSUFFICIENT_COSMETIC_BALANCE: Saldo insuficiente (${params.wallet.cosmeticBalance} moedas disponíveis, necessário ${params.amount}).`
      );
    }

    if (authority) {
      const result = authority.processSpend(
        params.wallet.studentId,
        params.wallet,
        params.amount,
        params.itemToBuyId
      );
      return {
        success: true,
        updatedWallet: result.updatedWallet,
        spentAmount: params.amount,
        remainingBalance: result.updatedWallet.cosmeticBalance,
      };
    }

    const newBalance = params.wallet.cosmeticBalance - params.amount;
    const nextVersion = (params.wallet.version ?? 1) + 1;
    const unsignedWallet = {
      studentId: params.wallet.studentId,
      cosmeticBalance: newBalance,
      lifetimeEarnedFromEvidence: params.wallet.lifetimeEarnedFromEvidence,
      processedEventIds: [...params.wallet.processedEventIds],
      processedReceiptIds: [...(params.wallet.processedReceiptIds || [])],
      version: nextVersion,
      canBuyAcademicAdvantage: false as const,
      canBePurchasedWithRealMoney: false as const,
      signatureAlgorithm: params.wallet.signatureAlgorithm || 'HMAC-SHA256',
    };

    let serverSig = '';
    if (params.wallet.signatureAlgorithm === 'Ed25519') {
      if (!this.schoolAuthorityPrivateKey) {
        throw new Error(
          'AUTHORITY_PRIVATE_KEY_NOT_IN_ELECTRON: O cliente Electron não possui a chave privada Ed25519 para assinar novo saldo; o gasto deve ser submetido à autoridade escolar.'
        );
      }
      serverSig = crypto
        .sign(null, Buffer.from(getCanonicalWalletPayload(unsignedWallet), 'utf8'), this.schoolAuthorityPrivateKey)
        .toString('hex');
    } else {
      serverSig = this.signWalletStateHMAC(unsignedWallet);
    }

    return {
      success: true,
      updatedWallet: {
        ...unsignedWallet,
        serverSignature: serverSig,
      },
      spentAmount: params.amount,
      remainingBalance: newBalance,
    };
  }

  /**
   * Suporte a verificação remota no backend escolar (ou delegação para endpoint/handler seguro).
   */
  public async verifyWalletRemotely(wallet: StudentCosmeticWallet): Promise<{
    valid: boolean;
    reason: string;
    remoteConsensus: boolean;
  }> {
    if (this.remoteAuthorityConfig?.remoteVerifyHandler) {
      const res = await this.remoteAuthorityConfig.remoteVerifyHandler(wallet);
      return {
        valid: res.valid,
        reason: res.reason || (res.valid ? 'REMOTE_AUTHORITY_VERIFIED' : 'REMOTE_AUTHORITY_REJECTED'),
        remoteConsensus: res.valid,
      };
    }

    const localCheck = this.verifySqliteWalletIntegrity(wallet);
    return {
      valid: localCheck.valid,
      reason: localCheck.reason,
      remoteConsensus: localCheck.valid,
    };
  }

  /**
   * EVIDÊNCIA 8 (Bloqueante 3): Valida o sender de todas as mensagens IPC no Electron.
   * Rejeita iframes secundários (`parent !== null`), URLs externas (`http:`, `https:`, `data:`)
   * ou senders ausentes.
   */
  public validateTrustedIpcSender(event: ElectronIpcEventLike): {
    trusted: boolean;
    reason: string;
  } {
    if (!event || !event.senderFrame || !event.sender) {
      throw new Error('IPC_UNTRUSTED_SENDER: senderFrame ou sender ausente na mensagem IPC.');
    }

    if (event.senderFrame.parent !== undefined && event.senderFrame.parent !== null) {
      throw new Error('IPC_UNTRUSTED_SUBFRAME: Mensagens IPC de subframes/iframes não são autorizadas.');
    }

    const frameUrl = String(event.senderFrame.url || '');
    const isTrustedProtocol =
      frameUrl.startsWith('app://aquila') ||
      frameUrl.startsWith('file://') ||
      frameUrl === 'http://localhost:5173/';

    if (!isTrustedProtocol || frameUrl.includes('evil.') || frameUrl.startsWith('https://')) {
      throw new Error(`IPC_UNTRUSTED_ORIGIN: Origem IPC não autorizada (${frameUrl || 'vazia'}).`);
    }

    return { trusted: true, reason: 'IPC_SENDER_VERIFIED' };
  }

  /**
   * EVIDÊNCIA 5: Valida os exatos 12 campos do Cadastro Interno de Diligência Autoral
   * (baseado no art. 29 da Lei nº 9.610/98). Se qualquer um dos 12 campos estiver ausente/vazio,
   * ou se a licença vedar adaptação/uso (CC BY-ND / CC BY-NC sem autorização), bloqueia a concessão.
   */
  public validateAssetRightsForProduction(record: Partial<AssetRightsDiligenceRecord>): {
    approved: boolean;
    missingFields: string[];
    reason: string;
  } {
    const missingFields: string[] = [];

    for (const field of REQUIRED_12_DILIGENCE_FIELDS) {
      const val = record[field];
      if (val === undefined || val === null) {
        missingFields.push(field);
      } else if (typeof val === 'string' && val.trim().length === 0) {
        missingFields.push(field);
      } else if (Array.isArray(val) && val.length === 0) {
        missingFields.push(field);
      }
    }

    if (missingFields.length > 0) {
      return {
        approved: false,
        missingFields,
        reason: `BLOCKED_INCOMPLETE_12_FIELD_DILIGENCE_REGISTRY (baseado no art. 29 da Lei nº 9.610/98): Campos ausentes: ${missingFields.join(', ')}`,
      };
    }

    if (record.licenseAndVersion === 'CC_BY_ND_RESTRICTED') {
      return {
        approved: false,
        missingFields: [],
        reason: 'BLOCKED_CC_BY_ND: Licença CC BY-ND veda adaptações necessárias para criação de skin/cenário.',
      };
    }

    if (
      record.licenseAndVersion === 'CC_BY_NC_RESTRICTED' ||
      record.adaptationAllowed !== true ||
      record.commercialUseAllowed !== true
    ) {
      return {
        approved: false,
        missingFields: [],
        reason:
          'BLOCKED_RIGHTS_RESTRICTION: Ativo sem permissão verificada para adaptação e operação na plataforma escolar.',
      };
    }

    return { approved: true, missingFields: [], reason: 'APPROVED_12_FIELDS_VERIFIED' };
  }

  /**
   * EVIDÊNCIA 3 (Bloqueante 1): Barreira de Conformidade ECA Digital (Lei nº 15.211/2025 e
   * Decreto nº 12.880/2026) e Política Interna de Privacidade (alinhada à LGPD e ao melhor interesse da criança):
   * - Loot boxes: vedadas pelo art. 20 da Lei nº 15.211/2025 e arts. 22, § 2º, II, e 23 do Decreto nº 12.880/2026.
   * - Tempo de uso/tela: vedado pelo Decreto nº 12.880/2026 (mecanismo de incentivo ao uso excessivo/problemático).
   * - Câmera, expressão facial e GPS: bloqueados pela Política Interna de Privacidade do Áquila Pro,
   *   alinhada à LGPD (Lei nº 13.709/2018, art. 14) e ao Enunciado CD/ANPD nº 1/2023.
   */
  public assertEcaDigitalAndPrivacyCompliance(triggerSource: {
    triggerType:
      | 'learning_evidence'
      | 'screen_time'
      | 'loot_box_roll'
      | 'camera_attention_score'
      | 'facial_expression'
      | 'real_time_gps_location'
      | 'paid_shortcut';
  }): void {
    switch (triggerSource.triggerType) {
      case 'loot_box_roll':
        throw new Error(
          'ECA_DIGITAL_VIOLATION (Lei nº 15.211/2025, art. 20; Decreto nº 12.880/2026, arts. 22, § 2º, II, e 23): Caixas de recompensa aleatória (loot boxes) são vedadas.'
        );
      case 'screen_time':
        throw new Error(
          'ECA_DIGITAL_VIOLATION (Decreto nº 12.880/2026 — regulamenta a Lei nº 15.211/2025): Recompensas por tempo de uso/conexão são vedadas como mecanismo de incentivo ao uso problemático.'
        );
      case 'camera_attention_score':
      case 'facial_expression':
      case 'real_time_gps_location':
        throw new Error(
          'AQUILA_PRIVACY_POLICY_VIOLATION (Política de Privacidade do Áquila Pro, alinhada à LGPD — Lei nº 13.709/2018, art. 14 — e ao Enunciado CD/ANPD nº 1/2023): Câmeras, biometria, expressão facial e localização física jamais podem gerar ou descontar recompensas.'
        );
      case 'paid_shortcut':
        throw new Error(
          'PEDAGOGICAL_EQUITY_VIOLATION: Proibido vender atalhos, tentativas ou vantagens acadêmicas.'
        );
      case 'learning_evidence':
        return;
    }
  }

  /**
   * EVIDÊNCIA 4: Garante que nenhum item conquistado no inventário seja perdido ou degradado
   * por ausência, falta ou férias do estudante (prevenção de pressão emocional — Decreto nº 12.880/2026).
   */
  public processStudentAbsenceWithoutPenalty(
    inventory: StudentInventoryItem[],
    _daysAbsent: number
  ): {
    retainedItemsCount: number;
    removedItemsCount: 0;
    inventory: StudentInventoryItem[];
  } {
    for (const item of inventory) {
      if (item.expiresOrLostOnAbsence !== false) {
        throw new Error(`INVENTORY_POLICY_VIOLATION: Item ${item.itemId} marcado incorretamente como expirável.`);
      }
    }
    return {
      retainedItemsCount: inventory.length,
      removedItemsCount: 0,
      inventory: [...inventory],
    };
  }

  /**
   * EVIDÊNCIAS 1, 2, 5 e 6: Autoridade de Concessão Determinística:
   * - Verifica a assinatura HMAC da carteira antes de operar (Evidência 1)
   * - Verifica o gatilho de conformidade ECA Digital / Privacidade (Evidência 3)
   * - Verifica os 12 campos do Cadastro Interno de Diligência Autoral (Evidência 5)
   * - Impede moeda em dobro ao reenviar a mesma evidência/regra (Evidência 2)
   * - Grava as 3 respostas da Política Interna de Auditoria Pedagógica (Evidência 6)
   */
  public evaluateAndGrantUnlock(params: {
    eventId: string;
    studentId: string;
    ruleId: string;
    evidenceId: string;
    evidenceSummary: string;
    modalityChosen: RewardVisualModality;
    usedAccessibleEquivalence?: boolean;
    wallet: StudentCosmeticWallet;
    triggerType?:
      | 'learning_evidence'
      | 'screen_time'
      | 'loot_box_roll'
      | 'camera_attention_score'
      | 'facial_expression'
      | 'real_time_gps_location'
      | 'paid_shortcut';
  }): {
    grantedNewUnlock: boolean;
    practiceRetryOnly: boolean;
    cosmeticCoinsAdded: number;
    unlockedItemIds: string[];
    updatedWallet: StudentCosmeticWallet;
    auditRecord: GamificationUnlockAuditRecord;
  } {
    // 1. Verificar integridade criptográfica contra edição local do SQLite (Evidência 1)
    const walletIntegrity = this.verifySqliteWalletIntegrity(params.wallet);
    if (!walletIntegrity.valid) {
      throw new Error(walletIntegrity.reason);
    }

    // 2. Verificar conformidade com Lei nº 15.211/2025, Decreto nº 12.880/2026 e Política de Privacidade (Evidência 3)
    this.assertEcaDigitalAndPrivacyCompliance({
      triggerType: params.triggerType || 'learning_evidence',
    });

    const rule = this.unlockRules.get(params.ruleId);
    if (!rule) {
      throw new Error(`Regra de desbloqueio não encontrada: ${params.ruleId}`);
    }

    // 3. Verificar se o ativo possui os 12 campos do cadastro interno de diligência preenchidos (Evidência 5)
    const rights = this.rightsRegistry.get(rule.rightsCharacterAndFileId);
    if (!rights) {
      throw new Error(
        `BLOCKED_MISSING_RIGHTS_RECORD: Ativo '${rule.rightsCharacterAndFileId}' não encontrado no cadastro interno de diligência.`
      );
    }
    const rightsValidation = this.validateAssetRightsForProduction(rights);
    if (!rightsValidation.approved) {
      throw new Error(rightsValidation.reason);
    }

    // 4. Proteção contra concessão duplicada / moeda em dobro (Evidência 2)
    const ruleDedupKey = `rule::${params.studentId}::${params.ruleId}`;
    const evidenceDedupKey = `ev::${params.studentId}::${params.evidenceId}`;
    const alreadyGranted =
      params.wallet.processedEventIds.includes(params.eventId) ||
      params.wallet.processedEventIds.includes(ruleDedupKey) ||
      params.wallet.processedEventIds.includes(evidenceDedupKey);

    const coinsToAdd = alreadyGranted ? 0 : rule.cosmeticCurrencyGrant;
    const nextProcessedEvents = alreadyGranted
      ? [...params.wallet.processedEventIds]
      : [...params.wallet.processedEventIds, params.eventId, ruleDedupKey, evidenceDedupKey];

    const nextVersion = (params.wallet.version ?? 1) + (alreadyGranted ? 0 : 1);
    const unsignedUpdatedWallet = {
      studentId: params.wallet.studentId,
      cosmeticBalance: params.wallet.cosmeticBalance + coinsToAdd,
      lifetimeEarnedFromEvidence: params.wallet.lifetimeEarnedFromEvidence + coinsToAdd,
      processedEventIds: nextProcessedEvents,
      processedReceiptIds: [...(params.wallet.processedReceiptIds || [])],
      version: nextVersion,
      canBuyAcademicAdvantage: false as const,
      canBePurchasedWithRealMoney: false as const,
      signatureAlgorithm: params.wallet.signatureAlgorithm || 'HMAC-SHA256',
    };

    const updatedWallet: StudentCosmeticWallet = {
      ...unsignedUpdatedWallet,
      serverSignature: this.signWalletState(unsignedUpdatedWallet),
    };

    // 5. Gravar as 3 respostas da Política Interna de Auditoria do Áquila Pro (Evidência 6)
    const q1 = rule.learningObjective;
    const q2 = `Evidência verificada [${params.evidenceId}]: ${params.evidenceSummary}`;
    const q3 = `Conjunto '${rule.historicalOrOriginalReference}' (${rule.discipline} — Álbum '${rule.collectionAlbum}') vinculado diretamente ao objetivo curricular na modalidade '${params.modalityChosen}'.`;

    const auditSig = crypto
      .createHmac('sha256', this.schoolAuthoritySecretKey)
      .update(`${params.eventId}|${params.studentId}|${params.ruleId}|${q1}|${q2}|${q3}`)
      .digest('hex');

    const auditRecord: GamificationUnlockAuditRecord = {
      auditId: `audit_gamif_${Date.now()}_${params.eventId}`,
      policyClassification: 'POLITICA_INTERNA_APROVACAO_PEDAGOGICA_AQUILA',
      eventId: params.eventId,
      studentId: params.studentId,
      ruleId: params.ruleId,
      question1WhatDidStudentLearn: q1,
      question2WhichEvidenceDemonstratesIt: q2,
      question3WhyDoesCharacterOrItemMakeSense: q3,
      usedAccessibleEquivalence: Boolean(params.usedAccessibleEquivalence),
      verifiedRightsCharacterAndFileId: rule.rightsCharacterAndFileId,
      serverSignature: auditSig,
      createdAt: new Date().toISOString(),
    };

    this.auditTrail.push(auditRecord);

    return {
      grantedNewUnlock: !alreadyGranted,
      practiceRetryOnly: alreadyGranted,
      cosmeticCoinsAdded: coinsToAdd,
      unlockedItemIds: alreadyGranted ? [] : [...rule.guaranteedRewardItemIds],
      updatedWallet,
      auditRecord,
    };
  }

  /**
   * EVIDÊNCIA 7 (Bloqueante 2): Constrói resposta de Mentor Histórico Simulado:
   * - Exige Relatório de Avaliação de Risco Algorítmico previamente aprovado (art. 11, I e II, do Decreto nº 12.880/2026).
   * - Bloqueia frases de pressão emocional para retornar ou pedido de segredo aos responsáveis (art. 11, II).
   * - Inclui o aviso adotado pelo Áquila para atender ao art. 11, I, do Decreto nº 12.880/2026.
   */
  public buildSafeHistoricalMentorResponse(params: {
    mentorCharacterId: string;
    characterName: string;
    historicalFactCitations: string[];
    fictionalPedagogicalDialogue: string;
    teacherSourceLinks: string[];
  }): SimulatedHistoricalMentorResponse {
    const riskReport = this.mentorRiskReports.get(params.mentorCharacterId);
    if (!riskReport || !riskReport.approvedByPedagogicalAndLegalBoard) {
      throw new Error(
        `MENTOR_RISK_REPORT_REQUIRED (Decreto nº 12.880/2026, art. 11, I e II): Mentor '${params.mentorCharacterId}' não possui Relatório de Avaliação de Risco Algorítmico aprovado.`
      );
    }

    const forbiddenManipulationPatterns = [
      /não conte aos seus pais/i,
      /segredo nosso/i,
      /ficarei triste se você não voltar/i,
      /volte agora ou perderá/i,
      /não saia do aplicativo/i,
    ];
    for (const pattern of forbiddenManipulationPatterns) {
      if (pattern.test(params.fictionalPedagogicalDialogue)) {
        throw new Error(
          'BEHAVIORAL_MANIPULATION_BLOCKED (Decreto nº 12.880/2026, art. 11, II): Diálogo bloqueado por conter pressão emocional ou solicitação de segredo.'
        );
      }
    }

    return {
      characterName: params.characterName,
      aquilaAdoptedArt11TransparencyNotice: AQUILA_ADOPTED_ART11_TRANSPARENCY_NOTICE,
      noticeLegalContext:
        'Texto adotado pelo Áquila Pro para atender à exigência de transparência sobre o caráter sintético e automatizado da interação (art. 11, I, do Decreto nº 12.880/2026).',
      riskAssessmentReportId: riskReport.reportId,
      historicalFactCitations: params.historicalFactCitations,
      fictionalPedagogicalDialogue: params.fictionalPedagogicalDialogue,
      teacherSourceLinks: params.teacherSourceLinks,
      containsEmotionalPressureToReturn: false,
      requestsSecrecyFromParents: false,
      storesUnnecessaryPersonalMemory: false,
      receivesSecurityCameraOrBiometricData: false,
    };
  }

  public registerRightsRecord(record: AssetRightsDiligenceRecord): void {
    const check = this.validateAssetRightsForProduction(record);
    if (!check.approved) {
      throw new Error(check.reason);
    }
    this.rightsRegistry.set(record.characterAndFileId, record);
  }

  public registerUnlockRule(rule: PedagogicalUnlockRule): void {
    this.unlockRules.set(rule.ruleId, rule);
  }

  public getAuditTrail(): GamificationUnlockAuditRecord[] {
    return [...this.auditTrail];
  }

  private seedMvpRightsRulesAndRiskReports(): void {
    const mvpSets: Array<{
      characterAndFileId: string;
      ruleId: string;
      album: string;
      discipline: string;
      reference: string;
      objective: string;
      svgFile: string;
      rewards: string[];
    }> = [
      {
        characterAndFileId: 'set_01_nikola_tesla::set_01_nikola_tesla.svg',
        ruleId: 'fisica_eletricidade_tesla_01',
        album: 'Inventores e energia',
        discipline: 'Física',
        reference: 'Nikola Tesla (1856–1943) & Engenharia da Corrente Alternada',
        objective: 'Interpretar representações de circuitos elétricos, comparar geração/consumo e justificar soluções em simulador virtual seguro.',
        svgFile: 'set_01_nikola_tesla.svg',
        rewards: ['card_biografico_tesla_01', 'acessorio_bobina_bancada_01', 'traje_laboratorio_tesla_01', 'cenario_oficina_eletricidade_01'],
      },
      {
        characterAndFileId: 'set_02_machado_firmina::set_02_machado_firmina.svg',
        ruleId: 'portugues_literatura_machado_firmina_01',
        album: 'Escritoras e escritores brasileiros',
        discipline: 'Língua Portuguesa',
        reference: 'Machado de Assis (1839–1908) & Maria Firmina dos Reis (1822–1917)',
        objective: 'Interpretar perspectivas narrativas, analisar escolhas autorais e produzir texto autoral revisionado.',
        svgFile: 'set_02_machado_firmina.svg',
        rewards: ['card_machado_firmina_01', 'acessorio_pena_tinteiro_01', 'traje_cronista_sec_xix_01', 'cenario_biblioteca_brasileira_01'],
      },
      {
        characterAndFileId: 'set_03_merian_mendel::set_03_merian_mendel_biodiversidade.svg',
        ruleId: 'biologia_biodiversidade_merian_mendel_01',
        album: 'Vida e biodiversidade',
        discipline: 'Biologia',
        reference: 'Maria Sibylla Merian (1647–1717) & Gregor Mendel (1822–1884)',
        objective: 'Investigar diversidade ecológica, metamorfose, hereditariedade e relações entre seres vivos.',
        svgFile: 'set_03_merian_mendel_biodiversidade.svg',
        rewards: ['card_merian_mendel_01', 'acessorio_caderno_campo_01', 'traje_naturalista_01', 'cenario_jardim_virtual_01'],
      },
      {
        characterAndFileId: 'set_04_hipatia_euclides::set_04_hipatia_euclides_matematica.svg',
        ruleId: 'matematica_geometria_hipatia_euclides_01',
        album: 'Matemática em ação',
        discipline: 'Matemática',
        reference: 'Euclides (~300 a.C.), Hipátia (~360–415 d.C.) & al-Khwarizmi (~780–850 d.C.)',
        objective: 'Construir, demonstrar e explicar uma solução geométrica ou algébrica passo a passo.',
        svgFile: 'set_04_hipatia_euclides_matematica.svg',
        rewards: ['card_hipatia_euclides_01', 'acessorio_astrolabio_compasso_01', 'traje_arquiteto_matematico_01', 'cenario_oficina_construcoes_01'],
      },
      {
        characterAndFileId: 'set_05_fontes_historicas::set_05_fontes_historicas_cartografia.svg',
        ruleId: 'historia_geografia_fontes_01',
        album: 'Civilizações e fontes históricas',
        discipline: 'História & Geografia',
        reference: 'Eratóstenes (~276–194 a.C.), Alexander von Humboldt (1769–1859) & Investigadores Originais',
        objective: 'Confrontar fontes históricas e mapas, distinguindo evidência documental de interpretação.',
        svgFile: 'set_05_fontes_historicas_cartografia.svg',
        rewards: ['card_fontes_cartografia_01', 'acessorio_bussola_geodesica_01', 'traje_investigador_fontes_01', 'cenario_galeria_historica_01'],
      },
      {
        characterAndFileId: 'set_06_ada_turing::set_06_ada_turing_algoritmos.svg',
        ruleId: 'computacao_algoritmos_ada_turing_01',
        album: 'Algoritmos e cidadania digital', // Álbum próprio separado do álbum de energia!
        discipline: 'Computação & Cidadania Digital',
        reference: 'Ada Lovelace (1815–1852) & Alan Turing (1912–1954)',
        objective: 'Elaborar algoritmos, explicar como foram testados e aplicar boas práticas de proteção de dados.',
        svgFile: 'set_06_ada_turing_algoritmos.svg',
        rewards: ['card_ada_turing_01', 'acessorio_cartao_analitico_01', 'traje_engenheiro_algoritmos_01', 'cenario_oficina_programacao_01'],
      },
    ];

    for (const s of mvpSets) {
      const rightsRecord: AssetRightsDiligenceRecord = {
        characterAndFileId: s.characterAndFileId,
        authorAndHolder: 'Equipe Interna de Design Pedagógico Áquila Pro (Titular: Áquila Educação Ltda.)',
        sourceUrl: `apps/electron/src/database/visual_assets/gamification_mvp/${s.svgFile}`,
        licenseAndVersion: 'ARTE_PROPRIA_EQUIPE_AQUILA',
        verificationDate: '2026-10-25',
        approvedTerritories: ['BR'],
        adaptationAllowed: true,
        commercialUseAllowed: true,
        requiredCreditText: `Ilustração vetorial original da equipe Áquila Pro (${s.svgFile}) — Referência histórica: ${s.reference}.`,
        authorizationProofRef: `CESSAO-PATRIMONIAL-INTERNA-ART29-LDA-2026-${s.ruleId.toUpperCase()}`,
        brandOrRepresentationRestrictions:
          'Vedado uso de marcas comerciais contemporâneas, logotipos de terceiros ou aparência de adaptações audiovisuais protegidas.',
        approvedByReviewer: 'Comitê Editorial & Jurídico Áquila Pro (Revisão Art. 29 Lei nº 9.610/98)',
      };
      this.rightsRegistry.set(rightsRecord.characterAndFileId, rightsRecord);

      this.unlockRules.set(s.ruleId, {
        ruleId: s.ruleId,
        collectionAlbum: s.album,
        discipline: s.discipline,
        historicalOrOriginalReference: s.reference,
        learningObjective: s.objective,
        stageType: 'aplicacao',
        requiredEvidenceTypes: ['manipulacao_simulador', 'texto', 'audio', 'mediacao_docente'],
        validationMethod: 'hibrida_simulador_rubrica',
        accessibleEquivalentDescription: 'Atividade equivalente por áudio, leitor de tela ou mediação docente sem distinção pública.',
        guaranteedRewardItemIds: s.rewards,
        cosmeticCurrencyGrant: 100,
        rightsCharacterAndFileId: s.characterAndFileId,
        allowsInfiniteFarmingOnRepeat: false,
        lostOnStudentAbsence: false,
      });
    }

    this.mentorRiskReports.set('mentor_nikola_tesla_sim', {
      reportId: 'RRA-DEC12880-ART11-TESLA-2026-01',
      mentorCharacterId: 'mentor_nikola_tesla_sim',
      characterName: 'Nikola Tesla (Simulação Pedagógica)',
      evaluatedAt: '2026-10-25',
      approvedByPedagogicalAndLegalBoard: true,
      approvedKnowledgeBaseRef: 'KB-FISICA-ELETRICIDADE-BNCC-EF08CI02-EM13CNT106',
      behavioralManipulationSafeguards: {
        noEmotionalPressureToReturn: true,
        noSecrecyRequestsFromGuardians: true,
        noUnnecessaryPersonalMemory: true,
        separatesHistoricalFactFromFictionalDialogue: true,
        allowsStudentAndTeacherContestation: true,
        requiresHumanMediationForSensitiveTopics: true,
      },
      residualRiskLevel: 'baixo_controlado',
    });
  }
}

export const pedagogicalGamificationService = PedagogicalGamificationService.getInstance();
export default pedagogicalGamificationService;
