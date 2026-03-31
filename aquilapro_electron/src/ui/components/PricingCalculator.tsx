import React, { useState } from 'react';
import { Calculator, School, MapPin, Users, DollarSign } from 'lucide-react';
import { pricingService } from '../../services/PricingService';

/**
 * Phase 401+: Pricing Calculator Component
 * Ferramenta estratégica para o fundador realizar orçamentos em tempo real.
 */
export const PricingCalculator: React.FC = () => {
  const [schoolType, setSchoolType] = useState<'private' | 'public'>('private');
  const [region, setRegion] = useState<'capital' | 'interior'>('capital');
  const [students, setStudents] = useState<number>(500);
  const [planId, setPlanId] = useState<string>('standard');

  const estimate = pricingService.calculateQuote(schoolType, region, students, planId);

  return (
    <div className="pricing-calculator p-4 bg-slate-900/40 border border-white/5 rounded-xl">
      <div className="flex items-center gap-2 mb-4 text-emerald-400">
        <Calculator size={16} />
        <h3 className="text-xs font-bold uppercase">Simulador de Proposta Áquila</h3>
      </div>

      <div className="space-y-3">
        <div className="flex gap-2">
          <button 
            onClick={() => setSchoolType('private')}
            className={`flex-1 py-1 text-[9px] border rounded ${schoolType === 'private' ? 'bg-blue-500/20 border-blue-500' : 'border-white/10'}`}
          >
            PRIVADA
          </button>
          <button 
            onClick={() => setSchoolType('public')}
            className={`flex-1 py-1 text-[9px] border rounded ${schoolType === 'public' ? 'bg-blue-500/20 border-blue-500' : 'border-white/10'}`}
          >
            PÚBLICA
          </button>
        </div>

        <div className="flex gap-2">
          <div className="flex-1">
            <label className="text-[8px] text-slate-500 mb-1 block">REGIÃO</label>
            <select 
              value={region} 
              title="Selecione a Região"
              onChange={(e) => setRegion(e.target.value as any)}
              className="w-full bg-slate-800 text-[9px] border border-white/10 rounded px-1"
            >
              <option value="capital">CAPITAL</option>
              <option value="interior">INTERIOR</option>
            </select>
          </div>
          <div className="flex-1">
            <label className="text-[8px] text-slate-500 mb-1 block">ALUNOS</label>
            <input 
              type="number" 
              value={students} 
              title="Quantidade de Alunos"
              placeholder="Ex: 500"
              onChange={(e) => setStudents(parseInt(e.target.value))}
              className="w-full bg-slate-800 text-[9px] border border-white/10 rounded px-1"
            />
          </div>
        </div>

        <div>
          <label className="text-[8px] text-slate-500 mb-1 block">PLANO</label>
          <select 
            value={planId} 
            title="Selecione o Plano"
            onChange={(e) => setPlanId(e.target.value)}
            className="w-full bg-slate-800 text-[9px] border border-white/10 rounded px-1"
          >
            <option value="basic">ÁQUILA BASIC</option>
            <option value="standard">ÁQUILA VISION</option>
            <option value="premium">ÁQUILA ELITE</option>
          </select>
        </div>

        <div className="mt-4 pt-4 border-t border-white/5 flex justify-between items-end">
          <div>
            <div className="text-[8px] text-slate-500">MENSALIDADE ESTIMADA</div>
            <div className="text-xl font-black text-emerald-400">R$ {estimate.toLocaleString('pt-BR')}</div>
          </div>
          <button className="px-3 py-1 bg-emerald-500 text-slate-900 text-[9px] font-bold rounded hover:bg-emerald-400 transition-colors">
            GERAR PDF
          </button>
        </div>
      </div>
    </div>
  );
};
