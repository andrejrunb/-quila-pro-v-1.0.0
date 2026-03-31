import { Client, LocalAuth } from 'whatsapp-web.js';
import qrcode from 'qrcode-terminal';
import { INotificationProvider, NotificationPayload } from './NotificationGateway';
import { Logger } from './Logger';

/**
 * WhatsAppWebJSProvider — Provedor de Mensagens via WhatsApp Web (Custo Zero).
 * Baseado no repositório pedroslopez/whatsapp-web.js.
 * Utiliza o Puppeteer para automatizar o envio sem depender da API paga da Meta.
 */
export class WhatsAppWebJSProvider implements INotificationProvider {
    public name = 'whatsapp_webjs';
    private client: Client;
    private logger: Logger;
    private isReady = false;

    constructor() {
        this.logger = new Logger('WhatsAppWebJS');
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

        this.client.initialize().catch(err => {
            this.logger.error(`[WA-WebJS] Erro ao inicializar: ${err}`);
        });
    }

    public async send(payload: NotificationPayload): Promise<boolean> {
        if (!this.isReady) {
            this.logger.warn(`[WA-WebJS] Tentativa de envio falhou: Cliente não está pronto.`);
            return false;
        }

        try {
            // Formatar o número para o padrão do WhatsApp (ex: 556199999999@c.us)
            const chatId = payload.to.includes('@c.us') ? payload.to : `${payload.to}@c.us`;
            
            await this.client.sendMessage(chatId, payload.body);
            this.logger.info(`[WA-WebJS] Mensagem enviada para ${payload.to}`);
            return true;
        } catch (error) {
            this.logger.error(`[WA-WebJS] Erro ao enviar mensagem: ${error}`);
            return false;
        }
    }
}
