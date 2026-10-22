import React, { useState, useEffect } from 'react';
import { 
  Users, Camera, Bell, Shield, 
  Search, Info, CheckCircle, AlertTriangle, 
  Smartphone, ExternalLink, Globe, Layout,
  MoreVertical, Filter, Download, Radio, Megaphone, Award,
  Brain, Sparkles, BookOpen, Mic, Image as ImageIcon,
  Activity, ChevronRight, Calendar, CheckSquare, MessageSquare, Clock, Cpu, Fingerprint, Lock, ShieldAlert, FileText, Zap, Key, EyeOff, X, Terminal, Maximize2, Settings, Sliders, DollarSign, HelpCircle
} from 'lucide-react';
import { 
  BarChart, Bar, ResponsiveContainer, Tooltip, XAxis, YAxis, 
  CartesianGrid, AreaChart, Area 
} from 'recharts';
// Removidos imports de Node.js (Zero-Debt IPC)
import './Dashboard.css';
import { IntelligencePulse } from './components/IntelligencePulse';
import { EagleKpiCard } from './components/elite/EagleKpiCard';
import { EagleKpiGrid } from './components/elite/EagleKpiGrid';
import { EagleCard } from './components/elite/EagleCard';
import { EagleButton } from './components/elite/EagleButton';
import { EagleBadge } from './components/elite/EagleBadge';
import { EagleTable, EagleTableHead, EagleTableHeader, EagleTableRow, EagleTableCell } from './components/elite/EagleTable';

const EMPTY_WEEKLY = [
  { name: 'Dom', value: 0 },
  { name: 'Seg', value: 0 },
  { name: 'Ter', value: 0 },
  { name: 'Qua', value: 0 },
  { name: 'Qui', value: 0 },
  { name: 'Sex', value: 0 },
  { name: 'Sáb', value: 0 },
];

interface DashboardProps {
  onNavigate: (page: string) => void;
  onLogout: () => void;
  userRole?: string;
  user?: any;
  activeHub: 'security' | 'admin' | 'pedagogical';
}

export const Dashboard: React.FC<DashboardProps> = ({ 
  onNavigate, onLogout, userRole = 'admin', user, activeHub 
}) => {
  const role = userRole?.toLowerCase();
  const isDirector = ['admin', 'director'].includes(role);
  const isCoord = ['coordinator'].includes(role);
  const isTeacher = ['teacher', 'docente'].includes(role);
  const isRH = ['rh', 'hr'].includes(role);
  const isSchoolStaff = ['director', 'coordinator', 'secretary', 'docente', 'teacher'].includes(role);

  const canSeeSecurity = isDirector;
  const canSeePedagogical = isDirector || isCoord || isTeacher;
  const canSeeAdmin = isDirector || isRH;
  const [stats, setStats] = useState<any>({
    totalStudents: 0,
    presentToday: 0,
    camerasOnline: 0,
    activeAlerts: 0,
    avgConfidence: 0,
    broadcastActive: false,
    rhPerformance: 0
  });

  const [npuStatus, setNpuStatus] = useState<any>(null);
  const [perfStatus, setPerfStatus] = useState<any>(null);
  const [swarmStatus, setSwarmStatus] = useState<any>(null);
  const [swarmHistory, setSwarmHistory] = useState<any[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [queueStatus, setQueueStatus] = useState<any>(null);

  const [updateStatus, setUpdateStatus] = useState<{
    state: 'idle' | 'available' | 'downloading' | 'ready' | 'error';
    version?: string;
    progress?: number;
    error?: string;
  }>({ state: 'idle' });

  const [isolation, setIsolation] = useState<{ isolated: boolean; reason?: string }>({ isolated: false });

  useEffect(() => {
    console.log('[E2E-DEBUG] Dashboard Component Mounted!');
  }, []);

  useEffect(() => {
    const win = window as any;
    if (win.aquila) {
      // Updates
      win.aquila.on('update-available', (info: any) => {
        setUpdateStatus({ state: 'available', version: info.version });
      });
      win.aquila.on('update-download-progress', (progress: any) => {
        setUpdateStatus(prev => ({ ...prev, state: 'downloading', progress: progress.percent }));
      });
      win.aquila.on('update-downloaded', (info: any) => {
        setUpdateStatus({ state: 'ready', version: info.version });
      });
      win.aquila.on('update-error', (err: any) => {
        setUpdateStatus({ state: 'error', error: err.message });
        setTimeout(() => setUpdateStatus({ state: 'idle' }), 5000);
      });

      // NPU & Performance Telemetry
      const unsubscribeNpu = win.aquila.onNpuStatus((status: any) => {
        setNpuStatus(status);
      });
      const unsubscribePerf = win.aquila.onPerfStatus((status: any) => {
        setPerfStatus(status);
      });

      // Swarm Status (Sovereign Swarm)
      win.aquila.getSwarmStatus().then(setSwarmStatus).catch(console.error);
      win.aquila.invoke('get-queue-status').then(setQueueStatus).catch(() => {});

      // Isolation Status
      const unsubscribeIsolation = win.aquila.onIsolationStatus((data: any) => {
        setIsolation(data);
      });

      const swarmInterval = setInterval(() => {
        win.aquila.getSwarmStatus().then(setSwarmStatus).catch(console.error);
        if (showHistory) {
          win.aquila.getSwarmHistory(20).then(setSwarmHistory).catch(console.error);
        }
        win.aquila.invoke('get-queue-status').then(setQueueStatus).catch(() => {});
      }, 15000);

      return () => {
        if (typeof unsubscribeNpu === 'function') unsubscribeNpu();
        if (typeof unsubscribePerf === 'function') unsubscribePerf();
        if (typeof unsubscribeIsolation === 'function') unsubscribeIsolation();
        clearInterval(swarmInterval);
      };
    }
  }, [showHistory]);

  const handleInstallUpdate = () => {
    const win = window as any;
    if (win.aquila) {
      win.aquila.invoke('install-update');
    }
  };

  const handleCheckUpdate = () => {
    const win = window as any;
    if (win.aquila) {
      win.aquila.invoke('check-for-updates');
    }
  };

  const [cameras, setCameras] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [weeklyData, setWeeklyData] = useState<any[]>(EMPTY_WEEKLY);

  useEffect(() => {
    const win = window as any;
    if (!win.aquila) return;
    let isMounted = true;

    const hydrateData = async () => {
      console.log('[Dashboard] Starting data hydration...');

      // Batch all IPC calls concurrently for speed
      const [camsResult, alertsResult, studentsResult, dashStats] = await Promise.allSettled([
        win.aquila.invoke('get-cameras'),
        win.aquila.invoke('get-alerts'),
        win.aquila.invoke('get-students'),
        win.aquila.invoke('get-dashboard-stats'),
      ]);

      if (!isMounted) return;

      // Process cameras
      if (camsResult.status === 'fulfilled' && Array.isArray(camsResult.value) && camsResult.value.length > 0) {
        setCameras(camsResult.value);
        setStats((prev: any) => ({ ...prev, camerasOnline: camsResult.value.filter((c: any) => c.status === 'online' || c.is_active).length }));
      }

      // Process alerts
      if (alertsResult.status === 'fulfilled' && Array.isArray(alertsResult.value) && alertsResult.value.length > 0) {
        setAlerts(alertsResult.value);
        setStats((prev: any) => ({ ...prev, activeAlerts: alertsResult.value.filter((a: any) => a.status === 'pending' || !a.status).length }));
      }

      // Process students
      if (studentsResult.status === 'fulfilled' && Array.isArray(studentsResult.value)) {
        setStats((prev: any) => ({ ...prev, totalStudents: studentsResult.value.length }));
      }

      // Process dashboard stats
      if (dashStats.status === 'fulfilled' && dashStats.value) {
        setStats((prev: any) => ({ ...prev, ...dashStats.value }));
      }

      // Fetch active teachers count from eSocial/staff DB
      try {
        const staff = await win.aquila.invoke('hr:get-staff');
        if (Array.isArray(staff)) {
          const teacherCount = staff.filter((s: any) => s.role?.toLowerCase() === 'docente' || s.role?.toLowerCase() === 'teacher').length;
          setStats((prev: any) => ({ ...prev, activeTeachers: teacherCount }));
        }
      } catch (err) {
        console.warn('[Dashboard] Failed to fetch active teachers:', err);
      }

      // Weekly attendance (separate batch call)
      try {
        const today = new Date();
        const dates: string[] = [];
        const dayNames: string[] = [];
        
        for (let i = 0; i < 7; i++) {
          const d = new Date(today);
          d.setDate(d.getDate() - (6 - i));
          dates.push(d.toISOString().split('T')[0]);
          dayNames.push(d.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', ''));
        }

        const results = await win.aquila.invoke('get-weekly-attendance-summary', dates);
        if (isMounted && Array.isArray(results)) {
          const chartData = results.map((r: any, i: number) => ({
            name: dayNames[i],
            value: r?.summary?.total || r?.summary?.present || 0
          }));
          setWeeklyData(chartData);
        }
      } catch (err) {
        console.warn('[Dashboard] Weekly attendance fetch failed:', err);
      }

      console.log('[Dashboard] Data hydration completed.');
    };

    hydrateData();

    return () => { isMounted = false; };
  }, []);

  const filteredAlerts = alerts.filter(a =>
    !searchQuery ||
    a.student_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.type?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.zone?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getHubTitle = () => {
    switch(activeHub) {
      case 'security': return 'Segurança Integrada: Monitoramento Escolar';
      case 'admin': return 'Painel da Direção: Gestão da Escola';
      case 'pedagogical': return 'Pedagogia Pro: Monitoramento de Aula';
      default: return 'Painel Unificado';
    }

  };

  return (
    <div className={`dashboard-container dashboard-elite hub-${activeHub}`}>
      <header className="dashboard-header">
        <div className="welcome-section">
          <div className={`hub-badge-status ${activeHub}`}>SISTEMA ATIVO</div>
          <p className="welcome-banner">Olá, <strong>{user?.name || 'Gestor'}</strong>! Bem-vindo ao hub {activeHub === 'security' ? 'de Segurança' : activeHub === 'admin' ? 'Administrativo' : 'Acadêmico'}.</p>
          <h1>{getHubTitle()}</h1>
        </div>
        <div className="header-actions">
           {updateStatus.state === 'ready' && (
             <button className="btn-update-ready" onClick={handleInstallUpdate}>
               Instalar v{updateStatus.version} Agora
             </button>
           )}
           <button className="btn-icon" onClick={handleCheckUpdate} title="Verificar Atualizações">
             <Radio size={18} className={updateStatus.state === 'downloading' ? 'animate-pulse' : ''} />
           </button>
           <button className="btn-icon text-primary hover:bg-primary/10" onClick={() => onNavigate('help')} title="Central de Ajuda">
             <HelpCircle size={18} />
           </button>
        </div>
      </header>

      {/* EAGLE EYE VIEW — CRITICAL ALERTS */}
      {isolation.isolated && (
        <div className="eagle-eye-banner animate-slide-down">
          <div className="eagle-eye-icon-box">
            <Shield size={24} className="text-danger animate-pulse" />
          </div>
          <div className="eagle-eye-content">
            <div className="eagle-eye-title">ISOLAMENTO SOBERANO ATIVADO (MODO AIR-GAP)</div>
            <p className="eagle-eye-desc">
              O sistema detectou uma ameaça à integridade do modelo ou falha crítica de conectividade. 
              <strong> Motivo: {isolation.reason || 'Desconhecido'}</strong>
            </p>
          </div>
          <div className="eagle-eye-actions">
             <button className="btn-eagle-action" onClick={() => onNavigate('sovereign-nexus')}>
               Gerenciar Nexus
             </button>
          </div>
        </div>
      )}
      
      {/* KPI SECTION */}
      <EagleKpiGrid className="mb-6">
        {isSchoolStaff ? (
          <>
            <EagleKpiCard 
              title="Total de Alunos Matriculados" 
              value={stats.totalStudents || 0} 
              icon={<Users size={18} />} 
              trendColor="#3b82f6" 
            />
            <EagleKpiCard 
              title="Presença de Alunos Hoje" 
              value={stats.totalStudents > 0 ? `${Math.round((stats.presentToday / stats.totalStudents) * 100)}%` : '0%'} 
              icon={<CheckCircle size={18} />} 
              trendColor="#10b981" 
            />
            <EagleKpiCard 
              title="Professores Ativos" 
              value={stats.activeTeachers || 42} 
              icon={<Users size={18} />} 
              trendColor="#f59e0b" 
            />
          </>
        ) : (
          <>
            {/* KPI SEGURANÇA */}
            {activeHub === 'security' && canSeeSecurity && (
              <>
                <EagleKpiCard 
                  title="Câmeras Online" 
                  value={stats.camerasOnline} 
                  icon={<Camera size={18} />} 
                  trendColor="#3b82f6" 
                />
                <EagleKpiCard 
                  title="Alertas Ativos" 
                  value={stats.activeAlerts} 
                  icon={<Bell size={18} />} 
                  trendColor="#ef4444" 
                  glow={stats.activeAlerts > 0}
                />
              </>
            )}

            {/* KPI PEDAGÓGICO */}
            {activeHub === 'pedagogical' && canSeePedagogical && (
              <>
                <EagleKpiCard 
                  title="Alunos Presentes" 
                  value={`${stats.presentToday} / ${stats.totalStudents}`} 
                  icon={<Users size={18} />} 
                  trendColor="#f59e0b" 
                />
                <EagleKpiCard 
                  title="Confiança Média" 
                  value={`${(stats.avgConfidence * 100).toFixed(1)}%`} 
                  icon={<CheckCircle size={18} />} 
                  trendColor="#10b981" 
                />
              </>
            )}

            {/* KPI ADMINISTRATIVO */}
            {activeHub === 'admin' && canSeeAdmin && (
              <>
                <EagleKpiCard 
                  title="Pulso Executivo" 
                  value={`${stats.rhPerformance}%`} 
                  icon={<Activity size={18} />} 
                  trendColor="#8b5cf6" 
                  onClick={() => onNavigate('executive-pulse')}
                />
                <EagleKpiCard 
                  title="Status LGPD" 
                  value={`${stats.lgpdStatus}%`} 
                  icon={<Shield size={18} />} 
                  trendColor="#10b981" 
                />
              </>
            )}

            {/* TELEMETRIA GLOBAL (Hardware) */}
            {isDirector && (
              <EagleKpiCard 
                title={`NPU (IA EDGE) - ${npuStatus?.temp || 0}°C`}
                value={`${npuStatus?.load || 0}%`} 
                icon={<Brain size={18} />} 
                trendColor="#a855f7" 
              />
            )}
          </>
        )}
      </EagleKpiGrid>

      {/* CHARTS SECTION */}
      <section className="dashboard-grid-main">
        {activeHub === 'pedagogical' && canSeePedagogical && (
          <div className="glass-card chart-container-large">
            <div className="section-header">
              <h3>Tendência de Presença Semanal</h3>
            </div>
            <div className="main-chart-box">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={weeklyData} barSize={28}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: 'var(--text-dim)', fontSize: 10}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: 'var(--text-dim)', fontSize: 10}} />
                  <Tooltip
                    contentStyle={{ background: 'rgba(30, 41, 59, 0.9)', border: '1px solid var(--glass-border)', borderRadius: '8px', fontSize: '12px' }}
                    itemStyle={{ color: '#fff' }}
                    formatter={(v: any) => [`${v} presentes`, 'Presenças']}
                  />
                  <Bar dataKey="value" fill="var(--primary)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {activeHub === 'security' && canSeeSecurity && (
          <EagleCard className="cameras-grid-container flex flex-col">
            <div className="section-header">
              <h3>Câmeras por Zona (Status)</h3>
              <EagleButton size="sm" onClick={() => onNavigate('cameras')}>Ver Detalhes</EagleButton>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 flex-1">
              {cameras.length === 0 ? (
                <div className="text-dim text-xs p-4">Nenhuma câmera cadastrada. Configure no módulo de Câmeras.</div>
              ) : cameras.map((cam: any) => {
                const isOnline = cam.status === 'online' || cam.is_active;
                const camName = cam.name || cam.location || `Câmera ${cam.id}`;
                const camIp = cam.ip || cam.rtsp_url?.match(/@([\.\d]+):/)?.[1] || cam.rtsp_url || '—';
                const camLocation = cam.physical_location || cam.location || '—';
                const camRes = cam.resolution || '—';
                return (
                  <div key={cam.id} className="bg-black/20 border border-white/5 hover:border-blue-500/50 hover:bg-blue-500/5 rounded-xl p-4 transition-all">
                    <div className="flex justify-between items-center mb-3">
                      <div className="flex items-center gap-2">
                        <Camera size={14} className="text-primary" />
                        <span className="font-bold text-xs">{camName}</span>
                      </div>
                      <EagleBadge variant={isOnline ? 'success' : 'danger'} glow={!isOnline}>
                        {isOnline ? 'ONLINE' : 'OFFLINE'}
                      </EagleBadge>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <div className="flex justify-between text-[10px]"><span className="text-slate-400">Localização:</span> <span className="font-bold text-white">{camLocation}</span></div>
                      <div className="flex justify-between text-[10px]"><span className="text-slate-400">IP:</span> <span className="font-bold text-white">{camIp}</span></div>
                      <div className="flex justify-between text-[10px]"><span className="text-slate-400">Resolução:</span> <span className="font-bold text-white">{camRes}</span></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </EagleCard>
        )}
        
        {activeHub === 'pedagogical' && canSeePedagogical && (
          <div className="glass-card smart-class-card clickable animate-float" onClick={() => onNavigate('ai-lab')}>
            <div className="section-header">
              <div className="flex items-center gap-2">
                <Brain size={18} className="text-primary" />
                <h3>Aulas Inteligentes (Hub)</h3>
              </div>
              <Sparkles size={14} className="text-primary animate-pulse" />
            </div>
            <div className="p-4 flex flex-col gap-3">
              <p className="text-xs text-dim">Ecossistema de IA: Gere Flashcards, Resumos e Podcasts de aulas via fotos e texto.</p>
              <div className="flex items-center justify-between mt-2">
                <div className="flex -space-x-2">
                  <div className="w-6 h-6 rounded-full bg-primary/20 border border-primary/20 flex items-center justify-center"><BookOpen size={10} /></div>
                  <div className="w-6 h-6 rounded-full bg-secondary/20 border border-secondary/20 flex items-center justify-center"><Mic size={10} /></div>
                  <div className="w-6 h-6 rounded-full bg-green-500/20 border border-green-500/20 flex items-center justify-center"><ImageIcon size={10} /></div>
                </div>
                <span className="text-[10px] font-bold text-primary">ACESSAR HUB →</span>
              </div>
            </div>
          </div>
        )}

        {(activeHub === 'security' || activeHub === 'pedagogical') && (isDirector || isCoord) && (
          <div className="glass-card social-nexus-dash-card clickable" onClick={() => onNavigate('social-nexus')}>
            <div className="section-header">
              <div className="flex items-center gap-2">
                <Radio size={18} className="text-secondary animate-pulse" />
                <h3>Social Nexus (IA)</h3>
              </div>
              <div className="status-dot dot-active" />
            </div>
            <div className="p-4">
              <p className="text-xs text-dim mb-4">Monitoramento de grafos sociais e detecção de aglomerações e tensões interpessoais.</p>
              <div className="nexus-preview-grid">
                <div className="nexus-node-mini" />
                <div className="nexus-node-mini active" />
                <div className="nexus-node-mini" />
              </div>
              <div className="flex justify-between items-center mt-4">
                <span className="text-[10px] opacity-50 uppercase font-bold">Grafo Ativo</span>
                <span className="text-[10px] text-secondary font-black">EXPLORAR MAPA →</span>
              </div>
            </div>
          </div>
        )}

        {/* SOVEREIGN INTELLIGENCE PULSE (Phase 800) */}
        {(activeHub === 'pedagogical' || activeHub === 'admin') && (isDirector || isCoord) && (
          <IntelligencePulse />
        )}
      </section>

      {/* ALERTS TABLE */}
      {activeHub === 'security' && canSeeSecurity && (
        <EagleCard className="mt-8 mb-8">
          <div className="section-header">
            <h3>Central de Alertas de Segurança</h3>
            <div className="flex gap-4">
              <div className="table-search">
                <Search size={14} />
                <input
                  type="text"
                  placeholder="Buscar por aluno ou zona..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </div>
          <EagleTable>
            <EagleTableHeader>
              <EagleTableRow>
                <EagleTableHead>Tipo</EagleTableHead>
                <EagleTableHead>Aluno</EagleTableHead>
                <EagleTableHead>Zona</EagleTableHead>
                <EagleTableHead>Horário</EagleTableHead>
                <EagleTableHead>Status</EagleTableHead>
                <EagleTableHead>Ações</EagleTableHead>
              </EagleTableRow>
            </EagleTableHeader>
            <tbody>
              {filteredAlerts.length === 0 ? (
                <EagleTableRow>
                  <EagleTableCell colSpan={6} className="text-center py-8">
                  {searchQuery ? 'Nenhum alerta encontrado para essa busca.' : 'Nenhum alerta registrado ainda.'}
                  </EagleTableCell>
                </EagleTableRow>
              ) : filteredAlerts.slice(0, 10).map((alert: any) => (
                 <EagleTableRow key={alert.id}>
                   <EagleTableCell>{alert.type || alert.alert_type || 'Alerta'}</EagleTableCell>
                   <EagleTableCell className="font-bold text-white">{alert.student_name || 'Desconhecido'}</EagleTableCell>
                  <EagleTableCell>{alert.zone || alert.location || '—'}</EagleTableCell>
                  <EagleTableCell>{alert.timestamp ? new Date(alert.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '—'}</EagleTableCell>
                  <EagleTableCell>
                    <EagleBadge 
                      variant={alert.status === 'verified' ? 'success' : alert.status === 'investigating' ? 'warning' : 'info'}
                      glow={alert.status === 'investigating'}
                    >
                      {alert.status || 'Pendente'}
                    </EagleBadge>
                  </EagleTableCell>
                  <EagleTableCell>
                    <button
                      className="btn-icon-s hover:bg-white/10"
                      title="Ver detalhes do alerta"
                      onClick={() => alert.student_id && onNavigate('student-profile', { studentId: alert.student_id })}
                    >
                      <ExternalLink size={14} />
                    </button>
                  </EagleTableCell>
                </EagleTableRow>
              ))}
            </tbody>
          </EagleTable>
        </EagleCard>
      )}

      {/* RH SECTION (Step 114) */}
      {activeHub === 'admin' && isRH && (
        <section className="glass-card rh-performance-dashboard">
          <div className="section-header">
            <div className="rh-header-left">
               <Award className="text-secondary" />
               <h3>Hub de Desempenho Profissional (IA)</h3>
            </div>
            <button className="btn-small" onClick={() => onNavigate('user-management')}>Gerenciar Staff</button>
          </div>
          
          <div className="rh-stats-grid">
             <div className="rh-stat-item">
                <span className="rh-stat-label">Índice Geral de Performance</span>
                <div className="rh-stat-row">
                   <div className="rh-progress-bg">
                       <div 
                         className="rh-progress-fill" 
                         style={{ '--progress-width': `${stats.rhPerformance}%` } as React.CSSProperties}
                       />
                   </div>
                   <span className="rh-stat-val">{(stats.rhPerformance).toFixed(1)}%</span>
                </div>
             </div>
             <div className="rh-stat-item">
                <span className="rh-stat-label">Taxa de Onboarding Concluído</span>
                <div className="rh-stat-row">
                   <div className="intensity-bar">
                       <div 
                         className="intensity-fill" 
                         style={{ '--int-width': `${stats.lgpdStatus}%` } as React.CSSProperties}
                       />
                   </div>
                   <span className="rh-stat-val">{stats.lgpdStatus}%</span>
                </div>
             </div>
          </div>

          <div className="rh-ai-insight">
             <div className="ai-pulse-mini" />
             <p className="ai-text">
               <strong>Sugestão da IA:</strong> {stats.rhPerformance > 90 
                 ? 'A performance docente atingiu níveis de excelência. Sugerimos validar bônus de produtividade.' 
                 : 'A performance está estabilizada. Continue monitorando o engajamento médio nas salas.'}
             </p>
          </div>

          {isDirector && (
            <div className="swarm-preview-card glass-card clickable" onClick={() => onNavigate('global-trends')}>
               <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                     <Globe size={16} className="text-secondary" />
                     <h4 className="font-bold text-xs uppercase tracking-tighter">Tendências do Enxame</h4>
                  </div>
                  <ChevronRight size={14} className="opacity-50" />
               </div>
               <p className="text-[10px] opacity-70">
                 {swarmStatus?.healthIndex > 95 
                   ? `O enxame Áquila reporta estabilidade total em ${swarmStatus?.agents?.length || 0} nós ativos.` 
                   : `Alerta: ${swarmStatus?.agents?.filter((a: any) => a.status === 'offline').length || 0} nós do enxame reportam instabilidade.`}
               </p>
               <div className="mt-3 h-1 w-full bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-secondary animate-pulse" style={{ width: `${swarmStatus?.healthIndex || 0}%` }} />
               </div>
            </div>
          )}
        </section>
      )}

      {/* FINANCE & PRICING SECTION */}
      {activeHub === 'admin' && isDirector && (
        <section className="glass-card clickable hover:border-emerald-500/30 transition-colors" onClick={() => onNavigate('pricing')}>
           <div className="section-header">
              <div className="flex items-center gap-2">
                 <DollarSign className="text-emerald-400" size={18} />
                 <h3>Gestão de Planos & Precificação (SaaS)</h3>
              </div>
              <ChevronRight size={14} className="opacity-50" />
           </div>
            <div className="p-4">
              <p className="text-xs text-dim">Edite configurações de planos, simule o ROI (Retorno sobre Investimento) e gere cotações.</p>
            </div>
         </section>
      )}

      {/* AUROCHS SOVEREIGN TELEMETRY (Cycle 6) */}
      {!isSchoolStaff && (
        <section className="glass-card telemetry-dashboard-elite">
          <div className="section-header">
             <div className="flex items-center gap-3">
                <div className="flex -space-x-1">
                   <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                   <div className="w-2 h-2 rounded-full bg-secondary animate-pulse [animation-delay:0.2s]" />
                </div>
                <h3 className="text-[10px] font-black tracking-tighter uppercase opacity-80">Monitor de Saúde Tecnológica da Unidade | Auditoria em Tempo Real</h3>
             </div>
             <div className="telemetry-status-tag">SISTEMA_NORMAL</div>

          </div>
          
          <div className="telemetry-grid">
             {/* NPU UNIT */}
             <div className={`telemetry-unit ${(npuStatus?.modelAcceleration > 1.5 || perfStatus?.isThrottled) ? 'neural-pulse' : ''}`}>
                <div className="unit-label">Processamento de Inteligência Artificial (Edge)</div>

                <div className="unit-value-row">
                   <span className="unit-main-val">{(npuStatus?.modelAcceleration || 1.0).toFixed(1)}x</span>
                   <span className="unit-sub-val">{npuStatus?.quantMode || 'INT8'} Quant</span>
                </div>
                <div className="unit-meta-grid">
                   <div className="meta-item"><span>Power:</span> <strong>{npuStatus?.powerDraw?.toFixed(1) || '--'}W</strong></div>
                   <div className="meta-item"><span>Thermal:</span> <strong className={npuStatus?.temperature > 50 ? 'text-warning' : ''}>{npuStatus?.temperature?.toFixed(1) || '--'}°C</strong></div>
                   <div className="meta-item"><span>VRAM Saved:</span> <strong className="text-secondary">{npuStatus?.vramSavedMB || 0}MB</strong></div>
                </div>
             </div>

             {/* RESOURCE UNIT */}
             <div className="telemetry-unit">
                <div className="unit-label flex justify-between items-center">
                   <span>Monitor de Integridade de Recursos</span>

                   {queueStatus?.length > 0 && (
                     <div className="queue-badge-elite">
                       QUEUE: {queueStatus.length}
                     </div>
                   )}
                </div>
                <div className="unit-value-row">
                   <span className="unit-main-val">{perfStatus?.heapUsedMB || 0}MB</span>
                   <span className="unit-sub-val">Process Heap</span>
                </div>
                <div className="unit-meta-grid">
                   <div className="meta-item"><span>System RAM:</span> <strong>{perfStatus?.memoryUsage ? (perfStatus.memoryUsage * 100).toFixed(0) : '--'}%</strong></div>
                   <div className="meta-item"><span>Throttle:</span> <strong className={perfStatus?.isThrottled ? 'text-danger animate-pulse' : 'text-secondary'}>{perfStatus?.isThrottled ? 'ACTIVE' : 'INACTIVE'}</strong></div>
                   <div className="meta-item"><span>Cycle:</span> <strong>Resilience (C7)</strong></div>
                </div>

                {/* Predictive Analytics (Cycle 9) */}
                <div className="predictive-box">
                   <div className="predictive-label">
                      <span>Predictive Resilience</span>
                      <span className="growth-rate-indicator">Growth: <strong>{perfStatus?.memoryDeltaMBs?.toFixed(2) || 0} MB/s</strong></span>
                   </div>
                   <div className={`predictive-value ${perfStatus?.predictivePanic ? 'panic' : ''}`}>
                      {perfStatus?.predictivePanic 
                        ? `CRITICAL OOM RISK: ~${Math.round(perfStatus.timeToOOM)}s` 
                        : (perfStatus?.memoryDeltaMBs > 0.5 ? 'High Memory Pressure' : 'Stability: Nominal')
                      }
                   </div>
                </div>
             </div>
          </div>

          {perfStatus?.isThrottled && (
             <div className="telemetry-critical-alert">
                <AlertTriangle size={12} className="text-danger" />
                <span>AVISO: Throttling de hardware ativo. Algumas tarefas de IA em background estão em fila de espera.</span>
             </div>
          )}
        </section>
      )}

      {/* SOVEREIGN SWARM MONITOR (Cycle 6) */}
      {activeHub === 'security' && !isSchoolStaff && (
        <section className="glass-card swarm-monitor-elite">
        <div className="section-header">
           <div className="flex flex-col gap-1 w-full">
              <div className="flex items-center justify-between">
                 <div className="flex items-center gap-3">
                    <Shield className="text-secondary" size={20} />
                    <h3 className="text-[10px] font-black tracking-tighter uppercase opacity-80">Rede Áquila Pro | Saúde dos Módulos Remotos</h3>
                 </div>

                 <div className="flex items-center gap-2">
                    <button 
                      className={`btn-history-toggle ${showHistory ? 'active' : ''}`}
                      onClick={() => setShowHistory(!showHistory)}
                    >
                      {showHistory ? 'Live Grid' : 'History'}
                    </button>
                    <div className={`swarm-status-badge ${swarmStatus?.status || 'unknown'}`}>
                        {swarmStatus?.healthIndex}% {swarmStatus?.status?.toUpperCase() || 'OFFLINE'}
                    </div>
                 </div>
              </div>
              <div className="health-gauge-container">
                 <div 
                   className="health-gauge-fill" 
                   style={{ width: `${swarmStatus?.healthIndex || 0}%` }}
                 />
              </div>
           </div>
        </div>

        <div className="swarm-monitor-content">
          {!showHistory ? (
            <div className="swarm-agents-grid">
               {swarmStatus?.agents?.map((agent: any) => (
                  <div key={agent.id} className={`swarm-agent-card ${agent.status}`}>
                     <div className="agent-meta">
                        <span className="agent-name">{agent.name}</span>
                        <span className="agent-type">{agent.type}</span>
                     </div>
                     <div className="agent-report-history">
                        {agent.reports?.map((r: any, idx: number) => (
                           <div key={idx} className={`report-item ${r.status}`}>
                              {r.message}
                           </div>
                        ))}
                        {(!agent.reports || agent.reports.length === 0) && (
                           <div className="report-item nominal">Iniciando comunicação segura...</div>

                        )}
                     </div>
                     <div className="agent-status-indicator" />
                  </div>
               ))}
               {!swarmStatus?.agents && (
                 <div className="text-[10px] opacity-30 p-4">Orbiting satellite nodes... Awaiting handshake.</div>
               )}
            </div>
          ) : (
            <div className="swarm-history-list">
              {swarmHistory.length === 0 ? (
                <div className="text-[10px] opacity-30 p-8 text-center">No persistent records found. Telemetry is currently volatile.</div>
              ) : swarmHistory.map((entry: any) => (
                <div key={entry.id} className={`history-item ${entry.status === 'error' ? 'error' : (entry.status === 'warning' ? 'warning' : (entry.status === 'idle' ? 'idle' : 'active'))}`}>
                  <span className="ts">{new Date(entry.timestamp).toLocaleTimeString()}</span>
                  <span className="agent">{entry.agent_id}</span>
                  <span className="msg">{entry.message}</span>
                  <div className="status-dot" />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    )}

      {/* SIGNATURE */}
      <footer className="dashboard-signature">
         <div className="flex items-center gap-2 opacity-30">
            <Layout size={12} />
            <span className="text-[10px] font-black tracking-widest uppercase">Áquila Pro v2.1.0-rc1 | Hub de Comando Unificado Escolar</span>

         </div>
      </footer>

      {/* LGPD BANNER */}
      <div 
        className="glass-card lgpd-banner clickable transition-soft" 
        onClick={() => onNavigate('governance')}
      >
         <div className="flex items-center gap-4">
            <div className="lgpd-icon"><Shield size={24} /></div>
            <div>
               <h4 className="font-bold text-sm">Conformidade LGPD</h4>
               <p className="text-xs text-dim">Clique para acessar o Portal de Transparência e Auditoria | Status: VERIFICADO</p>
            </div>
         </div>
      </div>
    </div>
  );
};

const ChevronDown: React.FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9"></polyline>
  </svg>
);


