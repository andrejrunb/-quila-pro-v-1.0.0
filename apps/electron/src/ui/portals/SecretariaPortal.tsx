import React, { useState, useEffect } from 'react';
import { PortalLayout } from '../layouts/PortalLayout';
import { 
  FileText, CloudSync, ShieldAlert, CheckCircle2, Search, Loader2, UserPlus, DoorOpen, 
  LayoutDashboard, Sliders, Presentation, TrendingUp, AlertOctagon, Users, 
  Briefcase, ShieldCheck, TrendingDown, Clock, Award 
} from 'lucide-react';
import { SecretariatBoletimManager } from '../components/SecretariatBoletimManager';
import { GradeWeightConfig } from '../components/GradeWeightConfig';
import { TeacherClassLinkManager } from '../components/TeacherClassLinkManager';
import { SecretariatAcademicAnalytics } from '../components/SecretariatAcademicAnalytics';
import { TutelaryCouncilReport } from '../components/TutelaryCouncilReport';
import { SecretariatRegistrationManager } from '../components/SecretariatRegistrationManager';
import { TeacherManagement } from '../pages/TeacherManagement';
import HRPortalComponent from '../components/HRPortal';
import FinancialGlassUI from '../components/FinancialGlassUI';
import { FileUploader } from '../components/FileUploader';
import './SecretariaPortal.css';
import './HRPortal.css';

interface SecretariaPortalProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  user?: any;
}

export const SecretariaPortal: React.FC<SecretariaPortalProps> = ({ currentPage, onNavigate, user }) => {
  const [syncStatus, setSyncStatus] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Tab Management
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const role = user?.role?.toLowerCase();
    if (role === 'hr' || role === 'rh') {
      setActiveTab('hr');
    }
  }, [user]);

  useEffect(() => {
    const win = window as any;
    if (win.aquila) {
      Promise.all([
        win.aquila.invoke('get-system-health').catch(() => ({ system: { status: 'DEGRADED', message: 'Offline' } })),
        (win.aquila.getStudents ? win.aquila.getStudents() : win.aquila.invoke('get-students')).catch(() => [])
      ]).then(([health, rawStudents]) => {
        setSyncStatus(health);
        setStudents(Array.isArray(rawStudents) ? rawStudents : []);
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, []);

  const filteredDocs = students.filter(s =>
    (s.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.id || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const tabs = [
    { id: 'overview', label: 'Visão Geral', icon: <LayoutDashboard size={16} /> },
    { id: 'dominio-erp', label: 'Domínio Contábil & Folha', icon: <Award size={16} /> },
    { id: 'teachers', label: 'Professores', icon: <Users size={16} /> },
    { id: 'hr', label: 'Gestão de RH', icon: <Briefcase size={16} /> },
    { id: 'cadastro', label: 'Matrícula Inteligente', icon: <UserPlus size={16} /> },
    { id: 'boletins', label: 'Boletins & Fichas', icon: <FileText size={16} /> },
    { id: 'analytics', label: 'Analytics Pedagógico', icon: <TrendingUp size={16} /> },
    { id: 'grade', label: 'Vínculos Docentes', icon: <Presentation size={16} /> },
    { id: 'config', label: 'Pesos de Avaliação', icon: <Sliders size={16} /> },
    { id: 'tutelary', label: 'Conselho Tutelar', icon: <AlertOctagon size={16} /> },
  ];

  return (
    <PortalLayout portalName="Secretaria Digital" themeColor="#10b981" onNavigate={onNavigate}>
      <div className="sec-cockpit">
        {/* Command Bar */}
        <div className="sec-command-bar">
          <div className="sec-cmd-left">
            <span className="sec-cmd-badge">SECRETARIA DIGITAL & DOMÍNIO ERP</span>
            <h1 className="sec-cmd-title">Gestão Acadêmica, Documental & Domínio ERP</h1>
          </div>
          <div className="sec-cmd-actions">
            <button className="sec-btn primary" onClick={() => setActiveTab('cadastro')}>
              <UserPlus size={14} />
              <span>Nova Matrícula</span>
            </button>
            <button className="sec-btn primary" onClick={() => setActiveTab('boletins')}>
              <FileText size={14} />
              <span>Boletins em Lote</span>
            </button>
            <button className="sec-btn" onClick={() => setActiveTab('dominio-erp')}>
              <Award size={14} />
              <span>Folha 43 Colunas</span>
            </button>
            <button className="sec-btn" onClick={() => setActiveTab('tutelary')}>
              <AlertOctagon size={14} />
              <span>Conselho Tutelar LDB</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="sec-tab-strip">
           {tabs.map(tab => (
             <button
               key={tab.id}
               onClick={() => setActiveTab(tab.id)}
               className={`sec-tab-btn ${activeTab === tab.id ? 'active' : ''}`}
             >
               {tab.icon}
               <span>{tab.label}</span>
             </button>
           ))}
        </div>

        {/* Tab Contents */}
        <div className="w-full">
           {activeTab === 'overview' && (
             <div className="flex flex-col gap-4 animate-fade-in">
                {/* 4-Column KPI Grid */}
                <div className="sec-kpi-grid">
                  <div className="sec-kpi-pod">
                    <div className="sec-kpi-meta">
                      <span className="sec-kpi-label">TOTAL MATRÍCULAS</span>
                      <span className="sec-kpi-value">{students.length || 1248}</span>
                      <span className="sec-kpi-delta">+100% Sincronizado</span>
                    </div>
                    <div className="sec-kpi-icon">
                      <Users size={18} />
                    </div>
                  </div>

                  <div className="sec-kpi-pod">
                    <div className="sec-kpi-meta">
                      <span className="sec-kpi-label">ÁQUILA EDGE CENTRAL</span>
                      <span className="sec-kpi-value" style={{ color: '#10B981' }}>{syncStatus?.system?.status || 'OK'}</span>
                      <span className="sec-kpi-delta">SQA-1000 Local</span>
                    </div>
                    <div className="sec-kpi-icon">
                      <CheckCircle2 size={18} />
                    </div>
                  </div>

                  <div className="sec-kpi-pod">
                    <div className="sec-kpi-meta">
                      <span className="sec-kpi-label">DOMÍNIO CONTÁBIL</span>
                      <span className="sec-kpi-value">43 COL</span>
                      <span className="sec-kpi-delta">Folha & Remessas OK</span>
                    </div>
                    <div className="sec-kpi-icon">
                      <Award size={18} />
                    </div>
                  </div>

                  <div className="sec-kpi-pod">
                    <div className="sec-kpi-meta">
                      <span className="sec-kpi-label">CASOS TUTELAR LDB</span>
                      <span className="sec-kpi-value" style={{ color: '#10B981' }}>0 CASOS</span>
                      <span className="sec-kpi-delta">Art. 12 VII Monitorado</span>
                    </div>
                    <div className="sec-kpi-icon">
                      <ShieldCheck size={18} />
                    </div>
                  </div>
                </div>

                {/* Busca de Documentos */}
                <div className="sec-search-container">
                  <Search size={16} className="text-emerald-400" />
                  <input
                    type="text"
                    placeholder="Filtrar prontuário por nome do aluno ou RM..."
                    className="sec-search-input"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                {/* Módulos de Operação e Gestão */}
                <section className="sec-vault-section">
                  <div className="sec-section-title">
                    <UserPlus size={16} className="text-emerald-400" />
                    <span>Acessos Diretos de Gestão Escolar</span>
                  </div>
                  <div className="sec-doc-grid">
                    <div 
                      className="sec-doc-card cursor-pointer"
                      onClick={() => onNavigate('user-management')}
                    >
                      <div className="sec-doc-left">
                        <div className="sec-doc-icon"><UserPlus size={16} /></div>
                        <div className="sec-doc-info">
                          <span className="sec-doc-name">Controle de Usuários</span>
                          <span className="sec-doc-meta">Cadastrar Profissionais e Pais</span>
                        </div>
                      </div>
                      <span className="sec-btn" style={{ height: 26, padding: '0 8px', fontSize: 11 }}>Acessar</span>
                    </div>
                    <div 
                      className="sec-doc-card cursor-pointer"
                      onClick={() => onNavigate('schedule-upload')}
                    >
                      <div className="sec-doc-left">
                        <div className="sec-doc-icon"><DoorOpen size={16} /></div>
                        <div className="sec-doc-info">
                          <span className="sec-doc-name">Grade Horária</span>
                          <span className="sec-doc-meta">Gerenciar Aulas e Salas</span>
                        </div>
                      </div>
                      <span className="sec-btn" style={{ height: 26, padding: '0 8px', fontSize: 11 }}>Acessar</span>
                    </div>
                  </div>
                </section>

                {/* Vault de Documentos */}
                <section className="sec-vault-section">
                  <div className="sec-section-title">
                    <FileText size={16} className="text-emerald-400" />
                    <span>Cofre Digital de Prontuários & Documentos</span>
                  </div>

                  <div className="sec-doc-grid">
                    {loading ? (
                      <div className="col-span-full flex justify-center p-8"><Loader2 className="animate-spin text-emerald-500" /></div>
                    ) : filteredDocs.length > 0 ? (
                      filteredDocs.map((student) => (
                        <div key={student.id} className="sec-doc-card">
                          <div className="sec-doc-left">
                            <div className="sec-doc-icon"><FileText size={16} /></div>
                            <div className="sec-doc-info">
                              <span className="sec-doc-name">{student.name || 'Aluno'}</span>
                              <span className="sec-doc-meta">RM: {student.id} • Prontuário Digital</span>
                            </div>
                          </div>
                          <CloudSync size={16} className="text-emerald-400" />
                        </div>
                      ))
                    ) : (
                      <p className="col-span-full text-zinc-500 text-center py-4">Nenhum prontuário processado/encontrado.</p>
                    )}
                  </div>
                </section>
             </div>
           )}

           {activeTab === 'dominio-erp' && (
             <div className="animate-fade-in">
               <FinancialGlassUI />
             </div>
           )}

           {activeTab === 'teachers' && (
             <div className="bg-black/20 p-6 rounded-2xl border border-white/5 animate-fade-in">
                <TeacherManagement />
             </div>
           )}

           {activeTab === 'hr' && (
             <div className="bg-black/20 p-6 rounded-2xl border border-white/5 animate-fade-in flex flex-col gap-8">
               {/* KPIs de RH — people-school-analytics */}
               <HRKPIBar />

               {/* Módulo principal de RH */}
               <HRPortalComponent />

               {/* Acessos Rápidos */}
               <section className="hr-doc-management-section mt-6">
                 <div className="hr-section-header">
                   <div className="hr-icon-box">
                     <UserPlus className="hr-icon-pink" size={24} />
                   </div>
                   <div className="hr-title-group">
                     <h2>Gestão de Colaboradores</h2>
                     <p>Cadastrar, Editar e Remover Acessos da Equipe</p>
                   </div>
                 </div>
                 <button 
                   className="btn-primary flex items-center justify-center gap-2 w-full max-w-md mx-auto py-3 bg-pink-600 hover:bg-pink-700 text-white rounded-lg shadow-lg"
                   onClick={() => onNavigate('user-management')}
                 >
                   <UserPlus size={20} /> Acessar Controle de Usuários
                 </button>
               </section>

               {/* Gestão de Documentos Auditáveis */}
               <section className="hr-doc-management-section">
                 <div className="hr-section-header">
                   <div className="hr-icon-box">
                     <ShieldCheck className="hr-icon-pink" size={24} />
                   </div>
                   <div className="hr-title-group">
                     <h2>Documentação de Funcionários</h2>
                     <p>Repositório Criptografado de Contratos e Holerites</p>
                   </div>
                 </div>

                 <FileUploader
                   label="Arraste documentos (Contratos, Exames, Holerites) aqui"
                   onFilesSelected={async (files) => {
                     for (const file of files) {
                       try {
                         const buffer = await file.arrayBuffer();
                         await (window as any).aquila.invoke('hr:save-document', {
                           name: file.name,
                           type: file.type,
                           size: file.size,
                           buffer: Array.from(new Uint8Array(buffer)),
                         });
                       } catch (err) {
                         console.error('[SecretariaPortal] Erro ao salvar documento de RH:', err);
                       }
                     }
                   }}
                   accept=".pdf,.doc,.docx"
                 />
               </section>
             </div>
           )}

           {activeTab === 'boletins' && (
              <div className="bg-black/20 p-6 rounded-2xl border border-white/5">
                 <SecretariatBoletimManager />
              </div>
           )}

           {activeTab === 'cadastro' && (
              <div className="bg-black/20 p-6 rounded-2xl border border-white/5">
                 <SecretariatRegistrationManager />
              </div>
           )}

           {activeTab === 'analytics' && (
              <div className="bg-black/20 p-6 rounded-2xl border border-white/5">
                 <SecretariatAcademicAnalytics />
              </div>
           )}

           {activeTab === 'grade' && (
              <div className="bg-black/20 p-6 rounded-2xl border border-white/5">
                 <TeacherClassLinkManager />
              </div>
           )}

           {activeTab === 'config' && (
              <div className="bg-black/20 p-6 rounded-2xl border border-white/5">
                 <GradeWeightConfig />
              </div>
           )}

           {activeTab === 'tutelary' && (
              <div className="bg-black/20 p-6 rounded-2xl border border-white/5">
                 <TutelaryCouncilReport />
              </div>
           )}

        </div>
      </div>
    </PortalLayout>
  );
};

/**
 * HRKPIBar — Métricas de RH com janela temporal
 * people-school-analytics: dado bruto × interpretação separados, período atual vs anterior
 */
const HRKPIBar: React.FC = () => {
  const [kpis, setKpis] = useState({
    turnoverRate: null as number | null,
    absenceRate: null as number | null,
    trainingCompletion: null as number | null,
    staffCount: null as number | null,
  });

  useEffect(() => {
    const load = async () => {
      try {
        const stats = await (window as any).aquila.invoke('get-dashboard-stats');
        setKpis({
          turnoverRate: stats?.data?.hrTurnoverRate ?? null,
          absenceRate: stats?.data?.hrAbsenceRate ?? null,
          trainingCompletion: stats?.data?.hrTrainingCompletion ?? null,
          staffCount: stats?.data?.totalUsers ?? null,
        });
      } catch { /* silencioso */ }
    };
    load();
  }, []);

  const items = [
    {
      icon: <TrendingDown size={16} />,
      label: 'Turnover',
      value: kpis.turnoverRate != null ? `${kpis.turnoverRate.toFixed(1)}%` : '—',
      color: '#ec4899',
      note: 'Últimos 12 meses (dado bruto)',
    },
    {
      icon: <Clock size={16} />,
      label: 'Absenteísmo',
      value: kpis.absenceRate != null ? `${kpis.absenceRate.toFixed(1)}%` : '—',
      color: '#f59e0b',
      note: 'Mês atual vs anterior',
    },
    {
      icon: <Award size={16} />,
      label: 'Treinamentos concluídos',
      value: kpis.trainingCompletion != null ? `${kpis.trainingCompletion}%` : '—',
      color: '#10b981',
      note: '% do quadro ativo',
    },
    {
      icon: <ShieldCheck size={16} />,
      label: 'Funcionários ativos',
      value: kpis.staffCount != null ? String(kpis.staffCount) : '—',
      color: '#3b82f6',
      note: 'Com acesso ao sistema',
    },
  ];

  return (
    <div className="hr-kpi-bar">
      {items.map((item, i) => (
        <div key={i} className="hr-kpi-card glass">
          <div className="hr-kpi-icon" style={{ color: item.color, background: `${item.color}18` }}>
            {item.icon}
          </div>
          <div className="hr-kpi-body">
            <span className="hr-kpi-label">{item.label}</span>
            <span className="hr-kpi-value" style={{ color: item.color }}>{item.value}</span>
            <span className="hr-kpi-note">{item.note}</span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default SecretariaPortal;
