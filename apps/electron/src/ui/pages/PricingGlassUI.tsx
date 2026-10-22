import React, { useState, useEffect } from 'react';
import { ShieldCheck, Tag, DollarSign, Calculator, Settings, HardDrive, CheckCircle } from 'lucide-react';
import './PricingGlassUI.css';

interface PricingPlan {
  id: string;
  name: string;
  description: string;
  monthlyPerStudent: number;
  features: string[];
}

interface QuoteConfig {
  type: 'public' | 'private';
  region: string;
  studentCount: number;
  planId: string;
  unitCount: number;
}

export const PricingGlassUI: React.FC<{ onBack?: () => void }> = ({ onBack }) => {
  const [plans, setPlans] = useState<PricingPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState<QuoteConfig>({
    type: 'private',
    region: 'capital',
    studentCount: 300,
    planId: 'pro',
    unitCount: 1
  });
  const [quoteResult, setQuoteResult] = useState<any>(null);

  const aquila = (window as any).aquila;

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      const data = await aquila.invoke('pricing:get-plans');
      setPlans(data || []);
      if (data && data.length > 0) {
        setConfig(prev => ({ ...prev, planId: data[1]?.id || data[0].id }));
      }
    } catch (err) {
      console.error('Erro ao carregar planos:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCalculate = async () => {
    try {
      const quote = await aquila.invoke(
        'pricing:calculate-quote',
        config.type,
        config.region,
        config.studentCount,
        config.planId,
        config.unitCount
      );
      setQuoteResult(quote);
    } catch (err) {
      console.error('Erro ao calcular quote:', err);
    }
  };

  if (loading) return <div className="p-10 text-center animate-pulse">Sincronizando Módulo de Negócios...</div>;

  return (
    <div className="pricing-container">
      <header className="pricing-header">
        <div className="flex items-center gap-4">
          {onBack && (
            <button onClick={onBack} className="text-dim hover:text-white transition-colors">← Voltar</button>
          )}
          <div className="pricing-icon-wrapper">
            <DollarSign size={28} className="text-emerald-400" />
          </div>
          <div>
            <h1 className="text-2xl font-black uppercase tracking-wider">Gestão de Preços & Planos</h1>
            <p className="text-dim text-sm">Configuração de Tiers do Sovereign OS e Simulação de ROI.</p>
          </div>
        </div>
      </header>

      <div className="pricing-grid mt-6">
        {/* Lista de Planos */}
        <section className="pricing-plans-section glass-panel">
          <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
            <Tag size={18} className="text-blue-400" /> Planos Disponíveis
          </h2>
          <div className="plans-list">
            {plans.map(plan => (
              <div key={plan.id} className={`plan-card ${config.planId === plan.id ? 'plan-active' : ''}`} onClick={() => setConfig({ ...config, planId: plan.id })}>
                <div className="plan-header">
                  <h3 className="plan-name">{plan.name}</h3>
                  <div className="plan-price">R$ {plan.monthlyPerStudent.toFixed(2)}<span className="text-xs text-dim">/aluno</span></div>
                </div>
                <p className="plan-desc">{plan.description}</p>
                <ul className="plan-features">
                  {plan.features.slice(0, 3).map((f, i) => (
                    <li key={i}><CheckCircle size={12} className="text-emerald-400" /> {f}</li>
                  ))}
                  {plan.features.length > 3 && (
                    <li className="text-dim text-xs italic">+ {plan.features.length - 3} funcionalidades</li>
                  )}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* Simulador de Custo / ROI */}
        <section className="pricing-calculator-section glass-panel">
          <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
            <Calculator size={18} className="text-purple-400" /> Simulador de Contratos
          </h2>
          
          <div className="calc-form">
            <div className="form-group">
              <label>Tipo de Instituição</label>
              <select value={config.type} onChange={e => setConfig({ ...config, type: e.target.value as any })}>
                <option value="private">Escola Particular</option>
                <option value="public">Rede Pública</option>
              </select>
            </div>
            
            <div className="form-group">
              <label>Região / Demografia</label>
              <select value={config.region} onChange={e => setConfig({ ...config, region: e.target.value })}>
                <option value="capital">Capital</option>
                <option value="interior">Interior</option>
              </select>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Total de Alunos</label>
                <input type="number" min="10" step="10" value={config.studentCount} onChange={e => setConfig({ ...config, studentCount: parseInt(e.target.value) || 0 })} />
              </div>
              <div className="form-group">
                <label>Número de Unidades</label>
                <input type="number" min="1" max="50" value={config.unitCount} onChange={e => setConfig({ ...config, unitCount: parseInt(e.target.value) || 1 })} />
              </div>
            </div>

            <button onClick={handleCalculate} className="btn-calculate w-full mt-4">
              <Calculator size={16} /> Calcular Contrato e ROI
            </button>
          </div>

          {quoteResult && (
            <div className="quote-result mt-6 animate-fade-in">
              <h3 className="text-sm font-bold uppercase text-dim mb-2">Proposta Comercial</h3>
              <div className="quote-card">
                <div className="quote-row">
                  <span>Mensalidade Base (Software):</span>
                  <span className="font-mono">R$ {quoteResult.totalMonthlyBase.toFixed(2)}</span>
                </div>
                <div className="quote-row">
                  <span>Hardware Áquila Edge (Comodato):</span>
                  <span className="font-mono">R$ {quoteResult.totalHardwareCost.toFixed(2)}</span>
                </div>
                {quoteResult.descontoAplicado > 0 && (
                  <div className="quote-row text-emerald-400">
                    <span>Desconto Aplicado (Volume):</span>
                    <span className="font-mono">- {Math.round(quoteResult.descontoAplicado * 100)}%</span>
                  </div>
                )}
                <div className="quote-divider"></div>
                <div className="quote-row text-lg font-black text-blue-400">
                  <span>Mensalidade Total Projetada:</span>
                  <span className="font-mono">R$ {quoteResult.finalMonthlyCost.toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default PricingGlassUI;
