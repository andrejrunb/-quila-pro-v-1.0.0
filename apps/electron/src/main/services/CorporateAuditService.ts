import { injectable } from 'inversify';
import { SyncPacket } from '../../services/AiTypes';
import { GenerativeAIService } from './GenerativeAIService';
import { WhatsAppService } from './WhatsAppService';

@injectable()
export class CorporateAuditService {
  private static instance: CorporateAuditService;

  constructor(
    private generativeAi: GenerativeAIService,
    private whatsapp: WhatsAppService
  ) {}

  public static getInstance(): CorporateAuditService {
    if (!CorporateAuditService.instance) {
      CorporateAuditService.instance = new CorporateAuditService(
        GenerativeAIService.getInstance(),
        WhatsAppService.getInstance()
      );
    }
    return CorporateAuditService.instance;
  }

  /**
   * Avalia a qualidade de um insight compartilhado por uma instituição.
   * Se a nota for alta, marca como 'Corporately Approved'.
   */
  async auditSharedInsight(packet: SyncPacket): Promise<{ approved: boolean; score: number; feedback: string }> {
    console.log(`[CorporateAudit] Auditing insight: ${packet.payload.id} from tenant ${packet.tenantId}`);

    const prompt = `
      Analise a qualidade pedagógica do seguinte material compartilhado em um enxame de escolas:
      Título: ${packet.payload.title}
      Resumo: ${packet.payload.excerpt}
      
      Atribua uma nota de 0 a 100 e um feedback curto (1 frase).
      Responda APENAS em JSON no formato: {"score": number, "feedback": string}
    `;

    try {
      const response = await this.generativeAi.analyzeContent(prompt);
      const result = JSON.parse(response);

      const approved = result.score >= 80;

      if (approved) {
        console.log(`[CorporateAudit] Insight ${packet.payload.id} APPROVED with score ${result.score}`);
      }

      return {
        approved,
        score: result.score,
        feedback: result.feedback
      };
    } catch (error) {
      console.error('[CorporateAudit] Error during audit:', error);
      return { approved: false, score: 0, feedback: 'Erro na auditoria automática.' };
    }
  }

  /**
   * Notifica a coordenação do tenant de destino sobre um material auditado e recomendado.
   */
  async notifyRecommendation(targetTenantId: string, materialTitle: string, score: number) {
    // Simulação: buscar telefone do coordenador do tenant
    const phone = '5511999999999'; 
    const message = `🔔 *Curadoria Áquila Pro*\n\nUm novo material sobre "${materialTitle}" foi auditado com nota ${score}/100 e está disponível para sua escola.\n\n_Soberania & Inteligência Federada_`;
    
    await this.whatsapp.sendMessage(phone, message);
  }
}
