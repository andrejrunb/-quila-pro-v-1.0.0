import { logger } from '../logger';
import { sovereignMeshService } from './SovereignMeshService';
import { whatsappService } from './WhatsAppService';
import { v4 as uuidv4 } from 'uuid';

/**
 * CORPORATE INTERMEDIARY SERVICE (v1.3)
 * ------------------------------------
 * Atua como o 'Broker' central da empresa para mediar insights entre diferentes escolas.
 * Garante o isolamento soberano enquanto permite que lições validadas cheguem a outros campi.
 */
export class CorporateIntermediaryService {
  private static instance: CorporateIntermediaryService;

  private constructor() {}

  public static getInstance(): CorporateIntermediaryService {
    if (!CorporateIntermediaryService.instance) {
      CorporateIntermediaryService.instance = new CorporateIntermediaryService();
    }
    return CorporateIntermediaryService.instance;
  }

  /**
   * [Phase 1300] Injeta um insight validado pela empresa na rede local.
   * Simula a recepção de uma mensagem exclusiva conforme solicitado pelo usuário.
   */
  public async injectCorporateInsight(payload: {
    title: string;
    summary: string;
    targetRole: string;
    sourceInstitution: string;
  }) {
    logger.info(`[CorporateBroker] Injetando insight mediado: ${payload.title}`);

    // Transmite via Mesh com sourceNode especial CORPORATE_BROKER
    // Isso ignora o isolamento de tenantId no SovereignMeshService
    await sovereignMeshService.broadcast({
      id: `corp_${uuidv4()}`,
      sourceNode: 'CORPORATE_BROKER', // Bypass autorizado
      targetNode: 'all',
      timestamp: Date.now(),
      payloadType: 'RESOURCE_ANNOUNCEMENT',
      payload: {
        ...payload,
        isCorporate: true,
        origin: payload.sourceInstitution
      },
      securityLevel: 'high_sovereignty'
    } as any);

    // Notificação via WhatsApp para professores (v1.3)
    if (payload.targetRole === 'docente' || payload.targetRole === 'TEACHER') {
      try {
        const message = `🌟 *INSIGHT CURADO ÁQUILA PRO*\n\n` +
          `A nossa central acaba de liberar um novo material validado vindo de outra rede institucional:\n\n` +
          `📌 *${payload.title}*\n` +
          `📝 ${payload.summary}\n\n` +
          `_Este conteúdo foi intermediado exclusivamente pela nossa empresa para enriquecer sua aula._`;
          
        await whatsappService.sendToNotas(message);
        logger.info('[CorporateBroker] Notificação de professor enviada via WhatsApp.');
      } catch (err) {
        logger.error(`[CorporateBroker] Falha ao enviar WhatsApp: ${err}`);
      }
    }
  }
}

export const corporateIntermediaryService = CorporateIntermediaryService.getInstance();
