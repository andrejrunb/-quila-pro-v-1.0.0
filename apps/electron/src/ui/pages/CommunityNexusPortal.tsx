import React, { useState, useEffect } from 'react';
import { 
  Users, 
  MessageSquare, 
  Heart, 
  Send, 
  TrendingUp, 
  Coffee,
  BellRing,
  CheckCircle
} from 'lucide-react';
import './CommunityNexusPortal.css';

const CommunityNexusPortal: React.FC = () => {
  const [predictions, setPredictions] = useState<any[]>([]);

  const fetchEngagement = async () => {
    try {
      const p = await (window as any).aquila.invoke('nexus:get-engagement', { classId: 'TURMA_7B' });
      setPredictions(p);
    } catch (err) {
      console.error('Erro ao carregar engajamento comunitário:', err);
    }
  };

  const sendUpdate = async (familyId: string) => {
    await (window as any).aquila.invoke('nexus:send-proactive-update', { 
      parentId: familyId, 
      topic: 'ACADEMIC',
      message: 'Olá! Notamos o excelente progresso no projeto de IA. Parabéns!'
    });
    alert('Atualização enviada com sucesso!');
  };

  useEffect(() => {
    fetchEngagement();
  }, []);

  return (
    <div className="nexus-container">
      <header className="nexus-header">
        <div className="flex items-center gap-4">
          <Users size={32} className="text-orange-400" />
          <div>
            <h1>Community Nexus</h1>
            <p>Simbiose Escola-Família & Engajamento Proativo — Nível 43</p>
          </div>
        </div>
      </header>

      <div className="nexus-grid">
        {/* Radar de Preocupações (Preditivo) */}
        <section className="engagement-radar glass-panel">
           <h3><TrendingUp size={18} /> Radar de Engajamento Preditivo</h3>
           <div className="family-list">
              {predictions.map((p, i) => (
                <div key={i} className="family-card">
                   <div className="f-header">
                      <strong>Família {p.familyId}</strong>
                      <div className={`score-badge ${p.concernScore > 70 ? 'high' : 'low'}`}>
                         Interesse: {p.concernScore}%
                      </div>
                   </div>
                   <p className="likely-topic">Tópico Provável: {p.likelyTopic}</p>
                   <div className="action-suggestion">
                      <Coffee size={14} className="text-orange-400" />
                      <span>{p.suggestedAction}</span>
                   </div>
                   <button className="proactive-btn" onClick={() => sendUpdate(p.familyId)}>
                      <Send size={14} /> Enviar Nota Proativa
                   </button>
                </div>
              ))}
           </div>
        </section>

        {/* Feed de Comunicação Simbiótica */}
        <main className="symbiosis-feed glass-panel">
           <h3><MessageSquare size={18} /> Fluxo de Simbiose (Últimas 24h)</h3>
           <div className="feed-list">
              <div className="feed-item">
                 <BellRing size={16} className="text-blue-400" />
                 <div className="fi-content">
                    <strong>Pai STU-123</strong>
                    <p>Visualizou o relatório de bem-estar matinal.</p>
                 </div>
                 <span className="time">10m atrás</span>
              </div>
              <div className="feed-item">
                 <Heart size={16} className="text-rose-400" />
                 <div className="fi-content">
                    <strong>Mãe STU-456</strong>
                    <p>Enviou agradecimento pela atualização proativa sobre postura.</p>
                 </div>
                 <span className="time">1h atrás</span>
              </div>
              <div className="feed-item">
                 <CheckCircle size={16} className="text-emerald-400" />
                 <div className="fi-content">
                    <strong>Portal Nexus</strong>
                    <p>Consenso atingido: 92% das famílias engajadas no novo currículo.</p>
                 </div>
                 <span className="time">Hoje</span>
              </div>
           </div>
        </main>
      </div>

      <footer className="nexus-footer">
         <Users size={14} className="text-orange-400" />
         <span>Parent-School Symbiosis: Fortalecendo laços através da inteligência transparente.</span>
      </footer>
    </div>
  );
};

export default CommunityNexusPortal;
