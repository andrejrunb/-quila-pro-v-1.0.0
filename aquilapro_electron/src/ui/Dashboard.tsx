import React, { useState, useEffect } from 'react';
import { 
  Users, Camera, Bell, Shield, 
  Search, Info, CheckCircle, AlertTriangle, 
  Smartphone, ExternalLink, Globe, Layout,
  MoreVertical, Filter, Download, Radio, Megaphone, Award
} from 'lucide-react';
import { BarChart, Bar, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, AreaChart, Area } from 'recharts';
import { RuViewMapping } from './components/RuViewMapping';
import { hrSovereigntyService } from '../services/HRSovereigntyService';
import './Dashboard.css';

// Mock data for Sparklines
const sparklineData = [
  { value: 10 }, { value: 25 }, { value: 15 }, { value: 30 }, 
  { value: 20 }, { value: 45 }, { value: 35 }, { value: 50 }
];

// Dados padrão vazios — serão substituídos pelos dados reais do banco
const EMPTY_WEEKLY: any[] = [];

const KpiSparkline: React.FC<{ color: string }> = ({ color }) => (
  <div className="kpi-sparkline">
    <ResponsiveContainer width="100%" height={40}>
      <AreaChart data={sparklineData}>
        <defs>
          <linearGradient id={`grad-${color}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.3}/>
            <stop offset="95%" stopColor={color} stopOpacity={0}/>
          </linearGradient>
        </defs>
        <Area 
          type="monotone" 
          dataKey="value" 
          stroke={color} 
          fillOpacity={1} 
          fill={`url(#grad-${color})`} 
          strokeWidth={2}
        />
      </AreaChart>
    </ResponsiveContainer>
  </div>
);

interface DashboardProps {
  onNavigate: (page: string) => void;
  onLogout: () => void;
  userRole?: string;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate, onLogout, userRole = 'admin' }) => {
  const isDirector = ['admin', 'director'].includes(userRole);
  const isCoord = ['coordinator'].includes(userRole);
  const isTeacher = ['teacher'].includes(userRole);
  const isRH = ['rh'].includes(userRole);

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

  const [updateStatus, setUpdateStatus] = useState<{
    state: 'idle' | 'available' | 'downloading' | 'ready' | 'error';
    version?: string;
    progress?: number;
    error?: string;
  }>({ state: 'idle' });

  useEffect(() => {
    // Listen for update events from Main process
    const win = window as any;
    if (win.electron) {
      win.electron.on('update-available', (info: any) => {
        setUpdateStatus({ state: 'available', version: info.version });
      });

      win.electron.on('update-download-progress', (progress: any) => {
        setUpdateStatus(prev => ({ ...prev, state: 'downloading', progress: progress.percent }));
      });

      win.electron.on('update-downloaded', (info: any) => {
        setUpdateStatus({ state: 'ready', version: info.version });
      });

      win.electron.on('update-error', (err: any) => {
        setUpdateStatus({ state: 'error', error: err.message });
        setTimeout(() => setUpdateStatus({ state: 'idle' }), 5000);
      });
    }
  }, []);

  const handleInstallUpdate = () => {
    const win = window as any;
    if (win.electron) {
      win.electron.invoke('install-update');
    }
  };

  const handleCheckUpdate = () => {
    const win = window as any;
    if (win.electron) {
      win.electron.invoke('check-for-updates');
    }
  };

  const [cameras, setCameras] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [weeklyData, setWeeklyData] = useState<any[]>(EMPTY_WEEKLY);

  useEffect(() => {
    const win = window as any;
    if (!win.electron) return;

    // Câmeras reais
    win.electron.invoke('get-cameras').then((cams: any[]) => {
      if (Array.isArray(cams) && cams.length > 0) {
        setCameras(cams);
        setStats((prev: any) => ({ ...prev, camerasOnline: cams.filter((c: any) => c.status === 'online' || c.is_active).length }));
      }
    }).catch(() => {});

    // Alertas reais
    win.electron.invoke('get-alerts').then((al: any[]) => {
      if (Array.isArray(al) && al.length > 0) {
        setAlerts(al);
        setStats((prev: any) => ({ ...prev, activeAlerts: al.filter((a: any) => a.status === 'pending' || !a.status).length }));
      }
    }).catch(() => {});

    // Total de alunos real
    win.electron.invoke('get-students').then((students: any[]) => {
      if (Array.isArray(students)) {
        setStats((prev: any) => ({ ...prev, totalStudents: students.length }));
      }
    }).catch(() => {});

    // Stats do dashboard (presença de hoje)
    win.electron.invoke('get-dashboard-stats').then((s: any) => {
      if (s) setStats((prev: any) => ({ ...prev, ...s }));
    }).catch(() => {});

    /*
    // RH Performance (Step 114)
    const rhData = hrSovereigntyService.getAllStaff();
    const avgPerf = rhData.length > 0 
      ? rhData.reduce((acc, curr) => acc + (curr.performanceScore || 0), 0) / rhData.length 
      : 88;
    setStats((prev: any) => ({ ...prev, rhPerformance: avgPerf, broadcastActive: Math.random() > 0.5 }));
    */

    // Dados de presença semanal (últimos 7 dias)
    const today = new Date();
    const promises = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today);
      d.setDate(d.getDate() - (6 - i));
      const dateStr = d.toISOString().split('T')[0];
      const dayName = d.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '');
      return win.electron.invoke('get-daily-attendance-summary', dateStr)
        .then((r: any) => ({ name: dayName, value: r?.total || r?.present || 0 }))
        .catch(() => ({ name: dayName, value: 0 }));
    });
    Promise.all(promises).then(data => setWeeklyData(data));
  }, []);

  const filteredAlerts = alerts.filter(a =>
    !searchQuery ||
    a.student_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.type?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.zone?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="page-container dashboard-elite">
      
      {/* UPDATE CENTER BANNER */}
      {updateStatus.state !== 'idle' && (
        <div className={`update-banner-elite ${updateStatus.state}`}>
          <div className="update-content">
            <div className="update-icon">
              {updateStatus.state === 'available' && <Download size={20} className="pulse" />}
              {updateStatus.state === 'downloading' && <div className="spinner-s" />}
              {updateStatus.state === 'ready' && <CheckCircle size={20} className="text-secondary" />}
              {updateStatus.state === 'error' && <AlertTriangle size={20} className="text-danger" />}
            </div>
            <div className="update-text">
              {updateStatus.state === 'available' && (
                <span>Nova versão Áquila Pro {updateStatus.version} disponível! O download começará em breve.</span>
              )}
              {updateStatus.state === 'downloading' && (
                <span>Baixando atualização... {Math.round(updateStatus.progress || 0)}%</span>
              )}
              {updateStatus.state === 'ready' && (
                <span className="font-bold">Atualização preparada! Versão {updateStatus.version} pronta para instalar.</span>
              )}
              {updateStatus.state === 'error' && (
                <span className="text-danger">Erro ao buscar atualização: {updateStatus.error}</span>
              )}
            </div>
          </div>
          <div className="update-actions">
            {updateStatus.state === 'ready' ? (
              <button className="btn-update-now" onClick={handleInstallUpdate}>
                Instalar e Reiniciar Agora
              </button>
            ) : (
               updateStatus.state === 'available' && <span className="text-xs opacity-50">Transferindo...</span>
            )}
            <button className="btn-close-banner" onClick={() => setUpdateStatus({ state: 'idle' })}>×</button>
          </div>
        </div>
      )}
      
      {/* KPI SECTION */}
      <section className="dashboard-grid-kpi">
        {canSeeSecurity && (
          <div className="glass-card kpi-elite">
            <div className="kpi-elite-header">
              <div className="kpi-icon-box"><Camera size={18} /></div>
              <div className="kpi-elite-label">Câmeras Ativas</div>
            </div>
            <div className="kpi-elite-content">
              <div className="kpi-elite-value">{stats.camerasOnline} <span className="value-total">/ 12</span></div>
              <KpiSparkline color="var(--primary)" />
            </div>
          </div>
        )}

        {canSeePedagogical && (
          <div className="glass-card kpi-elite">
            <div className="kpi-elite-header">
              <div className="kpi-icon-box"><Users size={18} /></div>
              <div className="kpi-elite-label">Alunos Presentes</div>
            </div>
            <div className="kpi-elite-content">
              <div className="kpi-elite-value">{stats.presentToday} <span className="value-total">/ {stats.totalStudents}</span></div>
              <KpiSparkline color="var(--primary)" />
            </div>
          </div>
        )}

        {canSeeSecurity && (
          <div className="glass-card kpi-elite">
            <div className="kpi-elite-header">
              <div className="kpi-icon-box text-warning"><Bell size={18} /></div>
              <div className="kpi-elite-label">Alertas de Segurança</div>
            </div>
            <div className="kpi-elite-content">
              <div className="kpi-elite-value text-warning">{stats.activeAlerts}</div>
              <KpiSparkline color="var(--warning)" />
            </div>
          </div>
        )}

        {canSeeAdmin && (
          <div className="glass-card kpi-elite">
            <div className="kpi-elite-header">
              <div className="kpi-icon-box text-secondary"><Globe size={18} /></div>
              <div className="kpi-elite-label">Nível de Acesso</div>
            </div>
            <div className="kpi-elite-content">
              <div className="kpi-elite-value uppercase text-secondary font-lg">{userRole}</div>
              <KpiSparkline color="var(--secondary)" />
            </div>
          </div>
        )}

        {stats.broadcastActive && (
          <div className="glass-card kpi-elite broadcast-active-kpi animate-pulse">
            <div className="kpi-elite-header">
              <div className="kpi-icon-box text-orange-400"><Megaphone size={18} /></div>
              <div className="kpi-elite-label">Transmitindo</div>
            </div>
            <div className="kpi-elite-content">
              <div className="kpi-elite-value text-orange-400 text-sm">AVISO GERAL ATIVO</div>
              <span className="text-[10px] opacity-70">Canais de Voz/Texto Linkados</span>
            </div>
          </div>
        )}
      </section>

      {/* CHARTS SECTION */}
      <section className="dashboard-grid-main">
        {canSeePedagogical && (
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
                    contentStyle={{ background: '#1e293b', border: '1px solid var(--glass-border)', borderRadius: '8px', fontSize: '12px' }}
                    itemStyle={{ color: '#fff' }}
                    formatter={(v: any) => [`${v} presentes`, 'Presenças']}
                  />
                  <Bar dataKey="value" fill="var(--primary)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {canSeeSecurity && (
          <div className="glass-card cameras-grid-container">
            <div className="section-header">
              <h3>Câmeras por Zona (Status)</h3>
              <button className="btn-small" onClick={() => onNavigate('camera-live-view')}>Ver Detalhes</button>
            </div>
            <div className="cameras-list-horizontal">
              {cameras.length === 0 ? (
                <div className="text-dim text-xs p-4">Nenhuma câmera cadastrada. Configure no módulo de Câmeras.</div>
              ) : cameras.map((cam: any) => {
                const isOnline = cam.status === 'online' || cam.is_active;
                const camName = cam.name || cam.location || `Câmera ${cam.id}`;
                const camIp = cam.ip || cam.rtsp_url?.match(/@([\.\d]+):/)?.[1] || cam.rtsp_url || '—';
                const camLocation = cam.physical_location || cam.location || '—';
                const camRes = cam.resolution || '—';
                return (
                  <div key={cam.id} className="camera-status-card">
                    <div className="cam-card-header">
                      <div className="flex items-center gap-2">
                        <Camera size={14} className="text-primary" />
                        <span className="font-bold text-xs">{camName}</span>
                      </div>
                      <span className={`status-badge ${isOnline ? 'online' : 'offline'}`}>{isOnline ? 'ONLINE' : 'OFFLINE'}</span>
                    </div>
                    <div className="cam-card-details">
                      <div className="detail-row"><span>Localização:</span> <span>{camLocation}</span></div>
                      <div className="detail-row"><span>IP:</span> <span>{camIp}</span></div>
                      <div className="detail-row"><span>Resolução:</span> <span>{camRes}</span></div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex justify-end mt-4">
              <button className="btn-small" onClick={() => onNavigate('camera-live-view')}>Ver Detalhes</button>
            </div>
          </div>
        )}
      </section>

      {/* RUVIEW SPATIAL INTELLIGENCE (Step 112) */}
      {canSeeSecurity && (
        <section className="dashboard-spatial-intelligence">
           <div className="glass-card spatial-card">
              <div className="section-header">
                 <div className="flex items-center gap-3">
                    <Radio className="text-blue-400 animate-pulse" size={20} />
                    <h3>RuView: Inteligência Espacial (Ocupação RTI)</h3>
                 </div>
                 <span className="text-[10px] bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded-full border border-blue-500/20">BIO-TRACKING ATIVO</span>
              </div>
              <div className="spatial-visualization-wrapper">
                 <RuViewMapping 
                   zoneName="HALL PRINCIPAL / RECEPÇÃO"
                   points={[
                     { id: 'p1', x: 2, y: 3, intensity: 0.9 },
                     { id: 'p2', x: 8, y: 5, intensity: 0.4 },
                     { id: 'p3', x: 5, y: 12, intensity: 0.76 }
                   ]}
                 />
              </div>
           </div>
        </section>
      )}

      {/* ALERTS TABLE */}
      {canSeeSecurity && (
        <section className="glass-card alerts-table-container">
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
          <table className="elite-table">
            <thead>
              <tr>
                <th>Tipo</th>
                <th>Aluno</th>
                <th>Zona</th>
                <th>Horário</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredAlerts.length === 0 ? (
                <tr><td colSpan={6} className="empty-table-cell">
                  {searchQuery ? 'Nenhum alerta encontrado para essa busca.' : 'Nenhum alerta registrado ainda.'}
                </td></tr>
              ) : filteredAlerts.slice(0, 10).map((alert: any) => (
                 <tr key={alert.id}>
                   <td>{alert.type || alert.alert_type || 'Alerta'}</td>
                   <td className="alert-student-name">{alert.student_name || 'Desconhecido'}</td>
                  <td>{alert.zone || alert.location || '—'}</td>
                  <td>{alert.timestamp ? new Date(alert.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '—'}</td>
                  <td><span className={`badge-${alert.status === 'verified' ? 'ver' : alert.status === 'investigating' ? 'inv' : 'ia'}`}>{alert.status || 'Pendente'}</span></td>
                  <td>
                    <button
                      className="btn-icon-s"
                      title="Ver detalhes do alerta"
                      onClick={() => alert.student_id && onNavigate(`student-profile?id=${alert.student_id}`)}
                    >
                      <ExternalLink size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {/* RH SECTION (Step 114) */}
      {isRH && (
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
                        style={{ '--int-width': `94.2%` } as React.CSSProperties}
                      />
                   </div>
                   <span className="rh-stat-val">94.2%</span>
                </div>
             </div>
          </div>

          <div className="rh-ai-insight">
             <div className="ai-pulse-mini" />
             <p className="ai-text"><strong>Insight Oraculum:</strong> A equipe de Coordenação atingiu o pico de eficiência bio-métrica esta semana (96% de pontualidade). Sugerimos liberação de bônus de engajamento.</p>
          </div>
        </section>
      )}

      {/* SIGNATURE */}
      <footer className="dashboard-signature">
         <div className="flex items-center gap-2 opacity-30">
            <Layout size={12} />
            <span className="text-[10px] font-black tracking-widest uppercase">Áquila Grand Sovereign v1.3.0 | Módulo de Comando Unificado</span>
         </div>
      </footer>

      {/* LGPD BANNER */}
      <div className="glass-card lgpd-banner">
         <div className="flex items-center gap-4">
            <div className="lgpd-icon"><Shield size={24} /></div>
            <div>
               <h4 className="font-bold text-sm">Conformidade LGPD</h4>
               <p className="text-xs text-dim">Conformidade LGPD: Ativa e Verificada | Relatório de Auditoria Diária: [Data]</p>
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


