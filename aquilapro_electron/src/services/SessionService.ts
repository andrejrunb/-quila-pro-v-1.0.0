import Store from 'electron-store';
import { v4 as uuidv4 } from 'uuid';

interface SessionData {
  token: string | null;
  userId: string | null;
  role: string | null;
  expiresAt: number | null;
}

export default class SessionService {
  private store: Store;
  private currentSession: SessionData;

  constructor() {
    this.store = new Store({ name: 'session' });
    this.currentSession = this.store.get('session_info') as SessionData || {
      token: null,
      userId: null,
      role: null,
      expiresAt: null
    };
  }

  public createSession(userId: string, role: string, rememberMe = true): string {
    const token = uuidv4();
    const expiresAt = rememberMe ? Date.now() + 30 * 24 * 60 * 60 * 1000 : Date.now() + 2 * 60 * 60 * 1000;
    
    this.currentSession = { token, userId, role, expiresAt };
    
    if (rememberMe) {
      this.store.set('session_info', this.currentSession);
    }
    
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
    this.store.set(key, value);
  }

  public get(key: string): any {
    return this.store.get(key);
  }

  public delete(key: string): void {
    this.store.delete(key);
  }

  public clearSession(): void {
    this.currentSession = { token: null, userId: null, role: null, expiresAt: null };
    this.store.delete('session_info');
    this.store.delete('current_session');
  }
}
