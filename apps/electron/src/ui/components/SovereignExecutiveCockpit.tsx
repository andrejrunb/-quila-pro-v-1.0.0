import React, { useState, useEffect } from 'react';
import { HoneycombMeshPulse } from './HoneycombMeshPulse';
import { PassiveSafetyGrid } from './PassiveSafetyGrid';
import { HexCellCard } from './HexCellCard';
import { CouncilRoom } from './CouncilRoom';
import { attendanceAuditService } from '../../services/AttendanceAuditService';
import { geofenceMonitorService } from '../../services/GeofenceMonitorService';
import { councilService } from '../../services/SovereignCouncilService';
import { nexusSyncService } from '../../services/NexusSyncService';
import { institutionalBudgetService, BudgetReport } from '../../services/InstitutionalBudgetService';
import '../styles/CoolmeiaUX.css';

/**
 * SOVEREIGN EXECUTIVE PULSE (v4002)
 * ----------------------------------
 * Centro de Comando Centralizado para os 4 Pilares da Soberania.
 */
interface CockpitMetrics {
  refinedIdentities: number;
  auditAnomalies: number;
  activeArrivals: number;
  swarmHealth: number;
}

export const SovereignExecutiveCockpit: React.FC = () => {
  const [showCouncil, setShowCouncil] = useState(false);
  const [metrics, setMetrics] = useState<CockpitMetrics>({
    refinedIdentities: 0,
    auditAnomalies: 0,
    activeArrivals: 0,
    swarmHealth: 100
  });

  const [arrivals, setArrivals] = useState<any[]>([]);
  const [budget, setBudget] = useState<BudgetReport | null>(null);

  useEffect(() => {
    const updateMetrics = async () => {
      try {
        const stats = await window.aquila.invoke('audit:get-stats');
        const arriving = await window.aquila.invoke('geofence:get-arriving');
        const swarm = await window.aquila.getSwarmStatus();
        const budgetReport = await window.aquila.invoke('finance:get-stats');
        
        const nodes = swarm || [];
        const syncedNodes = nodes.filter((n: any) => n.syncStatus === 'synced').length;
        const health = nodes.length > 0 ? (syncedNodes / nodes.length) * 100 : 100;

        setMetrics({
          refinedIdentities: 12,
          auditAnomalies: stats?.anomalies || 0,
          activeArrivals: arriving?.length || 0,
          swarmHealth: Math.round(health)
        });
        setArrivals(arriving || []);
        setBudget(budgetReport);
      } catch (err) {
        console.error('Failed to update cockpit metrics:', err);
      }
    };

    updateMetrics();
    const interval = setInterval(updateMetrics, 5000);

    // Subscribe to real-time pulse
    const unsubscribe = window.aquila.onNexusPulse(() => updateMetrics());

    return () => {
      clearInterval(interval);
      unsubscribe();
    };
  }, []);

  if (showCouncil) {
    return <CouncilRoom />;
  }

  return (
    <div className="coolmeia-command-center sovereign-v4002">
      {/* HEADER EXECUTIVO (v4002) */}
      <header className="cockpit-header">
        <div className="brand-group">
           <h2 className="hive-title hive-header-title">ÁQUILA PRO | SOVEREIGN EXECUTIVE PULSE</h2>
           <p className="hive-subtitle">NEXUS SWARM STATUS: PROTECTED (v4002)</p>
        </div>
        <div className="hive-badge">SOVEREIGN OS ELITE</div>
      </header>

      <div className="cockpit-main-layout">
        <aside className="cockpit-sidebar">
          {/* RADAR DE GEOFENCING (Fase 14) */}
          <section className="geofence-radar-panel">
             <h3 className="hive-title hive-panel-title">RADAR DE CHEGADA (ETA)</h3>
             <div className="arrivals-list">
                {arrivals.length > 0 ? arrivals.map(p => (
                  <div key={p.parentId} className="arrival-item pulse-border">
                     <span className="parent-name">{p.parentName}</span>
                     <span className="arrival-eta">{p.etaMinutes} min</span>
                     <div className="arrival-status-line" data-status={p.status}></div>
                  </div>
                )) : (
                  <div className="no-arrivals-placeholder">
                    <p>Aguardando aproximação de responsáveis...</p>
                  </div>
                )}
             </div>
          </section>

          {/* MÉTRICAS DE IDENTIDADE (Fase 12) */}
          <section className="identity-velocity-panel">
             <HexCellCard 
               title="AUTO-REFINEMENT" 
               subtitle={`${metrics.refinedIdentities} IDs Atualizados`}
               status="active"
               icon="🧬"
             />
          </section>
        </aside>

        <main className="cockpit-content">
          {/* MESH PULSE (NPU LOAD Fase 15) */}
          <section className="mesh-vision-section">
             <HoneycombMeshPulse />
          </section>

          {/* PASSIVE SAFETY (Fase 16) */}
          <section className="passive-grid-section">
             <PassiveSafetyGrid />
          </section>
        </main>

        <aside className="cockpit-intelligence">
          {/* AUDITORIA CIENTÍFICA (Fase 13) */}
          <section className="audit-anomaly-panel">
               <HexCellCard 
                 title="AUDIT ANOMALIES" 
                 subtitle={`${metrics.auditAnomalies} Discrepâncias`}
                 status={metrics.auditAnomalies > 0 ? 'alert' : 'sync'}
                 icon="🔍"
               />
          </section>

          {/* SWARM RESILIENCE (v4002) */}
          <section className="swarm-health-panel">
               <HexCellCard 
                 title="SWARM HEALTH" 
                 subtitle={`${metrics.swarmHealth}% Resilience`}
                 status={metrics.swarmHealth > 90 ? 'active' : 'alert'}
                 icon="💠"
               />
          </section>

          <section className="governance-gate">
               <HexCellCard 
                 title="FINANCIAL GLASS" 
                 subtitle={budget ? `Saldo: R$ ${budget.surplus.toFixed(2)}` : 'Calculando...'}
                 status="sync"
                 icon="💎"
               />
               <button className="council-btn" onClick={() => setShowCouncil(true)}>
                 ⚖️ SALA DO CONSELHO
               </button>
          </section>
        </aside>
      </div>

      <footer className="cockpit-footer">
          <div className="hive-subtitle">SISTEMA ÁQUILA PRO - NEXUS SWARM CERTIFIED v4002</div>
      </footer>
    </div>
  );
};
