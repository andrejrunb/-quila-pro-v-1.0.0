import { Database } from '../../database/Database';
import { logger } from '../logger';
import * as os from 'os';

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
  private get db() {
    return Database.getInstance();
  }

  constructor() {
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

  async getActiveLicense(): Promise<LicenseInfo | null> {
    return this.currentLicense;
  }

  async checkLimit(type: 'student' | 'camera'): Promise<boolean> {
    const limits = this.getLimits();
    const count = type === 'student' ? await this.db.getStudentCount() : await this.db.getCameraCount();
    return count < (type === 'student' ? limits.maxStudents : limits.maxCameras);
  }

  async activateLicense(key: string): Promise<boolean> {
    logger.info(`[LicenseService] Ativando licença: ${key}`);
    // Simulação de ativação (v4001)
    return true;
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

  getHardwareId(): string {
    // Retorna o Hostname + Arquitetura como HWID simples (v1.0.0)
    return `${os.hostname()}-${os.arch()}-${process.platform}`;
  }

  /**
   * [SQA-LIC-401] Verifica se o limite de alunos foi atingido.
   */
  public assertStudentLimit(count: number): void {
    const limits = this.getLimits();
    if (count >= limits.maxStudents) {
      throw new Error(`Limite de alunos atingido (${limits.maxStudents}). Atualize sua licença Áquila Pro.`);
    }
  }
}

export const licenseService = new LicenseService();

