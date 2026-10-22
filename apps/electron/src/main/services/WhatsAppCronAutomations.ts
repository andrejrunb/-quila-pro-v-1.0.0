import { eagleMessenger } from './EagleMessenger';
import { Database } from '../../database/Database';
import { logger } from '../logger';

export class WhatsAppCronAutomations {
  private db: Database;

  constructor() {
    this.db = Database.getInstance();
  }

  // Passo 247
  public async runMonthlyBillingReminders() {
    logger.info('[WppCron] Verificando mensalidades D-5...');
    // SQL Mock
    const dueIn5Days = [{ phone: '5511999999999', name: 'João' }];
    for (const parent of dueIn5Days) {
      await eagleMessenger.sendTemplate(parent.phone, 'GENERIC' as any, { 
        text: `Olá, responsável por ${parent.name}. Lembramos que a mensalidade vence em 5 dias. Pague via PIX Copia e Cola: 00020126...`
      });
    }
  }

  // Passo 252
  public async runBirthdayWishes() {
    logger.info('[WppCron] Verificando aniversariantes do dia...');
    // SQL Mock
    const bdays = [{ phone: '5511999999999', name: 'Maria' }];
    for (const student of bdays) {
      await eagleMessenger.sendTemplate(student.phone, 'GENERIC' as any, { 
        text: `🎉 O Colégio Áquila deseja um feliz aniversário para ${student.name}! Que este ano letivo seja cheio de realizações.`
      });
    }
  }

  // Passo 254
  public async runSundayMenu() {
    const now = new Date();
    if (now.getDay() === 0) { // Domingo
      logger.info('[WppCron] Disparando Cardápio Semanal...');
      await eagleMessenger.sendTemplate('ALL_PARENTS_BROADCAST', 'GENERIC' as any, { 
        text: `🍎 *Cardápio da Semana Áquila*\nSeg: Estrogonofe\nTer: Peixe Assado\nQua: Feijoada Light\nQui: Massa\nSex: Hambúrguer Artesanal`
      });
    }
  }
}

export const whatsappCronAutomations = new WhatsAppCronAutomations();
