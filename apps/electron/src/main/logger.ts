import * as path from 'path';
import * as fs from 'fs';
import { app } from 'electron';
import { Logger } from './services/Logger';

/**
 * [SQA-BOOT-001] Helper para resolver o path de userData de forma resiliente.
 * Evita o travamento durante o boot do Playwright se chamado muito cedo.
 */
function getSafeUserDataPath() {
  try {
    // Tenta obter o path oficial do Electron
    if (app && app.isReady()) {
      return app.getPath('userData');
    }
    
    // Fallback para variáveis de ambiente ou CLI (Importante para o override no Main)
    const override = process.argv.find(arg => arg.startsWith('--user-data-dir='))?.split('=')[1] || process.env.AQUILA_USER_DATA_OVERRIDE;
    if (override) return override;

    // Se o app não estiver pronto e não houver override, tenta obter mesmo assim
    // Alguns caminhos são acessíveis antes do ready
    return app.getPath('userData');
  } catch (e) {
    // Fallback absoluto para evitar crash no import
    return path.join(process.cwd(), 'userData');
  }
}

let underlyingLogger: Logger | null = null;

/**
 * [SQA-BOOT-002] Inicialização preguiçosa do Logger.
 * Garante que diretórios não sejam criados antes do override de userData no main.ts.
 */
function getLogger(): Logger {
  if (!underlyingLogger) {
    const userDataPath = getSafeUserDataPath();
    const logsPath = path.join(userDataPath, 'logs');
    
    if (!fs.existsSync(logsPath)) {
      try {
        fs.mkdirSync(logsPath, { recursive: true });
      } catch (e) {
        console.error(`[BOOT] Falha crítica ao criar diretório de logs: ${e}`);
      }
    }
    
    underlyingLogger = new Logger(logsPath);
    console.log(`[Áquila Pro] Logger persistente inicializado em: ${logsPath}`);
  }
  return underlyingLogger;
}

// Exportamos um Proxy para manter a compatibilidade com todos os arquivos que importam 'logger'
export const logger = new Proxy({} as Logger, {
  get: (target, prop, receiver) => {
    const instance = getLogger();
    const value = Reflect.get(instance, prop, receiver);
    if (typeof value === 'function') {
      return value.bind(instance);
    }
    return value;
  }
});
