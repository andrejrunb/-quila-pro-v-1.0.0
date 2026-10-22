import { Logger } from './Logger';
import { NotificationGateway, NotificationPayload } from './NotificationGateway';
import * as fs from 'fs';
import * as path from 'path';



/**
 * AntigravityMessenger (v1.3.4)
 * Serviço responsável por orquestrar a comunicação entre o Agente IA e o Usuário via WhatsApp.
 */
export class AntigravityMessenger {
    private targetGroupId: string = '120363425999976493@g.us'; // Grupo 'Aquila' mestre
    private adminPhone: string = '5561999623099'; // Usuário com poder de mando
    private gateway: NotificationGateway | null = null;
    private logger: Logger;
    private static instance: AntigravityMessenger;




    private constructor() {
        this.logger = new Logger('AntigravityMessenger');
    }

    public static getInstance(): AntigravityMessenger {
        if (!AntigravityMessenger.instance) {
            AntigravityMessenger.instance = new AntigravityMessenger();
        }
        return AntigravityMessenger.instance;
    }

    public setGateway(gateway: NotificationGateway): void {
        this.gateway = gateway;
    }


    /**
     * Processa uma mensagem recebida do usuário mestre.
     */
    public async handleIncomingCommand(from: string, body: string, sendReply: (msg: string) => Promise<boolean>, author?: string): Promise<void> {
        const isFromGroup = from === this.targetGroupId;
        const cleanedAuthor = author?.replace('@c.us', '') || from.replace('@c.us', '');

        // Segurança: No grupo, apenas o adminPhone pode dar ordens
        if (isFromGroup && cleanedAuthor !== this.adminPhone) {
            this.logger.warn(`[Messenger] Comando ignorado: ${cleanedAuthor} não tem permissão no grupo.`);
            return;
        }

        if (!isFromGroup && cleanedAuthor !== this.adminPhone) {
            this.logger.warn(`[Messenger] Tentativa de comando privado de número não autorizado: ${cleanedAuthor}`);
            return;
        }


        const command = body.trim().toUpperCase();
        this.logger.info(`[Messenger] Comando recebido de ${cleanedAuthor}: ${command}`);


        switch (command) {
            case 'STATUS':
                await sendReply('🤖 Antigravity Status: Operacional. Contexto: Áquila Pro v1.3.4. Monitorando segurança escolar e infraestrutura.');
                break;
            case 'APROVAR':
            case 'APROVADO':
            case 'SIM':
            case 'OK':
                await this.saveApprovalStatus('approved');
                await sendReply('✅ Entendido! Gravei sua aprovação no sistema. Vou prosseguir com a execução do plano agora.');
                break;

            case 'NEGADO':
            case 'NAO':
            case 'STOP':
                await sendReply('🛑 Operação interrompida conforme sua ordem remota.');
                break;
            case 'AJUDA':
            case 'HELP':
                await sendReply('🛠️ Comandos Disponíveis:\n- *STATUS*: Situação do sistema\n- *APROVAR*: Aceita o último plano\n- *NEGADO*: Cancela operação\n- *AJUDA*: Esta lista');
                break;
            default:
                await sendReply('🤔 Não entendi esse comando. Digite *AJUDA* para ver as opções.');
        }
    }

    /**
     * Salva o status de aprovação em um arquivo local para que o agente possa ler.
     */
    private async saveApprovalStatus(status: 'approved' | 'rejected' | 'pending'): Promise<void> {
        const filePath = path.join(process.cwd(), 'approvals.json');
        const data = {
            last_status: status,
            timestamp: new Date().toISOString(),
            target: this.targetGroupId
        };
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
        this.logger.info(`[Messenger] Status de aprovação salvo: ${status}`);
    }


    /**
     * Envia uma notificação proativa para o grupo mestre via Gateway.
     */
    public async sendProactiveNotification(body: string): Promise<boolean> {
        if (!this.gateway) {
            this.logger.warn('[Messenger] Gateway não configurado. Não é possível enviar proativamente.');
            return false;
        }

        const payload: NotificationPayload = {
            to: this.targetGroupId,
            body: body,
            priority: 'medium'
        };

        // Priorizar a ponte local (whatsapp_webjs) enquanto a API da Meta não é configurada
        return await this.gateway.send('whatsapp_webjs', payload) || 
               await this.gateway.send('whatsapp_meta', payload);

    }

    /**
     * Gera uma notificação de "Novo Plano Criado" para o WhatsApp.
     */

    public formatPlanNotification(planTitle: string, summary: string): string {
        return `📋 *NOVO PLANO DE AÇÃO*\n\n*Título:* ${planTitle}\n\n*Resumo:* ${summary}\n\nDigite *APROVAR* para que eu possa iniciar a execução imediatamente.`;
    }
}


export const antigravityMessenger = AntigravityMessenger.getInstance();
