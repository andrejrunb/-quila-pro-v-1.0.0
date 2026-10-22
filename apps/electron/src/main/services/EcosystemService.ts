import * as fs from 'fs';
import * as path from 'path';
import { app } from 'electron';
import { LicenseManager } from './LicenseManager';
import { npuOptimizer } from './NpuOptimizationService_V2';

export interface EcosystemState {
  aiProvider: 'cloud' | 'sovereign';
  isHardwareCapable: boolean;
  activeModules: {
    hr: boolean;
    secretary: boolean;
    attendance: boolean;
    messenger: boolean;
    gamification: boolean;
  };
}

export class EcosystemService {
  private static instance: EcosystemService;
  private state: EcosystemState;
  private readonly configPath: string;
  private readonly userDataPath: string;

  private constructor() {
    let userDataPath: string;
    try {
      userDataPath = app.getPath('userData');
    } catch (e) {
      userDataPath = process.env.AQUILA_USER_DATA_OVERRIDE || path.join(process.cwd(), 'userData');
    }
    this.userDataPath = userDataPath;
    this.configPath = path.join(userDataPath, 'ecosystem_config.json');
    this.state = this.loadState();
    this.detectHardwareAndOptimize();
  }

  static getInstance(): EcosystemService {
    if (!EcosystemService.instance) {
      EcosystemService.instance = new EcosystemService();
    }
    return EcosystemService.instance;
  }

  private loadState(): EcosystemState {
    const defaultState: EcosystemState = {
      aiProvider: 'cloud',
      isHardwareCapable: false,
      activeModules: {
        hr: true,
        secretary: true,
        attendance: true,
        messenger: false,
        gamification: false
      }
    };

    if (fs.existsSync(this.configPath)) {
      try {
        const data = fs.readFileSync(this.configPath, 'utf-8');
        return { ...defaultState, ...JSON.parse(data) };
      } catch (err) {
        console.error('[EcosystemService] Erro ao carregar config:', err);
      }
    }
    return defaultState;
  }

  private saveState(): void {
    try {
      fs.writeFileSync(this.configPath, JSON.stringify(this.state, null, 2), 'utf-8');
    } catch (err) {
      console.error('[EcosystemService] Erro ao salvar config:', err);
    }
  }

  private async detectHardwareAndOptimize() {
    try {
      const hwStatus = await npuOptimizer.detectHardware();
      const isCapable = hwStatus.npu_detected || hwStatus.gpu_detected;
      
      this.state.isHardwareCapable = isCapable;
      console.log(`[EcosystemService] Hardware detectado: NPU=${hwStatus.npu_detected}, GPU=${hwStatus.gpu_detected}. Capaz de Sovereign: ${isCapable}`);
      
      // Decisão 1: Se detectarmos NPU/GPU, ativamos Sovereign automaticamente (Sovereign-First Policy)
      if (isCapable && this.state.aiProvider === 'cloud') {
        console.log('[EcosystemService] NPU/GPU Detectada. Ativando modo Sovereign automaticamente para máxima privacidade.');
        this.state.aiProvider = 'sovereign';
        this.saveState();
      }
    } catch (err) {
      console.error('[EcosystemService] Erro na detecção de hardware:', err);
    }
  }

  // Decisão 2: Utilitário para verificar se o hardware suporta fallback local
  canFallbackToSovereign(): boolean {
    return this.state.isHardwareCapable;
  }

  getState(): EcosystemState {
    // Cruza o estado desejado com as permissões da licença
    const license = LicenseManager.getInstance(this.userDataPath);
    const limits = license.getLimits();

    return {
      ...this.state,
      activeModules: {
        hr: this.state.activeModules.hr && limits.hrEnabled,
        secretary: this.state.activeModules.secretary && limits.secretaryEnabled,
        attendance: this.state.activeModules.attendance, // Sempre ativo por padrão no core
        messenger: this.state.activeModules.messenger && limits.messengerEnabled,
        gamification: this.state.activeModules.gamification && limits.gamificationEnabled,
      }
    };
  }

  updateState(newState: Partial<EcosystemState>): EcosystemState {
    this.state = { ...this.state, ...newState };
    this.saveState();
    return this.getState();
  }

  setAIProvider(provider: 'cloud' | 'sovereign'): EcosystemState {
    this.state.aiProvider = provider;
    this.saveState();
    return this.getState();
  }

  toggleModule(moduleId: keyof EcosystemState['activeModules']): EcosystemState {
    this.state.activeModules[moduleId] = !this.state.activeModules[moduleId];
    this.saveState();
    return this.getState();
  }
}
