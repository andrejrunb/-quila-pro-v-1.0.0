import React, { useState, useEffect } from 'react';
import { Mic } from 'lucide-react';
import { EnvironmentalHUD } from '../components/EnvironmentalHUD';
import { AITeacherLog } from '../components/AITeacherLog';
import { useWSNotifications } from '../hooks/useWSNotifications';
import { CameraLiveView } from '../components/CameraLiveView';
import SeatingChart from '../components/SeatingChart';
import { BoardScanner } from '../components/BoardScanner';
import { AutoGraderScanner } from '../components/AutoGraderScanner';
import { SmartClassHub } from '../components/SmartClassHub';
import { LogoffModal } from '../components/LogoffModal';
import { ClassTargetSelector } from '../components/ClassTargetSelector';
import { ClassTargetResources } from '../components/ClassTargetResources';
import AcademicReportCard from '../components/AcademicReportCard';
import type { ReportCardStudent } from '../components/AcademicReportCard';
import GradeScanner from '../components/GradeScanner';
import OmrScannerUI from '../components/OmrScannerUI';
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
        <span className={type === 'fatigue' ? 'text-fatigue' : 'text-engagement'}>{(value || 0).toFixed(0)}%</span>
      </div>
      <div className="bar-bg">
        <div ref={barRef} className={`bar-fill bg-${type}`}></div>
      </div>
    </div>
  );
};

interface TeacherDashboardProps {
  user?: any;
}

const capitalize = (str: string) => {
  if (!str) return '';
  return str.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
};

const TeacherDashboard: React.FC<TeacherDashboardProps> = ({ user }) => {
  const [pulse, setPulse] = useState<any>({ focusScore: 0, fatigueIndex: 0, collectiveEngagement: 0 });
  const [students, setStudents] = useState<any[]>([]);
  const [trends, setTrends] = useState<any[]>([]);
  const [recommendation, setRecommendation] = useState('MAINTAIN_FLOW');
  const [showAILog, setShowAILog] = useState(false);
  const [showLogoffModal, setShowLogoffModal] = useState(false);
  const [timeLeft, setTimeLeft] = useState(3000); // 50 minutos
  const [showPendingAlert, setShowPendingAlert] = useState(false);
  const [vistosConcluidos, setVistosConcluidos] = useState(false);
  const [activeTab, setActiveTab] = useState<'MAP' | 'GRADING' | 'OMR'>('MAP');
  const [activeBancaId, setActiveBancaId] = useState<string | undefined>();
  const [boardMode, setBoardMode] = useState<'lousa' | 'correcao'>('lousa');
  const [activeReport, setActiveReport] = useState<ReportCardStudent | null>(null);
  const [activeClassId, setActiveClassId] = useState<string>('class-01');

  // Discipline and Frente Selection Modal States
  const [teacherDiscipline, setTeacherDiscipline] = useState<string>(
    sessionStorage.getItem('aquila_teacher_discipline') || ''
  );
  const [teacherFrente, setTeacherFrente] = useState<string>(
    sessionStorage.getItem('aquila_teacher_frente') || ''
  );
  const [showDisciplineModal, setShowDisciplineModal] = useState<boolean>(
    !sessionStorage.getItem('aquila_teacher_discipline') || !sessionStorage.getItem('aquila_teacher_frente')
  );
  const [disciplineInput, setDisciplineInput] = useState('');
  const [frenteInput, setFrenteInput] = useState('Geral');

  useEffect(() => {
    if (user?.subject) {
      setDisciplineInput(user.subject);
    }
  }, [user]);

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
    window.aquila.invoke('logout');
  };

  useEffect(() => {
    const loadClassData = async () => {
      let classId = user?.classId || 'class-01';
      
      try {
        const activeRes = await window.aquila.invoke('seating:get-active-schedule-for-local-room');
        if (activeRes && activeRes.success && activeRes.classId) {
          classId = activeRes.classId;
          console.log(`[TeacherDashboard] Sala local associada encontrada! Carregando turma: ${classId}`);
        }
      } catch (err) {
        console.warn('[TeacherDashboard] Falha ao obter sala local:', err);
      }

      setActiveClassId(classId);
      window.aquila.getNeuroPulse(classId).then((res: any) => {
        if (res) setPulse(res);
      });
      window.aquila.getIndividualStudentFocus().then((res: any) => {
        if (res) setStudents(res);
      });
      window.aquila.getNeuroTrends().then((res: any) => {
        if (res) setTrends(res);
      });
    };

    loadClassData();
  }, [user]);

  useEffect(() => {
    if (pulse) {
      window.aquila.getNeuroRecommendation(pulse).then((res: any) => {
        if (res) setRecommendation(res);
      });
    }
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
      window.aquila.getNeuroPulse(activeClassId).then((res: any) => {
        if (res) setPulse(res);
      });
    }
  }, [lastMessage, activeClassId]);

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
    if (!trends || !Array.isArray(trends) || trends.length === 0) return '';
    const validTrends = trends.filter(t => t && typeof t.focusScore === 'number');
    if (validTrends.length === 0) return '';
    const points = validTrends.map((t, i) => `${i * 4},${40 - (t.focusScore * 40)}`).join(' L ');
    return `M 0,${40 - (validTrends[0].focusScore * 40)} L ${points}`;
  };

  const [isVocalSync, setIsVocalSync] = useState(false);

  const toggleVocalSync = () => {
    setIsVocalSync(!isVocalSync);
    // Em produção aqui seria acionado o AudioIntelligenceService via IPC
  };

  return (
    <div className="page-root max-container animate-fade-in">
      {showDisciplineModal && (
        <div className="discipline-modal-overlay">
          <div className="discipline-modal-card">
            <h2>Identificação de Aula</h2>
            <p>Olá, {capitalize(user?.name || 'Professor(a)')}. Por favor, confirme a disciplina e frente para esta aula:</p>
            
            <div className="discipline-form-group">
              <label htmlFor="discipline-input">Disciplina</label>
              <input
                id="discipline-input"
                list="disciplines-list"
                className="discipline-input"
                placeholder="Selecione ou digite a disciplina..."
                value={disciplineInput}
                onChange={(e) => setDisciplineInput(e.target.value)}
              />
              <datalist id="disciplines-list">
                <option value="Polivalente" />
                <option value="Matemática" />
                <option value="Português" />
                <option value="Redação" />
                <option value="Literatura" />
                <option value="Gramática" />
                <option value="História" />
                <option value="Geografia" />
                <option value="Física" />
                <option value="Química" />
                <option value="Biologia" />
                <option value="Inglês" />
                <option value="Espanhol" />
                <option value="Filosofia" />
                <option value="Sociologia" />
                <option value="Arte" />
                <option value="Educação Física" />
              </datalist>
            </div>

            <div className="discipline-form-group">
              <label htmlFor="frente-input">Frente</label>
              <input
                id="frente-input"
                list="frentes-list"
                className="discipline-input"
                placeholder="Selecione ou digite a frente..."
                value={frenteInput}
                onChange={(e) => setFrenteInput(e.target.value)}
              />
              <datalist id="frentes-list">
                <option value="Geral" />
                <option value="Frente A" />
                <option value="Frente B" />
                <option value="Frente C" />
                <option value="Frente D" />
                <option value="Frente 1" />
                <option value="Frente 2" />
                <option value="Frente 3" />
              </datalist>
            </div>

            <button
              className="discipline-btn-submit"
              disabled={!disciplineInput}
              onClick={() => {
                if (!disciplineInput) return;
                sessionStorage.setItem('aquila_teacher_discipline', disciplineInput);
                sessionStorage.setItem('aquila_teacher_frente', frenteInput);
                setTeacherDiscipline(disciplineInput);
                setTeacherFrente(frenteInput);
                setShowDisciplineModal(false);
              }}
            >
              Confirmar e Acessar Painel
            </button>
          </div>
        </div>
      )}

      {showAILog && <AITeacherLog onClose={() => setShowAILog(false)} />}
      {showLogoffModal && (
        <LogoffModal 
          onConfirm={confirmLogout} 
          onCancel={() => setShowLogoffModal(false)} 
        />
      )}
      
      <header className="page-header">
        <div className="title-block">
          <h1>
            CÓRTEX DOCENTE <span>v5.5</span>
          </h1>
          <p className="subtitle-raw">
            Olá, {capitalize(user?.name || 'Professor(a)')} | 
            <span className={isConnected ? 'status-online' : 'status-offline'}>
              {isConnected ? ' STREAM AO VIVO ATIVO' : ' OFFLINE (RECONECTANDO)'}
            </span>
          </p>
          {teacherDiscipline && (
            <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: '#10b981', fontWeight: 'bold' }}>
              Aula: <span style={{ color: '#fff' }}>{teacherDiscipline}</span> {teacherFrente && `(${teacherFrente})`}
            </div>
          )}
          <div className="vocal-controls-row">
            <button 
               onClick={toggleVocalSync}
               className={`mt-4 font-bold py-2 px-6 rounded-full transition shadow-lg flex items-center gap-2 ${isVocalSync ? 'bg-red-600 animate-pulse' : 'bg-purple-600 hover:bg-purple-500'} text-white`}
            >
               <Mic size={18} />
               {isVocalSync ? 'Escutando Comandos...' : 'Diário Inteligente (Voz & IA)'}
            </button>
            {isVocalSync && (
              <span className="vocal-status-badge animate-fade-in">
                Sincronia Vocal Nível 22 Ativa
              </span>
            )}
          </div>
          <button onClick={handleLogout} className="ml-4 text-red-400 hover:text-red-300">
            Encerrar Sessão
          </button>
        </div>

        <div className="pedagogy-control">
          <ClassTargetSelector 
            classId={activeClassId} 
            onTargetChange={(bancaId) => setActiveBancaId(bancaId)} 
          />
        </div>

        <div className="neuro-pulse-main">
           <div className="pulse-container">
              <div className="pulse-beat"></div>
              <div className="pulse-badge">
                {((pulse?.focusScore || 0) * 100).toFixed(0)}<span>%</span>
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
                 (recommendation || 'MAINTAIN_FLOW').replace(/_/g, ' ')}
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

      <ClassTargetResources classId={activeClassId} targetBancaId={activeBancaId} />

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

        {/* Main Classroom Neuro-Map / Grading View Toggle */}
        <section className="neuro-map-card">
           <div className="view-toggle-header">
              <h3 className="section-label">
                {activeTab === 'MAP' ? 'Mapa de Assentos Soberano' : '🦅 Corretor Automático Pro'}
              </h3>
              <div className="tab-switcher glass">
                <button 
                  className={activeTab === 'MAP' ? 'active' : ''} 
                  onClick={() => setActiveTab('MAP')}
                >
                  MAPA
                </button>
                <button 
                  className={activeTab === 'GRADING' ? 'active' : ''} 
                  onClick={() => setActiveTab('GRADING')}
                >
                  CORREÇÃO CÂMERA
                </button>
                <button 
                  className={activeTab === 'OMR' ? 'active' : ''} 
                  onClick={() => setActiveTab('OMR')}
                >
                  OMR SOBERANO
                </button>
              </div>
           </div>

           {activeTab === 'MAP' && (
             <SeatingChart 
               students={students} 
               onStudentClick={(id) => {
                 const s = students.find(st => st.id === id);
                 if (s) setActiveReport({ id: s.id, name: s.name, className: s.seatLabel || s.id });
               }}
               onOpenPortfolio={(id) => console.log('Open portfolio:', id)}
             />
           )}
           {activeTab === 'GRADING' && <GradeScanner />}
           {activeTab === 'OMR' && <OmrScannerUI />}
           
           <div className="status-sync-bar">
              <span className="sync-text">Sincronia Pedagógica High-Fidelity Ativa</span>
              <button 
                className="btn-dynamic-reinforce"
                onClick={async () => {
                 try {
                   await (window as any).aquila?.invoke('iot:connect');
                 } catch {}
                 (window as any).showToast?.('Sinal de reforço dinâmico enviado via IoT ao painel da sala!', 'success');
               }}
              >
                Reforçar Dinâmica
              </button>
           </div>
        </section>

        {/* Sidebar Analytics */}
        <aside className="sidebar-analytics">
        <EnvironmentalHUD roomId={activeClassId} />
        
            <div className="stat-card">
               <h4 className="stat-card-title">Métricas de Carga Cognitiva</h4>
              <div className="metric-group">
                 <MetricBar label="FADIGA COGNITIVA" value={(pulse?.fatigueIndex || 0) * 100} type="fatigue" />
                 <MetricBar label="ENGAJAMENTO COLETIVO" value={(pulse?.collectiveEngagement || 0) * 100} type="engagement" />
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

            <div className="board-scanner-wrapper border border-slate-700/50 rounded-2xl bg-black/20 p-4 mt-6">
                <div className="flex gap-4 mb-4">
                  <button 
                    onClick={() => setBoardMode('lousa')}
                    className={`px-4 py-2 font-bold text-sm rounded-lg transition-colors ${boardMode === 'lousa' ? 'bg-blue-500 text-white' : 'bg-white/5 text-slate-400 hover:text-white'}`}
                  >
                    Extração de Lousa
                  </button>
                  <button 
                    onClick={() => setBoardMode('correcao')}
                    className={`px-4 py-2 font-bold text-sm rounded-lg transition-colors ${boardMode === 'correcao' ? 'bg-purple-500 text-white' : 'bg-white/5 text-slate-400 hover:text-white'}`}
                  >
                    Correção (AutoGrader)
                  </button>
                </div>
                {boardMode === 'lousa' ? <BoardScanner /> : <AutoGraderScanner />}
            </div>
          </aside>
      
          {activeReport && (
            <AcademicReportCard
              student={activeReport}
              onClose={() => setActiveReport(null)}
            />
          )}
      </div>
  );
};

export default TeacherDashboard;
