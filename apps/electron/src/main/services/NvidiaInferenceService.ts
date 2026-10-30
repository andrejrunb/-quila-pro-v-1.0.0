import * as https from 'https';
import { logger } from '../logger';

export interface NvidiaChatResponse {
  content: string;
  model: string;
  totalTokens?: number;
}

export class NvidiaInferenceService {
  private static instance: NvidiaInferenceService;
  private apiKey: string = '';
  private defaultModel: string = 'minimaxai/minimax-m3.1-flash';

  public static getInstance(): NvidiaInferenceService {
    if (!NvidiaInferenceService.instance) {
      NvidiaInferenceService.instance = new NvidiaInferenceService();
    }
    return NvidiaInferenceService.instance;
  }

  private constructor() {
    this.apiKey = process.env.NVIDIA_API_KEY || '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';
    if (this.apiKey) {
      logger.info('[NvidiaInferenceService] Conector NVIDIA NIM carregado com sucesso.');
    } else {
      logger.warn('[NvidiaInferenceService] Chave NVIDIA_API_KEY não encontrada.');
    }
  }

  /**
   * Envia prompt diretamente para os supercomputadores da NVIDIA Cloud (DGX H100)
   */
  public async generateCompletion(systemPrompt: string, userPrompt: string, model?: string): Promise<NvidiaChatResponse> {
    const targetModel = model || this.defaultModel;

    const payload = JSON.stringify({
      model: targetModel,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      max_tokens: 2048,
      temperature: 0.2
    });

    return new Promise((resolve, reject) => {
      const options: https.RequestOptions = {
        hostname: 'integrate.api.nvidia.com',
        path: '/v1/chat/completions',
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload)
        },
        timeout: 35000
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
            try {
              const parsed = JSON.parse(data);
              const msg = parsed.choices?.[0]?.message;
              const content = (msg?.content && msg.content.trim()) || msg?.reasoning_content || '';
              resolve({
                content,
                model: targetModel,
                totalTokens: parsed.usage?.total_tokens
              });
            } catch (err: any) {
              reject(new Error(`Falha ao decodificar JSON da NVIDIA: ${err.message}`));
            }
          } else {
            reject(new Error(`NVIDIA API retornou HTTP ${res.statusCode}: ${data}`));
          }
        });
      });

      req.on('error', (err) => {
        reject(new Error(`Erro de rede na conexão com a NVIDIA: ${err.message}`));
      });

      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Timeout de 35s aguardando resposta da NVIDIA'));
      });

      req.write(payload);
      req.end();
    });
  }

  /**
   * Desconstrói uma questão e gera a esteira de Maestria cognitiva sob demanda usando a NVIDIA H100
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
