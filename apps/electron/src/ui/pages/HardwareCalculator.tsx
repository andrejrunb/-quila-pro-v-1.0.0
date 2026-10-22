import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  ArrowLeft, 
  Cpu, 
  MemoryStick as RAM, 
  Database, 
  Monitor, 
  Zap, 
  Activity, 
  Server, 
  Layers, 
  ShieldCheck,
  TrendingUp,
  HardDrive,
  Network,
  DollarSign,
  ChevronRight
} from 'lucide-react';
import './HardwareCalculator.css';

interface HardwareSpecs {
  cpu: string;
  ram: number;
  gpu: string;
  ssd: number;
  network: string;
  cost: number;
  uptime: string;
}

interface CalculationResult {
  students: number;
  cameras: number;
  fps: number;
  cpuUsage: number;
  ramUsage: number;
  diskUsagePerMonth: number;
  networkBandwidth: number;
  architecture: string;
  specs: HardwareSpecs;
  recommendations: string[];
}

interface B2BRecommendation {
  category: string;
  name: string;
  price: string;
  link: string;
  icon: string;
}

interface HardwareCalculatorProps {
  onBack: () => void;
}

export const HardwareCalculator: React.FC<HardwareCalculatorProps> = ({ onBack }) => {
  const aquila = (window as any).aquila;
  const [roiData, setRoiData] = useState<any>(null);
  const [b2bItems, setB2bItems] = useState<B2BRecommendation[]>([]);
  const [activeSubTab, setActiveSubTab] = useState<'planner' | 'mesh'>('planner');
  const [meshData, setMeshData] = useState<any>(null);

  const fetchMeshCapacity = async () => {
    try {
      const data = await aquila?.invoke('hardware:get-school-capacity');
      setMeshData(data);
    } catch (err) {
      console.error("Erro ao carregar capacidade mesh:", err);
    }
  };

  useEffect(() => {
    if (activeSubTab === 'mesh') {
      fetchMeshCapacity();
    }
  }, [activeSubTab]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const roi = await aquila?.invoke('ai:get-roi-simulation');
        setRoiData(roi);

        const b2b = await aquila?.invoke('ai:get-b2b-marketplace');
        setB2bItems(b2b || []);
      } catch (err) {
        console.error("Erro ao carregar dados ROI/B2B:", err);
      }
    };
    fetchData();
  }, []);
  const [students, setStudents] = useState(250);
  const [cameras, setCameras] = useState(8);
  const [periods, setPeriods] = useState(3);
  const [features, setFeatures] = useState({
    faceRecognition: true,
    alerting: true,
    reporting: true,
    backup: true,
  });

  const result = useMemo(() => {
    return calculateRequirements(students, cameras, periods, features);
  }, [students, cameras, periods, features]);

  const toggleFeature = (key: keyof typeof features) => {
    setFeatures(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  return (
    <div className="p-8 max-w-7xl mx-auto animate-in fade-in duration-1000">
      <header className="flex justify-between items-start mb-12">
        <div className="flex items-center gap-6">
          <button 
            onClick={onBack}
            className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl transition-all text-slate-400 border border-white/5 backdrop-blur-xl"
            title="Voltar"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-4xl font-black bg-gradient-to-r from-white via-blue-400 to-indigo-400 bg-clip-text text-transparent tracking-tight">
              Hardware Planner V3.5
            </h1>
            <p className="text-slate-500 flex items-center gap-2 mt-1">
              <Server className="w-4 h-4 text-blue-500" /> Dimensionamento de Infraestrutura Eagle
            </p>
          </div>
        </div>
        <div className="px-6 py-3 bg-blue-500/10 border border-blue-500/20 rounded-2xl backdrop-blur-xl">
            <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest block mb-1">Status do Projeto</span>
            <div className="flex items-center gap-2 text-white font-bold">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                Planning Mode Active
            </div>
        </div>
      </header>

      {/* Tab Switcher */}
      <div className="flex border-b border-white/5 mb-8 gap-6">
        <button
          onClick={() => setActiveSubTab('planner')}
          className={`pb-4 text-sm font-black uppercase tracking-widest transition-all ${
            activeSubTab === 'planner'
              ? 'border-b-2 border-blue-500 text-white'
              : 'text-slate-500 hover:text-slate-400'
          } focus:outline-none`}
        >
          Planejador e Dimensionamento
        </button>
        <button
          onClick={() => setActiveSubTab('mesh')}
          className={`pb-4 text-sm font-black uppercase tracking-widest transition-all ${
            activeSubTab === 'mesh'
              ? 'border-b-2 border-blue-500 text-white'
              : 'text-slate-500 hover:text-slate-400'
          } focus:outline-none`}
        >
          Capacidade Mesh da Escola
        </button>
      </div>

      {activeSubTab === 'planner' && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">
            {/* Input Panel */}
            <div className="lg:col-span-5 space-y-8">
              <div className="glass-card bg-slate-900/40 p-8 border-white/5">
                <h2 className="text-xl font-black text-white mb-8 flex items-center gap-3">
                    <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400"><Layers size={20} /></div>
                    Parâmetros Escolares
                </h2>

                <div className="space-y-10">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Capacidade de Alunos</label>
                      <span className="text-xl font-black text-blue-400">{students}</span>
                    </div>
                    <input
                      type="range"
                      min="50"
                      max="2000"
                      step="50"
                      value={students}
                      onChange={e => setStudents(parseInt(e.target.value))}
                      className="premium-range"
                      title="Ajustar Alunos"
                    />
                    <div className="flex justify-between text-[10px] font-bold text-slate-600">
                        <span>50</span>
                        <span>1000</span>
                        <span>2000</span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Câmeras Ativas</label>
                      <span className="text-xl font-black text-blue-400">{cameras}</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="64"
                      step="1"
                      value={cameras}
                      onChange={e => setCameras(parseInt(e.target.value))}
                      className="premium-range"
                      title="Ajustar Câmeras"
                    />
                    <div className="flex justify-between text-[10px] font-bold text-slate-600">
                        <span>1</span>
                        <span>32</span>
                        <span>64</span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between mb-4">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Módulos Inteligentes</label>
                        <ShieldCheck className="w-4 h-4 text-emerald-500" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {Object.entries(features).map(([key, value]) => (
                        <button
                          key={key}
                          onClick={() => toggleFeature(key as keyof typeof features)}
                          className={`p-4 rounded-2xl border text-left transition-all ${
                            value 
                              ? 'bg-blue-500/10 border-blue-500/30 text-white shadow-[0_0_20px_rgba(59,130,246,0.1)]' 
                              : 'bg-white/5 border-white/5 text-slate-500 hover:border-white/10 focus:outline-none'
                          }`}
                        >
                          <div className="text-[10px] font-black uppercase tracking-widest mb-1 opacity-60">Status: {value ? 'ON' : 'OFF'}</div>
                          <div className="text-xs font-bold">{featureLabel(key)}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Results Panel */}
            <div className="lg:col-span-7 space-y-8">
              <div className="glass-card bg-slate-900/40 p-8 border-white/5 relative overflow-hidden group">
                <div className="absolute -right-20 -top-20 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl group-hover:bg-blue-500/20 transition-all" />
                
                <div className="flex items-center justify-between mb-10 border-b border-white/5 pb-6">
                    <h2 className="text-xl font-black text-white flex items-center gap-3">
                        <Zap className="text-amber-400" size={24} />
                        Configuração de Elite Recomendada
                    </h2>
                    <div className="text-right">
                        <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Arquitetura Sugerida</div>
                        <div className="text-lg font-black text-blue-400 uppercase">{result.architecture}</div>
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-10">
                    {[
                        { label: 'CPU', val: result.specs.cpu, icon: Cpu, color: 'blue' },
                        { label: 'RAM', val: `${result.specs.ram} GB DDR5`, icon: RAM, color: 'indigo' },
                        { label: 'GPU', val: result.specs.gpu, icon: Monitor, color: 'purple' },
                        { label: 'NVMe SSD', val: `${result.specs.ssd} GB`, icon: HardDrive, color: 'emerald' },
                        { label: 'Rede', val: result.specs.network, icon: Network, color: 'cyan' },
                        { label: 'Custo Est.', val: `R$ ${result.specs.cost.toLocaleString()}`, icon: DollarSign, color: 'green' }
                    ].map((s, i) => (
                        <div key={i} className="bg-white/5 border border-white/5 p-4 rounded-2xl hover:bg-white/10 transition-all">
                            <div className={`p-2 bg-${s.color}-500/10 text-${s.color}-400 rounded-lg w-fit mb-3`}><s.icon size={18} /></div>
                            <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">{s.label}</div>
                            <div className="text-sm font-black text-white truncate">{s.val}</div>
                        </div>
                    ))}
                </div>

                <div className="space-y-6">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Estimativas de Carga</h3>
                        <Activity className="w-4 h-4 text-blue-500" />
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-3">
                            <div className="flex justify-between text-[10px] font-black uppercase">
                                <span className="text-slate-500">Uso de CPU</span>
                                <span className={result.cpuUsage > 80 ? 'text-rose-500' : 'text-blue-400'}>{result.cpuUsage}%</span>
                            </div>
                            <UsageBar percent={result.cpuUsage} isCritical={result.cpuUsage > 80} />
                        </div>
                        <div className="space-y-3">
                            <div className="flex justify-between text-[10px] font-black uppercase">
                                <span className="text-slate-500">Uso de RAM</span>
                                <span className="text-indigo-400">{Math.round((result.ramUsage / result.specs.ram) * 100)}%</span>
                            </div>
                            <UsageBar percent={(result.ramUsage / result.specs.ram) * 100} color="indigo" />
                        </div>
                    </div>
                </div>
              </div>

              <div className="glass-card bg-slate-900/40 p-8 border-white/5">
                 <h3 className="text-lg font-black text-white mb-6 uppercase tracking-widest">Análise Proativa Eagle</h3>
                 <div className="space-y-3">
                    {result.recommendations.map((rec, idx) => (
                        <div key={idx} className="flex items-start gap-4 p-4 bg-white/5 hover:bg-white/[0.08] transition-all rounded-2xl border border-white/5 group">
                            <div className="mt-1"><ChevronRight className="w-4 h-4 text-blue-500 group-hover:translate-x-1 transition-all" /></div>
                            <p className="text-sm text-slate-300 font-medium leading-relaxed">{rec}</p>
                        </div>
                    ))}
                 </div>
              </div>

              {/* AI ROI ENGINE PANEL */}
              {roiData && (
                 <div className="glass-card bg-slate-900/40 p-8 border-white/5 mt-8">
                   <div className="flex items-center justify-between mb-6">
                     <h3 className="text-lg font-black text-white uppercase tracking-widest flex items-center gap-3">
                       <Activity className="text-emerald-400" size={24} />
                       AI Cloud vs Edge ROI Engine
                     </h3>
                     <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${roiData.recommendation === 'INVEST_EDGE' ? 'bg-rose-500/20 text-rose-400' : 'bg-blue-500/20 text-blue-400'}`}>
                       Status: {roiData.recommendation}
                     </span>
                   </div>
                   
                   <div className="grid grid-cols-2 gap-4 mb-6">
                     <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                       <div className="text-[10px] font-black text-slate-500 uppercase">Custo Projetado API Cloud/mês</div>
                       <div className="text-2xl font-black text-white mt-1">R$ {roiData.cloudMonthlyCost?.toFixed(2)}</div>
                     </div>
                     <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                       <div className="text-[10px] font-black text-slate-500 uppercase">Investimento Hardware Local</div>
                       <div className="text-2xl font-black text-white mt-1">R$ {roiData.edgeHardwareCost?.toLocaleString()}</div>
                     </div>
                   </div>

                   <div className="w-full bg-white/5 rounded-full h-3 mb-2 overflow-hidden flex">
                     <div className="bg-blue-500 h-full" style={{ width: `${Math.min(100, (roiData.cloudMonthlyCost / roiData.edgeHardwareCost) * 100 * 12)}%` }} />
                   </div>
                   <div className="text-[10px] font-bold text-slate-400 text-right uppercase">Payback estimado em {roiData.monthsToPayback} meses de uso intensivo.</div>
                 </div>
              )}

              {/* AFFILIATE MARKETPLACE */}
              {b2bItems.length > 0 && (
                 <div className="glass-card bg-slate-900/40 p-8 border-white/5 mt-8">
                    <h3 className="text-lg font-black text-white mb-6 uppercase tracking-widest flex items-center gap-3">
                       <Server className="text-blue-400" size={24} />
                       Fornecedores Homologados (Dimensionamento Técnico)
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {b2bItems.map((item, idx) => (
                        <a key={idx} href={item.link} target="_blank" rel="noopener noreferrer" className="p-4 bg-white/5 border border-white/10 hover:border-amber-500/50 hover:bg-amber-500/5 transition-all rounded-2xl block group cursor-pointer">
                           <div className="flex justify-between items-start mb-2">
                             <div className="text-[10px] font-black text-amber-500 uppercase">{item.category}</div>
                             <ShieldCheck className="w-4 h-4 text-emerald-400 opacity-50" />
                           </div>
                           <div className="text-sm font-bold text-white mb-1 group-hover:text-amber-400 transition-colors">{item.name}</div>
                           <div className="text-xs font-black text-slate-400">{item.price}</div>
                        </a>
                      ))}
                    </div>
                 </div>
              )}
            </div>
          </div>

          <div className="glass-card bg-slate-900/40 border-white/5 overflow-hidden">
            <div className="p-8 border-b border-white/5">
               <h2 className="text-xl font-black text-white uppercase tracking-widest">Matriz de Escalabilidade</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-white/[0.02] text-slate-500 text-[10px] uppercase font-black tracking-[0.2em]">
                    <th className="px-8 py-6">Arquitetura</th>
                    <th className="px-8 py-6">Capacidade Alunos</th>
                    <th className="px-8 py-6">Vigilância (Câmeras)</th>
                    <th className="px-8 py-6">Custo Node</th>
                    <th className="px-8 py-6 text-right">SLA</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {[
                    { name: 'Single-Server', cap: '50-250', cam: '2-8', cost: 'R$ 7.5k', sla: '99.5%' },
                    { name: 'Multi-Tier', cap: '250-500', cam: '8-32', cost: 'R$ 35k+', sla: '99.9%' },
                    { name: 'Microserviços', cap: '500-2000+', cam: '32-128+', cost: 'R$ 150k+', sla: '99.99%' }
                  ].map((row, i) => (
                    <tr key={i} className={`hover:bg-white/[0.02] transition-colors group ${result.architecture === row.name ? 'bg-blue-500/5' : ''}`}>
                      <td className={`px-8 py-6 font-black ${result.architecture === row.name ? 'text-blue-400' : 'text-slate-300'}`}>
                        {row.name}
                        {result.architecture === row.name && <span className="ml-2 text-[8px] bg-blue-500 text-white px-2 py-0.5 rounded-full">ACTIVE</span>}
                      </td>
                      <td className="px-8 py-6 text-sm font-bold text-slate-500">{row.cap}</td>
                      <td className="px-8 py-6 text-sm font-bold text-slate-500">{row.cam}</td>
                      <td className="px-8 py-6 text-sm font-black text-white">{row.cost}</td>
                      <td className="px-8 py-6 text-right font-black text-emerald-500">{row.sla}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {activeSubTab === 'mesh' && (
        <div className="space-y-8 animate-in fade-in duration-500">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="glass-card bg-slate-900/40 p-6 border-white/5 relative overflow-hidden">
              <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Nós Cognitivos Ativos (Enxame)</div>
              <div className="text-3xl font-black text-white flex items-baseline gap-2">
                {meshData?.summary?.activeNodes || 0}
                <span className="text-sm font-bold text-slate-500">/ {meshData?.summary?.totalNodes || 0} online</span>
              </div>
              <p className="text-xs text-slate-400 mt-2">Computadores da escola colaborando em rede P2P.</p>
            </div>
            <div className="glass-card bg-slate-900/40 p-6 border-white/5 relative overflow-hidden">
              <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Poder de Processamento IA</div>
              <div className="text-3xl font-black text-blue-400">
                {meshData?.summary?.totalTops || 0} TOPS
              </div>
              <p className="text-xs text-slate-400 mt-2">Poder agregado de NPUs locais ativas no local.</p>
            </div>
            <div className="glass-card bg-slate-900/40 p-6 border-white/5 relative overflow-hidden">
              <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Memória RAM Consolidada</div>
              <div className="text-3xl font-black text-indigo-400">
                {meshData?.summary?.totalRam || 0} GB
              </div>
              <p className="text-xs text-slate-400 mt-2">Capacidade de memória para buffer e modelos grandes.</p>
            </div>
          </div>

          {/* Detailed Node Table */}
          <div className="glass-card bg-slate-900/40 border-white/5 overflow-hidden">
            <div className="p-6 border-b border-white/5 flex justify-between items-center">
              <h3 className="text-base font-black text-white uppercase tracking-widest">Inventário de Hardware Mesh por Sala</h3>
              <button onClick={fetchMeshCapacity} className="p-2 hover:bg-white/5 rounded-lg border border-white/5 text-slate-400 transition-all text-xs font-bold focus:outline-none">
                Atualizar Lista
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-white/[0.02] text-slate-500 text-[10px] uppercase font-black tracking-[0.2em] border-b border-white/5">
                    <th className="px-6 py-4">Computador / Local</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Processador (CPU)</th>
                    <th className="px-6 py-4">RAM</th>
                    <th className="px-6 py-4">NPU / GPU</th>
                    <th className="px-6 py-4 text-right">Poder IA</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {meshData?.nodes?.map((node: any, idx: number) => (
                    <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-4 font-black text-slate-300">
                        {node.name} {node.isLocal && <span className="ml-2 text-[8px] bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full">ESTE DISPOSITIVO</span>}
                      </td>
                      <td className="px-6 py-4 text-xs font-bold">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                          node.status === 'online' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-500/10 text-slate-400'
                        }`}>
                          <div className={`w-1.5 h-1.5 rounded-full ${node.status === 'online' ? 'bg-emerald-400' : 'bg-slate-400'}`} />
                          {node.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-400 font-medium max-w-xs truncate" title={node.cpu}>{node.cpu}</td>
                      <td className="px-6 py-4 text-xs text-slate-300 font-black">{node.ram} GB</td>
                      <td className="px-6 py-4 text-xs text-slate-400 font-medium">{node.gpu}</td>
                      <td className="px-6 py-4 text-right text-xs font-black text-blue-400">{node.tops || 0} TOPS</td>
                    </tr>
                  ))}
                  {(!meshData?.nodes || meshData.nodes.length === 0) && (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-slate-500 text-sm">Nenhum computador encontrado na malha local.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Upgrades and Affiliate Suggestions */}
          <div className="glass-card bg-slate-900/40 p-6 border-white/5">
            <h3 className="text-base font-black text-white mb-6 uppercase tracking-widest">Recomendações de Upgrade de Hardware (Afiliados)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {meshData?.upgrades?.map((up: any, idx: number) => (
                <div key={idx} className="p-5 bg-white/5 border border-white/10 hover:border-amber-500/30 transition-all rounded-2xl flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-3">
                      <span className="text-[10px] bg-rose-500/20 text-rose-400 px-2 py-0.5 rounded font-black uppercase tracking-wider">{up.issue}</span>
                      <span className="text-xs font-black text-slate-500">{up.nodeName}</span>
                    </div>
                    <p className="text-sm font-bold text-white mb-4 leading-relaxed">{up.recommendation}</p>
                  </div>
                  
                  <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] text-slate-500 uppercase tracking-widest">Sugestão Recomendada</div>
                      <div className="text-xs font-black text-amber-400 mt-0.5">{up.affiliate.name}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">Est. R$ {up.affiliate.priceEstimate || up.affiliate.price}</div>
                    </div>
                    <a 
                      href={up.affiliate.affiliateUrl || up.affiliate.link} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black uppercase tracking-widest rounded-xl transition-all shadow-[0_0_15px_rgba(245,158,11,0.2)]"
                    >
                      Comprar
                    </a>
                  </div>
                </div>
              ))}
              {(!meshData?.upgrades || meshData.upgrades.length === 0) && (
                <div className="md:col-span-2 text-center py-8 bg-white/5 border border-white/5 rounded-2xl text-slate-400 text-sm font-bold">
                  ✓ Todos os computadores da escola estão operando em alto desempenho nominal (Infraestrutura IA Adequada).
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Calculation Logic
function calculateRequirements(
  students: number,
  cameras: number,
  periods: number,
  features: Record<string, boolean>
): CalculationResult {
  const fps = Math.max(10, 60 - cameras * 2);
  const cpuUsage = Math.min(95, 20 + (students / 100) * 10 + (cameras / 5) * 15);
  const ramUsage = 4 + (students / 100) * 2 + (cameras / 5) * 3;
  const diskUsagePerMonth = 10 + (cameras * 30 * 24 * 0.1);
  const networkBandwidth = cameras * 50 + (students / 100) * 10;

  let architecture: string;
  let specs: HardwareSpecs;

  if (students <= 250) {
    architecture = 'Single-Server';
    specs = {
      cpu: 'Intel i7-12700K',
      ram: 32,
      gpu: 'RTX 3060',
      ssd: 1024,
      network: '1 Gbps',
      cost: 7500,
      uptime: '99.5%',
    };
  } else if (students <= 750) {
    architecture = 'Multi-Tier';
    specs = {
      cpu: '2x Xeon Silver 4310',
      ram: 128,
      gpu: 'RTX 4070 Ti',
      ssd: 2048,
      network: '10 Gbps',
      cost: 35000,
      uptime: '99.9%',
    };
  } else {
    architecture = 'Microserviços';
    specs = {
      cpu: '4x Xeon Gold 6330',
      ram: 512,
      gpu: 'A100 Tensor Core',
      ssd: 8192,
      network: '40 Gbps',
      cost: 155000,
      uptime: '99.99%',
    };
  }

  const recommendations: string[] = [];
  if (cpuUsage > 85) recommendations.push('A carga de processamento excederá o limite de segurança em picos. Considere expansão de núcleos.');
  if (ramUsage > specs.ram * 0.75) recommendations.push('Memória RAM próxima da saturação. Pode impactar a latência do Reconhecimento Facial.');
  if (cameras > 20 && architecture === 'Single-Server') recommendations.push('Fluxo de vídeo massivo detectado. Recomendamos migração para arquitetura Distribuída (Multi-Tier).');
  if (features.faceRecognition) recommendations.push('Módulo Biométrico requer aceleração via CUDA. GPU dedicada obrigatória para < 200ms de latência.');
  recommendations.push('Monitoramento térmico e no-break de 3kVA recomendado para manter o SLA de ' + specs.uptime + '.');

  return {
    students,
    cameras,
    fps,
    cpuUsage: Math.round(cpuUsage),
    ramUsage: Math.round(ramUsage * 10) / 10,
    diskUsagePerMonth: Math.round(diskUsagePerMonth),
    networkBandwidth: Math.round(networkBandwidth),
    architecture,
    specs,
    recommendations,
  };
}

function featureLabel(key: string): string {
  const labels: Record<string, string> = {
    faceRecognition: 'Vision AI (Faces)',
    alerting: 'Eagle Alertas',
    reporting: 'Analytics Pro',
    backup: 'Cloud Sync 3.5',
  };
  return labels[key] || key;
}

const UsageBar: React.FC<{ percent: number; isCritical?: boolean; color?: string }> = ({ percent, isCritical, color }) => {
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (barRef.current) {
      barRef.current.style.width = `${percent}%`;
    }
  }, [percent]);

  const bgClass = isCritical ? 'bg-rose-500' : (color === 'indigo' ? 'bg-indigo-500' : 'bg-blue-500');

  return (
    <div className="h-2 bg-white/5 rounded-full overflow-hidden">
        <div 
            ref={barRef}
            className={`h-full transition-all duration-1000 ${bgClass}`}
        />
    </div>
  );
};

export default HardwareCalculator;

