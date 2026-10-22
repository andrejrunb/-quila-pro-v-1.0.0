import { EventEmitter } from 'events';

export interface HealthLog {
  timestamp: string;
  source: string;
  level: 'info' | 'warn' | 'error' | 'fatal';
  message: string;
}

export class SystemHealthService extends EventEmitter {
  private logs: HealthLog[] = [];
  private maxLogs = 500;

  public log(source: string, level: HealthLog['level'], message: string) {
    const entry: HealthLog = {
      timestamp: new Date().toISOString(),
      source,
      level,
      message
    };
    this.logs.unshift(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.pop();
    }
    this.emit('log-added', entry);
    
    // Also mirror to console for dev visibility
    const consoleMethod = level === 'error' || level === 'fatal' ? 'error' : level === 'warn' ? 'warn' : 'log';
    console[consoleMethod](`[SystemHealth][${source}] ${message}`);
  }

  public getLogs(): HealthLog[] {
    return this.logs;
  }

  public clearLogs() {
    this.logs = [];
  }
}

export const systemHealthService = new SystemHealthService();
