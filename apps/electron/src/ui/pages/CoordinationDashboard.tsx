import React, { useState, useEffect, useCallback } from 'react';
import {
  AlertTriangle, Users, TrendingDown, TrendingUp, Minus,
  Search, PhoneCall, FileText, Calendar, RefreshCw, Eye,
  ChevronRight, BarChart3, Shield, Bell, ArrowUpRight, GraduationCap,
  DollarSign, Zap
} from 'lucide-react';
import './CoordinationDashboard.css';
import ExamTargetConfig from '../components/ExamTargetConfig';
import CameraViewer from '../components/CameraViewer';

// ─── Types ─────────────────────────────────────────────────
interface EvasionProfile {
  studentId: string;
  studentName: string;
  className: string;
  riskProbability: number;
  trend: 'up' | 'down' | 'stable';
  factors: string[];
  consecutiveAbsences: number;
  lastAudit: string;
}

interface DailyKPI {
  totalStudents: number;
  presentToday: number;
  attendanceRate: number;
  studentsAtRisk: number;
  pendingIncidents: number;
  pendingInterventions: number;
}

interface BehaviorAlert {
  id: string;
  studentName: string;
  className: string;
  riskScore: number;
  description: string;
  timestamp: string;
}

interface InterventionPlan {
  studentId: string;
  type: 'parent_call' | 'coordinator_meeting' | 'council_referral' | 'external_referral';
  notes: string;
}

// const aquila = (window as any).aquila; // Removido para segurança de contexto

// ─── Component ─────────────────────────────────────────────
export const CoordinationDashboard: React.FC = () => {
  const aquila = (window as any).aquila;
  const [profile, setProfile] = useState<any>(null);
  const [metabolism, setMetabolism] = useState<any[]>([]);
  const [resilience, setResilience] = useState<any>(null);
  const [financeStats, setFinanceStats] = useState<any>(null);
  const [churnRisk, setChurnRisk] = useState<any>(null);
  const [biometricDrift, setBiometricDrift] = useState<any[]>([]);
  const [securityAlerts, setSecurityAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [kpis, setKpis] = useState<DailyKPI>({
    totalStudents: 0, presentToday: 0, attendanceRate: 0,
    studentsAtRisk: 0, pendingIncidents: 0, pendingInterventions: 0,
  });
  const [evasionProfiles, setEvasionProfiles] = useState<(EvasionProfile & { momentum?: string })[]>([]);
  const [behaviorAlerts, setBehaviorAlerts] = useState<BehaviorAlert[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [riskThreshold, setRiskThreshold] = useState(0.7);
  const [activeTab, setActiveTab] = useState<'overview' | 'evasion' | 'behavior' | 'interventions' | 'alignment' | 'finance' | 'biometry' | 'teacher-reports'>('overview');
  const [dailyReports, setDailyReports] = useState<any[]>([]);
  const [educationLevel, setEducationLevel] = useState<'total' | 'infantil' | 'fundamental' | 'medio'>('total');
  const [showInterventionModal, setShowInterventionModal] = useState<string | null>(null);
  const [interventionForm, setInterventionForm] = useState<InterventionPlan>({
    studentId: '', type: 'parent_call', notes: '',
  });
  const [protocolTarget, setProtocolTarget] = useState<{ id: string, priority: string } | null>(null);
  const [selectedCamera, setSelectedCamera] = useState<{ id: string, url: string, location: string } | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [attendanceData, evasionData, behaviorData, settingsData, instProfile] = await Promise.all([
        aquila?.invoke?.('coordination:get-daily-attendance-summary') ?? null,
        aquila?.invoke?.('coordination:get-evasion-profiles', { threshold: riskThreshold }) ?? null,
        aquila?.invoke?.('coordination:get-high-risk-behaviors', { minScore: 7 }) ?? null,
        aquila?.invoke?.('get-settings', { key: 'evasion_threshold' }) ?? null,
        aquila?.invoke?.('institution:get-profile') ?? null,
      ]);

      setProfile(instProfile);
      
      // Enriquecimento longitudinal para os perfis de risco
      const enrichedEvasion = await Promise.all((evasionData || []).map(async (p: any) => {
        const insight = await aquila?.invoke?.('pedagogical:get-longitudinal-insight', p.studentId);
        return { ...p, momentum: insight?.momentum || 'STABLE' };
      }));

      setEvasionProfiles(enrichedEvasion);

      if (settingsData?.value) {
        setRiskThreshold(parseFloat(settingsData.value));
      }

      setKpis(attendanceData ?? {
        totalStudents: 248, presentToday: 231, attendanceRate: 93.1,
        studentsAtRisk: 12, pendingIncidents: 5, pendingInterventions: 3,
      });

      setBehaviorAlerts(behaviorData ?? [
        { id: 'b1', studentName: 'Pedro Lima', className: '6º C', riskScore: 9, description: 'Nível de stress elevado detectado reiteradamente', timestamp: new Date().toISOString() },
        { id: 'b2', studentName: 'Luísa Ferreira', className: '9º A', riskScore: 8, description: 'Queda abrupta de engajamento na última semana', timestamp: new Date().toISOString() },
      ]);

      const [drift, fin, churn] = await Promise.all([
        aquila?.invoke?.('coordination:get-biometric-health') ?? [],
        aquila?.invoke?.('coordination:get-finance-stats') ?? null,
        aquila?.invoke?.('coordination:get-churn-risk') ?? null,
      ]);
      setBiometricDrift(drift);
      setFinanceStats(fin);
      setChurnRisk(churn);
    } catch (err) {
      console.error('Erro ao carregar dados do dashboard:', err);
    } finally {
      setLoading(false);
    }
  }, [riskThreshold]);

  useEffect(() => {
    const pollSecurity = async () => {
      try {
        const alerts = await aquila?.invoke?.('coordination:get-security-alerts', 5);
        if (alerts) setSecurityAlerts(alerts);
      } catch (err) {
        console.error('[Security Poll] Error:', err);
      }
    };

    pollSecurity();
    const interval = setInterval(pollSecurity, 30000);
    return () => clearInterval(interval);
  }, [aquila]);

  useEffect(() => { loadData(); }, [loadData]);

  const loadDailyReports = useCallback(async () => {
    try {
      const res = await aquila?.invoke?.('teachers:get-daily-reports', { classId: 'all' });
      if (res && res.success) {
        setDailyReports(res.data || []);
      }
    } catch (err) {
      console.error('Erro ao carregar relatórios diários:', err);
    }
  }, [aquila]);

  useEffect(() => {
    if (activeTab === 'teacher-reports') {
      loadDailyReports();
    }
  }, [activeTab, loadDailyReports]);

  const handleUpdateReportStatus = async (reportId: string, status: string) => {
    try {
      const res = await aquila?.invoke?.('coordination:update-report-status', { reportId, status });
      if (res && res.success) {
        loadDailyReports();
      }
    } catch (err) {
      console.error('Erro ao atualizar status do relatório:', err);
    }
  };

  const handleApproveEvolution = async (id: number) => {
    try {
      await aquila?.invoke?.('coordination:approve-evolution', id);
      const metabolismData = await aquila?.invoke?.('coordination:get-system-metabolism');
      const res = await aquila?.invoke?.('coordination:get-resilience-stats');
      const fin = await aquila?.invoke?.('coordination:get-finance-stats');
      const churn = await aquila?.invoke?.('coordination:get-churn-risk');
      
      setMetabolism(metabolismData || []);
      setResilience(res);
      setFinanceStats(fin);
      setChurnRisk(churn);
    } catch (err) {
      console.error('Erro ao aprovar evolução:', err);
    }
  };

  const executeProtocol = async (alertId: string, priority: string) => {
    const type = priority === 'CRITICAL' ? 'GLOBAL_LOCKDOWN' : 'entrance';
    try {
      await aquila?.invoke?.('coordination:execute-security-protocol', { alertId, type });
      setProtocolTarget(null);
      // Refresh alerts
      const updatedAlerts = await aquila?.invoke?.('coordination:get-security-alerts', 10);
      setSecurityAlerts(updatedAlerts || []);
    } catch (err) {
      console.error('Falha ao executar protocolo:', err);
    }
  };

  const openCameraView = async (cameraId: string) => {
    try {
      const camera = await aquila?.invoke?.('coordination:get-camera-by-id', cameraId);
      if (camera) {
        setSelectedCamera({
          id: camera.id,
          url: camera.url || 'http://localhost:8083/stream',
          location: camera.location || 'Local Desconhecido'
        });
      } else {
        setSelectedCamera({
          id: cameraId,
          url: 'http://localhost:8083/stream',
          location: 'Câmera de Segurança'
        });
      }
    } catch (err) {
      console.error('Erro ao abrir câmera:', err);
    }
  };

  const handleStartIntervention = async () => {
    try {
      await aquila?.invoke?.('coordination:generate-intervention', interventionForm.studentId);
      if (showInterventionModal) {
         await aquila?.invoke?.('coordination:update-insight', { id: showInterventionModal, status: 'RESOLVED' });
      }

      setShowInterventionModal(null);
      setInterventionForm({ studentId: '', type: 'parent_call', notes: '' });
      loadData();
    } catch (err) {
      console.error('[Intervention] Error:', err);
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp size={16} className="trend-icon-danger" />;
      case 'down': return <TrendingDown size={16} className="trend-icon-good" />;
      default: return <Minus size={16} className="trend-icon-neutral" />;
    }
  };

  const getRiskBadgeClass = (risk: number): string => {
    if (risk >= 0.85) return 'risk-badge-critical';
    if (risk >= 0.7) return 'risk-badge-high';
    return 'risk-badge-moderate';
  };

  const isLevelMatch = (className: string) => {
    if (!className || educationLevel === 'total') return true;
    const cls = className.toLowerCase();
    if (educationLevel === 'infantil') return cls.includes('maternal') || cls.includes('infantil') || cls.includes('jardim');
    if (educationLevel === 'fundamental') return (cls.includes('º') && parseInt(cls) <= 9) || cls.includes('fundamental');
    if (educationLevel === 'medio') return cls.includes('ensino médio') || cls.includes('1ª') || cls.includes('2ª') || cls.includes('3ª');
    return true;
  };

  const filteredEvasion = evasionProfiles.filter(
    (p) =>
      isLevelMatch(p.className) && (
        p.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.className.toLowerCase().includes(searchTerm.toLowerCase())
      ),
  );

  const filteredBehavior = behaviorAlerts.filter(a => isLevelMatch(a.className));

  return (
    <div className="coordination-dashboard">
      <div className="cd-header">
        <div className="cd-header-text">
          <div className="flex items-center gap-3">
            <h1 className="cd-title">Painel de Coordenação</h1>
            {profile && (
              <div className="flex gap-2">
                <span className={`plan-badge ${profile.tier === 'ELITE' ? 'plan-elite' : 'plan-pro'}`}>{profile.tier}</span>
                <span className="type-badge">{profile.type === 'PUBLIC' ? 'Governamental' : 'Particular'}</span>
              </div>
            )}
          </div>
          <p className="cd-subtitle">Monitoramento pedagógico em tempo real</p>
        </div>

        <div className="cd-header-actions">
          <div className="cd-level-selector">
            {(['total', 'infantil', 'fundamental', 'medio'] as const).map(lvl => (
              <button 
                key={lvl}
                className={`level-btn ${educationLevel === lvl ? 'active' : ''}`}
                onClick={() => setEducationLevel(lvl)}
              >
                {lvl === 'total' ? 'Unidade' : lvl.charAt(0).toUpperCase() + lvl.slice(1)}
              </button>
            ))}
          </div>
          <button className="cd-btn-refresh" onClick={loadData} title="Atualizar dados">
            <RefreshCw size={16} className={loading ? 'spin' : ''} />
            Atualizar
          </button>
        </div>
      </div>

      <div className="cd-tabs">
        {[
          { id: 'overview', label: 'Visão Geral', icon: <BarChart3 size={16} /> },
          { id: 'teacher-reports', label: 'Relatórios dos Professores', icon: <FileText size={16} /> },
          { id: 'evasion', label: 'Risco de Evasão', icon: <AlertTriangle size={16} /> },
          { id: 'behavior', label: 'Alertas Comportamentais', icon: <Shield size={16} /> },
          { id: 'interventions', label: 'Intervenções', icon: <PhoneCall size={16} /> },
          { id: 'alignment', label: 'Alinhamento', icon: <GraduationCap size={16} /> },
          { id: 'finance', label: 'Financeiro & ROI', icon: <DollarSign size={16} /> },
          { id: 'biometry', label: 'Integridade Biométrica', icon: <Shield size={16} /> },
          { id: 'security', label: 'Segurança Real-Time', icon: <Zap size={16} /> },
        ].map((tab) => (
          <button
            key={tab.id}
            className={`cd-tab ${activeTab === tab.id ? 'cd-tab-active' : ''}`}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div className="cd-content">
          <div className="kpi-grid">
            <div className="kpi-card kpi-primary">
              <div className="kpi-icon-box kpi-icon-blue"><Users size={22} /></div>
              <div className="kpi-data">
                <span className="kpi-value">{kpis.attendanceRate.toFixed(1)}%</span>
                <span className="kpi-label">Presença Hoje</span>
                <span className="kpi-detail">{kpis.presentToday} de {kpis.totalStudents}</span>
              </div>
            </div>

            <div className="kpi-card kpi-danger">
              <div className="kpi-icon-box kpi-icon-red"><AlertTriangle size={22} /></div>
              <div className="kpi-data">
                <span className="kpi-value">{kpis.studentsAtRisk}</span>
                <span className="kpi-label">Alunos em Risco</span>
                <span className="kpi-detail">Prob. evasão &gt; {(riskThreshold * 100).toFixed(0)}%</span>
              </div>
            </div>

            <div className="kpi-card kpi-warning">
              <div className="kpi-icon-box kpi-icon-amber"><Bell size={22} /></div>
              <div className="kpi-data">
                <span className="kpi-value">{kpis.pendingIncidents}</span>
                <span className="kpi-label">Ocorrências Pendentes</span>
                <span className="kpi-detail">Últimas 24h</span>
              </div>
            </div>

            <div className="kpi-card kpi-info">
              <div className="kpi-icon-box kpi-icon-purple"><PhoneCall size={22} /></div>
              <div className="kpi-data">
                <span className="kpi-value">{kpis.pendingInterventions}</span>
                <span className="kpi-label">Intervenções Pendentes</span>
                <span className="kpi-detail">Aguardando contato</span>
              </div>
            </div>
          </div>

          <div className="cd-section metabolism-banner premium-glass">
            <div className="metabolism-header">
              <div className="metabolism-title">
                <Zap size={18} className="text-purple" />
                <span>Metabolismo Soberano — Sugestões do Córtex</span>
              </div>
              <span className="metabolism-badge">IA Evolutiva Ativa</span>
            </div>
            <div className="metabolism-items">
              {metabolism.map((item) => (
                <div key={item.id} className="metabolism-card premium-glass">
                  <div className="metabolism-header">
                    <span className="metabolism-tag">EVOLUÇÃO</span>
                    <span className="metabolism-time">{new Date(item.createdAt).toLocaleTimeString()}</span>
                  </div>
                  <p className="metabolism-content">{item.content}</p>
                  <button 
                    className="approve-evolution-btn"
                    onClick={() => handleApproveEvolution(item.id)}
                  >
                    Aprovar Melhoria
                  </button>
                </div>
              ))}
              {metabolism.length === 0 && (
                <p className="empty-metabolism">Córtex em equilíbrio. Nenhuma evolução pendente.</p>
              )}
            </div>
          </div>

          {resilience && (
            <div className="resilience-panel premium-glass">
              <h3>Integridade do Kernel Soberano</h3>
              <div className="resilience-grid">
                <div className="resilience-stat">
                  <span className="label">Integridade:</span>
                  <span className="value text-success">{resilience.kernelIntegrity}</span>
                </div>
                <div className="resilience-stat">
                  <span className="label">Modo Air-Gap:</span>
                  <span className="value">{resilience.airGapStatus}</span>
                </div>
                <div className="resilience-stat">
                  <span className="label">Última Auditoria:</span>
                  <span className="value">{new Date(resilience.lastAudit).toLocaleString()}</span>
                </div>
              </div>
            </div>
          )}

          <div className="cd-section">
            <div className="cd-section-header">
              <h2 className="cd-section-title">
                <AlertTriangle size={18} className="text-red" />
                Alunos em Risco Crítico
              </h2>
              <button className="cd-btn-link" onClick={() => setActiveTab('evasion')}>
                Ver todos <ChevronRight size={14} />
              </button>
            </div>
            <div className="evasion-list">
              {filteredEvasion.slice(0, 3).map((profile) => (
                <div key={profile.studentId} className={`evasion-card premium-glass ${profile.riskProbability >= 0.85 ? 'risk-glow-critical' : profile.riskProbability >= 0.7 ? 'risk-glow-high' : ''}`}>
                  <div className="evasion-card-left">
                    <div className={`risk-badge ${getRiskBadgeClass(profile.riskProbability)}`}>
                      {(profile.riskProbability * 100).toFixed(0)}%
                    </div>
                    <div className="evasion-info">
                      <span className="evasion-name">{profile.studentName}</span>
                      <span className="evasion-class">{profile.className} • {profile.consecutiveAbsences} faltas consec.</span>
                    </div>
                  </div>
                  <div className="evasion-card-right">
                    {getTrendIcon(profile.trend)}
                    <button
                      className="cd-btn-action"
                      onClick={() => {
                        setInterventionForm({ ...interventionForm, studentId: profile.studentId });
                        setShowInterventionModal(profile.studentId);
                      }}
                      title="Iniciar intervenção"
                    >
                      <ArrowUpRight size={14} /> Agir
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Behavior Alerts Preview */}
          <div className="cd-section">
            <div className="cd-section-header">
              <h2 className="cd-section-title">
                <Shield size={18} className="text-amber" />
                Alertas Comportamentais Recentes
              </h2>
              <button className="cd-btn-link" onClick={() => setActiveTab('behavior')}>
                Ver todos <ChevronRight size={14} />
              </button>
            </div>
            <div className="behavior-list">
              {filteredBehavior.slice(0, 3).map((alert) => (
                <div key={alert.id} className={`behavior-card premium-glass ${alert.riskScore >= 9 ? 'risk-glow-critical' : alert.riskScore >= 8 ? 'risk-glow-high' : ''}`}>
                  <div className={`behavior-score score-${alert.riskScore >= 8 ? 'critical' : 'high'}`}>
                    {alert.riskScore}
                  </div>
                  <div className="behavior-info">
                    <span className="behavior-student">{alert.studentName} — {alert.className}</span>
                    <span className="behavior-desc">{alert.description}</span>
                  </div>
                  <button className="cd-btn-icon" title="Ver detalhes"><Eye size={16} /></button>
                </div>
              ))}
            </div>
          </div>

          {/* Real-Time Security Alerts Preview */}
          <div className="cd-section">
            <div className="cd-section-header">
              <h2 className="cd-section-title">
                <Zap size={18} className="text-red" />
                Segurança Real-Time (Córtex)
              </h2>
              <button className="cd-btn-link" onClick={() => setActiveTab('security')}>
                Ver Monitor <ChevronRight size={14} />
              </button>
            </div>
            <div className="behavior-list">
              {securityAlerts.length > 0 ? (
                securityAlerts.slice(0, 3).map((alert) => (
                  <div key={alert.id} className={`behavior-card premium-glass ${alert.priority === 'CRITICAL' ? 'risk-glow-critical' : 'risk-glow-high'}`}>
                    <div className={`behavior-score score-${alert.priority === 'CRITICAL' ? 'critical' : 'high'}`}>
                      <Shield size={18} />
                    </div>
                    <div className="behavior-info">
                      <span className="behavior-student">{alert.title}</span>
                      <span className="behavior-desc">{alert.message}</span>
                      <span className="behavior-time">{new Date(alert.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <button className="cd-btn-icon" title="Investigar"><ArrowUpRight size={16} /></button>
                  </div>
                ))
              ) : (
                <div className="empty-state-small premium-glass">
                  <Shield size={24} className="text-success" />
                  <span>Nenhum incidente de segurança detectado.</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Teacher Reports Tab */}
      {activeTab === 'teacher-reports' && (
        <div className="cd-content">
          <div className="cd-section-header">
            <h2 className="cd-section-title">Feed de Relatórios Diários dos Professores</h2>
            <span className="status-badge pulse-green">IA Pedagogical Analyzer Ativo</span>
          </div>

          <div className="behavior-full-list mt-4">
            {dailyReports.map((report: any) => {
              let parsedInsights: string[] = [];
              try {
                parsedInsights = typeof report.insights === 'string' ? JSON.parse(report.insights) : report.insights;
              } catch (e) {
                parsedInsights = [report.insights];
              }

              return (
                <div key={report.id} className="behavior-detail-card premium-glass">
                  <div className="behavior-detail-info">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-zinc-200 font-bold">{report.teacherName || 'Professor'} — Turma {report.className || report.classId}</h3>
                        <p className="text-xs text-zinc-500 font-mono mt-1">ID DO RELATÓRIO: {report.id} • STATUS DE ENVIO: {report.routingStatus}</p>
                      </div>
                      <span className={`priority-tag ${report.routingStatus === 'COMPLETED' ? 'low' : 'critical'}`}>
                        {report.routingStatus === 'COMPLETED' ? 'Lido' : 'Pendente'}
                      </span>
                    </div>

                    <div className="report-body mt-4 flex flex-col gap-3">
                      <div>
                        <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Observação Bruta do Professor</span>
                        <p className="text-sm text-zinc-300 mt-1 italic">"{report.transcription}"</p>
                      </div>

                      {report.summary && (
                        <div>
                          <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Resumo Estruturado IA</span>
                          <p className="text-sm text-zinc-300 mt-1">{report.summary}</p>
                        </div>
                      )}

                      {Array.isArray(parsedInsights) && parsedInsights.length > 0 && (
                        <div>
                          <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest font-bold text-purple-400">Insights de Intervenção Pedagógica</span>
                          <ul className="list-disc list-inside text-sm text-zinc-300 mt-1 flex flex-col gap-1">
                            {parsedInsights.map((insight: string, idx: number) => (
                              <li key={idx}>{insight}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="behavior-detail-actions flex gap-2">
                    {report.routingStatus !== 'COMPLETED' && (
                      <button 
                        className="cd-btn-primary" 
                        onClick={() => handleUpdateReportStatus(report.id, 'COMPLETED')}
                      >
                        Marcar como Revisado
                      </button>
                    )}
                    <button 
                      className="cd-btn-secondary" 
                      onClick={() => {
                        handleUpdateReportStatus(report.id, 'FORWARDED');
                        alert('Encaminhado para a Secretaria Digital.');
                      }}
                    >
                      Encaminhar p/ Secretaria
                    </button>
                  </div>
                </div>
              );
            })}

            {dailyReports.length === 0 && (
              <div className="empty-state premium-glass text-center py-20 text-zinc-500">
                <FileText size={48} className="text-zinc-600 mb-4 mx-auto" />
                <h3>Nenhum relatório diário pendente de revisão.</h3>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Evasion Tab */}
      {activeTab === 'evasion' && (
        <div className="cd-content">
          <div className="cd-search-bar">
            <Search size={16} />
            <input
              type="text"
              placeholder="Buscar aluno ou turma..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="cd-search-input"
              title="Buscar aluno ou turma"
              aria-label="Buscar aluno ou turma"
            />
            <div className="threshold-control">
              <span className="threshold-label">Limiar:</span>
              <select
                value={riskThreshold}
                onChange={(e) => setRiskThreshold(parseFloat(e.target.value))}
                className="cd-select"
                title="Limiar de risco de evasão"
                aria-label="Limiar de risco de evasão"
              >
                <option value={0.5}>50%</option>
                <option value={0.6}>60%</option>
                <option value={0.7}>70%</option>
                <option value={0.8}>80%</option>
                <option value={0.9}>90%</option>
              </select>
            </div>
          </div>

          <div className="evasion-full-list">
            {filteredEvasion.map((profile) => (
              <div key={profile.studentId} className={`evasion-detail-card premium-glass ${profile.riskProbability >= 0.85 ? 'risk-glow-critical' : profile.riskProbability >= 0.7 ? 'risk-glow-high' : ''}`}>
                <div className="evasion-detail-header">
                  <div className={`risk-badge-lg ${getRiskBadgeClass(profile.riskProbability)}`}>
                    {(profile.riskProbability * 100).toFixed(0)}%
                  </div>
                  <div className="evasion-detail-info">
                    <h3 className="evasion-detail-name">{profile.studentName}</h3>
                    <span className="evasion-detail-class">{profile.className}</span>
                  </div>
                  <div className="evasion-detail-trend">
                    {getTrendIcon(profile.trend)}
                    <span className="trend-text">
                      {profile.trend === 'up' ? 'Piorando' : profile.trend === 'down' ? 'Melhorando' : 'Estável'}
                    </span>
                  </div>
                </div>

                <div className="evasion-detail-body">
                  <div className="evasion-stat">
                    <Calendar size={14} />
                    <span>{profile.consecutiveAbsences} faltas consecutivas</span>
                  </div>
                  <div className="evasion-factors">
                    <span className="factors-label">Fatores:</span>
                    {profile.factors.map((f, i) => (
                      <span key={i} className="factor-tag">{f}</span>
                    ))}
                  </div>
                </div>

                <div className="evasion-detail-actions">
                  <button
                    className="cd-btn-primary"
                    onClick={() => {
                      setInterventionForm({ ...interventionForm, studentId: profile.studentId });
                      setShowInterventionModal(profile.studentId);
                    }}
                  >
                    <PhoneCall size={14} /> Iniciar Intervenção
                  </button>
                  <button className="cd-btn-secondary">
                    <FileText size={14} /> Ver Dossiê
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Behavior Tab */}
      {activeTab === 'behavior' && (
        <div className="cd-content">
          <div className="behavior-full-list">
            {filteredBehavior.map((alert) => (
              <div key={alert.id} className={`behavior-detail-card premium-glass ${alert.riskScore >= 9 ? 'risk-glow-critical' : alert.riskScore >= 8 ? 'risk-glow-high' : ''}`}>
                <div className={`behavior-score-lg score-${alert.riskScore >= 8 ? 'critical' : 'high'}`}>
                  {alert.riskScore}/10
                </div>
                <div className="behavior-detail-info">
                  <h3>{alert.studentName} — {alert.className}</h3>
                  <p>{alert.description}</p>
                  <span className="behavior-time">
                    {new Date(alert.timestamp).toLocaleString('pt-BR')}
                  </span>
                </div>
                <div className="behavior-detail-actions">
                  <button className="cd-btn-primary" onClick={() => {
                    setInterventionForm({ ...interventionForm, studentId: alert.id });
                    setShowInterventionModal(alert.id);
                  }}>
                    <PhoneCall size={14} /> Convocar Responsável
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Finance Tab */}
      {activeTab === 'finance' && (
        <div className="cd-content">
          <div className="finance-grid">
            <div className="finance-card premium-glass">
              <h3>Visão Geral Financeira</h3>
              {financeStats && (
                <div className="stats-list">
                  <div className="stat-item">
                    <span>Mensalidade Estimada:</span>
                    <span className="value">R$ {financeStats.estimatedMonthly?.toLocaleString()}</span>
                  </div>
                  <div className="stat-item">
                    <span>Anuidade Projetada:</span>
                    <span className="value">R$ {financeStats.projectedAnnual?.toLocaleString()}</span>
                  </div>
                </div>
              )}
            </div>

            {churnRisk && (
              <div className={`finance-card premium-glass ${churnRisk.riskLevel === 'CRITICAL' ? 'risk-glow-critical' : ''}`}>
                <h3>Risco de Churn Projetado</h3>
                <div className="churn-stats">
                  <div className="stat-main">
                    <span className="value text-red">R$ {churnRisk.projectedLoss?.toLocaleString()}</span>
                    <span className="label">Perda Potencial</span>
                  </div>
                  <p className="description">
                    Estimativa baseada em {churnRisk.atRiskCount} alunos com risco de evasão &gt; 80%.
                  </p>
                </div>
              </div>
            )}

            <div className="finance-card premium-glass full-width">
              <h3>Indicador de ROI (Retenção)</h3>
              <div className="roi-bar-container">
                <div className="roi-bar-bg">
                  <div className="roi-bar-fill" style={{ width: '65%' }}></div>
                </div>
                <div className="roi-labels">
                  <span>R$ 0</span>
                  <span>Impacto de Retenção: R$ 325.000/ano</span>
                  <span>R$ 500k</span>
                </div>
              </div>
              <p className="roi-note">Cada aluno retido preserva aprox. R$ 5.000 em receita anual.</p>
            </div>
          </div>
        </div>
      )}

      {/* Biometry Tab */}
      {activeTab === 'biometry' && (
        <div className="cd-content">
          <div className="biometry-grid">
            {biometricDrift.length > 0 ? (
              biometricDrift.map((student) => (
                <div key={student.id} className="drift-card premium-glass">
                  <div className="drift-header">
                    <div className="student-avatar">
                      {student.name.charAt(0)}
                    </div>
                    <div className="student-info">
                      <h4>{student.name}</h4>
                      <span>{student.className}</span>
                    </div>
                  </div>
                  <div className="drift-status warning">
                    <AlertTriangle size={14} />
                    <span>⚠️ Necessita Recaptura</span>
                  </div>
                  <p className="drift-date">
                    Deriva detectada em: {new Date(student.driftDetectedAt).toLocaleDateString()}
                  </p>
                  <button className="cd-btn-action full-width">
                    Agendar Recaptura
                  </button>
                </div>
              ))
            ) : (
              <div className="empty-state premium-glass">
                <Shield size={48} className="text-success" />
                <h3>Integridade Biométrica Mantida</h3>
                <p>Nenhuma deriva detectada nos últimos escaneamentos.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Security Tab */}
      {activeTab === 'security' && (
        <div className="cd-content">
          <div className="cd-section-header">
            <h2 className="cd-section-title">Monitor de Segurança Ativo</h2>
            <div className="status-badge pulse-red">PROTEÇÃO ATIVA</div>
          </div>
          
          <div className="security-full-list">
            {securityAlerts.map((alert) => (
              <div key={alert.id} className={`behavior-detail-card premium-glass ${alert.priority === 'CRITICAL' ? 'risk-glow-critical' : ''}`}>
                <div className={`behavior-score-lg score-${alert.priority === 'CRITICAL' ? 'critical' : 'high'}`}>
                  <Shield size={28} />
                </div>
                <div className="behavior-detail-info">
                  <div className="flex justify-between items-start">
                    <h3>{alert.title}</h3>
                    <span className={`priority-tag ${alert.priority?.toLowerCase()}`}>{alert.priority}</span>
                  </div>
                  <p>{alert.message}</p>
                  <div className="alert-meta">
                    <span className="behavior-time">
                      {new Date(alert.timestamp).toLocaleString('pt-BR')}
                    </span>
                    <span className="source-tag">Origin: SecurityMesh</span>
                  </div>
                </div>
                <div className="behavior-detail-actions">
                  <button 
                    className="cd-btn-primary" 
                    onClick={() => setProtocolTarget({ id: alert.id, priority: alert.priority })}
                  >
                    <Shield size={14} /> Protocolo de Contenção
                  </button>
                  <button 
                    className="cd-btn-secondary"
                    onClick={() => openCameraView(alert.cameraId || 'CAM-01')}
                  >
                    <Eye size={14} /> Ver Câmeras
                  </button>
                </div>
              </div>
            ))}
            
            {securityAlerts.length === 0 && (
              <div className="empty-state premium-glass">
                <Shield size={48} className="text-success" />
                <h3>Perímetro Seguro</h3>
                <p>Nenhum alerta de segurança registrado nas últimas horas.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Alignment Tab */}
      {activeTab === 'alignment' && (
        <div className="cd-content">
          <ExamTargetConfig />
        </div>
      )}

      {/* Intervention Modal */}
      {showInterventionModal && (
        <div className="cd-modal-overlay" onClick={() => setShowInterventionModal(null)}>
          <div className="cd-modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="cd-modal-title">Iniciar Intervenção</h2>

            <div className="cd-form-group">
              <label className="cd-form-label">Tipo de Ação</label>
              <select
                value={interventionForm.type}
                onChange={(e) => setInterventionForm({ ...interventionForm, type: e.target.value as InterventionPlan['type'] })}
                className="cd-select-full"
                title="Tipo de intervenção"
                aria-label="Tipo de intervenção"
              >
                <option value="parent_call">Convocar Responsável</option>
                <option value="coordinator_meeting">Reunião com Coordenação</option>
                <option value="council_referral">Encaminhar ao Conselho</option>
                <option value="external_referral">Encaminhamento Externo</option>
              </select>
            </div>

            <div className="cd-form-group">
              <label className="cd-form-label">Observações</label>
              <textarea
                value={interventionForm.notes}
                onChange={(e) => setInterventionForm({ ...interventionForm, notes: e.target.value })}
                className="cd-textarea"
                placeholder="Descreva o contexto e plano de ação..."
                rows={4}
              />
            </div>

            <div className="cd-modal-actions">
              <button className="cd-btn-cancel" onClick={() => setShowInterventionModal(null)}>
                Cancelar
              </button>
              <button className="cd-btn-confirm" onClick={handleStartIntervention}>
                <PhoneCall size={14} /> Confirmar Intervenção
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Protocol Confirmation Modal */}
      {protocolTarget && (
        <div className="cd-modal-overlay">
          <div className="cd-modal premium-glass risk-glow-critical">
            <h3 className="cd-modal-title">Confirmar Protocolo de Contenção</h3>
            <p>
              {protocolTarget.priority === 'CRITICAL' 
                ? 'ATENÇÃO: Você está prestes a ativar o LOCKDOWN GLOBAL. Todas as interfaces físicas (catracas e portões) serão bloqueadas imediatamente.'
                : 'Deseja ativar o bloqueio das entradas principais em resposta a este alerta?'}
            </p>
            <div className="cd-modal-actions">
              <button className="cd-btn-secondary" onClick={() => setProtocolTarget(null)}>
                Cancelar
              </button>
              <button 
                className="cd-btn-primary bg-danger" 
                onClick={() => executeProtocol(protocolTarget.id, protocolTarget.priority)}
              >
                Confirmar Execução
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Camera Viewer Modal */}
      {selectedCamera && (
        <div className="cd-modal-overlay">
          <div className="cd-modal camera-modal premium-glass">
            <div className="cd-modal-header">
              <h3 className="cd-modal-title">Live Stream: {selectedCamera.location}</h3>
              <button className="close-btn" onClick={() => setSelectedCamera(null)}>&times;</button>
            </div>
            <div className="camera-modal-body">
              <CameraViewer 
                cameraId={selectedCamera.id}
                cameraUrl={selectedCamera.url}
                location={selectedCamera.location}
              />
            </div>
            <div className="cd-modal-actions">
              <button className="cd-btn-primary" onClick={() => setSelectedCamera(null)}>
                Fechar Monitor
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CoordinationDashboard;
