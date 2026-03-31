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

interface HardwareCalculatorProps {
  onBack: () => void;
}

export const HardwareCalculator: React.FC<HardwareCalculatorProps> = ({ onBack }) => {
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

