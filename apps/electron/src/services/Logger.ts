import * as fs from 'fs';
import * as path from 'path';
import { EventEmitter } from 'events';

/**
 * Interface para log
 */
export interface LogEntry {
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  data?: any;
  timestamp: Date;
  source?: string;
}

/**
 * Logger centralizado com suporte a arquivo e console
 */
export class Logger extends EventEmitter {
  private logDir: string;
  private currentLogFile: string;
  private maxFileSize: number = 10 * 1024 * 1024; // 10 MB
  private maxFiles: number = 5;

  constructor(logDir: string = './logs') {
    super();
    this.logDir = logDir;
    this.currentLogFile = path.join(logDir, `app-${this.getDateString()}.log`);

    // Criar diretório de logs se não existir
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
  }

  /**
   * Log de debug
   */
  debug(message: string, data?: any, source?: string): void {
    this.log('debug', message, data, source);
  }

  /**
   * Log de info
   */
  info(message: string, data?: any, source?: string): void {
    this.log('info', message, data, source);
  }

  /**
   * Log de warning
   */
  warn(message: string, data?: any, source?: string): void {
    this.log('warn', message, data, source);
  }

  /**
   * Log de erro
   */
  error(message: string, data?: any, source?: string): void {
    this.log('error', message, data, source);
  }

  /**
   * Redige dados sensíveis (biometria/IDs) conforme Passo 01 do Roadmap.
   */
  private redact(data: any): any {
    if (!data) return data;
    if (typeof data !== 'object') return data;

    const sensitiveKeys = ['vector', 'biometry', 'face_vector', 'password', 'token', 'student_id'];
    const redacted = { ...data };

    for (const key of Object.keys(redacted)) {
      if (sensitiveKeys.includes(key.toLowerCase())) {
        redacted[key] = '[REDACTED_FOR_PRIVACY]';
      } else if (typeof redacted[key] === 'object') {
        redacted[key] = this.redact(redacted[key]);
      }
    }
    return redacted;
  }

  /**
   * Log genérico
   */
  private log(level: string, message: string, data?: any, source?: string): void {
    const redactedData = this.redact(data);
    const entry: LogEntry = {
      level: level as any,
      message,
      data: redactedData,
      timestamp: new Date(),
      source,
    };

    // Exibir no console
    this.logToConsole(entry);

    // Salvar em arquivo
    this.logToFile(entry);

    // Emitir evento
    this.emit('log', entry);
  }

  /**
   * Exibe log no console
   */
  private logToConsole(entry: LogEntry): void {
    const timestamp = entry.timestamp.toISOString();
    const source = entry.source ? `[${entry.source}]` : '';
    const prefix = `${timestamp} ${entry.level.toUpperCase()} ${source}`;

    const message = entry.data ? `${entry.message} ${JSON.stringify(entry.data)}` : entry.message;

    switch (entry.level) {
      case 'debug':
        console.debug(`${prefix} ${message}`);
        break;
      case 'info':
        console.info(`${prefix} ${message}`);
        break;
      case 'warn':
        console.warn(`${prefix} ${message}`);
        break;
      case 'error':
        console.error(`${prefix} ${message}`);
        break;
    }
  }

  /**
   * Salva log em arquivo
   */
  private logToFile(entry: LogEntry): void {
    try {
      // Verificar se arquivo precisa ser rotacionado
      if (fs.existsSync(this.currentLogFile)) {
        const stats = fs.statSync(this.currentLogFile);
        if (stats.size > this.maxFileSize) {
          this.rotateLogFiles();
        }
      }

      const timestamp = entry.timestamp.toISOString();
      const source = entry.source ? `[${entry.source}]` : '';
      const data = entry.data ? ` ${JSON.stringify(entry.data)}` : '';
      const line = `${timestamp} ${entry.level.toUpperCase()} ${source} ${entry.message}${data}\
`;

      fs.appendFileSync(this.currentLogFile, line);
    } catch (error) {
      console.error('Erro ao salvar log em arquivo:', error);
    }
  }

  /**
   * Rotaciona arquivos de log
   */
  private rotateLogFiles(): void {
    try {
      const files = fs.readdirSync(this.logDir)
        .filter(f => f.startsWith('app-') && f.endsWith('.log'))
        .sort()
        .reverse();

      // Remover arquivos antigos se exceder limite
      if (files.length >= this.maxFiles) {
        for (let i = this.maxFiles - 1; i < files.length; i++) {
          fs.unlinkSync(path.join(this.logDir, files[i]));
        }
      }

      // Criar novo arquivo
      this.currentLogFile = path.join(this.logDir, `app-${this.getDateString()}.log`);
      console.log(`Log rotacionado: ${this.currentLogFile}`);
    } catch (error) {
      console.error('Erro ao rotacionar logs:', error);
    }
  }

  /**
   * Obtém string de data para nome de arquivo
   */
  private getDateString(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Obtém logs de um período
   */
  getLogsByPeriod(startDate: Date, endDate: Date): LogEntry[] {
    const logs: LogEntry[] = [];

    try {
      const files = fs.readdirSync(this.logDir)
        .filter(f => f.startsWith('app-') && f.endsWith('.log'));

      for (const file of files) {
        const content = fs.readFileSync(path.join(this.logDir, file), 'utf-8');
        const lines = content.split('\
').filter(l => l.trim());

        for (const line of lines) {
          try {
            const match = line.match(/^(\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}\\.\\d{3}Z) (\\w+) (.*)$/);
            if (match) {
              const timestamp = new Date(match[1]);
              if (timestamp >= startDate && timestamp <= endDate) {
                logs.push({
                  level: match[2].toLowerCase() as any,
                  message: match[3],
                  timestamp,
                });
              }
            }
          } catch (error) {
            // Ignorar linhas malformadas
          }
        }
      }
    } catch (error) {
      console.error('Erro ao obter logs:', error);
    }

    return logs.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  /**
   * Limpa logs antigos
   */
  clearOldLogs(daysOld: number = 30): number {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const files = fs.readdirSync(this.logDir)
        .filter(f => f.startsWith('app-') && f.endsWith('.log'));

      let deletedCount = 0;

      for (const file of files) {
        const filePath = path.join(this.logDir, file);
        const stat = fs.statSync(filePath);

        if (stat.mtime < cutoffDate) {
          fs.unlinkSync(filePath);
          deletedCount++;
        }
      }

      console.log(`${deletedCount} arquivos de log antigos removidos`);
      return deletedCount;
    } catch (error) {
      console.error('Erro ao limpar logs:', error);
      return 0;
    }
  }

  /**
   * Obtém informações sobre logs
   */
  getLogInfo() {
    try {
      const files = fs.readdirSync(this.logDir)
        .filter(f => f.startsWith('app-') && f.endsWith('.log'));

      let totalSize = 0;
      const fileInfo: any[] = [];

      for (const file of files) {
        const filePath = path.join(this.logDir, file);
        const stat = fs.statSync(filePath);
        totalSize += stat.size;

        fileInfo.push({
          name: file,
          size: stat.size,
          created: stat.birthtime,
          modified: stat.mtime,
        });
      }

      return {
        logDir: this.logDir,
        totalFiles: files.length,
        totalSize,
        files: fileInfo,
      };
    } catch (error) {
      console.error('Erro ao obter informações de logs:', error);
      return null;
    }
  }
}

export default Logger;

