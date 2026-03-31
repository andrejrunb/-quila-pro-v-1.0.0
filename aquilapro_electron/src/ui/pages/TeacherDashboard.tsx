import React from 'react';
import { EnvironmentalHUD } from '../components/EnvironmentalHUD';
import { neuroPedagogyService, StudentFocus } from '../../services/NeuroPedagogyService';
import { useWSNotifications } from '../hooks/useWSNotifications';
import './TeacherDashboard.css';

/**
 * TeacherDashboard Refined (v5.150)
 * High-fidelity neuro-pedagogical command center.
 * Zero-Debt / Pure Vanilla CSS / Sovereign Design.
 */
const MetricBar: React.FC<{ label: string; value: number; type: 'fatigue' | 'engagement' }> = ({ label, value, type }) => {
  const barRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (barRef.current) {
      if (type === 'fatigue') {
        barRef.current.style.setProperty('--fatigue-width', `${value}%`);
      } else {
        barRef.current.style.setProperty('--engagement-width', `${value}%`);
      }
    }
  }, [value, type]);

  return (
    <div className="custom-metric">
      <div className="metric-header">
        <span>{label}</span>
        <span className={type === 'fatigue' ? 'text-fatigue' : 'text-engagement'}>{value.toFixed(0)}%</span>
      </div>
      <div className="bar-bg">
        <div ref={barRef} className={`bar-fill bg-${type}`}></div>
      </div>
    </div>
  );
};

const TeacherDashboard: React.FC = () => {
  const [pulse, setPulse] = React.useState(neuroPedagogyService.getClassNeuroPulse('class-01'));
  const [students, setStudents] = React.useState(neuroPedagogyService.getIndividualStudentFocus());
  const trends = neuroPedagogyService.getHistoricalNeuroTrends();
  const recommendation = neuroPedagogyService.getRecommendation(pulse);

  // WebSocket Integration (Phase v3430)
  const { isConnected, lastMessage } = useWSNotifications();

  React.useEffect(() => {
    if (lastMessage && (lastMessage.type === 'face_recognition' || lastMessage.type === 'presence')) {
      const data = lastMessage.data;
      
      // Update specific student if recognized
      if (data.studentId) {
        setStudents(prev => prev.map(s => {
          if (s.id === data.studentId || s.name === data.studentName) {
            return {
              ...s,
              focus: data.confidence || 0.95,
              status: 'OPTIMAL'
            };
          }
          return s;
        }));
      }

      // Refresh aggregate pulse
      setPulse(neuroPedagogyService.getClassNeuroPulse('class-01'));
    }
  }, [lastMessage]);

  // Periodic drift simulation (keeps organic feel)
  React.useEffect(() => {
    const timer = setInterval(() => {
      setStudents(prev => prev.map(s => ({
        ...s,
        focus: Math.max(0.1, s.focus - (Math.random() * 0.05))
      })));
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  // Generate SVG path for the trend chart
  const generateTrendPath = () => {
    if (trends.length === 0) return '';
    const points = trends.map((t, i) => `${i * 4},${40 - (t.focusScore * 40)}`).join(' L ');
    return `M 0,${40 - (trends[0].focusScore * 40)} L ${points}`;
  };

  return (
    <div className="teacher-dashboard animate-fade-in">
      <header className="dashboard-header">
        <div className="title-block">
          <h1>
            CÓRTEX DOCENTE <span>v5.5</span>
          </h1>
          <p className="subtitle-raw">
            Sovereign Pedagogical Interface — 
            <span className={isConnected ? 'status-online' : 'status-offline'}>
              {isConnected ? ' STREAM AO VIVO ATIVO' : ' OFFLINE (RECONECTANDO)'}
            </span>
          </p>
        </div>

        <div className="neuro-pulse-main">
           <div className="pulse-container">
              <div className="pulse-beat"></div>
              <div className="pulse-badge">
                {(pulse.focusScore * 100).toFixed(0)}<span>%</span>
              </div>
           </div>
           <div className="divider-v"></div>
           <div className="trend-preview">
              <label>Tendência (30m)</label>
              <svg width="120" height="40" className="trend-chart">
                <path d={generateTrendPath()} fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" />
              </svg>
           </div>
           <div className="recommendation">
              <span className="recommendation-badge">
                {recommendation === 'OPTIMAL_FLOW' ? 'FLUXO OTIMIZADO' : 
                 recommendation === 'NEURO_DRIFT' ? 'DERIVA NEURAL' : 
                 recommendation === 'COGNITIVE_OVERLOAD' ? 'SOBRECARGA COGNITIVA' : 
                 recommendation.replace(/_/g, ' ')}
              </span>
           </div>
        </div>
      </header>

      <div className="dashboard-grid">
        {/* Main Classroom Neuro-Map */}
        <section className="neuro-map-card">
           <h3 className="section-label">Neuro-Mapa Coletivo (Real-Time)</h3>
           <div className="neuro-bubbles-grid">
              {students.map(s => (
                <div key={s.id} className="student-bubble group" title={`${s.name}: ${s.status}`}>
                  <div className={`bubble-glow ${
                    s.status === 'DRIFTING' ? 'status-drifting' : 
                    s.status === 'OVERLOADED' ? 'status-overloaded' : 
                    'status-optimal'
                  }`}></div>
                  <div className={`bubble-main ${
                    s.status === 'DRIFTING' ? 'status-drifting-border' : 
                    s.status === 'OVERLOADED' ? 'status-overloaded-border' : 
                    'status-optimal-border'
                  }`}>
                    <span>{(s.focus * 100).toFixed(0)}%</span>
                  </div>
                  <span className="student-name">{s.name}</span>
                </div>
              ))}
           </div>
           
           <div className="status-sync-bar">
              <span className="sync-text">Sincronia Pedagógica High-Fidelity Ativa</span>
              <button 
                className="btn-dynamic-reinforce"
                onClick={() => alert('Sinal de reforço dinâmico enviado via IoT (Painel de Sala).')}
              >
                Reforçar Dinâmica
              </button>
           </div>
        </section>

        {/* Sidebar Analytics */}
        <aside className="sidebar-analytics">
        <EnvironmentalHUD roomId="class-01" />
        
            <div className="stat-card">
               <h4 className="stat-card-title">Métricas de Carga Cognitiva</h4>
              <div className="metric-group">
                 <MetricBar label="FADIGA COGNITIVA" value={pulse.fatigueIndex * 100} type="fatigue" />
                 <MetricBar label="ENGAJAMENTO COLETIVO" value={pulse.collectiveEngagement * 100} type="engagement" />
              </div>
           </div>

           <div className="ai-ai-card">
              <h4 className="ai-card-title">Sustentação I.A Oraculum</h4>
              <p className="ai-report-text">
                Detectado declínio na atenção do quadrante 4. A I.A sugere uma transição rítmica ou aplicação de "Quick Logic Challenge" para resetar o loop de fadiga.
              </p>
           </div>

           <div className="stat-card legend-card">
              <h4 className="stat-card-title">Legenda de Estados</h4>
              <div className="legend-items">
                <div className="legend-item">
                   <div className="legend-dot dot-optimal"></div> OPTIMAL
                </div>
                <div className="legend-item">
                   <div className="legend-dot dot-drifting"></div> DRIFTING
                </div>
                <div className="legend-item">
                   <div className="legend-dot dot-overload"></div> OVERLOAD
                </div>
              </div>
           </div>
        </aside>
      </div>
    </div>
  );
};

export default TeacherDashboard;
