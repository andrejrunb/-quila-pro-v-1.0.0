import React, { useState, useEffect } from 'react';
import { EnvironmentalHUD } from '../components/EnvironmentalHUD';
import { AITeacherLog } from '../components/AITeacherLog';
import { useWSNotifications } from '../hooks/useWSNotifications';
import { SeatingChart } from '../components/SeatingChart';
import { BoardScanner } from '../components/BoardScanner';
import { LogoffModal } from '../components/LogoffModal';
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
  const [pulse, setPulse] = useState<any>({ focusScore: 0, fatigueIndex: 0, collectiveEngagement: 0 });
  const [students, setStudents] = useState<any[]>([]);
  const [trends, setTrends] = useState<any[]>([]);
  const [recommendation, setRecommendation] = useState('MAINTAIN_FLOW');
  const [showAILog, setShowAILog] = useState(false);
  const [showLogoffModal, setShowLogoffModal] = useState(false);
  const [timeLeft, setTimeLeft] = useState(3000); // 50 minutos
  const [showPendingAlert, setShowPendingAlert] = useState(false);
  const [vistosConcluidos, setVistosConcluidos] = useState(false);

  // Timer Lifecycle
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 0) {
          clearInterval(timer);
          return 0;
        }
        
        // Trigger alerta nos 5 minutos (300 segundos)
        if (prev === 301 && !vistosConcluidos) {
          setShowPendingAlert(true);
        }
        
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [vistosConcluidos]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleLogout = () => {
    setShowLogoffModal(true);
  };

  const confirmLogout = () => {
    window.aquila.invoke('logout-session');
  };

  useEffect(() => {
    // Carga inicial
    window.aquila.getNeuroPulse('class-01').then(setPulse);
    window.aquila.getIndividualStudentFocus().then(setStudents);
    window.aquila.getNeuroTrends().then(setTrends);
  }, []);

  useEffect(() => {
    window.aquila.getNeuroRecommendation(pulse).then(setRecommendation);
  }, [pulse]);

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
      window.aquila.getNeuroPulse('class-01').then(setPulse);
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
      {showAILog && <AITeacherLog onClose={() => setShowAILog(false)} />}
      {showLogoffModal && (
        <LogoffModal 
          onConfirm={confirmLogout} 
          onCancel={() => setShowLogoffModal(false)} 
        />
      )}
      
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
          <button 
             onClick={() => setShowAILog(true)}
             className="mt-4 bg-purple-600 hover:bg-purple-500 text-white font-bold py-2 px-6 rounded-full transition shadow-[0_0_15px_rgba(147,51,234,0.3)] flex items-center gap-2"
          >
             🎤 Diário Inteligente (Voz & IA)
          </button>
          <button onClick={handleLogout} className="ml-4 text-red-400 hover:text-red-300">
            Encerrar Sessão
          </button>
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

           <div className="class-timer-wrapper">
              <div className={`class-timer ${timeLeft < 300 ? 'timer-emergency' : ''}`}>
                <span className="timer-label">TEMPO DE AULA</span>
                <span className="timer-value">{formatTime(timeLeft)}</span>
              </div>
           </div>
        </div>
      </header>

      {showPendingAlert && (
        <div className="pending-alert-overlay animate-fade-in">
          <div className="pending-alert-card glass">
            <div className="alert-icon-pulse">!</div>
            <h2>Faltam 5 minutos!</h2>
            <p>Verifique as tarefas dos alunos. Constatamos que o "Visto Digital" ainda não foi aplicado a todos.</p>
            <div className="alert-actions">
              <button className="btn-visto-check" onClick={() => { setVistosConcluidos(true); setShowPendingAlert(false); }}>
                Validar Todos Agora
              </button>
              <button className="btn-dismiss" onClick={() => setShowPendingAlert(false)}>
                Ignorar
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="dashboard-grid">
        {/* Main Classroom Neuro-Map */}
        <section className="neuro-map-card">
           <h3 className="section-label">Mapa de Assentos Soberano (Nuvens Comportamentais)</h3>
           <SeatingChart 
             students={students} 
             onStudentClick={(id) => console.log('Student click:', id)}
             onOpenPortfolio={(id) => console.log('Open portfolio:', id)}
           />
           
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

            <BoardScanner />
          </aside>
      </div>
    </div>
  );
};

export default TeacherDashboard;
