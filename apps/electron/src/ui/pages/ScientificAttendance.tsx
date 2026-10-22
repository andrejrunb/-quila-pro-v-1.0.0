import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Camera, 
  Smartphone, 
  UserCheck, 
  AlertOctagon,
  Search,
  Filter,
  BarChart3
} from 'lucide-react';
import './ScientificAttendance.css';

interface AttendanceAudit {
  id: number;
  studentId: string;
  name: string;
  visionVerified: boolean;
  geoVerified: boolean;
  manualStatus: boolean;
  confidence: number;
  discrepancy: boolean;
}

export const ScientificAttendance: React.FC = () => {
  const [auditData, setAuditData] = useState<AttendanceAudit[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  const [stats, setStats] = useState({ totalAudited: 0, irregularitiesDetected: 0 });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const history = await window.aquila.attendance.getAuditHistory();
        const auditStats = await window.aquila.attendance.getAuditStats();
        
        const mappedData: AttendanceAudit[] = history.map((item: any) => ({
          studentId: item.studentId,
          name: item.studentName || 'Desconhecido',
          visionVerified: item.facialDetected,
          geoVerified: item.sensorDetected,
          manualStatus: item.manualStatus,
          confidence: item.confidence,
          discrepancy: !item.isMatch
        }));

        setAuditData(mappedData);
        setStats(auditStats);
      } catch (error) {
        console.error('Erro ao buscar dados de auditoria:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    
    // Opcional: Atualizar a cada 30 segundos
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleRemediate = async (auditId: number, studentId: string, currentManual: boolean) => {
    try {
      const success = await window.aquila.attendance.remediate(auditId, studentId, !currentManual);
      if (success) {
        // Refresh data
        const history = await window.aquila.attendance.getAuditHistory();
        const auditStats = await window.aquila.attendance.getAuditStats();
        
        const mappedData: AttendanceAudit[] = history.map((item: any) => ({
          id: item.id,
          studentId: item.studentId,
          name: item.studentName || 'Desconhecido',
          visionVerified: item.facialDetected,
          geoVerified: item.sensorDetected,
          manualStatus: item.manualStatus,
          confidence: item.confidence,
          discrepancy: !item.isMatch
        }));

        setAuditData(mappedData);
        setStats(auditStats);
      }
    } catch (error) {
      console.error('Erro ao remediar:', error);
    }
  };

  const filteredData = auditData.filter(item => {
    if (filter === 'discrepancy') return item.discrepancy;
    return true;
  });

  return (
    <div className="scientific-container">
      <header className="scientific-header">
        <div className="title-group">
          <div className="badge-sovereign">AUDITORIA CIENTÍFICA v1.6.0</div>
          <h1>Soberania da Presença</h1>
          <p>Cruzamento triplo de evidências: Biometria, Dispositivo e Lançamento Manual.</p>
        </div>
        
        <div className="header-stats">
          <div className="stat-pill">
            <ShieldCheck size={16} /> {stats.totalAudited} Registros Auditados
          </div>
          {stats.irregularitiesDetected > 0 && (
            <div className="stat-pill warning">
              <AlertOctagon size={16} /> {stats.irregularitiesDetected} Discrepâncias Detectadas
            </div>
          )}
        </div>
      </header>

      <section className="audit-controls">
        <div className="search-bar">
          <Search size={18} />
          <input type="text" placeholder="Buscar aluno ou ID..." />
        </div>
        
        <div className="filter-group">
          <button className={filter === 'all' ? 'active' : ''} onClick={() => setFilter('all')}>Todos</button>
          <button className={filter === 'discrepancy' ? 'active' : ''} onClick={() => setFilter('discrepancy')}>Discrepâncias</button>
        </div>
      </section>

      <main className="audit-grid">
        <div className="audit-table-header">
          <div>ALUNO</div>
          <div>VISÃO (FACE)</div>
          <div>DISPOSITIVO (GEO)</div>
          <div>MANUAL</div>
          <div>CONFIANÇA</div>
          <div>AÇÃO</div>
        </div>

        {loading ? (
          <div className="loading-state">Sincronizando evidências do Grafo Soberano...</div>
        ) : (
          filteredData.map(item => (
            <div key={item.studentId} className={`audit-row ${item.discrepancy ? 'has-discrepancy' : ''}`}>
              <div className="student-info">
                <div className="avatar-mini">{item.name.charAt(0)}</div>
                <div className="name-box">
                  <span className="student-name">{item.name}</span>
                  <span className="student-id">#{item.studentId}</span>
                </div>
              </div>

              <div className="status-col">
                <div className={`status-indicator ${item.visionVerified ? 'success' : 'fail'}`}>
                  <Camera size={14} /> {item.visionVerified ? 'Detectado' : 'Ausente'}
                </div>
              </div>

              <div className="status-col">
                <div className={`status-indicator ${item.geoVerified ? 'success' : 'fail'}`}>
                  <Smartphone size={14} /> {item.geoVerified ? 'No Perímetro' : 'Ausente'}
                </div>
              </div>

              <div className="status-col">
                <div className={`status-indicator ${item.manualStatus ? 'success' : 'fail'}`}>
                  <UserCheck size={14} /> {item.manualStatus ? 'Presente' : 'Falta'}
                </div>
              </div>

              <div className="confidence-col">
                <div className="progress-mini">
                  <div className="fill" style={{ width: `${item.confidence * 100}%` }}></div>
                </div>
                <span>{(item.confidence * 100).toFixed(0)}%</span>
              </div>

              <div className="action-col">
                {item.discrepancy ? (
                  <button 
                    className="btn-investigate" 
                    onClick={() => handleRemediate(item.id, item.studentId, item.manualStatus)}
                  >
                    <AlertOctagon size={14} /> Investigar
                  </button>
                ) : (
                  <button className="btn-view">Ver Logs</button>
                )}
              </div>
            </div>
          ))
        )}
      </main>

      <footer className="scientific-footer">
        <div className="footer-info">
          <BarChart3 size={16} /> Insights baseados no Ledger de Auditoria Crucial.
        </div>
        <button className="btn-export">Exportar Relatório Científico (PDF)</button>
      </footer>
    </div>
  );
};

export default ScientificAttendance;
