import Database from '../../database/Database';

export type InstitutionType = 'PUBLIC' | 'PRIVATE';
export type PlanTier = 'STARTER' | 'PRO' | 'ELITE' | 'PERPETUAL';

export interface InstitutionProfile {
  id: string;
  name: string;
  type: InstitutionType;
  tier: PlanTier;
  region: 'capital' | 'interior';
  inep_code?: string;
  metadata: string;
}

export class InstitutionService {
  private static instance: InstitutionService;
  private db = Database.getInstance();

  private constructor() {}

  public static getInstance(): InstitutionService {
    if (!InstitutionService.instance) {
      InstitutionService.instance = new InstitutionService();
    }
    return InstitutionService.instance;
  }

  /**
   * Obtém o perfil da instituição
   */
  async getProfile(): Promise<InstitutionProfile | null> {
    try {
      const result = await this.db.get('SELECT * FROM institution_profile LIMIT 1');
      if (result) {
        return {
          ...result,
          metadata: result.metadata ? JSON.parse(result.metadata) : {}
        };
      }
      return null;
    } catch (error) {
      console.error('Erro ao buscar perfil da instituição:', error);
      return null;
    }
  }

  /**
   * Atualiza ou inicializa o perfil
   */
  async updateProfile(profile: Partial<InstitutionProfile>): Promise<void> {
    const current = await this.getProfile();
    const id = current?.id || 'main_school';
    const name = profile.name || current?.name || 'Áquila Pro School';
    const type = profile.type || current?.type || 'PRIVATE';
    const tier = profile.tier || current?.tier || 'STARTER';
    const region = profile.region || current?.region || 'capital';
    const inep = profile.inep_code || current?.inep_code || '';
    const metadata = JSON.stringify(profile.metadata || current?.metadata || {});

    await this.db.run(
      `INSERT OR REPLACE INTO institution_profile (id, name, type, tier, region, inep_code, metadata)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, name, type, tier, region, inep, metadata]
    );
  }

  /**
   * Verifica se uma funcionalidade está ativa baseado no plano
   */
  async isFeatureEnabled(featureId: string): Promise<boolean> {
    const profile = await this.getProfile();
    if (!profile) return false;

    // Feature Flags Logic
    switch (featureId) {
      case 'federation': 
        return profile.tier !== 'STARTER'; // Nexus exige PRO ou ELITE
      case 'scientific_attendance':
        return true; // Disponível para todos (Core Pedagogical)
      case 'advanced_longitudinal':
        return profile.tier === 'ELITE' || profile.tier === 'PERPETUAL'; // Análise preditiva profunda
      case 'marketplace':
        return profile.type === 'PRIVATE'; // Marketplace para colégios privados
      default:
        return true;
    }
  }

  /**
   * Retorna os rótulos de governança baseados no tipo
   */
  async getGovernanceLabels(): Promise<{ primary: string; secondary: string }> {
    const profile = await this.getProfile();
    if (profile?.type === 'PUBLIC') {
      return { primary: 'Conformidade MEC', secondary: 'Frequência Escolar' };
    }
    return { primary: 'Retenção Escolar', secondary: 'ROI Pedagógico' };
  }
}

export default InstitutionService.getInstance();
