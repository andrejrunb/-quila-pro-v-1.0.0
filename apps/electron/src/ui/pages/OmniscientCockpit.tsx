import React, { useState, useEffect } from 'react';
import { 
  Zap, 
  Brain, 
  ShieldCheck, 
  TrendingUp, 
  Activity, 
  Globe, 
  MessageSquare,
  AlertCircle,
  Eye,
  Lock,
  WifiOff
} from 'lucide-react';
import './OmniscientCockpit.css';

const FALLBACK_ISI = {
  score: 0.72,
  metrics: { affectivePulse: 0.65, operationalHealth: 0.88, pedagogicalMomentum: 0.63 },
  offline: true,
};

const FALLBACK_ADVICES = [
  'Aumente a frequência de relatórios para coordenadores — melhora a visibilidade pedagógica.',
  'Considere adicionar câmeras no pátio externo para cobertura completa.',
  'O módulo de WhatsApp ainda não está ativo — ative para comunicação automática com pais.',
];

const OmniscientCockpit: React.FC = () => {
  const [isi, setIsi] = useState<any>(null);
  const [advices, setAdvices] = useState<string[]>([]);
  const [activeLayer, setActiveLayer] = useState<string>('CORE');
  const [isOffline, setIsOffline] = useState(false);

  const fetchData = async () => {
    try {
      const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 5000));
      
      const [sentience, ads] = await Promise.all([
        Promise.race([
          (window as any).aquila.invoke('cortex:get-sentience'),
          timeoutPromise,
        ]),
        Promise.race([
          (window as any).aquila.invoke('cortex:get-advice'),
          timeoutPromise,
        ]),
      ]);
      
      // Validação profunda dos dados recebidos
      if (sentience && typeof sentience === 'object' && !sentience.error) {
        setIsi(sentience);
        setIsOffline(false);
      } else {
        throw new Error('Invalid sentience payload');
      }

      if (Array.isArray(ads)) {
        setAdvices(ads);
      } else {
        setAdvices(FALLBACK_ADVICES);
      }

    } catch (err) {
      console.warn('Córtex offline ou instável, usando dados de fallback:', err);
      setIsi(FALLBACK_ISI);
      setAdvices(FALLBACK_ADVICES);
      setIsOffline(true);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  if (!isi) return <div className="zenith-loading">Iniciando Sincronização Transcendente...</div>;

  return (
    <div className="cockpit-container">
      <header className="cockpit-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
           <div className="isi-gauge">
              <svg width="80" height="80" viewBox="0 0 100 100">
                 <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="5" />
                 <circle 
                    cx="50" cy="50" r="45" 
                    fill="none" 
                    stroke={isOffline ? '#f59e0b' : '#3b82f6'} 
                    strokeWidth="5" 
                    strokeDasharray={`${isi.score * 282.7} 282.7`}
                    strokeLinecap="round"
                    className="isi-ring-anim"
                 />
              </svg>
              <div className="isi-value">{(isi.score * 100).toFixed(0)}%</div>
           </div>
           <div>
              <h1>Omniscient Cockpit</h1>
              <p>Córtex Transcendente — Institucional Sentience Index (ISI)</p>
           </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {isOffline && (
            <div className="offline-badge">
              <WifiOff size={12} />
              <span>Modo Offline</span>
            </div>
          )}
          <div className="security-seal">
             <Lock size={14} />
             <span>Nível 22 Access Granted</span>
          </div>
        </div>
      </header>

      <div className="cockpit-layout">
        {/* Camadas da Instituição */}
        <section className="zenith-core glass-panel">
           <div className="core-visualization">
              <div className={`core-brain ${isi.score > 0.9 ? 'optimal' : 'active'}`}>
                 <Brain size={64} />
              </div>
              <div className="orbit orbit-1"><ShieldCheck size={18} /></div>
              <div className="orbit orbit-2"><TrendingUp size={18} /></div>
              <div className="orbit orbit-3"><Globe size={18} /></div>
           </div>
           
           <div className="layer-stats">
              <div className="l-item">
                 <span className="l-name">Afetivo</span>
                 <div className="l-bar"><div className="l-fill" style={{width: `${isi.metrics.affectivePulse * 100}%`}}></div></div>
              </div>
              <div className="l-item">
                 <span className="l-name">Operacional</span>
                 <div className="l-bar"><div className="l-fill" style={{width: `${isi.metrics.operationalHealth * 100}%`}}></div></div>
              </div>
              <div className="l-item">
                 <span className="l-name">Pedagógico</span>
                 <div className="l-bar"><div className="l-fill" style={{width: `${isi.metrics.pedagogicalMomentum * 100}%`}}></div></div>
              </div>
           </div>
        </section>

        {/* Advisor Autônomo */}
        <aside className="zenith-advisor glass-panel">
           <h3><MessageSquare size={18} /> Conselhos do Córtex</h3>
           <div className="advice-feed">
              {advices.map((advice, idx) => (
                <div key={idx} className="advice-card">
                   <Zap size={14} style={{ color: '#f59e0b' }} />
                   <p>{advice}</p>
                </div>
              ))}
           </div>
           <button className="btn-execute-all">Executar Otimizações Recomendadas</button>
        </aside>

        {/* Telemetria Global */}
        <section className="zenith-telemetry glass-panel">
           <div className="t-row">
              <div className="t-box">
                 <span className="t-lab">Swarm Status</span>
                 <span className="t-val" style={{ color: '#10b981' }}>SYNCHRONIZED</span>
              </div>
              <div className="t-box">
                 <span className="t-lab">Quantum Integrity</span>
                 <span className="t-val">99.99%</span>
              </div>
              <div className="t-box">
                 <span className="t-lab">Ecosystem Churn</span>
                 <span className="t-val" style={{ color: '#3b82f6' }}>0.04%</span>
              </div>
           </div>
        </section>
      </div>

      <footer className="cockpit-footer">
         <Activity size={14} style={{ color: '#10b981' }} />
         <span>Zenith Sovereignty v3.0 | Áquila Pro Omniscient Hub</span>
      </footer>
    </div>
  );
};

export default OmniscientCockpit;

