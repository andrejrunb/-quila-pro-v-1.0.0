/**
 * Step 131 — IoTService (Renderer Process)
 * Gerencia a comunicação com hardware físico via IPC.
 */
import { IoTDevice } from '../../services/IotTypes';

class IoTService {
  private devices: IoTDevice[] = [];

  constructor() {
    this.init();
  }

  private async init() {
    if (typeof window === 'undefined') return;
    
    // Escutar atualizações vindas do Main Process
    const api = (window as any).aquila;
    if (api?.on) {
      api.on('iot:devices-updated', (updatedDevices: IoTDevice[]) => {
        this.devices = updatedDevices;
      });
    }
  }


  public async triggerCommand(deviceId: string, command: 'open' | 'close' | 'reset') {
    if (typeof window === 'undefined') return { success: false, error: 'Main process cannot trigger UI commands directly' };
    
    const api = (window as any).aquila;
    if (api?.invoke) {
      return await api.invoke('iot:send-command', { deviceId, command });
    }
    return { success: false, error: 'IPC API not available' };
  }

  public async openGate(deviceId: string) {
    return this.triggerCommand(deviceId, 'open');
  }

  public async lockByPoiType(poiType: string) {
    if (typeof window === 'undefined') return;
    const api = (window as any).aquila;
    if (api?.invoke) {
      return await api.invoke('iot:lock-by-type', poiType);
    }
  }

  public async unlockAll() {
    if (typeof window === 'undefined') return;
    const api = (window as any).aquila;
    if (api?.invoke) {
      return await api.invoke('iot:unlock-all');
    }
  }

  public getDevices() {
    return this.devices;
  }
}

export const ioTService = new IoTService();
export default ioTService;

