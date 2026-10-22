import { parentPortal } from './ParentPortalService';
import { geofenceMonitorService } from './GeofenceMonitorService';
import { logger } from '../logger';
import { sovereignLibrarianService } from './SovereignLibrarianService';

/**
 * SovereignParentLinkService (v1.0.0)
 * Ponte de inteligência entre o Librarian e o Portal de Pais.
 * Focado em Soberania de Dados e Transparência Proativa.
 */
export class SovereignParentLinkService {
  private static instance: SovereignParentLinkService;

  public static getInstance(): SovereignParentLinkService {
    if (!SovereignParentLinkService.instance) {
      SovereignParentLinkService.instance = new SovereignParentLinkService();
    }
    return SovereignParentLinkService.instance;
  }

  /**
   * [Fase 501] Retorna o status atual de geofencing para exibição no Librarian.
   */
  public async getGeofencingStatus() {
    try {
      return geofenceMonitorService.getArrivingParents();
    } catch (e) {
      logger.error(`[ParentLink] Erro ao obter status de geofencing: ${e}`);
      return [];
    }
  }

  /**
   * [Fase 501] Compartilha um insight arquivado com a comunidade de pais.
   * Aplica filtros de soberania para garantir que apenas o necessário seja público.
   */
  public async shareInsightWithParents(insightId: string) {
    try {
      const insights = await sovereignLibrarianService.getArchivedInsights();
      const insight = insights.find((i: any) => i.id === insightId);

      if (!insight) {
        throw new Error("Insight institucional não encontrado no arquivo.");
      }

      // Filtro de Soberania: Remove referências técnicas internas
      const publicContent = this.sanitizeForParents(insight.content);
      const publicTitle = `COMUNICADO ÁQUILA: ${insight.title.replace('Insight Estratégico: ', '')}`;

      // Envia notificação geral (Broadcast Simulado)
      await parentPortal.pushSecurityAlert('GENERAL', 'event', `${publicTitle}\n\n${publicContent}`);
      
      logger.info(`[ParentLink] Insight ${insightId} compartilhado com sucesso.`);
      return { success: true, sharedAt: new Date().toISOString() };
    } catch (e) {
      logger.error(`[ParentLink] Erro ao compartilhar insight: ${e}`);
      throw e;
    }
  }

  /**
   * [Fase 501] Dispara alerta direto para os pais de um aluno específico.
   */
  public async triggerDirectParentAlert(studentId: string, message: string, severity: 'alert' | 'event') {
    try {
      await parentPortal.pushSecurityAlert(studentId, severity, message);
      logger.info(`[ParentLink] Push enviado para pais do aluno ${studentId}`);
      return { success: true };
    } catch (e) {
      logger.error(`[ParentLink] Erro ao disparar alerta direto: ${e}`);
      return { success: false };
    }
  }

  /**
   * Limpa o conteúdo de IA para um tom adequado aos pais, removendo termos como "Probabilidade de Risco".
   */
  private sanitizeForParents(content: string): string {
    return content
      .replace(/Risco Institucional: \d+%/g, 'Status: Atenção Coordenada')
      .replace(/Anomalias detectadas/g, 'Observações pedagógicas recentes')
      .replace(/Probabilidade de evasão/g, 'Necessidade de reforço de vínculo');
  }

  /**
   * [Fase 502] Retorna a previsão de densidade de tráfego para os próximos 30 minutos.
   */
  public async getTrafficForecast() {
    try {
      return geofenceMonitorService.getArrivalPredictions();
    } catch (e) {
      logger.error(`[ParentLink] Erro ao obter previsão de tráfego: ${e}`);
      return null;
    }
  }

  /**
   * [Fase 502] Avisa ao pai que o aluno está pronto para retirada.
   */
  public async notifyStudentReady(studentId: string) {
    try {
      await parentPortal.pushSecurityAlert(studentId, 'event', 'AQUILA: Aluno(a) aguardando no portão para retirada.');
      logger.info(`[ParentLink] Alerta de "Pronto para Retirada" enviado para aluno ${studentId}`);
      return { success: true };
    } catch (e) {
      logger.error(`[ParentLink] Erro ao notificar retirada pronta: ${e}`);
      return { success: false };
    }
  }
}

export const sovereignParentLinkService = SovereignParentLinkService.getInstance();
