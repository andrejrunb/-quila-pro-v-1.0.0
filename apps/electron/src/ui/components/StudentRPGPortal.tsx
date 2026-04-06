import React, { useState, useEffect } from 'react';
import './StudentRPGPortal.css';

interface Achievement {
  id: string;
  icon: string;
  title: string;
  description: string;
  progress: number;
}

const ACHIEVEMENTS: Achievement[] = [
  { id: '1', icon: '🔥', title: 'Sequência Imbatível', description: '7 dias estudando sem parar', progress: 80 },
  { id: '2', icon: '🧠', title: 'Mestre do RAG', description: 'Realizou 50 buscas inteligentes', progress: 40 },
  { id: '3', icon: '⚔️', title: 'Duelista SRS', description: 'Venceu 10 revisões perfeitas', progress: 100 },
  { id: '4', icon: '🏰', title: 'Guardian do Enxame', description: 'Nó secundário ativo por 24h', progress: 60 },
];

import SovereignShop from './SovereignShop';
import SovereignAvatar from './SovereignAvatar';
import { NeuroUXService } from '../../services/NeuroUXService';
import { learningPodService } from '../../services/LearningPodService';
import { adaptiveQuizService } from '../../services/AdaptiveQuizService';
import { councilService, Proposal } from '../../services/SovereignCouncilService';

const StudentRPGPortal: React.FC = () => {
  const [economy, setEconomy] = useState<any>(null);
  const [activePolls, setActivePolls] = useState<Proposal[]>([]);
  const [learningPods, setLearningPods] = useState<any[]>([]);
  const [showShop, setShowShop] = useState(false);
  const [studentId] = useState('demo_student_001');

  useEffect(() => {
    loadEconomy();
    loadGovernance();
    loadLearningContent();
    const neuroUX = new NeuroUXService();
  }, []);

  const loadEconomy = async () => {
    try {
      const data = await (window as any).electron.invoke('get-student-economy', studentId);
      setEconomy(data);
    } catch (err) {
      console.error('Failed to load student economy:', err);
    }
  };

  const loadGovernance = async () => {
    const polls = await councilService.listActivePollsForRole('STUDENT');
    setActivePolls(polls);
  };

  const loadLearningContent = async () => {
    const pods = await learningPodService.listPodsForStudent(studentId);
    setLearningPods(pods);
  };

  const handleVote = async (id: string, choice: string) => {
    await councilService.castVote(id, studentId, 'STUDENT', choice);
    loadGovernance();
  };

  return (
    <div className="student-portal-main">
      <header className="rpg-header">
        <div className="rpg-profile">
          <div className="rpg-avatar-wrapper" onClick={() => setShowShop(true)}>
            <div className="rpg-avatar-new">
              <SovereignAvatar 
                seed={studentId} 
                state={economy?.balance > 1000 ? 'focus' : 'normal'} // Simulação de estado baseada em saldo ou Neuro-UX
                size={80}
              />
            </div>
          </div>
          <div className="rpg-name-info">
            <h2>Aluno Soberano</h2>
            <div className="rpg-title">Nível {economy?.level || 1} • {economy?.xp || 0} XP Acumulado</div>
          </div>
          <button className="hub-btn hub-btn-accent hub-btn-portal" onClick={() => setShowShop(true)}>
            MERCADO 💎
          </button>
        </div>

        <div className="xp-container">
          <div className="xp-label">
            <span>PROGRESSO DE NÍVEL</span>
            <span>{(economy?.xp % 1000) / 10} %</span>
          </div>
          <div className="xp-bar-bg">
            <div className="xp-bar-fill" style={{ '--rpg-progress': `${(economy?.xp % 1000) / 10}%` } as any}></div>
          </div>
        </div>
      </header>

      {activePolls.length > 0 && (
        <section className="portal-section governance-missions">
           <h3 className="rpg-title">⚖️ MISSÕES DO CONSELHO (Sovereign Vote)</h3>
           <div className="voting-mesh-grid">
              {activePolls.map(poll => (
                <div key={poll.id} className="vote-card hex-card-small">
                   <h4>{poll.title}</h4>
                   <p>{poll.description}</p>
                   <div className="vote-actions">
                      <button className="btn-vote-yes" onClick={() => handleVote(poll.id, 'YES')}>APOIAR (XP+)</button>
                      <button className="btn-vote-no" onClick={() => handleVote(poll.id, 'NO')}>OBJETAR</button>
                   </div>
                </div>
              ))}
           </div>
        </section>
      )}

      <section className="portal-section learning-pods">
         <h3 className="rpg-title">🧠 CÁPSULAS DE AULA (Grounding AI)</h3>
         <div className="pods-grid">
            {learningPods.map(pod => (
              <div key={pod.id} className="pod-hex-cell" onClick={() => {/* Open Pod */}}>
                 <div className="pod-icon">🎙️</div>
                 <div className="pod-info">
                    <strong>{pod.subject}</strong>
                    <span>COLETA: {new Date(pod.created_at).toLocaleDateString()}</span>
                 </div>
              </div>
            ))}
         </div>
      </section>

      <section className="portal-section quest-arcade">
         <h3 className="rpg-title">⚔️ ARCADE DE QUESTS (XP MULTIPLIER)</h3>
         <div className="arcade-grid">
            <div className="quest-card q-bronze" onClick={() => {/* Start Quiz */}}>
               <div className="q-badge">BRONZE</div>
               <h4>FIXAÇÃO RÁPIDA</h4>
            </div>
            <div className="quest-card q-gold">
               <div className="q-badge">GOLD</div>
               <h4>MASTER ENXAME</h4>
            </div>
         </div>
      </section>

      <section className="achievements-section">
        <h3 className="rpg-title margin-bottom-24">Conquistas da Temporada</h3>
        <div className="achievements-grid">
          {ACHIEVEMENTS.map(ach => (
            <div key={ach.id} className="achievement-card">
              <div className="achievement-icon">{ach.icon}</div>
              <div className="achievement-title">{ach.title}</div>
              <div className="achievement-desc">{ach.description}</div>
              <div className="xp-bar-bg" style={{ height: '4px', marginTop: '16px' }}>
                <div className="xp-bar-fill" style={{ width: `${ach.progress}%`, background: 'var(--rpg-accent)' }}></div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default StudentRPGPortal;
