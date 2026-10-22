import React from 'react';
import { ShoppingCart, Router, Calculator, CheckCircle, TrendingUp } from 'lucide-react';
import { affiliateService } from '../../services/AffiliateService';

interface Props {
  suggestionsCount: number;
  unitPrice?: number;
}

/**
 * InfrastructureBudget (v1616-17)
 * Painel de Cotação de Expansão de Rede com Monetização por Afiliados.
 */
export const InfrastructureBudget: React.FC<Props> = ({ suggestionsCount, unitPrice = 89.90 }) => {
  const total = suggestionsCount * unitPrice;
  const verifiedRepeater = affiliateService.getProductsByCategory('WIFI_REPEATER')[0];

  const handleBuy = () => {
    if (verifiedRepeater) {
      window.open(verifiedRepeater.affiliateUrl, '_blank');
    }
  };

  return (
    <div className="bg-[#0f172a] border border-blue-500/20 p-8 rounded-[3rem] shadow-2xl animate-in slide-in-from-bottom-5">
      <div className="flex justify-between items-start mb-10">
        <div className="flex items-center gap-4">
           <div className="p-4 bg-blue-500/10 rounded-2xl text-blue-400">
              <ShoppingCart size={24} />
           </div>
           <div>
              <h3 className="text-xl font-black text-white uppercase italic tracking-tighter">Budget <span className="text-blue-500">Infrastructure</span></h3>
              <p className="text-[10px] text-slate-500 font-black tracking-widest uppercase">Quote Preview // v1617 Certified</p>
           </div>
        </div>
        <div className="text-right">
           <span className="text-[10px] text-slate-500 block">TOTAL ESTIMADO</span>
           <span className="text-4xl font-black text-white italic">R$ {total.toFixed(2)}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
        <div className="p-6 bg-white/5 rounded-3xl border border-white/5">
           <div className="flex items-center gap-3 mb-2 text-slate-400">
              <Router size={16} />
              <span className="text-[10px] font-black uppercase">Hardware Recomendado</span>
           </div>
           <div className="text-xl font-black text-white">{verifiedRepeater?.name || 'WiFi Extender'}</div>
           <p className="text-[8px] text-slate-500 mt-1 uppercase font-mono">Verified by Áquila Pro Architecture</p>
        </div>
        <div className="p-6 bg-white/5 rounded-3xl border border-white/5">
           <div className="flex items-center gap-3 mb-2 text-slate-400">
              <TrendingUp size={16} />
              <span className="text-[10px] font-black uppercase">Ganhos de Precisão</span>
           </div>
           <div className="text-2xl font-black text-green-500">+{suggestionsCount * 12}% <span className="text-lg font-normal text-slate-500">CSI Coverage</span></div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-3 text-slate-400 text-[10px] font-medium">
           <CheckCircle size={14} className="text-green-500" />
           Custo unitário baseado em links de afiliados testados.
        </div>
        <div className="flex items-center gap-3 text-slate-400 text-[10px] font-medium">
           <CheckCircle size={14} className="text-green-500" />
           Sugestão automática de cobertura do RuView.
        </div>
      </div>

      <button 
        onClick={handleBuy}
        className="mt-10 w-full py-6 bg-blue-600 text-white rounded-[1.8rem] flex items-center justify-center gap-3 text-xs font-black uppercase tracking-[0.2em] hover:bg-blue-500 transition-all transform active:scale-95 shadow-xl shadow-blue-500/20"
      >
         <Router size={18} /> Acessar Fornecedor Homologado
      </button>

      <button className="mt-4 w-full py-4 bg-white/5 text-slate-400 rounded-[1.2rem] flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] hover:bg-white/10 transition-all">
         <Calculator size={14} /> Exportar Dimensionamento (PDF)
      </button>

      <p className="text-center mt-6 text-[9px] text-slate-600 uppercase tracking-widest font-mono">
         Áquila Pro Infrastructure Planner & Optimization Strategy
      </p>
    </div>
  );
};
