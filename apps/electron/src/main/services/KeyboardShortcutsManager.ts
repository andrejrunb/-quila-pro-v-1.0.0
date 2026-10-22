/**
 * KeyboardShortcutsManager.ts — Item 39
 * Registra atalhos globais de teclado para operação sem mouse (portaria).
 * Usa Electron's globalShortcut para capturar teclas mesmo sem foco na janela.
 */

import { globalShortcut, BrowserWindow } from 'electron';

interface Shortcut {
  accelerator: string;
  description: string;
  action: string;   // Evento IPC enviado ao renderer
}

const SHORTCUTS: Shortcut[] = [
  { accelerator: 'F1', description: 'Painel Principal', action: 'navigate:dashboard' },
  { accelerator: 'F2', description: 'Monitor ao Vivo', action: 'navigate:live-monitor' },
  { accelerator: 'F3', description: 'Central de Alertas', action: 'navigate:alerts' },
  { accelerator: 'F4', description: 'Alunos', action: 'navigate:students' },
  { accelerator: 'F5', description: 'Relatórios', action: 'navigate:reports' },
  { accelerator: 'F9', description: 'Iniciar Reconhecimento', action: 'shortcut:start-recognition' },
  { accelerator: 'F10', description: 'Parar Reconhecimento', action: 'shortcut:stop-recognition' },
  { accelerator: 'F12', description: 'Fechar para Tray', action: 'shortcut:hide' },
  { accelerator: 'Ctrl+Shift+B', description: 'Fazer Backup Agora', action: 'shortcut:backup-now' },
  { accelerator: 'Ctrl+Shift+S', description: 'Forçar Sincronização', action: 'shortcut:force-sync' },
];

export class KeyboardShortcutsManager {
  private registered: string[] = [];

  register(getWindow: () => BrowserWindow | null): void {
    for (const shortcut of SHORTCUTS) {
      try {
        const ok = globalShortcut.register(shortcut.accelerator, () => {
          const win = getWindow();
          if (!win || win.isDestroyed()) return;

          if (shortcut.action === 'shortcut:hide') {
            win.hide();
          } else {
            win.webContents.send('keyboard-shortcut', { action: shortcut.action });
          }
        });

        if (ok) {
          this.registered.push(shortcut.accelerator);
        } else {
          console.warn(`[Shortcuts] Falha ao registrar: ${shortcut.accelerator}`);
        }
      } catch (err) {
        console.error(`[Shortcuts] Erro em ${shortcut.accelerator}:`, err);
      }
    }

    console.log(`[Shortcuts] ${this.registered.length}/${SHORTCUTS.length} atalhos registrados.`);
  }

  unregisterAll(): void {
    for (const acc of this.registered) {
      globalShortcut.unregister(acc);
    }
    this.registered = [];
  }

  getShortcutMap(): Shortcut[] {
    return SHORTCUTS;
  }
}

