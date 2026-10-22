/**
 * BioSafetyAutomator (v2741)
 * Bridges environmental sensors with institutional actuators.
 * Ensures optimal cognitive safety by autonomously balancing CO2, PM2.5 and Humidity.
 */

class BioSafetyAutomator {
  private static instance: BioSafetyAutomator;

  private constructor() {}

  public static getInstance(): BioSafetyAutomator {
    if (!BioSafetyAutomator.instance) {
      BioSafetyAutomator.instance = new BioSafetyAutomator();
    }
    return BioSafetyAutomator.instance;
  }

  /**
   * Evaluates atmospheric state and returns recommended actuator actions.
   */
  public evaluateAtmosphere(metrics: { co2: number; pm25: number; humidity: number }) {
    const actions: string[] = [];

    // CO2 Thresholds (Direct correlation with cognitive fatigue)
    if (metrics.co2 > 1200) {
      actions.push('HVAC_MAX_VENTILATION');
      actions.push('OPEN_SMART_WINDOWS');
    } else if (metrics.co2 > 800) {
      actions.push('HVAC_LOW_POWER_VENTILATION');
    }

    // Air Quality (PM2.5)
    if (metrics.pm25 > 35) {
      actions.push('ACTIVATE_HEPA_FILTRATION');
      actions.push('CLOSE_WINDOWS_POLLUTION_LOCK');
    }

    // Humidity (Pathogen spread risk)
    if (metrics.humidity > 70) {
      actions.push('ACTIVATE_DEHUMIDIFIER');
    }

    if (actions.length > 0) {
      this.log(`Atmospheric Anomaly Resolved: ${actions.join(', ')} triggered.`);
    }

    return actions;
  }

  private log(msg: string) {
    console.log(`[BioSafetyAutomator] ${msg}`);
  }
}

export const bioSafetyAutomator = BioSafetyAutomator.getInstance();

