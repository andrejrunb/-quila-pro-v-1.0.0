import { app, Menu, Tray, nativeImage, Notification, dialog, shell, BrowserWindow } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';

let tray: Tray | null = null;

export interface DesktopUIConfig {
  mainWindow: BrowserWindow | null;
  backupManager: any;
  APP_NAME: string;
  APP_VERSION: string;
  IS_DEV: boolean;
  onQuit: () => void;
}

export function getAppIcon(IS_DEV: boolean): Electron.NativeImage {
  const iconPath = IS_DEV
    ? path.join(__dirname, '../../resources/icon.png')
    : path.join(process.resourcesPath, 'resources/icon.png');

  if (fs.existsSync(iconPath)) {
    return nativeImage.createFromPath(iconPath);
  }
  return nativeImage.createFromPath('');
}

export function showTrayNotification(title: string, body: string, IS_DEV: boolean) {
  if (Notification.isSupported()) {
    new Notification({ title, body, icon: getAppIcon(IS_DEV) }).show();
  }
}

export function initDesktopUI(config: DesktopUIConfig) {
  const { mainWindow, backupManager, APP_NAME, APP_VERSION, IS_DEV, onQuit } = config;

  // MENU
  const template: Electron.MenuItemConstructorOptions[] = [
    {
      label: 'Arquivo',
      submenu: [
        {
          label: 'Fazer Backup',
          accelerator: 'CmdOrCtrl+B',
          click: async () => {
            await backupManager.backupNow();
            dialog.showMessageBox(mainWindow!, { type: 'info', title: 'Backup', message: 'Backup realizado com sucesso!' });
          },
        },
        { type: 'separator' },
        {
          label: 'Configurações',
          accelerator: 'CmdOrCtrl+,',
          click: () => mainWindow?.webContents.send('navigate', '/settings'),
        },
        { type: 'separator' },
        { label: 'Sair', accelerator: 'CmdOrCtrl+Q', click: onQuit },
      ],
    },
    {
      label: 'Editar',
      submenu: [
        { role: 'undo', label: 'Desfazer' },
        { role: 'redo', label: 'Refazer' },
        { type: 'separator' },
        { role: 'cut', label: 'Recortar' },
        { role: 'copy', label: 'Copiar' },
        { role: 'paste', label: 'Colar' },
        { role: 'selectAll', label: 'Selecionar Tudo' },
      ],
    },
    {
      label: 'Exibir',
      submenu: [
        { role: 'reload', label: 'Recarregar' },
        { role: 'forceReload', label: 'Forçar Recarregamento' },
        { type: 'separator' },
        { role: 'resetZoom', label: 'Zoom Padrão' },
        { role: 'zoomIn', label: 'Aumentar Zoom' },
        { role: 'zoomOut', label: 'Diminuir Zoom' },
        { type: 'separator' },
        { role: 'togglefullscreen', label: 'Tela Cheia' },
        ...(IS_DEV ? [{ role: 'toggleDevTools' as const, label: 'DevTools' }] : []),
      ],
    },
    {
      label: 'Navegação',
      submenu: [
        { label: 'Dashboard', click: () => mainWindow?.webContents.send('navigate', 'dashboard') },
        { label: 'Câmeras', click: () => mainWindow?.webContents.send('navigate', 'cameras') },
        { label: 'Alunos', click: () => mainWindow?.webContents.send('navigate', 'students') },
        { label: 'Relatórios', click: () => mainWindow?.webContents.send('navigate', 'reports') },
        { label: 'Alertas', click: () => mainWindow?.webContents.send('navigate', 'alerts') },
        { label: 'Configurações', click: () => mainWindow?.webContents.send('navigate', 'settings') },
      ],
    },
    {
      label: 'Ajuda',
      submenu: [
        { label: 'Documentação', click: () => shell.openExternal('https://docs.aquilapro.com.br') },
        { label: 'Suporte', click: () => shell.openExternal('https://wa.me/5561999623099') },
        { type: 'separator' },
        {
          label: 'Verificar Atualizações',
          click: async () => {
            dialog.showMessageBox(mainWindow!, { type: 'info', title: 'Atualizações', message: `Versão atual: ${APP_VERSION}`, detail: 'Verificando atualizações...' });
          },
        },
        { type: 'separator' },
        {
          label: `Sobre ${APP_NAME}`,
          click: () => {
            dialog.showMessageBox(mainWindow!, {
              type: 'info',
              title: `Sobre ${APP_NAME}`,
              message: `${APP_NAME} v${APP_VERSION}`,
              detail: `Sistema de Segurança e Engajamento Escolar\n\nPlataforma: ${os.platform()} ${os.arch()}\nNode.js: ${process.versions.node}\nElectron: ${process.versions.electron}\nChrome: ${process.versions.chrome}\n\n© 2026 André Jr - Todos os direitos reservados\nWhatsApp: +55 (61) 99962-3099`,
            });
          },
        },
      ],
    },
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));

  // TRAY
  tray = new Tray(getAppIcon(IS_DEV));
  tray.setToolTip(`${APP_NAME} v${APP_VERSION}`);

  const contextMenu = Menu.buildFromTemplate([
    { label: 'Abrir Áquila Pro', click: () => { mainWindow?.show(); mainWindow?.focus(); } },
    { type: 'separator' },
    { label: 'Status do Sistema', click: () => { mainWindow?.show(); mainWindow?.webContents.send('navigate', 'dashboard'); } },
    { label: 'Câmeras', click: () => { mainWindow?.show(); mainWindow?.webContents.send('navigate', 'cameras'); } },
    { label: 'Alertas', click: () => { mainWindow?.show(); mainWindow?.webContents.send('navigate', 'alerts'); } },
    { type: 'separator' },
    {
      label: 'Fazer Backup Agora',
      click: async () => {
        try {
          await backupManager.backupNow();
          showTrayNotification('Backup Concluído', 'O backup foi realizado com sucesso.', IS_DEV);
        } catch (error) {
          showTrayNotification('Erro no Backup', 'Falha ao realizar backup.', IS_DEV);
        }
      },
    },
    { type: 'separator' },
    { label: `Versão ${APP_VERSION}`, enabled: false },
    { label: 'Sair', click: onQuit },
  ]);

  tray.setContextMenu(contextMenu);
  tray.on('double-click', () => { mainWindow?.show(); mainWindow?.focus(); });

  return tray;
}
