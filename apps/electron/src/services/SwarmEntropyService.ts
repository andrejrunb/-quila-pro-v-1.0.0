import { nexusSyncService } from "./NexusSyncService";
import { createHash } from 'crypto';

/**
 * SwarmEntropyService (Passos 551-600)
 * -----------------------------------
 * Gera sementes criptográficas baseadas no "jitter" (variação de latência)
 * da comunicação entre nós do enxame.
 */
export class SwarmEntropyService {
  private entropyPool: number[] = [];
  private readonly POOL_SIZE = 256;
  private lastSeed: string = '';

  constructor() {
    this.setupListeners();
  }

  private setupListeners() {
    // Monitora os pulsos do Nexus para capturar o jitter do event loop
    nexusSyncService.on('nexus-pulse', (packet) => {
      const now = Date.now();
      const jitter = now - packet.timestamp; // Diferença em ms (inclui atraso de processamento e loop)
      
      // Capturamos a precisão de microssegundos via process.hrtime para aumentar a entropia
      const hrTime = process.hrtime();
      const microJitter = (hrTime[0] * 1e9 + hrTime[1]) % 1000;
      
      this.entropyPool.push(jitter + microJitter);
      
      if (this.entropyPool.length > this.POOL_SIZE) {
        this.entropyPool.shift();
      }
    });
  }

  /**
   * Gera uma semente criptográfica única baseada no estado atual do enxame.
   */
  public getSwarmSeed(): string {
    if (this.entropyPool.length < 10) {
      return createHash('sha256').update(Math.random().toString()).digest('hex');
    }

    const rawData = this.entropyPool.join('|') + Date.now();
    const seed = createHash('sha256').update(rawData).digest('hex');
    this.lastSeed = seed;
    return seed;
  }

  /**
   * Retorna o nível atual de entropia acumulado.
   */
  public getEntropyLevel(): number {
    return (this.entropyPool.length / this.POOL_SIZE) * 100;
  }

  /**
   * [SQA-ENT-555] Retorna uma semente de 16 caracteres para uso em sessões.
   */
  public getShortSeed(): string {
    return this.getSwarmSeed().substring(0, 16);
  }
}

export const swarmEntropyService = new SwarmEntropyService();
