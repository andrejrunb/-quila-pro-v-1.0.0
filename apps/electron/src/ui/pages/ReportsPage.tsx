import React, { useState, useEffect, useRef } from 'react';
import useIPC from '../hooks/useIPC';
import './ReportsPage.css';

interface AttendanceStats {
  date: string;
  totalStudents: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  attendanceRate: number;
}

interface StudentAttendance {
  studentId: string;
  studentName: string;
  presentDays: number;
  absentDays: number;
  lateDays: number;
  attendanceRate: number;
}

/**
 * Passo 8: Página de Relatórios com Gráficos
 * Exibe análises de presença, tendências e estatísticas
 */
interface ReportsPageProps {
  onBack: () => void;
}

export const ReportsPage: React.FC<ReportsPageProps> = ({ onBack }) => {
  const [startDate, setStartDate] = useState<string>(
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [reportType, setReportType] = useState<'summary' | 'detailed' | 'trends'>('summary');
  const [stats, setStats] = useState<AttendanceStats[]>([]);
  const [studentAttendance, setStudentAttendance] = useState<StudentAttendance[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { invoke } = useIPC();

  // Carregar relatório ao mudar datas
  useEffect(() => {
    loadReport();
  }, [startDate, endDate, reportType]);

  /**
   * Carregar relatório
   */
  const loadReport = async () => {
    try {
      setIsLoading(true);
      const result = await invoke('reports:attendance', {
        startDate,
        endDate,
        type: reportType,
      });

      if (result.success && result.data) {
        setStats(result.data.stats || []);
        setStudentAttendance(result.data.students || []);
      }
    } catch (error) {
      console.error('Erro ao carregar relatório:', error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Exportar para PDF
   */
  const handleExportPDF = async () => {
    try {
      const result = await invoke('reports:export-pdf', {
        startDate,
        endDate,
        type: reportType,
        stats,
        students: studentAttendance,
      });

      if (result.success) {
        console.log('PDF exportado:', result.data.path);
      }
    } catch (error) {
      console.error('Erro ao exportar PDF:', error);
    }
  };

  /**
   * Exportar para Excel
   */
  const handleExportExcel = async () => {
    try {
      const result = await invoke('reports:export-excel', {
        startDate,
        endDate,
        type: reportType,
        stats,
        students: studentAttendance,
      });

      if (result.success) {
        console.log('Excel exportado:', result.data.path);
      }
    } catch (error) {
      console.error('Erro ao exportar Excel:', error);
    }
  };

  /**
   * Calcular média de presença
   */
  const getAverageAttendance = (): number => {
    if (stats.length === 0) return 0;
    const total = stats.reduce((sum, s) => sum + s.attendanceRate, 0);
    return Math.round(total / stats.length);
  };

  /**
   * Calcular total de alunos
   */
  const getTotalStudents = (): number => {
    if (stats.length === 0) return 0;
    return stats[0]?.totalStudents || 0;
  };

  return (
    <div className="reports-page">
      {/* Header */}
      <div className="reports-header">
        <button onClick={onBack} className="back-btn">
          ← Voltar
        </button>
        <h1>📊 Relatórios de Presença</h1>
        <p>Análise detalhada de presença e frequência dos alunos</p>
      </div>

      {/* Filtros */}
      <div className="reports-filters">
        <div className="filter-group">
          <label>Data Inicial</label>
          <input
            type="date"
            title="Data Inicial"
            aria-label="Data Inicial"
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
          />
        </div>

        <div className="filter-group">
          <label>Data Final</label>
          <input
            type="date"
            title="Data Final"
            aria-label="Data Final"
            value={endDate}
            onChange={e => setEndDate(e.target.value)}
          />
        </div>

        <div className="filter-group">
          <label>Tipo de Relatório</label>
          <select
            title="Tipo de Relatório"
            aria-label="Tipo de Relatório"
            value={reportType}
            onChange={e => setReportType(e.target.value as any)}
          >
            <option value="summary">Resumo</option>
            <option value="detailed">Detalhado</option>
            <option value="trends">Tendências</option>
          </select>
        </div>

        <div className="filter-actions">
          <button onClick={handleExportPDF} className="btn btn-primary">
            📄 Exportar PDF
          </button>
          <button onClick={handleExportExcel} className="btn btn-secondary">
            📊 Exportar Excel
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="loading">Carregando relatório...</div>
      ) : (
        <div className="reports-content">
          {/* KPIs */}
          <div className="kpis">
            <div className="kpi-card">
              <div className="kpi-value">{getTotalStudents()}</div>
              <div className="kpi-label">Total de Alunos</div>
            </div>
            <div className="kpi-card">
              <div className="kpi-value">{getAverageAttendance()}%</div>
              <div className="kpi-label">Taxa Média de Presença</div>
            </div>
            <div className="kpi-card">
              <div className="kpi-value">{stats.length}</div>
              <div className="kpi-label">Dias Monitorados</div>
            </div>
            <div className="kpi-card">
              <div className="kpi-value">
                {stats.reduce((sum, s) => sum + s.absentCount, 0)}
              </div>
              <div className="kpi-label">Total de Ausências</div>
            </div>
          </div>

          {/* Gráfico de Tendência */}
          <div className="chart-container">
            <h2>Tendência de Presença</h2>
            <div className="chart">
              <div className="chart-placeholder">
                <p>Gráfico de linha mostrando tendência de presença ao longo do período</p>
                {stats.length > 0 && (
                  <div className="mini-chart">
                    {stats.map((stat, idx) => (
                      <ChartBar 
                        key={idx} 
                        rate={stat.attendanceRate} 
                        label={`${stat.date}: ${stat.attendanceRate}%`}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Tabela de Presença por Aluno */}
          <div className="table-container">
            <h2>Presença por Aluno</h2>
            {studentAttendance.length === 0 ? (
              <p className="empty">Nenhum dado disponível</p>
            ) : (
              <table className="attendance-table">
                <thead>
                  <tr>
                    <th>Aluno</th>
                    <th>Presente</th>
                    <th>Ausente</th>
                    <th>Atrasado</th>
                    <th>Taxa de Presença</th>
                  </tr>
                </thead>
                <tbody>
                  {studentAttendance.map(student => (
                    <tr key={student.studentId}>
                      <td className="student-name">{student.studentName}</td>
                      <td className="present">{student.presentDays}</td>
                      <td className="absent">{student.absentDays}</td>
                      <td className="late">{student.lateDays}</td>
                      <td>
                        <AttendanceProgress rate={student.attendanceRate} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Resumo Diário */}
          <div className="daily-summary">
            <h2>Resumo Diário</h2>
            {stats.length === 0 ? (
              <p className="empty">Nenhum dado disponível</p>
            ) : (
              <div className="summary-cards">
                {stats.map((stat, idx) => (
                  <div key={idx} className="summary-card">
                    <div className="date">{stat.date}</div>
                    <div className="stats">
                      <div className="stat-item">
                        <span className="label">Presente</span>
                        <span className="value present">{stat.presentCount}</span>
                      </div>
                      <div className="stat-item">
                        <span className="label">Ausente</span>
                        <span className="value absent">{stat.absentCount}</span>
                      </div>
                      <div className="stat-item">
                        <span className="label">Atrasado</span>
                        <span className="value late">{stat.lateCount}</span>
                      </div>
                    </div>
                    <div className="attendance-rate">
                      {stat.attendanceRate}%
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const ChartBar: React.FC<{ rate: number; label: string }> = ({ rate, label }) => {
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (barRef.current) {
      barRef.current.style.setProperty('--rate', `${rate}%`);
      const color = rate > 80 ? '#4caf50' : rate > 60 ? '#ff9800' : '#f44336';
      barRef.current.style.setProperty('--rate-color', color);
    }
  }, [rate]);

  return <div ref={barRef} className="chart-bar" title={label} />;
};

const AttendanceProgress: React.FC<{ rate: number }> = ({ rate }) => {
  const fillRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (fillRef.current) {
      fillRef.current.style.setProperty('--rate', `${rate}%`);
      const color = rate > 80 ? '#4caf50' : rate > 60 ? '#ff9800' : '#f44336';
      fillRef.current.style.setProperty('--rate-color', color);
    }
  }, [rate]);

  return (
    <div className="progress-bar-container">
      <div ref={fillRef} className="progress-fill" />
      <span className="percentage-label">
        {rate}%
      </span>
    </div>
  );
};

export default ReportsPage;
