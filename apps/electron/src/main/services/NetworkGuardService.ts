import { exec, spawn } from 'child_process';
import * as path from 'path';
import { app } from 'electron';

export interface NetworkGuardStatus {
  success: boolean;
  active: boolean;
  dockerInstalled: boolean;
  containerId?: string;
  status?: string;
  error?: string;
}

export class NetworkGuardService {
  private static instance: NetworkGuardService;
  private isProcessing = false;

  private constructor() {}

  public static getInstance(): NetworkGuardService {
    if (!NetworkGuardService.instance) {
      NetworkGuardService.instance = new NetworkGuardService();
    }
    return NetworkGuardService.instance;
  }

  /**
   * Verifica se o Docker e o Docker Compose estão instalados no host
   */
  public checkDockerInstalled(): Promise<boolean> {
    return new Promise((resolve) => {
      exec('docker --version', (err) => {
        resolve(!err);
      });
    });
  }

  /**
   * Obtém o status do contêiner do Pi-hole (Network Guard)
   */
  public async getStatus(): Promise<NetworkGuardStatus> {
    const dockerInstalled = await this.checkDockerInstalled();
    if (!dockerInstalled) {
      return { success: true, active: false, dockerInstalled: false, error: 'Docker não está instalado no host.' };
    }

    return new Promise((resolve) => {
      exec('docker ps -a --filter name=aquila-network-guard --format "{{.ID}}|{{.Status}}|{{.Names}}"', (err, stdout) => {
        if (err || !stdout.trim()) {
          resolve({ success: true, active: false, dockerInstalled: true, status: 'Não Instalado/Criado' });
          return;
        }

        const parts = stdout.trim().split('|');
        const active = parts[1].toLowerCase().includes('up');
        resolve({
          success: true,
          active,
          dockerInstalled: true,
          containerId: parts[0],
          status: parts[1]
        });
      });
    });
  }

  /**
   * Inicia o contêiner do Pi-hole usando docker-compose
   */
  public async startGuard(): Promise<{ success: boolean; error?: string }> {
    if (this.isProcessing) return { success: false, error: 'Operação em andamento.' };
    this.isProcessing = true;

    const dockerInstalled = await this.checkDockerInstalled();
    if (!dockerInstalled) {
      this.isProcessing = false;
      return { success: false, error: 'Docker necessário para rodar o Network Guard.' };
    }

    return new Promise((resolve) => {
      const composeDir = path.join(app.getAppPath(), '..', 'packages', 'network-guard');
      
      exec('docker compose up -d', { cwd: composeDir }, (err, stdout, stderr) => {
        this.isProcessing = false;
        if (err) {
          console.error('[NETWORK_GUARD] Erro ao iniciar Pi-hole:', stderr || err.message);
          resolve({ success: false, error: stderr || err.message });
        } else {
          console.log('[NETWORK_GUARD] Pi-hole iniciado com sucesso.');
          resolve({ success: true });
        }
      });
    });
  }

  /**
   * Para o contêiner do Pi-hole usando docker-compose
   */
  public async stopGuard(): Promise<{ success: boolean; error?: string }> {
    if (this.isProcessing) return { success: false, error: 'Operação em andamento.' };
    this.isProcessing = true;

    return new Promise((resolve) => {
      const composeDir = path.join(app.getAppPath(), '..', 'packages', 'network-guard');
      
      exec('docker compose down', { cwd: composeDir }, (err, stdout, stderr) => {
        this.isProcessing = false;
        if (err) {
          console.error('[NETWORK_GUARD] Erro ao parar Pi-hole:', stderr || err.message);
          resolve({ success: false, error: stderr || err.message });
        } else {
          console.log('[NETWORK_GUARD] Pi-hole interrompido.');
          resolve({ success: true });
        }
      });
    });
  }
}

export const networkGuardService = NetworkGuardService.getInstance();
