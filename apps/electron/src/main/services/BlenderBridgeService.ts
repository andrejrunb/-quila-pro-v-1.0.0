import * as net from 'net';
import { logger } from '../logger';
import { BlenderScripts } from './utils/blender_scripts';

/**
 * BlenderBridgeService
 * Conecta-se via Socket TCP (porta 9876) ao addon blender_mcp_addon.py
 * para orquestrar a visualização do Gêmeo Digital.
 */
export class BlenderBridgeService {
  private static instance: BlenderBridgeService;
  private port = 9876;
  private host = '127.0.0.1';

  private constructor() {}

  public static getInstance(): BlenderBridgeService {
    if (!BlenderBridgeService.instance) {
      BlenderBridgeService.instance = new BlenderBridgeService();
    }
    return BlenderBridgeService.instance;
  }

  /**
   * Função genérica para enviar script Python ao Blender MCP.
   */
  private async sendScript(pythonScript: string): Promise<boolean> {
    return new Promise((resolve) => {
      const client = new net.Socket();
      client.setTimeout(2000);

      client.connect(this.port, this.host, () => {
        const payload = JSON.stringify({ script: pythonScript });
        client.write(payload);
      });

      client.on('data', (data) => {
        logger.info(`[BlenderBridge] Resposta: ${data.toString()}`);
        client.destroy();
        resolve(true);
      });

      client.on('timeout', () => {
        logger.warn('[BlenderBridge] Timeout ao contatar o Blender MCP Server.');
        client.destroy();
        resolve(false);
      });

      client.on('error', (err) => {
        logger.error(`[BlenderBridge] Erro de conexão (O Blender está aberto na porta 9876?): ${err.message}`);
        resolve(false);
      });
    });
  }

  /**
   * Reseta o ambiente simulado do Blender e carrega as paredes genéricas
   * se nenhum .blend estiver aberto.
   */
  public async initializeEnvironment(): Promise<boolean> {
    logger.info('[BlenderBridge] Inicializando ambiente Gêmeo Digital...');
    const script = BlenderScripts.clearScene + '\n' + BlenderScripts.generatePlaceholderEnvironment;
    return this.sendScript(script);
  }

  /**
   * Renderiza a câmera simulada no espaço 3D para auditoria.
   */
  public async simulateCamera(id: string, x: number, y: number, z: number, type: string): Promise<boolean> {
    logger.info(`[BlenderBridge] Posicionando câmera ${id} (${type}) em [${x}, ${y}, ${z}] no Blender.`);
    const script = BlenderScripts.clearScene + '\n' + BlenderScripts.generatePlaceholderEnvironment + '\n' + BlenderScripts.spawnCamera(id, x, y, z, type);
    return this.sendScript(script);
  }
}

export const blenderBridgeService = BlenderBridgeService.getInstance();
