import React, { useState, useEffect } from 'react';
import { 
  Zap, 
  Target, 
  RefreshCw, 
  ExternalLink, 
  Trophy,
  Cpu,
  Users
} from 'lucide-react';
import './SerendipityCockpit.css';

const SerendipityCockpit: React.FC = () => {
  const [sparks, setSparks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchSparks = async () => {
    setLoading(true);
    try {
      const s = await (window as any).aquila.invoke('serendipity:get-sparks');
      setSparks(s);
    } catch (err) {
      console.error('Erro ao buscar faíscas:', err);
    } finally {
      setLoading(false);
    }
  };

  const claimOpportunity = async (id: string) => {
    const res = await (window as any).aquila.invoke('serendipity:claim-opportunity', { sparkId: id });
    if (res.success) {
      alert(`Oportunidade ativada: ${res.action}`);
      fetchSparks();
    }
  };

  useEffect(() => {
    fetchSparks();
  }, []);

  return (
    <div className="serendipity-container">
      <header className="serendipity-header">
        <div className="flex items-center gap-4">
          <Zap size={32} className="text-cyan-400 animate-pulse" />
          <div>
            <h1>Institutional Serendipity</h1>
            <p>Faíscas de Oportunidade & Inovação — Nível 47</p>
          </div>
        </div>
        <button className="refresh-btn" onClick={fetchSparks} disabled={loading}>
           <RefreshCw size={18} className={loading ? 'animate-spin' : ''} /> Escanear Ecossistema
        </button>
      </header>

      <div className="serendipity-grid">
        {/* Lista de Faíscas Ativas */}
        <main className="sparks-main">
           <div className="grid-cards">
              {sparks.map((spark, i) => (
                <div key={i} className={`spark-card glass-panel type-${spark.type?.toLowerCase() || ''}`}>
                   <div className="spark-glow"></div>
                   <div className="s-header">
                      <span className="type-tag">{spark.type}</span>
                      <div className="relevance-meter">
                         <Target size={12} /> {spark.relevance}% Match
                      </div>
                   </div>
                   <h3>{spark.title}</h3>
                   <p>{spark.description}</p>
                   <button className="activate-btn" onClick={() => claimOpportunity(spark.id)}>
                      Ativar Conexão <ExternalLink size={14} />
                   </button>
                </div>
              ))}
           </div>
        </main>

        {/* Dashboard de Impacto de Serendipidade */}
        <aside className="serendipity-aside">
           <div className="glass-panel impact-card">
              <h3>Impacto Acumulado</h3>
              <div className="stat">
                 <Trophy size={24} className="text-amber-400" />
                 <div>
                    <strong>12 Projetos</strong>
                    <span>Iniciados por faíscas</span>
                 </div>
              </div>
              <div className="stat">
                 <Users size={24} className="text-blue-400" />
                 <div>
                    <strong>85 Conexões</strong>
                    <span>Interdisciplinares criadas</span>
                 </div>
              </div>
           </div>

           <div className="glass-panel engine-status">
              <h3>Status do Opportunity Engine</h3>
              <div className="engine-line">
                 <Cpu size={16} />
                 <span>Processando 4k eventos/seg</span>
              </div>
              <div className="engine-line">
                 <Zap size={16} className="text-cyan-400" />
                 <span>Sensibilidade de Sinergia: ALTA</span>
              </div>
           </div>
        </aside>
      </div>

      <footer className="serendipity-footer">
         <Zap size={14} className="text-cyan-400" />
         <span>Institutional Serendipity: Transformando coincidências em progresso real.</span>
      </footer>
    </div>
  );
};

export default SerendipityCockpit;
