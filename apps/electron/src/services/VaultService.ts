import { logger } from '../main/logger';

/**
 * VaultService - Camada 0 SQA-1000 (SEC-801)
 * Gestão de segredos em runtime com proteção de memória.
 */
export class VaultService {
  private static instance: VaultService;
  private secrets: Map<string, string> = new Map();
  private isSealed: boolean = true;

  private constructor() {}

  public static getInstance(): VaultService {
    if (!VaultService.instance) {
      VaultService.instance = new VaultService();
    }
    return VaultService.instance;
  }

  /**
   * [SQA-SEC-801] Abre o cofre usando uma chave mestre (simulada).
   */
  public unseal(masterKey: string): void {
    if (masterKey === 'SOVEREIGN_KEY_2026') {
      this.isSealed = false;
      logger.info('[Vault] Cofre deslacrado com sucesso.');
    }
  }

  /**
   * Recupera um segredo se o cofre estiver aberto.
   */
  public getSecret(key: string): string | null {
    if (this.isSealed) {
      logger.error('[Vault] Tentativa de acesso a um cofre lacrado.');
      return null;
    }
    return this.secrets.get(key) || null;
  }

  public setSecret(key: string, value: string): void {
    this.secrets.set(key, value);
  }

  /**
   * [SQA-SEC-801] Lacra o cofre e limpa os segredos da memória.
   */
  public seal(): void {
    this.secrets.clear();
    this.isSealed = true;
    logger.info('[Vault] Cofre lacrado. Segredos purgados da memória.');
  }
}

export const vaultService = VaultService.getInstance();
