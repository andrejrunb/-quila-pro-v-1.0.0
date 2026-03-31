import React, { useState, useEffect } from 'react';
import useIPC from '../hooks/useIPC';
import './Reports.css';

interface ReportFilter {
  periodId: string;
  classId: string;
  format: 'pdf' | 'excel';
}

/**
 * Página de Relatórios com gráficos e estatísticas
 */
export const Reports: React.FC = () => {
  const ipc = useIPC();
  const [filter, setFilter] = useState<ReportFilter>({
    periodId: '',
    classId: '',
    format: 'pdf',
  });
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<any>(null);

  // Carregar relatórios ao montar
  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      setLoading(true);
      setError(null);
      // Simular carregamento de relatórios
      setReports([
        {
          id: 'report-1',
          title: 'Presença - Turma 101',
          date: new Date(),
          type: 'attendance',
          size: 1024000,
        },
        {
          id: 'report-2',
          title: 'Comportamento - Aluno 001',
          date: new Date(Date.now() - 86400000),
          type: 'behavior',
          size: 512000,
        },
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar relatórios');
    } finally {
      setLoading(false);
    }
  };

  const generateReport = async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await ipc.generateAttendanceReport(
        filter.periodId,
        filter.classId,
        filter.format
      );

      if (result.success) {
        await loadReports();
        setFilter({ periodId: '', classId: '', format: 'pdf' });
      } else {
        setError(result.error || 'Erro ao gerar relatório');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao gerar relatório');
    } finally {
      setLoading(false);
    }
  };

  const deleteReport = async (reportId: string) => {
    try {
      setReports(reports.filter(r => r.id !== reportId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao deletar relatório');
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="reports-page">
      <div className="reports-header">
        <h1>Relatórios</h1>
        <p>Gere e gerencie relatórios de presença e comportamento</p>
      </div>

      <div className="reports-container">
        {/* Seção de Geração */}
        <div className="reports-section">
          <h2>Gerar Novo Relatório</h2>

          <div className="form-group">
            <label>Período</label>
            <input
              type="text"
              placeholder="ID do período"
              value={filter.periodId}
              onChange={(e) => setFilter({ ...filter, periodId: e.target.value })}
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label>Turma</label>
            <input
              type="text"
              placeholder="ID da turma"
              value={filter.classId}
              onChange={(e) => setFilter({ ...filter, classId: e.target.value })}
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label>Formato</label>
            <select
              value={filter.format}
              onChange={(e) => setFilter({ ...filter, format: e.target.value as 'pdf' | 'excel' })}
              disabled={loading}
            >
              <option value="pdf">PDF</option>
              <option value="excel">Excel</option>
            </select>
          </div>

          <button
            className="btn btn-primary"
            onClick={generateReport}
            disabled={loading || !filter.periodId || !filter.classId}
          >
            {loading ? 'Gerando...' : 'Gerar Relatório'}
          </button>

          {error && <div className="error-message">{error}</div>}
        </div>

        {/* Seção de Relatórios */}
        <div className="reports-section">
          <h2>Relatórios Gerados</h2>

          {reports.length === 0 ? (
            <div className="empty-state">
              <p>Nenhum relatório gerado ainda</p>
            </div>
          ) : (
            <div className="reports-list">
              {reports.map((report) => (
                <div key={report.id} className="report-item">
                  <div className="report-info">
                    <h3>{report.title}</h3>
                    <div className="report-meta">
                      <span className="meta-item">
                        Data: {new Date(report.date).toLocaleDateString()}
                      </span>
                      <span className="meta-item">Tamanho: {formatBytes(report.size)}</span>
                      <span className="meta-item">Tipo: {report.type}</span>
                    </div>
                  </div>
                  <div className="report-actions">
                    <button className="btn btn-small btn-secondary">Baixar</button>
                    <button
                      className="btn btn-small btn-danger"
                      onClick={() => deleteReport(report.id)}
                    >
                      Deletar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Seção de Estatísticas */}
        <div className="reports-section">
          <h2>Estatísticas</h2>

          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-value">24</div>
              <div className="stat-label">Relatórios Gerados</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">156 MB</div>
              <div className="stat-label">Espaço Total</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">12</div>
              <div className="stat-label">Este Mês</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">95%</div>
              <div className="stat-label">Presença Média</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
