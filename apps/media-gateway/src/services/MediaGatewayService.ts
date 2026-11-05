/**
 * MediaGatewayService.ts
 * ============================================================================
 * Gateway Soberano de Mídia & Orquestrador de MCPs (Áquila Pro)
 * ============================================================================
 */

import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import {
  MediaJobRequest,
  MediaJobResponse,
  MediaJobStatus,
  MediaManifest,
  ReviewMetadata
} from '../types/mediaContracts';

export interface MediaGatewayConfig {
  storageDir: string;
  dailyBudgetLimitCents: number;
}

export class MediaGatewayService {
  private jobs: Map<string, MediaJobResponse> = new Map();
  private manifests: Map<string, MediaManifest> = new Map();
  private dailySpentCents = 0;
  private config: MediaGatewayConfig;

  constructor(config?: Partial<MediaGatewayConfig>) {
    this.config = {
      storageDir: config?.storageDir || path.join(process.cwd(), 'media_assets'),
      dailyBudgetLimitCents: config?.dailyBudgetLimitCents || 1000 // $10.00 USD diário por padrão
    };

    if (!fs.existsSync(this.config.storageDir)) {
      fs.mkdirSync(this.config.storageDir, { recursive: true });
    }
  }

  /**
   * Submissão Estruturada de Job de Mídia
   * Executa checagem de governança preventiva (Zero Student Data, Direitos e Orçamento)
   */
  public async submitJob(request: MediaJobRequest): Promise<MediaJobResponse> {
    // 1. Guarda LGPD / ECA: Proibição estrita de dados de estudantes
    if (!request.constraints.no_student_data) {
      throw new Error('SECURITY_VIOLATION: Envio de dados de estudantes para MCPs de mídia é estritamente proibido.');
    }

    // 2. Guarda de Direitos Autorais (LDA): Bloqueio prévio do Gatekeeper
    if (request.license_status !== 'AUTHORIZED' && request.license_status !== 'NOT_APPLICABLE_PUBLIC_DOMAIN') {
      throw new Error(`COPYRIGHT_VIOLATION: O job de mídia exige fontes com status AUTHORIZED. Atual: ${request.license_status}`);
    }

    // 3. Guarda Financeira: Limite de custo por job e limite diário
    if (request.constraints.max_cost_cents <= 0) {
      throw new Error('BUDGET_VIOLATION: max_cost_cents deve ser maior que zero.');
    }

    if (this.dailySpentCents + request.constraints.max_cost_cents > this.config.dailyBudgetLimitCents) {
      throw new Error('BUDGET_EXCEEDED: Teto orçamentário diário do Media Gateway atingido.');
    }

    const promptHash = crypto.createHash('sha256').update(request.brief, 'utf8').digest('hex');

    const jobResponse: MediaJobResponse = {
      job_id: request.job_id,
      status: 'QUEUED',
      provider: 'PENDING_DISPATCH',
      model: 'PENDING_DISPATCH',
      asset_url: '',
      asset_sha256: '',
      prompt_hash: promptHash,
      cost_cents: 0,
      review: {
        required: request.review_required,
        reviewer: null,
        decision: null,
        reviewed_at: null
      },
      created_at: Date.now(),
      updated_at: Date.now()
    };

    this.jobs.set(request.job_id, jobResponse);
    return jobResponse;
  }

  /**
   * Processamento do Retorno do MCP (Recebimento de Rascunho Bruto)
   */
  public async receiveMcpAsset(
    jobId: string,
    request: MediaJobRequest,
    providerData: {
      provider: string;
      model: string;
      assetBuffer: Buffer;
      costCents: number;
      parameters?: Record<string, unknown>;
    }
  ): Promise<MediaJobResponse> {
    const job = this.jobs.get(jobId);
    if (!job) {
      throw new Error(`JOB_NOT_FOUND: Job ${jobId} não encontrado.`);
    }

    if (providerData.costCents > request.constraints.max_cost_cents) {
      job.status = 'FAILED' as MediaJobStatus;
      throw new Error(`BUDGET_OVERRUN: Provedor excedeu o custo contratado (${providerData.costCents} > ${request.constraints.max_cost_cents} centavos).`);
    }

    this.dailySpentCents += providerData.costCents;

    // Persistência isolada do asset em storage temporário
    const assetSha256 = crypto.createHash('sha256').update(providerData.assetBuffer).digest('hex');
    const ext = request.type === 'IMAGE' ? 'png' : request.type === 'VIDEO' ? 'mp4' : request.type === 'SLIDES' ? 'pdf' : 'mp3';
    const filename = `${jobId}_${assetSha256.substring(0, 12)}.${ext}`;
    const filePath = path.join(this.config.storageDir, filename);

    fs.writeFileSync(filePath, providerData.assetBuffer);

    // Geração do Manifesto Imutável
    const manifest: MediaManifest = {
      manifest_version: '1.0.0',
      job_id: jobId,
      asset_sha256: assetSha256,
      type: request.type,
      purpose: request.purpose,
      subject: request.subject,
      audience: request.audience,
      provider: providerData.provider,
      model: providerData.model,
      prompt_raw: request.brief,
      prompt_sha256: job.prompt_hash,
      parameters: providerData.parameters || {},
      source_asset_ids: request.source_asset_ids,
      license_status: request.license_status,
      cost_cents: providerData.costCents,
      review: {
        required: request.review_required,
        reviewer: null,
        decision: null,
        reviewed_at: null
      }
    };

    this.manifests.set(jobId, manifest);

    // O status entra estritamente em IN_REVIEW (NEEDS_REVIEW) — NUNCA é publicado diretamente!
    job.status = 'IN_REVIEW';
    job.provider = providerData.provider;
    job.model = providerData.model;
    job.asset_url = filePath;
    job.asset_sha256 = assetSha256;
    job.cost_cents = providerData.costCents;
    job.updated_at = Date.now();

    return job;
  }

  /**
   * Revisão Docente Obrigatória (Human-In-The-Loop)
   */
  public async reviewJob(
    jobId: string,
    reviewerId: string,
    decision: 'APPROVED' | 'REJECTED' | 'REVISION_REQUESTED',
    notes?: string
  ): Promise<MediaJobResponse> {
    const job = this.jobs.get(jobId);
    if (!job) {
      throw new Error(`JOB_NOT_FOUND: Job ${jobId} não encontrado.`);
    }

    if (job.status !== 'IN_REVIEW') {
      throw new Error(`INVALID_STATE: Apenas jobs em IN_REVIEW podem ser revisados. Estado atual: ${job.status}`);
    }

    const reviewMeta: ReviewMetadata = {
      required: true,
      reviewer: reviewerId,
      decision,
      reviewed_at: Date.now(),
      notes
    };

    job.review = reviewMeta;
    job.status = decision === 'APPROVED' ? 'APPROVED' : decision === 'REJECTED' ? 'REJECTED' : 'DRAFT';
    job.updated_at = Date.now();

    const manifest = this.manifests.get(jobId);
    if (manifest) {
      manifest.review = reviewMeta;
    }

    return job;
  }

  /**
   * Publicação Versionada Segura
   * Só permite publicação de materiais formalmente aprovados pelo professor/coordenação
   */
  public async publishJob(
    jobId: string,
    publisherId: string,
    version: string = 'v1.0'
  ): Promise<{ success: boolean; publishedUrl: string; manifest: MediaManifest }> {
    const job = this.jobs.get(jobId);
    const manifest = this.manifests.get(jobId);

    if (!job || !manifest) {
      throw new Error(`JOB_NOT_FOUND: Job ${jobId} ou manifesto não encontrado.`);
    }

    if (job.status !== 'APPROVED') {
      throw new Error(`PUBLICATION_DENIED: Apenas artefatos com status APPROVED podem ser publicados. Status atual: ${job.status}`);
    }

    manifest.published_version = version;
    manifest.published_at = Date.now();

    job.status = 'PUBLISHED';
    job.updated_at = Date.now();

    return {
      success: true,
      publishedUrl: job.asset_url,
      manifest
    };
  }

  public getJob(jobId: string): MediaJobResponse | undefined {
    return this.jobs.get(jobId);
  }

  public getManifest(jobId: string): MediaManifest | undefined {
    return this.manifests.get(jobId);
  }

  public getDailySpent(): number {
    return this.dailySpentCents;
  }
}
