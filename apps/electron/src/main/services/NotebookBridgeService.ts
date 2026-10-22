import { spawn, ChildProcess } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import { app, BrowserWindow, session } from 'electron';
import { logger } from '../logger';

/**
 * NotebookBridgeService (v1.5.0-AI)
 * Gerencia o 'Project Brain' (Cérebro do Projeto) via NotebookLM.
 * Permite que o sistema aprenda com seu próprio código e responda dúvidas arquiteturais.
 */
export class NotebookBridgeService {
  private static instance: NotebookBridgeService;
  private worker: ChildProcess | null = null;
  private pythonPath: string = 'python'; 
  private notebookId: string | null = null;

  private constructor() {
    // [CLEANUP] IPC handlers migrated to centralized registry in ipc/handlers.ts
  }

  public static getInstance(): NotebookBridgeService {
    if (!NotebookBridgeService.instance) {
      NotebookBridgeService.instance = new NotebookBridgeService();
    }
    return NotebookBridgeService.instance;
  }

  /**
   * Inicializa o worker e o caderno de projeto
   */
  public async initialize() {
    const workerPath = path.join(app.getAppPath(), 'dist', 'python_workers', 'notebook_worker.py');
    const cookiePath = path.join(process.cwd(), 'notebook_cookies.json');

    if (!fs.existsSync(cookiePath)) {
      logger.warn('[NotebookBridge] Autenticação necessária. Cérebro em standby.');
      return;
    }
    
    this.worker = spawn(this.pythonPath, [workerPath]);

    this.worker.stdout?.on('data', (data) => {
      try {
        const response = JSON.parse(data.toString());
        if (response.id) this.notebookId = response.id;
        logger.info(`[NotebookBridge] AI Worker: ${JSON.stringify(response)}`);
      } catch (e) {
        // Ignorar dados parciais
      }
    });

    this.worker.stderr?.on('data', (data) => {
      logger.error(`[NotebookBridge] AI Worker Error: ${data.toString()}`);
    });

    this.sendToWorker({ action: 'init' });
  }

  /**
   * Abre uma janela para o usuário realizar o login no Google/NotebookLM
   */
  public openLoginWindow() {
    const loginWin = new BrowserWindow({
      width: 1000,
      height: 800,
      title: 'Áquila Pro - NotebookLM Login',
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true
      }
    });

    loginWin.loadURL('https://notebooklm.google.com/');

    loginWin.on('close', async () => {
      logger.info('[NotebookBridge] Janela de login fechada. Capturando cookies...');
      
      const cookies = await session.defaultSession.cookies.get({ domain: '.google.com' });
      
      // Mapear para o formato que o notebooklm-py espera (lista de dicts)
      const formattedCookies = cookies.map(c => ({
        name: c.name,
        value: c.value,
        domain: c.domain,
        path: c.path,
        secure: c.secure,
        httpOnly: c.httpOnly,
        expirationDate: c.expirationDate
      }));

      this.saveAuthCookies(formattedCookies);
    });
  }

  /**
   * Salva os cookies capturados via WebView do Google
   */
  public saveAuthCookies(cookies: any[]) {
    const cookiePath = path.join(process.cwd(), 'notebook_cookies.json');
    fs.writeFileSync(cookiePath, JSON.stringify(cookies, null, 2));
    logger.info('[NotebookBridge] Cookies de autenticação salvos. Inicializando cérebro...');
    this.initialize();
  }

  /**
   * Realiza uma pergunta ao Cérebro do Projeto
   */
  public async ask(params: string | { question: string, context?: string }): Promise<string> {
    if (!this.notebookId || !this.worker) return 'Cérebro não inicializado. Verifique a autenticação.';
    
    const query = typeof params === 'string' ? params : params.question;
    // O contexto pode ser injetado na query para o modelo (v1.5.1)
    const finalQuery = typeof params !== 'string' && params.context 
      ? `Contexto: ${params.context}\n\nPergunta: ${query}` 
      : query;

    return new Promise((resolve) => {
      const askHandler = (data: any) => {
        try {
          const response = JSON.parse(data.toString());
          if (response.status === 'answered') {
            this.worker?.stdout?.removeListener('data', askHandler);
            resolve(response.answer);
          }
        } catch (e) { }
      };

      this.worker?.stdout?.on('data', askHandler);
      this.sendToWorker({ action: 'ask', notebook_id: this.notebookId, query: finalQuery });
    });
  }

  /**
   * Sincroniza arquivos do projeto com o NotebookLM
   */
  public async syncFiles(filePaths: string[]) {
    if (!this.notebookId) return;

    logger.info(`[NotebookBridge] Sincronizando ${filePaths.length} arquivos com o NotebookLM...`);
    for (const filePath of filePaths) {
      if (fs.existsSync(filePath)) {
        this.sendToWorker({ 
          action: 'upload', 
          notebook_id: this.notebookId, 
          file_path: filePath 
        });
      }
    }
  }

  private sendToWorker(command: any) {
    if (this.worker && this.worker.stdin) {
      this.worker.stdin.write(JSON.stringify(command) + '\n');
    }
  }



  /**
   * Utilitário para coletar arquivos por extensão (v1.5.1)
   */
  private getFilesFromDir(dir: string, extensions: string[]): string[] {
    if (!fs.existsSync(dir)) return [];
    const files: string[] = [];
    const items = fs.readdirSync(dir, { withFileTypes: true });

    for (const item of items) {
      const fullPath = path.join(dir, item.name);
      if (item.isDirectory()) {
        files.push(...this.getFilesFromDir(fullPath, extensions));
      } else if (extensions.includes(path.extname(item.name))) {
        files.push(fullPath);
      }
    }
    return files;
  }
}

export const notebookBridgeService = NotebookBridgeService.getInstance();
