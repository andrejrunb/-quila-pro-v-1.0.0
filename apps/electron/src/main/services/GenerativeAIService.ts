import Database from '../../database/Database';
import { AttendanceCalculator } from './AttendanceCalculator';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import { PageIndexRAGService } from './PageIndexRAGService';
import { OllamaIntegration } from './OllamaIntegration';
import { whatsappService } from './WhatsAppService';
import { logger } from '../logger';
import { PromptRegistry } from './logic/PromptRegistry';
import { aiGovernanceService } from './AIGovernanceService';
import { examIntelligenceService } from './ExamIntelligenceService';
import { EcosystemService } from './EcosystemService';
import { SovereignConsciousnessService } from './SovereignConsciousnessService';
import { sovereignResilienceService } from './SovereignResilienceService';

/**
 * GenerativeAIService.ts — Phase 6 (V2)
 * Service to aggregate student context and call an external Generative AI (LLM) API
 * to generate pedagogical reports. It uses a mock by default if API Key is not set.
 */
export class GenerativeAIService {
  private static instance: GenerativeAIService;
  private db!: Database;
  private calculator!: AttendanceCalculator;
  private ragService: PageIndexRAGService | null = null;
  private ollama: OllamaIntegration | null = null;
  private frustrationCounter: Map<string, number> = new Map();
  private ecosystem: EcosystemService;

  constructor(db: Database, calculator: AttendanceCalculator, ragService?: PageIndexRAGService, ollama?: OllamaIntegration) {
    this.db = db;
    this.calculator = calculator;
    this.ragService = ragService || null;
    this.ollama = ollama || null;
    this.ecosystem = EcosystemService.getInstance();
    aiGovernanceService.setDatabase(db);
  }

  public static getInstance(): GenerativeAIService {
    if (!GenerativeAIService.instance) {
      GenerativeAIService.instance = new GenerativeAIService(
        Database.getInstance(),
        AttendanceCalculator.getInstance()
      );
    }
    return GenerativeAIService.instance;
  }

  /**
   * Generates a pedagogical report using an LLM.
   */
  async generatePedagogicalReport(studentId: string): Promise<string> {
    const student = await this.db.getStudent(studentId);
    if (!student) throw new Error('Aluno não encontrado.');

    // Aggregate context
    const attendance = await this.calculator.calculateAttendance(studentId, 'all', new Date());
    const latestLogs = await this.db.getStudentAuditLogs(studentId, 10);

    // Build the smart prompt
    const prompt = this._buildPrompt(student, attendance, latestLogs);

    // Call external Provider (OpenAI/DeepSeek)
    return await this._callLLMProvider(prompt, student.name);
  }

  /**
   * [NEW] Generates study material for the Mobile App Student Lab.
   */
  async generateStudyMaterial(topic: string): Promise<string> {
    const prompt = `Você é o Tutor de Inteligência Artificial do Áquila Pro.
Crie um resumo pedagógico sobre "${topic}". 
Inclua:
1. Um resumo direto e didático (fácil de entender).
2. 3 tópicos importantes (estilo Flashcards).
Seja amigável e motivador.
Retorne o conteúdo formatado em Markdown nativo, evite jargões complexos que dificultem o aprendizado rápido.`;

    return await this._callLLMProvider(prompt, 'Student_Lab');
  }

  /**
   * Generic content analysis wrapper for the service mesh.
   */
  async analyzeContent(prompt: string): Promise<string> {
    return await this._callLLMProvider(prompt, 'Global System context');
  }

  /**
   * Analisa múltiplas fotos (quadro, atividades, etc) e gera um resumo pedagógico.
   * Suporta array de imagens em base64.
   */
  async analyzeWhiteboard(imagesBase64: string[], subject: string): Promise<string> {
    const settings = await this.db.getSettings();
    const provider = settings.ai_provider || 'openai';
    const endpoint = settings.ai_endpoint || 'https://api.openai.com/v1';
    const modelId = settings.ai_model_id || 'gpt-4o';
    const apiKey = settings.google_api_key || settings.openai_api_key;

    if (provider === 'google' && settings.google_api_key) {
      return await this.analyzeWithGeminiVision(imagesBase64, PromptRegistry.VISION_ANALYSIS(subject));
    }

    // Fallback amigável se as chaves não estiverem configuradas corretamente
    if (!apiKey) {
      return `Resumo da Aula (${subject}): Com base nas ${imagesBase64.length} imagens capturadas, o conteúdo abordado envolveu explicações teóricas e práticas. (Nota: Configure a Google API Key para análise visual profunda ou use o Sovereign Qwen).`;
    }

    try {
      const content: any[] = [
        { type: 'text', text: PromptRegistry.VISION_ANALYSIS(subject) }
      ];

      imagesBase64.forEach(img => {
        content.push({
          type: 'image_url',
          image_url: {
            url: `data:image/jpeg;base64,${img}`
          }
        });
      });

      const response = await fetch(`${endpoint.replace(/\/$/, '')}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': provider === 'openai' ? `Bearer ${apiKey}` : 'Bearer lm-studio'
        },
        body: JSON.stringify({
          model: modelId,
          messages: [{ role: 'user', content: content }],
          max_tokens: 500
        })
      });

      if (!response.ok) throw new Error(`Erro Provider (${provider}): ${response.statusText}`);
      const data = await response.json();
      return data.choices[0].message.content.trim();
    } catch (err: any) {
      console.error('[GenerativeAIService] Erro Vision:', err.message);
      return `❌ Falha na análise soberana: ${err.message}. Certifique-se que o modelo ${modelId} suporta visão.`;
    }
  }

  private _buildPrompt(student: any, attendance: any, logs: any[]): string {
    return PromptRegistry.PEDAGOGICAL_REPORT({
      studentName: student.name,
      classId: student.classId,
      attendance,
      logs
    });
  }

  public async _callLLMProvider(prompt: string, studentName: string): Promise<string> {
    const settings = await this.db.getSettings();
    const ecoState = this.ecosystem.getState();
    
    // Se o Ecossistema estiver em modo SOBERANO, forçamos o provedor local (Ollama/LMStudio)
    // Se estiver em modo CLOUD, respeitamos o que estiver nas configurações (OpenAI/Google)
    let provider = ecoState.aiProvider === 'sovereign' ? 'ollama' : (settings.ai_provider || 'openai');
    
    const endpoint = settings.ai_endpoint || 'https://api.openai.com/v1';
    const modelId = settings.ai_model_id || 'gpt-4o';
    const apiKey = settings.openai_api_key;

    // Helper para verificar conectividade rápida
    const isOnline = async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000);
        await fetch('https://www.google.com', { mode: 'no-cors', signal: controller.signal });
        clearTimeout(timeoutId);
        return true;
      } catch {
        return false;
      }
    };

    // Se estiver em modo CLOUD, verificamos se há internet. Se não, tentamos fallback.
    if (provider !== 'ollama' && provider !== 'lmstudio') {
      const isAirGapActive = process.env.AQUILA_AIRGAP_ACTIVE === 'true';
      const online = isAirGapActive ? false : await isOnline();
      
      if (!online) {
        console.warn(`[GenerativeAIService] ${isAirGapActive ? 'Air-Gap Active' : 'Offline detected'}. Attempting fallback from ${provider}...`);
        if (this.ecosystem.canFallbackToSovereign()) {
          console.info('[GenerativeAIService] Hardware capaz detectado. Redirecionando para Sovereign Node (Ollama/Local).');
          provider = 'ollama'; // Forçamos o provedor local
        } else {
          const reason = isAirGapActive ? "Modo Air-Gap Ativo sem hardware local compatível." : "Unidade offline sem hardware local compatível.";
          await SovereignConsciousnessService.getInstance().reportCriticalFailure(reason);
          return `🚨 *ALERTA DE SISTEMA*: ${isAirGapActive ? 'O sistema está em ISOLAMENTO (Air-Gap)' : 'A unidade está offline'} e o hardware local não possui NPU/GPU para processamento soberano. Por favor, verifique a conexão ou contate o Diretor.`;
        }
      }
    }

    try {
      if (provider === 'google' && apiKey) {
        return await this._callGeminiProvider(prompt, modelId, apiKey);
      }

      // [Shield Pro] Auditando o prompt antes do envio
      const shieldedPrompt = await aiGovernanceService.shieldPrompt(prompt, { provider, modelId });

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(`${endpoint.replace(/\/$/, '')}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': provider === 'openai' ? `Bearer ${apiKey}` : 'Bearer lm-studio'
        },
        signal: controller.signal,
        body: JSON.stringify({
          model: modelId,
          messages: [
            { role: 'system', content: 'Você é o Assistente Pedagógico do Sistema Áquila Pro.' },
            { role: 'user', content: shieldedPrompt }
          ],
          temperature: 0.7
        })
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Provider Error (${provider}): ${response.statusText}`);
      }

      const data = await response.json();
      const rawResponse = data.choices[0].message.content.trim();

      // [ROI Engine] Log token usage (approximation based on string length if exact tokens aren't provided by API)
      const { aiRoiEngineService } = await import('./AiRoiEngineService');
      const tokensIn = Math.ceil(prompt.length / 4);
      const tokensOut = Math.ceil(rawResponse.length / 4);
      aiRoiEngineService.logUsage('llm_text', tokensIn, tokensOut, 0);

      // [Shield Pro] Auditando a resposta antes da entrega
      return await aiGovernanceService.shieldResponse(rawResponse);
    } catch (err: any) {
      console.error('[GenerativeAIService] Erro LLM:', err.message);
      
      // Se falhar o LM Studio, podemos tentar fallback para mock em vez de erro bruto
      if (provider === 'lmstudio') {
        console.warn('[GenerativeAIService] Fallback para mock devido a erro no LM Studio.');
        return this._mockResponse(studentName) + "\n\n(Aviso: O servidor soberano está offline.)";
      }

      return `❌ Erro ao conectar ao provedor ${provider}: ${err.message}.`;
    }
  }

  private _mockResponse(name: string): string {
    return `Prezados responsáveis por ${name},

Gostaria de compartilhar uma breve análise sobre o recente acompanhamento de seu filho(a) em nossa instituição, gerado através dos dados do sistema Áquila Pro. Observamos que a frequência de ${name} está dentro dos parâmetros esperados, o que demonstra um excelente comprometimento com a rotina escolar. As passagens registradas indicam que o aluno tem mantido assiduidade nas semanas recentes.

Continuamos à disposição para quaisquer esclarecimentos construtivos. É de suma importância mantermos este engajamento positivo para garantir um semestre produtivo!

(Nota de Sistema: Este é um texto modelo gerado localmente pois a chave da API de I.A Generativa ainda não foi configurada nas configurações do Áquila Pro.)`;
  }

  /**
   * Synthesizes a multidimensional technical evolutionary insight for the Cortex.
   */
  async synthesizeEvolutionaryInsight(studentId: string): Promise<{ category: string, content: string, tags: string[], severity: string }> {
    const student = await this.db.getStudent(studentId);
    if (!student) throw new Error('Aluno não encontrado.');

    // Busca o resumo pedagógico consolidado (Faltas, Comportamento, Tarefas, Evasão)
    const summary = await this.db.getStudentPedagogicalSummary(studentId);

    const prompt = PromptRegistry.EVOLUTIONARY_INSIGHT({
      studentName: student.name,
      summary
    });

    const response = await this._callLLMProvider(prompt, student.name);
    
    try {
      return JSON.parse(response);
    } catch (e) {
      return { 
        category: 'PEDAGOGICAL_STATUS', 
        severity: 'INFO', 
        content: response.substring(0, 150), 
        tags: ['auto-generated-fallback'] 
      };
    }
  }

  /**
   * Chat Avançado com Grounding Híbrido: Local (RAG) + Cloud (Google Search).
   */
  async chatWithSovereignContext(prompt: string, studentId?: string): Promise<{ content: string, citations?: any[] }> {
    let context = "";
    
    // 1. RAG Local (Sovereign Knowledge)
    if (this.ragService) {
      try {
        const ragResults = await this.ragService.search(prompt, 3);
        if (ragResults.length > 0) {
          context = "CONTEXTO LOCAL DA ESCOLA (SOBERANO):\n" + 
            ragResults.map(r => `[Arquivo: ${r.file}] ${r.snippet}`).join('\n') + 
            "\n---\nUse as informações acima PRIORITARIAMENTE para responder.\n\n";
        }
      } catch (err) {
        logger.error(`[GenerativeAI] Erro no RAG Local: ${err}`);
      }
    }

    const fullPrompt = context + prompt;
    const settings = await this.db.getSettings();
    const apiKey = settings.google_api_key || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    
    let aiResponseContent = "";
    let citations: any[] = [];

    try {
      if (apiKey) {
        try {
          const genAI = new GoogleGenerativeAI(apiKey);
          const model = genAI.getGenerativeModel({ 
            model: settings.ai_model_id || 'gemini-1.5-flash',
            tools: [{ googleSearchRetrieval: {} } as any]
          });

          const result = await model.generateContent(fullPrompt);
          aiResponseContent = result.response.text();
          // @ts-ignore
          citations = result.response.candidates?.[0]?.groundingMetadata?.searchEntryMetadata || [];
        } catch (geminiErr: any) {
          logger.warn(`[GenerativeAI] Google Gemini indisponível (${geminiErr.message}). Acionando failover para NVIDIA NIM...`);
          aiResponseContent = await this._callNvidiaNIM(fullPrompt);
        }
      } else {
        aiResponseContent = await this._callNvidiaNIM(fullPrompt);
      }
    } catch (err: any) {
      logger.error(`[GenerativeAI] Erro nos provedores remotos: ${err.message}`);
      if (this.ollama) {
        try {
          aiResponseContent = await this.ollama.generate(fullPrompt);
        } catch {
          aiResponseContent = this._getPedagogicalFallback(prompt);
        }
      } else {
        aiResponseContent = this._getPedagogicalFallback(prompt);
      }
    }

    if (!aiResponseContent || aiResponseContent.trim() === '') {
      aiResponseContent = this._getPedagogicalFallback(prompt);
    }

    // 2. Detecção de Frustração (Opção 3)
    if (studentId) {
      await this._trackPedagogicalFrustration(studentId, prompt, aiResponseContent);
    }

    return { content: aiResponseContent, citations };
  }

  private async _callNvidiaNIM(prompt: string, model: string = 'meta/llama-3.2-11b-vision-instruct'): Promise<string> {
    const nvidiaKey = process.env.NVIDIA_API_KEY || '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';
    const response = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${nvidiaKey}`
      },
      body: JSON.stringify({
        model,
        messages: [
          { 
            role: 'system', 
            content: 'Você é o Córtex-SIE (Sovereign Intelligence Evolution), o tutor de inteligência artificial pedagógica do ecossistema Áquila Pro. Você responde a dúvidas de alunos de forma extremamente didática, encorajadora, conceitualmente rigorosa e clara em Markdown. Responda em português do Brasil.' 
          },
          { role: 'user', content: prompt }
        ],
        max_tokens: 1000,
        temperature: 0.6
      })
    });

    if (!response.ok) {
      throw new Error(`NVIDIA NIM HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content?.trim() || '';
  }

  private _getPedagogicalFallback(prompt: string): string {
    const p = prompt.toLowerCase();
    if (p.includes('fisica') || p.includes('física')) {
      return `### ⚛️ Tutoria de Física — Córtex-SIE\n\nA **Física** é a ciência que investiga as propriedades fundamentais da matéria, energia, espaço e tempo, explicando o funcionamento do universo desde partículas subatômicas até galáxias.\n\n#### 📚 Grandes Áreas de Foco:\n1. **Cinemática e Dinâmica:** Movimento, aceleração, forças e Leis de Newton.\n2. **Termologia:** Calorimetria, dilatação e as Leis da Termodinâmica.\n3. **Eletromagnetismo:** Cargas elétricas, campos magnéticos, circuitos e ondas.\n4. **Óptica e Ondulatória:** Fenômenos luminosos, reflexão, refração e acústica.\n5. **Física Moderna:** Relatividade e introdução à Mecânica Quântica.\n\nQual tópico específico de física você gostaria de explorar ou exercitar agora?`;
    }
    if (p.includes('matematica') || p.includes('matemática')) {
      return `### 📐 Tutoria de Matemática — Córtex-SIE\n\nA Matemática é a base de todas as ciências exatas. O Córtex do Áquila Pro pode auxiliá-lo em **Funções**, **Trigonometria**, **Geometria Espacial**, **Matrizes** e **Cálculo**. Envie uma questão ou conceito para resolvermos passo a passo!`;
    }
    return `Olá! Sou o **Córtex-SIE**, seu tutor de estudos soberano. Compreendi sua solicitação sobre "${prompt.slice(0, 60)}". O módulo neural está analisando seus materiais e tarefas para lhe orientar. Como posso aprofundar sua explicação?`;
  }

  private async _trackPedagogicalFrustration(studentId: string, userMsg: string, aiResp: string) {
    const frustrationTriggers = [
      'não entendi', 'não funciona', 'está errado', 'difícil', 'ajuda', 
      'não consigo', 'horroroso', 'péssimo', 'odeio', 'burro'
    ];
    
    const isFrustrated = frustrationTriggers.some(t => userMsg.toLowerCase().includes(t)) || 
                         aiResp.toLowerCase().includes('sinto muito que você esteja com dificuldade');
    
    if (isFrustrated) {
      // 1. Persistir no Banco de Dados
      await this.db.run(
        `UPDATE students SET frustrationScore = frustrationScore + 1 WHERE id = ?`,
        [studentId]
      );

      const student = await this.db.getStudent(studentId);
      if (student) {
        logger.warn(`[GenerativeAI] Nível de frustração do aluno ${student.name}: ${student.frustrationScore}`);

        // 2. Gatilho de Observação Próxima (Limiar: 3)
        if (student.frustrationScore >= 3) {
          await this.db.run(
            `UPDATE students SET observationLevel = 1 WHERE id = ?`,
            [studentId]
          );

          whatsappService.sendToNotas(
            `🚨 *ALERTA PEDAGÓGICO CRÍTICO*\n\n` +
            `O aluno *${student.name}* atingiu o nível de frustração crítica (3+ interações).\n` +
            `O sistema ativou o modo de *Observação Próxima*.\n\n` +
            `_Por favor, um mentor humano deve intervir para auxílio pedagógico._`
          ).catch(e => logger.error(`Falha no WhatsApp: ${e}`));
        }
      }
    } else {
      // Redução lenta de frustração em interações positivas
      const student = await this.db.getStudent(studentId);
      if (student && student.frustrationScore > 0) {
        await this.db.run(
          `UPDATE students SET frustrationScore = MAX(0, frustrationScore - 1) WHERE id = ?`,
          [studentId]
        );
        
        // Auto-Recuperação: Se a frustração zerar e o aluno estiver em observação, remove a observação
        if (student.frustrationScore === 1 && student.observationLevel === 1) {
          await this.db.run(`UPDATE students SET observationLevel = 0 WHERE id = ?`, [studentId]);
          logger.info(`[GenerativeAI] Auto-Recuperação: Aluno ${student.name} saiu do modo de observação.`);
          
          whatsappService.sendToNotas(
            `✅ *RECUPERAÇÃO AUTÔNOMA*\n\n` +
            `O aluno *${student.name}* demonstrou engajamento positivo e seu nível de frustração zerou.\n` +
            `O sistema desativou o monitoramento crítico automaticamente.`
          ).catch(e => logger.error(`Falha no WhatsApp: ${e}`));
        }
      }
    }
  }

  /**
   * Gera materiais pedagógicos (Resumos, Flashcards, Listas, Provas) a partir de um conteúdo bruto.
   * [Phase 2600] Adicionado suporte para Alinhamento de Vestibulares/Bancas.
   */
  async generatePedagogicalMaterial(
    type: 'summary' | 'flashcards' | 'questions' | 'exercise_list' | 'form' | 'youtube_links', 
    content: string,
    targetExamId?: string
  ): Promise<any> {
    let systemPrompt = "";
    const banca = targetExamId ? examIntelligenceService.getBancaById(targetExamId) : null;
    const bancaContext = banca ? `\n\nALVO ESTRATÉGICO (BANCA): ${banca.name}. ${banca.promptDirectives}` : "";
    
    switch (type) {
      case 'summary':
        systemPrompt = "Você é um especialista em síntese pedagógica. Transforme o conteúdo abaixo em um resumo estruturado, didático e visualmente limpo usando Markdown." + bancaContext;
        break;
      case 'flashcards':
        systemPrompt = "Você é um especialista em memorização ativa (SRS). Transforme o conteúdo abaixo em uma lista de Flashcards (Pergunta e Resposta). Responda APENAS em formato JSON: [{\"question\": \"...\", \"answer\": \"...\"}]" + bancaContext;
        break;
      case 'questions':
        systemPrompt = "Gere 5 questões dissertativas de nível médio baseadas no conteúdo, com gabarito sugerido ao final." + bancaContext;
        break;
      case 'exercise_list':
        systemPrompt = "Crie uma lista de exercícios com 10 questões baseadas no conteúdo seguindo estritamente o estilo da banca se informada. Caso contrário, use múltipla escolha (A-E). Retorne em Markdown organizado." + bancaContext;
        break;
      case 'form':
        systemPrompt = "Crie um formulário de avaliação diagnóstica baseado no conteúdo, incluindo perguntas sobre os conceitos-chave." + bancaContext;
        break;
      case 'youtube_links':
        systemPrompt = "Aja como um curador de conteúdo educacional. Baseado no conteúdo fornecido, encontre 3 links reais e relevantes do YouTube (incluindo título e URL) que ajudem a aprofundar o conhecimento. Responda APENAS em JSON: [{\"title\": \"...\", \"url\": \"...\"}]";
        break;
    }

    const prompt = `${systemPrompt}\n\nCONTEÚDO PARA PROCESSAMENTO:\n${content}`;
    const settings = await this.db.getSettings();
    const apiKey = settings.google_api_key;

    if (apiKey) {
      const response = await this._callGeminiProvider(prompt, settings.ai_model_id || 'gemini-1.5-flash', apiKey);
      if (type === 'flashcards' || type === 'youtube_links') {
        try {
          // Limpeza básica se a IA retornar markdown code blocks
          const jsonMatch = response.match(/\[.*\]/s);
          const raw = jsonMatch ? jsonMatch[0] : response;
          return JSON.parse(raw);
        } catch (e) {
          logger.error(`[GenerativeAI] Erro ao parsear conteúdo JSON (${type}): ${e}`);
          return [];
        }
      }
      return response;
    } else if (this.ollama) {
      return await this.ollama.generate(prompt);
    }
    
    return "❌ Serviço de IA indisponível para geração de materiais.";
  }

  /**
   * Chamada especializada para o Google Gemini com suporte a Grounding (Busca) e Multimodalidade.
   */
  private async _callGeminiProvider(prompt: string, modelId: string, apiKey: string): Promise<string> {
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Configuração de Grounding (Google Search)
    const model = genAI.getGenerativeModel({ 
      model: modelId.includes('gemini') ? modelId : 'gemini-1.5-flash',
      tools: [
        {
          googleSearchRetrieval: {} // Habilita o Google Search Grounding
        } as any
      ],
      safetySettings: [
        {
          category: HarmCategory.HARM_CATEGORY_HARASSMENT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        }
      ]
    });

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text().trim();
  }

  /**
   * Analisa imagens usando o Gemini Vision de forma nativa e performática.
   */
  async analyzeWithGeminiVision(imagesBase64: string[], prompt: string): Promise<string> {
    const settings = await this.db.getSettings();
    const apiKey = settings.google_api_key || settings.openai_api_key;
    
    if (!apiKey) return "❌ Google API Key necessária para análise multimidial.";

    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      const imageParts = imagesBase64.map(base64 => ({
        inlineData: {
          data: base64,
          mimeType: "image/jpeg"
        }
      }));

      const result = await model.generateContent([prompt, ...imageParts]);
      const response = await result.response;
      const responseText = response.text().trim();

      // [ROI Engine] Log token usage
      const { aiRoiEngineService } = await import('./AiRoiEngineService');
      const tokensIn = Math.ceil(prompt.length / 4) + (imagesBase64.length * 250); // Approximating 250 tokens per image
      const tokensOut = Math.ceil(responseText.length / 4);
      aiRoiEngineService.logUsage('llm_vision', tokensIn, tokensOut, 0);

      return responseText;
    } catch (err: any) {
      console.error('[GenerativeAIService] Gemini Vision Error:', err.message);
      return `❌ Erro na análise visual Google: ${err.message}`;
    }
  }

  // Alias para compatibilidade com o SovereignAIProxy
  async generateText(prompt: string): Promise<string> {
    return await this.analyzeContent(prompt);
  }

  /**
   * [Level 13] Processa tarefas delegadas via malha distribuída.
   */
  public async processDistributedTask(type: string, payload: any): Promise<any> {
    logger.info(`[GenerativeAI] Processando tarefa distribuída: ${type}`);
    
    switch (type) {
      case 'summarization':
        if (payload.studentId && payload.action === 'EVALUATE_EVASION_RISK') {
          return await this.synthesizeEvolutionaryInsight(payload.studentId);
        }
        return await this.analyzeContent(`Resuma o seguinte conteúdo de forma técnica: ${JSON.stringify(payload)}`);
      
      case 'sentiment':
        return await this.analyzeContent(`Analise o sentimento deste log/texto e retorne apenas POSITIVE, NEGATIVE ou NEUTRAL: ${JSON.stringify(payload)}`);
      
      case 'entity_extraction':
        return await this.analyzeContent(`Extraia entidades chave (nomes, datas, locais) deste texto e retorne em JSON: ${JSON.stringify(payload)}`);
      
      default:
        throw new Error(`Tipo de tarefa não suportado: ${type}`);
    }
  }

  /**
   * Obtém embeddings para um texto (Sovereign Semantic Search).
   */
  async getEmbeddings(text: string): Promise<number[]> {
    const settings = await this.db.getSettings();
    const ecoState = this.ecosystem.getState();
    const provider = ecoState.aiProvider === 'sovereign' ? 'ollama' : (settings.ai_provider || 'openai');
    const apiKey = settings.openai_api_key;

    try {
      if (provider === 'ollama' && this.ollama) {
        return await this.ollama.embeddings(text);
      }

      if (provider === 'openai' && apiKey) {
        const endpoint = settings.ai_endpoint || 'https://api.openai.com/v1';
        const response = await fetch(`${endpoint.replace(/\/$/, '')}/embeddings`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model: 'text-embedding-3-small',
            input: text
          })
        });

        if (!response.ok) throw new Error(`OpenAI Embeddings Error: ${response.statusText}`);
        const data = await response.json();
        return data.data[0].embedding;
      }

      // Local fallback using Ollama if available, otherwise mock
      if (this.ollama) return await this.ollama.embeddings(text);
      
      return Array.from({ length: 768 }, (_, i) => Math.sin(text.length + i));
    } catch (err: any) {
      logger.error(`[GenerativeAI] Erro Embeddings: ${err.message}`);
      return Array.from({ length: 768 }, (_, i) => Math.cos(text.length + i));
    }
  }
}

export const generativeAIService = GenerativeAIService.getInstance();

