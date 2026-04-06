import React, { useState } from 'react';
import { Package, Calculator, ShoppingCart, Info, TrendingUp, CheckCircle } from 'lucide-react';
import { affiliateService, AffiliateProduct } from '../../services/AffiliateService';

interface KitItem {
  product: AffiliateProduct;
  quantity: number;
}

/**
 * ProcurementKitBuilder (v1618)
 * Interface para criação automática de projetos de infraestrutura.
 * Sugere hardware baseado no porte da escola.
 */
export const ProcurementKitBuilder: React.FC = () => {
  const [schoolSize, setSchoolSize] = useState<'small' | 'medium' | 'large'>('small');
  const [tier, setTier] = useState<'economy' | 'enterprise'>('economy');
  
  const generateKit = (): KitItem[] => {
    const products = affiliateService.getAllVerified().filter(p => p.tier === tier);
    const multipliers = {
      small: { WIFI_REPEATER: 3, COMPUTER: 1, TABLET: 2, DISPLAY: 1 },
      medium: { WIFI_REPEATER: 8, COMPUTER: 3, TABLET: 10, DISPLAY: 3 },
      large: { WIFI_REPEATER: 20, COMPUTER: 8, TABLET: 25, DISPLAY: 8 },
    };

    const config = multipliers[schoolSize];
    return products.map(p => ({
      product: p,
      quantity: (config as any)[p.category] || 0
    })).filter(item => item.quantity > 0);
  };

  const kit = generateKit();
  const total = kit.reduce((acc, item) => acc + (item.product.priceEstimate * item.quantity), 0);

  return (
    <div className="bg-[#0f172a] border border-indigo-500/20 p-10 rounded-[3.5rem] shadow-2xl overflow-hidden relative">
      <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none">
        <Package size={200} className="text-indigo-500" />
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start gap-8 mb-12 relative z-10">
        <div>
          <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter leading-none">
            Kit <span className="text-indigo-500">Builder</span>
          </h2>
          <p className="text-[10px] text-slate-500 font-black tracking-widest uppercase mt-2">Professional Infrastructure Deployment // v1618</p>
        </div>

        <div className="flex flex-col gap-4">
           {/* Size Selector */}
           <div className="flex bg-white/5 p-2 rounded-2xl border border-white/10">
              {(['small', 'medium', 'large'] as const).map(size => (
                <button
                  key={size}
                  onClick={() => setSchoolSize(size)}
                  className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${
                    schoolSize === size ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'
                  }`}
                >
                  {size === 'small' ? 'Pequena' : size === 'medium' ? 'Média' : 'Grande'}
                </button>
              ))}
           </div>

           {/* Tier Selector v1618 */}
           <div className="flex bg-white/5 p-2 rounded-2xl border border-white/10">
              {(['economy', 'enterprise'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setTier(t)}
                  className={`flex-1 px-4 py-2 rounded-xl text-[8px] font-black uppercase transition-all ${
                    tier === t ? 'bg-amber-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'
                  }`}
                >
                  {t === 'economy' ? 'Plano Econômico' : 'Plano Enterprise (IA High)'}
                </button>
              ))}
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 relative z-10">
        <div className="space-y-4 max-h-[400px] overflow-y-auto pr-4 custom-scrollbar">
          {kit.map(item => (
            <div key={item.product.id} className="bg-white/5 border border-white/5 p-6 rounded-3xl flex justify-between items-center group hover:border-indigo-500/30 transition-all">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-indigo-400 font-black">
                  {item.quantity}x
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">{item.product.name}</h4>
                  <p className="text-[9px] text-slate-500 uppercase tracking-widest">{item.product.category}</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs font-bold text-white block">R$ {(item.product.priceEstimate * item.quantity).toFixed(2)}</span>
                <button 
                  onClick={() => window.open(item.product.affiliateUrl, '_blank')}
                  className="text-[8px] font-black text-indigo-500 uppercase mt-1 hover:underline flex items-center gap-1 ml-auto"
                >
                  Link de Compra <ShoppingCart size={8} />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white/5 rounded-[2.5rem] p-8 border border-white/10 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-6">
               <TrendingUp size={20} className="text-green-500" />
               <span className="text-[10px] font-black uppercase text-slate-400">Projeção de Eficiência RuView</span>
            </div>
            <div className="space-y-6">
               <div className="flex justify-between items-center bg-white/5 p-4 rounded-2xl">
                  <span className="text-[9px] font-black uppercase text-slate-500 tracking-widest">Precisão de Rastreio</span>
                  <span className="text-xl font-black text-white italic">+{schoolSize === 'large' ? '98%' : schoolSize === 'medium' ? '85%' : '65%'}</span>
               </div>
               <div className="flex justify-between items-center bg-white/5 p-4 rounded-2xl">
                  <span className="text-[9px] font-black uppercase text-slate-500 tracking-widest">Total de Ativos</span>
                  <span className="text-xl font-black text-white italic">{kit.reduce((a, b) => a + b.quantity, 0)} Unidades</span>
               </div>
            </div>
          </div>

          <div className="mt-12">
            <div className="text-right mb-6">
              <span className="text-[10px] text-slate-500 block uppercase font-black">Investimento Estimado</span>
              <span className="text-4xl font-black text-white italic tracking-tighter">R$ {total.toFixed(2)}</span>
            </div>
            <button className="w-full py-6 bg-white text-black rounded-3xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all transform active:scale-95">
              Baixar Projeto Executivo (PDF)
            </button>
          </div>
        </div>
      </div>

      <div className="mt-8 flex items-center justify-center gap-6">
         <div className="flex items-center gap-2 text-[9px] text-slate-500 font-bold uppercase">
            <CheckCircle size={12} className="text-green-500" /> Preços Médios Verificados
         </div>
         <div className="flex items-center gap-2 text-[9px] text-slate-500 font-bold uppercase">
            <CheckCircle size={12} className="text-green-500" /> Links de Afiliados Homologados
         </div>
      </div>
    </div>
  );
};
