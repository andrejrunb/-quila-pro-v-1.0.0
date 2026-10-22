import Database from '../../database/Database';
import { AttendanceCalculator } from './AttendanceCalculator';

/**
 * SmartReportService.ts — AG-022
 * Transforma dados brutos em narrativas humanas (Smart Reports).
 * Sugestão comercial da fase 4.
 */
export class SmartReportService {
  constructor(
    private readonly db: Database,
    private readonly calculator: AttendanceCalculator
  ) {}

  /**
   * Gera um resumo narrativo do dia do aluno.
   */
  async generateDailySummary(studentId: string, date: Date): Promise<string> {
    try {
      const student = await this.db.getStudent(studentId);
      if (!student) return 'Aluno não encontrado.';

      // 1. Dados de Presença
      const attendance = await this.calculator.calculateAttendance(studentId, 'all', date);
      
      // 2. Dados de Comportamento (Alertas e Notificações)
      const notifications = await this.db.getUnreadNotifications();
      const behavioralEvents = notifications.filter(n => 
        n.type === 'BEHAVIORAL' || 
        n.message.toLowerCase().includes('correndo') ||
        n.message.toLowerCase().includes('saída')
      );

      // 3. Montar Narrativa (Pattern: Contexto -> Evento -> Conclusão)
      let narrative = `Relatório Áquila Pro — ${student.name} (${date.toLocaleDateString('pt-BR')})\n\n`;

      // Seção de Engajamento
      if (attendance.percentage >= 90) {
        narrative += `📊 Engajamento: Excelente. O aluno manteve ${attendance.percentage}% de presença, demonstrando foco total nas atividades. `;
      } else if (attendance.percentage >= 70) {
        narrative += `📊 Engajamento: Estável. Registramos ${attendance.percentage}% de presença durante o período monitorado. `;
      } else {
        narrative += `📊 Engajamento: Atenção necessária. A presença foi de ${attendance.percentage}%, abaixo do padrão esperado. `;
      }

      // Seção de Comportamento
      if (behavioralEvents.length === 0) {
        narrative += `\n🛡️ Segurança: Comportamento exemplar. Nenhuma anormalidade foi detectada pelas câmeras.`;
      } else {
        const carriesCount = behavioralEvents.filter(n => n.message.includes('correndo')).length;
        narrative += `\n🛡️ Segurança: Observações pontuais. `;
        if (carriesCount > 0) {
          narrative += `Detectamos ${carriesCount} episódios de movimentação acelerada (correria) em áreas comuns. `;
        }
        const exitAlerts = behavioralEvents.filter(n => n.type === 'UNAUTHORIZED_EXIT').length;
        if (exitAlerts > 0) {
          narrative += `Houve registro de tentativa ou passagem por zona de saída. `;
        }
      }

      // Conclusão
      narrative += `\n\n💡 Insights: O sistema Eagle AI recomenda manter o acompanhamento atual.`;

      return narrative;

    } catch (err) {
      console.error('[SmartReportService] Erro ao gerar narrativa:', err);
      return 'Erro ao processar resumo inteligente.';
    }
  }

  /**
   * Placeholder para integração REAL com LLM (ex: OpenAI / Local Llama)
   */
  async generateWithLLM(studentId: string, date: Date, apiKey?: string): Promise<string> {
      // Aqui faríamos o fetch para a API de LLM enviando os dados JSON
      // e pedindo para "atuar como um coordenador pedagógico amigável".
      const rawSummary = await this.generateDailySummary(studentId, date);
      return `[IA-ENHANCED] ${rawSummary}`;
  }
}

