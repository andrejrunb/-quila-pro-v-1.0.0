/**
 * NotificationService.ts — Passo 76 do Roadmap.
 * Aciona notificações nativas do sistema operacional (Desktop Push).
 * Garante que alertas críticos (ex: Invasão, Sala Errada) sejam vistos imediatamente.
 */
export class NotificationService {
    
    public static async notify(title: string, body: string, icon?: string): Promise<void> {
        const isRenderer = typeof window !== 'undefined';

        if (!isRenderer) {
            console.log('[NotificationService] Running in Main Process. Using Electron Native Notification.');
            try {
              // No Main process do Electron, usamos o módulo 'electron'
              const { Notification } = require('electron');
              if (Notification.isSupported()) {
                const n = new Notification({
                  title,
                  body,
                  icon: icon || 'assets/icons/alert-icon.png',
                  silent: false
                });
                n.show();
              }
            } catch (e) {
              console.error('[NotificationService] Failed to show native notification:', e);
            }
            return;
        }

        // Renderer Logic (Browser Notification API)
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
            if (typeof window !== 'undefined') {
                window.focus();
            }
        };
    }
}
