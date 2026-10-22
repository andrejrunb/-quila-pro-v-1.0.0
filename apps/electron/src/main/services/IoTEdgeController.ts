import { logger } from '../logger';

export interface IoTDevice {
  id: string;
  name: string;
  type: 'light' | 'ac' | 'lock';
  zoneId: string;
  status: 'on' | 'off' | 'eco';
  lastCommand?: string;
  consumptionKw: number;
}

/**
 * IoTEdgeController (Nível 24)
 * Orquestrador de dispositivos físicos via protocolos simulados.
 * Integração com a malha soberana para automação energética.
 */
export class IoTEdgeController {
  private static instance: IoTEdgeController;
  private devices: IoTDevice[] = [
    { id: 'iot-l-01', name: 'Luzes Bloco A', type: 'light', zoneId: 'A1', status: 'on', consumptionKw: 2.5 },
    { id: 'iot-ac-01', name: 'Ar-Condicionado Sala 101', type: 'ac', zoneId: 'A1', status: 'on', consumptionKw: 4.0 },
    { id: 'iot-l-02', name: 'Luzes Corredor B', type: 'light', zoneId: 'B1', status: 'on', consumptionKw: 1.5 },
    { id: 'iot-ac-02', name: 'Ar-Condicionado Auditório', type: 'ac', zoneId: 'B1', status: 'off', consumptionKw: 0 }
  ];

  private constructor() {}

  public static getInstance(): IoTEdgeController {
    if (!IoTEdgeController.instance) {
      IoTEdgeController.instance = new IoTEdgeController();
    }
    return IoTEdgeController.instance;
  }

  /**
   * Executa um comando em um dispositivo ou zona.
   */
  public async executeCommand(zoneId: string, type: 'light' | 'ac', action: 'on' | 'off' | 'eco') {
    const targetDevices = this.devices.filter(d => d.zoneId === zoneId && d.type === type);
    
    for (const device of targetDevices) {
      device.status = action;
      device.lastCommand = `AUTO_${action.toUpperCase()}_${Date.now()}`;
      
      // Atualiza consumo (Mock)
      if (action === 'off') device.consumptionKw = 0;
      else if (action === 'eco') device.consumptionKw *= 0.6;
      else device.consumptionKw = device.type === 'light' ? 2.5 : 4.0;

      logger.info(`[IoT] Comandado ${device.name}: ${action.toUpperCase()}`);
    }
  }

  /**
   * Aplica uma cena pré-definida em uma zona.
   */
  public async applyScene(zoneId: string, scene: 'DEEP_WORK' | 'CREATIVE' | 'CALM' | 'ACTIVE') {
    const config = {
      DEEP_WORK: { light: 'eco', ac: 'on' }, // Luz baixa, clima frio
      CREATIVE: { light: 'on', ac: 'eco' },  // Luz plena, clima ameno
      CALM: { light: 'eco', ac: 'eco' },     // Tudo em modo econômico/suave
      ACTIVE: { light: 'on', ac: 'on' }      // Tudo ligado para energia máxima
    };

    const sceneConfig = config[scene];
    await this.executeCommand(zoneId, 'light', sceneConfig.light as any);
    await this.executeCommand(zoneId, 'ac', sceneConfig.ac as any);
    
    logger.warn(`[IoT] Cena ${scene} aplicada na zona ${zoneId}`);
  }

  public getCampusState() {

    return {
      devices: this.devices,
      totalInstantUsage: this.devices.reduce((acc, d) => acc + d.consumptionKw, 0),
      activeZonesCount: new Set(this.devices.filter(d => d.status !== 'off').map(d => d.zoneId)).size
    };
  }
}

export const ioTEdgeController = IoTEdgeController.getInstance();
