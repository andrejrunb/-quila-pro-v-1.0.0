/**
 * PricingService - Phase 401: SaaS Dynamic Tiering
 * Governa as capacidades do Sistema Operacional baseado no licenciamento.
 */
import { sovereignGrantService } from './SovereignGrantService';

export enum SaaSPlan {
  STARTER = 'starter',
  PROFESSIONAL = 'professional',
  SOVEREIGN = 'sovereign',
  PERPETUAL = 'perpetual' // New: CapEx Model
}

export interface SaaSPlanItem {
  id: SaaSPlan | string;
  name: string;
  basePrice: number;
  allowWhiteLabel: boolean;
}

export interface TierConfig {
  plan: SaaSPlan;
  features: {
    npuAcceleration: boolean;
    localBiometrics: boolean;
    offlineSync: boolean;
    advancedVision: boolean;
    coordDashboard: boolean;
    federatedIntelligence: boolean; // v701: IA Distribuída via Mesh
    allowWhiteLabel: boolean; // Phase 401: Custom Branding
  };
}

class PricingService {
  private static instance: PricingService;
  private currentPlan: SaaSPlan = SaaSPlan.STARTER;

  private constructor() {}

  public static getInstance(): PricingService {
    if (!PricingService.instance) {
      PricingService.instance = new PricingService();
    }
    return PricingService.instance;
  }

  public getTierConfig(plan?: SaaSPlan): TierConfig {
    const targetPlan = plan || this.currentPlan;
    switch (targetPlan) {
      case SaaSPlan.SOVEREIGN:
        return {
          plan: SaaSPlan.SOVEREIGN,
          features: {
            npuAcceleration: true,
            localBiometrics: true,
            offlineSync: true,
            advancedVision: true,
            coordDashboard: true,
            federatedIntelligence: true,
            allowWhiteLabel: true,
          }
        };
      case SaaSPlan.PERPETUAL:
        return {
          plan: SaaSPlan.PERPETUAL,
          features: {
            npuAcceleration: true,
            localBiometrics: true,
            offlineSync: true,
            advancedVision: true,
            coordDashboard: true,
            federatedIntelligence: false, // Perpétuo é geralmente isolado
            allowWhiteLabel: true,
          }
        };
      case SaaSPlan.PROFESSIONAL:
        return {
          plan: SaaSPlan.PROFESSIONAL,
          features: {
            npuAcceleration: false,
            localBiometrics: true,
            offlineSync: true,
            advancedVision: false,
            coordDashboard: true,
            federatedIntelligence: true,
            allowWhiteLabel: true,
          }
        };
      default:
        return {
          plan: SaaSPlan.STARTER,
          features: {
            npuAcceleration: false,
            localBiometrics: false,
            offlineSync: false,
            advancedVision: false,
            coordDashboard: false,
            federatedIntelligence: false,
            allowWhiteLabel: false,
          }
        };
    }
  }

  public setPlan(plan: SaaSPlan) {
    console.log(`[Pricing] Plan updated to ${plan}`);
    this.currentPlan = plan;
  }

  public getPlans(): SaaSPlanItem[] {
    return [
      { id: SaaSPlan.STARTER, name: 'Starter (até 200)', basePrice: 7.50, allowWhiteLabel: false },
      { id: SaaSPlan.PROFESSIONAL, name: 'Pro (201-500)', basePrice: 7.00, allowWhiteLabel: true },
      { id: SaaSPlan.SOVEREIGN, name: 'Elite (500+)', basePrice: 6.50, allowWhiteLabel: true },
      { id: SaaSPlan.PERPETUAL, name: 'Licença Perpétua', basePrice: 250.00, allowWhiteLabel: true } // Valor por aluno (CapEx)
    ];
  }

  /**
   * [SQA-PRC-403] Calcula o ROI Comparativo
   * Baseado em custos médios de mercado para softwares fragmentados.
   */
  public async calculateROI(studentCount: number, schoolType: 'public' | 'private', unitCount: number = 1): Promise<any> {
    const legacyCosts = {
      scheduling: 450,
      messaging: studentCount * 0.25, // Estimativa de SMS/WhatsApp em sistemas legados
      records: 800,
      biometricsCloud: studentCount > 100 ? 600 : 0 // Custos de nuvem para biometria legada
    };

    const monthlyLegacyTotal = legacyCosts.scheduling + legacyCosts.messaging + legacyCosts.records + legacyCosts.biometricsCloud;
    
    // Calcula o preço do Professional (plano recomendado)
    const quote = await this.calculateQuote(schoolType, 'capital', studentCount, SaaSPlan.PROFESSIONAL, unitCount);
    
    const monthlyAquila = quote.totalValue;
    const monthlySavings = monthlyLegacyTotal - monthlyAquila;
    const percentage = (monthlySavings / monthlyLegacyTotal) * 100;

    return {
      legacyTotal: monthlyLegacyTotal,
      aquilaMonthly: monthlyAquila,
      savings: monthlySavings,
      percentage: Math.round(percentage),
      details: legacyCosts
    };
  }

    /**
     * [SQA-PRC-405] Simulação de Impacto Tributário (Fase 401+)
     * Calcula impostos estimados baseados na natureza jurídica do contrato.
     */
    public simulateTaxImpact(baseValue: number, type: 'public' | 'private'): any {
        const rates = {
            iss: 0.05,
            pis: 0.0165,
            cofins: 0.076
        };

        const taxTotal = type === 'private' 
            ? baseValue * (rates.iss + rates.pis + rates.cofins)
            : baseValue * rates.iss; // Isenção parcial para contratos Gov

        return {
            netValue: baseValue - taxTotal,
            taxTotal,
            breakdown: {
                iss: baseValue * rates.iss,
                pis: type === 'private' ? baseValue * rates.pis : 0,
                cofins: type === 'private' ? baseValue * rates.cofins : 0
            }
        };
    }

    /**
     * [Fase 2300] Calcula orçamento com suporte a Smart Grants individuais.
     */
    public async calculateQuote(
        type?: string, 
        region?: string, 
        count?: number, 
        planId?: SaaSPlan, 
        unitCount: number = 1, 
        studentId?: string
    ): Promise<any> {
        // 1. Injeta dados reais da instituição se não fornecidos
        const institutionService = (await import('./InstitutionService')).default;
        const profile = await institutionService.getProfile();

        const effectiveType = (type || profile?.type || 'private').toLowerCase();
        const effectiveRegion = (region || profile?.region || 'capital').toLowerCase();
        const effectivePlanId = planId || (profile?.tier as any) || SaaSPlan.STARTER;
        
        const plan = this.getPlans().find(p => p.id.toLowerCase() === (effectivePlanId as string).toLowerCase()) || this.getPlans()[0];
        const basePerStudent = plan.basePrice;
        
        let discountPercent = 0;
        if (effectiveType === 'public') discountPercent += 40; // 40% Gov
        if (unitCount > 1) discountPercent += 10;     // 10% Multi-unit
        
        // 1. Descontos Institucionais (Máx 50%)
        let effectiveDiscount = Math.min(discountPercent, 50) / 100;

        // 2. [SQA-PRC-406] Preço Social (Vulnerabilidade)
        // Se for escola pública em região não-capital, adiciona bônus de 5%
        if (effectiveType === 'public' && effectiveRegion !== 'capital') {
            effectiveDiscount += 0.05;
        }

        // 3. [Fase 2300] Bônus de Smart Grant Individual (se aplicável)
        if (studentId) {
            const smartBonus = await sovereignGrantService.calculateEffectiveDiscount(studentId);
            effectiveDiscount += smartBonus;
        }

        // Teto global de 75%
        effectiveDiscount = Math.min(effectiveDiscount, 0.75);
        
        const discountedPrice = basePerStudent * (1 - effectiveDiscount);
        const finalCount = count || 1;
        let total = discountedPrice * finalCount;

        // Regra de preço mínimo para privadas
        if (effectiveType === 'private' && effectivePlanId === SaaSPlan.STARTER) {
            total = Math.max(total, 900);
        }

        // Região
        const regionMultiplier = effectiveRegion === 'capital' ? 1.15 : 1.0;
        total = total * regionMultiplier;

        const taxes = this.simulateTaxImpact(total, effectiveType as any);

        return {
            success: true,
            perStudent: discountedPrice,
            totalValue: total,
            netValue: taxes.netValue,
            taxTotal: taxes.taxTotal,
            discount: Math.round(effectiveDiscount * 100),
            quote: `R$ ${total.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
        };
    }
}

export const pricingService = PricingService.getInstance();
export default pricingService;


