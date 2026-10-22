import React, { useState, useEffect, useRef } from 'react';
import { 
  Activity, ShieldCheck, Zap, Wrench, ChevronRight, 
  Settings, Globe, AlertTriangle, Users, MapPin, 
  BarChart3, LifeBuoy, Clock, Camera, Radio, Database, CheckCircle2
} from 'lucide-react';
import { useEnergyMonitor } from '../../hooks/useEnergyMonitor';
import { EnvironmentalHUD } from '../components/EnvironmentalHUD';
import { AttendanceDensityMap } from '../components/AttendanceDensityMap';
import { NexusStateVisualizer } from '../components/NexusStateVisualizer';
import { RuViewMapping } from '../components/RuViewMapping';
import { IncidentTimeline } from '../components/IncidentTimeline';
import { HelpCenter } from '../components/HelpCenter';
import './UnifiedCommand.css';

import { ArrowLeft } from 'lucide-react';

/**
 * CENTRAL DE MONITORAMENTO (v1.3.4)
 * -----------------------------------------------
 * Hub central de gestão operacional e segurança do campus.
 * Focado em visualização de presença e integridade de acessos.
 */
export const UnifiedCommand: React.FC<{ userRole?: string; onBack?: () => void }> = ({ userRole = 'admin', onBack }) => {
  const energy = useEnergyMonitor();
  const [activeTab, setActiveTab] = useState<'network' | 'presence' | 'fidelity' | 'energy'>(
    userRole === 'coordinator' ? 'presence' : 'network'
  );
  // Padrão: Modo Manutenção (solicitado pelo usuário)
  const [isMaintenance, setIsMaintenance] = useState(true);
  const energyRef = useRef<HTMLDivElement>(null);

  const isDirector = ['admin', 'director'].includes(userRole);

  useEffect(() => {
    if (energyRef.current) {
      const percentage = Math.min(((energy.currentConsumption * 1000) / 6000) * 100, 100);
      energyRef.current.style.width = `${percentage}%`;
    }
  }, [energy.currentConsumption]);

  const handleToggleMaintenance = () => setIsMaintenance(!isMaintenance);

  return (
    <div className="unified-command-container bg-black min-h-screen text-white selection:bg-blue-500 selection:text-white relative">
      {/* Background Sovereignty Overlay */}
      <div className="fixed inset-0 pointer-events-none opacity-10">
         <div className="absolute top-0 right-0 w-[50vw] h-[50vw] bg-blue-600 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2" />
         <div className="absolute bottom-0 left-0 w-[50vw] h-[50vw] bg-purple-600 rounded-full blur-[120px] translate-y-1/2 -translate-x-1/2" />
      </div>

      {/* Painel de Manutenção (Modo de Atualização) */}
      {isMaintenance && (
        <div className="absolute inset-0 z-50 bg-[#050b14]/95 backdrop-blur-xl flex flex-col items-center justify-center p-12 text-center animate-fade-in">
           <div className="relative mb-12">
              <div className="w-32 h-32 border-4 border-blue-500/20 rounded-full animate-ping absolute inset-0" />
              <div className="w-32 h-32 border-4 border-t-blue-500 rounded-full animate-spin relative flex items-center justify-center bg-blue-500/10">
                 <ShieldCheck size={48} className="text-blue-500" />
              </div>
           </div>
           <h2 className="text-4xl font-black italic uppercase tracking-tighter mb-4">Gestão de Segurança <span className="text-blue-500">Sincronizando</span></h2>
           <p className="text-gray-400 max-w-md text-lg leading-relaxed mb-8">
             O módulo de controle Áquila Pro está sendo otimizado para a sua escola. 
             <br/><span className="text-blue-400 font-bold">Acesso restrito durante a atualização do sistema.</span>
           </p>
           <div className="flex gap-4">
              <div className="bg-white/5 px-6 py-3 rounded-2xl border border-white/10 flex items-center gap-2">
                 <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                 <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500">Servidores Online</span>
              </div>
              <div className="bg-white/5 px-6 py-3 rounded-2xl border border-white/10 flex items-center gap-2">
                 <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                 <span className="text-[10px] font-black uppercase tracking-widest text-blue-500">Registros Ativos</span>
              </div>
           </div>
           
           <button 
             onClick={handleToggleMaintenance}
             className="mt-12 text-[10px] font-black uppercase tracking-[0.3em] text-gray-600 hover:text-white transition-colors"
           >
             ACESSAR COMO DIREÇÃO
           </button>
        </div>
      )}

      <div className="relative z-10 flex h-screen overflow-hidden">
        
        {/* Lateral de Navegação - Hub de Gestão */}
        <aside className="w-80 border-r border-white/5 bg-[#050b14]/80 backdrop-blur-3xl flex flex-col p-6 animate-in slide-in-from-left-4 duration-500">
           {onBack && (
               <button 
                  onClick={onBack}
                  className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-white transition-colors mb-6 group"
               >
                  <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
                  Voltar ao Painel
               </button>
            )}
           <div className="flex items-center gap-3 mb-10">
              <div className="w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                 <ShieldCheck size={24} />
              </div>
              <div>
                 <h1 className="text-xl font-black italic tracking-tighter uppercase leading-none">Áquila <span className="text-blue-500">Pro</span></h1>
                 <div className="text-[9px] font-black text-gray-500 uppercase tracking-[0.34em] mt-1">Gestão Escolar Digital</div>
              </div>
           </div>

           <nav className="flex-1 space-y-1">
              {isDirector && (
                <NavButton 
                  active={activeTab === 'network'} 
                  onClick={() => setActiveTab('network')}
                  icon={Globe} 
                  label="Rede Escolar" 
                  detail="Status de Conexão"
                />
              )}
              <NavButton 
                active={activeTab === 'presence'} 
                onClick={() => setActiveTab('presence')}
                icon={Activity} 
                label="Presença" 
                detail="Fluxo de Alunos"
              />
              <NavButton 
                active={activeTab === 'fidelity'} 
                onClick={() => setActiveTab('fidelity')}
                icon={Users} 
                label="Monitor de Acesso" 
                detail="Integridade Biométrica"
              />
              {isDirector && (
                <NavButton 
                  active={activeTab === 'energy'} 
                  onClick={() => setActiveTab('energy')}
                  icon={Zap} 
                  label="Servidores" 
                  detail="Recursos de IA"
                />
              )}
           </nav>

           <div className="mt-auto pt-6 border-t border-white/5">
              <div className="governance-panel glass-panel mb-4">
                  <h3 className="section-title text-[10px] font-black uppercase text-gray-500 mb-4 flex items-center gap-2">
                    <Zap size={10} /> Carga do Sistema
                  </h3>
                 <div className="progress-bar-small h-1 bg-white/5 rounded-full overflow-hidden mb-2">
                    <div ref={energyRef} className="h-full bg-blue-500 transition-all duration-1000" />
                 </div>
                 <div className="flex justify-between text-[9px] font-mono text-gray-500">
                    <span>{Math.round(energy.currentConsumption * 1000)}W</span>
                    <span>OTIMIZADO</span>
                 </div>
              </div>

              <button 
                onClick={handleToggleMaintenance}
                className={`w-full py-3 rounded-2xl flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all ${
                  isMaintenance ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/10' : 'bg-white/5 text-gray-500 hover:bg-white/10'
                }`}
              >
                <Wrench size={12} /> {isMaintenance ? 'Manutenção Ativa' : 'Ativar Manutenção'}
              </button>
           </div>
        </aside>

        {/* Main Dashboard Area */}
        <main className="flex-1 overflow-y-auto custom-scrollbar p-8">
           
           {/* Top Stats Banner */}
           <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <StatCard label="Presença Geral" value="94.8%" trend="+2.4%" icon={CheckCircle2} color="green" />
              <StatCard label="Segurança Ativa" value="100%" trend="Estável" icon={ShieldCheck} color="blue" />
              <StatCard label="Carga de IA" value="34°C" trend="Eco" icon={Activity} color="purple" />
              <StatCard label="Sincronização" value="Ativa" trend="v1.3.4" icon={Database} color="blue" />
           </div>

           {/* Tab Content */}
           {activeTab === 'network' && (
              <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
                 <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 min-w-0">
                    <div className="lg:col-span-2 glass-panel p-8 rounded-[40px] border border-white/5 bg-[#050b14]/40 min-w-0">
                       <h2 className="text-3xl font-black italic uppercase tracking-tighter mb-8 flex items-center gap-4">
                          <Globe size={32} className="text-blue-500" /> Rede Escolar <span className="text-sm font-black text-gray-600 bg-white/5 px-3 py-1 rounded-full uppercase italic tracking-widest ml-4">Conectividade Ativa</span>
                       </h2>
                       <NexusStateVisualizer />
                    </div>
                    <div className="glass-panel p-8 rounded-[40px] border border-white/5 bg-[#050b14]/40 h-fit min-w-0">
                       <h3 className="text-xl font-black italic uppercase tracking-tighter mb-6 flex items-center gap-3">
                          <Activity size={20} className="text-purple-400" /> Anomalias Detectadas
                       </h3>
                       <IncidentTimeline incidents={[]} />
                    </div>
                 </div>
              </div>
           )}

           {activeTab === 'presence' && (
              <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
                 <div className="glass-panel p-8 rounded-[40px] border border-white/5 bg-[#050b14]/40 h-[70vh]">
                    <h2 className="text-3xl font-black italic uppercase tracking-tighter mb-8 flex items-center gap-4">
                       <Activity size={32} className="text-purple-400" /> Fluxo de Presença por Unidade
                    </h2>
                    <AttendanceDensityMap />
                 </div>
              </div>
           )}

           {activeTab === 'fidelity' && (
              <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
                 <div className="glass-panel p-8 rounded-[40px] border border-white/5 bg-[#050b14]/40">
                    <h2 className="text-3xl font-black italic uppercase tracking-tighter mb-8 flex items-center gap-4">
                       <Users size={32} className="text-emerald-400" /> Auditoria de Confiança Biométrica
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                       <EnvironmentalHUD roomId="central-core" />
                       <div className="flex flex-col items-center justify-center p-12 bg-white/5 rounded-[32px] border border-white/5">
                          <ShieldCheck size={64} className="text-emerald-500 mb-6 animate-pulse" />
                          <h3 className="text-xl font-bold italic tracking-tight text-white mb-2">Validação Soberana Ativa</h3>
                          <p className="text-gray-500 text-center max-w-xs text-sm">Verificações de vivacidade multimodal passando com 99,8% de confiança global (LGPD Compliance).</p>
                       </div>
                    </div>
                 </div>
              </div>
           )}

        </main>
      </div>
    </div>
  );
};

// --- Sub-components (Cleaned up from HUGE UnifiedCommand) ---

const NavButton: React.FC<{ icon: any, label: string, detail: string, active: boolean, onClick: () => void }> = ({ icon: Icon, label, detail, active, onClick }) => (
  <button 
    onClick={onClick}
    className={`w-full group p-4 rounded-2xl flex items-center gap-4 transition-all duration-300 ${
      active ? 'bg-blue-600 text-white shadow-xl shadow-blue-500/10' : 'text-gray-500 hover:bg-white/5 hover:text-white'
    }`}
  >
    <div className={`p-2 rounded-xl transition-colors ${active ? 'bg-white/20' : 'bg-white/5 group-hover:bg-blue-500/20'}`}>
       <Icon size={20} />
    </div>
    <div className="text-left">
       <div className={`text-xs font-black uppercase tracking-widest ${active ? 'text-white' : 'text-gray-400 group-hover:text-white'}`}>{label}</div>
       <div className={`text-[9px] font-black uppercase opacity-60 ${active ? 'text-blue-200' : 'text-gray-600'}`}>{detail}</div>
    </div>
    <ChevronRight size={14} className={`ml-auto transition-transform ${active ? 'translate-x-0' : 'translate-x-2 opacity-0 group-hover:opacity-100'}`} />
  </button>
);

const StatCard: React.FC<{ label: string, value: string, trend: string, icon: any, color: string }> = ({ label, value, trend, icon: Icon, color }) => (
  <div className="glass-panel p-6 rounded-[32px] border border-white/5 bg-[#050b14]/60 backdrop-blur-xl group hover:border-blue-500/30 transition-all">
     <div className="flex justify-between items-start mb-4">
        <div className={`p-2 rounded-xl ${
           color === 'blue' ? 'bg-blue-600/20 text-blue-400' : 
           color === 'green' ? 'bg-emerald-600/20 text-emerald-400' : 'bg-purple-600/20 text-purple-400'
        }`}>
           <Icon size={18} />
        </div>
        <div className="text-[10px] font-black uppercase italic tracking-widest text-gray-500">{trend}</div>
     </div>
     <div className="text-3xl font-black italic tracking-tighter text-white uppercase">{value}</div>
     <div className="text-[10px] font-black uppercase text-gray-600 tracking-[0.2em] mt-1">{label}</div>
  </div>
);

const CheckCircleV2: React.FC<{ size: number }> = ({ size }) => <CheckCircle2 size={size || 24} />;
