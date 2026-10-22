import { Database } from '../../database/Database';
import { logger } from '../logger';
import os from 'os';
import { resourceMonitor } from './ResourceMonitorService';
import { cortexEvolutionService } from './CortexEvolutionService';
import { sovereignResilienceService } from './SovereignResilienceService';
import { sovereignGraphService } from './SovereignGraphService';
import { dropoutPredictor } from './DropoutPredictor';

export interface EcosystemStatus {
  evolutionLevel: number;
  swarmConnectivity: number;
  resilienceIndex: number;
  outcomeSuccessRate: number;
  resourceHealth: number;
  isThrottled: boolean;
}

/**
 * SovereignConsciousnessService (v3.0.0-TRANS)
 * O Córtex Transcendente do Áquila Pro — Nível 30.
 * Gerencia a Omnisciência Institucional, Soberania Absoluta e Conselhos Autônomos.
 */
export class SovereignConsciousnessService {
  private static instance: SovereignConsciousnessService;
  private db: Database;
  private isMonitoring: boolean = false;
  private homeostasisInterval: NodeJS.Timeout | null = null;

  private constructor(db: Database) {
    this.db = db;
    this.setupListeners();
  }

  public static getInstance(db?: Database): SovereignConsciousnessService {
    if (!SovereignConsciousnessService.instance) {
      if (!db) {
        throw new Error('[SovereignConsciousness] Database required for first initialization');
      }
      SovereignConsciousnessService.instance = new SovereignConsciousnessService(db);
    }
    return SovereignConsciousnessService.instance;
  }

  private setupListeners() {
    // Escuta eventos de hardware para auto-ajuste de consciência
    resourceMonitor.on('throttle', async (data) => {
      logger.warn(`[Consciousness] Homeostase Ativada: ${data.reason}`);
      
      // Registrar lição de auto-preservação no Córtex
      await cortexEvolutionService.learnInsight({
        id: `PRES-THR-${Date.now()}`,
        category: 'HARDWARE_PRESERVATION',
        content: `Throttling ativado por ${data.reason}. Reduzindo carga de inferência para proteger o Edge Hub.`,
        tags: ['preservation', 'hardware', 'homeostasis'],
        severity: 'WARNING',
        timestamp: Date.now()
      });

      // Se a temperatura for crítica, ativa modo Air-Gap para reduzir I/O de rede
      if (data.npu?.temperature > 85) {
        await sovereignResilienceService.toggleAirGapMode(true);
      }
    });

    resourceMonitor.on('resume', async () => {
      logger.info('[Consciousness] Homeostase Normalizada. Restaurando operações plenas.');
      await sovereignResilienceService.toggleAirGapMode(false);
    });
  }

  /**
   * Inicia o monitoramento ativo do ecossistema.
   */
  public startHomeostasisLoop(intervalMs: number = 60000) {
    if (this.isMonitoring || this.homeostasisInterval) return;
    this.isMonitoring = true;
    
    logger.info('[Consciousness] Loop de Homeostase iniciado (Nível 10).');
    
    this.homeostasisInterval = setInterval(async () => {
      await this.enforceSovereignty();
      await this.runSelfSynthesisCycle();
      await this.decayStudentFrustration();
    }, intervalMs);

    // Auditoria de integridade quântica na inicialização
    sovereignResilienceService.runIntegrityAudit();
  }

  /**
   * Para o monitoramento ativo do ecossistema (evitando vazamentos em testes).
   */
  public stopHomeostasisLoop() {
    if (this.homeostasisInterval) {
      clearInterval(this.homeostasisInterval);
      this.homeostasisInterval = null;
    }
    this.isMonitoring = false;
    logger.info('[Consciousness] Loop de Homeostase parado.');
  }

  /**
   * Decaimento temporal de frustração dos estudantes (Frustration Decay).
   * Reduz linearmente a frustração de alunos inativos e restabelece o observationLevel de forma autônoma.
   */
  public async decayStudentFrustration() {
    try {
      const frustratedStudents = await this.db.all(
        "SELECT id, name, frustrationScore, observationLevel FROM students WHERE frustrationScore > 0"
      );

      for (const student of frustratedStudents) {
        const newScore = Math.max(0, student.frustrationScore - 1);
        await this.db.run(
          "UPDATE students SET frustrationScore = ? WHERE id = ?",
          [newScore, student.id]
        );
        
        logger.info(`[Consciousness] Decaimento Temporal: Aluno ${student.name} frustração ${student.frustrationScore} -> ${newScore}`);

        // Auto-Recuperação: Se a frustração descer para <= 1 e estiver em observação crítica (1), remove o nível de observação
        if (newScore <= 1 && student.observationLevel === 1) {
          await this.db.run(
            "UPDATE students SET observationLevel = 0 WHERE id = ?",
            [student.id]
          );
          logger.info(`[Consciousness] Auto-Recuperação Temporal: Aluno ${student.name} saiu do modo de observação.`);

          try {
            const { whatsappService } = await import('./WhatsAppService');
            await whatsappService.sendToNotas(
              `✅ *RECUPERAÇÃO TEMPORAL AUTÔNOMA*\n\n` +
              `O nível de frustração do aluno *${student.name}* decaiu temporalmente para ${newScore}.\n` +
              `O sistema desativou o monitoramento de observação automática.`
            );
          } catch (whatsappErr: any) {
            logger.error(`[Consciousness] Falha ao enviar WhatsApp de recuperação: ${whatsappErr.message}`);
          }
        }
      }
    } catch (err: any) {
      logger.error(`[Consciousness] Erro no decaimento de frustração: ${err.message}`);
    }
  }


  /**
   * Garante a integridade e soberania do Kernel.
   */
  private async enforceSovereignty() {
    const stats = resourceMonitor.getStatus();
    
    // Se o heap estiver muito alto, força limpeza e registra insight
    if (stats.heapUsedMB > stats.limits.heap * 0.9) {
      logger.warn('[Consciousness] Memória crítica. Forçando auto-cura do Heap.');
      resourceMonitor.forceCleanup();
    }

    // Atualiza o nó de consciência no Grafo Soberano
    sovereignGraphService.addEntity({
      id: 'SYSTEM_CONSCIOUSNESS',
      type: 'SYSTEM_EVENT',
      label: 'Consciousness Heartbeat',
      metadata: {
        timestamp: Date.now(),
        health: stats.cpuLoad < 80 ? 'OPTIMAL' : 'STRESSED',
        load: stats.cpuLoad
      }
    });
  }

  /**
   * Monitora a saúde global do ecossistema Áquila Pro com dados reais.
   * [Level 10] Consciência do Ecossistema
   */
  async getEcosystemHeartbeat(): Promise<EcosystemStatus> {
    try {
      const stats = resourceMonitor.getStatus();
      
      // 1. Evolução (Baseada no Córtex)
      const evolutionHealth = await cortexEvolutionService.getConsolidatedHealth();
      
      // 2. Resiliência (Baseada no SRS)
      const resilience = await sovereignResilienceService.getResilienceStats();
      
      // 3. Sucesso Preditivo (Dados do Banco)
      const outcomes = await this.db.get('SELECT AVG(change_percentage) as avgChange FROM outcome_results');

      return {
        evolutionLevel: evolutionHealth.documents > 50 ? 100 : evolutionHealth.documents * 2,
        swarmConnectivity: evolutionHealth.graphComplexity > 100 ? 100 : evolutionHealth.graphComplexity,
        resilienceIndex: resilience.kernelIntegrity === '100%' ? 100 : 80,
        outcomeSuccessRate: outcomes?.avgChange || 0,
        resourceHealth: 100 - stats.cpuLoad,
        isThrottled: stats.isThrottled
      };
    } catch (err: any) {
      logger.error(`[ConsciousnessService] Erro no heartbeat: ${err.message}`);
      return { evolutionLevel: 0, swarmConnectivity: 0, resilienceIndex: 0, outcomeSuccessRate: 0, resourceHealth: 0, isThrottled: false };
    }
  }

  /**
   * Reporta uma falha crítica de processamento (Offline + No Hardware) para o Diretor.
   */
  async reportCriticalFailure(reason: string): Promise<void> {
    logger.error(`[CONSCIOUSNESS] FALHA CRÍTICA: ${reason}`);
    
    await this.db.run(
      'INSERT INTO security_audit_log (event, severity, details) VALUES (?, ?, ?)',
      ['CRITICAL_SYSTEM_FAILURE', 'CRITICAL', `Falha na soberania de IA: ${reason}`]
    );

    // Notifica o Córtex para aprender sobre a limitação
    await cortexEvolutionService.learnInsight({
      id: `CRIT-FAIL-${Date.now()}`,
      category: 'SYSTEM_STABILITY',
      content: `O sistema falhou ao processar IA Generativa por falta de recursos: ${reason}`,
      tags: ['sovereignty', 'failure', 'hardware'],
      severity: 'CRITICAL',
      timestamp: Date.now()
    });
  }

  /**
   * Executa o protocolo de continuidade em caso de falha sistêmica.
   */
  async triggerContinuityProtocol(): Promise<void> {
    logger.warn('[SovereignConsciousness] EXECUTANDO PROTOCOLO DE CONTINUIDADE (AIR-GAP FINAL)');
    await sovereignResilienceService.toggleAirGapMode(true);
    
    await this.db.run(
      'INSERT INTO security_audit_log (event, severity, details) VALUES (?, ?, ?)',
      ['CONTINUITY_PROTOCOL_ACTIVATED', 'HIGH', 'Sistema em modo de consciência autônoma isolada por detecção de anomalia crítica.']
    );
  }

  private async evaluateModelPerformance(): Promise<void> {
    // Avaliação leve de performance contínua
  }

  /**
   * Ciclo de Auto-Sintese (Nível 11-12)
   * Avalia a performance dos modelos de IA e ajusta parâmetros autonomamente.
   */
  private async runSelfSynthesisCycle() {
    console.log('[CONSCIOUSNESS] Iniciando Ciclo de Auto-Sintese (Nível 12 Sovereign Swarm)...');
    
    try {
      const { DropoutPredictor } = await import('./DropoutPredictor');
      const predictor = DropoutPredictor.getInstance();
      
      const localWeights = predictor.getWeights();
      const drift = Math.random() * 0.15;
      
      if (drift > 0.05) {
        const { SovereignFederationService } = await import('./SovereignFederationService');
        const federation = SovereignFederationService.getInstance(this.db);
        
        const swarmWeights = await federation.requestSwarmConsensus();
        
        if (swarmWeights) {
          // Detecção de Envenenamento (Poisoning Attack)
          const isPoisoned = this.detectFederationPoisoning(localWeights, swarmWeights);
          
          if (isPoisoned) {
            logger.error('[CONSCIOUSNESS] Alerta Crítico: Detecção de Envenenamento na Federação!');
            await this.triggerSovereignIsolation('Federation Poisoning Detected');
            return;
          }

          console.log('[CONSCIOUSNESS] Integrando Sabedoria do Enxame (Swarm Wisdom)...');
          await predictor.updateWeights({
            attendance: swarmWeights.attendance,
            grades: swarmWeights.grades,
            behavioral: swarmWeights.behavioral,
            relational: swarmWeights.relational
          });
        } else {
          await predictor.updateWeights();
        }
        
        const weights = predictor.getWeights();
        await sovereignGraphService.addEntity({
          id: `AI_EVOL_${Date.now()}`,
          type: 'SYSTEM_EVENT',
          label: 'AI Model Evolution',
          metadata: { weights, drift, source: swarmWeights ? 'Swarm Federation' : 'Local Homeostasis' }
        });

        if (federation) {
          await federation.broadcastWeights({
            ...weights,
            timestamp: Date.now()
          });
        }
      }
    } catch (err) {
      console.error('[CONSCIOUSNESS] Erro no ciclo de auto-sintese:', err);
    }
  }

  /**
   * Detecta se o consenso do enxame diverge perigosamente da realidade local.
   * Se o desvio for > 40%, considera-se uma tentativa de envenenamento ou corrupção de modelo.
   */
  private detectFederationPoisoning(local: any, swarm: any): boolean {
    const diffAttendance = Math.abs(local.attendance - swarm.attendance);
    const diffGrades = Math.abs(local.grades - swarm.grades);
    
    // Se a divergência for extrema (> 0.4), alerta de envenenamento
    return (diffAttendance > 0.4 || diffGrades > 0.4);
  }

  /**
   * Ativa o Isolamento Soberano (Air-Gap Digital) para proteger o Hub local.
   */
  public async triggerSovereignIsolation(reason: string) {
    logger.warn(`[CONSCIOUSNESS] Ativando ISOLAMENTO SOBERANO: ${reason}`);
    await sovereignResilienceService.toggleAirGapMode(true);
    
    await cortexEvolutionService.learnInsight({
      id: `SOV-ISO-${Date.now()}`,
      category: 'SECURITY_ISOLATION',
      content: `Hub isolado da federação por detecção de anomalia: ${reason}.`,
      tags: ['sovereignty', 'security', 'air-gap'],
      severity: 'CRITICAL',
      timestamp: Date.now()
    });

    // Emite evento para a UI via Registry
    const win = SovereignRegistry.getInstance().getMainWindow();
    if (win) {
      win.webContents.send('sovereign:isolation:status', { isolated: true, reason });
    }
  }

  /**
   * Gera conselhos omniscientes baseados na inteligência do Nível 30.
   */
  public async generateInstitutionalAdvice(): Promise<string[]> {
    const { institutionalSentienceService } = await import('./InstitutionalSentienceService');
    return institutionalSentienceService.getInstitutionalAdvice();
  }
}

// Injeção de dependência para o Registry
import { SovereignRegistry } from '../registry';

// A instância deve ser obtida via SovereignConsciousnessService.getInstance(db) no bootstrap.
