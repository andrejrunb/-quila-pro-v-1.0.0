import React, { useState, useEffect } from 'react';
import { 
  Users, AlertTriangle, Clock, 
  UserMinus, ShieldAlert, Monitor
} from 'lucide-react';
import './CoordinationTV.css';

/**
 * CoordinationTV (v1634)
 * Dashboard para TVs em ambientes de coordenação/sala de professores.
 */
export const CoordinationTV: React.FC = () => {
  const [stats, setStats] = useState({
    totalStudents: 1200,
    inClassCount: 1050,
    outOfClass: 15,
    delayedEntry: 8
  });

  const redMarkedStudents = [
    { name: 'Enzo S.', room: 'SALA 08', issue: 'Saída não autorizada (Cantina)', time: '14:32' },
    { name: 'Giovana M.', room: 'SALA 04', issue: 'Atraso recorrente (15min+)', time: '14:28' },
    { name: 'Lucas F.', room: 'PÁTIO', issue: 'Comportamento inadequado detectado', time: '14:15' }
  ];

  const postureAlerts = [
    { type: 'Corrida Brusca', location: 'CORREDOR B', time: '14:35', severity: 'low' },
    { type: 'Aglomeração Detectada', location: 'ÁREA EXTERNA', time: '14:31', severity: 'medium' }
  ];

  const inClassPercentage = Math.round((stats.inClassCount / stats.totalStudents) * 100);


  return (
    <div className="coordination-tv-container">
      <header className="tv-header">
         <div className="tv-logo-group">
            <Monitor size={48} className="tv-icon-blue" />
            <div>
               <h1 className="tv-main-title">COMANDO ÁQUILA</h1>
               <p className="subtitle">MONITORAMENTO CENTRAL DE COORDENAÇÃO</p>
            </div>
         </div>
         <div className="live-clock">
            {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            <span className="live-pulse"></span>
         </div>
      </header>

      <div className="tv-grid">
         {/* Stats Principais */}
         <section className="stats-panel">
            <div className="main-stat-card">
               <div className="stat-value">{inClassPercentage}%</div>
               <div className="stat-label">ALUNOS EM SALA</div>
                <div className="progress-bar-bg">
                   <div 
                     className="progress-bar-fill" 
                     style={{ '--progress-width': `${inClassPercentage}%` } as React.CSSProperties}
                   />
                </div>
            </div>

            <div className="mini-stats">
               <div className="stat-box highlight-yellow">
                  <Clock size={32} />
                  <span className="val">{stats.delayedEntry}</span>
                  <span className="lab">ATRASO ENTRADA</span>
               </div>
               <div className="stat-box highlight-orange">
                  <UserMinus size={32} />
                  <span className="val">{stats.outOfClass}</span>
                  <span className="lab">FORA DE SALA</span>
               </div>
            </div>
         </section>

         {/* Alunos Marcados em Vermelho (Zero-Debt Standard) */}
         <section className="alerts-panel">
            <header className="panel-header">
               <ShieldAlert size={24} className="tv-icon-red" />
               <h2 className="tv-panel-title">OCORRÊNCIAS CRÍTICAS (MARCADOS EM VERMELHO)</h2>
            </header>
            
            <div className="alert-list">
               {redMarkedStudents.map((student, idx) => (
                  <div key={idx} className="alert-item animate-pulse-subtle">
                     <div className="alert-time">{student.time}</div>
                     <div className="alert-info">
                        <p className="student-name">{student.name}</p>
                        <p className="student-issue">{student.issue}</p>
                     </div>
                     <div className="alert-room">{student.room}</div>
                  </div>
               ))}
            </div>
         </section>
      </div>

      {/* Alertas de Postura (Phase 402) */}
      <section className="posture-panel">
        <header className="panel-header">
           <ShieldAlert size={24} className="tv-icon-blue" />
           <h2 className="tv-panel-title">INTELIGÊNCIA DE POSTURA (IA)</h2>
        </header>
        <div className="posture-list">
          {postureAlerts.map((p, i) => (
            <div key={i} className={`posture-item severity-${p.severity}`}>
               <div className="posture-marker"></div>
               <div className="posture-details">
                  <span className="p-type">{p.type}</span>
                  <span className="p-loc">{p.location}</span>
               </div>
               <div className="p-time">{p.time}</div>
            </div>
          ))}
        </div>
      </section>

      <footer className="tv-footer">
         <div className="status-marquee">
            <span>[INFO] ENTRADA: 98% CONCLUÍDA</span>
            <span>[ALERTA] TROCA DE PROFESSOR EM 3 MINUTOS (BLOCO B)</span>
            <span>[INFO] RECREIO ESCALONADO INICIA EM 15 MIN</span>
         </div>
      </footer>
    </div>
  );
};
