/**
 * AuthService.ts — Item 10: Gestão de Autenticação Local
 * Lida com login, hashing de senhas (bcrypt) e tokens de sessão.
 * Garantia de segurança local sem dependência de nuvem.
 */

import * as crypto from 'crypto';
import Database from '../../database/Database';
import SessionService from './SessionService';

// Nota: Em um ambiente real, usaríamos 'bcryptjs', mas como estamos em modo nativo
// e queremos evitar dependências binárias extras agora, usaremos PBKDF2 do Node crypto.

export interface UserSession {
  token: string;
  user: {
    id: string;
    username: string;
    role: string;
    name: string;
  };
  expiresAt: number;
}
export class AuthService {
  constructor(
    private readonly db: Database,
    private readonly sessionService: SessionService
  ) {}

  // ─────────────────────────────────────────────
  // AÇÕES DE AUTH
  // ─────────────────────────────────────────────

  async login(username: string, password: string): Promise<UserSession | null> {
    console.log(`[Auth_Debug] Buscando usuário: ${username}`);
    const user = await this.db.get('SELECT * FROM users WHERE username = ?', [username]);
    if (!user) {
      console.warn(`[Auth_Debug] Usuário não encontrado: ${username}`);
      return null;
    }

    console.log(`[Auth_Debug] Usuário encontrado. Verificando senha...`);
    const isValid = this._verifyPassword(password, user.password_hash);
    if (!isValid) {
      console.warn(`[Auth_Debug] Senha incorreta para: ${username}`);
      return null;
    }

    // Criar Sessão
    const session: UserSession = {
      token: crypto.randomBytes(32).toString('hex'),
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        name: user.name
      },
      expiresAt: Date.now() + 24 * 60 * 60 * 1000 // 24h
    };

    // Salvar na tabela active_sessions
    await this.db.run(
      'INSERT INTO active_sessions (token, userId, expiresAt, data) VALUES (?, ?, ?, ?)',
      [session.token, user.id, session.expiresAt, JSON.stringify(session.user)]
    );

    // [PERSISTENCE] Salvar no SessionService (electron-store) para persistência entre restarts
    this.sessionService.createSession(user.id, user.role, true, session.token);

    await this.db.run('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?', [user.id]);

    return session;
  }

  async logout(token?: string): Promise<void> {
    const activeToken = token || this.sessionService.getSession().token;
    if (activeToken) {
      await this.db.run('DELETE FROM active_sessions WHERE token = ?', [activeToken]);
    }
    this.sessionService.clearSession();
  }

  async validateSession(token: string): Promise<UserSession | null> {
    try {
      const sessionData = await this.db.get('SELECT * FROM active_sessions WHERE token = ?', [token]);
      
      if (!sessionData) {
        console.warn(`[AuthService] Validação falhou: Token não encontrado no DB.`);
        return null;
      }

      if (Date.now() > sessionData.expiresAt) {
        console.warn(`[AuthService] Validação falhou: Sessão expirada em ${new Date(sessionData.expiresAt).toISOString()}.`);
        await this.logout(token);
        return null;
      }

      return {
        token,
        user: JSON.parse(sessionData.data),
        expiresAt: sessionData.expiresAt
      };
    } catch (e) {
      return null;
    }
  }

  /**
   * Obtém o usuário atual persistido no local store.
   * Chamado pelo App.tsx no boot inicial.
   */
  async getCurrentUser(): Promise<any | null> {
    const sessionData = this.sessionService.getSession();
    if (!sessionData || !sessionData.token) {
      return null;
    }

    const session = await this.validateSession(sessionData.token);
    if (!session) {
      return null;
    }

    return session.user;
  }

  async cleanupExpiredSessions(): Promise<void> {
    const now = Date.now();
    const result = await this.db.run('DELETE FROM active_sessions WHERE expiresAt < ?', [now]);
    if (result.changes > 0) {
      console.log(`[AuthService] Limpeza: ${result.changes} sessões expiradas removidas.`);
    }
  }

  // ─────────────────────────────────────────────
  // GESTÃO DE USUÁRIOS
  // ─────────────────────────────────────────────

  async createUser(data: { username: string; password?: string; name: string; role?: string }): Promise<void> {
    const id = `user-${Date.now()}`;
    const hash = this._hashPassword(data.password || 'eagle123'); // Senha default
    const sql = `INSERT INTO users (id, username, password_hash, name, role) VALUES (?, ?, ?, ?, ?)`;
    await this.db.run(sql, [id, data.username, hash, data.name, data.role || 'operator']);
  }

  async ensureDefaultAdmin(): Promise<void> {
    const admin = await this.db.get('SELECT * FROM users WHERE username = ?', ['admin']);
    if (!admin) {
      console.log('[AuthService] Criando usuário admin padrão...');
      await this.createUser({
        username: 'admin',
        password: process.env.INITIAL_ADMIN_PASSWORD || 'Admin@2026!',
        name: 'Administrador Áquila',
        role: 'admin'
      });
    }
  }

  async ensureTestUser(): Promise<void> {
    if (process.env.NODE_ENV === 'production') return;
    const testUser = await this.db.get('SELECT * FROM users WHERE username = ?', ['teste']);
    if (!testUser) {
      console.log('[AuthService] Criando usuário de teste...');
      await this.createUser({
        username: 'teste',
        password: 'teste',
        name: 'Usuário Teste',
        role: 'operator'
      });
    }
  }

  /**
   * Seed de usuários demo para todos os portais (sovereign design)
   */
  async seedDemoUsers(): Promise<void> {
    const demoUsers = [
      { user: 'rh_demo', pass: 'demo123', name: 'Gestor de RH Demo', role: 'rh' },
      { user: 'coord_demo', pass: 'demo123', name: 'Coordenação Demo', role: 'coordenacao' },
      { user: 'profe_demo', pass: 'demo123', name: 'Docente Demo', role: 'docente' },
      { user: 'pais_demo', pass: 'demo123', name: 'Portal de Pais Demo', role: 'pais' },
    ];

    for (const d of demoUsers) {
      const existing = await this.db.get('SELECT id FROM users WHERE username = ?', [d.user]);
      if (!existing) {
        console.log(`[AuthService] Seeding demo user: ${d.user}`);
        await this.createUser({
          username: d.user,
          password: d.pass,
          name: d.name,
          role: d.role
        });
      }
    }
  }

  // ─────────────────────────────────────────────
  // INTERNOS (Crypto Mod v2.0 - Bcrypt)
  // ─────────────────────────────────────────────

  private _hashPassword(password: string): string {
    // [SQA-SEC-993] Next-Gen Hashing: Scrypt (Memory-Hard)
    // Usando scrypt como alternativa ao Argon2 (que exige compilação nativa instável em alguns ambientes)
    // Parâmetros: N=16384 (custo CPU/memória), r=8 (tamanho bloco), p=1 (paralelismo)
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.scryptSync(password, salt, 64, { N: 16384, r: 8, p: 1 }).toString('hex');
    return `scrypt$16384$8$1$${salt}$${hash}`;
  }

  private _verifyPassword(password: string, storedHash: string): boolean {
    try {
      // 1. Verificar se é o novo padrão Scrypt
      if (storedHash.startsWith('scrypt$')) {
        const [, sN, sr, sp, salt, hash] = storedHash.split('$');
        const N = parseInt(sN);
        const r = parseInt(sr);
        const p = parseInt(sp);
        const verifyHash = crypto.scryptSync(password, salt, 64, { N, r, p }).toString('hex');
        return hash === verifyHash;
      }

      // 2. Tentar Bcrypt (Padrão anterior)
      const bcrypt = require('bcryptjs');
      if (storedHash.startsWith('$2a$') || storedHash.startsWith('$2b$')) {
        return bcrypt.compareSync(password, storedHash);
      }
      
      // 3. Fallback para Vault legado (PBKDF2 ou SHA-based)
      if (storedHash.includes(':')) {
        const parts = storedHash.split(':');
        if (parts.length === 3) {
          const [salt, iterations, hash] = parts;
          const verifyHash = crypto.pbkdf2Sync(password, salt, parseInt(iterations), 64, 'sha512').toString('hex');
          return hash === verifyHash; 
        } else if (parts.length === 2) {
          const [salt, hash] = parts;
          const verifyHash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
          return hash === verifyHash;
        }
      }

      // 4. Último suspiro: tentativa direta (não recomendado, mas para compatibilidade extrema em devs)
      return bcrypt.compareSync(password, storedHash);
    } catch (e: any) {
      console.error('[Auth_Debug] Erro ao verificar senha:', e.message);
      return false;
    }
  }
}

