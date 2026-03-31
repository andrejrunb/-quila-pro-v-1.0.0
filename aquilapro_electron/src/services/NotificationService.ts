/**
 * NotificationService.ts — Passo 76 do Roadmap.
 * Aciona notificações nativas do sistema operacional (Desktop Push).
 * Garante que alertas críticos (ex: Invasão, Sala Errada) sejam vistos imediatamente.
 */
export class NotificationService {
    
    public static async notify(title: string, body: string, icon?: string): Promise<void> {
        if (!('Notification' in window)) {
            console.warn('[NotificationService] Notificações não suportadas pelo navegador/electron.');
            return;
        }

        if (Notification.permission === 'granted') {
            this._show(title, body, icon);
        } else if (Notification.permission !== 'denied') {
            const permission = await Notification.requestPermission();
            if (permission === 'granted') {
                this._show(title, body, icon);
            }
        }
    }

    private static _show(title: string, body: string, icon?: string): void {
        const n = new Notification(title, {
            body,
            icon: icon || 'assets/icons/alert-icon.png',
            silent: false
        });

        n.onclick = () => {
            console.log('[NotificationService] Usuário clicou na notificação.');
            window.focus();
        };
    }
}
