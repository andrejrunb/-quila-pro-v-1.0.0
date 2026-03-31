import { EventEmitter } from 'events';

export interface PricingPlan {
  id: string;
  name: string;
  baseMonthlyFee: number;
  perStudentFee: number;
  features: string[];
}

/**
 * Phase 401+: Pricing & Financial Service
 * Calcula custos e planos baseados nas diretrizes: Capital vs Interior, Pública vs Privada.
 */
class PricingService extends EventEmitter {
  private basePlans: PricingPlan[] = [
    { id: 'basic', name: 'Áquila Basic', baseMonthlyFee: 1500, perStudentFee: 2, features: ['Chamada Digital', 'Segurança IoT'] },
    { id: 'standard', name: 'Áquila Vision', baseMonthlyFee: 3500, perStudentFee: 5, features: ['IA Comportamental', 'Geofencing App Pais'] },
    { id: 'premium', name: 'Áquila Elite (Sovereign)', baseMonthlyFee: 7500, perStudentFee: 10, features: ['Re-ID', 'Voice Intelligence', 'High Availability'] },
  ];

  public calculateQuote(schoolType: 'private' | 'public', region: 'capital' | 'interior', studentsCount: number, planId: string): number {
    const plan = this.basePlans.find(p => p.id === planId) || this.basePlans[0];
    let total = plan.baseMonthlyFee + (plan.perStudentFee * studentsCount);

    // Ajustes estratégicos
    if (schoolType === 'private' && region === 'interior') {
      total *= 0.85; // Desconto para interior
    }
    
    if (schoolType === 'public') {
      total *= 1.25; // Licitações costumam ter custos de conformidade maiores
    }

    return Math.round(total);
  }

  public getPlans() {
    return this.basePlans;
  }
}

export const pricingService = new PricingService();
