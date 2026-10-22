import React from 'react';
import { PortalLayout } from '../layouts/PortalLayout';
import HRPortalComponent from '../components/HRPortal';
import { FileUploader } from '../components/FileUploader';
import { ShieldCheck, TrendingDown, Clock, Award, UserPlus } from 'lucide-react';
import './HRPortal.css';

interface HRPortalProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

/**
 * HRPortal — Persona: RH
 * Tarefas: gerir contratos, monitorar turnover/absenteísmo, acompanhar treinamentos.
 * Skills aplicadas: people-school-analytics (métricas de RH), avoid-erp-pitfalls (sem mock)
 */
export const HRPortal: React.FC<HRPortalProps> = ({ currentPage, onNavigate }) => {
  const renderHRPage = () => {
    switch (currentPage) {
      case 'hr':
      case 'dashboard':
      default:
        return (
          <div className="page-root max-container flex flex-col gap-3">
            {/* Command Bar */}
            <div className="hr-command-bar">
              <div className="hr-cmd-left">
                <span className="hr-cmd-badge">PORTAL DE RH & GESTÃO DE PESSOAS</span>
                <h1 className="hr-cmd-title">Gestão de Talentos, Ponto Biométrico & Folha Docente</h1>
              </div>
              <div className="hr-cmd-actions">
                <button className="hr-btn primary" onClick={() => onNavigate('user-management')}>
                  <UserPlus size={14} />
                  <span>Novo Colaborador</span>
                </button>
                <button className="hr-btn" onClick={() => onNavigate('schedule-upload')}>
                  <Clock size={14} />
                  <span>Carga Horária</span>
                </button>
                <button className="hr-btn" onClick={() => onNavigate('reports-hub')}>
                  <Award size={14} />
                  <span>Relatórios RH</span>
                </button>
              </div>
            </div>
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
                  // Persiste via IPC — não apenas console.log
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
                      console.error('[HRPortal] Erro ao salvar documento:', err);
                    }
                  }
                }}
                accept=".pdf,.doc,.docx"
              />
            </section>
          </div>
        );
    }
  };

  return (
    <PortalLayout portalName="Gestão de Talentos & RH" themeColor="#ec4899">
      {renderHRPage()}
    </PortalLayout>
  );
};

/**
 * HRKPIBar — Métricas de RH com janela temporal
 * people-school-analytics: dado bruto × interpretação separados, período atual vs anterior
 */
const HRKPIBar: React.FC = () => {
  const [kpis, setKpis] = React.useState({
    turnoverRate: null as number | null,
    absenceRate: null as number | null,
    trainingCompletion: null as number | null,
    staffCount: null as number | null,
  });

  React.useEffect(() => {
    const load = async () => {
      try {
        // Consulta stats gerais — campos de RH serão expandidos com HRService
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

export default HRPortal;
