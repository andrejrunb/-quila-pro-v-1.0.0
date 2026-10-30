/**
 * ColabGpuBridge — Ponte entre o Áquila Desktop e o Colab GPU Vision Engine
 * 
 * Responsabilidades:
 *  - Enviar imagens para o Colab processar na GPU (face recognition, YOLO, etc.)
 *  - Health check automático a cada 30s
 *  - Reconexão automática se o túnel mudar
 *  - Fallback local se Colab estiver offline
 * 
 * Uso no Áquila:
 *   const bridge = ColabGpuBridge.getInstance();
 *   bridge.configure('https://xxx.trycloudflare.com');
 *   const embeddings = await bridge.extractFaceEmbeddings(imageBuffer);
 */

import { EventEmitter } from 'events';
import * as http from 'http';
import * as https from 'https';
import * as fs from 'fs';
import * as path from 'path';

// ─── Types ───

export interface ColabHealth {
  status: 'HEALTHY' | 'DEGRADED' | 'OFFLINE';
  gpu: {
    allocated_gb: number;
    total_gb: number;
    utilization_pct: number;
  };
  uptime_s: number;
  stats: {
    requests: number;
    faces_processed: number;
    frames_analyzed: number;
    errors: number;
  };
  capabilities: {
    face_recognition: boolean;
    object_detection: boolean;
    onnx_gpu: boolean;
  };
}

export interface FaceEmbeddingResult {
  faces_detected: number;
  faces: Array<{
    index: number;
    embedding: number[];
    embedding_dim: number;
    bbox: number[];
    det_score: number;
    age: number | null;
    gender: 'M' | 'F' | null;
  }>;
  processing_time_ms: number;
}

export interface FaceCompareResult {
  match: boolean;
  similarity: number;
  threshold: number;
}

export interface DetectionResult {
  detections: Array<{
    class_id: number;
    class_name: string;
    confidence: number;
    bbox: number[];
  }>;
  count: number;
  processing_time_ms: number;
}

export interface BenchmarkResult {
  tflops: number;
  time_ms: number;
  dtype: string;
  matrix: string;
  gpu: string;
}

export interface TutorChatResponse {
  status: string;
  response: string;
  tokens: number;
  duration_ms: number;
}

export interface QuestionResolveResponse {
  status: string;
  solution: string;
  tokens: number;
  duration_ms: number;
}

export interface DecomposeResponse {
  status: string;
  microsteps: string;
  duration_ms: number;
}

export interface GenerateQuestionsResponse {
  status: string;
  topic: string;
  material: string;
  duration_ms: number;
}

// ─── Bridge ───

export class ColabGpuBridge extends EventEmitter {
  private static instance: ColabGpuBridge;

  private baseUrl: string = '';
  private isOnline: boolean = false;
  private lastHealth: ColabHealth | null = null;
  private healthInterval: NodeJS.Timeout | null = null;
  private requestCount: number = 0;
  private errorCount: number = 0;

  // Configuração
  private readonly HEALTH_INTERVAL_MS = 30_000;     // Health check a cada 30s
  private readonly REQUEST_TIMEOUT_MS = 60_000;      // Timeout de 60s para requests
  private readonly MAX_RETRIES = 2;

  private constructor() {
    super();
  }

  static getInstance(): ColabGpuBridge {
    if (!ColabGpuBridge.instance) {
      ColabGpuBridge.instance = new ColabGpuBridge();
      const envUrl = process.env.COLAB_GPU_URL;
      if (envUrl) {
        try {
          ColabGpuBridge.instance.configure(envUrl);
        } catch (e: any) {
          console.warn('[ColabGpuBridge] Falha ao auto-configurar a partir de COLAB_GPU_URL:', e.message);
        }
      }
    }
    return ColabGpuBridge.instance;
  }

  // ─── CONFIGURAÇÃO ───

  /**
   * Configura a URL do Colab e inicia health checks automáticos.
   * @param url - URL do túnel Cloudflare (ex: https://xxx.trycloudflare.com)
   */
  configure(url: string): void {
    if (!url || typeof url !== 'string') {
      throw new Error('[ColabGpuBridge] URL inválida fornecida.');
    }
    const cleanUrl = url.trim().replace(/\/+$/, '');
    try {
      const parsed = new URL(cleanUrl);
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        throw new Error('[ColabGpuBridge] Protocolo deve ser http ou https.');
      }
    } catch (e: any) {
      throw new Error(`[ColabGpuBridge] Formato de URL inválido: ${e.message}`);
    }
    this.baseUrl = cleanUrl;
    console.log(`[ColabGpuBridge] Configurado: ${this.baseUrl}`);

    // Iniciar health check automático
    this.startHealthCheck();
  }

  /**
   * Retorna se o Colab está online e saudável.
   */
  getStatus(): { online: boolean; url: string; health: ColabHealth | null; stats: { requests: number; errors: number } } {
    return {
      online: this.isOnline,
      url: this.baseUrl,
      health: this.lastHealth,
      stats: {
        requests: this.requestCount,
        errors: this.errorCount,
      },
    };
  }

  // ─── FACE RECOGNITION (GPU) ───

  /**
   * Extrai embeddings faciais de uma imagem usando InsightFace no Colab GPU.
   * Retorna vetor de 512 dimensões por rosto detectado.
   */
  async extractFaceEmbeddings(imageData: Buffer): Promise<FaceEmbeddingResult> {
    this.assertOnline();
    return this.uploadFile<FaceEmbeddingResult>('/face/embeddings', imageData, 'image.jpg');
  }

  /**
   * Compara dois rostos e retorna similaridade (0-1).
   */
  async compareFaces(image1: Buffer, image2: Buffer): Promise<FaceCompareResult> {
    this.assertOnline();
    return this.uploadMultipleFiles<FaceCompareResult>('/face/compare', [
      { field: 'file1', data: image1, filename: 'face1.jpg' },
      { field: 'file2', data: image2, filename: 'face2.jpg' },
    ]);
  }

  /**
   * Processa lote de imagens para embeddings faciais.
   */
  async batchFaceEmbeddings(images: Buffer[]): Promise<any> {
    this.assertOnline();
    const files = images.map((img, i) => ({
      field: 'files',
      data: img,
      filename: `face_${i}.jpg`,
    }));
    return this.uploadMultipleFiles('/face/batch', files);
  }

  // ─── OBJECT DETECTION (GPU) ───

  /**
   * Detecta objetos/pessoas na imagem usando YOLOv8 na GPU.
   * @param confidence - Limite de confiança (0-1, default 0.5)
   * @param classes - IDs de classes YOLO para filtrar (ex: "0" = person)
   */
  async detectObjects(imageData: Buffer, confidence: number = 0.5, classes?: string): Promise<DetectionResult> {
    this.assertOnline();

    const boundary = `----AquilaBoundary${Date.now()}`;
    let body = '';

    // File
    body += `--${boundary}\r\n`;
    body += `Content-Disposition: form-data; name="file"; filename="frame.jpg"\r\n`;
    body += `Content-Type: image/jpeg\r\n\r\n`;

    const prefix = Buffer.from(body, 'utf-8');

    let suffix = `\r\n--${boundary}\r\n`;
    suffix += `Content-Disposition: form-data; name="confidence"\r\n\r\n${confidence}`;

    if (classes) {
      suffix += `\r\n--${boundary}\r\n`;
      suffix += `Content-Disposition: form-data; name="classes"\r\n\r\n${classes}`;
    }

    suffix += `\r\n--${boundary}--\r\n`;

    const suffixBuf = Buffer.from(suffix, 'utf-8');
    const fullBody = Buffer.concat([prefix, imageData, suffixBuf]);

    return this.rawRequest<DetectionResult>('POST', '/detect', fullBody, {
      'Content-Type': `multipart/form-data; boundary=${boundary}`,
    });
  }

  // ─── IMAGE PROCESSING (GPU) ───

  /**
   * Processamento de imagem acelerado por GPU.
   * @param operations - Operações a aplicar (ex: "resize,sharpen,normalize")
   */
  async processImage(
    imageData: Buffer,
    operations: string = 'resize,normalize',
    width: number = 640,
    height: number = 640
  ): Promise<{ image_base64: string; processing_time_ms: number }> {
    this.assertOnline();

    const boundary = `----AquilaBoundary${Date.now()}`;
    let parts = '';

    // File
    parts += `--${boundary}\r\n`;
    parts += `Content-Disposition: form-data; name="file"; filename="image.jpg"\r\n`;
    parts += `Content-Type: image/jpeg\r\n\r\n`;

    const prefix = Buffer.from(parts, 'utf-8');

    let formFields = '';
    formFields += `\r\n--${boundary}\r\n`;
    formFields += `Content-Disposition: form-data; name="operations"\r\n\r\n${operations}`;
    formFields += `\r\n--${boundary}\r\n`;
    formFields += `Content-Disposition: form-data; name="width"\r\n\r\n${width}`;
    formFields += `\r\n--${boundary}\r\n`;
    formFields += `Content-Disposition: form-data; name="height"\r\n\r\n${height}`;
    formFields += `\r\n--${boundary}--\r\n`;

    const suffixBuf = Buffer.from(formFields, 'utf-8');
    const fullBody = Buffer.concat([prefix, imageData, suffixBuf]);

    return this.rawRequest('POST', '/process/image', fullBody, {
      'Content-Type': `multipart/form-data; boundary=${boundary}`,
    });
  }

  /**
   * Otimiza/comprime o buffer de imagem localmente antes do envio pelo túnel.
   * Reduz latência de upload em conexões móveis ou instáveis (Passo 104).
   */
  async optimizeImageBuffer(imageData: Buffer, maxWidth: number = 1280, quality: number = 85): Promise<Buffer> {
    try {
      // Tentativa dinâmica com sharp se disponível
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const sharp = require('sharp');
      return await sharp(imageData)
        .resize({ width: maxWidth, withoutEnlargement: true, fit: 'inside' })
        .jpeg({ quality })
        .toBuffer();
    } catch {
      // Fallback sem dependência nativa: preserva o buffer
      return imageData;
    }
  }

  /**
   * Escaneamento OMR de gabaritos escolares acelerado por GPU (Passos 141-146).
   */
  async scanOmr(imageData: Buffer, totalQuestions: number, optionsCount: number = 5): Promise<{
    total_detected: number;
    answers: Record<string, string>;
    confidence_avg: number;
    processing_time_ms: number;
  }> {
    this.assertOnline();
    const optimized = await this.optimizeImageBuffer(imageData, 1600, 90);
    return this.uploadFile(
      `/omr/scan?total_questions=${totalQuestions}&options_count=${optionsCount}`,
      optimized,
      'omr_sheet.jpg'
    );
  }

  /**
   * Extração de texto manuscrito de folha de redação oficial ENEM via GPU (TrOCR / PaddleOCR / Vision LLM)
   */
  async ocrEssay(imageData: Buffer): Promise<{
    text: string;
    confidence: number;
    detected_lines: number;
    processing_time_ms: number;
  }> {
    this.assertOnline();
    const optimized = await this.optimizeImageBuffer(imageData, 2048, 92);
    return this.uploadFile(
      `/essay/ocr`,
      optimized,
      'essay_sheet.jpg'
    );
  }

  // ─── EDUCATIONAL TUTOR (A100 Fine-Tuned LLaMA 3) ───

  /**
   * Envia prompt pedagógico para o modelo Áquila Tutor fine-tuned no Colab GPU A100.
   */
  async generateTutorChat(prompt: string, systemPrompt?: string, maxTokens: number = 600): Promise<TutorChatResponse> {
    this.assertOnline();
    return this.postJson<TutorChatResponse>('/tutor/chat', {
      prompt,
      system_prompt: systemPrompt,
      max_tokens: maxTokens,
    });
  }

  /**
   * Resolução passo a passo de questão de física/matemática/ciências com rigor conceitual.
   */
  async resolveQuestion(question: string): Promise<QuestionResolveResponse> {
    this.assertOnline();
    return this.postJson<QuestionResolveResponse>('/tutor/resolve', { question });
  }

  /**
   * Desconstrói uma lacuna de aprendizagem em micro-passos Kumon / Mastery Learning.
   */
  async decomposeDifficulty(subject: string, difficultyDescription: string): Promise<DecomposeResponse> {
    this.assertOnline();
    return this.postJson<DecomposeResponse>('/tutor/decompose', {
      subject,
      difficulty_description: difficultyDescription,
    });
  }

  /**
   * Gera resumo e questões inéditas de vestibular com gabarito formal comentado.
   */
  async generateVestibularQuestions(topic: string, count: number = 3): Promise<GenerateQuestionsResponse> {
    this.assertOnline();
    return this.postJson<GenerateQuestionsResponse>('/tutor/questions', {
      topic,
      count,
    });
  }

  // ─── BENCHMARK ───

  async benchmark(matrixSize: number = 8192): Promise<BenchmarkResult> {
    this.assertOnline();
    return this.postJson<BenchmarkResult>(`/benchmark?size=${matrixSize}`, {});
  }

  // ─── HEALTH CHECK ───

  async checkHealth(): Promise<ColabHealth> {
    try {
      const health = await this.getJson<ColabHealth>('/health');
      this.isOnline = health.status === 'HEALTHY' || health.status === 'DEGRADED';
      this.lastHealth = health;

      if (this.isOnline) {
        this.emit('online', health);
      }

      return health;
    } catch (err) {
      this.isOnline = false;
      this.lastHealth = null;
      this.emit('offline', err);
      return {
        status: 'OFFLINE',
        gpu: { allocated_gb: 0, total_gb: 0, utilization_pct: 0 },
        uptime_s: 0,
        stats: { requests: 0, faces_processed: 0, frames_analyzed: 0, errors: 0 },
        capabilities: { face_recognition: false, object_detection: false, onnx_gpu: false },
      };
    }
  }

  // ─── LIFECYCLE ───

  startHealthCheck(): void {
    this.stopHealthCheck();
    // Check imediato
    this.checkHealth().catch(() => {});
    // Polling periódico
    this.healthInterval = setInterval(() => {
      this.checkHealth().catch(() => {});
    }, this.HEALTH_INTERVAL_MS);
    this.healthInterval.unref();
  }

  stopHealthCheck(): void {
    if (this.healthInterval) {
      clearInterval(this.healthInterval);
      this.healthInterval = null;
    }
  }

  destroy(): void {
    this.stopHealthCheck();
    this.removeAllListeners();
  }

  // ─── INTERNOS ───

  private assertOnline(): void {
    if (!this.baseUrl) {
      throw new Error('[ColabGpuBridge] URL não configurada. Use bridge.configure(url) primeiro.');
    }
    if (!this.isOnline) {
      throw new Error('[ColabGpuBridge] Colab GPU está offline. Verifique o notebook no Colab.');
    }
  }

  private async getJson<T>(endpoint: string): Promise<T> {
    return this.rawRequest<T>('GET', endpoint, null, {});
  }

  private async postJson<T>(endpoint: string, body: any): Promise<T> {
    const data = Buffer.from(JSON.stringify(body), 'utf-8');
    return this.rawRequest<T>('POST', endpoint, data, {
      'Content-Type': 'application/json',
    });
  }

  private async uploadFile<T>(endpoint: string, fileData: Buffer, filename: string): Promise<T> {
    const boundary = `----AquilaBoundary${Date.now()}`;
    let header = `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${filename}"\r\nContent-Type: image/jpeg\r\n\r\n`;
    const footer = `\r\n--${boundary}--\r\n`;

    const body = Buffer.concat([
      Buffer.from(header, 'utf-8'),
      fileData,
      Buffer.from(footer, 'utf-8'),
    ]);

    return this.rawRequest<T>('POST', endpoint, body, {
      'Content-Type': `multipart/form-data; boundary=${boundary}`,
    });
  }

  private async uploadMultipleFiles<T>(
    endpoint: string,
    files: Array<{ field: string; data: Buffer; filename: string }>
  ): Promise<T> {
    const boundary = `----AquilaBoundary${Date.now()}`;
    const parts: Buffer[] = [];

    for (const file of files) {
      const header = `--${boundary}\r\nContent-Disposition: form-data; name="${file.field}"; filename="${file.filename}"\r\nContent-Type: image/jpeg\r\n\r\n`;
      parts.push(Buffer.from(header, 'utf-8'));
      parts.push(file.data);
      parts.push(Buffer.from('\r\n', 'utf-8'));
    }

    parts.push(Buffer.from(`--${boundary}--\r\n`, 'utf-8'));
    const body = Buffer.concat(parts);

    return this.rawRequest<T>('POST', endpoint, body, {
      'Content-Type': `multipart/form-data; boundary=${boundary}`,
    });
  }

  /**
   * Consulta uma trilha de aprendizagem multimodal (PhET + Micro-drills Kumon + Prompt de Imagem)
   */
  public async getLearningTrack(topic: string, studentId: string = 'aluno_01'): Promise<any> {
    const payload = Buffer.from(JSON.stringify({ topic, student_id: studentId }), 'utf-8');
    return this.rawRequest<any>('POST', '/v1/learning-track', payload, {
      'Content-Type': 'application/json',
    });
  }

  /**
   * Busca simulações PhET HTML5 catalogadas no Colab
   */
  public async listPhetSimulations(query?: string): Promise<any> {
    const endpoint = query ? `/v1/phet/simulations?q=${encodeURIComponent(query)}` : '/v1/phet/simulations';
    return this.rawRequest<any>('GET', endpoint, null, {});
  }

  /**
   * Executa geração de texto instrucional via agente especializado com LoRA ativo
   */
  public async generateAgentContent(agentId: string, prompt: string): Promise<any> {
    const payload = Buffer.from(JSON.stringify({ prompt, temperature: 0.7, max_tokens: 1024 }), 'utf-8');
    return this.rawRequest<any>('POST', `/v1/agent/${agentId}/generate`, payload, {
      'Content-Type': 'application/json',
    });
  }

  private rawRequest<T>(method: string, endpoint: string, body: Buffer | null, headers: Record<string, string>): Promise<T> {
    return new Promise((resolve, reject) => {
      const url = new URL(endpoint, this.baseUrl);
      const isHttps = url.protocol === 'https:';
      const lib = isHttps ? https : http;

      const options: http.RequestOptions = {
        method,
        hostname: url.hostname,
        port: url.port || (isHttps ? 443 : 80),
        path: url.pathname + url.search,
        headers: {
          ...headers,
          'User-Agent': 'AquilaPro-ColabBridge/3.1',
        },
        timeout: this.REQUEST_TIMEOUT_MS,
      };

      if (body) {
        options.headers!['Content-Length'] = body.length.toString();
      }

      const req = lib.request(options, (res) => {
        const chunks: Buffer[] = [];
        res.on('data', (chunk) => chunks.push(chunk));
        res.on('end', () => {
          this.requestCount++;
          const responseBody = Buffer.concat(chunks).toString('utf-8');

          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
            try {
              resolve(JSON.parse(responseBody));
            } catch {
              reject(new Error(`[ColabGpuBridge] Resposta não é JSON: ${responseBody.slice(0, 200)}`));
            }
          } else {
            this.errorCount++;
            reject(new Error(`[ColabGpuBridge] HTTP ${res.statusCode}: ${responseBody.slice(0, 500)}`));
          }
        });
      });

      req.on('error', (err) => {
        this.errorCount++;
        reject(new Error(`[ColabGpuBridge] Erro de rede: ${err.message}`));
      });

      req.on('timeout', () => {
        this.errorCount++;
        req.destroy();
        reject(new Error(`[ColabGpuBridge] Timeout após ${this.REQUEST_TIMEOUT_MS}ms`));
      });

      if (body) {
        req.write(body);
      }
      req.end();
    });
  }
}

// Singleton export
export const colabGpuBridge = ColabGpuBridge.getInstance();
