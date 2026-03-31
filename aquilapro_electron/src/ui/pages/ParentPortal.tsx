import React, { useState } from 'react';
import { 
  Bell, MessageSquare, Calendar, Shield, 
  MapPin, Send, Camera, BarChart3
} from 'lucide-react';
import { BehavioralEvidenceReport } from '../components/BehavioralEvidenceReport';
import EvolutionaryDashboard from '../components/EvolutionaryDashboard';
import { evolutionaryTimelineService } from '../../services/EvolutionaryTimelineService';
import './ParentPortal.css';

/**
 * ParentPortal (v1633-v1640)
 * Interface Mobile-First para os Pais (O substituto do ClassApp) com Análise de Evidências e Ciclo de Vida.
 */
export const ParentPortal: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'comms' | 'safety' | 'academic' | 'analytics' | 'lifecycle'>('comms');
  const [lifecycleData, setLifecycleData] = React.useState<any>(null);

  React.useEffect(() => {
    const fetchLifecycle = async () => {
      const data = await evolutionaryTimelineService.getStudentLifecycle('std-001');
      setLifecycleData(data);
    };
    fetchLifecycle();
  }, []);

  return (
    <div className="parent-portal-container">
      {/* Header do App Móvel (Zero-Debt Standard) */}
      <header className="app-header">
         <div className="app-logo-group">
            <div className="app-logo-mini"></div>
            <h1 className="app-title-mini">Áquila Família</h1>
         </div>
         <div className="notification-bell">
            <Bell size={18} />
            <span className="bell-badge">2</span>
         </div>
      </header>

      {/* Perfil do Aluno Selecionado */}
      <div className="student-selector-card">
         <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=andrej" alt="Andrej" className="student-avatar-mini" />
         <div className="student-info-flex">
            <p className="student-name">Andrej Provisorczyk</p>
            <p className="student-meta">3º Ano A • Sala 04</p>
         </div>
         <div className="status-dot-online"></div>
      </div>

      <main className="app-content">
         {/* Tabs de Navegação */}
         <nav className="app-tabs">
            <button className={activeTab === 'comms' ? 'active' : ''} onClick={() => setActiveTab('comms')}>
               <MessageSquare size={20} />
               <span>Mensagens</span>
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
               <span>Evidências</span>
            </button>
            <button className={activeTab === 'lifecycle' ? 'active' : ''} onClick={() => setActiveTab('lifecycle')}>
               <Calendar size={20} />
               <span>Jornada</span>
            </button>
         </nav>

         <div className="tab-pane animate-fade-in">
            {activeTab === 'comms' && (
               <div className="messages-list">
                  <div className="msg-card unread">
                     <header className="msg-header">
                        <span className="channel-tag gen">Comunicados Gerais</span>
                        <span className="msg-time">10:45</span>
                     </header>
                     <p className="msg-text">Olá famílias! Amanhã teremos a nossa Feira de Ciências. Não esqueçam os aventais!</p>
                     <div className="msg-actions">
                        <button className="poll-btn">Confirmar Presença</button>
                     </div>
                  </div>

                  <div className="msg-card">
                     <header className="msg-header">
                        <span className="channel-tag ped">Coordenação</span>
                        <span className="msg-time">Ontem</span>
                     </header>
                     <p className="msg-text">O relatório pedagógico da aula de robótica já está disponível no portfólio.</p>
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
                        <span className="value">SALA DE AULA 04</span>
                     </div>
                  </div>

                  <div className="recent-portaria-logs">
                     <h4 className="log-header">Últimas Passagens</h4>
                     <div className="log-item">
                        <div className="log-icon"><div className="in-arrow"></div></div>
                        <div className="log-content-flex">
                           <p className="log-title">Entrada Confirmada</p>
                           <p className="log-meta">07:05 • Via Reconhecimento Facial</p>
                        </div>
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
                  <EvolutionaryDashboard 
                     studentName="Andrej Provisorczyk" 
                     history={lifecycleData.history} 
                  />
               </div>
            )}
         </div>
      </main>

      {/* Footer / Barra de Chat Permanente */}
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
