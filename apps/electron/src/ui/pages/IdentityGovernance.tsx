import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Activity, 
  RefreshCw, 
  UserCheck, 
  Zap, 
  AlertCircle,
  TrendingUp,
  Fingerprint
} from 'lucide-react';
import './IdentityGovernance.css';

interface IdentityHealth {
  studentId: string;
  health: number;
  lastUpdate: string;
  diversityAngles: string[];
  refinementCount: number;
  status: 'stable' | 'evolving' | 'drift_detected';
}

const IdentityGovernance: React.FC = () => {
  const [meshHealth, setMeshHealth] = useState<IdentityHealth[]>([]);
  const [totalRefinements, setTotalRefinements] = useState(145);
  const [isHealing, setIsHealing] = useState(false);

  useEffect(() => {
    const loadIdentityHealth = async () => {
      try {
        const stats = await (window as any).aquila.invoke('identity:get-stats');
        setTotalRefinements(stats.totalRefinements || 0);

        const realMeshHealth = await (window as any).aquila.invoke('identity:get-mesh-health');
        if (realMeshHealth && realMeshHealth.length > 0) {
          setMeshHealth(realMeshHealth);
        } else {
          setMeshHealth([]);
        }
      } catch (e) {
        console.error('Failed to load identity mesh health:', e);
      }
    };
    loadIdentityHealth();
  }, []);

  const runGlobalHeal = () => {
    setIsHealing(true);
    setTimeout(() => {
      setIsHealing(false);
      // Aqui em vez de incrementar mock, poderia chamar 'identity:force-heal' e depois loadIdentityHealth()
      setTotalRefinements(prev => prev + 1);
    }, 2000);
  };

  return (
    <div className="governance-container">
      <header className="gov-header">
        <div className="gov-title">
          <ShieldCheck className="icon-glow" size={32} />
          <div>
            <h1>Soberania Biométrica</h1>
            <p>Nível 14: Auto-Refinamento & Governança de Identidade</p>
          </div>
        </div>
        <div className="gov-stats-top">
          <div className="stat-card">
            <span className="label">Auto-Refinamentos</span>
            <span className="value">{totalRefinements}</span>
          </div>
          <button 
            className={`heal-button ${isHealing ? 'animating' : ''}`}
            onClick={runGlobalHeal}
          >
            <RefreshCw size={18} />
            {isHealing ? 'Curando Malha...' : 'Forçar Auto-Cura'}
          </button>
        </div>
      </header>

      <div className="gov-grid">
        <section className="mesh-health-panel">
          <h3>Saúde da Malha Biométrica (NPU-Mesh)</h3>
          <div className="health-chart-placeholder">
            <div className="bar-grid">
              {[85, 92, 78, 95, 88, 90, 94].map((v, i) => (
                <div key={i} className="bar-wrapper">
                  <div className="bar" style={{ height: `${v}%` }}></div>
                </div>
              ))}
            </div>
            <div className="chart-label">Estabilidade Biométrica Semanal</div>
          </div>
        </section>

        <section className="drift-monitor">
          <h3>Detecção de Deriva (Drift)</h3>
          <div className="drift-list">
            {meshHealth.filter(h => h.status !== 'stable').map(item => (
              <div key={item.studentId} className="drift-item">
                <div className="item-info">
                  <span className="id">{item.studentId}</span>
                  <span className={`status-pill ${item.status}`}>{item.status}</span>
                </div>
                <div className="progress-bg">
                  <div className="progress-fill" style={{ width: `${item.health * 100}%` }}></div>
                </div>
                <span className="health-val">{(item.health * 100).toFixed(0)}% Match Health</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="audit-ledger">
        <h3>Log de Governança de Identidade</h3>
        <table className="gov-table">
          <thead>
            <tr>
              <th>ID Aluno</th>
              <th>Ação</th>
              <th>Confiança</th>
              <th>Ângulos</th>
              <th>Data</th>
              <th>Resultado</th>
            </tr>
          </thead>
          <tbody>
            {meshHealth.map(h => (
              <tr key={h.studentId}>
                <td>{h.studentId}</td>
                <td><Zap size={14} /> Auto-Refine</td>
                <td>{(h.health * 100).toFixed(1)}%</td>
                <td>
                  <div className="angle-chips">
                    {h.diversityAngles.map(a => <span key={a} className="chip">{a}</span>)}
                  </div>
                </td>
                <td>{h.lastUpdate}</td>
                <td><span className="tag-success">Aplicado</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
};

export default IdentityGovernance;
