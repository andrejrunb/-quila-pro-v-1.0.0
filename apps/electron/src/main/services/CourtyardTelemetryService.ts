import { EventEmitter } from 'events';
import { logger } from '../logger';
import { colabGpuBridge } from './ColabGpuBridge';
import { colabTunnelWatchdog } from './ColabTunnelWatchdog';
import { Database } from '../../database/Database';

export interface GeofenceZone {
  id: string;
  name: string;
  type: 'EXCLUSION' | 'DANGER' | 'RESTRICTED';
  polygon: Array<{ x: number; y: number }>; // Polígono normalizado [0-1]
}

export interface TelemetryConfig {
  cameraId: string;
  zones: GeofenceZone[];
  crowdThreshold: number;      // Número de pessoas para gerar alerta de aglomeração
  nightSentryMode: boolean;    // Se ativo, qualquer pessoa é intruso
}

export interface TelemetryAlert {
  type: 'CROWD' | 'FALL' | 'INTRUSION' | 'PRIVACY_VIOLATION';
  timestamp: number;
  cameraId: string;
  details: string;
  bbox?: number[];
}

export class CourtyardTelemetryService extends EventEmitter {
  private static instance: CourtyardTelemetryService;
  private db: Database;
  
  // Mocks config para demonstração/estado inicial
  private configs: Map<string, TelemetryConfig> = new Map();
  
  private constructor() {
    super();
    this.db = Database.getInstance();
  }

  public static getInstance(): CourtyardTelemetryService {
    if (!CourtyardTelemetryService.instance) {
      CourtyardTelemetryService.instance = new CourtyardTelemetryService();
    }
    return CourtyardTelemetryService.instance;
  }

  public configureCamera(cameraId: string, config: TelemetryConfig) {
    this.configs.set(cameraId, config);
    logger.info(`[CourtyardTelemetry] Câmera ${cameraId} configurada. NightSentry: ${config.nightSentryMode}, Zones: ${config.zones.length}`);
  }

  /**
   * Processa um frame enviado por uma câmera de pátio (Courtyard)
   */
  public async processFrame(cameraId: string, frameData: Buffer): Promise<TelemetryAlert[]> {
    const config = this.configs.get(cameraId);
    if (!config) {
      return []; // Câmera não configurada para telemetria
    }

    const colabStatus = colabGpuBridge.getStatus();
    if (!colabStatus.online) {
      // Offline: Envia task para o Watchdog (fila)
      colabTunnelWatchdog.enqueueTask(
        'object_detection', 
        { cameraId, timestamp: Date.now() }
      );
      return [];
    }

    try {
      // 1. Detectar Pessoas usando YOLO GPU
      // YOLO classes: 0 = person
      const result = await colabGpuBridge.detectObjects(frameData, 0.45, '0');
      const persons = result.detections.filter(d => d.class_id === 0);
      const alerts: TelemetryAlert[] = [];

      // 2. NightSentryEngine (Intrusão)
      // Se for de madrugada (configurado externamente) ou o alarme da escola estiver armado
      if (config.nightSentryMode && persons.length > 0) {
        alerts.push({
          type: 'INTRUSION',
          timestamp: Date.now(),
          cameraId,
          details: `Invasor detectado no pátio. Total: ${persons.length}`,
          bbox: persons[0].bbox
        });
        
        // Em um cenário real, aqui disparamos alarme e WhatsApp
        this.emit('alert', alerts[alerts.length - 1]);
        return alerts; // Intrusão é severa, paramos a análise aqui para agir logo
      }

      // 3. Aglomeração (Crowd Detection)
      if (persons.length >= config.crowdThreshold) {
        alerts.push({
          type: 'CROWD',
          timestamp: Date.now(),
          cameraId,
          details: `Aglomeração detectada. Total de alunos: ${persons.length} (Limite: ${config.crowdThreshold})`
        });
      }

      // 4. Detecção de Quedas (Heurística baseada em BBox Ratio + Y coordinate, já que YOLO v8 Base não tem skeleton nativo sem a variação Pose)
      for (const p of persons) {
        const [x1, y1, x2, y2] = p.bbox;
        const w = x2 - x1;
        const h = y2 - y1;
        
        // Se a pessoa for detectada como muito mais larga que alta (deitada) no pátio
        const aspectRatio = w / (h + 0.0001);
        if (aspectRatio > 1.8 && w > 50) { 
          alerts.push({
            type: 'FALL',
            timestamp: Date.now(),
            cameraId,
            details: `Possível acidente/queda detectada.`,
            bbox: p.bbox
          });
        }

        // 5. Zonas de Exclusão (Geofencing para banheiros/áreas restritas)
        // Check center of person
        const cx = x1 + w / 2;
        const cy = y1 + h / 2;
        
        for (const zone of config.zones) {
          if (zone.type === 'EXCLUSION' && this.isPointInPolygon({x: cx, y: cy}, zone.polygon)) {
             alerts.push({
               type: 'PRIVACY_VIOLATION',
               timestamp: Date.now(),
               cameraId,
               details: `Pessoa detectada em zona de exclusão de privacidade (${zone.name}).`,
               bbox: p.bbox
             });
             // Na prática, mascaramos (pixelate) imediatamente essa pessoa no feed de vídeo
          }
        }
      }

      alerts.forEach(a => this.emit('alert', a));
      return alerts;
      
    } catch (err: any) {
      logger.error(`[CourtyardTelemetry] Falha ao processar frame da câmera ${cameraId}: ${err.message}`);
      return [];
    }
  }

  // Ray-casting algorithm for Geofencing
  private isPointInPolygon(point: {x: number, y: number}, polygon: Array<{x: number, y: number}>): boolean {
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i].x, yi = polygon[i].y;
      const xj = polygon[j].x, yj = polygon[j].y;
      
      const intersect = ((yi > point.y) !== (yj > point.y))
          && (point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi);
      if (intersect) inside = !inside;
    }
    return inside;
  }
}

export const courtyardTelemetryService = CourtyardTelemetryService.getInstance();
