/**
 * NeuroPedagogyService (v5141)
 * Models cognitive load and attention levels using behavioral data.
 * Core of the 'Adaptive Pedagogical Flow'.
 */

export interface NeuroPulse {
  focusScore: number; // 0.0 - 1.0
  fatigueIndex: number; // 0.0 - 1.0 (Lower is better)
  collectiveEngagement: number; // 0.0 - 1.0
  lastUpdate: string;
}

export interface StudentFocus {
  id: string;
  name: string;
  focus: number;
  status: 'OPTIMAL' | 'DRIFTING' | 'OVERLOADED';
}

class NeuroPedagogyService {
  private static instance: NeuroPedagogyService;
  private history: NeuroPulse[] = [];
  
  private constructor() {
    // Initialize history with mock data for the trend chart
    for (let i = 0; i < 30; i++) {
        this.history.push({
            focusScore: 0.7 + (Math.random() * 0.2),
            fatigueIndex: 0.1 + (i * 0.01),
            collectiveEngagement: 0.8 + (Math.random() * 0.1),
            lastUpdate: new Date(Date.now() - (30 - i) * 60000).toISOString()
        });
    }
  }

  public static getInstance(): NeuroPedagogyService {
    if (!NeuroPedagogyService.instance) {
      NeuroPedagogyService.instance = new NeuroPedagogyService();
    }
    return NeuroPedagogyService.instance;
  }

  public getClassNeuroPulse(classId: string): NeuroPulse {
    const pulse = {
      focusScore: 0.85 - (Math.random() * 0.2),
      fatigueIndex: 0.2 + (Math.random() * 0.1),
      collectiveEngagement: 0.9 - (Math.random() * 0.1),
      lastUpdate: new Date().toISOString()
    };
    
    this.history.push(pulse);
    if (this.history.length > 30) this.history.shift();
    
    return pulse;
  }

  public getHistoricalNeuroTrends(): NeuroPulse[] {
    return this.history;
  }

  public getIndividualStudentFocus(): StudentFocus[] {
    const students = ['Enzo', 'Valentina', 'Arthur', 'Sophia', 'Heitor', 'Alice', 'Miguel', 'Laura', 'Gael', 'Manuela'];
    return students.map((name, i) => {
        const focus = 0.5 + (Math.random() * 0.5);
        let status: 'OPTIMAL' | 'DRIFTING' | 'OVERLOADED' = 'OPTIMAL';
        if (focus < 0.6) status = 'DRIFTING';
        if (focus > 0.95 && Math.random() > 0.8) status = 'OVERLOADED';
        
        return { id: `std-${i}`, name, focus, status };
    });
  }

  /**
   * Generates a pedagogical recommendation based on neuro-pulse.
   */
  public getRecommendation(pulse: NeuroPulse): string {
    if (pulse.fatigueIndex > 0.5) return 'BRAIN_BREAK_REQUIRED';
    if (pulse.focusScore < 0.6) return 'ENGAGEMENT_SPIKE_NEEDED';
    if (pulse.collectiveEngagement > 0.95) return 'CHALLENGE_MODE_ACTIVE';
    return 'MAINTAIN_FLOW';
  }
}

export const neuroPedagogyService = NeuroPedagogyService.getInstance();
