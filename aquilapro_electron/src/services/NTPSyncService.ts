/**
 * NTPSyncService.ts — Item 33
 * Sincroniza o relógio do sistema com servidores NTP para precisão forense.
 * Registra o drift medido para auditoria de timestamps nos logs.
 */

import * as dgram from 'dgram';

const NTP_SERVERS = [
  'pool.ntp.org',
  'time.google.com',
  'time.cloudflare.com',
];

interface NTPResult {
  server: string;
  offset: number;         // Drift em ms (positivo = nosso relógio está atrasado)
  rtt: number;            // Round-trip time em ms
  timestamp: Date;
}

export class NTPSyncService {
  private lastSync: NTPResult | null = null;
  private intervalHandle: NodeJS.Timeout | null = null;

  start(): void {
    if (this.intervalHandle) return;
    this.sync();
    // Sincroniza a cada 30 minutos
    this.intervalHandle = setInterval(() => this.sync(), 30 * 60 * 1000);
  }

  stop(): void {
    if (this.intervalHandle) {
      clearInterval(this.intervalHandle);
      this.intervalHandle = null;
    }
  }

  getLastSync(): NTPResult | null { return this.lastSync; }

  async sync(): Promise<NTPResult | null> {
    for (const server of NTP_SERVERS) {
      try {
        const result = await this._queryNTP(server);
        this.lastSync = result;
        console.log(`[NTPSync] Sincronizado com ${server}. Drift: ${result.offset.toFixed(0)}ms, RTT: ${result.rtt.toFixed(0)}ms`);

        if (Math.abs(result.offset) > 30_000) {
          console.warn(`[NTPSync] ⚠ Drift elevado: ${result.offset.toFixed(0)}ms. Considere sincronizar o relógio do sistema.`);
        }

        return result;
      } catch {
        console.warn(`[NTPSync] Falha com ${server}, tentando próximo...`);
      }
    }
    return null;
  }

  private _queryNTP(server: string): Promise<NTPResult> {
    return new Promise((resolve, reject) => {
      const client = dgram.createSocket('udp4');
      const NTP_PORT = 123;

      const packet = Buffer.alloc(48);
      packet[0] = 0b00_100_011; // LI=0, VN=4, Mode=3 (client)

      const t1 = Date.now();

      client.send(packet, NTP_PORT, server, (err) => {
        if (err) {
          client.close();
          reject(err);
          return;
        }

        const timeout = setTimeout(() => {
          client.close();
          reject(new Error(`Timeout ao contactar ${server}`));
        }, 5000);

        client.on('message', (msg) => {
          clearTimeout(timeout);
          const t4 = Date.now();

          // Extrair timestamp de transmissão do servidor (bytes 40-43 = segundos since 1900)
          const ntpEpochSeconds = msg.readUInt32BE(40);
          const SECONDS_1900_TO_1970 = 2208988800;
          const serverTime = (ntpEpochSeconds - SECONDS_1900_TO_1970) * 1000;

          const offset = serverTime - (t1 + t4) / 2;
          const rtt = t4 - t1;

          client.close();
          resolve({ server, offset, rtt, timestamp: new Date(serverTime) });
        });
      });
    });
  }
}
