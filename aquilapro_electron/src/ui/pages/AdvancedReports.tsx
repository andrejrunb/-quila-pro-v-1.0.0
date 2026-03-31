import React, { useState, useEffect } from 'react';
import { Trophy, TrendingUp, TrendingDown, Users, AlertTriangle, FileBarChart } from 'lucide-react';
import './AdvancedReports.css';

/**
 * AdvancedReports.tsx — Passo 46 do Roadmap.
 * Painel de Rankings e Analíticos de Comportamento.
 */
export const AdvancedReports: React.FC = () => {
  const [rankings, setRankings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const aquila = (window as any).aquila;

  useEffect(() => {
    loadRankings();
  }, []);

  const loadRankings = async () => {
    try {
      const data = await aquila.invoke('get-student-rankings');
      setRankings(data || []);
    } catch (err) {
      console.error('Erro ao carregar rankings:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="advanced-reports-page text-center py-20">
         <p className="text-dim uppercase font-black tracking-widest text-xs">Processando Rankings Áquila...</p>
      </div>
    );
  }

  return (
    <div className="advanced-reports-page">
      <header className="reports-header">
        <div className="header-title-group">
          <h1 className="page-title">
            <Trophy className="text-yellow-500" size={40} />
            Hall da Fama & Analíticos
          </h1>
          <p className="page-subtitle">Rankings de assiduidade e insights comportamentais bimestrais</p>
        </div>
        <button className="btn-export-pdf" aria-label="Exportar PDF Completo">
          <FileBarChart className="text-blue-400" size={18} />
          <span className="export-text">Exportar PDF Completo</span>
        </button>
      </header>

      <div className="reports-grid">
        {/* Assiduity Ranking */}
        <section className="ranking-section">
          <h2 className="section-title">
            <TrendingUp className="text-emerald-400" /> Top 10 Alunos (Assiduidade)
          </h2>
          
          <div className="rankings-list">
            {rankings.map((std, i) => (
              <div key={std.id || i} className="ranking-item">
                <div className="student-info-group">
                    <div className={`rank-badge ${i < 3 ? 'rank-top' : ''}`}>
                        #{i + 1}
                    </div>
                    <div>
                        <p className="student-name">{std.name}</p>
                        <p className="passage-count-label">{std.presenceCount} Presenças registradas</p>
                    </div>
                </div>
                <div className="frequency-group">
                    <p className="frequency-value">{Math.round(100 - (std.percAbsence || 0))}%</p>
                    <p className="frequency-label">FREQÜÊNCIA</p>
                </div>
              </div>
            ))}
            {rankings.length === 0 && <p className="text-center py-10 text-slate-600">Nenhum dado de ranking disponível.</p>}
          </div>
        </section>

        {/* Sidebar Reports */}
        <aside className="sidebar-reports">
            <div className="risk-card">
                <h2 className="section-title">
                    <TrendingDown className="text-pink-500" /> Risco de Evasão
                </h2>
                <div className="risk-alert-box">
                    <div className="alert-header">
                        <AlertTriangle className="text-pink-500" />
                        <span className="alert-tag">Atenção Crítica</span>
                    </div>
                    <p className="alert-summary">
                        4 alunos atingiram o limite de 20% de faltas nesta semana. Recomenda-se envio do Relatório de Briefing.
                    </p>
                </div>
                <button className="btn-risk-details" aria-label="Ver Alunos em Risco">
                    Ver Alunos em Risco
                </button>
            </div>

            <div className="briefing-card">
                <Users className="briefing-icon-bg" />
                <h2 className="section-title">Briefing de Turmas</h2>
                <p>
                   A turma <strong>3º Ano A</strong> apresenta o maior índice de assiduidade global (94%).
                </p>
                <div className="briefing-stats-row">
                    <div className="stat-mini-card">
                        <p className="mini-stat-value text-indigo">94%</p>
                        <p className="mini-stat-label">Média Global</p>
                    </div>
                    <div className="stat-mini-card">
                        <p className="mini-stat-value text-emerald">0%</p>
                        <p className="mini-stat-label">Atrasos</p>
                    </div>
                </div>
            </div>
        </aside>
      </div>
    </div>
  );
};

export default AdvancedReports;
