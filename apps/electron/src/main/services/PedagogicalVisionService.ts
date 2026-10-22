import { Database } from '../../database/Database';
import { GenerativeAIService } from './GenerativeAIService';

export class PedagogicalVisionService {
  private db: Database;
  private aiService: GenerativeAIService;

  constructor(db: Database, aiService: GenerativeAIService) {
    this.db = db;
    this.aiService = aiService;
  }

  // 1. Professor envia foto da Lousa
  async processWhiteboardImage(classId: string, base64Image: string): Promise<{ success: boolean; message: string; content?: string }> {
    try {
      // Simula OCR Modal / LLaVA
      const prompt = "Aqui está uma imagem da lousa. Extraia o texto, formate os conceitos chave e gere 3 perguntas de estudo rápido.";
      // Em uma integração real com LLaVA via Ollama, passaríamos o base64
      const response = await this.aiService.analyzeWhiteboard([base64Image], prompt);

      // Save to Database as Class Material
      await this.db.run(
        `INSERT INTO events (id, classId, type, timestamp, details) VALUES (?, ?, ?, ?, ?)`,
        [`wb-${Date.now()}`, classId, 'whiteboard_summary', new Date().toISOString(), response]
      );

      return { success: true, message: 'Lousa processada e enviada para a turma!', content: response };
    } catch (err: any) {
      console.error('Erro ao processar lousa:', err);
      return { success: false, message: err.message };
    }
  }

  // 2. Aluno pergunta pro Copiloto de Estudos
  async getStudyHelp(studentId: string, question: string): Promise<{ success: boolean; answer: string }> {
    try {
      // Busca o histórico do aluno, faltas, boletim e resumos da lousa
      // No cenário real, faríamos um select complexo de RAG aqui.
      const prompt = `O aluno (ID: ${studentId}) fez a seguinte pergunta: "${question}". Você é o tutor de IA da escola Áquila Pro. Baseado nos conteúdos ensinados (finja que sabe o contexto da última lousa), responda de forma didática.`;
      
      const response = await this.aiService.chatWithSovereignContext(prompt, studentId);
      return { success: true, answer: response.content };
    } catch (err: any) {
      return { success: false, answer: "Não consegui formular a resposta no momento. Meu motor neural está reiniciando." };
    }
  }
}
