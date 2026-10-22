import { app } from 'electron';
import * as path from 'path';

/**
 * SovereignRegistry
 * Gerencia o ciclo de vida e a injeção de dependência dos serviços Áquila Pro (v1.0.0).
 * Implementa Lazy Loading para otimizar o consumo de recursos (Heap/CPU).
 */
export class SovereignRegistry {
  private static instance: SovereignRegistry;
  private instances: Map<string, any> = new Map();
  private _mainWindow: Electron.BrowserWindow | null = null;
  private _db: any = null;

  private constructor() {}

  public static getInstance(): SovereignRegistry {
    if (!SovereignRegistry.instance) {
      SovereignRegistry.instance = new SovereignRegistry();
    }
    return SovereignRegistry.instance;
  }

  // Janela Principal
  public setMainWindow(window: Electron.BrowserWindow | null) {
    this._mainWindow = window;
  }

  public getMainWindow(): Electron.BrowserWindow | null {
    return this._mainWindow;
  }

  // Banco de Dados
  public setDatabase(db: any) {
    this._db = db;
  }

  public getDatabase(): any {
    return this._db;
  }

  /**
   * Obtém um serviço específico, instanciando-o se necessário.
   */
  public async getService<T>(serviceName: string, factory: () => Promise<T>): Promise<T> {
    if (!this.instances.has(serviceName)) {
      const instance = await factory();
      this.instances.set(serviceName, instance);
      return instance;
    }
    return this.instances.get(serviceName);
  }

  /**
   * Registro síncrono para instâncias já criadas no boot crítico.
   */
  public registerInstance(name: string, instance: any) {
    this.instances.set(name, instance);
  }

  /**
   * Exporta o contexto para os IPC Handlers via Proxy.
   * Permite que os handlers acessem serviços que ainda não foram instanciados.
   */
  public getContext(): any {
    const self = this;
    return new Proxy({}, {
      get(target, property: string) {
        if (property === 'mainWindow') return self._mainWindow;
        if (property === 'db') return self._db;
        
        // Se já existe uma instância, retorna
        if (self.instances.has(property)) {
          return self.instances.get(property);
        }

        // Se não existe, tentamos instanciar via factory mapeada (Fase 2+)
        // Para simplificar a v1.0.0, assumimos que se não estiver no registry, 
        // o handler receberá undefined e o optional chaining (?.) lidará com isso.
        // O ideal é que o 'orchestrator' registre os factories.
        return undefined;
      }
    });
  }
}

export const sovereignRegistry = SovereignRegistry.getInstance();
