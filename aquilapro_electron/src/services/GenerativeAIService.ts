import Database from '../database/Database';
import { AttendanceCalculator } from './AttendanceCalculator';

/**
 * GenerativeAIService.ts — Phase 6 (V2)
 * Service to aggregate student context and call an external Generative AI (LLM) API
 * to generate pedagogical reports. It uses a mock by default if API Key is not set.
 */
export class GenerativeAIService {
  private db: Database;
  private calculator: AttendanceCalculator;

  constructor(db: Database, calculator: AttendanceCalculator) {
    this.db = db;
    this.calculator = calculator;
  }

  /**
   * Generates a pedagogical report using an LLM.
   */
  async generatePedagogicalReport(studentId: string): Promise<string> {
    const student = await this.db.getStudent(studentId);
    if (!student) throw new Error('Aluno não encontrado.');

    // Aggregate context
    const attendance = await this.calculator.calculateAttendance(studentId, 'all', new Date());
    const latestLogs = await this.db.getAuditLogs(studentId);

    // Build the smart prompt
    const prompt = this._buildPrompt(student, attendance, latestLogs);

    // Call external Provider (OpenAI/DeepSeek)
    return await this._callLLMProvider(prompt, student.name);
  }

  /**
   * Analisa múltiplas fotos (quadro, atividades, etc) e gera um resumo pedagógico.
   * Suporta array de imagens em base64.
   */
  async analyzeWhiteboard(imagesBase64: string[], subject: string): Promise<string> {
    const settings = await this.db.getSettings();
    const apiKey = settings.openai_api_key;

    if (!apiKey) {
      return `Resumo da Aula (${subject}): Com base nas ${imagesBase64.length} imagens capturadas, o conteúdo abordado envolveu explicações teóricas e práticas. Os alunos participaram ativamente. (Nota: Configure a API Key para análise visual real via GPT-4o).`;
    }

    try {
      const content: any[] = [
        { type: 'text', text: `Analise estas ${imagesBase64.length} fotos da aula de ${subject}. Identifique os tópicos principais no quadro e nas atividades dos alunos. Gere um resumo executivo pedagógico de até 200 palavras.` }
      ];

      // Adicionar todas as imagens à requisição
      imagesBase64.forEach(img => {
        content.push({
          type: 'image_url',
          image_url: {
            url: `data:image/jpeg;base64,${img}`
          }
        });
      });

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            {
              role: 'user',
              content: content
            }
          ],
          max_tokens: 500
        })
      });

      if (!response.ok) throw new Error(`Erro Vision: ${response.statusText}`);
      const data = await response.json();
      return data.choices[0].message.content.trim();
    } catch (err: any) {
      console.error('[GenerativeAIService] Erro Vision:', err.message);
      return `❌ Falha na análise de múltiplas imagens: ${err.message}`;
    }
  }

  private _buildPrompt(student: any, attendance: any, logs: any[]): string {
    return `
Você é um assistente pedagógico profissional da plataforma Áquila Pro.
O coordenador escolar pediu um resumo analítico sobre o seguinte aluno:

Nome: ${student.name}
Turma: ${student.classId}

Dados de Assiduidade Recente:
- Total de Presenças: ${attendance.totalEntries}
- Alertas de Atraso/Evasão: ${attendance.warnings || 0}
- Média de permanência: ${attendance.avgTimeInSchool || 'N/A'}

Últimos logs disciplinares/eventos (máx 3):
${logs.slice(0, 3).map(l => `- [${new Date(l.created_at).toLocaleDateString()}] ${l.action}: ${l.payload ? JSON.stringify(l.payload) : ''}`).join('\n')}

Por favor, escreva um relatório pedagógico de 2 a 3 parágrafos, em tom empático e profissional, resumindo o engajamento deste aluno e oferecendo orientações diplomáticas para os pais sobre como melhorar a assiduidade ou parabenizando caso os dados sejam positivos. Use linguagem afetuosa mas firme. Mantenha o texto limpo, sem markdown excessivo.
    `.trim();
  }

  private async _callLLMProvider(prompt: string, studentName: string): Promise<string> {
    // A API key can be stored in settings
    const settings = await this.db.getSettings();
    const apiKey = settings.openai_api_key; // Supondo que exista no futuro

    if (!apiKey || apiKey.trim() === '') {
      // Local Mock Fallback
      return this._mockResponse(studentName);
    }

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            { role: 'system', content: 'Você é o Assistente Pedagógico do Sistema Áquila Pro.' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.7
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI Erro: ${response.statusText}`);
      }

      const data = await response.json();
      return data.choices[0].message.content.trim();
    } catch (err: any) {
      console.error('[GenerativeAIService] Erro LLM:', err.message);
      return `❌ Erro ao conectar à API de Inteligência Artificial: ${err.message}. Verifique a Key ou a internet.`;
    }
  }

  private _mockResponse(name: string): string {
    return `Prezados responsáveis por ${name},

Gostaria de compartilhar uma breve análise sobre o recente acompanhamento de seu filho(a) em nossa instituição, gerado através dos dados do sistema Áquila Pro. Observamos que a frequência de ${name} está dentro dos parâmetros esperados, o que demonstra um excelente comprometimento com a rotina escolar. As passagens registradas indicam que o aluno tem mantido assiduidade nas semanas recentes.

Continuamos à disposição para quaisquer esclarecimentos construtivos. É de suma importância mantermos este engajamento positivo para garantir um semestre produtivo!

(Nota de Sistema: Este é um texto modelo gerado localmente pois a chave da API de I.A Generativa ainda não foi configurada nas configurações do Áquila Pro.)`;
  }
}
