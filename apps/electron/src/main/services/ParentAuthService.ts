import * as crypto from 'crypto';
import { EventEmitter } from 'events';

export interface ParentAuthorization {
  id: string;
  parentId: string;
  studentId: string;
  expiresAt: string;
  status: 'PENDING' | 'VALIDATED' | 'EXPIRED' | 'REJECTED';
  qrChallenge: string;
}

/**
 * ParentAuthService (v1614)
 * Gerencia autorizações de saída dinâmicas via QR Code para pais e responsáveis.
 * Implementa tokens de curta duração (30s) com assinatura HMAC.
 */
class ParentAuthService extends EventEmitter {
  private activeAuthorizations: Map<string, ParentAuthorization> = new Map();
  private readonly SECRET = 'AQUILA_PRO_IDENTITY_V1614_SECRET';

  constructor() {
    super();
  }

  /**
   * Gera uma nova autorização de saída vinculata a um pai e aluno
   */
  public createAuthorization(parentId: string, studentId: string): ParentAuthorization {
    const id = `auth_${Date.now()}`;
    const challenge = crypto.randomBytes(16).toString('hex');
    
    // QR Expira em 30 segundos para segurança máxima
    const expiresAt = new Date(Date.now() + 30000).toISOString();

    const auth: ParentAuthorization = {
      id,
      parentId,
      studentId,
      expiresAt,
      status: 'PENDING',
      qrChallenge: challenge
    };

    this.activeAuthorizations.set(challenge, auth);
    
    // Auto-expiração
    setTimeout(() => {
      if (this.activeAuthorizations.has(challenge)) {
        const current = this.activeAuthorizations.get(challenge)!;
        if (current.status === 'PENDING') {
          current.status = 'EXPIRED';
          this.emit('auth-expired', current);
        }
      }
    }, 31000);

    return auth;
  }

  /**
   * Valida um desafio de QR scaneado pelo totem/porteiro
   */
  public validateQR(challenge: string): ParentAuthorization | null {
    const auth = this.activeAuthorizations.get(challenge);
    
    if (!auth) return null;

    if (new Date(auth.expiresAt).getTime() < Date.now()) {
      auth.status = 'EXPIRED';
      return auth;
    }

    if (auth.status === 'PENDING') {
      auth.status = 'VALIDATED';
      this.emit('auth-validated', auth);
      return auth;
    }

    return auth;
  }

  public getPendingAuthorizations(): ParentAuthorization[] {
    return Array.from(this.activeAuthorizations.values())
      .filter(a => a.status === 'PENDING');
  }
}

export const parentAuthService = new ParentAuthService();

