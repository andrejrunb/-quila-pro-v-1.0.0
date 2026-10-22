import { Database } from '../../database/Database';
import { GenerativeAIService } from './GenerativeAIService';
import { logger } from '../logger';
import { JSONParser } from '../utils/JSONParser';
import { parentPortal } from './ParentPortalService';

export interface ScanResult {
  studentId: string;
  answers: Record<string, string>;
  confidence: number;
  rawResponse: string;
}

/**
 * SovereignVisionService (v1.5.0)
 * Especializado em OCR de cartões-resposta usando Gemini-1.5-Flash via GenerativeAIService.
 */
export class SovereignVisionService {
  private db: Database;
  private aiService: GenerativeAIService;

  constructor(db: Database, aiService: GenerativeAIService) {
    this.db = db;
    this.aiService = aiService;
  }

  /**
   * Processa a imagem de uma folha de respostas.
   */
  public async processAnswerSheet(imageBase64: string, assessmentId: string): Promise<ScanResult> {
    logger.info(`[Vision] Iniciando OCR para Avaliação: ${assessmentId}`);
    
    const assessment = await this.db.get(`SELECT * FROM assessments WHERE id = ?`, [assessmentId]);
    if (!assessment) throw new Error('Avaliação não encontrada.');

    const prompt = `
      Você é o Agente de Visão do Áquila Pro.
      Sua tarefa é analisar uma folha de respostas de múltipla escolha (bubbles) e extrair os resultados.

      REGRAS DE EXTRAÇÃO:
      1. Localize o quadro de respostas (Grade de 1 a ${Object.keys(JSON.parse(assessment.answerKey)).length}).
      2. Identifique qual letra (A, B, C, D ou E) está preenchida/marcada para cada questão.
      3. Se uma questão estiver em branco ou com marcação ambígua, marque como null.
      4. Tente identificar o nome do aluno no topo da folha.
      
      RETORNE APENAS JSON:
      {
        "studentName": "NOME DETECTADO",
        "studentId": "ID_SE_HOUVER",
        "answers": {
          "1": "A",
          "2": "C",
          ...
        },
        "confidence": 0.0 a 1.0 (baseado na nitidez das marcas)
      }
    `;

    try {
      // Usamos o analyzeWhiteboard como base, mas adaptamos o prompt para extração estruturada
      const rawJson = await this.aiService.analyzeWhiteboard([imageBase64], 'Processamento de Gabarito');
      
      // Extração robusta via JSONParser (lida com markdown e textos extras)
      const parsed = JSONParser.parseSafe<any>(rawJson);
      
      return {
        studentId: parsed.studentId,
        answers: parsed.answers,
        confidence: parsed.confidence || 0.8,
        rawResponse: rawJson
      };
    } catch (err: any) {
      logger.error(`[Vision] Erro no processamento: ${err.message}`);
      throw err;
    }
  }

  /**
   * Compara as respostas detectadas com o gabarito e calcula a nota.
   */
  public calculateGrade(scanned: ScanResult, assessment: any): number {
    const key = JSON.parse(assessment.answerKey);
    const questions = Object.keys(key);
    let correct = 0;

    questions.forEach(q => {
      if (scanned.answers[q] === key[q]) {
        correct++;
      }
    });

    const score = (correct / questions.length) * assessment.maxScore;
    return parseFloat(score.toFixed(2));
  }

  /**
   * [Level 501] Analisa capturas do quadro branco ou cadernos no Student AI Lab.
   */
  public async analyzeBoard(imageBase64: string, studentId: string): Promise<any> {
    logger.info(`[Vision] Analisando captura do Student Lab para aluno ${studentId}`);
    
    const prompt = `
      Você é o Tutor de IA do Áquila Pro.
      O aluno tirou uma foto do quadro ou de seu caderno.
      Sua tarefa é:
      1. Transcrever os pontos principais (se houver texto legível).
      2. Detectar o tópico central (Matemática, História, etc.).
      3. Fornecer uma breve explicação pedagógica ou dica de estudo sobre o que foi detectado.
      
      RETORNE APENAS JSON:
      {
        "detectedTopic": "Tópico detectado",
        "transcription": "Texto principal transcrito",
        "pedagogicalFeedback": "Dica de estudo curta e motivadora",
        "confidence": 0.0 a 1.0
      }
    `;

    try {
      const response = await this.aiService.analyzeWhiteboard([imageBase64], prompt);
      const parsed = JSONParser.parseSafe<any>(response);
      
      // Registrar log comportamental (Engajamento+)
      this.db.queueWrite(
        'INSERT INTO behavioral_logs (id, studentId, engagement, riskScore) VALUES (?, ?, ?, ?)',
        [Math.random().toString(36).substr(2, 9), studentId, 1.0, 0]
      );

      return parsed;
    } catch (err: any) {
      logger.error(`[Vision] Erro ao analisar quadro: ${err.message}`);
      return { 
        detectedTopic: "Indeterminado", 
        transcription: "", 
        pedagogicalFeedback: "Não foi possível analisar a imagem. Tente capturar com mais luz.", 
        confidence: 0 
      };
    }
  }

  /**
   * [NEW] Reporta um incidente comportamental / indisciplina 
   * Detectado via visão ou via relato do professor.
   */
  public async reportBehavioralIncident(studentId: string, description: string, riskScore: number = 8.5) {
    logger.info(`[Vision] Relato de Indisciplina para ${studentId}: ${description}`);
    
    // Persiste no banco de dados via Write-Behind Cache
    this.db.queueWrite(
      'INSERT INTO behavioral_logs (id, studentId, riskScore, timestamp) VALUES (?, ?, ?, datetime("now"))',
      [`inc-${Date.now()}`, studentId, riskScore]
    );

    // Envia Push Notification para o Parent Portal / Gateway Mobile
    parentPortal.pushSecurityAlert(
      studentId, 
      'alert', 
      `🚨 Relato de Indisciplina: ${description}`
    );

    return { success: true };
  }
}
