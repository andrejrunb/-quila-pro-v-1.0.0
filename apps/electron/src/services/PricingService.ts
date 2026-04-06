/**
 * PricingService - Phase 401: SaaS Dynamic Tiering
 * Governa as capacidades do Sistema Operacional baseado no licenciamento.
 */

export enum SaaSPlan {
  STARTER = 'STARTER',       // Cloud-reliant, base features
  ANTIGRAVITY = 'ANTIGRAVITY', // Hybrid, advanced NLP/Workflows
  SOVEREIGN = 'SOVEREIGN'    // Full Edge AI, 26 TOPS NPU, Offline Resilience
}

export interface TierConfig {
  plan: SaaSPlan;
  features: {
    npuAcceleration: boolean;
    localBiometrics: boolean;
    offlineSync: boolean;
    advancedVision: boolean;
  };
}

class PricingService {
  private static instance: PricingService;
  private currentPlan: SaaSPlan = SaaSPlan.SOVEREIGN; // Default for current dev state

  private constructor() {}

  public static getInstance(): PricingService {
    if (!PricingService.instance) {
      PricingService.instance = new PricingService();
    }
    return PricingService.instance;
  }

  public getTierConfig(): TierConfig {
    switch (this.currentPlan) {
      case SaaSPlan.SOVEREIGN:
        return {
          plan: SaaSPlan.SOVEREIGN,
          features: {
            npuAcceleration: true,
            localBiometrics: true,
            offlineSync: true,
            advancedVision: true,
          }
        };
      case SaaSPlan.ANTIGRAVITY:
        return {
          plan: SaaSPlan.ANTIGRAVITY,
          features: {
            npuAcceleration: false,
            localBiometrics: true,
            offlineSync: true,
            advancedVision: false,
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
          }
        };
    }
  }

  public setPlan(plan: SaaSPlan) {
    console.log(`[Pricing] Plan updated to ${plan}`);
    this.currentPlan = plan;
    // Skill: lgpd_guard - Ensure RBAC matrix is updated on plan change
  }
}

export default PricingService.getInstance();
