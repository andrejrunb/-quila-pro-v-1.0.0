import React, { useState, useEffect, useMemo } from 'react';
import { 
  CreditCard, TrendingUp, Users, School, Globe, 
  ShieldCheck, Zap, PieChart, Calculator, CheckCircle2,
  ChevronRight, Info
} from 'lucide-react';
import './PricingDashboard.css';

// ─── Types ──────────────────────────────────────────────────
interface ROIResult {
  legacyTotal: number;
  aquilaMonthly: number;
  savings: number;
  percentage: number;
  details: Record<string, number>;
}

interface QuoteResult {
  success: boolean;
  perStudent: number;
  totalValue: number;
  netValue: number;
  taxTotal: number;
  discount: number;
  quote: string;
}

interface SaaSPlanItem {
  id: string;
  name: string;
  basePrice: number;
  allowWhiteLabel: boolean;
}

// ─── Component ─────────────────────────────────────────────
const PricingDashboard: React.FC = () => {
  const [studentCount, setStudentCount] = useState(350);
  const [schoolType, setSchoolType] = useState<'public' | 'private'>('private');
  const [unitCount, setUnitCount] = useState(1);
  const [selectedPlan, setSelectedPlan] = useState('professional');
  
  const [roi, setRoi] = useState<ROIResult | null>(null);
  const [quote, setQuote] = useState<QuoteResult | null>(null);
  const [plans, setPlans] = useState<SaaSPlanItem[]>([]);

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        const availablePlans = await (window as any).aquila.invoke('finance:get-plans');
        setPlans(availablePlans);
      } catch (err) {
        console.error('Failed to load plans', err);
        // Fallback for UI design phase
        setPlans([
          { id: 'starter', name: 'Starter', basePrice: 7.5, allowWhiteLabel: false },
          { id: 'professional', name: 'Pro', basePrice: 7.0, allowWhiteLabel: true },
          { id: 'sovereign', name: 'Elite', basePrice: 6.5, allowWhiteLabel: true },
          { id: 'perpetual', name: 'Perpetual', basePrice: 250, allowWhiteLabel: true },
        ]);
      }
    };
    loadData();
  }, []);

  // Update ROI and Quote when inputs change
  useEffect(() => {
    const updateSimulations = async () => {
      try {
        const roiResult = await (window as any).aquila.invoke('finance:calculate-roi', { studentCount, schoolType, unitCount });
        const quoteResult = await (window as any).aquila.invoke('finance:calculate-quote', { criteria: { type: schoolType, region: 'capital', count: studentCount, planId: selectedPlan, unitCount } });
        
        setRoi(roiResult);
        setQuote(quoteResult);
      } catch (err) {
        console.error('Simulation failed', err);
      }
    };

    const debounce = setTimeout(updateSimulations, 300);
    return () => clearTimeout(debounce);
  }, [studentCount, schoolType, unitCount, selectedPlan]);

  return (
    <div className="pricing-dashboard">
      <header className="pd-header">
        <div>
          <h1 className="pd-title">Financeiro & ROI Institucional</h1>
          <p className="hc-subtitle">Simule o impacto financeiro da migração para a soberania digital.</p>
        </div>
        <div className="hc-version-badge">Phase 401+</div>
      </header>

      <div className="pd-grid">
        {/* Left: Input Simulator */}
        <section className="pd-card">
          <h2 className="pd-card-title">
            <Calculator size={20} />
            Simulador de Carga
          </h2>
          <div className="pd-simulator">
            <div className="pd-form-group">
              <label className="pd-label">
                Volume de Alunos
                <span>{studentCount}</span>
              </label>
              <input 
                type="range" 
                min="50" 
                max="5000" 
                step="50" 
                value={studentCount} 
                onChange={(e) => setStudentCount(parseInt(e.target.value))}
                className="pd-input-range"
              />
            </div>

            <div className="pd-form-group">
              <label className="pd-label">Natureza da Instituição</label>
              <div className="pd-toggle-group">
                <button 
                  className={`pd-toggle-btn ${schoolType === 'private' ? 'pd-toggle-active' : ''}`}
                  onClick={() => setSchoolType('private')}
                >
                  Privada
                </button>
                <button 
                  className={`pd-toggle-btn ${schoolType === 'public' ? 'pd-toggle-active' : ''}`}
                  onClick={() => setSchoolType('public')}
                >
                  Pública (Gov)
                </button>
              </div>
            </div>

            <div className="pd-form-group">
              <label className="pd-label">
                Número de Unidades / Hubs
                <span>{unitCount}</span>
              </label>
              <input 
                type="range" 
                min="1" 
                max="20" 
                step="1" 
                value={unitCount} 
                onChange={(e) => setUnitCount(parseInt(e.target.value))}
                className="pd-input-range"
              />
            </div>
          </div>
        </section>

        {/* Right: ROI Summary */}
        <section className="pd-card">
          <h2 className="pd-card-title">
            <TrendingUp size={20} />
            Economia Estimada (Mensal)
          </h2>
          {roi && (
            <div className="pd-roi-results">
              <div className="pd-roi-stat">
                <div className="pd-roi-value">R$ {roi.savings.toLocaleString('pt-BR')}</div>
                <div className="pd-roi-label">Economia Direta</div>
              </div>
              <div className="pd-roi-stat">
                <div className="pd-roi-value" style={{ color: '#3b82f6' }}>{roi.percentage}%</div>
                <div className="pd-roi-label">Redução de Custos</div>
              </div>
              <div className="pd-roi-stat" style={{ gridColumn: 'span 2' }}>
                <div className="pd-roi-value" style={{ color: '#94a3b8', fontSize: '1.1rem' }}>
                  R$ {roi.legacyTotal.toLocaleString('pt-BR')}
                </div>
                <div className="pd-roi-label">Custo Atual Estimado (Legacy)</div>
              </div>
            </div>
          )}
          <div style={{ marginTop: '1.5rem', fontSize: '0.8rem', color: '#64748b', display: 'flex', gap: '0.5rem' }}>
            <Info size={14} />
            Cálculo baseado em custos médios de SMS, servidores cloud e licenças de software fragmentadas.
          </div>
        </section>

        {/* Tiers Selection */}
        <section className="pd-card" style={{ gridColumn: '1 / -1' }}>
          <h2 className="pd-card-title">
            <ShieldCheck size={20} />
            Modelos de Licenciamento
          </h2>
          <div className="pd-tiers">
            {plans.map(plan => (
              <div 
                key={plan.id} 
                className={`pd-tier-card ${selectedPlan === plan.id ? 'pd-tier-selected' : ''}`}
                onClick={() => setSelectedPlan(plan.id)}
              >
                <div className="pd-tier-name">{plan.name}</div>
                <div className="pd-tier-price">
                  R$ {plan.basePrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  <span style={{ fontSize: '0.7rem', color: '#64748b' }}>
                    {plan.id === 'perpetual' ? ' /aluno' : ' /mês/aluno'}
                  </span>
                </div>
                <ul className="pd-tier-features">
                  <li>Biometria Local</li>
                  {plan.id !== 'starter' && <li>White Label</li>}
                  {(plan.id === 'sovereign' || plan.id === 'perpetual') && <li>Aceleração NPU</li>}
                  {plan.id === 'sovereign' && <li>Sovereign Mesh</li>}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* Big Quote Hero */}
        <section className="pd-card pd-quote-hero">
          <div className="pd-roi-label">Cotação Institucional Final</div>
          {quote ? (
            <>
              <div className="pd-quote-value">{quote.quote}</div>
              <div className="pd-quote-per-student">
                Equivalente a R$ {quote.perStudent.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} por aluno/mês
              </div>
              <div style={{ color: '#10b981', fontSize: '0.9rem', marginTop: '0.5rem', fontWeight: '600' }}>
                Bônus de Impacto: {quote.discount}% de desconto aplicado
              </div>
            </>
          ) : (
            <div className="pd-quote-value">---</div>
          )}
          <button className="pd-btn-primary">
            Exportar Proposta Comercial (PDF)
          </button>
        </section>
      </div>
    </div>
  );
};

export default PricingDashboard;
