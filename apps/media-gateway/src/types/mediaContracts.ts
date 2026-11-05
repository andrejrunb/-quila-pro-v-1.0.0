/**
 * mediaContracts.ts
 * ============================================================================
 * Contrato Rigoroso do Media Gateway MCP (Áquila Pro — Media Asset Pipeline)
 * ============================================================================
 * Princípios de Governança:
 * 1. ZERO DADOS DE ALUNOS EM MCPS: Nenhuma redação, nome, biometria ou dado pessoal deixa o Áquila.
 * 2. AUTORIZAÇÃO PRÉVIA DE DIREITOS: O Gatekeeper bloqueia qualquer job sem license_status: AUTHORIZED.
 * 3. PROMPT & ASSET VERSIONING: Cada artefato possui manifesto imutável com hashes SHA-256 de prompt e arquivo.
 * 4. LIMITES ORÇAMENTÁRIOS: Teto de custo em centavos definido por job e diário.
 * 5. REVISÃO DOCENTE OBRIGATÓRIA (HITL): O MCP gera rascunho (NEEDS_REVIEW); o professor/DPO aprova antes de publicar.
 * ============================================================================
 */

export type MediaJobType = 'IMAGE' | 'VIDEO' | 'SLIDES' | 'AUDIO';

export type MediaJobPurpose =
  | 'ILUSTRACAO_DIDATICA'
  | 'EXPLICACAO_CONCEITUAL'
  | 'APRESENTACAO_SLIDES'
  | 'ACESSIBILIDADE_AUDIO'
  | 'COSMETICO_PEDAGOGICO';

export type MediaJobStatus =
  | 'DRAFT'
  | 'QUEUED'
  | 'GENERATING'
  | 'GENERATED'
  | 'AUTO_VALIDATED'
  | 'IN_REVIEW'
  | 'APPROVED'
  | 'PUBLISHED'
  | 'REJECTED'
  | 'ARCHIVED';

export type LicenseStatus = 'AUTHORIZED' | 'PENDING' | 'REJECTED' | 'NOT_APPLICABLE_PUBLIC_DOMAIN';

export interface MediaJobConstraints {
  no_student_data: boolean;
  max_duration_seconds?: number;
  aspect_ratio?: '16:9' | '4:3' | '1:1' | '9:16';
  brand?: 'aquila' | 'escola_parceira';
  max_cost_cents: number;
}

export interface MediaJobRequest {
  job_id: string;
  type: MediaJobType;
  purpose: MediaJobPurpose;
  subject: string;
  audience: string;
  language: string;
  source_asset_ids: string[];
  license_status: LicenseStatus;
  constraints: MediaJobConstraints;
  brief: string;
  review_required: boolean;
  created_at: number;
  submitted_by: string; // ID do professor ou coordenador
}

export interface ReviewMetadata {
  required: boolean;
  reviewer: string | null;
  decision: 'APPROVED' | 'REJECTED' | 'REVISION_REQUESTED' | null;
  reviewed_at: number | null;
  notes?: string;
}

export interface MediaJobResponse {
  job_id: string;
  status: MediaJobStatus;
  provider: string;
  model: string;
  asset_url: string;
  asset_sha256: string;
  prompt_hash: string;
  cost_cents: number;
  review: ReviewMetadata;
  created_at: number;
  updated_at: number;
}

export interface MediaManifest {
  manifest_version: '1.0.0';
  job_id: string;
  asset_sha256: string;
  type: MediaJobType;
  purpose: MediaJobPurpose;
  subject: string;
  audience: string;
  provider: string;
  model: string;
  prompt_raw: string;
  prompt_sha256: string;
  parameters: Record<string, unknown>;
  source_asset_ids: string[];
  license_status: LicenseStatus;
  cost_cents: number;
  review: ReviewMetadata;
  published_version?: string;
  published_at?: number;
}

/**
 * Catálogo de Gamificação Educacional Soberana (Inspirado em Game Design, 100% Original)
 */
export type CosmeticCategory = 'AVATAR_SOBERANO' | 'MOLDURA_BNCC' | 'INSIGNIA_MESTRIA' | 'TEMA_CADERNO';

export type KnowledgeArea =
  | 'FISICA'
  | 'QUIMICA'
  | 'BIOLOGIA'
  | 'MATEMATICA'
  | 'HISTORIA'
  | 'GEOGRAFIA'
  | 'FILOSOFIA_SOCIOLOGIA'
  | 'LITERATURA_ARTES';

export type ArenaArchetype =
  | 'MAGO_DA_ENERGIA'
  | 'ALQUIMISTA_DA_MATERIA'
  | 'SENTINELA_DA_VIDA'
  | 'ARQUITETO_DOS_NUMEROS'
  | 'GUARDAO_DO_TEMPO'
  | 'MESTRE_DAS_LINGUAGENS';

export type CitationVerificationStatus =
  | 'VERIFIED_PRIMARY_SOURCE'
  | 'HISTORICAL_ATTRIBUTION_UNCERTAIN'
  | 'PENDING_DOCUMENT_LOCATION'
  | 'REMOVED_PENDING_PRIMARY_SOURCE'
  | 'VERIFIED'
  | 'PENDING_VERIFICATION';

export interface HistoricalQuoteRecord {
  text: string;
  source: string;
  original_language?: string;
  original_text?: string;
  translator?: string;
  verification_status: CitationVerificationStatus;
  historiographical_note?: string;
}

export interface PedagogicalUnlockCriteria {
  type: 'PROGRESS' | 'MASTERY' | 'EXPLORATION';
  min_correct?: number;
  activity_ids?: string[];
  bncc_progress_description?: string;
}

export interface CharacterVisualMetadata {
  status: 'GENERATED_DRAFT' | 'APPROVED' | 'PUBLISHED';
  license: 'AQUILA_ORIGINAL' | 'PENDING_REVIEW' | 'PUBLIC_DOMAIN';
  asset_ref?: string;
}

export interface IntellectualWarriorCharacter {
  id: string;
  name: string;
  historical_title: string;
  knowledge_area: KnowledgeArea;
  archetype: ArenaArchetype;
  relic_item: string;
  bncc_skill_code: string;
  pedagogical_unlock_condition: string;
  rarity: 'COMUM' | 'RARO' | 'EPICO' | 'LENDARIO';
  historical_quote: string;
  pedagogical_role: string;
  image_ref?: string;
  publication_status?: 'DRAFT' | 'PENDING_REVIEW' | 'APPROVED' | 'PUBLISHED';
  quotes?: HistoricalQuoteRecord[];
  visual?: CharacterVisualMetadata;
  unlock_criteria?: PedagogicalUnlockCriteria;
  cosmetic_tiers?: ('APRENDIZ' | 'ESPECIALISTA' | 'MESTRE')[];
}

export interface PedagogicalCosmeticItem {
  id: string;
  name: string;
  category: CosmeticCategory;
  description: string;
  bncc_skill_code?: string; // Ex: EM13MAT302 (Funções Quadráticas)
  rarity: 'COMUM' | 'RARO' | 'EPICO' | 'LENDARIO';
  unlock_condition: string;
  icon_asset_id?: string;
  is_purely_cosmetic: true; // Garantia anti-pay-to-win e não punitiva
}
