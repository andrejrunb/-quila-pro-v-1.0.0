import { logger } from '../logger';
import { shell } from 'electron';
import * as crypto from 'crypto';

export interface GoogleSession {
  email: string;
  accessToken: string;
  refreshToken?: string;
  expiresAt: number;
}

/**
 * GoogleAuthService (v3460)
 * O pilar do 'Custo Zero' para a escola.
 */
export class GoogleAuthService {
  private currentSession: GoogleSession | null = null;

  /**
   * Inicia o fluxo de autorização OAuth2.
   * Abre o navegador para o usuário logar com sua conta pessoal.
   */
  public async initiateLogin(): Promise<void> {
    logger.info(`[Google] Iniciando fluxo de autorização para o usuário.`);
    
    // URL Mockada para o fluxo OAuth2 Real (Necessário ClientID do Google Console)
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=YOUR_CLIENT_ID&response_type=code&scope=https://www.googleapis.com/auth/generative-language&redirect_uri=http://localhost:3000/callback`;

    await shell.openExternal(authUrl);
  }

  /**
   * Salva a sessão após o callback do navegador.
   */
  public saveSession(session: GoogleSession) {
    this.currentSession = session;
    logger.info(`[Google] Conta vinculada com sucesso: ${session.email}`);
  }

  /**
   * Verifica se o usuário tem créditos de nuvem ativos.
   */
  public hasActiveCloudCredits(): boolean {
    if (!this.currentSession) return false;
    return Date.now() < this.currentSession.expiresAt;
  }

  /**
   * Retorna o Token para uso no EducationalAIIntegration.
   */
  public getCloudToken(): string | null {
    return this.currentSession?.accessToken || null;
  }

  /**
   * Desconecta a conta e volta para o modo 'Local-Only'.
   */
  public decoupleAccount() {
    this.currentSession = null;
    logger.info(`[Google] Conta Google desconectada. Modo Soberano Local ativado.`);
  }
}

export const googleAuthService = new GoogleAuthService();

