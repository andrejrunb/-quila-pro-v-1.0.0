import React, { useState, useEffect } from 'react';
import { councilService, Proposal, SovereignRole } from '../../services/SovereignCouncilService';
import { HexCellCard } from './HexCellCard';
import '../styles/CoolmeiaUX.css';

/**
 * COUNCIL ROOM (SALA DO CONSELHO) v4001
 * ------------------------------------
 * Espaço de Governança Soberana onde a Direção e Coordenação
 * avaliam propostas da IA e lançam enquetes segmentadas.
 */

export const CouncilRoom: React.FC = () => {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [activeTab, setActiveTab] = useState<'pending' | 'active' | 'closed' | 'impact'>('pending');
  const [userRole, setUserRole] = useState<SovereignRole>('DIRECTOR'); // Simulação de Login

  useEffect(() => {
    loadProposals();
  }, [activeTab]);

  const loadProposals = async () => {
    // Carrega propostas com dados de impacto via JOIN
    const sql = `
      SELECT p.*, l.final_impact_score, l.initial_risk_score, l.target_data_json as impact_targets
      FROM proposals_votecasting p
      LEFT JOIN governance_impact_links l ON p.id = l.proposal_id
      ORDER BY p.createdAt DESC
    `;
    const all = await (window as any).api.db.all(sql);
    
    setProposals(all.map((p: any) => ({
      ...p,
      scientific_grounds: JSON.parse(p.scientific_grounds || '[]'),
      target_roles: JSON.parse(p.target_roles || '[]'),
      impact_targets: p.impact_targets ? JSON.parse(p.impact_targets) : []
    })));
  };

  const handleWhitelist = async (id: string) => {
    await (window as any).api.councilService.whitelistByDirector(id, 'admin_01');
    loadProposals();
  };

  const handleActivate = async (id: string) => {
    await (window as any).api.councilService.activatePoll(id, userRole);
    loadProposals();
  };

  return (
    <div className="council-room-container coolmeia-command-center">
      <header className="cockpit-header">
        <div className="brand-group">
           <h2 className="hive-title">SALA DO CONSELHO (v5001)</h2>
           <p className="hive-subtitle">GOVERNANÇA SOBERANA & VOTAÇÃO ADAPTATIVA</p>
        </div>
        <div className="hive-badge-group">
           <button className="btn-sovereign btn-ai-suggest" onClick={async () => {
             await (window as any).api.councilService.generateAiProposal('social');
             loadProposals();
           }}>
             GERAR SUGESTÃO IA 🧠
           </button>
           <div className="hive-badge">SOVEREIGN MODE: {userRole}</div>
        </div>
      </header>

      <nav className="council-tabs">
         <button className={activeTab === 'pending' ? 'active' : ''} onClick={() => setActiveTab('pending')}>
           PENDENTES ({proposals.filter(p => p.status === 'draft' || p.status === 'whitelisted').length})
         </button>
         <button className={activeTab === 'active' ? 'active' : ''} onClick={() => setActiveTab('active')}>
           EM VOTAÇÃO ({proposals.filter(p => p.status === 'active').length})
         </button>
         <button className={activeTab === 'impact' ? 'active' : ''} onClick={() => setActiveTab('impact')}>
           IMPACTO IA ({proposals.filter(p => p.final_impact_score !== null).length})
         </button>
      </nav>

      <div className="council-grid">
         {proposals
           .filter(p => {
             if (activeTab === 'pending') return p.status === 'draft' || p.status === 'whitelisted';
             if (activeTab === 'active') return p.status === 'active';
             if (activeTab === 'impact') return p.final_impact_score !== null;
             return false;
           })
           .map((proposal: any) => (
             <div key={proposal.id} className="proposal-hex-row">
                <HexCellCard 
                   title={proposal.title} 
                   subtitle={`${proposal.author_type.toUpperCase()} | ${proposal.status.toUpperCase()}`}
                   status={proposal.status === 'whitelisted' || proposal.status === 'closed' ? 'sync' : 'alert'}
                   icon={proposal.author_type === 'ai' ? '🧠' : '👤'}
                />
                
                <div className="proposal-details">
                   <p className="proposal-desc">{proposal.description}</p>
                   
                   {proposal.final_impact_score !== null && (
                     <div className="impact-indicator">
                        <span className="impact-label">EFICÁCIA DA DECISÃO:</span>
                        <span className={`impact-value ${proposal.final_impact_score > 0 ? 'positive' : 'negative'}`}>
                           {proposal.final_impact_score > 0 ? '↑' : '↓'} {(proposal.final_impact_score * 100).toFixed(1)}%
                        </span>
                        <span className="impact-meta">Alvos: {proposal.impact_targets?.length || 0} alunos</span>
                     </div>
                   )}

                   <div className="scientific-grounds-list">
                      {proposal.scientific_grounds.map((g: string, i: number) => (
                        <span key={i} className="ground-pill">{g}</span>
                      ))}
                   </div>
                   
                   <div className="authoritative-actions">
                      {userRole === 'DIRECTOR' && proposal.status === 'draft' && (
                        <button className="btn-sovereign btn-approve" onClick={() => handleWhitelist(proposal.id)}>
                          WHITELIST SOBERANA
                        </button>
                      )}
                      
                      {(userRole === 'DIRECTOR' || userRole === 'COORDINATOR') && proposal.status === 'whitelisted' && (
                        <button className="btn-sovereign btn-activate" onClick={() => handleActivate(proposal.id)}>
                          ATIVAR ENQUETE ({proposal.target_roles.join(', ')})
                        </button>
                      )}
                      
                      {proposal.status !== 'closed' && (
                        <button className="btn-sovereign btn-veto">VETAR</button>
                      )}
                   </div>
                </div>
             </div>
           ))
         }
      </div>

      <footer className="cockpit-footer">
          <p>AUDITORIA SOBERANA: {new Date().toLocaleDateString()} | STATUS: {userRole} LOGIN ACTIVE | MATURITY: LVL 5</p>
      </footer>
    </div>
  );
};

