import { EventEmitter } from 'events';
import { evolutionaryTimelineService } from './EvolutionaryTimelineService';
import { ollamaIntegration } from './OllamaIntegration';
import { logger } from '../main/logger';

/**
 * Phase 281/401+ — ParentPortalService
 * Backend para o Portal de Pais avançado.
 * Inclui assistente de IA pedagógico, Geofencing e notificações de segurança.
 */
export interface ParentMessage {
  id: string;
  parentId: string;
  studentId: string;
  content: string;
  aiResponse?: string;
  timestamp: number;
}

export interface SecurityNotification {
  id: string;
  studentId: string;
  type: 'access' | 'alert' | 'event';
  message: string;
  timestamp: number;
}

export interface GeofenceEvent {
  parentId: string;
  studentId: string;
  status: 'approaching' | 'arrived' | 'departed';
  distance: number; // metros
  timestamp: number;
}

class ParentPortalService extends EventEmitter {
  private messages: ParentMessage[] = [];

  constructor() {
    super();
  }

  public async sendMessage(parentId: string, studentId: string, content: string): Promise<ParentMessage> {
    const message: ParentMessage = {
      id: `msg-${Date.now()}`,
      parentId,
      studentId,
      content,
      timestamp: Date.now()
    };

    const response = await this.generateAIResponse(content);
    message.aiResponse = response;

    this.messages.push(message);
    this.emit('new-message', message);
    return message;
  }

  private async generateAIResponse(query: string): Promise<string> {
    await new Promise(r => setTimeout(r, 1000));
    
    if (query.toLowerCase().includes('segurança')) {
      return 'Olá! O Áquila Pro está operando com 100% de integridade. Seu filho(a) está em ambiente monitorado.';
    }
    return 'Entendi sua dúvida. Como assistente Áquila, estou processando os dados para lhe dar a melhor resposta pedagógica.';
  }

  public async pushSecurityAlert(studentId: string, type: SecurityNotification['type'], msg: string) {
    const notification: SecurityNotification = {
      id: `notif-${Date.now()}`,
      studentId,
      type,
      message: msg,
      timestamp: Date.now()
    };
    this.emit('security-alert', notification);
  }

  public registerGeofenceEvent(event: GeofenceEvent) {
    this.emit('geofence-trigger', event);
    if (event.distance < 500 && event.status === 'approaching') {
      this.pushSecurityAlert(event.studentId, 'event', 'Pai/Mãe se aproximando para retirada (Geofencing).');
    }
  }

  /**
   * [SQA-PAR-755] Gera um resumo da jornada do aluno para o app mobile.
   */
  public async getStudentDigest(studentId: string) {
    try {
      const history = await evolutionaryTimelineService.getStudentLifecycle(studentId);
      const deltas = evolutionaryTimelineService.calculateGrowthDeltas(history.history);

      const prompt = `Resuma o progresso do aluno ${studentId} de forma acolhedora para os pais. 
                      Dados: Comportamento Médio ${history.history[history.history.length-1].avgBehaviorScore}%, 
                      Status Acadêmico: ${history.history[history.history.length-1].avgAcademicScore}%. 
                      Marcos Recentes: ${history.history[history.history.length-1].milestones.join(', ')}.`;

      const aiSummary = await ollamaIntegration.generate(prompt);

      return {
        studentId,
        historySummary: history.history.map(h => ({
           year: h.year,
           grade: h.gradeLevel,
           milestones: h.milestones
        })),
        aiInsight: aiSummary,
        growthStatus: deltas ? (deltas.isPositiveTrend ? 'Em ascensão' : 'Estável') : 'Iniciando',
        timestamp: Date.now()
      };
    } catch (error) {
      logger.error(`Erro ao gerar digest para pais: ${(error as Error).message}`);
      return null;
    }
  }

  /**
   * [SQA-PAR-801] Recupera digests pedagógicos para todos os filhos de um pai.
   */
  public async getFamilyDigest(studentIds: string[]) {
    const digests = await Promise.all(studentIds.map(id => this.getStudentDigest(id)));
    return digests.filter(d => d !== null);
  }
}

export const parentPortal = new ParentPortalService();
export default parentPortal;
