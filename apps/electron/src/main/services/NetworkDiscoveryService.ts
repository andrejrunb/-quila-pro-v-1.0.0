import { exec } from 'child_process';
import { promisify } from 'util';
import { IoTDevice } from '../../services/IoTTypes';

const execAsync = promisify(exec);

/**
 * Service to discover devices on the local network.
 * Uses 'arp -a' on Windows to find active MAC/IP mappings.
 */
export class NetworkDiscoveryService {
  /**
   * Scans the local network for devices.
   */
  public async scan(): Promise<IoTDevice[]> {
    try {
      // Step 1: Active "Ping Sweep" (Disabled for performance and stability on varying PS versions)
      // We directly use arp -a which provides immediate results from the local network cache
      console.log('[NetworkDiscovery] Fetching local network cache (arp -a)...');

      // Step 2: arp -a works on Windows/macOS/Linux (mostly)
      const { stdout } = await execAsync('arp -a');
      return this.parseArpOutput(stdout);
    } catch (error) {
      console.error('[NetworkDiscovery] Failed to scan network:', error);
      return [];
    }
  }

  /**
   * Parses the output of 'arp -a' into IoTDevice objects.
   */
  private parseArpOutput(output: string): IoTDevice[] {
    const devices: IoTDevice[] = [];
    const lines = output.split('\n');

    // Windows usually output: Interface: 192.168.1.5 --- 0x12
    // Internet Address      Physical Address      Type
    // 192.168.1.1           00-00-00-00-00-00     dynamic
    
    // Simple regex for IP and MAC
    const ipMacRegex = /(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})\s+([0-9a-fA-F:-]{12,17})/i;

    for (const line of lines) {
      const match = line.match(ipMacRegex);
      if (match) {
        const ip = match[1];
        const mac = match[2].toUpperCase().replace(/-/g, ':');

        // Filter out broadcast and multicast if needed, but for now we keep all
        if (ip.endsWith('.255') || ip.startsWith('224.') || ip.startsWith('239.')) continue;

        devices.push({
          id: `net-${mac.replace(/:/g, '')}`,
          name: `Device (${ip})`,
          type: 'network',
          status: 'online',
          lastSync: Date.now(),
          ipAddress: ip,
        });
      }
    }

    return devices;
  }
}

export const networkDiscoveryService = new NetworkDiscoveryService();

