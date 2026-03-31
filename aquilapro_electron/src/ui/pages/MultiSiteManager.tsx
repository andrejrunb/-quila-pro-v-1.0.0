import React, { useState } from 'react';
import { 
  Globe, 
  MapPin, 
  Plus, 
  ArrowLeft, 
  Settings, 
  BarChart, 
  Shield, 
  Database,
  RefreshCw,
  ExternalLink
} from 'lucide-react';

interface Unit {
  id: string;
  name: string;
  address: string;
  status: 'online' | 'offline' | 'syncing';
  lastSync: string;
  studentCount: number;
}

interface MultiSiteManagerProps {
  onBack: () => void;
}

export const MultiSiteManager: React.FC<MultiSiteManagerProps> = ({ onBack }) => {
  const [units, setUnits] = useState<Unit[]>([
    { id: '1', name: 'Unidade Central - Matriz', address: 'Av. Paulista, 1000', status: 'online', lastSync: 'Houve 5 min atrás', studentCount: 1250 },
    { id: '2', name: 'Unidade Sul - Kids', address: 'Rua das Flores, 450', status: 'syncing', lastSync: 'Sincronizando...', studentCount: 450 },
    { id: '3', name: 'Unidade Norte - High School', address: 'Av. Brasil, 2200', status: 'offline', lastSync: 'Ontem às 18:00', studentCount: 890 },
  ]);

  const [isSyncingAll, setIsSyncingAll] = useState(false);

  const handleSyncAll = () => {
    setIsSyncingAll(true);
    setTimeout(() => {
      setIsSyncingAll(false);
      alert('Sincronização multi-unidade concluída!');
    }, 2000);
  };

  return (
    <div className="p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="p-2 hover:bg-white/10 rounded-full transition-colors text-slate-400"
            title="Voltar"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Gestão Multi-Unidade (Tenant)</h1>
            <p className="text-slate-400 text-sm italic">Painel administrativo central Áquila V3</p>
          </div>
        </div>
        <div className="flex gap-3">
            <button 
                onClick={handleSyncAll}
                className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-medium transition-all"
            >
                <RefreshCw size={18} className={isSyncingAll ? 'animate-spin' : ''} />
                Sincronizar Redes
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-indigo-500/20">
                <Plus size={18} />
                Nova Unidade
            </button>
        </div>
      </header>

      {/* Global Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gradient-to-br from-indigo-500/10 to-indigo-500/5 border border-indigo-500/20 p-6 rounded-3xl">
          <div className="flex items-center gap-3 text-indigo-400 mb-2">
            <Globe size={18} />
            <span className="text-xs font-bold uppercase tracking-wider">Status da Rede</span>
          </div>
          <div className="text-3xl font-bold text-white">Consolidado</div>
          <div className="text-emerald-400 text-xs mt-1 flex items-center gap-1">
             <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" /> 
             Todos os nós operacionais
          </div>
        </div>

        <div className="bg-slate-900/50 border border-white/5 p-6 rounded-3xl">
          <div className="flex items-center gap-3 text-slate-400 mb-2">
            <Database size={18} />
            <span className="text-xs font-bold uppercase tracking-wider">Sincronismo Cloud</span>
          </div>
          <div className="text-3xl font-bold text-white">98.4%</div>
          <div className="text-slate-500 text-xs mt-1">Acuidade de dados distribuídos</div>
        </div>

        <div className="bg-slate-900/50 border border-white/5 p-6 rounded-3xl">
          <div className="flex items-center gap-3 text-slate-400 mb-2">
            <BarChart size={18} />
            <span className="text-xs font-bold uppercase tracking-wider">Total de Alunos</span>
          </div>
          <div className="text-3xl font-bold text-white">2.590</div>
          <div className="text-slate-500 text-xs mt-1">Impacto total da rede Áquila</div>
        </div>
      </div>

      {/* Units List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {units.map(unit => (
          <div key={unit.id} className="bg-slate-900/50 border border-white/5 rounded-3xl p-6 hover:border-indigo-500/30 transition-all group">
            <div className="flex justify-between items-start mb-6">
              <div className="flex gap-4">
                <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-400">
                  <MapPin size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white group-hover:text-indigo-400 transition-colors uppercase italic">{unit.name}</h3>
                  <p className="text-slate-400 text-sm">{unit.address}</p>
                </div>
              </div>
              <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                unit.status === 'online' ? 'bg-emerald-500/10 text-emerald-400' :
                unit.status === 'syncing' ? 'bg-amber-500/10 text-amber-400 animate-pulse' :
                'bg-slate-800 text-slate-500'
              }`}>
                {unit.status}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-4 py-4 border-y border-white/5">
              <div>
                <div className="text-[10px] text-slate-500 uppercase font-bold mb-1">Último Sync</div>
                <div className="text-sm font-medium text-slate-200">{unit.lastSync}</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-500 uppercase font-bold mb-1">Alunos</div>
                <div className="text-sm font-medium text-slate-200">{unit.studentCount}</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-500 uppercase font-bold mb-1">Nível</div>
                <div className="text-sm font-medium text-slate-200">Elite V3</div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button className="flex-1 py-2 bg-white/5 hover:bg-white/10 text-white rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2">
                <Settings size={14} /> Configuração
              </button>
              <button className="flex-1 py-2 bg-indigo-600/10 hover:bg-indigo-600 text-indigo-400 hover:text-white rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2">
                <ExternalLink size={14} /> Acessar Unidade
              </button>
            </div>
          </div>
        ))}

        {/* Multi-Unit Alert */}
        <div className="lg:col-span-2 bg-amber-500/5 border border-amber-500/20 p-6 rounded-3xl flex items-start gap-4 mt-4">
            <div className="p-2 bg-amber-500/10 text-amber-500 rounded-lg">
                <Shield size={24} />
            </div>
            <div>
                <h4 className="text-amber-500 font-bold mb-1">Segurança de Dados Compartilhados</h4>
                <p className="text-slate-400 text-sm leading-relaxed">
                    A gestão multi-site compartilha apenas metadados agregados para dashboards de rede. 
                    Dados biométricos individuais permanecem **exclusivos** de cada unidade local, 
                    garantindo 100% de conformidade com a LGPD e soberania de dados.
                </p>
            </div>
        </div>
      </div>
    </div>
  );
};

export default MultiSiteManager;
