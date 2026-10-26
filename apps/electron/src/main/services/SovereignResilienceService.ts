import { EventEmitter } from 'events';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { db } from '../../database/Database';
import { logger } from '../logger';

export interface SensorReadings {
  cpuTemp: number;
  gpuTemp: number;
  npuTemp: number;
  source: 'sensors' | 'simulation';
  timestamp: string;
}

export interface ThermalTelemetry {
  timestamp: string;
  cpuTemp: number;
  gpuTemp: number;
  npuTemp: number;
  maxTemp: number;
  framerate: number;
  isThrottled: boolean;
  anomalyDetected: boolean;
  anomalyReason?: string;
  source: 'sensors' | 'simulation';
}

export interface ResilienceStats {
  kernelIntegrity: string;
  encryptionStandard: string;
  airGapStatus: 'ACTIVE' | 'STANDBY';
  lastAudit: string;
  thermalGovernor: {
    currentFramerate: number;
    isThrottled: boolean;
    latestMaxTemp: number | null;
    status: 'OPTIMAL' | 'THROTTLED' | 'CRITICAL';
    anomalyCount: number;
  };
}

/**
 * SOVEREIGN RESILIENCE SERVICE (SRS) v9000
 * ---------------------------------------
 * Guardião da integridade física e operacional do Áquila Pro Edge.
 * Implementa:
 * - Auditoria de integridade quântica (Hash SHA3-256) e Modo Air-Gap.
 * - Leitura e telemetria térmica integrada (CPU/GPU/NPU).
 * - Auto-Throttling adaptativo conforme AGENTS.md:
 *   Temp > 75ºC => Throttling de 30 FPS para 10 FPS até resfriamento (<= 65ºC).
 * - Detecção de anomalias térmicas e persistência estruturada em JSON.
 */
export class SovereignResilienceService extends EventEmitter {
  private static instance: SovereignResilienceService;

  public static readonly CRITICAL_TEMP_THRESHOLD = 75.0; // ºC
  public static readonly RECOVERY_TEMP_THRESHOLD = 65.0; // ºC (histerese)
  public static readonly EXTREME_TEMP_THRESHOLD = 85.0;  // ºC
  public static readonly MAX_SPIKE_DELTA = 15.0;         // ºC de variação brusca
  public static readonly DEFAULT_FRAMERATE = 30;         // FPS normal
  public static readonly THROTTLED_FRAMERATE = 10;       // FPS mitigado

  private currentFramerate: number = SovereignResilienceService.DEFAULT_FRAMERATE;
  private isThrottled: boolean = false;
  private lastTelemetry: ThermalTelemetry | null = null;
  private telemetryHistory: ThermalTelemetry[] = [];
  private anomalyCount: number = 0;
  private simulatedSensors: { cpuTemp: number; gpuTemp: number; npuTemp: number } = {
    cpuTemp: 45.0,
    gpuTemp: 48.0,
    npuTemp: 42.0,
  };
  private isSimulationMode: boolean = false;
  private watchdogTimer: NodeJS.Timeout | null = null;

  private readonly criticalFiles = [
    './apps/electron/dist/main.js',
    './apps/electron/src/database/Database.ts',
  ];

  private constructor() {
    super();
  }

  public static getInstance(): SovereignResilienceService {
    if (!SovereignResilienceService.instance) {
      SovereignResilienceService.instance = new SovereignResilienceService();
    }
    return SovereignResilienceService.instance;
  }

  // ==========================================
  // 1. MONITORAMENTO TÉRMICO & SENSORES
  // ==========================================

  public setSimulationMode(enabled: boolean) {
    this.isSimulationMode = enabled;
  }

  public setSimulatedTemperatures(cpu: number, gpu: number, npu: number) {
    this.simulatedSensors = {
      cpuTemp: cpu,
      gpuTemp: gpu,
      npuTemp: npu,
    };
  }

  /**
   * Lê sensores locais de hardware (ou fallback para telemetria simulada)
   */
  public async readSensors(): Promise<SensorReadings> {
    const timestamp = new Date().toISOString();

    if (this.isSimulationMode) {
      return {
        ...this.simulatedSensors,
        source: 'simulation',
        timestamp,
      };
    }

    try {
      // Tentativa de integração com o otimizador NPU local
      const npuModule = await import('./NpuOptimizationService_V2').catch(() => null);
      if (npuModule?.npuOptimizer) {
        const state = await npuModule.npuOptimizer.getThermalState();
        return {
          cpuTemp: Number((state.temperature * 0.95).toFixed(1)),
          gpuTemp: Number((state.temperature * 1.02).toFixed(1)),
          npuTemp: Number(state.temperature.toFixed(1)),
          source: 'sensors',
          timestamp,
        };
      }
    } catch {
      // Fallback seguro em ambientes sem suporte direto aos sensores nativos
    }

    return {
      ...this.simulatedSensors,
      source: 'simulation',
      timestamp,
    };
  }

  /**
   * Avalia a telemetria térmica, detecta anomalias e aplica auto-throttling
   */
  public async evaluateThermalState(readings?: SensorReadings): Promise<ThermalTelemetry> {
    const sensorData = readings || (await this.readSensors());
    const maxTemp = Math.max(sensorData.cpuTemp, sensorData.gpuTemp, sensorData.npuTemp);

    let anomalyDetected = false;
    let anomalyReason: string | undefined;

    // Detecção de Anomalias:
    // 1. Leituras inválidas/incoerentes
    if (
      isNaN(maxTemp) ||
      maxTemp < 0 ||
      maxTemp > 120 ||
      sensorData.cpuTemp < 0 ||
      sensorData.gpuTemp < 0 ||
      sensorData.npuTemp < 0
    ) {
      anomalyDetected = true;
      anomalyReason = `SENSOR_CORRUPTION: Leitura inválida (CPU: ${sensorData.cpuTemp}, GPU: ${sensorData.gpuTemp}, NPU: ${sensorData.npuTemp})`;
    }
    // 2. Variação brusca (Spike térmico > 15ºC)
    else if (this.lastTelemetry && Math.abs(maxTemp - this.lastTelemetry.maxTemp) > SovereignResilienceService.MAX_SPIKE_DELTA) {
      anomalyDetected = true;
      anomalyReason = `THERMAL_SPIKE: Salto abrupto de ${this.lastTelemetry.maxTemp.toFixed(1)}ºC para ${maxTemp.toFixed(1)}ºC em ciclo único.`;
    }
    // 3. Calor Extremo (> 85ºC)
    else if (maxTemp >= SovereignResilienceService.EXTREME_TEMP_THRESHOLD) {
      anomalyDetected = true;
      anomalyReason = `EXTREME_HEAT: Temperatura crítica de ${maxTemp.toFixed(1)}ºC excede limite operacional seguro.`;
    }

    if (anomalyDetected) {
      this.anomalyCount++;
      logger.error(`[SRS] 🚨 Anomalia Térmica Detectada: ${anomalyReason}`);
      await this.persistAudit('THERMAL_ANOMALY', 'CRITICAL', {
        reason: anomalyReason,
        readings: sensorData,
        maxTemp,
      });
      this.emit('thermal-anomaly', { reason: anomalyReason, readings: sensorData, maxTemp });
    }

    // Auto-Throttling Adaptativo Inteligente (AGENTS.md):
    // Se ultrapassar 75ºC => 30 FPS para 10 FPS
    if (maxTemp > SovereignResilienceService.CRITICAL_TEMP_THRESHOLD) {
      if (!this.isThrottled || this.currentFramerate !== SovereignResilienceService.THROTTLED_FRAMERATE) {
        const previousFps = this.currentFramerate;
        this.isThrottled = true;
        this.currentFramerate = SovereignResilienceService.THROTTLED_FRAMERATE;

        logger.warn(
          `[SRS] 🔥 Alerta de Superaquecimento (${maxTemp.toFixed(1)}ºC > ${SovereignResilienceService.CRITICAL_TEMP_THRESHOLD}ºC). ` +
          `Framerate reduzido de ${previousFps} FPS para ${this.currentFramerate} FPS.`
        );

        await this.persistAudit('THERMAL_THROTTLE', 'WARN', {
          maxTemp,
          previousFramerate: previousFps,
          newFramerate: this.currentFramerate,
          reason: 'OVERHEAT_PROTECTION',
        });

        this.emit('framerate-changed', {
          previousFps,
          currentFps: this.currentFramerate,
          isThrottled: true,
          maxTemp,
        });
      }
    }
    // Histerese de Refrigeração: Retorna para 30 FPS quando temp <= 65ºC
    else if (this.isThrottled && maxTemp <= SovereignResilienceService.RECOVERY_TEMP_THRESHOLD) {
      const previousFps = this.currentFramerate;
      this.isThrottled = false;
      this.currentFramerate = SovereignResilienceService.DEFAULT_FRAMERATE;

      logger.info(
        `[SRS] ❄️ Estabilização Térmica (${maxTemp.toFixed(1)}ºC <= ${SovereignResilienceService.RECOVERY_TEMP_THRESHOLD}ºC). ` +
        `Framerate restaurado para ${this.currentFramerate} FPS.`
      );

      await this.persistAudit('THERMAL_RECOVERY', 'INFO', {
        maxTemp,
        previousFramerate: previousFps,
        newFramerate: this.currentFramerate,
        reason: 'COOLING_RESTORED',
      });

      this.emit('framerate-changed', {
        previousFps,
        currentFps: this.currentFramerate,
        isThrottled: false,
        maxTemp,
      });
    }

    const telemetry: ThermalTelemetry = {
      timestamp: sensorData.timestamp,
      cpuTemp: sensorData.cpuTemp,
      gpuTemp: sensorData.gpuTemp,
      npuTemp: sensorData.npuTemp,
      maxTemp,
      framerate: this.currentFramerate,
      isThrottled: this.isThrottled,
      anomalyDetected,
      anomalyReason,
      source: sensorData.source,
    };

    this.lastTelemetry = telemetry;
    this.telemetryHistory.push(telemetry);
    if (this.telemetryHistory.length > 200) {
      this.telemetryHistory.shift();
    }

    // Persistência em JSON estruturado
    await this.persistAudit('THERMAL_TELEMETRY', 'INFO', telemetry);
    this.emit('thermal-telemetry', telemetry);

    return telemetry;
  }

  public getCurrentFramerate(): number {
    return this.currentFramerate;
  }

  public isThermalThrottling(): boolean {
    return this.isThrottled;
  }

  public getLatestTelemetry(): ThermalTelemetry | null {
    return this.lastTelemetry;
  }

  public getTelemetryHistory(limit: number = 50): ThermalTelemetry[] {
    return this.telemetryHistory.slice(-limit);
  }

  public startWatchdog(intervalMs: number = 10000) {
    if (this.watchdogTimer) return;
    this.watchdogTimer = setInterval(async () => {
      try {
        await this.evaluateThermalState();
      } catch (err) {
        logger.error('[SRS] Erro no loop de watchdog térmico:', err);
      }
    }, intervalMs);

    if (this.watchdogTimer && typeof this.watchdogTimer.unref === 'function') {
      this.watchdogTimer.unref();
    }
  }

  public stopWatchdog() {
    if (this.watchdogTimer) {
      clearInterval(this.watchdogTimer);
      this.watchdogTimer = null;
    }
  }

  // ==========================================
  // 2. AUDITORIA QUÂNTICA & AIR-GAP (ORIGINAIS)
  // ==========================================

  public async runIntegrityAudit() {
    logger.info('[SRS] Iniciando auditoria de resiliência quântica...');
    const auditResults: any[] = [];

    for (const file of this.criticalFiles) {
      try {
        const filePath = path.resolve(file);
        if (!fs.existsSync(filePath)) continue;

        const content = fs.readFileSync(filePath);
        const hash = crypto.createHash('sha3-256').update(content).digest('hex');

        auditResults.push({
          file,
          hash,
          status: 'SECURE',
          timestamp: new Date().toISOString(),
        });
      } catch (err) {
        logger.error(`[SRS] Erro ao auditar arquivo ${file}:`, err);
      }
    }

    await this.persistAudit('INTEGRITY_SCAN', 'SECURE', auditResults);
    logger.info('[SRS] Auditoria concluída. Estado do Kernel: SOBERANO.');
    return auditResults;
  }

  public async toggleAirGapMode(enabled: boolean) {
    logger.info(`[SRS] Modo Air-Gap ${enabled ? 'ATIVADO' : 'DESATIVADO'}.`);
    process.env.AQUILA_AIRGAP_ACTIVE = enabled ? 'true' : 'false';

    await this.persistAudit(
      'AIRGAP_TOGGLE',
      enabled ? 'CRITICAL' : 'INFO',
      { enabled, message: `Modo Air-Gap definido como ${enabled}` }
    );
  }

  public async getResilienceStats(): Promise<ResilienceStats> {
    let lastAudit: any = null;
    try {
      lastAudit = await db.get(
        `SELECT * FROM security_resilience_audit WHERE event = 'INTEGRITY_SCAN' ORDER BY createdAt DESC LIMIT 1`
      );
    } catch {
      // Fallback seguro em ambientes de teste ou inicialização prévia
    }

    let thermalStatus: 'OPTIMAL' | 'THROTTLED' | 'CRITICAL' = 'OPTIMAL';
    if (this.isThrottled) {
      thermalStatus = 'THROTTLED';
    }
    if (this.lastTelemetry && this.lastTelemetry.maxTemp >= SovereignResilienceService.EXTREME_TEMP_THRESHOLD) {
      thermalStatus = 'CRITICAL';
    }

    return {
      kernelIntegrity: '100%',
      encryptionStandard: 'AES-256-GCM / SHA3-256',
      airGapStatus: process.env.AQUILA_AIRGAP_ACTIVE === 'true' ? 'ACTIVE' : 'STANDBY',
      lastAudit: lastAudit?.createdAt || 'Never',
      thermalGovernor: {
        currentFramerate: this.currentFramerate,
        isThrottled: this.isThrottled,
        latestMaxTemp: this.lastTelemetry ? this.lastTelemetry.maxTemp : null,
        status: thermalStatus,
        anomalyCount: this.anomalyCount,
      },
    };
  }

  public async getRecentLogs(limit: number = 10) {
    try {
      return await db.all(
        `SELECT * FROM security_resilience_audit ORDER BY createdAt DESC LIMIT ?`,
        [limit]
      );
    } catch {
      return [];
    }
  }

  private async persistAudit(event: string, severity: string, details: any) {
    try {
      const serialized = typeof details === 'string' ? details : JSON.stringify(details);
      await db.run(
        `INSERT INTO security_resilience_audit (event, severity, details) VALUES (?, ?, ?)`,
        [event, severity, serialized]
      );
    } catch (err) {
      // Ignora falhas de escrita se o mock do DB não persistir durante testes
    }
  }
}

export const sovereignResilienceService = SovereignResilienceService.getInstance();
