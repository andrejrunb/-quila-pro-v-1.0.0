/**
 * MessageScheduler.ts — Passo 89 do Roadmap.
 * Agendamento inteligente de disparos de WhatsApp.
 * Evita sobrecarga de notificações e respeita horários de descanso (ex: não enviar às 03:00 AM).
 */
export class MessageScheduler {
    private queue: any[] = [];

    /**
     * Adiciona uma mensagem à fila de envio inteligente.
     */
    public schedule(studentId: string, message: string, priority: 'high' | 'normal' = 'normal'): void {
        const now = new Date();
        const hour = now.getHours();

        // Regra de Negócio: Se for entre 22h e 06h, agenda para as 07h, a menos que seja Emergência.
        if (priority !== 'high' && (hour >= 22 || hour < 6)) {
            console.log(`[MessageScheduler] Horário de descanso. Postergando mensagem para o aluno ${studentId}.`);
            this.queue.push({ studentId, message, scheduledFor: '07:00 AM' });
        } else {
            this._sendImmediate(studentId, message);
        }
    }

    private _sendImmediate(studentId: string, message: string): void {
        console.log(`[MessageScheduler] Disparando imediato para ${studentId}: ${message}`);
        // Integração com WhatsAppService...
    }

    public getPendingQueueCount(): number {
        return this.queue.length;
    }
}
