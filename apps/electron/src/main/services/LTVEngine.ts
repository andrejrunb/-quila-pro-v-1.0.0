/**
 * Emerald-Ledger: LTV Engine
 * Calculates the longitudinal financial value of students.
 */

export interface StudentLTV {
  studentId: string;
  totalValue: number;         // Historical total paid
  projectedLTV: number;       // Projected value until graduation
  tenureMonths: number;       // Time in the institution
  riskAdjustedValue: number;  // Value considering churn risk
}

class LTVEngine {
  private static instance: LTVEngine;
  private readonly MONTHLY_BASE = 4.90; // Base Áquila Platform Fee

  private constructor() {}

  public static getInstance(): LTVEngine {
    if (!LTVEngine.instance) {
      LTVEngine.instance = new LTVEngine();
    }
    return LTVEngine.instance;
  }

  /**
   * Calculates LTV based on tenure and projected graduation.
   */
  public calculateStudentLTV(studentId: string, currentTenure: number, monthsToGraduation: number): StudentLTV {
    const historicalValue = currentTenure * this.MONTHLY_BASE;
    const projectedValue = monthsToGraduation * this.MONTHLY_BASE;
    
    return {
      studentId,
      totalValue: historicalValue,
      projectedLTV: historicalValue + projectedValue,
      tenureMonths: currentTenure,
      riskAdjustedValue: (historicalValue + projectedValue) * 0.85 // Default safety margin
    };
  }

  /**
   * Aggregates total campus value.
   */
  public calculateCampusValue(studentCount: number): number {
    return studentCount * this.MONTHLY_BASE;
  }
}

export const ltvEngine = LTVEngine.getInstance();

