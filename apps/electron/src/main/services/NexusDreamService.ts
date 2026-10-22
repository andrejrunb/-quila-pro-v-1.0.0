import { logger } from '../logger';
import * as fs from 'fs';
import * as path from 'path';

export interface ProjectSnapshot {
  phase: string;
  achievements: string[];
  pendingTasks: string[];
  lastUpdate: Date;
}

/**
 * NexusDreamService — Módulo de Consolidação de Memória (Fase 712)
 * Responsável por ler artefatos e "sonhar" (sintetizar) o progresso real do projeto.
 */
export class NexusDreamService {
  private static instance: NexusDreamService;
  private artifactPath: string;

  private constructor() {
    this.artifactPath = process.env.AQUILA_ARTIFACT_DIR || '';
  }

  public static getInstance(): NexusDreamService {
    if (!NexusDreamService.instance) {
      NexusDreamService.instance = new NexusDreamService();
    }
    return NexusDreamService.instance;
  }

  /**
   * Executa o Ciclo de Consolidação (Dream Cycle)
   */
  public async performDreamCycle(): Promise<{ success: boolean; snapshot?: ProjectSnapshot }> {
    try {
      logger.info('[Nexus Dream] Iniciando ciclo de consolidação de memória...');

      // 1. Ler Task.md para entender o estado atual
      const taskContent = this.readArtifact('task.md');
      
      // 2. Sintetizar conquistas e pendências (Lógica Heurística V1.0)
      const phase = this.extractCurrentPhase(taskContent);
      const achievements = this.extractListItems(taskContent, true);
      const pendingTasks = this.extractListItems(taskContent, false);

      const snapshot: ProjectSnapshot = {
        phase,
        achievements,
        pendingTasks,
        lastUpdate: new Date()
      };

      logger.info(`[Nexus Dream] Consolidação concluída: Fase ${phase} identificada.`);
      return { success: true, snapshot };
    } catch (error) {
      logger.error(`[Nexus Dream] Falha no ciclo: ${(error as Error).message}`);
      return { success: false };
    }
  }

  private readArtifact(filename: string): string {
    const fullPath = path.join(this.artifactPath, filename);
    if (fs.existsSync(fullPath)) {
      return fs.readFileSync(fullPath, 'utf8');
    }
    return '';
  }

  private extractCurrentPhase(content: string): string {
    const match = content.match(/## Phase ([\d.]+): (.*?)\n/i);
    return match ? `${match[1]} - ${match[2]}` : 'Unknown';
  }

  private extractListItems(content: string, completed: boolean): string[] {
    const pattern = completed ? /- \[x\] (.*)/g : /- \[ \d*\] (.*)/g;
    const items: string[] = [];
    let match;
    while ((match = pattern.exec(content)) !== null) {
      items.push(match[1].trim());
    }
    return items.slice(0, 10); // Limite de 10 itens para o snapshot
  }
}

export const nexusDreamService = NexusDreamService.getInstance();

