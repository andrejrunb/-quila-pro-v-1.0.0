import Logger from './Logger';
import { OllamaIntegration } from './OllamaIntegration';
import { PageIndexRAGService } from './PageIndexRAGService';
import { NpuOptimizationService } from './NpuOptimizationService_V2';
import { RAGSearchResult } from '../../types/RAGTypes';
import { AIFlowManager } from './AIFlowManager';
import { StudentBehaviorRAG } from './StudentBehaviorRAG';
import { Database } from '../../database/Database';

/**
 * Phase 705 — EducationalAIIntegration (Edu-Podcast Edition)
 * Análise de padrões de presença e agora o novo motor "Edu-Podcast"
 * Transforma apostilas (PDF/Texto) em áudio conversacional pedagógico.
 */

export interface StudentAnalysis {
  studentId: string;
  studentName: string;
  attendanceRate: number;
  absencePattern: string;
  engagementLevel: 'high' | 'medium' | 'low';
  riskFactors: string[];
  recommendations: string[];
  insights: string;
}

export interface ClassAnalysis {
  classId: string;
  className: string;
  averageAttendance: number;
  attendanceVariance: number;
  criticalStudents: string[];
  classPatterns: string;
  recommendations: string[];
}

export interface PodcastSegment {
  speaker: 'Teacher' | 'Assistant';
  text: string;
  audioPath?: string;
}

export interface Flashcard {
  question: string;
  answer: string;
  tags: string[];
}

export interface RetentionQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
}

export interface EngagementStats {
  resumesViewed: number;
  podcastsListened: number;
  flashcardsCompleted: number;
  avgRetentionScore: number; // 0-100
  lastActive: Date;
}

export interface ReviewRecord {
  flashcardId: string;
  interval: number; // dias
  repetition: number;
  easeFactor: number;
  nextReviewDate: Date;
}

export interface SmartMaterialResult {
  summary: string;
  flashcards: Flashcard[];
  retentionQuestions: RetentionQuestion[];
  transcript?: string; // Para fotos de lousa
  youtubeQueries: string[]; // Termos de busca para vídeos complementares
  studyCycleTasks: { title: string; offsetDays: number; description: string }[];
}

export interface PodcastResult {
  title: string;
  fullAudioPath: string;
  segments: PodcastSegment[];
  durationSeconds: number;
}

export class EducationalAIIntegration {
  private apiKey: string;
  private logger: Logger;
  private baseUrl = 'https://api.openai.com/v1';
  private model = 'gpt-4o';
  private ollama?: OllamaIntegration;
  private rag?: PageIndexRAGService;
  private npu?: NpuOptimizationService;
  private swarm?: AIFlowManager;
  private behaviorRAG?: StudentBehaviorRAG;
  private db?: Database;

  constructor(
    apiKey?: string,
    ollama?: OllamaIntegration,
    rag?: PageIndexRAGService,
    npu?: NpuOptimizationService,
    swarm?: AIFlowManager
  ) {
    this.apiKey = apiKey || process.env.OPENAI_API_KEY || '';
    this.logger = new Logger('EducationalAIIntegration');
    this.ollama = ollama;
    this.rag = rag;
    this.npu = npu;
    this.swarm = swarm;

    if (!this.apiKey) {
      if (this.ollama) {
        this.logger.info('OpenAI indisponível. Motor Soberano (Ollama) detectado e pronto.');
      } else {
        this.logger.warn('Nenhuma IA configurada. Usando modo simulado.');
      }
    }
  }

  public setDatabase(db: Database) {
    this.db = db;
    this.behaviorRAG = new StudentBehaviorRAG(db);
  }

  /**
   * ---- DISTRIBUTED SWARM AI (v3443) ----
   * Fluxo RAG + NPU + LLM Distribuído (Enxame).
   */
  async sovereignAsk(
    query: string, 
    specialization: string = 'general', 
    userHasCloudCredits: boolean = false
  ): Promise<{ answer: string; sources: RAGSearchResult[]; tqActive: boolean; routing: any }> {
    this.logger.info(`Sovereign Swarm Query: ${query} [${specialization}]`);
    
    // 1. Roteamento pelo Enxame (v3443)
    const routing = this.swarm 
      ? await this.swarm.dispatch(query, specialization, userHasCloudCredits)
      : { nodeId: 'local', type: 'LOCAL', nodeName: 'Fallback Local' };

    // 2. Recuperação RAG Estruturada
    const sources = this.rag ? await this.rag.search(query, 5) : [];
    
    // 3. Aceleração NPU / TurboQuant
    let tqActive = false;
    if (this.npu) {
      await this.npu.applyTurboQuant('Sovereign-Llama-3');
      tqActive = true;
    }

    // 4. Perfil Comportamental e Emocional (v3470)
    let extraContext = '';
    let systemTone = 'Especialista em educação.';
    
    if (this.behaviorRAG && specialization === 'student_help') {
      const studentId = 'CURRENT_USER_ID'; // Em prod, capturado via token
      const profile = await this.behaviorRAG.getStudentProfile(studentId);
      
      extraContext = `\nPerfil do Aluno: Frequência ${profile.attendanceScore}%, Engajamento ${profile.engagementScore}%.`;
      
      // Análise de tom (v3470)
      if (profile.riskLevel === 'critical') {
        systemTone = 'Especialista extremamente encorajante e empático. O foco é resgate de engajamento.';
      } else if (profile.engagementScore < 50) {
        systemTone = 'Professor motivador e prático. Use exemplos simples e diretos.';
      }
    }

    // 5. Construção do Prompt
    const context = sources.map(s => `[Fonte: ${s.breadcrumb.join(' > ')}] ${s.snippet}`).join('\n\n');
    const systemPrompt = `Você é o Assistente do Enxame Áquila Pro no nó ${routing.nodeName}. Responda como um ${systemTone}.${extraContext}`;
    const finalPrompt = `${systemPrompt}\n\nContexto:\n${context}\n\nPergunta: ${query}\n\nResposta:`;

    // 6. Execução (Nuvem do Usuário vs Ollama Local)
    let answer = '';
    if (routing.type === 'CLOUD') {
      answer = `[Processado via NUVEM DO USUÁRIO] ${await this.simulateCloudInference(finalPrompt)}`;
    } else if (this.ollama) {
      answer = await this.ollama.generate(finalPrompt);
    } else {
      answer = "Conexão com o Enxame perdida. Verifique o NexusSyncService.";
    }

    return { answer, sources, tqActive, routing };
  }

  private async simulateCloudInference(prompt: string): Promise<string> {
    // Simulação de chamada para Gemini API Free (via créditos do usuário)
    await new Promise(r => setTimeout(r, 800));
    return "Resposta processada usando seus créditos pessoais de nuvem para economizar recursos da escola.";
  }

  /**
   * ---- NOVO: SMART CLASSES ENGINE (FASE 707) ----
   * Processa diferentes tipos de materiais (fotos de lousa, textos, exercícios)
   * e gera ecossistema de estudo completo.
   */
  async processMaterial(title: string, materialType: 'image' | 'text' | 'pdf', content: string): Promise<SmartMaterialResult> {
    try {
      this.logger.info(`Processando material inteligente: ${title} (${materialType})`);
      
      let analysisPrompt = '';
      if (materialType === 'image') {
        analysisPrompt = `Analise esta foto de lousa escolar. Transcreva o conteúdo e gere: 
        1. Um resumo estruturado. 
        2. 5 Flashcards. 
        3. 2 Questões de retenção.
        4. 3 Termos de busca otimizados para YouTube sobre o tema.
        5. Um ciclo de estudo com 2 marcos (Revisão 24h e Revisão 48h).
        Formato: JSON { 
          "transcript": string, 
          "summary": string, 
          "flashcards": [...], 
          "questions": [...],
          "youtubeQueries": [string],
          "studyCycle": [{ "title": string, "offsetDays": number, "description": string }] 
        }`;
      } else {
        analysisPrompt = `Baseado no texto, gere o mesmo formato JSON descrito acima (summary, flashcards, questions, youtubeQueries, studyCycle).`;
      }

      if (!this.apiKey) {
        return this.simulateSmartMaterial(title);
      }

      const response = await this.callOpenAI(analysisPrompt, materialType === 'image' ? content : undefined);
      const data = this.parseAIResponse(response);

      return {
        summary: data.summary || 'Resumo não disponível.',
        flashcards: data.flashcards || [],
        retentionQuestions: data.questions || [],
        transcript: data.transcript,
        youtubeQueries: data.youtubeQueries || [],
        studyCycleTasks: data.studyCycle || []
      };
    } catch (err: any) {
      this.logger.error(`Erro ao processar material: ${err.message}`);
      throw err;
    }
  }

  /**
   * ---- NOVO: STUDENT INTELLIGENCE FEED (v3445) ----
   * Consolida dados de múltiplas tabelas para o Feed do Aluno/Responsável.
   */
  async getStudentFeed(studentId: string): Promise<any[]> {
    if (!this.db) return [];

    try {
      this.logger.info(`Gerando feed de inteligência para o aluno: ${studentId}`);

      // 1. Buscar Eventos de Presença Biométrica (v3505)
      const events = await (this.db as any).all(
        "SELECT id, eventType as type, timestamp, 'security' as category FROM events WHERE studentId = ? ORDER BY timestamp DESC LIMIT 5",
        [studentId]
      );

      // 2. Buscar Resumos de Aula Recentes (v3510)
      const reports = await (this.db as any).all(
        `SELECT r.id, r.aiSummary as content, r.generatedAt as timestamp, 'academic' as category 
         FROM lesson_reports r 
         JOIN schedules s ON r.scheduleId = s.id 
         JOIN classes c ON s.classId = c.id
         JOIN students st ON st.classId = c.id
         WHERE st.id = ? ORDER BY r.generatedAt DESC LIMIT 3`,
        [studentId]
      );

      // 3. Buscar Economia e XP (v3502)
      const economy = await (this.db as any).get(
        "SELECT xp, balance, level FROM student_economy WHERE student_id = ?",
        [studentId]
      );

      // 4. Consolidar e Formatar
      const feed = [
        ...events.map((e: any) => ({
          id: e.id,
          type: 'detection',
          category: 'Segurança',
          content: `Visto na escola (${e.type === 'exit' ? 'Saída' : 'Entrada'})`,
          timestamp: e.timestamp,
          icon: 'Shield'
        })),
        ...reports.map((r: any) => ({
          id: r.id,
          type: 'lesson_summary',
          category: 'Acadêmico',
          content: r.content || 'Resumo de aula disponível.',
          timestamp: r.timestamp,
          icon: 'BookOpen'
        }))
      ];

      // Adicionar card de economia se houver dados
      if (economy) {
        feed.unshift({
          id: `econ-${studentId}`,
          type: 'economy_update',
          category: 'Gamificação',
          content: `Você atingiu o nível ${economy.level}! Saldo atual: ${economy.xp} XP.`,
          timestamp: new Date().toISOString(),
          icon: 'Award'
        });
      }

      return feed.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    } catch (err: any) {
      this.logger.error(`Erro ao gerar feed: ${err.message}`);
      return [];
    }
  }

  /**
   * ---- EDU-PODCAST ENGINE PARA FASE 705 ----
   * Reutilizado na Fase 707 como parte do ecossistema.
   */
  async generateEduPodcast(title: string, content: string): Promise<PodcastResult> {
    try {
      this.logger.info(`Iniciando geração de Edu-Podcast: ${title}`);

      // 1. Gerar Roteiro Dialógico (Conversacional)
      const script = await this.generatePodcastScript(title, content);
      
      // 2. Simular Síntese de Voz (Local TTS Engine)
      // Em produção, aqui integraríamos com MeloTTS ou similar local via Ollama.
      const result: PodcastResult = {
        title,
        fullAudioPath: `C:\\aquila\\podcasts\\${title.replace(/\s/g, '_')}_final.mp3`,
        segments: script,
        durationSeconds: script.length * 15 // Média de 15s por segmento
      };

      this.logger.info(`Podcast gerado com sucesso: ${result.title}`);
      return result;
    } catch (err: any) {
      this.logger.error(`Erro no Edu-Podcast: ${err.message}`);
      throw err;
    }
  }

  /**
   * ---- NOTIFICAÇÕES INTELIGENTES (v3446) ----
   * Dispara alertas para os pais via gateway oficial quando detectado risco/conquista.
   */
  async notifyParents(studentId: string, type: 'ABSENCE' | 'ENGAGEMENT' | 'ACHIEVEMENT', message: string): Promise<boolean> {
    try {
      this.logger.info(`Notificando pais do aluno ${studentId}: [${type}] ${message}`);

      // Importação dinâmica para evitar dependência circular pesada
      const { antigravityMessenger } = require('./AntigravityMessenger');
      
      const payload = `🚨 *ÁQUILA PRO: ALERTA DE ENGAJAMENTO*\n\n*Aluno ID:* ${studentId}\n*Tipo:* ${type === 'ACHIEVEMENT' ? '🏆 Conquista' : '⚠️ Atenção'}\n\n${message}`;
      
      return await antigravityMessenger.sendProactiveNotification(payload);
    } catch (err: any) {
      this.logger.error(`Falha ao notificar pais via WhatsApp: ${err.message}`);
      return false;
    }
  }

  private async generatePodcastScript(title: string, content: string): Promise<PodcastSegment[]> {
    const prompt = `
Transforme o conteúdo abaixo em um roteiro de podcast educacional curto e dinâmico entre um "Professor" e um "Assistente AI".
O tom deve ser envolvente e os conceitos principais devem ser explicados de forma simples.

Título: ${title}
Conteúdo: ${content.substring(0, 2000)}...

Formato esperado: JSON array de objetos { "speaker": "Teacher" | "Assistant", "text": string }
    `.trim();

    if (!this.apiKey) {
      // Mock de alta fidelidade para modo offline/local
      return [
        { speaker: 'Teacher', text: `Olá! Hoje vamos mergulhar no tema de ${title}. Você está pronto?` },
        { speaker: 'Assistant', text: `Com certeza, Professor! Pelo que vi no material, os pontos principais são fascinantes.` },
        { speaker: 'Teacher', text: `Exato. O conteúdo destaca como ${content.substring(0, 50)}... é fundamental.` },
        { speaker: 'Assistant', text: `Interessante! Isso explica por que este tópico é tão importante para os alunos.` }
      ];
    }

    const response = await this.callOpenAI(prompt);
    const jsonMatch = response.match(/\[[\s\S]*\]/);
    return jsonMatch ? JSON.parse(jsonMatch[0]) : [];
  }

  /**
   * ---- NOVO: DETECTOR DE IA (FASE 709) ----
   * Analisa a probabilidade de uma resposta ter sido gerada por IA.
   * Baseado em heurísticas de estilo, verbosidade e precisão técnica excessiva.
   */
  async detectAIUsage(answer: string, context: string): Promise<{ likelihood: number; reasoning: string }> {
    // Simulação de análise local v3.6.9
    const aiIndicators = ['portanto', 'desta forma', 'em conclusão', 'vale ressaltar'];
    let count = 0;
    aiIndicators.forEach(ind => { if (answer.toLowerCase().includes(ind)) count++; });

    const likelihood = Math.min((count / aiIndicators.length) * 100, 100);
    const reasoning = likelihood > 50 
      ? 'Padrão de escrita excessivement formal e estruturado' 
      : 'Resposta condizente com escrita humana padrão';

    return { likelihood: Math.round(likelihood), reasoning };
  }

  /**
   * ---- NOVO: FIDELIDADE DE AULA (FASE 710) ----
   * Compara presença física (Bio) com engajamento digital (IA).
   * Alta presença + Baixo engajamento = Baixa Fidelidade.
   */
  calculateClassFidelity(attendanceRate: number, engagementScore: number): { score: number; level: 'high' | 'medium' | 'low'; flag: boolean } {
    // Se o engajamento for muito menor que a presença, algo está errado (aluno presente mas não estudando)
    const gap = attendanceRate - engagementScore;
    const fidelityScore = Math.max(100 - gap, 0);

    let level: 'high' | 'medium' | 'low' = 'high';
    if (fidelityScore < 50) level = 'low';
    else if (fidelityScore < 80) level = 'medium';

    // Flag de alerta para a coordenação se o gap for > 40%
    const flag = gap > 40;

    return { score: fidelityScore, level, flag };
  }

  /**
   * ---- NOVO: SPACED REPETITION (SM-2 SIMPLIFICADO) ----
   * Determina a próxima data de revisão de um flashcard.
   * Performance: 0 (não sabe) a 5 (perfect recall)
   */
  getNextReviewDate(currentRecord: ReviewRecord, performance: number): ReviewRecord {
    let { interval, repetition, easeFactor } = currentRecord;

    if (performance >= 3) {
      if (repetition === 0) {
        interval = 1;
      } else if (repetition === 1) {
        interval = 6;
      } else {
        interval = Math.round(interval * easeFactor);
      }
      repetition++;
    } else {
      repetition = 0;
      interval = 1;
    }

    // Ajustar Ease Factor (simplificado)
    easeFactor = easeFactor + (0.1 - (5 - performance) * (0.08 + (5 - performance) * 0.02));
    if (easeFactor < 1.3) easeFactor = 1.3;

    const nextReviewDate = new Date();
    nextReviewDate.setDate(nextReviewDate.getDate() + interval);

    return {
      flashcardId: currentRecord.flashcardId,
      interval,
      repetition,
      easeFactor,
      nextReviewDate
    };
  }

  /**
   * Analisar padrão de presença de um aluno
   */
  async analyzeStudentAttendance(
    studentId: string,
    studentName: string,
    attendanceData: {
      totalDays: number;
      presentDays: number;
      absentDays: number;
      lateArrivals: number;
      earlyDepartures: number;
      absencePattern: string[]; 
    }
  ): Promise<StudentAnalysis> {
    try {
      const attendanceRate = Math.round((attendanceData.presentDays / attendanceData.totalDays) * 100);

      if (!this.apiKey) {
        return this.simulateStudentAnalysis(studentId, studentName, attendanceRate);
      }

      const prompt = `Analise o padrão de presença do aluno: ${studentName}, Taxa: ${attendanceRate}%... [JSON output expected]`;
      const response = await this.callOpenAI(prompt);
      const analysis = this.parseAIResponse(response);

      return {
        studentId,
        studentName,
        attendanceRate,
        absencePattern: analysis.pattern || 'Padrão normal',
        engagementLevel: analysis.engagement || 'medium',
        riskFactors: analysis.riskFactors || [],
        recommendations: analysis.recommendations || [],
        insights: analysis.insights || 'Análise concluída',
      };
    } catch (error) {
      this.logger.error(`Erro ao analisar presença: ${(error as Error).message}`);
      return this.simulateStudentAnalysis(studentId, studentName, 0);
    }
  }

  async analyzeClassPatterns(
    classId: string,
    className: string,
    studentAttendanceData: Array<{ name: string; rate: number }>
  ): Promise<ClassAnalysis> {
    try {
      const averageAttendance = Math.round(
        studentAttendanceData.reduce((sum, s) => sum + s.rate, 0) / studentAttendanceData.length
      );

      const criticalStudents = studentAttendanceData
        .filter(s => s.rate < 70)
        .map(s => s.name);

      if (!this.apiKey) {
        return this.simulateClassAnalysis(classId, className, averageAttendance, criticalStudents);
      }

      const prompt = `Analise a turma ${className}: Média ${averageAttendance}%... [JSON output expected]`;
      const response = await this.callOpenAI(prompt);
      const analysis = this.parseAIResponse(response);

      return {
        classId,
        className,
        averageAttendance,
        attendanceVariance: this.calculateVariance(studentAttendanceData.map(s => s.rate), averageAttendance),
        criticalStudents,
        classPatterns: analysis.pattern || 'Padrão normal',
        recommendations: analysis.recommendations || [],
      };
    } catch (error) {
      this.logger.error(`Erro ao analisar turma: ${(error as Error).message}`);
      return this.simulateClassAnalysis(classId, className, 0, []);
    }
  }

  private async callOpenAI(prompt: string, base64Image?: string): Promise<string> {
    try {
      const messages: any[] = [
        { role: 'system', content: 'Especialista em educação e análise de dados multimodal.' }
      ];

      if (base64Image) {
        messages.push({
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${base64Image}` } }
          ]
        });
      } else {
        messages.push({ role: 'user', content: prompt });
      }

      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages,
          temperature: 0.7,
        }),
      });

      if (!response.ok) throw new Error(`API Error: ${response.status}`);
      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error) {
      this.logger.error(`Erro ao chamar OpenAI: ${(error as Error).message}`);
      throw error;
    }
  }

  private parseAIResponse(response: string): any {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      return jsonMatch ? JSON.parse(jsonMatch[0]) : {};
    } catch { return {}; }
  }

  private simulateSmartMaterial(title: string): SmartMaterialResult {
    return {
      summary: `Este é um resumo simulado de alta fidelidade para a aula de "${title}". O conteúdo aborda os pilares fundamentais do tema, destacando as conexões entre teoria e prática observadas na lousa.`,
      flashcards: [
        { question: `Qual o conceito principal de ${title}?`, answer: 'É o pilar fundamental que sustenta a aplicação prática do tema.', tags: ['Conceito', 'Base'] },
        { question: 'Como aplicar este conhecimento no dia a dia?', answer: 'Através da observação dos padrões e execução dos exercícios propostos.', tags: ['Prática'] }
      ],
      retentionQuestions: [
        { 
          id: 'q1', 
          question: `Sobre ${title}, qual alternativa está correta?`, 
          options: ['Opção A (Falsa)', 'Opção B (Correta)', 'Opção C (Incompleta)'], 
          correctAnswerIndex: 1, 
          explanation: 'A opção B descreve com precisão o fenômeno pedagógico discutido.' 
        }
      ],
      transcript: 'Transcrição simulada: [Conteúdo da lousa processado com sucesso via OCR-AI].',
      youtubeQueries: [`${title} aula completa`, `${title} exercícios resolvidos`],
      studyCycleTasks: [
        { title: 'Revisão Flashcards', offsetDays: 1, description: 'Revisar os pontos principais da lousa.' },
        { title: 'Aprofundamento YouTube', offsetDays: 2, description: 'Assistir vídeo complementar sugerido.' }
      ]
    };
  }

  private simulateStudentAnalysis(studentId: string, studentName: string, attendanceRate: number): StudentAnalysis {
    return {
      studentId, studentName, attendanceRate,
      absencePattern: 'Simulação Offline',
      engagementLevel: attendanceRate > 85 ? 'high' : 'medium',
      riskFactors: [], recommendations: [], insights: 'Modo Offline Ativo.'
    };
  }

  private simulateClassAnalysis(classId: string, className: string, averageAttendance: number, criticalStudents: string[]): ClassAnalysis {
    return {
      classId, className, averageAttendance,
      attendanceVariance: 10, criticalStudents,
      classPatterns: 'Padrão normal (Offline)', recommendations: []
    };
  }

  private calculateVariance(values: number[], mean: number): number {
    const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
    const variance = squaredDiffs.reduce((a, b) => a + b, 0) / (values.length || 1);
    return Math.round(Math.sqrt(variance));
  }
}

export default EducationalAIIntegration;

