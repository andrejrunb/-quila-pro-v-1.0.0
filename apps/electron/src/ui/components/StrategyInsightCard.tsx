import React from 'react';
import './StrategyInsightCard.css';
import { useAnime } from '../hooks/useAnime';

interface StrategyInsightProps {
  stage: 'Piloto Operacional' | 'IA Agêntica Integrada' | 'Plataforma Transformacional';
  efficiencyGains: {
    process: string;
    gain: number;
    hoursSaved: number;
  }[];
  recommendation: string;
}

const StrategyInsightCard: React.FC<StrategyInsightProps> = ({ stage, efficiencyGains, recommendation }) => {
  const containerRef = React.useRef<HTMLDivElement>(null);

  useAnime({
    targets: '.strategy-stat-card',
    translateY: [20, 0],
    opacity: [0, 1],
    delay: (el, i) => i * 150,
    easing: 'easeOutExpo',
    duration: 800
  }, [efficiencyGains]);

  return (
    <div className="strategy-insight-container" ref={containerRef}>
      <div className="strategy-header">
        <div className="stage-badge-container">
          <span className="stage-label">Maturidade Stanford AI</span>
          <div className={`stage-badge ${stage.replace(/\s+/g, '-').toLowerCase()}`}>
            {stage}
          </div>
        </div>
        <div className="recommendation-box">
          <span className="rec-icon">🎓</span>
          <p>{recommendation}</p>
        </div>
      </div>

      <div className="efficiency-grid">
        {efficiencyGains.map((item, idx) => (
          <div key={idx} className="strategy-stat-card">
            <div className="stat-header">
              <span className="item-process">{item.process}</span>
              <span className="item-hours">+{item.hoursSaved}h/mês</span>
            </div>
            <div className="stat-main">
              <div className="gain-percentage">
                <span className="arrow">↑</span>
                {item.gain}%
              </div>
              <div className="stat-track">
                <div 
                  className="stat-fill" 
                  style={{ width: `${item.gain}%` }}
                ></div>
              </div>
            </div>
            <span className="stat-footer">Eficiência Organizacional</span>
          </div>
        ))}
      </div>

      <div className="stanford-disclaimer">
        Basado no <em>Enterprise AI Playbook (Stanford Digital Economy Lab)</em>
      </div>
    </div>
  );
};

export default StrategyInsightCard;
