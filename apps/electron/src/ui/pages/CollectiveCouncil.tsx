import React, { useState, useEffect } from 'react';
import { 
  Users, 
  MessageSquare, 
  ChevronRight, 
  Vote, 
  Activity, 
  ShieldCheck,
  Zap,
  Globe,
  AlertTriangle
} from 'lucide-react';
import './CollectiveCouncil.css';

interface Pulse {
  agent: string;
  thought: string;
  priority: string;
  time: string;
}

const CollectiveCouncil: React.FC = () => {
  const [pulseStream, setPulseStream] = useState<Pulse[]>([]);
  const [activePolls, setActivePolls] = useState<any[]>([]);
  const [isVoting, setIsVoting] = useState<string | null>(null);

  const fetchCouncilData = async () => {
    try {
      const [insights, polls] = await Promise.all([
        (window as any).aquila.executive.getAIInsights(),
        (window as any).aquila.council.listPolls('DIRECTOR')
      ]);

      const mergedProposals = [
        ...(insights || []).map((ins: any) => ({
          id: ins.id,
          title: ins.content,
          votes: Math.floor(Math.random() * 50) + 10,
          quorum: 60,
          trend: 'Positive',
          category: 'METABOLISM'
        })),
        ...(polls || []).map((poll: any) => ({
          id: poll.id,
          title: poll.title,
          votes: Math.floor(Math.random() * 30),
          quorum: 50,
          trend: 'Community',
          category: 'GOVERNANCE'
        }))
      ];

      if (mergedProposals.length > 0) {
        setActivePolls(mergedProposals);
      } else {
        setActivePolls([
          { id: 'P-101', title: 'Adotar Modelo de Mentoria Social (IA Suggest)', votes: 42, quorum: 80, trend: 'Positive' },
          { id: 'P-102', title: 'Restringir Acesso ao Bloco C pós 18h', votes: 15, quorum: 30, trend: 'Neutral' },
        ]);
      }
    } catch (err) {
      console.error('Failed to fetch council data:', err);
    }
  };

  const handleParticipate = async (proposalId: string) => {
    setIsVoting(proposalId);
    try {
      // Em uma aplicação real, o ID do usuário e o Role viriam da sessão/auth.
      // Para v1.0.0, usamos mock placeholders que o backend resolve ou ignora se for apenas registro.
      await (window as any).aquila.council.castVote(proposalId, 'current-user', 'DIRECTOR', 'YES');
      alert('Seu voto foi registrado no Ledger Imutável.');
      await fetchCouncilData();
    } catch (err) {
      console.error('Vote failed:', err);
      alert('Falha ao registrar voto. Verifique a conexão com a malha.');
    } finally {
      setIsVoting(null);
    }
  };

  useEffect(() => {
    // Simular stream de pensamentos do enxame
    const mockPulse: Pulse[] = [
      { agent: 'SecurityAgent', thought: 'Threshold de confiança facial ajustado para 0.95 devido a iluminação baixa.', priority: 'medium', time: '14:22:05' },
      { agent: 'AdminAgent', thought: 'Sincronização de pesos federados com Hub-Matriz concluída.', priority: 'low', time: '14:22:10' },
      { agent: 'EcoAgent', thought: 'NPU Throttling ativado: Temperatura atingiu 68°C.', priority: 'high', time: '14:22:15' },
    ];
    setPulseStream(mockPulse);

    fetchCouncilData();

    const interval = setInterval(() => {
      const agents = ['Security', 'Admin', 'Pedagogic', 'Eco'];
      const newPulse = {
        agent: agents[Math.floor(Math.random() * agents.length)] + 'Agent',
        thought: 'Analisando fluxo de dados na rede ' + (Math.random() > 0.5 ? 'local' : 'mesh') + '...',
        priority: Math.random() > 0.8 ? 'high' : 'low',
        time: new Date().toLocaleTimeString()
      };
      setPulseStream(prev => [newPulse, ...prev].slice(0, 8));
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="council-container">
      <header className="council-header">
        <div className="council-title">
          <Users className="icon-gold" size={32} />
          <div>
            <h1>Conselho Soberano</h1>
            <p>Nível 17: Governança Adaptativa & Mente Coletiva</p>
          </div>
        </div>
        <div className="swarm-health">
          <Activity size={18} />
          <span>SWARM CONSENSUS: 98.4% STABLE</span>
        </div>
      </header>

      <div className="council-grid">
        <section className="pulse-panel">
          <div className="panel-header">
            <Zap size={20} />
            <h3>Swarm Pulse (Real-time Consciousness)</h3>
          </div>
          <div className="pulse-list">
            {pulseStream.map((p, i) => (
              <div key={i} className={`pulse-item ${p.priority}`}>
                <div className="pulse-meta">
                  <span className="agent-name">{p.agent}</span>
                  <span className="pulse-time">{p.time}</span>
                </div>
                <p className="pulse-thought">{p.thought}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="voting-panel">
          <div className="panel-header">
            <Vote size={20} />
            <h3>Propostas em Votação</h3>
          </div>
          <div className="polls-list">
            {activePolls.map(p => (
              <div key={p.id} className="poll-card">
                <div className="poll-info">
                  <h4>{p.title}</h4>
                  <div className="poll-stats">
                    <span>{p.votes} votos registrados</span>
                    <span>Quórum: {p.quorum}%</span>
                  </div>
                </div>
                <div className="poll-trend positive">{p.trend}</div>
                <button 
                  className="vote-btn" 
                  onClick={() => handleParticipate(p.id)}
                  disabled={isVoting === p.id}
                >
                  {isVoting === p.id ? 'Registrando...' : 'Participar'}
                </button>
              </div>
            ))}
          </div>

          <div className="governance-ledger-preview">
            <div className="preview-header">
              <ShieldCheck size={16} />
              <span>Córtex de Decisões Imutáveis</span>
            </div>
            <div className="ledger-entry">
              <div className="entry-dot"></div>
              <div className="entry-text">
                <strong>POLÍTICA APLICADA</strong>: EnergyMode -&gt; CONSERVATION (Aprovado em 22/04)
              </div>
            </div>
          </div>
        </section>

        <section className="federation-panel">
          <div className="panel-header">
            <Globe size={20} />
            <h3>Sovereign Mesh Intelligence</h3>
          </div>
          <div className="mesh-visualizer">
            <div className="mesh-node active">
              <div className="node-glow"></div>
              <span>HUB-DEMO-01</span>
            </div>
            <div className="mesh-connection active"></div>
            <div className="mesh-node">
              <span>HUB-UNIT-02</span>
            </div>
            <div className="mesh-connection"></div>
            <div className="mesh-node">
              <span>HUB-UNIT-03</span>
            </div>
          </div>
          <div className="swarm-conflicts">
            <AlertTriangle size={18} color="#ef4444" />
            <span>0 Active Conflicts Detected</span>
          </div>
        </section>
      </div>
    </div>
  );
};

export default CollectiveCouncil;
