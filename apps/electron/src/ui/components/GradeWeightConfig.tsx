import React, { useState } from 'react';
import { Sliders, Save, RefreshCw, Layers, AlertCircle } from 'lucide-react';

export const GradeWeightConfig: React.FC = () => {
  const [weights, setWeights] = useState({
    provaOficial: 60,
    atividades: 20,
    comportamento: 20,
  });

  const [saving, setSaving] = useState(false);

  const total = weights.provaOficial + weights.atividades + weights.comportamento;
  const isBalanced = total === 100;

  const handleSave = async () => {
    setSaving(true);
    try {
      const win = window as any;
      await win.aquila.invoke('secretariat:save-weights', weights);
      alert('Pesos salvos com sucesso no servidor Sovereign!');
    } catch (err) {
      console.error('Failed to save weights:', err);
      alert('Erro ao salvar pesos.');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setWeights({ provaOficial: 60, atividades: 20, comportamento: 20 });
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div className="flex items-center justify-between">
         <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Sliders className="text-purple-500" /> Balanço de Avaliações
            </h2>
            <p className="text-xs text-slate-400 mt-1">Configure os pesos que compõem a nota final do aluno. O total deve ser 100%.</p>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         {/* Config Sliders */}
         <div className="md:col-span-2 flex flex-col gap-4 p-6 bg-white/5 border border-white/5 rounded-2xl">
             
             {/* Slider Item */}
             <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center">
                   <div className="flex items-center gap-2">
                      <Layers size={16} className="text-blue-400" />
                      <span className="font-bold text-white text-sm">Prova Oficial (N1)</span>
                   </div>
                   <span className="font-black text-blue-400">{weights.provaOficial}%</span>
                </div>
                <input 
                   type="range" 
                   min="0" max="100" 
                   value={weights.provaOficial} 
                   onChange={(e) => setWeights({ ...weights, provaOficial: Number(e.target.value) })}
                   className="w-full accent-blue-500 h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                />
             </div>

             <hr className="border-white/5 my-2" />

             {/* Slider Item */}
             <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center">
                   <div className="flex items-center gap-2">
                      <Layers size={16} className="text-emerald-400" />
                      <span className="font-bold text-white text-sm">Atividades e Trabalhos (N2)</span>
                   </div>
                   <span className="font-black text-emerald-400">{weights.atividades}%</span>
                </div>
                <input 
                   type="range" 
                   min="0" max="100" 
                   value={weights.atividades} 
                   onChange={(e) => setWeights({ ...weights, atividades: Number(e.target.value) })}
                   className="w-full accent-emerald-500 h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                />
             </div>

             <hr className="border-white/5 my-2" />

             {/* Slider Item */}
             <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center">
                   <div className="flex items-center gap-2">
                      <Layers size={16} className="text-amber-400" />
                      <span className="font-bold text-white text-sm">Comportamento/Assiduidade (N3)</span>
                   </div>
                   <span className="font-black text-amber-400">{weights.comportamento}%</span>
                </div>
                <input 
                   type="range" 
                   min="0" max="100" 
                   value={weights.comportamento} 
                   onChange={(e) => setWeights({ ...weights, comportamento: Number(e.target.value) })}
                   className="w-full accent-amber-500 h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                />
             </div>
         </div>

         {/* Summary Status */}
         <div className="flex flex-col p-6 bg-white/5 border border-white/5 rounded-2xl relative overflow-hidden">
             <div className={`absolute top-0 left-0 w-full h-1 ${isBalanced ? 'bg-emerald-500' : 'bg-red-500'}`} />
             <h3 className="font-bold text-slate-300 text-sm mb-4 uppercase tracking-widest">Validação do Sistema</h3>
             
             <div className="flex-1 flex flex-col justify-center items-center text-center">
                <div className={`text-5xl font-black mb-2 ${isBalanced ? 'text-white' : 'text-red-400'}`}>
                   {total}%
                </div>
                {!isBalanced ? (
                   <p className="flex items-center gap-1 text-xs text-red-400 font-bold bg-red-500/10 px-3 py-1.5 rounded-lg border border-red-500/20">
                     <AlertCircle size={14} /> Total deve fechar em 100% exatos.
                   </p>
                ) : (
                   <p className="text-xs text-emerald-400 font-bold bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20">
                     Métricas equilibradas e validadas.
                   </p>
                )}
             </div>

             <div className="flex gap-2 mt-6">
                <button 
                   onClick={handleReset} 
                   className="flex-1 py-2 bg-white/5 text-white font-bold text-xs rounded-xl hover:bg-white/10 transition-colors flex items-center justify-center gap-2"
                >
                   <RefreshCw size={14} /> Reset
                </button>
                <button 
                   onClick={handleSave} 
                   disabled={!isBalanced || saving}
                   className={`flex-[2] py-2 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2 ${isBalanced 
                     ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-glow' 
                     : 'bg-slate-800 text-slate-500 cursor-not-allowed'}`}
                >
                   {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={14} />} 
                   Aplicar Pesos
                </button>
             </div>
         </div>
      </div>
    </div>
  );
};
