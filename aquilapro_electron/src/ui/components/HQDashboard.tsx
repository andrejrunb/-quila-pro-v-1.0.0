import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Activity, AlertCircle, CheckCircle2, Globe, Users } from 'lucide-react';
import { globalAnalyticsService } from '../../services/GlobalAnalyticsService';
import './HQDashboard.css';

/**
 * Phase 510: HQDashboard
 * Visualização consolidada de todas as unidades da rede Áquila.
 */
export const HQDashboard: React.FC = () => {
  const [summary, setSummary] = useState(globalAnalyticsService.getGlobalSummary());

  useEffect(() => {
    const handleUpdate = (newSummary: any) => setSummary(newSummary);
    globalAnalyticsService.on('data-refreshed', handleUpdate);
    
    const interval = setInterval(() => globalAnalyticsService.refreshData(), 8000);
    
    return () => {
      globalAnalyticsService.removeListener('data-refreshed', handleUpdate);
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="hq-dashboard-container page-transition">
      <header className="hq-header">
        <div className="flex items-center gap-3">
          <div className="hq-logo-icon">
            <Globe size={32} className="text-blue-500" />
          </div>
          <div>
            <h1 className="text-3xl font-black italic tracking-tighter">ÁQUILA HQ</h1>
            <p className="text-slate-400 text-xs uppercase tracking-widest">Master Network Monitoring</p>
          </div>
        </div>
        
        <div className="hq-global-stats">
          <div className="global-stat-card">
            <Users size={20} className="text-blue-400" />
            <div className="stat-content">
              <span className="value">{summary.totalStudents}</span>
              <span className="label">Alunos Online</span>
            </div>
          </div>
          <div className="global-stat-card">
            <Activity size={20} className="text-emerald-400" />
            <div className="stat-content">
              <span className="value">{summary.unitsOnline}/3</span>
              <span className="label">Unidades Ativas</span>
            </div>
          </div>
        </div>
      </header>

      <div className="units-grid">
        {summary.units.map(unit => (
          <div key={unit.id} className={`unit-card status-${unit.serverStatus}`}>
            <div className="unit-card-header">
              <h3 className="font-bold">{unit.name}</h3>
              {unit.serverStatus === 'healthy' ? (
                <CheckCircle2 size={18} className="text-emerald-500" />
              ) : (
                <AlertCircle size={18} className="text-amber-500" />
              )}
            </div>
            
            <div className="unit-card-body">
              <div className="unit-detail">
                <span className="text-slate-500">Alunos:</span>
                <span className="font-mono text-white">{unit.onlineStudents}</span>
              </div>
              <div className="unit-detail">
                <span className="text-slate-500">Alertas Ativos:</span>
                <span className={`font-mono ${unit.activeAlerts > 0 ? 'text-amber-400' : 'text-slate-400'}`}>
                  {unit.activeAlerts}
                </span>
              </div>
            </div>

            <div className="unit-card-footer">
              <div className="health-bar">
                <div className="health-fill" />
              </div>
              <span className="text-[10px] text-slate-500 mt-2 block">UPTIME: 99.9%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
