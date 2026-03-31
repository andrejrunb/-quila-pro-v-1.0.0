import React, { useState, useEffect } from 'react';
import { TrendingUp, CreditCard, DollarSign } from 'lucide-react';
import { financialForecastingService, FinancialMetricType } from '../../services/FinancialForecastingService';
import './FinancialHealthWidget.css';

/**
 * FinancialHealthWidget (v2041)
 * Dashboard component for the school owner showing predictive revenue and churn.
 */
export const FinancialHealthWidget: React.FC = () => {
    const [revenue, setRevenue] = useState<number>(0);
    const [ltv, setLtv] = useState<number>(0);

    useEffect(() => {
       const fetchFinancials = async () => {
          const projection = await financialForecastingService.predictRevenue(6);
          setRevenue(projection.value);
          setLtv(financialForecastingService.getLTV());
       };
       fetchFinancials();
    }, []);

    const formatCurrency = (val: number) => 
        new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

    return (
       <div className="financial-health-card animate-fade-in">
          <header className="widget-header flex items-center justify-between mb-4">
             <div className="flex items-center gap-2">
                <DollarSign className="text-emerald-400" size={18} />
                <h3 className="text-xs font-black uppercase tracking-widest">Saúde Financeira Preditiva</h3>
             </div>
             <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-bold">EM CRESCIMENTO</span>
          </header>

          <div className="financial-stats-grid grid grid-cols-2 gap-4">
             <div className="stat-item">
                <span className="stat-label">Projeção (6 Meses)</span>
                <span className="stat-value">{formatCurrency(revenue)}</span>
                <div className="stat-trend flex items-center gap-1 text-[10px] text-emerald-400">
                   <TrendingUp size={10} />
                   <span>+12.4% vs 2023</span>
                </div>
             </div>
             <div className="stat-item border-l border-white/5 pl-4">
                <span className="stat-label">LTV Automático</span>
                <span className="stat-value">{formatCurrency(ltv)}</span>
                <span className="stat-meta text-[10px] opacity-40">Média por Aluno</span>
             </div>
          </div>

          <footer className="mt-4 pt-4 border-t border-white/5">
             <div className="flex items-center gap-2 text-[10px] opacity-60">
                <CreditCard size={12} />
                <span>Próxima Conciliação: <strong>Hoje às 23:59</strong></span>
             </div>
          </footer>
       </div>
    );
};
