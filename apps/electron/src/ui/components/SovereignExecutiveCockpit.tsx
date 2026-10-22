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
import { OutcomeDashboard } from './OutcomeDashboard';
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
  engagementScore: number;
  roi: {
    totalRevenue: number;
    operatingCosts: number;
    netProfit: number;
    roiPercentage: number;
  };
  pulse: {
    cortex_utilization: number;
    system_latency: number;
    security_score: number;
  };
  supportIncidents: number;
  complianceRate: number;
  criticalRiskStudents: number;
  pendingNegotiations: number;
  pedagogicalPulse: {
    recentReports: any[];
    averageEngagement: number;
    classesInProgress: number;
  };
}

export const SovereignExecutiveCockpit: React.FC = () => {
  const [showCouncil, setShowCouncil] = useState(false);
  const [showPredictive, setShowPredictive] = useState(false);
  const [metrics, setMetrics] = useState<CockpitMetrics>({
    refinedIdentities: 0,
    auditAnomalies: 0,
    activeArrivals: 0,
    swarmHealth: 100,
    engagementScore: 87,
    roi: { totalRevenue: 0, operatingCosts: 0, netProfit: 0, roiPercentage: 0 },
    pulse: { cortex_utilization: 0, system_latency: 0, security_score: 100 },
    cortex: { state: null, metrics: [] },
    supportIncidents: 0,
    complianceRate: 100,
    criticalRiskStudents: 0,
    pendingNegotiations: 0,
    pedagogicalPulse: {
      recentReports: [],
      averageEngagement: 0,
      classesInProgress: 0
    }
  });

  const [arrivals, setArrivals] = useState<any[]>([]);
  const [budget, setBudget] = useState<BudgetReport | null>(null);

  useEffect(() => {
    const updateMetrics = async () => {
      try {
        const stats = await window.aquila.invoke('audit:get-stats');
        const arriving = await window.aquila.invoke('geofence:get-arriving');
        const swarm = await window.aquila.getSwarmStatus();
        const pulse = await window.aquila.executive.getPulse();
        const roiData = await window.aquila.executive.getROI();
        const budgetReport = await window.aquila.executive.getBudgetReport();
        const cortexState = await window.aquila.getCortexState();
        const evolutionMetrics = await window.aquila.getEvolutionMetrics();
        
        const identityStats = await window.aquila.invoke('identity:get-stats');
        const supportSummary = await window.aquila.invoke('support:get-summary');
        const hrCompliance = await window.aquila.invoke('hr:get-compliance-dashboard');
        const riskStats = await window.aquila.invoke('pedagogical:getRiskStats');
        const debtRecords = await window.aquila.invoke('finance:get-records');
        const recentReports = await window.aquila.invoke('pedagogical:get-recent-reports', 3);
        const engagement = await window.aquila.invoke('analytics:get-engagement');
        const dailyAttendance = await window.aquila.invoke('attendance:get-stats');
        
        const nodes = swarm || [];
        const syncedNodes = nodes.filter((n: any) => n.syncStatus === 'synced').length;
        const health = nodes.length > 0 ? (syncedNodes / nodes.length) * 100 : 100;

        setMetrics({
          refinedIdentities: identityStats?.totalRefinements || 0,
          auditAnomalies: stats?.anomalies || 0,
          activeArrivals: arriving?.length || 0,
          swarmHealth: Math.round(health),
          engagementScore: pulse?.engagementScore || 87,
          roi: {
            totalRevenue: budgetReport?.totalRevenue || 0,
            operatingCosts: budgetReport?.totalExpenses || 0,
            netProfit: budgetReport?.surplus || 0,
            roiPercentage: roiData?.roiPercentage || 0
          },
          pulse: pulse || { cortex_utilization: 0, system_latency: 0, security_score: 100 },
          pedagogicalPulse: {
            recentReports: recentReports || [],
            averageEngagement: engagement?.score || 92,
            classesInProgress: dailyAttendance?.activeClasses || 0
          },
          cortex: {
            state: cortexState,
            metrics: evolutionMetrics
          },
          supportIncidents: supportSummary?.open || 0,
          complianceRate: hrCompliance?.complianceRate || 100,
          criticalRiskStudents: riskStats?.criticalStudents || 0,
          pendingNegotiations: debtRecords?.length || 0
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

  if (showPredictive) {
    return (
      <div className="predictive-overlay glass-panel" style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1000, background: 'rgba(5, 5, 5, 0.95)', overflowY: 'auto' }}>
        <header className="flex justify-between items-center p-6 border-b border-white/10" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <h2 className="text-xl font-bold text-white">CENTRAL DE INTELIGÊNCIA PREDITIVA (NÍVEL 9)</h2>
          <button className="back-btn-elite" onClick={() => setShowPredictive(false)} style={{ padding: '0.5rem 1rem', background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '4px', cursor: 'pointer' }}>← VOLTAR AO COCKPIT</button>
        </header>
        <div className="p-8">
          <OutcomeDashboard />
        </div>
      </div>
    );
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

          {/* PULSO PEDAGÓGICO AO VIVO (NOVO) */}
          <section className="pedagogical-pulse-dashboard">
             <div className="cockpit-header" style={{ marginTop: '3rem', padding: 0 }}>
                <h3 className="hive-title">PULSO PEDAGÓGICO (CÓRTEX)</h3>
                <span className="hive-badge">REAL-TIME</span>
             </div>
             
             <div className="pills-container">
                <div className="hive-pill-card">
                   <div className="pill-source-ref">ENGAGEMENT INDEX</div>
                   <div className="stat-value" style={{ fontSize: '2rem' }}>{metrics.pedagogicalPulse.averageEngagement}%</div>
                   <p className="pill-text">
                      {metrics.pedagogicalPulse.averageEngagement >= 88
                        ? `↑ ${metrics.pedagogicalPulse.averageEngagement - 88}% acima da média de referência (88%).`
                        : `↓ ${88 - metrics.pedagogicalPulse.averageEngagement}% abaixo da média de referência (88%).`}
                    </p>
                </div>
                <div className="hive-pill-card">
                   <div className="pill-source-ref">CLASSES IN PROGRESS</div>
                   <div className="stat-value" style={{ fontSize: '2rem' }}>{metrics.pedagogicalPulse.classesInProgress}</div>
                   <p className="pill-text">Docentes em sala com rastreio biométrico ativo.</p>
                </div>
             </div>

             <div className="social-anomalies-panel" style={{ marginTop: '1.5rem' }}>
                <h4 className="hive-panel-title">ÚLTIMOS RELATÓRIOS IA</h4>
                <div className="timeline-list">
                   {metrics.pedagogicalPulse.recentReports.map((report: any) => (
                     <div key={report.id} className="timeline-item" style={{ gap: '1rem' }}>
                        <div className="timeline-date" style={{ minWidth: '80px' }}>
                           {new Date(report.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        <div className="evolution-summary">
                           <strong>{report.teacherName} ({report.classId}):</strong> {report.summary}
                        </div>
                     </div>
                   ))}
                </div>
             </div>
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
                 title="FINANCIAL ROI" 
                 subtitle={`R$ ${metrics.roi.netProfit.toLocaleString()} Net`}
                 status={metrics.roi.roiPercentage > 20 ? 'active' : 'sync'}
                 icon="💰"
               />
                <div className="roi-details">
                  <div className="roi-stat">
                    <span>Revenue</span>
                    <strong>R$ {metrics.roi.totalRevenue.toLocaleString()}</strong>
                  </div>
                  <div className="roi-stat">
                    <span>Acordos</span>
                    <strong style={{color: '#fbbf24'}}>{metrics.pendingNegotiations} Pendentes</strong>
                  </div>
                </div>
                <button className="council-btn" onClick={() => setShowCouncil(true)}>
                  ⚖️ SALA DO CONSELHO
                </button>
          </section>

          {/* COMPLIANCE & RISK (NOVO) */}
          <section className="compliance-risk-panel">
               <HexCellCard 
                 title="COMPLIANCE HR" 
                 subtitle={`${metrics.complianceRate.toFixed(1)}% eSocial`}
                 status={metrics.complianceRate > 95 ? 'active' : 'alert'}
                 icon="📜"
               />
               <HexCellCard 
                 title="RISCO CRÍTICO" 
                 subtitle={`${metrics.criticalRiskStudents} Alunos`}
                 status={metrics.criticalRiskStudents > 0 ? 'alert' : 'active'}
                 icon="⚠️"
               />
          </section>

          {/* MATURIDADE NÍVEL 4 - RADAR PREDITIVO */}
          <section className="predictive-radar-trigger" style={{ cursor: 'pointer', marginTop: '1rem' }} onClick={() => setShowPredictive(true)}>
                <HexCellCard 
                  title="RADAR PREDITIVO" 
                  subtitle="Maturidade Nível 4"
                  status="active"
                  icon="👁️"
                />
                <p className="predictive-hint" style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', textAlign: 'center', marginTop: '0.4rem', fontStyle: 'italic' }}>Clique para Análise Comportamental</p>
          </section>

          <section className="support-soc-panel">
               <HexCellCard 
                 title="HELP SOC" 
                 subtitle={`${metrics.supportIncidents} Incidentes Ativos`}
                 status={metrics.supportIncidents > 0 ? 'alert' : 'active'}
                 icon="🚨"
               />
          </section>

          <section className="operational-pulse-panel">
            <h3 className="hive-title hive-panel-title">CÓRTEX TELEMETRY</h3>
            <div className="pulse-item">
              <div className="pulse-label">Utilização NPU</div>
              <div className="pulse-bar-bg">
                <div className="pulse-bar-fill" style={{width: `${metrics.pulse.cortex_utilization}%`}}></div>
              </div>
            </div>
            {metrics.cortex.metrics.length > 0 && (
              <div className="pulse-item">
                <div className="pulse-label">Eficiência Agêntica</div>
                <div className="pulse-value">{metrics.cortex.metrics[0].efficiencyGain}%</div>
              </div>
            )}
            <div className="pulse-item">
              <div className="pulse-label">Latência do Sistema</div>
              <div className="pulse-value">{metrics.pulse.system_latency}ms</div>
            </div>
          </section>
        </aside>
      </div>

      <footer className="cockpit-footer">
          <div className="hive-subtitle">SISTEMA ÁQUILA PRO - NEXUS SWARM CERTIFIED v4002</div>
      </footer>
    </div>
  );
};
