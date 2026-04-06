import React, { useState, useEffect } from 'react';
import { parentPortal } from '../../services/ParentPortalService';
import { councilService, Proposal } from '../../services/SovereignCouncilService';
import { nexusSyncService } from '../../services/NexusSyncService';
import './MobileParentPortal.css';

/**
 * MOBILE PARENT PORTAL (v4002 - Nexus Companion)
 * ---------------------------------------------
 * Interface de acompanhamento soberano para pais.
 * Integração de segurança passiva, progresso RPG e governança.
 */

export const MobileParentPortal: React.FC = () => {
  const [studentId] = useState('demo_student_001');
  const [parentId] = useState('parent_001');
  const [digest, setDigest] = useState<any>(null);
  const [activePolls, setActivePolls] = useState<Proposal[]>([]);
  const [swarmHealth, setSwarmHealth] = useState(100);

  useEffect(() => {
    loadParentData();
    const interval = setInterval(loadParentData, 10000);
    return () => clearInterval(interval);
  }, []);

  const loadParentData = async () => {
    const studentDigest = await parentPortal.getStudentDigest(studentId);
    const polls = await councilService.listActivePollsForRole('PARENT');
    const nodes = nexusSyncService.getNodes();
    const health = nodes.length > 0 ? (nodes.filter(n => n.syncStatus === 'synced').length / nodes.length) * 100 : 100;

    setDigest(studentDigest);
    setActivePolls(polls);
    setSwarmHealth(health);
  };

  const handleParentVote = async (proposalId: string, choice: string) => {
    await councilService.castVote(proposalId, parentId, 'PARENT', choice);
    loadParentData();
  };

  return (
    <div className="parent-portal-nexus animate-fade">
      <header className="nexus-mobile-header">
        <h2 className="nexus-mobile-title">ÁQUILA MOBILE</h2>
        <span className="nexus-mobile-subtitle">CONECTADO AO ENXAME NEXUS | v4002</span>
      </header>

      {/* STUDENT PROGRESS (RPG MIRROR) */}
      <section className="student-pulse-card">
         <div className="nexus-avatar-mini">
            <span className="nexus-avatar-icon">🛡️</span>
         </div>
         <h4 className="nexus-gold">STATUS: {digest?.growthStatus || 'INVESTIGANDO...'}</h4>
         <div className="nexus-xp-bar">
            <div className="nexus-xp-fill" style={{ '--nexus-progress': '75%' } as any}></div>
         </div>
         <p className="nexus-mobile-subtitle">NÍVEL 12 • 12,450 XP ACUMULADO</p>
      </section>

      {/* SOVEREIGN VOTE (GOVERNANÇA) */}
      <section className="mobile-governance-section">
         <h3 className="mobile-section-title">⚖️ DECISÕES DO CONSELHO</h3>
         {activePolls.length > 0 ? activePolls.map(poll => (
           <div key={poll.id} className="vote-item-mobile">
              <h4>{poll.title}</h4>
              <p>{poll.description}</p>
              <div className="mobile-vote-actions">
                 <button className="btn-parent-yes" onClick={() => handleParentVote(poll.id, 'YES')}>APOIAR (XP+)</button>
                 <button className="btn-parent-no" onClick={() => handleParentVote(poll.id, 'NO')}>OBJETAR</button>
              </div>
           </div>
         )) : (
           <div className="no-polls-card text-center opacity-5">Nenhuma enquete familiar ativa.</div>
         )}
      </section>

      {/* SAFETY RADAR (PASSIVE SAFETY) */}
      <section className="safety-radar-mobile">
         <h3 className="mobile-section-title">🛰️ RADAR DE SEGURANÇA (WiFi Dense Pose)</h3>
         <div className="safety-radar-pulse">
            <div className="radar-info">
               <strong>STATUS ÁQUILA</strong>
               <p className="radar-status-text">Proteção Total Sintonizada (CSI 2.6Ghz)</p>
            </div>
            <div className="status-dot-group">
               <div className="status-dot"></div>
            </div>
         </div>
      </section>

      {/* SWARM HEALTH */}
      <footer className="nexus-mobile-footer">
         <div className="footer-health-text">RESILIÊNCIA DO ENXAME: {Math.round(swarmHealth)}%</div>
         <div className="nexus-xp-bar footer-progress-bar">
            <div className="nexus-xp-fill" style={{ '--nexus-progress': `${swarmHealth}%` } as any}></div>
         </div>
      </footer>
    </div>
  );
};

export default MobileParentPortal;
