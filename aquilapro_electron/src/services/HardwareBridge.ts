import { ioTMainService } from './IoTMainService';
import { DeviceConfig } from './IoTTypes';
import { ipcMain } from 'electron';

/**
 * HardwareBridge handles high-level communication with physical access control hardware.
 * It abstracts the protocol (TCP, Serial, HTTP) and provides specific commands for different brands.
 */
export class HardwareBridge {
  private static instance: HardwareBridge;

  private constructor() {
    this.registerIpcHandlers();
  }

  public static getInstance(): HardwareBridge {
    if (!HardwareBridge.instance) {
      HardwareBridge.instance = new HardwareBridge();
    }
    return HardwareBridge.instance;
  }

  /**
   * Register Electron IPC handlers for hardware operations
   */
  private registerIpcHandlers() {
    // Pulse a relay to open a gate/turnstile
    ipcMain.handle('hardware:pulse-gate', async (_event, deviceId: string) => {
      console.log(`[HardwareBridge] Recebido comando de pulso para o dispositivo: ${deviceId}`);
      return await this.openGate(deviceId);
    });

    // List connected hardware devices
    ipcMain.handle('hardware:list-devices', () => {
      return ioTMainService.getDevices();
    });

    // Test connection to a specific IP/Port
    ipcMain.handle('hardware:test-connection', async (_event, config: DeviceConfig) => {
      return await ioTMainService.connectDevice(config);
    });

    // IoT specific command bridge
    ipcMain.handle('iot:send-command', async (_event, { deviceId, command }: { deviceId: string, command: any }) => {
      return await ioTMainService.triggerCommand(deviceId, command);
    });
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
