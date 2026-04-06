import { Database } from '../database/Database';
import { logger } from '../main/logger';

export interface LicenseInfo {
  id: string;
  key: string;
  type: 'standard' | 'premium' | 'enterprise';
  maxStudents: number;
  maxCameras: number;
  clientName: string;
  feature_flags: Record<string, boolean>;
  status: string;
  expiresAt?: string;
}

class LicenseService {
  private currentLicense: LicenseInfo | null = null;
  private db: Database;

  constructor() {
    this.db = Database.getInstance();
  }

  /**
   * Inicializa o serviço carregando a licença ativa do banco.
   */
  async initialize(): Promise<void> {
    try {
      const license = await this.db.get(`
        SELECT * FROM licenses 
        WHERE status = 'active' 
        ORDER BY expiresAt DESC LIMIT 1
      `);

      if (license) {
        let flags = {};
        try {
          flags = typeof license.feature_flags === 'string' 
            ? JSON.parse(license.feature_flags) 
            : license.feature_flags || {};
        } catch (e) {
          logger.error(`[LicenseService] Erro ao parsear feature_flags: ${e}`);
        }

        this.currentLicense = {
          ...license,
          feature_flags: flags
        };
        
        logger.info(`[LicenseService] Licença ativa detectada: ${this.currentLicense?.type.toUpperCase()} para ${this.currentLicense?.clientName}`);
      } else {
        logger.warn('[LicenseService] Nenhuma licença ativa encontrada. Operando em modo restrito (Default).');
        this.currentLicense = this.getDefaultLicense();
      }
    } catch (error) {
      logger.error(`[LicenseService] Erro na inicialização: ${error}`);
      this.currentLicense = this.getDefaultLicense();
    }
  }

  /**
   * Verifica se a licença atual permite acesso a um recurso específico.
   */
  hasFeature(featureName: string): boolean {
    if (!this.currentLicense) return false;
    
    // Enterprise sempre tem tudo habilitado
    if (this.currentLicense.type === 'enterprise') return true;

    // Verificar flags específicas
    return !!this.currentLicense.feature_flags[featureName];
  }

  /**
   * Retorna os limites de hardware da licença.
   */
  getLimits() {
    return {
      maxStudents: this.currentLicense?.maxStudents || 50,
      maxCameras: this.currentLicense?.maxCameras || 4
    };
  }

  getCurrentLicense(): LicenseInfo | null {
    return this.currentLicense;
  }

  private getDefaultLicense(): LicenseInfo {
    return {
      id: 'default',
      key: 'TRIAL',
      type: 'standard',
      maxStudents: 50,
      maxCameras: 4,
      clientName: 'Período de Testes',
      feature_flags: {},
      status: 'active'
    };
  }
}

export const licenseService = new LicenseService();
