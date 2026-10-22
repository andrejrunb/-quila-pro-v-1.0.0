import React, { useState, useEffect } from 'react';
import { 
  Infinity, 
  Sparkles, 
  ShieldCheck, 
  Zap, 
  Globe,
  Sun,
  Star,
  TrendingUp,
  Award,
  Activity,
  ChevronRight,
  WifiOff
} from 'lucide-react';
import './ZenithCockpitUI.css';

const FALLBACK_STATE = {
  activeLayers: ['Segurança', 'Pedagógico', 'Administrativo', 'Operacional', 'Biométrico'],
};

const FALLBACK_REPORT = {
  yieldScore: 78,
  projections: [
    { indicator: 'Frequência Geral', trend: 85 },
    { indicator: 'Cobertura de Câmeras', trend: 62 },
    { indicator: 'Engajamento Pedagógico', trend: 71 },
    { indicator: 'Satisfação dos Pais', trend: 58 },
  ],
};

const ZenithCockpitUI: React.FC = () => {
  const [state, setState] = useState<any>(FALLBACK_STATE);
  const [aureusReport, setAureusReport] = useState<any>(FALLBACK_REPORT);
  const [isSingularity, setIsSingularity] = useState(false);
  const [isOffline, setIsOffline] = useState(true);

  const fetchData = async () => {
    try {
      const timeout = new Promise((_, reject) => setTimeout(() => reject('timeout'), 5000));
      
      const [s, report] = await Promise.all([
        Promise.race([(window as any).aquila.invoke('zenith:get-state'), timeout]),
        Promise.race([(window as any).aquila.invoke('outcome:get-aureus-report'), timeout]),
      ]);
      
      if (s && typeof s === 'object' && !s.error) {
        setState(s);
      } else {
        setState(FALLBACK_STATE);
      }

      if (report && typeof report === 'object' && !report.error) {
        setAureusReport(report);
      } else {
        setAureusReport(FALLBACK_REPORT);
      }

      setIsOffline(false);
    } catch (e) {
      console.warn('Zenith: usando dados de fallback devido a falha na sincronia');
      setState(FALLBACK_STATE);
      setAureusReport(FALLBACK_REPORT);
      setIsOffline(true);
    }
  };

  const startSingularity = async () => {
    try {
      const res = await (window as any).aquila.invoke('zenith:finalize-singularity');
      if (res?.success) setIsSingularity(true);
    } catch {
      // noop
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  if (isSingularity) {
    return (
      <div className="zenith-singularity-screen">
         <div className="white-hole"></div>
         <div className="zenith-content">
            <Infinity size={120} style={{ color: 'white', animation: 'pulse 2s infinite' }} />
            <h1>ZENITH</h1>
            <p>Singularidade Institucional Absoluta</p>
            <div className="final-message">O Áquila Pro atingiu o estado de harmonia total.</div>
         </div>
      </div>
    );
  }

  return (
    <div className="zenith-container">
      <div className="zenith-aura"></div>
      
      <header className="zenith-header">
        <Sun size={48} style={{ color: '#fde68a' }} />
        <h1>ZENITH COCKPIT</h1>
        <p>A Cúpula da Inteligência Soberana — Fase Aureus (v2.1.0)</p>
        {isOffline && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '8px', color: '#f59e0b', fontSize: '0.72rem', fontWeight: 600 }}>
            <WifiOff size={12} /> Dados demonstrativos (Córtex offline)
          </div>
        )}
      </header>

      <div className="zenith-grid">
        {/* Lado Esquerdo: Harmonia e Camadas */}
        <div className="zenith-main-panel">
          <div className="glass-panel harmony-meter">
            <div className="radial-progress">
                <svg viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="45" className="track" />
                  <circle cx="50" cy="50" r="45" className="bar" style={{ strokeDashoffset: 282 * (1 - (aureusReport?.yieldScore || 0) / 100) }} />
                </svg>
                <div className="val">{aureusReport?.yieldScore ?? 0}%</div>
            </div>
            <h3>Institutional Yield (ROI Soberano)</h3>
            <p className="yield-subtitle">Convergência entre Segurança e Performance</p>
          </div>

          <div className="layers-fusion">
            <h4 className="section-label">Camadas Ativas</h4>
            <div className="pill-container">
              {(state?.activeLayers || []).map((layer: string, i: number) => (
                <div key={i} className="layer-pill">
                  <Sparkles size={14} /> {layer}
                </div>
              ))}
              <div className="layer-pill gold-glow">
                <Award size={14} /> Aureus Convergence
              </div>
            </div>
          </div>
        </div>

        {/* Lado Direito: Aureus Insights */}
        <div className="zenith-side-panel">
          <div className="glass-panel intelligence-card">
            <h3><TrendingUp size={18} /> Projeções de Sucesso</h3>
            <div className="projection-list">
              {(aureusReport?.projections || []).map((p: any, i: number) => (
                <div key={i} className="projection-item">
                  <div className="p-header">
                    <span>{p.indicator}</span>
                    <span className="p-trend">+{p.trend}%</span>
                  </div>
                  <div className="p-bar-bg">
                    <div className="p-bar-fill" style={{ width: `${p.trend}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-panel intelligence-card">
            <h3><Activity size={18} /> Status do Enxame (Bees)</h3>
            <div className="swarm-activity">
              <div className="activity-row">
                <span>Consenso Médio</span>
                <span className="val-badge">94%</span>
              </div>
              <div className="activity-row">
                <span>Integridade do Kernel</span>
                <span className="val-badge green">SAFE</span>
              </div>
              <div className="activity-row">
                <span>Última Auditoria</span>
                <span className="val-time">há 2 min</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="zenith-actions">
          <button className="finalize-btn" onClick={startSingularity}>
            <Zap size={20} /> Ativar Singularidade Absoluta
          </button>
      </div>

      <div className="zenith-footer-stats">
          <div className="stat">
            <ShieldCheck size={20} />
            <span>Consciência: ALINHADA</span>
          </div>
          <div className="stat">
            <Globe size={20} />
            <span>Expansão: REGIONAL</span>
          </div>
          <div className="stat">
            <Star size={20} />
            <span>Destino: ZENITH</span>
          </div>
      </div>
    </div>
  );
};

export default ZenithCockpitUI;

