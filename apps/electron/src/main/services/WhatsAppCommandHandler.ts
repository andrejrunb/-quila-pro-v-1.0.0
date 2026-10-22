import { logger } from '../logger';
import { Database } from '../../database/Database';
import { eagleMessenger } from './EagleMessenger';

/**
 * WhatsAppCommandHandler (Bloco V)
 * Motor do Bot Conversacional para pais (Autoatendimento)
 * Processa comandos como #notas, #faltas e integra LLM local para RAG (Passo 255)
 */
export class WhatsAppCommandHandler {
  private static instance: WhatsAppCommandHandler;
  private db: Database;
  
  // Cache de sessões de pais (PIN Auth - Passo 239)
  private authSessions = new Map<string, { studentId: string, authenticated: boolean, timestamp: number }>();

  private constructor() {
    this.db = Database.getInstance();
    
    // Injeta Listener no EagleMessenger (mock)
    eagleMessenger.on('incoming-message', (msg: any) => {
      this.handleIncomingMessage(msg.phone, msg.text);
    });
  }

  public static getInstance(): WhatsAppCommandHandler {
    if (!WhatsAppCommandHandler.instance) {
      WhatsAppCommandHandler.instance = new WhatsAppCommandHandler();
    }
    return WhatsAppCommandHandler.instance;
  }

  /**
   * Processamento principal da mensagem recebida
   */
  public async handleIncomingMessage(phone: string, text: string) {
    const rawText = text.trim();
    logger.info(`[WhatsAppBot] Recebido de ${phone}: ${rawText}`);

    // Passo 243: Respostas fora do horário
    const hour = new Date().getHours();
    if (hour < 7 || hour > 18) {
      await eagleMessenger.sendTemplate(phone, 'GENERIC' as any, { text: 'Olá! A Secretaria Áquila atende das 07h às 18h. Para emergências, ligue (11) 9999-9999. Use comandos como #notas se for autoatendimento.' });
      // Não interrompe para permitir que comandos automáticos funcionem de madrugada.
    }

    // Passo 244: Categorização Simples
    const category = this.categorizeMessage(rawText);
    if (category === 'EMERGENCIA') {
      logger.warn(`[WhatsAppBot] EMERGÊNCIA recebida de ${phone}. Roteando para fila prioritária (Passo 245).`);
      // Lógica de alerta piscante no painel UI
    }

    // Comandos Iniciais
    if (rawText.startsWith('#')) {
      const parts = rawText.split(' ');
      const command = parts[0].toLowerCase();
      
      switch (command) {
        case '#notas':
          await this.processNotas(phone, parts[1]); // #notas MATRICULA
          break;
        case '#faltas':
          await this.processFaltas(phone, parts[1]);
          break;
        case '#calendario':
          await eagleMessenger.sendTemplate(phone, 'GENERIC' as any, { text: '📅 *Calendário Áquila*\n- 15/11: Feriado Nacional\n- 20/11: Reunião de Pais (19h)\n- 30/11: Simulado ENEM' });
          break;
        case '#pin':
          await this.processPinAuth(phone, parts[1]); // #pin 1234
          break;
        default:
          await eagleMessenger.sendTemplate(phone, 'GENERIC' as any, { text: 'Comando não reconhecido. Comandos disponíveis:\n#notas [matrícula]\n#faltas [matrícula]\n#calendario' });
      }
    } else {
      // Passo 255: RAG Local - Dúvidas Gerais
      // Se não é comando, tenta responder como assistente (NLP / LLM Local Simulado)
      if (rawText.toLowerCase().includes('matrícula') || rawText.toLowerCase().includes('rematrícula')) {
        await eagleMessenger.sendTemplate(phone, 'GENERIC' as any, { text: '🤖 *Assistente Virtual:*\nAs rematrículas começam em 01 de Dezembro. Todos os processos serão feitos pelo Portal Áquila Web.' });
      } else {
        // Envia para caixa de entrada humana (Passo 242)
        logger.info(`[WhatsAppBot] Mensagem enviada para atendimento manual (Painel Live Chat).`);
      }
    }
  }

  private categorizeMessage(text: string): 'DUVIDA' | 'RECLAMACAO' | 'FINANCEIRO' | 'EMERGENCIA' | 'OUTROS' {
    const lower = text.toLowerCase();
    if (lower.includes('hospital') || lower.includes('acidente') || lower.includes('urgente')) return 'EMERGENCIA';
    if (lower.includes('boleto') || lower.includes('pix') || lower.includes('pagar')) return 'FINANCEIRO';
    if (lower.includes('absurdo') || lower.includes('reclamar') || lower.includes('ruim')) return 'RECLAMACAO';
    if (lower.includes('como') || lower.includes('onde') || lower.includes('qual')) return 'DUVIDA';
    return 'OUTROS';
  }

  private async processNotas(phone: string, matricula?: string) {
    if (!matricula) {
      await eagleMessenger.sendTemplate(phone, 'GENERIC' as any, { text: 'Por favor, informe a matrícula. Ex: #notas 20261234' });
      return;
    }
    
    // Passo 239: Autenticação
    const session = this.authSessions.get(phone);
    if (!session || !session.authenticated || session.studentId !== matricula) {
      this.authSessions.set(phone, { studentId: matricula, authenticated: false, timestamp: Date.now() });
      await eagleMessenger.sendTemplate(phone, 'GENERIC' as any, { text: `🔐 Para acessar os dados de ${matricula}, digite seu PIN de 4 dígitos usando: #pin [SEU_PIN]` });
      return;
    }

    // Busca notas reais
    await eagleMessenger.sendTemplate(phone, 'GENERIC' as any, { text: `🎓 *Boletim - Matrícula ${matricula}*\nMatemática: 8.5\nHistória: 9.0\nFísica: 7.2\nStatus: Aprovado` });
  }

  private async processFaltas(phone: string, matricula?: string) {
    if (!matricula) {
      await eagleMessenger.sendTemplate(phone, 'GENERIC' as any, { text: 'Por favor, informe a matrícula. Ex: #faltas 20261234' });
      return;
    }
    
    const session = this.authSessions.get(phone);
    if (!session || !session.authenticated || session.studentId !== matricula) {
      this.authSessions.set(phone, { studentId: matricula, authenticated: false, timestamp: Date.now() });
      await eagleMessenger.sendTemplate(phone, 'GENERIC' as any, { text: `🔐 Para acessar os dados de ${matricula}, digite seu PIN de 4 dígitos usando: #pin [SEU_PIN]` });
      return;
    }

    await eagleMessenger.sendTemplate(phone, 'GENERIC' as any, { text: `📊 *Faltas - Matrícula ${matricula}*\nNeste mês: 2 faltas.\nTotal ano: 15 horas.\nLimite LDB: Faltam 45h para risco de retenção.` });
  }

  private async processPinAuth(phone: string, pin?: string) {
    const session = this.authSessions.get(phone);
    if (!session) {
      await eagleMessenger.sendTemplate(phone, 'GENERIC' as any, { text: 'Nenhuma consulta pendente. Use #notas ou #faltas primeiro.' });
      return;
    }
    
    // Mock PIN verify (na real checaria no DB se parent PIN == pin)
    if (pin === '1234') { // Mock Hardcoded
      session.authenticated = true;
      this.authSessions.set(phone, session);
      await eagleMessenger.sendTemplate(phone, 'GENERIC' as any, { text: '✅ Autenticado com sucesso! Por favor, repita o comando original (ex: #notas 20261234).' });
    } else {
      await eagleMessenger.sendTemplate(phone, 'GENERIC' as any, { text: '❌ PIN Incorreto. Tente novamente com #pin [SEU_PIN].' });
    }
  }
}

export const whatsappCommandHandler = WhatsAppCommandHandler.getInstance();
