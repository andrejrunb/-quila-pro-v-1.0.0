import { logger } from '../logger';
import { db } from '../../database/Database';

/**
 * TENANT ISOLATION SERVICE (v3702)
 * -------------------------------
 * Gerencia a separação lógica e física de dados por instituição (Tenant).
 * Essencial para distritos escolares onde um único nó Áquila Edge
 * pode orquestrar dados de várias escolas sob o mesmo enxame.
 */
export interface SchoolTenant {
  id: string;
  name: string;
  subdomain: string;
  dbPath: string;
}

export class TenantIsolationService {
  private static instance: TenantIsolationService;
  private currentTenantId: string | null = null;

  private constructor() {}

  public static getInstance(): TenantIsolationService {
    if (!TenantIsolationService.instance) {
      TenantIsolationService.instance = new TenantIsolationService();
    }
    return TenantIsolationService.instance;
  }

  /**
   * [SQA-TEN-1105] Alterna o contexto institucional (Tenant Switch).
   */
  public async switchTenant(tenantId: string): Promise<boolean> {
    logger.info(`[TenantIsolation] Alternando contexto para Instituição: ${tenantId}...`);
    
    // Validação de segurança (v3647)
    const tenant = await db.get('SELECT * FROM institutions WHERE id = ?', [tenantId]);
    if (!tenant) {
      logger.error(`[TenantIsolation] Erro: Instituição ${tenantId} não encontrada.`);
      return false;
    }

    this.currentTenantId = tenantId;
    logger.info(`[TenantIsolation] Contexto '${tenant.name}' Ativado.`);
    return true;
  }

  /**
   * [SQA-TEN-1108] Retorna o ID da escola ativa no momento.
   */
  public getActiveTenant(): string | null {
    return this.currentTenantId;
  }

  /**
   * [SQA-TEN-1110] Cria um novo isolamento para uma escola recém-adicionada.
   */
  public async provisionNewSchool(name: string, subdomain: string): Promise<string> {
     const id = `SCH_${Math.random().toString(36).substring(7).toUpperCase()}`;
     await db.run(
       'INSERT INTO institutions (id, name, subdomain, status) VALUES (?, ?, ?, ?)',
       [id, name, subdomain, 'active']
     );
     logger.info(`[TenantIsolation] Nova Escola Provisionada: ${name} (${subdomain})`);
     return id;
  }
}

export const tenantIsolationService = TenantIsolationService.getInstance();

