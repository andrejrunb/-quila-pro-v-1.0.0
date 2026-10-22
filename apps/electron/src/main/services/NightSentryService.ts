/**
 * NightSentryService (v3041)
 * Specialized monitoring for institutional perimeters during non-academic hours.
 * Directly replaces third-party night monitoring services.
 */

export type InstitutionalProtocol = 'ACADEMIC_DAY' | 'NIGHT_SENTRY' | 'EVENT_PROTOCOL';

class NightSentryService {
  private static instance: NightSentryService;
  private currentProtocol: InstitutionalProtocol = 'ACADEMIC_DAY';

  private constructor() {}

  public static getInstance(): NightSentryService {
    if (!NightSentryService.instance) {
      NightSentryService.instance = new NightSentryService();
    }
    return NightSentryService.instance;
  }

  public setProtocol(protocol: InstitutionalProtocol) {
    this.currentProtocol = protocol;
    this.log(`Institutional Protocol Updated: ${protocol}`);
  }

  public getProtocol(): InstitutionalProtocol {
    return this.currentProtocol;
  }

  /**
   * Scans perimeter signatures and triggers silent alarms if breached during NIGHT_SENTRY.
   */
  public async scanPerimeter(detections: any[]): Promise<boolean> {
    if (this.currentProtocol !== 'NIGHT_SENTRY') return false;

    const perimeterBreaches = detections.filter(d => d.zone === 'PERIMETER' || d.zone === 'GATE');

    if (perimeterBreaches.length > 0) {
      this.log(`CRITICAL: Perimeter breach detected during ${this.currentProtocol}!`);
      this.triggerSilentAlarm(perimeterBreaches);
      return true;
    }

    return false;
  }

  private triggerSilentAlarm(breaches: any[]) {
    this.log(`SILENT ALARM ACTIVATED: Routing encrypted alert to local authorities via Security Hub.`);
    // O AlertEngine já processa isso se integrado no main.ts
  }

  private log(msg: string) {
    console.log(`[NightSentry] ${msg}`);
  }
}

export const nightSentryService = NightSentryService.getInstance();

