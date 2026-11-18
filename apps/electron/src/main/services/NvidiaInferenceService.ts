import * as fs from 'fs';
import * as https from 'https';
import * as path from 'path';
import { logger } from '../logger';

export interface NvidiaChatResponse {
  content: string;
  model: string;
  totalTokens?: number;
  provider?: 'nvidia-nim' | 'google-gemini' | 'offline-fallback';
}

export const DEFAULT_NIM_MODEL_CHAIN: string[] = [
  'nvidia/nemotron-3.5-lightning-30b-a3b',
  'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning',
  'mistralai/codestral-22b-instruct-v0.1',
  'nvidia/llama-3.1-nemotron-70b-instruct',
];

export const DEFAULT_GEMINI_MODEL_CHAIN: string[] = [
  'gemini-2.5-flash',
  'gemini-flash-latest',
];

const ENV_TARGET_KEYS = new Set([
  'NVIDIA_API_KEYS',
  'NVIDIA_API_KEY_4',
  'NVIDIA_API_KEY_3',
  'NVIDIA_API_KEY_2',
  'NVIDIA_API_KEY',
  'GOOGLE_API_KEY',
  'GEMINI_API_KEY',
]);

function isNetworkUnreachableError(err: any): boolean {
  const msg = String(err?.message || err || '');
  return /\b(ENOTFOUND|EAI_AGAIN|ECONNREFUSED|ENETUNREACH|EHOSTUNREACH)\b/i.test(msg);
}

export class NvidiaInferenceService {
  private static instance: NvidiaInferenceService;
  private defaultModel: string = DEFAULT_NIM_MODEL_CHAIN[0];
  private keyRotationCursor: number = 0;

  public static getInstance(): NvidiaInferenceService {
    if (!NvidiaInferenceService.instance) {
      NvidiaInferenceService.instance = new NvidiaInferenceService();
    }
    return NvidiaInferenceService.instance;
  }

  private constructor() {
    this.loadEnvFilesSafe();
    const nimKeys = this.getNimKeys();
    const geminiKeys = this.getGeminiKeys();
    if (nimKeys.length > 0 || geminiKeys.length > 0) {
      logger.info(
        `[NvidiaInferenceService] Pool de inferência carregado (${nimKeys.length} chave(s) NVIDIA NIM, ${geminiKeys.length} chave(s) Gemini).`
      );
    } else {
      logger.warn('[NvidiaInferenceService] Nenhuma chave NVIDIA_API_KEY ou GOOGLE_API_KEY/GEMINI_API_KEY configurada. Modo fallback offline ativo.');
    }
  }

  /**
   * Carrega chaves de arquivos .env (raiz e apps/electron) sem sobrescrever variáveis já presentes em process.env.
   */
  public loadEnvFilesSafe(): void {
    const candidatePaths = Array.from(
      new Set([
        path.resolve(process.cwd(), '.env'),
        path.resolve(process.cwd(), '../../.env'),
        path.resolve(__dirname, '../../../.env'),
        path.resolve(__dirname, '../../../../.env'),
        path.resolve(__dirname, '../../../../../.env'),
        'E:\\aquila\\apps\\electron\\.env',
        'E:\\aquila\\.env',
        'c:\\aquila\\.env',
      ])
    );

    for (const envPath of candidatePaths) {
      try {
        if (!fs.existsSync(envPath)) continue;
        const raw = fs.readFileSync(envPath, 'utf8');
        const lines = raw.split(/\r?\n/);
        for (const rawLine of lines) {
          const line = rawLine.trim();
          if (!line || line.startsWith('#')) continue;
          const eqIdx = line.indexOf('=');
          if (eqIdx <= 0) continue;

          const key = line.slice(0, eqIdx).trim();
          if (!ENV_TARGET_KEYS.has(key)) continue;
          if (process.env[key] && process.env[key]!.trim() !== '') continue;

          let val = line.slice(eqIdx + 1).trim();
          if (
            (val.startsWith('"') && val.endsWith('"')) ||
            (val.startsWith("'") && val.endsWith("'"))
          ) {
            val = val.slice(1, -1).trim();
          }
          if (val) {
            process.env[key] = val;
          }
        }
      } catch (err: any) {
        logger.warn(`[NvidiaInferenceService] Ignorando .env inacessível (${envPath}): ${err?.message || err}`);
      }
    }
  }

  public getDefaultModelChain(): string[] {
    return [...DEFAULT_NIM_MODEL_CHAIN];
  }

  public getNimKeys(): string[] {
    const keys: string[] = [];
    const pool = process.env.NVIDIA_API_KEYS || '';
    if (pool) {
      for (const raw of pool.split(',')) {
        const trimmed = raw.trim();
        if (trimmed && !keys.includes(trimmed)) {
          keys.push(trimmed);
        }
      }
    }
    for (const envName of ['NVIDIA_API_KEY_4', 'NVIDIA_API_KEY_3', 'NVIDIA_API_KEY_2', 'NVIDIA_API_KEY']) {
      const val = (process.env[envName] || '').trim();
      if (val && !keys.includes(val)) {
        keys.push(val);
      }
    }
    return keys;
  }

  public getPrimaryNimKey(): string {
    return this.getNimKeys()[0] || '';
  }

  public getGeminiKeys(): string[] {
    const keys: string[] = [];
    for (const envName of ['GOOGLE_API_KEY', 'GEMINI_API_KEY']) {
      const val = (process.env[envName] || '').trim();
      if (val && !keys.includes(val)) {
        keys.push(val);
      }
    }
    return keys;
  }

  public hasValidKeys(): boolean {
    return this.getNimKeys().length > 0 || this.getGeminiKeys().length > 0;
  }

  private getRotatedNimKeys(): string[] {
    const keys = this.getNimKeys();
    if (keys.length <= 1) return keys;
    const start = this.keyRotationCursor % keys.length;
    this.keyRotationCursor = (this.keyRotationCursor + 1) % keys.length;
    return [...keys.slice(start), ...keys.slice(0, start)];
  }

  /**
   * Envia prompt para NVIDIA NIM (rotação de chaves + cadeia de modelos gratuitos)
   * com failover automático para Google Gemini Free API e fallback determinístico offline.
   */
  public async generateCompletion(systemPrompt: string, userPrompt: string, model?: string): Promise<NvidiaChatResponse> {
    if (process.env.AQUILA_DISABLE_EXTERNAL_APIS === 'true' || process.env.AQUILA_AIRGAP_ACTIVE === 'true') {
      return this.buildDeterministicFallback(systemPrompt, userPrompt);
    }

    const nimKeys = this.getRotatedNimKeys();
    const geminiKeys = this.getGeminiKeys();
    if (nimKeys.length === 0 && geminiKeys.length === 0) {
      return this.buildDeterministicFallback(systemPrompt, userPrompt);
    }

    const modelChain = model
      ? [model, ...DEFAULT_NIM_MODEL_CHAIN.filter((m) => m !== model)]
      : [...DEFAULT_NIM_MODEL_CHAIN];

    let networkBroken = false;

    // 1. Tentativa NVIDIA NIM com rotação de chaves e fallback na cadeia de modelos
    for (const targetModel of modelChain) {
      if (nimKeys.length === 0 || networkBroken) break;
      for (const apiKey of nimKeys) {
        try {
          return await this.callNvidiaNimHttp(systemPrompt, userPrompt, targetModel, apiKey);
        } catch (err: any) {
          const msg = String(err?.message || err);
          logger.warn(`[NvidiaInferenceService] Falha NIM (${targetModel}): ${msg}`);
          if (isNetworkUnreachableError(err)) {
            networkBroken = true;
            break;
          }
          // Se o modelo não existe (404), pula direto para o próximo modelo da cadeia
          if (/HTTP 404/i.test(msg)) {
            break;
          }
        }
      }
    }

    // 2. Failover automático para Google Gemini Free API REST
    if (!networkBroken && geminiKeys.length > 0) {
      for (const geminiModel of DEFAULT_GEMINI_MODEL_CHAIN) {
        for (const apiKey of geminiKeys) {
          try {
            return await this.callGeminiRestHttp(systemPrompt, userPrompt, geminiModel, apiKey);
          } catch (err: any) {
            const msg = String(err?.message || err);
            logger.warn(`[NvidiaInferenceService] Falha Gemini (${geminiModel}): ${msg}`);
            if (isNetworkUnreachableError(err)) {
              networkBroken = true;
              break;
            }
            if (/HTTP 404/i.test(msg)) {
              break;
            }
          }
        }
        if (networkBroken) break;
      }
    }

    // 3. Fallback determinístico estruturado (sem rede ou falha total dos provedores)
    return this.buildDeterministicFallback(systemPrompt, userPrompt);
  }

  private callNvidiaNimHttp(
    systemPrompt: string,
    userPrompt: string,
    targetModel: string,
    apiKey: string
  ): Promise<NvidiaChatResponse> {
    const payload = JSON.stringify({
      model: targetModel,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: 2048,
      temperature: 0.2,
    });

    return new Promise((resolve, reject) => {
      const options: https.RequestOptions = {
        hostname: 'integrate.api.nvidia.com',
        path: '/v1/chat/completions',
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload),
        },
        timeout: 20000,
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
            try {
              const parsed = JSON.parse(data);
              const msg = parsed.choices?.[0]?.message;
              const content = ((msg?.content && String(msg.content).trim()) || msg?.reasoning_content || '').trim();
              if (!content) {
                reject(new Error(`NVIDIA NIM (${targetModel}) retornou resposta vazia.`));
                return;
              }
              resolve({
                content,
                model: targetModel,
                totalTokens: parsed.usage?.total_tokens,
                provider: 'nvidia-nim',
              });
            } catch (err: any) {
              reject(new Error(`Falha ao decodificar JSON da NVIDIA: ${err.message}`));
            }
          } else {
            reject(new Error(`NVIDIA API retornou HTTP ${res.statusCode}: ${data.slice(0, 300)}`));
          }
        });
      });

      req.on('error', (err) => {
        reject(new Error(`Erro de rede na conexão com a NVIDIA: ${err.message}`));
      });

      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Timeout de 20s aguardando resposta da NVIDIA'));
      });

      req.write(payload);
      req.end();
    });
  }

  private callGeminiRestHttp(
    systemPrompt: string,
    userPrompt: string,
    targetModel: string,
    apiKey: string
  ): Promise<NvidiaChatResponse> {
    const payload = JSON.stringify({
      systemInstruction: { parts: [{ text: systemPrompt }] },
      contents: [{ parts: [{ text: userPrompt }] }],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 4096,
      },
    });

    return new Promise((resolve, reject) => {
      const options: https.RequestOptions = {
        hostname: 'generativelanguage.googleapis.com',
        path: `/v1beta/models/${encodeURIComponent(targetModel)}:generateContent?key=${encodeURIComponent(apiKey)}`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload),
        },
        timeout: 20000,
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
            try {
              const parsed = JSON.parse(data);
              const parts = parsed.candidates?.[0]?.content?.parts;
              const content = Array.isArray(parts)
                ? parts.map((p: any) => p?.text || '').join('').trim()
                : '';
              if (!content) {
                reject(new Error(`Gemini (${targetModel}) retornou resposta vazia.`));
                return;
              }
              resolve({
                content,
                model: targetModel,
                totalTokens: parsed.usageMetadata?.totalTokenCount,
                provider: 'google-gemini',
              });
            } catch (err: any) {
              reject(new Error(`Falha ao decodificar JSON do Gemini: ${err.message}`));
            }
          } else {
            reject(new Error(`Gemini API retornou HTTP ${res.statusCode}: ${data.slice(0, 300)}`));
          }
        });
      });

      req.on('error', (err) => {
        reject(new Error(`Erro de rede na conexão com o Gemini: ${err.message}`));
      });

      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Timeout de 20s aguardando resposta do Gemini'));
      });

      req.write(payload);
      req.end();
    });
  }

  public buildDeterministicFallback(systemPrompt: string, userPrompt: string): NvidiaChatResponse {
    const combined = `${systemPrompt}\n${userPrompt}`.toLowerCase();

    if (combined.includes('headline') && combined.includes('summarynarrative')) {
      return {
        content: JSON.stringify({
          headline: 'Operação Escolar Estável em Modo Determinístico Local',
          summaryNarrative:
            'Os indicadores acadêmicos e operacionais mantiveram regularidade no ciclo analisado, com monitoramento contínuo de frequência, desempenho e governança pedagógica em ambiente soberano local.',
        }),
        model: 'offline-deterministic-fallback',
        totalTokens: 0,
        provider: 'offline-fallback',
      };
    }

    if (combined.includes('maestria') || combined.includes('enunciado da questão')) {
      return {
        content: [
          '### Trilha de Maestria (Modo Determinístico Offline)',
          '',
          '1. **DIAGNÓSTICO**: Identificação dos pré-requisitos operacionais e conceituais da questão proposta.',
          '2. **NÍVEL 1 (Isolamento do Músculo Matemático)**:',
          '   - Exercício 1: 12 × 4 = 48',
          '   - Exercício 2: 100 ÷ 5 = 20',
          '   - Exercício 3: 3² + 4² = 25',
          '   - Exercício 4: 1/2 + 3/4 = 5/4',
          '3. **NÍVEL 2 (Variáveis e Fórmulas)**:',
          '   - Isolar a incógnita principal antes da substituição numérica e conferir unidades no SI.',
          '   - Aplicar a relação proporcional direta entre grandeza de entrada e resultado.',
          '   - Validar a ordem de grandeza esperada.',
          '4. **NÍVEL 3 (Ponte Guiada)**:',
          '   - Problema 1: Decompor o enunciado em dados conhecidos, incógnita e equação governante.',
          '   - Problema 2: Resolver passo a passo verificando consistência dimensional.',
          '5. **GABARITO COMPLETO**: Conferência das etapas numéricas (48; 20; 25; 5/4) e coerência de unidades.',
        ].join('\n'),
        model: 'offline-deterministic-fallback',
        totalTokens: 0,
        provider: 'offline-fallback',
      };
    }

    const topicSnippet = userPrompt.replace(/\s+/g, ' ').trim().slice(0, 140);
    return {
      content: [
        '### Síntese Pedagógica & Operacional (Modo Offline Determinístico)',
        '',
        `**Contexto analisado:** ${topicSnippet || 'Solicitação institucional Áquila Pro'}`,
        '',
        '**Recomendações estruturadas:**',
        '- Consolidar os registros acadêmicos e de frequência vinculados ao período vigente.',
        '- Priorizar intervenções pedagógicas orientadas por evidências e acompanhamento docente.',
        '- Sincronizar novamente quando houver conectividade externa ou chaves de inferência ativas.',
      ].join('\n'),
      model: 'offline-deterministic-fallback',
      totalTokens: 0,
      provider: 'offline-fallback',
    };
  }

  /**
   * Desconstrói uma questão e gera a esteira de Maestria cognitiva sob demanda usando o pool NVIDIA NIM / Gemini.
   */
  public async generateMasteryScaffolding(questionStatement: string, subject: string, studentDifficulty: string): Promise<string> {
    const systemPrompt = `Você é o Tutor Pedagógico Autônomo Áquila Pro operando no cluster DGX H100.
Sua missão é aplicar a metodologia de Nivelamento por Maestria (Mastery Learning).
Quando receber uma questão ou dificuldade, gere:
1. DIAGNÓSTICO: Identifique a operação matemática primária e o conceito físico/químico.
2. NÍVEL 1 (Isolamento do Músculo Matemático): 4 a 5 micro-exercícios secos de repetição rápida da conta básica.
3. NÍVEL 2 (Variáveis e Fórmulas): 3 exercícios de manipulação algébrica.
4. NÍVEL 3 (Ponte Guiada): 2 problemas contextuais fáceis.
5. GABARITO COMPLETO no final.`;

    const userPrompt = `DISCIPLINA: ${subject}
DIFICULDADE DO ALUNO: ${studentDifficulty}
ENUNCIADO DA QUESTÃO ORIGINAL:
${questionStatement}`;

    const res = await this.generateCompletion(systemPrompt, userPrompt);
    return res.content;
  }

  // Compatibilidade retroativa
  public async generateKumonScaffolding(questionStatement: string, subject: string, studentDifficulty: string): Promise<string> {
    return this.generateMasteryScaffolding(questionStatement, subject, studentDifficulty);
  }
}

export const nvidiaInferenceService = NvidiaInferenceService.getInstance();
