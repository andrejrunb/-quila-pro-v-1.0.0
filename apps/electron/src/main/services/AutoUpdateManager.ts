/**
 * AutoUpdateManager.ts — Item 30 / Phase 7
 * Gerencia atualizações automáticas usando electron-updater.
 * Suporta download em segundo plano e instalação ao fechar.
 */

import { autoUpdater } from 'electron-updater';
import { dialog, app, BrowserWindow } from 'electron';
import { Logger } from './Logger';

export class AutoUpdateManager {
  private logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
    this._setupHandlers();
  }

  /**
   * Inicia a verificação de atualizações.
   */
  start(): void {
    if (app.isPackaged) {
      this.logger.info('[AutoUpdate] Iniciando verificação automática...');
      autoUpdater.checkForUpdatesAndNotify();
      
      // Verificar a cada 4 horas
      setInterval(() => {
        autoUpdater.checkForUpdates();
      }, 4 * 60 * 60 * 1000);
    } else {
      this.logger.info('[AutoUpdate] Modo desenvolvimento: Auto-update desativado.');
    }
  }

  private _setupHandlers(): void {
    autoUpdater.on('checking-for-update', () => {
      this.logger.info('[AutoUpdate] Verificando novas versões...');
    });

    autoUpdater.on('update-available', (info) => {
      this.logger.info(`[AutoUpdate] Atualização disponível: ${info.version}. Iniciando download...`);
      // Opcional: Notificar renderer que o download começou
      this._broadcastToWindows('update-available', info);
    });

    autoUpdater.on('update-not-available', () => {
      this.logger.info('[AutoUpdate] Nenhuma atualização encontrada.');
    });

    autoUpdater.on('error', (err) => {
      this.logger.error(`[AutoUpdate] Erro na atualização: ${err.message}`);
    });

    autoUpdater.on('download-progress', (progressObj) => {
      let logMsg = `[AutoUpdate] Download: ${progressObj.percent.toFixed(2)}%`;
      this.logger.info(logMsg);
    });

    autoUpdater.on('update-downloaded', (info) => {
      this.logger.info(`[AutoUpdate] Atualização ${info.version} baixada e pronta.`);
      
      // Notificar o renderer para mostrar o botão "Reiniciar para Atualizar"
      this._broadcastToWindows('update-downloaded', info);

      // Mostrar um diálogo de confirmação imediata (Opcional, melhor deixar no UI)
      /*
      dialog.showMessageBox({
        type: 'info',
        title: '🦅 Atualização Pronta',
        message: 'Uma nova versão foi baixada. Deseja reiniciar agora para aplicar?',
        buttons: ['Reiniciar Agora', 'Depois'],
      }).then((result) => {
        if (result.response === 0) {
          autoUpdater.quitAndInstall();
        }
      });
      */
    });
  }

  private _broadcastToWindows(channel: string, data: any): void {
    const windows = BrowserWindow.getAllWindows();
    windows.forEach(win => {
      win.webContents.send(channel, data);
    });
  }

  public installUpdate(): void {
    this.logger.info('[AutoUpdate] Executando quitAndInstall...');
    autoUpdater.quitAndInstall();
  }
}

