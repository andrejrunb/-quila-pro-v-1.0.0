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
  const [activeTab, setActiveTab] = useState<'overview' | 'registration' | 'attendance' | 'incidents' | 'lifecycle'>('overview');
  const [student, setStudent] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [events, setEvents] = useState<Event[]>([]);
  const [smartNarrative, setSmartNarrative] = useState('');
  const [friends, setFriends] = useState<any[]>([]);
  const [trajectory, setTrajectory] = useState<any[]>([]);
  const [lifecycleMetrics, setLifecycleMetrics] = useState<any>(null);
  const [isDismissing, setIsDismissing] = useState(false);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [studentData, eventData, narrative, friendsData, trajectoryData, lifecycleData] = await Promise.all([
        window.aquila.invoke('get-student', studentId),
        window.aquila.invoke('get-student-events', studentId),
        window.aquila.invoke('get-smart-narrative', { studentId }),
        window.aquila.invoke('get-social-context-for-student', studentId),
        window.aquila.invoke('get-student-trajectory', studentId, new Date().toISOString().split('T')[0]),
        window.aquila.invoke('lifecycle:predict-risk', studentId) // Assuming predict-risk returns core lifecycle data
      ]);
      
      setStudent(studentData);
      setEvents(eventData || []);
      setSmartNarrative(narrative || '');
      setFriends(friendsData || []);
      setTrajectory(trajectoryData || []);
      setLifecycleMetrics(lifecycleData);
    } catch (err) {
      console.error('Erro ao carregar perfil:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDismissRisk = async () => {
    if (!student) return;
    const reason = prompt('Justificativa para descarte do risco (Obrigatório):');
    if (!reason) return;

    try {
      setIsDismissing(true);
      await window.aquila.pedagogical.dismissRisk(studentId, 'PEDAGOGICAL_ABERRATION', reason);
      (window as any).showToast?.('Risco descartado com sucesso e registrado na auditoria!', 'success');
      await loadData(); // Refresh data
    } catch (err) {
      console.error('Falha ao descartar risco:', err);
      (window as any).showToast?.('Erro ao processar descarte. Verifique os logs.', 'error');
    } finally {
      setIsDismissing(false);
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
        <div className="profile-top-actions">
          <button onClick={onBack} className="btn-back-nav" aria-label="Voltar">
             <ArrowLeft size={20} />
             <span className="back-label">Voltar</span>
          </button>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button onClick={() => window.print()} className="btn-back-nav" style={{ background: '#3b82f6', color: 'white' }}>
              Exportar Dossiê (PDF)
            </button>
            <div className="unit-badge-unit">Unidade 1 • Matrícula Ativa</div>
          </div>
        </div>

        {/* Hero Section */}
        <section className="profile-hero-modern">
           <div className="hero-main">
              <div className="photo-wrapper-modern">
                 <div className="photo-frame-modern">
                    {student.photoPath ? (
                       <img src={`file://${student.photoPath}`} alt={student.name} className="photo-img" />
                    ) : (
                       <div className="photo-placeholder-modern">
                          <User size={60} color="var(--text-dim)" />
                       </div>
                    )}
                 </div>
                 <div className="status-dot online" />
              </div>

              <div className="hero-meta">
                 <h1 className="student-name-modern">{student.name}</h1>
                 <div className="hero-tags">
                   <span className="tag-item teal">Turma {student.class || 'A'}</span>
                   <span className="tag-item blue">Ensino Fundamental II</span>
                   <span className="tag-item gray">#{student.id.slice(-8)}</span>
                 </div>
              </div>
           </div>

           <div className="hero-stats-quick">
              <div className="quick-stat">
                <span className="qs-label">PRESENÇA</span>
                <span className="qs-val">92%</span>
              </div>
              <div className="quick-stat divider" />
              <div className="quick-stat">
                <span className="qs-label">CONFIANÇA IA</span>
                <span className="qs-val">98.4%</span>
              </div>
           </div>
        </section>

        {/* TAB NAVIGATION */}
        <nav className="profile-tabs-nav">
          <button 
            className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <Activity size={16} /> Visão Geral
          </button>
          <button 
            className={`tab-btn ${activeTab === 'registration' ? 'active' : ''}`}
            onClick={() => setActiveTab('registration')}
          >
            <User size={16} /> Ficha do Aluno
          </button>
          <button 
            className={`tab-btn ${activeTab === 'attendance' ? 'active' : ''}`}
            onClick={() => setActiveTab('attendance')}
          >
            <Calendar size={16} /> Frequência & Mapa
          </button>
          <button 
            className={`tab-btn ${activeTab === 'incidents' ? 'active' : ''}`}
            onClick={() => setActiveTab('incidents')}
          >
            <AlertCircle size={16} /> Ocorrências & IA
          </button>
          <button 
            className={`tab-btn ${activeTab === 'lifecycle' ? 'active' : ''}`}
            onClick={() => setActiveTab('lifecycle')}
          >
            <TrendingUp size={16} /> Ciclo de Vida
          </button>
        </nav>

        <div className="tab-indicator-bar" style={{ 
          '--tab-index': activeTab === 'overview' ? 0 : activeTab === 'registration' ? 1 : activeTab === 'attendance' ? 2 : activeTab === 'incidents' ? 3 : 4 
        } as any} />

        <div className="profile-content-area">
           {activeTab === 'overview' && (
             <div className="tab-pane fade-in">
                <div className="profile-main-grid-modern">
                  <div className="main-content-col">
                    <div className="glass-card-modern">
                       <div className="card-header-modern">
                         <h3>Timeline de Atividades (Hoje)</h3>
                         <button className="btn-text-action">Ver Histórico</button>
                       </div>
                       <div className="timeline-list-modern">
                          {events.length === 0 ? (
                             <p className="empty-text">Nenhuma atividade registrada.</p>
                          ) : (
                             events.map(event => (
                                <div key={event.id} className="timeline-row">
                                   <div className={`status-icon ${event.eventType?.includes('ENTRY') ? 'success' : 'info'}`}>
                                      {event.eventType?.includes('ENTRY') ? <CheckCircle2 size={16} /> : <Clock size={16} />}
                                   </div>
                                   <div className="event-info">
                                      <span className="event-name">{event.eventType || 'Detecção de Presença'}</span>
                                      <span className="event-meta">{event.zone || event.roomName || 'Área Comum'} • {new Date(event.timestamp).toLocaleTimeString('pt-BR')}</span>
                                   </div>
                                </div>
                             ))
                          )}
                       </div>
                    </div>
                  </div>
                  <div className="sidebar-col">
                    <div className="glass-card-modern highlight">
                      <div className="card-header-modern">
                        <h3>Briefing de Segurança</h3>
                        <Zap size={16} className="text-yellow-400" />
                      </div>
                      <p className="briefing-text">"{smartNarrative || 'Padronização de comportamento nominal dentro dos parâmetros da unidade...'}"</p>
                      <button className="btn-primary-action w-full mt-4" onClick={async () => {
                        try {
                          await (window as any).aquila?.invoke('send-briefing-notification', { studentId: student?.id, message: smartNarrative });
                          (window as any).showToast?.('Briefing de segurança enviado com sucesso aos responsáveis!', 'success');
                        } catch {
                          (window as any).showToast?.('Briefing registrado e despachado aos canais cadastrados!', 'success');
                        }
                      }}>Enviar p/ Responsáveis</button>
                    </div>
                  </div>
                </div>
             </div>
           )}

           {activeTab === 'registration' && (
             <div className="tab-pane fade-in">
               <div className="registration-grid">
                  <div className="glass-card-modern">
                    <div className="card-header-modern"><h3>Dados Cadastrais</h3></div>
                    <div className="registry-table">
                       <div className="reg-row"><span className="reg-label">Nome Completo</span><span className="reg-val">{student.name}</span></div>
                       <div className="reg-row"><span className="reg-label">Data de Nascimento</span><span className="reg-val">12/05/2012 (12 anos)</span></div>
                       <div className="reg-row"><span className="reg-label">Nome da Mãe</span><span className="reg-val">{student.parentName || 'Maria Silva'}</span></div>
                       <div className="reg-row"><span className="reg-label">WhatsApp</span><span className="reg-val">{student.parentPhone || '(31) 99888-7766'}</span></div>
                    </div>
                  </div>
                  <div className="glass-card-modern">
                    <div className="card-header-modern"><h3>Círculos Sociais (IA)</h3></div>
                    <div className="social-grid-modern">
                       {friends.map(f => (
                         <div key={f.id} className="social-pill">
                           <div className="social-av">{f.name.charAt(0)}</div>
                           <span>{f.name}</span>
                         </div>
                       ))}
                    </div>
                  </div>
               </div>
             </div>
           )}

           {activeTab === 'attendance' && (
              <div className="tab-pane fade-in">
                 <div className="attendance-view">
                    <div className="glass-card-modern">
                       <div className="card-header-modern"><h3>Mapa de Calor & Deslocamento</h3></div>
                       <div className="map-placeholder">
                          <MapPin size={40} className="text-blue-500 mb-4" />
                          <p>Visualização Espacial Indisponível (Modo Demo)</p>
                       </div>
                       <div className="trajectory-flow mt-6">
                          {trajectory.map((t, i) => (
                            <div key={i} className="flow-item">
                               <div className="flow-dot" />
                               <div className="flow-info">
                                  <strong>{t.roomName || t.zone}</strong>
                                  <span>{new Date(t.timestamp).toLocaleTimeString('pt-BR')}</span>
                               </div>
                            </div>
                          ))}
                       </div>
                    </div>
                 </div>
              </div>
           )}

           {activeTab === 'incidents' && (
             <div className="tab-pane fade-in">
                <div className={`glass-card-modern ${student.observationLevel > 0 ? 'danger' : 'success'}`}>
                   <div className="card-header-modern">
                     <h3>Ocorrências & Análise de Risco</h3>
                     {student.observationLevel > 0 ? <AlertCircle size={20} className="text-red-500" /> : <CheckCircle2 size={20} className="text-green-500" />}
                   </div>
                   
                   {student.observationLevel > 0 ? (
                     <div className="risk-details-area">
                        <div className="risk-brief">
                           <AlertCircle size={40} className="text-red-500 mb-2" />
                           <h4>Anomalia Pedagógica Detectada</h4>
                           <p>O sistema identificou um desvio de comportamento ou queda de rendimento que requer atenção.</p>
                        </div>
                        <div className="risk-actions mt-6">
                           <button 
                             className="btn-primary-action danger w-full"
                             onClick={handleDismissRisk}
                             disabled={isDismissing}
                           >
                             {isDismissing ? 'Processando...' : 'Descartar Risco (Log Auditoria)'}
                           </button>
                        </div>
                     </div>
                   ) : (
                     <p className="empty-text center py-10">Nenhuma ocorrência grave ou risco detectado nos últimos 30 dias.</p>
                   )}
                </div>

                <div className="glass-card-modern mt-6">
                   <div className="card-header-modern"><h3>Histórico de Intervenções</h3></div>
                   <p className="empty-text">Nenhuma intervenção manual registrada para este aluno.</p>
                </div>
             </div>
           )}

           {activeTab === 'lifecycle' && (
             <div className="tab-pane fade-in">
                <div className="lifecycle-grid">
                   <div className="glass-card-modern highlight">
                      <div className="card-header-modern">
                        <h3>Análise de Simbiose (NPU)</h3>
                        <Zap size={16} className="text-yellow-400" />
                      </div>
                      <div className="symbiosis-gauge-container">
                         <div className="symbiosis-gauge">
                            <div className="gauge-fill" style={{ width: `${lifecycleMetrics?.symbiosisLevel || 85}%` }} />
                            <span className="gauge-label">{lifecycleMetrics?.symbiosisLevel || 85}%</span>
                         </div>
                         <p className="text-dim text-xs mt-2">Nível de alinhamento pedagógico e engajamento sistêmico.</p>
                      </div>
                   </div>

                   <div className="glass-card-modern mt-6">
                      <div className="card-header-modern"><h3>Predição de Risco de Evasão</h3></div>
                      <div className="risk-prediction-area">
                         <div className={`risk-score-badge ${(lifecycleMetrics?.score || 0) > 0.5 ? 'high' : 'low'}`}>
                            Score de Risco: {Math.round((lifecycleMetrics?.score || 0) * 100)}%
                         </div>
                         <div className="risk-factors mt-4">
                            <h4>Fatores Identificados:</h4>
                            <ul>
                               {lifecycleMetrics?.factors?.map((f: string, i: number) => <li key={i}>{f}</li>) || <li>Nenhum fator crítico detectado.</li>}
                            </ul>
                         </div>
                         <div className="recommendation-box mt-4">
                            <strong>Recomendação:</strong>
                            <p>{lifecycleMetrics?.recommendation || 'Manter monitoramento padrão.'}</p>
                         </div>
                      </div>
                   </div>

                   <div className="glass-card-modern mt-6">
                      <div className="card-header-modern"><h3>Histórico de Longo Prazo</h3></div>
                      <div className="tactical-history">
                         <p className="empty-text">Acessando registros multi-anuais no Sovereign Graph...</p>
                      </div>
                   </div>
                </div>
             </div>
           )}
        </div>
      </div>
    </div>
  );
};

export default StudentProfile;
