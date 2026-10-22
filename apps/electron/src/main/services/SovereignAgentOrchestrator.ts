import { portfolioIntelligenceService, DeficitReport } from './PortfolioIntelligenceService';
import { sovereignGraphService } from './SovereignGraphService';
import { db } from '../../database/Database';

/**
 * SovereignAgentOrchestrator (v4000)
 * ---------------------------------
 * O cérebro executivo do Áquila Pro. 
 * Atua como um agente autônomo que monitora a saúde pedagógica da escola
 * e dispara intervenções preventivas baseadas em dados longitudinais.
 */

export interface PedagogicalActionPlan {
  id: string;
  studentId: string;
  type: 'REFORCO' | 'ADAPTACAO' | 'PSICOPEDAGOGICO';
  priority: 'low' | 'medium' | 'high' | 'critical';
  rationale: string;
  suggestedActions: string[];
  status: 'pending' | 'approved' | 'active' | 'completed';
}

class SovereignAgentOrchestrator {
  private static instance: SovereignAgentOrchestrator;
  private isMonitoring: boolean = false;

  private constructor() {}

  public static getInstance(): SovereignAgentOrchestrator {
    if (!SovereignAgentOrchestrator.instance) {
      SovereignAgentOrchestrator.instance = new SovereignAgentOrchestrator();
    }
    return SovereignAgentOrchestrator.instance;
  }

  /**
   * Inicia o ciclo de monitoramento autônomo e governança de hardware.
   */
  public startSovereignGuard() {
    if (this.isMonitoring) return;
    this.isMonitoring = true;
    console.log('[SovereignOrchestrator] Monitoramento Pedagógico Ativo (Sovereign Guard Mode).');
    
    // Escuta eventos de hardware para auto-regulação (v4005)
    import('./ResourceMonitorService').then(({ resourceMonitor }) => {
      resourceMonitor.on('throttle', (data) => {
        if (data.active) {
          console.warn(`[SovereignOrchestrator] Hardware em esforço: ${data.reason}. Entrando em modo 'Pausa Pedagógica'...`);
          // Reduz a prioridade de processamento
        } else {
          console.log('[SovereignOrchestrator] Hardware normalizado. Retomando auditorias plenas.');
        }
      });
    });

    // Ciclo de inspeção a cada 1 hora em produção (ou gatilho baseado em eventos)
    // Se o hardware estiver em throttling, o intervalo é dobrado para economizar NPU
    this.schedulerLoop();
  }

  private async schedulerLoop() {
    if (!this.isMonitoring) return;

    try {
      await this.runEcosystemAudit();
    } catch (err) {
      console.error('[SovereignOrchestrator] Falha crítica na auditoria do ecossistema:', err);
    }
    
    const nextTick = 60000; // Auditoria a cada 1 minuto
    setTimeout(() => this.schedulerLoop(), nextTick);
  }


  private async asyncAudit() {
    try {
      // Busca todos os estudantes ativos
      // [SQA-DB-881] Corrigido para verificar se a tabela existe antes de consultar
      const tableExists = await db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='students'");
      if (!tableExists) {
        console.warn('[SovereignOrchestrator] Tabela students ainda não existe. Pulando auditoria.');
        return;
      }

      const students = await db.all("SELECT id FROM students WHERE status = 'active'");
      
      for (const student of students) {
        try {
          const deficits = await portfolioIntelligenceService.analyzeDeficits(student.id);
          
          for (const deficit of deficits) {
            if (deficit.severity === 'critical' || deficit.severity === 'high') {
              await this.orchestrateIntervention(student.id, deficit);
            }
          }
        } catch (err) {
          console.error(`[SovereignOrchestrator] Erro ao analisar déficits do aluno ${student.id}:`, err);
        }
      }
    } catch (err) {
      console.error('[SovereignOrchestrator] Erro na execução da auditoria assíncrona:', err);
    }
  }

  /**
   * Executa uma auditoria completa no ecossistema de dados da escola.
   */
  private async runEcosystemAudit() {
    console.log('[SovereignOrchestrator] Iniciando auditoria de rotina no Grafo Soberano...');
    // Executa em background para não travar o loop
    this.asyncAudit().catch(e => console.error('[SovereignOrchestrator] AsyncAudit Unhandled:', e));
  }

  /**
   * Orquestra uma intervenção pedagógica baseada em um insight crítico.
   */
  public async orchestrateIntervention(studentId: string, insight: DeficitReport): Promise<PedagogicalActionPlan> {
    console.log(`[SovereignOrchestrator] Orquestrando Intervenção para ${studentId}: ${insight.category}`);

    const planId = `PLAN-${studentId}-${Date.now()}`;
    
    const plan: PedagogicalActionPlan = {
      id: planId,
      studentId,
      type: insight.category === 'academic' ? 'REFORCO' : 'PSICOPEDAGOGICO',
      priority: insight.severity as any,
      rationale: insight.insight,
      suggestedActions: [
        'Agendar reunião com coordenação',
        'Aplicar teste de nivelamento',
        'Sinalizar ao portal dos pais'
      ],
      status: 'pending'
    };

    // Registra o plano no Grafo Soberano (SKG) para rastreabilidade
    sovereignGraphService.addEntity({
      id: planId,
      type: 'PLAN',
      label: 'Plano de Intervenção Pedagógica',
      metadata: {
        ...plan,
        sourceInsight: insight
      }
    });

    // Cria relação no Grafo entre o Plano e o Insight original
    // Nota: addEntity no nosso serviço atual não aceita arestas diretamente no payload simples, 
    // mas o serviço de grafos pode ser estendido ou usamos query direta se necessário.
    
    return plan;
  }
}

export const sovereignAgentOrchestrator = SovereignAgentOrchestrator.getInstance();
