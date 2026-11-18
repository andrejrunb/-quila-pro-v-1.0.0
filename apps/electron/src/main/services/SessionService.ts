import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { v4 as uuidv4 } from 'uuid';
import { securityWatchdogService } from './SecurityWatchdogService';

interface SessionData {
  token: string | null;
  userId: string | null;
  role: string | null;
  expiresAt: number | null;
}

export default class SessionService {
  private storePath: string;
  private data: Record<string, any>;
  private currentSession: SessionData;

  constructor() {
    let userDataDir = os.tmpdir();
    try {
      const { app } = require('electron');
      if (app?.getPath) {
        userDataDir = app.getPath('userData');
      }
    } catch {}

    this.storePath = path.join(userDataDir, 'session.json');
    this.data = this.readStoreFile();
    this.currentSession = (this.data['session_info'] as SessionData) || {
      token: null,
      userId: null,
      role: null,
      expiresAt: null
    };
  }

  private readStoreFile(): Record<string, any> {
    try {
      if (fs.existsSync(this.storePath)) {
        const parsed = JSON.parse(fs.readFileSync(this.storePath, 'utf-8'));
        return parsed && typeof parsed === 'object' ? parsed : {};
      }
    } catch {}
    return {};
  }

  private writeStoreFile(): void {
    try {
      fs.mkdirSync(path.dirname(this.storePath), { recursive: true });
      fs.writeFileSync(this.storePath, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch {}
  }

  public createSession(userId: string, role: string, rememberMe = true, existingToken?: string): string {
    const token = existingToken || uuidv4();
    const expiresAt = rememberMe ? Date.now() + 30 * 24 * 60 * 60 * 1000 : Date.now() + 2 * 60 * 60 * 1000;
    
    this.currentSession = { token, userId, role, expiresAt };
    
    if (rememberMe) {
      this.set('session_info', this.currentSession);
    }

    // Registrar no Watchdog do Enxame
    securityWatchdogService.registerLocalLogin(userId, 'desktop');
    
    return token;
  }

  public validateSession(token: string): boolean {
    if (!this.currentSession.token || this.currentSession.token !== token) return false;
    if (this.currentSession.expiresAt && Date.now() > this.currentSession.expiresAt) {
      this.clearSession();
      return false;
    }
    return true;
  }

  public getSession(): SessionData {
    return this.currentSession;
  }

  public set(key: string, value: any): void {
    this.data[key] = value;
    this.writeStoreFile();
  }

  public get(key: string): any {
    return this.data[key];
  }

  public delete(key: string): void {
    delete this.data[key];
    this.writeStoreFile();
  }

  public clearSession(): void {
    this.currentSession = { token: null, userId: null, role: null, expiresAt: null };
    this.delete('session_info');
    this.delete('current_session');
  }
}

