/**
 * MediaGatewayService.test.ts
 * Suíte de Testes Unitários de Governança e Contrato do Media Gateway MCP
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { MediaGatewayService } from '../services/MediaGatewayService';
import { GamificationCatalogService } from '../services/GamificationCatalogService';
import { MediaJobRequest } from '../types/mediaContracts';

describe('MediaGatewayService — Governança e Pipeline de Mídia', () => {
  let testStorageDir: string;
  let gateway: MediaGatewayService;

  beforeEach(() => {
    testStorageDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aquila-media-test-'));
    gateway = new MediaGatewayService({
      storageDir: testStorageDir,
      dailyBudgetLimitCents: 100 // $1.00 USD para teste
    });
  });

  afterEach(() => {
    if (fs.existsSync(testStorageDir)) {
      fs.rmSync(testStorageDir, { recursive: true, force: true });
    }
  });

  const validRequest: MediaJobRequest = {
    job_id: 'media_test_001',
    type: 'IMAGE',
    purpose: 'ILUSTRACAO_DIDATICA',
    subject: 'Funções Quadráticas',
    audience: 'ENEM',
    language: 'pt-BR',
    source_asset_ids: ['inep-enem-2023-q45'],
    license_status: 'AUTHORIZED',
    constraints: {
      no_student_data: true,
      max_duration_seconds: 0,
      aspect_ratio: '16:9',
      brand: 'aquila',
      max_cost_cents: 20
    },
    brief: 'Ilustração do vértice de uma parábola com indicação do ponto máximo.',
    review_required: true,
    created_at: Date.now(),
    submitted_by: 'prof_matematica_01'
  };

  test('1. Bloqueia estritamente jobs contendo dados de estudantes (LGPD Art. 14 / ECA)', async () => {
    const invalidRequest = {
      ...validRequest,
      constraints: {
        ...validRequest.constraints,
        no_student_data: false
      }
    };

    await expect(gateway.submitJob(invalidRequest)).rejects.toThrow('SECURITY_VIOLATION');
  });

  test('2. Bloqueia jobs com fontes não autorizadas (Direitos Autorais / Gatekeeper)', async () => {
    const unlicensedRequest = {
      ...validRequest,
      license_status: 'PENDING' as const
    };

    await expect(gateway.submitJob(unlicensedRequest)).rejects.toThrow('COPYRIGHT_VIOLATION');
  });

  test('3. Bloqueia jobs que ultrapassam o orçamento diário do Gateway', async () => {
    const expensiveRequest = {
      ...validRequest,
      constraints: {
        ...validRequest.constraints,
        max_cost_cents: 150 // Excede os 100 centavos configurados
      }
    };

    await expect(gateway.submitJob(expensiveRequest)).rejects.toThrow('BUDGET_EXCEEDED');
  });

  test('4. Ciclo Completo: Enfileiramento -> Recepção MCP -> Revisão Docente -> Publicação', async () => {
    // Passo A: Submissão
    const queued = await gateway.submitJob(validRequest);
    expect(queued.status).toBe('QUEUED');
    expect(queued.prompt_hash).toBeDefined();

    // Passo B: Recebimento do Provedor MCP (Entra como RASCUNHO EM REVISÃO, nunca publicado!)
    const fakeBuffer = Buffer.from('FAKE_PNG_BINARY_CONTENT_FOR_PARABOLA');
    const inReview = await gateway.receiveMcpAsset('media_test_001', validRequest, {
      provider: 'imagen-mcp',
      model: 'imagen-3.0-generate',
      assetBuffer: fakeBuffer,
      costCents: 15
    });

    expect(inReview.status).toBe('IN_REVIEW');
    expect(inReview.asset_sha256).toBeDefined();
    expect(fs.existsSync(inReview.asset_url)).toBe(true);

    // Tentativa de publicação antes da aprovação DEVE falhar
    await expect(gateway.publishJob('media_test_001', 'coord_pedagogica')).rejects.toThrow('PUBLICATION_DENIED');

    // Passo C: Aprovação pelo Professor (HITL)
    const approved = await gateway.reviewJob('media_test_001', 'prof_matematica_01', 'APPROVED', 'Excelente clareza visual.');
    expect(approved.status).toBe('APPROVED');
    expect(approved.review.decision).toBe('APPROVED');

    // Passo D: Publicação Oficial
    const published = await gateway.publishJob('media_test_001', 'prof_matematica_01', 'v1.0');
    expect(published.success).toBe(true);
    expect(published.manifest.published_version).toBe('v1.0');

    const job = gateway.getJob('media_test_001');
    expect(job?.status).toBe('PUBLISHED');
  });

  test('5. Catálogo de Gamificação Pedagógica: 100% cosmético, original e alinhado à BNCC', () => {
    const catalog = GamificationCatalogService.getCatalog();
    expect(catalog.length).toBeGreaterThanOrEqual(5);

    for (const item of catalog) {
      expect(item.is_purely_cosmetic).toBe(true);
      expect(item.unlock_condition).toBeDefined();
    }

    const mathItems = GamificationCatalogService.getByBnccSkill('EM13MAT302');
    expect(mathItems.length).toBe(1);
    expect(mathItems[0].name).toContain('Vértice Dourado');

    const characters = GamificationCatalogService.getCharacters();
    expect(characters.length).toBeGreaterThanOrEqual(15);

    const physicsChars = GamificationCatalogService.getCharactersByArea('FISICA');
    expect(physicsChars.length).toBeGreaterThanOrEqual(4);
    expect(physicsChars.some(c => c.name === 'Isaac Newton')).toBe(true);
    expect(physicsChars.some(c => c.name === 'Albert Einstein')).toBe(true);

    const bioChars = GamificationCatalogService.getCharactersByArea('BIOLOGIA');
    expect(bioChars.some(c => c.name === 'Rosalind Franklin')).toBe(true);
  });
});
