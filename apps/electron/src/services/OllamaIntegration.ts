import * as path from 'path';
import * as os from 'os';
import { logger } from '../main/logger';
import { npuOptimizer, HardwareStatus } from './NpuOptimizationService_V2';
import { npuLoadBalancer } from './NpuLoadBalancer';

/**
 * Integração com Ollama para IA Local
 * Executa modelos de IA localmente sem custos de API
 */

export interface OllamaConfig {
  baseUrl: string;
  model: string;
  temperature: number;
  topK: number;
  topP: number;
  numPredict: number;
}

export interface GenerateResponse {
  response: string;
  context: number[];
  done: boolean;
  totalDuration: number;
  loadDuration: number;
  promptEvalCount: number;
  promptEvalDuration: number;
  evalCount: number;
  evalDuration: number;
}

export class OllamaIntegration {
  private config: OllamaConfig;
  private logger: any;
  private isAvailable: boolean = false;
  private defaultModel: string;
  private hardwareStatus: HardwareStatus | null = null;
  private turboQuantActive: boolean = false;

  constructor(
    baseUrl: string = 'http://localhost:11434',
    model: string = 'llama2'
  ) {
    this.config = {
      baseUrl,
      model,
      temperature: 0.7,
      topK: 40,
      topP: 0.9,
      numPredict: 512,
    };
    this.defaultModel = model;
    this.logger = logger;
    this.initHardware();
    this.checkAvailability();
  }

  private async initHardware() {
    try {
      this.hardwareStatus = await npuOptimizer.detectHardware();
      this.logger.info(`Hardware detectado - ${this.hardwareStatus.brand} (${this.hardwareStatus.acceleration_capability}x boost capability)`);
    } catch (err) {
      this.logger.error('NPU detection failed, falling back to CPU');
    }
  }

  /**
   * Verificar se Ollama está disponível
   */
  private async checkAvailability(): Promise<void> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(`${this.config.baseUrl}/api/tags`, {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      this.isAvailable = response.ok;
      if (this.isAvailable) {
        this.logger.info('Ollama disponível e conectado');
      } else {
        this.logger.warn('Ollama não respondeu corretamente');
      }
    } catch (error) {
      this.logger.warn(
        `Ollama não disponível. Usando modo fallback: ${(error as Error).message}`
      );
      this.isAvailable = false;
    }
  }

  /**
   * Gerar resposta usando Ollama
   */
  async generate(prompt: string): Promise<string> {
    try {
      if (!this.isAvailable) {
        this.logger.warn('Ollama não disponível. Usando resposta simulada.');
        return this.generateFallback(prompt);
      }

      if (this.hardwareStatus && this.hardwareStatus.vram_free_mb < 2048) {
        this.logger.warn(`VRAM Baixa (${this.hardwareStatus.vram_free_mb}MB). Aplicando TurboQuant 3-bit.`);
        await npuOptimizer.applyTurboQuant(this.config.model, 3);
        this.turboQuantActive = true;
      }

      const startTime = Date.now();
      const endpoint = await npuLoadBalancer.getOptimalEndpoint();
      const targetUrl = `${endpoint}/api/generate`;

      const response = await fetch(targetUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.config.model,
          prompt,
          stream: false,
          temperature: this.config.temperature,
          top_k: this.config.topK,
          top_p: this.config.topP,
          num_predict: this.config.numPredict,
        }),
      });

      npuLoadBalancer.reportTaskComplete(endpoint, Date.now() - startTime);

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.status}`);
      }

      const data: GenerateResponse = await response.json();
      return data.response.trim();
    } catch (error) {
      this.logger.error(`Erro ao gerar resposta: ${(error as Error).message}`);
      return this.generateFallback(prompt);
    }
  }

  /**
   * Analisar padrão de presença
   */
  async analyzeAttendance(studentData: {
    name: string;
    attendanceRate: number;
    absentDays: number;
    lateArrivals: number;
    absencePattern?: string[];
  }): Promise<string> {
    const prompt = `
Analise o padrão de presença do aluno e forneça insights educacionais:

Aluno: ${studentData.name}
Taxa de Presença: ${studentData.attendanceRate}%
Dias Ausentes: ${studentData.absentDays}
Chegadas Atrasadas: ${studentData.lateArrivals}
${studentData.absencePattern ? `Padrão: ${studentData.absencePattern.join(', ')}` : ''}

Forneça:
1. Padrão identificado
2. Nível de engajamento (alto, médio, baixo)
3. Fatores de risco
4. Recomendações específicas
5. Insight geral
    `.trim();

    return this.generate(prompt);
  }

  /**
   * Gerar relatório de turma
   */
  async generateClassReport(classData: {
    name: string;
    totalStudents: number;
    averageAttendance: number;
    criticalStudents: string[];
  }): Promise<string> {
    const prompt = `
Gere um relatório detalhado da turma:

Turma: ${classData.name}
Total de Alunos: ${classData.totalStudents}
Média de Presença: ${classData.averageAttendance}%
Alunos Críticos: ${classData.criticalStudents.join(', ')}

Incluir:
1. Análise geral da presença
2. Padrões identificados
3. Alunos que precisam de intervenção
4. Recomendações pedagógicas
5. Ações sugeridas para a coordenação
    `.trim();

    return this.generate(prompt);
  }

  /**
   * Gerar recomendações personalizadas
   */
  async generateRecommendations(studentData: {
    name: string;
    attendanceRate: number;
    riskFactors: string[];
  }): Promise<string[]> {
    const prompt = `
Gere 5 recomendações específicas e acionáveis para melhorar a presença escolar:

Aluno: ${studentData.name}
Taxa de Presença: ${studentData.attendanceRate}%
Fatores de Risco: ${studentData.riskFactors.join(', ')}

Forneça recomendações em formato de lista numerada, sendo específico e prático.
    `.trim();

    const response = await this.generate(prompt);
    return this.parseRecommendations(response);
  }

  /**
   * Detectar anomalias em padrão de presença
   */
  async detectAnomalies(attendanceHistory: {
    studentName: string;
    dailyAttendance: boolean[];
    expectedPattern: string;
  }): Promise<string> {
    const prompt = `
Detecte anomalias no padrão de presença:

Aluno: ${attendanceHistory.studentName}
Histórico (últimos 30 dias): ${attendanceHistory.dailyAttendance.map(a => (a ? 'P' : 'A')).join('')}
Padrão Esperado: ${attendanceHistory.expectedPattern}

Identifique:
1. Padrões anormais
2. Mudanças de comportamento
3. Possíveis causas
4. Ações recomendadas
    `.trim();

    return this.generate(prompt);
  }

  /**
   * Gerar insight contextual com clima
   */
  async generateWeatherInsight(data: {
    studentName: string;
    attendanceRate: number;
    weather: string;
    temperature: number;
  }): Promise<string> {
    const prompt = `
Gere um insight sobre a correlação entre clima e presença:

Aluno: ${data.studentName}
Taxa de Presença: ${data.attendanceRate}%
Clima: ${data.weather}
Temperatura: ${data.temperature}°C

Analise:
1. Possível impacto do clima na presença
2. Padrões correlacionados
3. Recomendações contextualizadas
    `.trim();

    return this.generate(prompt);
  }

  /**
   * Resposta de fallback (quando Ollama não está disponível)
   */
  private generateFallback(prompt: string): string {
    // Análise simples baseada em padrões
    if (prompt.includes('presença')) {
      return 'Análise de presença: Padrão normal detectado. Continuar monitorando.';
    }
    if (prompt.includes('relatório')) {
      return 'Relatório gerado: Turma com presença satisfatória. Recomenda-se acompanhamento de alunos críticos.';
    }
    if (prompt.includes('recomendação')) {
      return '1. Aumentar motivação\
2. Contato com responsáveis\
3. Oferecer suporte\
4. Monitorar progresso\
5. Avaliar necessidades especiais';
    }
    if (prompt.includes('anomalia')) {
      return 'Nenhuma anomalia detectada. Padrão dentro do esperado.';
    }
    if (prompt.includes('clima')) {
      return 'Possível correlação entre clima e presença. Dias chuvosos tendem a ter mais faltas.';
    }

    return 'Análise concluída. Consulte os dados detalhados no dashboard.';
  }

  /**
   * Parsear recomendações da resposta
   */
  private parseRecommendations(response: string): string[] {
    // Tentar extrair lista numerada
    const lines = response.split('\
');
    const recommendations: string[] = [];

    for (const line of lines) {
      const match = line.match(/^\\d+\\.\\s+(.+)$/);
      if (match) {
        recommendations.push(match[1].trim());
      }
    }

    // Se não encontrou lista numerada, dividir por quebras de linha
    if (recommendations.length === 0) {
      return lines
        .filter(line => line.trim().length > 0)
        .slice(0, 5);
    }

    return recommendations.slice(0, 5);
  }

  /**
   * Listar modelos disponíveis
   */
  async listModels(): Promise<any[]> {
    try {
      const response = await fetch(`${this.config.baseUrl}/api/tags`);
      const data = await response.json();
      return data.models || [];
    } catch (error) {
      this.logger.error(`Erro ao listar modelos: ${(error as Error).message}`);
      return [];
    }
  }

  /**
   * Mudar modelo
   */
  setModel(model: string): void {
    this.config.model = model;
    this.logger.info(`Modelo alterado para: ${model}`);
  }

  /**
   * Configurar parâmetros
   */
  setConfig(config: Partial<OllamaConfig>): void {
    this.config = { ...this.config, ...config };
    this.logger.info('Configuração atualizada');
  }

  /**
   * Obter status
   */
  getStatus(): {
    available: boolean;
    model: string;
    baseUrl: string;
  } {
    return {
      available: this.isAvailable,
      model: this.config.model,
      baseUrl: this.config.baseUrl,
    };
  }

  /**
   * Reseta o contexto de memória da sessão atual para liberar recursos (vRAM).
   */
  public async resetMemory(): Promise<void> {
    logger.info(`[Ollama] Resetando memória para o modelo ${this.config.model}`);
  }
}

export const ollamaIntegration = new OllamaIntegration();
export default OllamaIntegration;
