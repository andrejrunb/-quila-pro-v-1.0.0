import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Activity, 
  Scale, 
  ShieldAlert, 
  TrendingUp, 
  Users, 
  DollarSign, 
  CheckCircle2, 
  Clock, 
  ExternalLink 
} from 'lucide-react';
import './SwarmExecutiveCockpit.css';

// Interfaces mockadas/importadas dos serviços (através do bridge IPC)
interface SwarmPulse {
  globalFaturamento: number;
  totalStudentsActive: number;
  globalRetentionRate: number;
  hardwareAlerts: number;
  topPerformingUnits: string[];
  criticalUnits: string[];
}

interface ActionPill {
  id: string;
  type: 'PEDAGOGICAL' | 'LEGAL' | 'ADMINISTRATIVE';
  source: string;
  content: string;
  priority: 'URGENT' | 'RECOMMENDED' | 'INFO';
  suggestedAction: string;
  legalAnchor?: string;
  status: 'pending' | 'approved' | 'discarded';
}

/**
 * Componente Phase 9: Áquila Executive Cockpit (v3510)
 * Visão consolidada do enxame de escolas com amparo legal e análise preditiva.
 */
export const SwarmExecutiveCockpit: React.FC = () => {
  const [pulse, setPulse] = useState<SwarmPulse | null>(null);
  const [pills, setPills] = useState<ActionPill[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        // @ts-ignore (IPC Bridge)
        const pulseData = await window.electron.ipcRenderer.invoke('swarm:get-pulse');
        // @ts-ignore
        const pillsData = await window.electron.ipcRenderer.invoke('swarm:get-pills');
        
        setPulse(pulseData);
        setPills(pillsData);
      } catch (err) {
        console.error('Falha ao carregar dados do Cockpit Executivo', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  if (loading || !pulse) {
    return <div className="cockpit-container flex items-center justify-center">Carregando Córtex Áquila...</div>;
  }

  return (
    <div className="cockpit-container">
      <header className="cockpit-header flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <Building2 className="text-sky-400" />
            <h1 className="text-2xl font-black tracking-tight uppercase">Áquila Swarm Cortex</h1>
          </div>
          <p className="text-slate-400 text-xs font-medium uppercase tracking-[0.2em]">Inteligência Executiva & Amparo Legal v3510</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-[10px] text-slate-500 font-bold uppercase">Estado do Enxame</div>
            <div className="flex items-center gap-2 justify-end text-emerald-400 font-bold text-sm">
              Soberano <div className="status-glow glow--green" />
            </div>
          </div>
        </div>
      </header>

      {/* Seção 1: Pulso Consolidado */}
      <section className="cockpit-pulse">
        <div className="pulse-card">
          <div className="pulse-label">
            <DollarSign size={14} className="text-emerald-400" /> Faturamento Global
          </div>
          <div className="pulse-value text-emerald-100">
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(pulse.globalFaturamento)}
          </div>
          <div className="text-[10px] mt-2 text-emerald-400/60 font-medium">+12.4% vs mês anterior</div>
        </div>

        <div className="pulse-card">
          <div className="pulse-label">
            <Users size={14} className="text-sky-400" /> Alunos no Enxame
          </div>
          <div className="pulse-value text-sky-100">
            {pulse.totalStudentsActive.toLocaleString()}
          </div>
          <div className="text-[10px] mt-2 text-sky-400/60 font-medium">Capacidade: 94%</div>
        </div>

        <div className="pulse-card">
          <div className="pulse-label">
            <TrendingUp size={14} className="text-purple-400" /> Retenção Média
          </div>
          <div className="pulse-value text-purple-100">
            {pulse.globalRetentionRate}%
          </div>
          <div className="text-[10px] mt-2 text-purple-400/60 font-medium">Meta: 98%</div>
        </div>

        <div className="pulse-card">
          <div className="pulse-label">
            <Activity size={14} className={pulse.hardwareAlerts > 0 ? 'text-rose-400' : 'text-emerald-400'} /> Status Edge (NPU)
          </div>
          <div className={`pulse-value ${pulse.hardwareAlerts > 0 ? 'text-rose-100' : 'text-emerald-100'}`}>
            {pulse.hardwareAlerts > 0 ? `${pulse.hardwareAlerts} Alertas` : 'Operante'}
          </div>
        </div>
      </section>

      <div className="cockpit-main">
        {/* Seção 2: Pílulas de Ação e Auditoria Legal */}
        <section className="section-card">
          <header className="flex items-center justify-between mb-6">
            <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <ShieldAlert size={16} /> Fila de Revisão Estratégica
            </h2>
            <button className="text-[10px] bg-sky-500/20 text-sky-400 px-3 py-1 rounded-full font-bold">
              Ver Todas ({pills.length})
            </button>
          </header>

          <div className="pills-list overflow-y-auto max-h-[400px] pr-2">
            {pills.length === 0 ? (
              <div className="text-slate-600 italic text-center py-20">Nenhum insight pendente de revisão.</div>
            ) : (
              pills.map(pill => (
                <div key={pill.id} className={`pill-item priority--${pill.priority}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">
                      {pill.source} // {pill.type}
                    </span>
                    {pill.type === 'LEGAL' && <span className="badge-legal">Base ECA/BNCC</span>}
                  </div>
                  <div className="text-sm font-semibold text-slate-200 mb-3">{pill.content}</div>
                  <div className="p-3 bg-white/5 rounded border border-white/5 text-xs text-slate-400 leading-relaxed italic">
                    <div className="font-bold text-sky-400 not-italic mb-1 uppercase text-[9px]">Sugestão Áquila:</div>
                    {pill.suggestedAction}
                  </div>
                  <div className="flex items-center justify-end gap-3 mt-4">
                    <button className="text-[10px] text-slate-500 hover:text-slate-300">Descartar</button>
                    <button className="text-[10px] bg-sky-500/10 text-sky-400 px-4 py-2 rounded-lg font-bold border border-sky-500/20 hover:bg-sky-500/20">
                      Liberar para Escola
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* [Phase 7001] Federated Learning Pulse */}
          <div className="federation-status">
            <h3 className="text-[10px] font-black uppercase text-purple-400 mb-4 tracking-tighter flex items-center gap-2">
              <Activity size={12} /> Swarm Intelligence Consensus
            </h3>
            <div className="neural-pulse-indicator">
              <div className="flex-1">
                <div className="text-xs font-bold text-slate-300 mb-1">Knowledge Shards Synchronized</div>
                <div className="text-lg font-black text-purple-glow">1,402 Units</div>
              </div>
              <div className="text-right">
                <div className="text-[10px] font-bold text-slate-500 uppercase">Global Confidence</div>
                <div className="text-sm font-bold text-emerald-400">94.8%</div>
              </div>
            </div>
            <div className="mt-4 space-y-2">
               <div className="shard-entry">
                  <span className="text-[10px] text-slate-400">Último Shard Recebido</span>
                  <span className="text-[10px] font-mono text-purple-300">#AQ-FED-882</span>
               </div>
               <div className="shard-entry">
                  <span className="text-[10px] text-slate-400">Ganho de Precisão (Rede)</span>
                  <span className="text-[10px] font-mono text-emerald-400">+2.15%</span>
               </div>
            </div>
          </div>
        </section>

        {/* Seção 3: Comparativo de Unidades */}
        <section className="section-card">
          <header className="mb-6">
            <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <Scale size={16} /> Comparativo de Enxame
            </h2>
          </header>

          <div className="mb-8">
            <div className="text-[10px] text-rose-400 font-bold uppercase mb-4 flex items-center gap-2">
              <Clock size={12} /> Críticos (Anomalia Detected)
            </div>
            {pulse.criticalUnits.map(unit => (
              <div key={unit} className="unit-row">
                <span className="text-xs font-bold">{unit}</span>
                <div className="flex items-center gap-4">
                  <div className="text-[10px] text-rose-400 font-mono">Dossiê Pronto</div>
                  <ExternalLink size={14} className="text-slate-600 hover:text-sky-400 cursor-pointer" />
                </div>
              </div>
            ))}
          </div>

          <div>
            <div className="text-[10px] text-emerald-400 font-bold uppercase mb-4 flex items-center gap-2">
              <CheckCircle2 size={12} /> Líderes de Performance
            </div>
            {pulse.topPerformingUnits.map(unit => (
              <div key={unit} className="unit-row">
                <span className="text-xs font-bold">{unit}</span>
                <TrendingUp size={14} className="text-emerald-500" />
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};
