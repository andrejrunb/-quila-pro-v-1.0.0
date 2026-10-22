"use client";

import React, { useEffect, useState } from 'react';
import { EagleCard } from './ui/EagleCard';
import { EliteButton } from './ui/EliteButton';
import { 
  Zap, 
  BrainCircuit, 
  Activity, 
  Clock, 
  ChevronRight, 
  AlertTriangle,
  Lightbulb,
  CheckCircle2
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface PulseInsight {
  id: string;
  type: 'pedagogical_optimization' | 'system_critical' | 'evolutionary_milestone' | 'risk_detected';
  content: string;
  timestamp: string;
  metadata?: any;
}

interface CortexHealth {
  npuLoad: number;
  graphComplexity: number;
  totalInsights: number;
  isLearning: boolean;
}

/**
 * TelemetryPulse - Monitor de Pulso Soberano em Tempo Real.
 * Visualiza as lições aprendidas e o estado do Córtex Evolution.
 */
export const TelemetryPulse: React.FC = () => {
  const [insights, setInsights] = useState<PulseInsight[]>([]);
  const [health, setHealth] = useState<CortexHealth | null>(null);
  const [isLive, setIsLive] = useState(true);
  const [strategy, setStrategy] = useState<any | null>(null);
  const [isLoadingStrategy, setIsLoadingStrategy] = useState(false);

  useEffect(() => {
    // 1. Carregar Estado Inicial
    const loadInitialData = async () => {
      try {
        const [initialPulse, currentHealth] = await Promise.all([
          window.aquila.getRecentPulse(),
          window.aquila.getCortexHealth()
        ]);
        setInsights(initialPulse.reverse()); // Recentes primeiro
        setHealth(currentHealth);
      } catch (err) {
        console.error('[TelemetryPulse] Falha ao carregar dados iniciais:', err);
      }
    };

    loadInitialData();

    // 2. Escutar Atualizações em Tempo Real (Bridge Soberano)
    const cleanup = window.aquila.onCortexPulse((insight: PulseInsight) => {
      setInsights(prev => [insight, ...prev].slice(0, 10)); // Manter top 10
      // Incrementar contagem local para feedback instantâneo
      setHealth(prev => prev ? { ...prev, totalInsights: prev.totalInsights + 1 } : null);
    });

    // 3. Poll de Saúde (a cada 30s para economizar NPU se não estiver em foco total)
    const healthInterval = setInterval(async () => {
      const currentHealth = await window.aquila.getCortexHealth();
      setHealth(currentHealth);
    }, 30000);

    return () => {
      cleanup();
      clearInterval(healthInterval);
    };
  }, []);

  const getInsightIcon = (type: PulseInsight['type']) => {
    switch (type) {
      case 'pedagogical_optimization': return <Lightbulb className="text-amber-400 w-4 h-4" />;
      case 'system_critical': return <AlertTriangle className="text-red-500 w-4 h-4" />;
      case 'evolutionary_milestone': return <BrainCircuit className="text-cyan-400 w-4 h-4" />;
      case 'risk_detected': return <Zap className="text-purple-400 w-4 h-4" />;
      default: return <Activity className="text-blue-400 w-4 h-4" />;
    }
  };

  const handleGenerateStrategy = async () => {
    setIsLoadingStrategy(true);
    try {
      const result = await window.aquila.generateOrganizationalStrategy();
      setStrategy(result);
    } catch (err) {
      console.error('[TelemetryPulse] Falha ao gerar estratégia:', err);
    } finally {
      setIsLoadingStrategy(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Indicadores de Saúde do Córtex */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <EagleCard glow="blue" className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <BrainCircuit className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">NPU Load</p>
              <p className="text-xl font-mono text-blue-400">{health?.npuLoad ?? 0}%</p>
            </div>
          </div>
        </EagleCard>

        <EagleCard glow="cyan" className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
              <Activity className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Graph Complexity</p>
              <p className="text-xl font-mono text-cyan-400">{(health?.graphComplexity ?? 0).toLocaleString()}</p>
            </div>
          </div>
        </EagleCard>

        <EagleCard glow="purple" className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/20">
              <Zap className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Total Insights</p>
              <p className="text-xl font-mono text-purple-400">{health?.totalInsights ?? 0}</p>
            </div>
          </div>
        </EagleCard>

        <EagleCard glow="blue" className="p-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className={cn(
                "w-2 h-2 rounded-full absolute -top-1 -right-1",
                health?.isLearning ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)] animate-pulse" : "bg-slate-600"
              )} />
              <div className="p-2 rounded-lg bg-white/5 border border-white/10">
                <Clock className="w-5 h-5 text-slate-400" />
              </div>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Self-Study Status</p>
              <p className="text-sm font-medium text-slate-300">
                {health?.isLearning ? 'Active Learning' : 'Deep Nap'}
              </p>
            </div>
          </div>
        </EagleCard>
      </div>

      {/* Stanford AI Playbook - Ação Executiva */}
      <EagleCard glow="amber" className="p-6 bg-gradient-to-br from-amber-500/5 to-transparent border-amber-500/20">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 shadow-[0_0_20px_rgba(245,158,11,0.1)]">
              <BrainCircuit className="w-8 h-8 text-amber-500" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-100 italic">Stanford Enterprise AI Playbook</h3>
              <p className="text-xs text-slate-400 max-w-md">
                Gere uma estratégia de evolução institucional baseada na maturidade atual do seu ECOSSISTEMA ÁQUILA.
              </p>
            </div>
          </div>
          
          <EliteButton 
            variant="ghost" 
            className={cn(
              "px-8 py-6 rounded-xl border-amber-500/30 hover:bg-amber-500/10 text-amber-500 font-bold tracking-widest uppercase transition-all duration-500",
              isLoadingStrategy && "animate-pulse opacity-70"
            )}
            onClick={handleGenerateStrategy}
            disabled={isLoadingStrategy}
          >
            {isLoadingStrategy ? (
              <span className="flex items-center gap-2">
                <Activity className="w-4 h-4 animate-spin" />
                Sintetizando...
              </span>
            ) : (
              'Gerar Estratégia v1.5'
            )}
          </EliteButton>
        </div>

        {strategy && (
          <div className="mt-8 p-6 rounded-2xl bg-black/40 border border-amber-500/10 animate-slide-up">
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle2 className="w-5 h-5 text-green-400" />
              <h4 className="font-bold text-amber-400 uppercase text-xs tracking-tighter">Insight Estratégico Consolidado</h4>
            </div>
            
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                  <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Maturidade Atual</p>
                  <p className="text-lg font-mono text-cyan-400">{strategy.maturityStage}</p>
                </div>
                <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                  <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Foco Prioritário</p>
                  <p className="text-sm text-slate-200 leading-relaxed italic">"{strategy.focusArea}"</p>
                </div>
              </div>

              <div className="space-y-4">
                <p className="text-[10px] text-slate-500 uppercase font-bold">Resumo da Planilha de Voo (Sovereign)</p>
                <div className="text-sm text-slate-400 leading-relaxed whitespace-pre-line">
                  {strategy.strategyText}
                </div>
                
                <div className="flex items-center gap-4 mt-6">
                  <div className="flex-1 p-3 rounded-lg bg-green-500/5 border border-green-500/10">
                    <p className="text-[9px] text-slate-500 uppercase font-bold mb-1">ROI Estimado (Eficiência)</p>
                    <p className="text-xl font-bold text-green-400">+{strategy.roiEstimate}%</p>
                  </div>
                  <div className="flex-1 p-3 rounded-lg bg-blue-500/5 border border-blue-500/10">
                    <p className="text-[9px] text-slate-500 uppercase font-bold mb-1">Ativos Processados</p>
                    <p className="text-xl font-bold text-blue-400">{strategy.lessonsLearned}</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-8 flex justify-end">
              <EliteButton variant="ghost" size="sm" onClick={() => setStrategy(null)}>
                Fechar Relatório
              </EliteButton>
            </div>
          </div>
        )}
      </EagleCard>

      {/* Feed do Pulso Soberano */}
      <EagleCard glow="blue" className="overflow-hidden">
        <div className="flex justify-between items-center mb-6 px-2">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Zap className="text-blue-500 w-5 h-5" />
            Córtex Sovereign Pulse
          </h3>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
              <span className="text-[10px] font-bold text-blue-400 uppercase tracking-tighter">Live Telemetry</span>
            </div>
            <EliteButton variant="ghost" size="sm" onClick={() => setIsLive(!isLive)}>
              {isLive ? 'Pause' : 'Resume'}
            </EliteButton>
          </div>
        </div>

        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
          {insights.length === 0 ? (
            <div className="py-12 text-center text-slate-500">
              <BrainCircuit className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p>Aguardando pulso inicial do Córtex...</p>
            </div>
          ) : (
            insights.map((insight, idx) => (
              <div 
                key={insight.id} 
                className={cn(
                  "group relative p-4 rounded-xl border transition-all duration-300 animate-fade-in",
                  idx === 0 ? "bg-blue-500/5 border-blue-500/20 shadow-[0_0_15px_-5px_rgba(59,130,246,0.1)]" : "bg-white/5 border-white/5 hover:bg-white/10"
                )}
              >
                <div className="flex gap-4 items-start">
                  <div className={cn(
                    "mt-1 p-2 rounded-lg",
                    idx === 0 ? "bg-blue-500/20 text-blue-400" : "bg-white/5 text-slate-400"
                  )}>
                    {getInsightIcon(insight.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-1">
                      <span className={cn(
                        "text-[10px] font-bold uppercase tracking-widest",
                        idx === 0 ? "text-blue-400" : "text-slate-500"
                      )}>
                        {insight.type.replace('_', ' ')}
                      </span>
                      <span className="text-[10px] font-mono text-slate-600">
                        {new Date(insight.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-sm text-slate-300 leading-relaxed font-medium">
                      {insight.content}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-700 group-hover:text-blue-500 transition-colors self-center" />
                </div>
              </div>
            ))
          )}
        </div>

        {insights.length > 0 && (
          <div className="mt-6 pt-6 border-t border-white/5 text-center">
            <EliteButton variant="ghost" size="sm" className="w-full">
              Ver Histórico Evolutivo Completo
            </EliteButton>
          </div>
        )}
      </EagleCard>
    </div>
  );
};
