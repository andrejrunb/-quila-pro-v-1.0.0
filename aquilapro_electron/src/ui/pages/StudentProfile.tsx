import React, { useState, useEffect } from 'react';
import { 
  User, Calendar, MapPin, History, ArrowLeft, 
  Shield, Clock, TrendingUp, Users, Activity, 
  CheckCircle2, AlertCircle, MoreVertical, Zap 
} from 'lucide-react';
import './StudentProfile.css';

interface Event {
  id: string;
  type?: string;
  eventType?: string;
  zone?: string;
  roomName?: string;
  timestamp: string;
}

export const StudentProfile: React.FC<{ studentId: string; onBack: () => void }> = ({ studentId, onBack }) => {
  const [student, setStudent] = useState<any>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [smartNarrative, setSmartNarrative] = useState<string>('');
  const [friends, setFriends] = useState<any[]>([]);
  const [trajectory, setTrajectory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const aquila = (window as any).aquila;

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [studentData, eventData, narrative, friendsData, trajectoryData] = await Promise.all([
        aquila.invoke('get-student', studentId),
        aquila.invoke('get-student-events', studentId),
        aquila.invoke('get-smart-narrative', { studentId }),
        aquila.invoke('get-social-context-for-student', studentId),
        aquila.invoke('get-student-trajectory', studentId, new Date().toISOString().split('T')[0])
      ]);
      
      setStudent(studentData);
      setEvents(eventData || []);
      setSmartNarrative(narrative || '');
      setFriends(friendsData || []);
      setTrajectory(trajectoryData || []);
    } catch (err) {
      console.error('Erro ao carregar perfil:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [studentId]);

  if (isLoading) {
    return (
      <div className="student-profile-page">
         <div className="profile-container text-center py-20 animate-pulse">
           <p className="text-dim uppercase font-black tracking-widest text-xs">Acessando Registro Centralizado...</p>
         </div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="student-profile-page">
        <div className="profile-container text-center py-20">
          <p>Aluno não encontrado no ecossistema.</p>
          <button onClick={onBack} className="btn-back-nav mt-4">Retornar</button>
        </div>
      </div>
    );
  }

  return (
    <div className="student-profile-page">
      <div className="profile-container">
        {/* Navigation */}
        <button onClick={onBack} className="btn-back-nav" aria-label="Voltar para a dashboard">
           <ArrowLeft size={20} />
           <span className="back-label">Voltar para Dashboard</span>
        </button>

        {/* Hero Section */}
        <section className="profile-hero">
           <div className="hero-content">
              <div className="photo-wrapper">
                 <div className="photo-frame">
                    {student.photoPath ? (
                       <img src={`file://${student.photoPath}`} alt={student.name} className="photo-img" />
                    ) : (
                       <div className="photo-placeholder">
                          <User size={80} color="#1e293b" />
                       </div>
                    )}
                 </div>
                 <div className="status-badge-active">
                    Ativo
                 </div>
              </div>

              <div className="hero-info">
                 <div className="hero-header">
                    <h1 className="student-name-big">{student.name}</h1>
                    <span className="class-tag">
                       Turma {student.class || 'A'}
                    </span>
                 </div>
                 
                 <div className="student-data-grid">
                    <div className="data-item">
                       <span className="data-label">ID Áquila</span>
                       <span className="data-value data-mono">#{student.id.slice(-8)}</span>
                    </div>
                    <div className="data-item">
                       <span className="data-label">Responsável</span>
                       <span className="data-value">{student.parentName || 'N/A'}</span>
                    </div>
                    <div className="data-item">
                       <span className="data-label">WhatsApp</span>
                       <span className="data-value">{student.parentPhone || 'N/A'}</span>
                    </div>
                    <div className="data-item">
                       <span className="data-label">RG/Matrícula</span>
                       <span className="data-value">{student.registrationNumber || '---'}</span>
                    </div>
                 </div>
              </div>
           </div>

           <div className="hero-blur-decoration" />
        </section>

        <div className="profile-main-grid">
           {/* Left Column: Timeline and Interaction */}
           <div className="timeline-column">
                  <header className="column-header">
                    <h2 className="column-title">
                       <Activity className="text-blue-500" size={20} />
                       Eventos & Atividades
                    </h2>
                    <button 
                      className="btn-secondary-action"
                      onClick={async () => {
                        await aquila.invoke('send-briefing-notification', {
                          studentId: studentId,
                          message: smartNarrative,
                          type: 'whatsapp'
                        });
                        alert('Briefing enviado via WhatsApp!');
                      }}
                      aria-label="Enviar Resumo para WhatsApp dos Pais"
                    >
                       <Users size={14} /> WhatsApp
                    </button>
                  </header>

              <div className="timeline-container">
                 <div className="timeline-line" />
                 
                 <div className="timeline-list">
                    {events.length === 0 ? (
                       <p className="empty-timeline-text">Nenhuma atividade registrada.</p>
                    ) : (
                       events.map(event => (
                          <div key={event.id} className="timeline-item">
                             <div className={`timeline-icon-box ${event.eventType?.includes('ENTRY') ? 'icon-entry' : 'icon-other'}`}>
                                {event.eventType?.includes('ENTRY') ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
                             </div>
                             
                             <div className="timeline-content">
                                <div className="timeline-meta">
                                   <div>
                                      <p className="event-type-label">
                                         {event.eventType || 'Deteção Localizada IA'}
                                      </p>
                                      <div className="event-details">
                                         <span className="detail-item"><MapPin size={12} /> {event.zone || event.roomName || 'Área Comum'}</span>
                                         <span className="detail-item"><Clock size={12} /> {new Date(event.timestamp).toLocaleTimeString('pt-BR')}</span>
                                      </div>
                                   </div>
                                   <div className="p-1 opacity-20"><MoreVertical size={16} /></div>
                                </div>
                             </div>
                          </div>
                       ))
                    )}
                 </div>
              </div>
           </div>

           {/* Right Column: Cards and Metrics */}
           <aside className="sidebar-column">
              <section className="profile-card">
                <div className="card-decoration-icon">
                   <MapPin size={80} />
                </div>
                <h3 className="card-title">
                  <div className="icon-square">
                    <TrendingUp size={20} />
                  </div>
                  Fluxo de Deslocamento
                </h3>
                <div className="trajectory-list">
                  {trajectory.length === 0 ? (
                    <div className="text-center py-4">
                        <p className="text-xs text-slate-500 italic">Sem deslocamento hoje.</p>
                    </div>
                  ) : (
                    trajectory.map((t, idx) => (
                      <div key={idx} className="trajectory-item">
                        <div className="trajectory-connector">
                          <div className={`trajectory-dot ${idx === 0 ? 'dot-active' : 'dot-inactive'}`}></div>
                          {idx < trajectory.length - 1 && <div className="trajectory-line"></div>}
                        </div>
                        <div className="trajectory-info">
                          <p className="trajectory-name">{t.roomName || t.zone}</p>
                          <p className="trajectory-time">
                              {new Date(t.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </section>

              <div className="weekly-stats">
                 <h4 className="stats-label-header">Presença Semanal</h4>
                 <div className="stats-value-big">92%</div>
                  <div className="stats-progress-bar">
                     <div 
                        className="progress-fill" 
                        ref={(el) => { if(el) el.style.setProperty('--progress-width', '92%'); }} 
                     />
                  </div>
                 <p className="stats-caption">Acima da média da turma (85%)</p>
              </div>

               <div className="narrative-card">
                  <h4 className="card-title narrative-header">
                     <Zap size={14} /> Resumo Narrativo (AI)
                  </h4>
                  <p className="narrative-text">
                     "{smartNarrative || 'Analisando padrões comportamentais do dia...'}"
                  </p>
                  <button className="btn-full-report">
                     Ver Relatório Completo
                  </button>
               </div>

               <section className="profile-card">
                  <h4 className="card-title social-header">Círculos Sociais</h4>
                  <div className="social-list">
                     {friends.length === 0 ? (
                        <p className="text-dim-small">Sem interações identificadas.</p>
                     ) : (
                        friends.map(friend => (
                           <div key={friend.id} className="social-item">
                              <div className="social-user">
                                 <div className="social-avatar">
                                    {friend.name.charAt(0)}
                                 </div>
                                 <span className="social-name">{friend.name}</span>
                              </div>
                              <span className="social-strength">{friend.strength}x</span>
                           </div>
                        ))
                     )}
                  </div>
               </section>

               <div className="security-footer-card">
                  <div className="security-content">
                     <Zap size={32} className="zap-bg" />
                     <p className="security-main-text">Mãe notificada hoje às 07:15</p>
                     <p className="security-status">Status: Recebido ✅</p>
                  </div>
               </div>
           </aside>
        </div>
      </div>
    </div>
  );
};

export default StudentProfile;
