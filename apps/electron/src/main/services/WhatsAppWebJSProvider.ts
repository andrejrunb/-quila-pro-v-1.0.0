import { Client, LocalAuth } from 'whatsapp-web.js';
import qrcode from 'qrcode-terminal';
import { INotificationProvider, NotificationPayload } from './NotificationGateway';
import { Logger } from './Logger';
import { themeManager } from './ThemeManager';
import pricingService, { SaaSPlan as PricingPlan } from './PricingService';
import { antigravityMessenger } from './AntigravityMessenger';


/**
 * WhatsAppWebJSProvider — Provedor de Mensagens via WhatsApp Web (Custo Zero).
 * Baseado no repositório pedroslopez/whatsapp-web.js.
 * Utiliza o Puppeteer para automatizar o envio sem depender da API paga da Meta.
 */
export class WhatsAppWebJSProvider implements INotificationProvider {
    public name = 'whatsapp_webjs';
    private client?: Client;
    private logger: Logger;
    private isReady = false;

    constructor() {
        this.logger = new Logger('WhatsAppWebJS');
        
        // Em modo de teste ou CI, evitamos inicializar o Puppeteer real para não travar a sessão
        if (process.env.AQUILA_TEST_MODE || process.env.NODE_ENV === 'test') {
            this.logger.info('[WA-WebJS] Modo de Teste detectado. Driver real desativado.');
            return;
        }

        this.client = new Client({
            authStrategy: new LocalAuth(), // Mantém a sessão ativa entre reinicializações
            puppeteer: {
                handleSIGINT: false,
                args: ['--no-sandbox', '--disable-setuid-sandbox'],
            }
        });

        this.initialize();
    }

    private initialize() {
        if (!this.client) return;

        this.client.on('qr', (qr) => {
            this.logger.info('[WA-WebJS] QR Code gerado. Escaneie para conectar.');
            qrcode.generate(qr, { small: true });
        });

        this.client.on('ready', () => {
            this.isReady = true;
            this.logger.info('[WA-WebJS] Cliente está pronto!');
        });

        this.client.on('auth_failure', (msg) => {
            this.logger.error(`[WA-WebJS] Falha na autenticação: ${msg}`);
        });

        this.client.on('disconnected', (reason) => {
            this.isReady = false;
            this.logger.warn(`[WA-WebJS] Cliente desconectado: ${reason}`);
        });

        this.client.on('message', async (msg) => {
            await antigravityMessenger.handleIncomingCommand(
                msg.from,
                msg.body,
                async (text) => {
                    if (this.client) {
                        await this.client.sendMessage(msg.from, text);
                        return true;
                    }
                    return false;
                }
            );
        });

        this.client.initialize().catch(err => {
            this.logger.error(`[WA-WebJS] Erro ao inicializar: ${err}`);
        });

    }

    public async send(payload: NotificationPayload): Promise<boolean> {
        if (!this.isReady || !this.client) {
            this.logger.warn(`[WA-WebJS] Tentativa de envio falhou: Cliente não está pronto ou em modo de teste.`);
            return false;
        }

        try {
            // Lógica de White-Label (v3441)
            // Se o plano não permitir branding customizado, anexar o footer obrigatório
            const currentPlanId = PricingPlan.STARTER; // TODO: Buscar do banco/config real via ThemeService
            const plan = pricingService.getPlans().find(p => p.id === currentPlanId);
            let finalBody = payload.body;

            if (plan && !plan.allowWhiteLabel) {
                finalBody += '\n\n🛡️ Mensagem enviada via Áquila Pro School OS.';
            }

            // Formatar o número para o padrão do WhatsApp (ex: 556199999999@c.us)
            const chatId = payload.to.includes('@c.us') ? payload.to : `${payload.to}@c.us`;
            
            await this.client.sendMessage(chatId, finalBody);
            this.logger.info(`[WA-WebJS] Mensagem enviada para ${payload.to}${!plan?.allowWhiteLabel ? ' (com branding)' : ''}`);
            return true;
        } catch (error) {
            this.logger.error(`[WA-WebJS] Erro ao enviar mensagem: ${error}`);
            return false;
        }
    }
}

