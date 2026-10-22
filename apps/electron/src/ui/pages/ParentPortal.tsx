import React, { useState, useEffect } from 'react';
import { 
  Bell, MessageSquare, Calendar, Shield, 
  MapPin, Send, Camera, BarChart3,
  Lightbulb, ChevronRight, Info,
  ChevronDown, TrendingUp, TrendingDown, Clock, CreditCard, User, BookOpen, AlertCircle
} from 'lucide-react';
import { EagleCard } from '../components/elite/EagleCard';
import { EagleButton } from '../components/elite/EagleButton';
import { BehavioralEvidenceReport } from '../components/BehavioralEvidenceReport';
import EvolutionaryDashboard from '../components/EvolutionaryDashboard';
import { CurrentMissionTarget } from '../components/CurrentMissionTarget';

import './ParentPortal.css';

/**
 * ParentPortal (v1633-v1640)
 * Interface Mobile-First para os Pais (O substituto do ClassApp) com Análise de Evidências e Ciclo de Vida.
 */
export const ParentPortal: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'comms' | 'safety' | 'academic' | 'analytics' | 'lifecycle' | 'insights'>('overview');
  const [lifecycleData, setLifecycleData] = useState<any>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [insights, setInsights] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);

  const [selectedChild, setSelectedChild] = useState('andrej');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const childrenMock = [
    { id: 'andrej', name: 'Andrej Provisorczyk', grade: '3º Ano A • Sala 04', seed: 'andrej' },
    { id: 'sofia', name: 'Sofia Provisorczyk', grade: '7º Ano B • Sala 12', seed: 'sofia' }
  ];
  const selectedChildData = childrenMock.find(c => c.id === selectedChild) || childrenMock[0];

  useEffect(() => {
    const aquila = (window as any).aquila;
    if (!aquila) return;

    const fetchInitialData = async () => {
      try {
        const lData = await aquila.getStudentLifecycle('std-001');
        setLifecycleData(lData);
        
        const nData = await aquila.getParentNotifications('std-001');
        setNotifications(nData || []);

        const iData = await aquila.invoke('pedagogical:get-archived-trends');
        setInsights(iData || []);

        const eData = await aquila.invoke('get-student-events', 'std-001');
        if (eData && eData.success) {
          setEvents(eData.data || []);
        }
      } catch (e) {
        console.error('Erro ao carregar dados do portal:', e);
      }
    };

    fetchInitialData();

    const unsubscribe = aquila.on('nexus-pulse', (payload: any) => {
      setNotifications(prev => [
        {
          id: `tmp-${Date.now()}`,
          type: payload.type,
          title: 'Nova Conquista!',
          message: payload.message,
          timestamp: new Date().toISOString(),
          priority: 'high'
        },
        ...prev
      ]);
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  return (
    <div className="parent-portal-container">
      {/* Header Premium com Seletor de Filhos */}
      <header style={{ 
        padding: '1rem 1.5rem', 
        background: 'rgba(30, 41, 59, 0.5)', 
        backdropFilter: 'blur(20px)', 
        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
        position: 'sticky', 
        top: 0, 
        zIndex: 50,
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem'
      }}>
         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="app-logo-group">
               <div className="app-logo-mini"></div>
               <h1 className="app-title-mini" style={{ color: '#f1f5f9' }}>Áquila Família</h1>
            </div>
            <div className="notification-bell">
               <Bell size={20} style={{ color: '#06b6d4' }} />
               {notifications.length > 0 && <span className="bell-badge">{notifications.length}</span>}
            </div>
         </div>
         
         <div style={{ position: 'relative' }}>
           <div 
             style={{ display: 'flex', alignItems: 'center', gap: '1rem', cursor: 'pointer', padding: '0.75rem 1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '1rem', border: '1px solid rgba(255,255,255,0.05)' }}
             onClick={() => setIsDropdownOpen(!isDropdownOpen)}
           >
              <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedChildData.seed}`} alt={selectedChildData.name} style={{ width: '40px', height: '40px', borderRadius: '50%', border: '2px solid #3b82f6' }} />
              <div style={{ flex: 1 }}>
                 <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 800, color: '#f1f5f9' }}>{selectedChildData.name}</p>
                 <p style={{ margin: 0, fontSize: '0.75rem', color: '#06b6d4', fontWeight: 600 }}>{selectedChildData.grade}</p>
              </div>
              <ChevronDown size={20} style={{ color: '#94a3b8', transform: isDropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
           </div>
           
           {isDropdownOpen && (
             <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: '0.5rem', background: 'rgba(15, 23, 42, 0.95)', backdropFilter: 'blur(20px)', borderRadius: '1rem', border: '1px solid rgba(255,255,255,0.1)', overflow: 'hidden', zIndex: 100 }}>
               {childrenMock.map(child => (
                 <div 
                   key={child.id}
                   style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem 1rem', cursor: 'pointer', background: child.id === selectedChild ? 'rgba(59, 130, 246, 0.1)' : 'transparent' }}
                   onClick={() => { setSelectedChild(child.id); setIsDropdownOpen(false); }}
                 >
                    <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${child.seed}`} alt={child.name} style={{ width: '30px', height: '30px', borderRadius: '50%', border: '1px solid #3b82f6' }} />
                    <div>
                      <p style={{ margin: 0, fontSize: '0.8125rem', fontWeight: 700, color: '#f1f5f9' }}>{child.name}</p>
                      <p style={{ margin: 0, fontSize: '0.65rem', color: '#94a3b8' }}>{child.grade}</p>
                    </div>
                 </div>
               ))}
             </div>
           )}
         </div>
      </header>

      <main className="app-content">
         <nav className="app-tabs">
            <button className={activeTab === 'overview' ? 'active' : ''} onClick={() => setActiveTab('overview')}>
               <User size={20} />
               <span>Início</span>
            </button>
            <button className={activeTab === 'comms' ? 'active' : ''} onClick={() => setActiveTab('comms')}>
               <MessageSquare size={20} />
               <span>Mensagens</span>
            </button>
            <button className={activeTab === 'insights' ? 'active' : ''} onClick={() => setActiveTab('insights')}>
               <Lightbulb size={20} />
               <span>Insights</span>
            </button>
            <button className={activeTab === 'safety' ? 'active' : ''} onClick={() => setActiveTab('safety')}>
               <Shield size={20} />
               <span>Segurança</span>
            </button>
            <button className={activeTab === 'academic' ? 'active' : ''} onClick={() => setActiveTab('academic')}>
               <Calendar size={20} />
               <span>Agenda</span>
            </button>
            <button className={activeTab === 'analytics' ? 'active' : ''} onClick={() => setActiveTab('analytics')}>
               <BarChart3 size={20} />
               <span>Análise</span>
            </button>
         </nav>

         <div className="tab-pane animate-fade-in">
            {activeTab === 'overview' && (
               <div className="overview-view animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', paddingBottom: '2rem' }}>
                 {/* Progress Cards Row */}
                 <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                   <EagleCard variant="kpi" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                     <div style={{ position: 'relative', width: '60px', height: '60px', borderRadius: '50%', background: 'conic-gradient(#06b6d4 94.2%, rgba(255,255,255,0.1) 0)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                       <div style={{ width: '50px', height: '50px', borderRadius: '50%', background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 800 }}>94%</div>
                     </div>
                     <span style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.5rem' }}>Frequência</span>
                     <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#10b981', fontSize: '0.65rem', marginTop: '0.25rem' }}><TrendingUp size={12}/> +2%</div>
                   </EagleCard>
                   
                   <EagleCard variant="kpi" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                     <div style={{ position: 'relative', width: '60px', height: '60px', borderRadius: '50%', background: 'conic-gradient(#3b82f6 87%, rgba(255,255,255,0.1) 0)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                       <div style={{ width: '50px', height: '50px', borderRadius: '50%', background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 800 }}>8.7</div>
                     </div>
                     <span style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.5rem' }}>Média Geral</span>
                     <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#10b981', fontSize: '0.65rem', marginTop: '0.25rem' }}><TrendingUp size={12}/> +0.4</div>
                   </EagleCard>

                   <EagleCard variant="kpi" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                     <div style={{ position: 'relative', width: '60px', height: '60px', borderRadius: '50%', background: 'conic-gradient(#8b5cf6 82%, rgba(255,255,255,0.1) 0)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                       <div style={{ width: '50px', height: '50px', borderRadius: '50%', background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 800 }}>23/28</div>
                     </div>
                     <span style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.5rem', textAlign: 'center' }}>Tarefas Concluídas</span>
                     <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#f59e0b', fontSize: '0.65rem', marginTop: '0.25rem' }}><TrendingDown size={12}/> -2</div>
                   </EagleCard>

                   <EagleCard variant="kpi" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                     <div style={{ position: 'relative', width: '60px', height: '60px', borderRadius: '50%', background: 'conic-gradient(#10b981 100%, rgba(255,255,255,0.1) 0)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                       <div style={{ width: '50px', height: '50px', borderRadius: '50%', background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 800 }}>100%</div>
                     </div>
                     <span style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.5rem' }}>Comportamento</span>
                     <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#10b981', fontSize: '0.65rem', marginTop: '0.25rem' }}>Excelente</div>
                   </EagleCard>
                 </div>

                 {/* Upcoming Section */}
                 <EagleCard title="Próximos Eventos" icon={<Calendar size={18} />} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                   {[
                     { title: 'Prova de Matemática', date: '12/08', time: '08:00', type: 'exam' },
                     { title: 'Reunião de Pais', date: '15/08', time: '19:00', type: 'meeting' },
                     { title: 'Entrega Trabalho', date: '18/08', time: '23:59', type: 'assignment' }
                   ].map((ev, i) => (
                     <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '1rem', borderLeft: `2px solid ${ev.type === 'exam' ? '#ef4444' : ev.type === 'meeting' ? '#3b82f6' : '#f59e0b'}`, paddingLeft: '0.75rem' }}>
                       <div style={{ flex: 1 }}>
                         <h4 style={{ margin: 0, fontSize: '0.875rem', fontWeight: 700, color: '#f1f5f9' }}>{ev.title}</h4>
                         <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{ev.date} às {ev.time}</span>
                       </div>
                     </div>
                   ))}
                 </EagleCard>

                 {/* Recent Grades Card */}
                 <EagleCard title="Últimas Notas" icon={<BookOpen size={18} />} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                   {[
                     { subject: 'Matemática', score: 9.5, comment: 'Excelente desempenho na álgebra.' },
                     { subject: 'Física', score: 8.0, comment: 'Pode melhorar em cinemática.' },
                     { subject: 'História', score: 10.0, comment: 'Ótima participação em sala.' },
                     { subject: 'Biologia', score: 8.5, comment: 'Trabalho bem executado.' },
                     { subject: 'Química', score: 7.5, comment: 'Faltou atenção na prova.' }
                   ].map((grade, i) => (
                     <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', paddingBottom: '0.75rem', borderBottom: i < 4 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                       <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minWidth: '40px', height: '40px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '0.5rem', color: grade.score >= 8 ? '#10b981' : '#f59e0b', fontWeight: 800 }}>
                         {grade.score.toFixed(1)}
                       </div>
                       <div style={{ flex: 1 }}>
                         <h4 style={{ margin: 0, fontSize: '0.875rem', fontWeight: 700, color: '#f1f5f9' }}>{grade.subject}</h4>
                         <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.75rem', color: '#94a3b8', fontStyle: 'italic' }}>"{grade.comment}"</p>
                       </div>
                     </div>
                   ))}
                 </EagleCard>

                 {/* Quick Actions */}
                 <EagleCard title="Ações Rápidas" icon={<AlertCircle size={18} />} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                   <EagleButton variant="primary" style={{ width: '100%', justifyContent: 'flex-start' }} leftIcon={<CreditCard size={18} />}>Pagar Mensalidade</EagleButton>
                   <EagleButton variant="secondary" style={{ width: '100%', justifyContent: 'flex-start' }} leftIcon={<MessageSquare size={18} />}>Falar com Professor</EagleButton>
                   <EagleButton variant="ghost" style={{ width: '100%', justifyContent: 'flex-start' }} leftIcon={<BarChart3 size={18} />}>Ver Boletim Completo</EagleButton>
                 </EagleCard>
               </div>
            )}

            {activeTab === 'comms' && (
               <div className="messages-list">
                  {notifications.map(msg => (
                    <div key={msg.id} className={`msg-card ${msg.priority === 'high' ? 'unread' : ''}`}>
                       <header className="msg-header">
                          <span className={`channel-tag ${msg.type === 'ACADEMIC_ACHIEVEMENT' ? 'ped' : 'gen'}`}>
                            {msg.type === 'ACADEMIC_ACHIEVEMENT' ? 'Conquista' : 'Comunicado'}
                          </span>
                          <span className="msg-time">
                            {new Date(msg.timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                       </header>
                       <h4 className="msg-title">{msg.title}</h4>
                       <p className="msg-text">{msg.message}</p>
                    </div>
                  ))}
               </div>
            )}

            {activeTab === 'insights' && (
              <div className="insights-view">
                <div className="insights-header">
                  <h3><Lightbulb className="text-amber-400" /> Insights da Escola</h3>
                  <p>Recomendações geradas pelo Córtex Institucional para otimizar a jornada educativa.</p>
                </div>
                
                <div className="insights-grid">
                  {insights.length === 0 ? (
                    <div className="empty-insights">
                      <Info size={40} className="opacity-20" />
                      <p>Nenhum insight compartilhado recentemente.</p>
                    </div>
                  ) : (
                    insights.map(insight => (
                      <div key={insight.id} className="insight-card-premium">
                        <div className="insight-glow"></div>
                        <div className="insight-body">
                          <header>
                            <span className="insight-tag">Análise Aureus</span>
                            <span className="insight-date">{new Date(insight.createdAt).toLocaleDateString()}</span>
                          </header>
                          <h4>{insight.title}</h4>
                          <p>{insight.content.substring(0, 150)}...</p>
                          <button className="read-more-btn">
                            Ver Análise Completa <ChevronRight size={14} />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {activeTab === 'safety' && (
               <div className="safety-view">
                  <div className="cheguei-card">
                     <h3 className="cheguei-title">Módulo Portaria (Cheguei)</h3>
                     <button className="request-pickup-btn">
                        <MapPin size={24} />
                        <span>ESTOU CHEGANDO</span>
                        <small>Notificar a portaria para organizar a saída</small>
                     </button>
                  </div>
                  <div className="real-time-map-mock">
                     <div className="map-overlay">
                        <span className="label">Localização Atual</span>
                        <span className="value">{events[0]?.subject || events[0]?.title || 'SALA DE AULA 04'}</span>
                     </div>
                  </div>
                  <div className="events-timeline-container mt-6">
                     <h4 className="font-bold text-sm text-white mb-4">Linha do Tempo de Trânsito</h4>
                     <div className="space-y-3">
                        {events.length === 0 ? (
                           <div className="p-4 bg-white/5 border border-white/5 rounded-2xl text-center text-xs text-zinc-500 uppercase font-black">Nenhum evento registrado</div>
                        ) : (
                           events.map(ev => (
                              <div key={ev.id} className="flex justify-between items-center p-4 bg-white/5 border border-white/5 rounded-2xl">
                                 <div>
                                    <p className="font-bold text-xs text-white">{ev.title}</p>
                                    <p className="text-[10px] text-zinc-400 mt-1">{ev.description}</p>
                                 </div>
                                 <span className="text-[10px] font-bold text-zinc-500">
                                    {new Date(ev.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                 </span>
                              </div>
                           ))
                        )}
                     </div>
                  </div>
               </div>
            )}

            {activeTab === 'academic' && (
               <div className="academic-view animate-fade-in">
                  <div className="section-pulse">
                     <h3 className="pulse-title">PULSE PEDAGÓGICO</h3>
                     <CurrentMissionTarget studentId="std-001" />
                  </div>
                  <div className="agenda-grid">
                     <h4 className="agenda-title">Hoje, 29 de Abril</h4>
                     <div className="agenda-item">
                        <span className="time">07:30</span>
                        <div className="subject-bar math"></div>
                        <div className="item-details"><p className="subject">Matemática</p><p className="topic">Álgebra Linear</p></div>
                     </div>
                  </div>
               </div>
            )}

            {activeTab === 'analytics' && (
               <div className="analytics-view animate-fade-in">
                  <h3 className="analytics-title">COMPREENSÃO QUANTITATIVA</h3>
                  <BehavioralEvidenceReport studentId="std-001" />
               </div>
            )}

            {activeTab === 'lifecycle' && lifecycleData && (
               <div className="lifecycle-view animate-fade-in">
                  <EvolutionaryDashboard studentName="Andrej Provisorczyk" history={lifecycleData.history} />
               </div>
            )}
         </div>
      </main>

      <footer className="app-footer">
          <div className="chat-input-bar">
             <Camera size={20} className="icon-slate-500" />
             <input type="text" placeholder="Falar com a secretaria..." />
             <Send size={20} className="icon-blue-500" />
          </div>
      </footer>
    </div>
  );
};
