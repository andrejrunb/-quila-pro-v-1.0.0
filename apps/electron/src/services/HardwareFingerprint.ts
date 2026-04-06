import * as os from 'os';
import * as crypto from 'crypto';

/**
 * HardwareFingerprint.ts — Passo 61 do Roadmap.
 * Gera uma identidade única para a máquina física baseada em CPU e Rede.
 */
export class HardwareFingerprint {
    public static getFingerprint(): string {
        const cpus = os.cpus();
        const network = os.networkInterfaces();
        
        // Fatores de unicidade: Modelo da CPU + MAC Address (primeiro disponível)
        const cpuModel = cpus[0]?.model || 'unknown-cpu';
        const totalMem = os.totalmem();
        
        let mac = '00:00:00:00:00:00';
        for (const name of Object.keys(network)) {
            const iface = network[name];
            if (iface) {
                const found = iface.find(i => !i.internal && i.mac !== '00:00:00:00:00:00');
                if (found) {
                    mac = found.mac;
                    break;
                }
            }
        }

        const rawData = `${cpuModel}|${totalMem}|${mac}`;
        return crypto.createHash('sha256').update(rawData).digest('hex');
    }

    public static verify(storedFingerprint: string): boolean {
        return this.getFingerprint() === storedFingerprint;
    }
}
