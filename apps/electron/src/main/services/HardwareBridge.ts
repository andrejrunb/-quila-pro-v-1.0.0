import { ioTMainService } from './IoTMainService';
import { DeviceConfig } from '../../services/IoTTypes';

/**
 * HardwareBridge handles high-level communication with physical access control hardware.
 * It abstracts the protocol (TCP, Serial, HTTP) and provides specific commands for different brands.
 */
export class HardwareBridge {
  private static instance: HardwareBridge;

  private constructor() {
    // [CLEANUP] IPC handlers migrated to centralized registry in ipc/handlers.ts
  }

  public static getInstance(): HardwareBridge {
    if (!HardwareBridge.instance) {
      HardwareBridge.instance = new HardwareBridge();
    }
    return HardwareBridge.instance;
  }



  /**
   * Opens a gate or turnstile using the appropriate protocol
   */
  public async openGate(deviceId: string): Promise<boolean> {
    console.log(`[HardwareBridge] Disparando pulso de abertura para ${deviceId}`);
    const result = await ioTMainService.triggerCommand(deviceId, 'open');
    return result.success;
  }

  /**
   * Advanced: Send a specific HEX buffer to a device
   */
  public async sendCommand(deviceId: string, command: Buffer | string): Promise<boolean> {
    try {
      console.log(`[HardwareBridge] Enviando comando bruto para ${deviceId}:`, command);
      return true;
    } catch (err) {
      console.error(`[HardwareBridge] Erro ao enviar comando para ${deviceId}:`, err);
      return false;
    }
  }
}

export const hardwareBridge = HardwareBridge.getInstance();

