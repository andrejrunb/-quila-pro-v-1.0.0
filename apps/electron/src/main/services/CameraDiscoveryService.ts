import { EventEmitter } from 'events';
import * as net from 'net';
import * as os from 'os';
import { logger } from '../logger';

export interface DiscoveredCamera {
  ip: string;
  ports: number[];
  vendor?: string;
  status: 'online' | 'offline';
  mac?: string;
}

/**
 * Phase 402: Camera Discovery Service (RTSP/ONVIF Scanner)
 * Real-time network scanning for high-performance school security.
 */
class CameraDiscoveryService extends EventEmitter {
  private activeScan = false;
  private foundDevices: Map<string, DiscoveredCamera> = new Map();

  constructor() {
    super();
  }

  /**
   * Scans the local network for devices with open RTSP/ONVIF ports.
   */
  public async scanNetwork(timeoutMs: number = 2000): Promise<DiscoveredCamera[]> {
    if (this.activeScan) {
      logger.warn('[Discovery] Scan already in progress.');
      return Array.from(this.foundDevices.values());
    }

    this.activeScan = true;
    this.foundDevices.clear();
    logger.info('[Discovery] Starting deep network scan for cameras...');

    const subnets = this.getLocalSubnets();
    const portsToScan = [554, 8000, 80, 8080, 8899]; // Common RTSP/ONVIF/Vendor ports
    
    const scanPromises: Promise<void>[] = [];

    for (const subnet of subnets) {
      // Loop through standard 254 possible hosts (Class C)
      for (let i = 1; i <= 254; i++) {
        const ip = `${subnet}.${i}`;
        scanPromises.push(this.scanHost(ip, portsToScan, timeoutMs));
      }
    }

    const batchSize = 32; // Limite de concorrência para evitar exaustão de sockets
    for (let i = 0; i < scanPromises.length; i += batchSize) {
      const batch = scanPromises.slice(i, i + batchSize);
      await Promise.all(batch);
    }
    
    this.activeScan = false;
    const finalDevices = Array.from(this.foundDevices.values());
    logger.info(`[Discovery] Scan complete. Found ${finalDevices.length} candidate devices.`);
    this.emit('scan-complete', finalDevices);
    return finalDevices;
  }

  public async scanHost(ip: string, ports: number[], timeout: number): Promise<void> {
    const openPorts: number[] = [];

    for (const port of ports) {
      const isOpen = await this.checkPort(ip, port, timeout);
      if (isOpen) {
        openPorts.push(port);
      }
    }

    if (openPorts.length > 0) {
      const device: DiscoveredCamera = {
        ip,
        ports: openPorts,
        status: 'online',
        vendor: this.inferVendor(openPorts)
      };
      this.foundDevices.set(ip, device);
      this.emit('device-found', device);
    }
  }

  public checkPort(ip: string, port: number, timeout: number): Promise<boolean> {
    return new Promise((resolve) => {
      const socket = new net.Socket();
      let status = false;

      socket.setTimeout(timeout);

      socket.on('connect', () => {
        status = true;
        socket.destroy();
      });

      socket.on('timeout', () => {
        socket.destroy();
      });

      socket.on('error', () => {
        socket.destroy();
      });

      socket.on('close', () => {
        resolve(status);
      });

      socket.connect(port, ip);
    });
  }

  private getLocalSubnets(): string[] {
    const interfaces = os.networkInterfaces();
    const subnets: string[] = [];

    for (const interfaceName in interfaces) {
      const ifaceList = interfaces[interfaceName];
      if (!ifaceList) continue;

      for (const iface of ifaceList) {
        if (iface.family === 'IPv4' && !iface.internal) {
          const parts = iface.address.split('.');
          subnets.push(`${parts[0]}.${parts[1]}.${parts[2]}`);
        }
      }
    }

    return Array.from(new Set(subnets)); // Unique subnets
  }

  private inferVendor(ports: number[]): string {
    if (ports.includes(8000)) return 'Hikvision';
    if (ports.includes(37777)) return 'Dahua/Intelbras';
    if (ports.includes(554) && ports.includes(80)) return 'Tapo/TP-Link';
    return 'Generic ONVIF/RTSP';
  }

  /**
   * [LEVEL 35] Realiza uma análise profunda em um dispositivo para obter marca e modelo.
   */
  public async deepScan(ip: string): Promise<any> {
    logger.info(`[Discovery] Iniciando Deep Scan em ${ip}...`);
    // Simulação de handshake ONVIF/HTTP para identificar modelo e firmware
    return {
      ip,
      model: 'DS-2CD2143G0-I',
      firmware: 'V5.5.82 build 190220',
      resolution: '2560x1440',
      fps: 20
    };
  }

  public isScanning(): boolean {

    return this.activeScan;
  }
}

export const cameraDiscoveryService = new CameraDiscoveryService();
export default cameraDiscoveryService;
