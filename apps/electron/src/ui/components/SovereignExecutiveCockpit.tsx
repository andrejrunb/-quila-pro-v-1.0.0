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
import { Sparkles, Download, RefreshCw, FileText, CheckCircle, ShieldCheck } from 'lucide-react';
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
  const [narrative, setNarrative] = useState<any | null>(null);
  const [loadingNarrative, setLoadingNarrative] = useState(false);
  const [activeNarrativeTab, setActiveNarrativeTab] = useState<'narrative' | 'findings' | 'recommendations' | 'evidence'>('narrative');

  const fetchNarrative = async () => {
    try {
      setLoadingNarrative(true);
      if ((window as any).aquila?.executive?.getNarrative) {
        const data = await (window as any).aquila.executive.getNarrative('escola-matriz-01');
        setNarrative(data);
      }
    } catch (err) {
      console.error('Failed to fetch executive narrative:', err);
    } finally {
      setLoadingNarrative(false);
    }
  };

  const handleReviewNarrative = async () => {
    if (!narrative) return;
    const reviewer = window.prompt('Assinatura do Revisor Executivo (ex: Coordenação / Mantenedora):', 'Direção Geral');
    if (!reviewer) return;
    try {
      const res = await (window as any).aquila.executive.reviewNarrative(narrative.id, reviewer);
      if (res?.success) {
        await fetchNarrative();
        alert(`Relatório homologado com sucesso por ${reviewer}!`);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleExportNarrative = async () => {
    if (!narrative) return;
    try {
      const res = await (window as any).aquila.executive.exportNarrativeMd(narrative);
      if (res?.markdown) {
        await navigator.clipboard.writeText(res.markdown);
        alert('Relatório Narrativo Executivo em Markdown copiado para a área de transferência!');
      }
    } catch (e) {
      console.error(e);
    }
  };

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
    fetchNarrative();
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

          {/* CONSULTOR EXECUTIVO IA — NARRATIVE REPORTING (PADRÃO ORACLE NETSUITE) */}
          <section className="executive-narrative-panel" style={{
            marginTop: '2.5rem',
            background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(10, 15, 28, 0.95))',
            border: '1px solid rgba(251, 191, 36, 0.3)',
            borderRadius: '12px',
            padding: '1.5rem',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)'
          }}>
            <div className="narrative-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '0.75rem', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Sparkles size={18} color="#FBBF24" />
                  <h3 className="hive-title" style={{ margin: 0, fontSize: '1.15rem', color: '#F8FAFC' }}>
                    CONSULTOR EXECUTIVO IA — NARRATIVE REPORTING & EXCEPTION MANAGEMENT
                  </h3>
                </div>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.6)' }}>
                  Arquitetura inspirada no Oracle NetSuite AI • SuiteAnalytics determinístico com redação causal prudente
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {narrative && (
                  <span style={{
                    fontSize: '0.7rem',
                    padding: '3px 8px',
                    borderRadius: '4px',
                    background: narrative.generatedBy === 'rules-engine' ? 'rgba(56, 189, 248, 0.15)' : 'rgba(168, 85, 247, 0.15)',
                    color: narrative.generatedBy === 'rules-engine' ? '#38BDF8' : '#C084FC',
                    border: '1px solid currentColor'
                  }}>
                    Engine: {narrative.generatedBy} • Confiança: {narrative.confidence?.toUpperCase()}
                  </span>
                )}
                {narrative?.reviewedBy ? (
                  <span style={{ fontSize: '0.7rem', padding: '3px 8px', borderRadius: '4px', background: 'rgba(16, 185, 129, 0.2)', color: '#34D399', border: '1px solid #34D399' }}>
                    ✓ Homologado: {narrative.reviewedBy}
                  </span>
                ) : (
                  <button
                    onClick={handleReviewNarrative}
                    style={{ fontSize: '0.75rem', padding: '4px 10px', background: 'rgba(251, 191, 36, 0.2)', color: '#FBBF24', border: '1px solid #FBBF24', borderRadius: '4px', cursor: 'pointer' }}
                  >
                    ⚖️ Homologar (HITL)
                  </button>
                )}
                <button
                  onClick={handleExportNarrative}
                  style={{ fontSize: '0.75rem', padding: '4px 10px', background: 'rgba(255, 255, 255, 0.1)', color: '#FFF', border: '1px solid rgba(255, 255, 255, 0.2)', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  <Download size={12} /> Exportar MD
                </button>
                <button
                  onClick={fetchNarrative}
                  disabled={loadingNarrative}
                  style={{ fontSize: '0.75rem', padding: '4px 8px', background: 'transparent', color: 'rgba(255, 255, 255, 0.6)', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: '4px', cursor: 'pointer' }}
                  title="Atualizar Narrativa"
                >
                  <RefreshCw size={12} className={loadingNarrative ? 'animate-spin' : ''} />
                </button>
              </div>
            </div>

            {loadingNarrative && !narrative ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'rgba(255, 255, 255, 0.5)' }}>
                Sintetizando fatos, evidências e matriz causal determinística...
              </div>
            ) : narrative ? (
              <div>
                {/* Headline NetSuite */}
                <div style={{ background: 'rgba(251, 191, 36, 0.08)', borderLeft: '3px solid #FBBF24', padding: '10px 14px', borderRadius: '4px', marginBottom: '1rem' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#FDE047' }}>{narrative.headline}</div>
                  <div style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.75)', marginTop: '4px', lineHeight: 1.45 }}>
                    {narrative.summaryNarrative}
                  </div>
                </div>

                {/* Sub-Abas do Consultor Executivo */}
                <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '8px', marginBottom: '1rem' }}>
                  <button
                    onClick={() => setActiveNarrativeTab('narrative')}
                    style={{ background: activeNarrativeTab === 'narrative' ? 'rgba(251, 191, 36, 0.2)' : 'transparent', color: activeNarrativeTab === 'narrative' ? '#FBBF24' : 'rgba(255, 255, 255, 0.6)', border: 'none', padding: '6px 12px', borderRadius: '4px', fontSize: '0.75rem', cursor: 'pointer' }}
                  >
                    📊 Métricas Semanais ({narrative.metrics?.length || 0})
                  </button>
                  <button
                    onClick={() => setActiveNarrativeTab('findings')}
                    style={{ background: activeNarrativeTab === 'findings' ? 'rgba(251, 191, 36, 0.2)' : 'transparent', color: activeNarrativeTab === 'findings' ? '#FBBF24' : 'rgba(255, 255, 255, 0.6)', border: 'none', padding: '6px 12px', borderRadius: '4px', fontSize: '0.75rem', cursor: 'pointer' }}
                  >
                    🔍 Análise Causal & Exceções ({narrative.findings?.length || 0})
                  </button>
                  <button
                    onClick={() => setActiveNarrativeTab('recommendations')}
                    style={{ background: activeNarrativeTab === 'recommendations' ? 'rgba(251, 191, 36, 0.2)' : 'transparent', color: activeNarrativeTab === 'recommendations' ? '#FBBF24' : 'rgba(255, 255, 255, 0.6)', border: 'none', padding: '6px 12px', borderRadius: '4px', fontSize: '0.75rem', cursor: 'pointer' }}
                  >
                    🎯 Plano de Ação Prioritário ({narrative.recommendations?.length || 0})
                  </button>
                  <button
                    onClick={() => setActiveNarrativeTab('evidence')}
                    style={{ background: activeNarrativeTab === 'evidence' ? 'rgba(251, 191, 36, 0.2)' : 'transparent', color: activeNarrativeTab === 'evidence' ? '#FBBF24' : 'rgba(255, 255, 255, 0.6)', border: 'none', padding: '6px 12px', borderRadius: '4px', fontSize: '0.75rem', cursor: 'pointer' }}
                  >
                    🛡️ Trilha de Auditoria & Fontes ({narrative.evidence?.length || 0})
                  </button>
                </div>

                {/* ABA 1: MÉTRICAS */}
                {activeNarrativeTab === 'narrative' && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
                    {narrative.metrics?.map((m, idx) => (
                      <div key={idx} style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '6px', padding: '10px' }}>
                        <div style={{ fontSize: '0.7rem', color: 'rgba(255, 255, 255, 0.5)', textTransform: 'uppercase' }}>{m.label}</div>
                        <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#FFF', margin: '4px 0' }}>{m.value}</div>
                        <div style={{ fontSize: '0.7rem', display: 'flex', justifyContent: 'space-between', color: m.trend === 'up' ? '#34D399' : m.trend === 'down' ? '#F87171' : '#94A3B8' }}>
                          <span>Meta: {m.benchmark}</span>
                          <span>{m.deltaPercent !== undefined ? (m.deltaPercent > 0 ? '+' : '') + m.deltaPercent + '%' : ''}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* ABA 2: ACHADOS & ANÁLISE CAUSAL (4 PILARES) */}
                {activeNarrativeTab === 'findings' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {narrative.findings?.map((f) => (
                      <div key={f.id} style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '6px', padding: '12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: f.severity === 'high' || f.severity === 'critical' ? '#F87171' : '#FBBF24', textTransform: 'uppercase' }}>
                            [{f.category}] Severidade: {f.severity}
                          </span>
                          <span style={{ fontSize: '0.7rem', color: 'rgba(255, 255, 255, 0.4)' }}>Ref: {f.sourceRefs?.join(', ')}</span>
                        </div>
                        <div style={{ fontSize: '0.8rem', color: '#E2E8F0', marginBottom: '4px' }}>
                          <strong>Fato:</strong> {f.fact}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginBottom: '4px' }}>
                          <strong>Evidência:</strong> {f.evidence}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#CBD5E1', marginBottom: '4px', fontStyle: 'italic', background: 'rgba(255, 255, 255, 0.02)', padding: '6px', borderRadius: '4px' }}>
                          <strong>Explicação Sugerida (Sem Presunção Causal):</strong> {f.suggestedExplanation}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#38BDF8' }}>
                          <strong>Recomendação Acionável:</strong> {f.recommendation}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* ABA 3: RECOMENDAÇÕES */}
                {activeNarrativeTab === 'recommendations' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {narrative.recommendations?.map((r) => (
                      <div key={r.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '6px', padding: '10px 14px', flexWrap: 'wrap', gap: '8px' }}>
                        <div style={{ flex: 1, minWidth: '240px' }}>
                          <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginBottom: '2px' }}>
                            <span style={{ fontSize: '0.65rem', padding: '2px 6px', borderRadius: '3px', background: r.priority === 'p1_imediata' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(234, 179, 8, 0.2)', color: r.priority === 'p1_imediata' ? '#F87171' : '#FACC15' }}>
                              {r.priority.toUpperCase()}
                            </span>
                            <span style={{ fontSize: '0.7rem', color: 'rgba(255, 255, 255, 0.5)' }}>Responsável: <strong>{r.ownerRole}</strong> • Prazo: {r.deadlineDays}d</span>
                          </div>
                          <div style={{ fontSize: '0.8rem', color: '#FFF' }}>{r.action}</div>
                        </div>
                        <div style={{ fontSize: '0.7rem', color: '#34D399', background: 'rgba(16, 185, 129, 0.1)', padding: '4px 8px', borderRadius: '4px' }}>
                          {r.expectedImpact}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* ABA 4: EVIDÊNCIAS & FONTES */}
                {activeNarrativeTab === 'evidence' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {narrative.evidence?.map((e, idx) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', background: 'rgba(255, 255, 255, 0.02)', padding: '6px 10px', borderRadius: '4px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                        <span style={{ color: '#94A3B8' }}><strong>{e.refId}:</strong> {e.sourceTableOrQuery}</span>
                        <span style={{ color: 'rgba(255, 255, 255, 0.4)' }}>Amostra: {e.sampleSize} reg. • Hash: {e.auditHash?.slice(0, 10)}...</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div style={{ padding: '1rem', color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.8rem' }}>
                Nenhum relatório narrativo gerado ainda para esta escola. Clique em "Atualizar" para gerar.
              </div>
            )}
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
