import React from 'react';
import './EngagementRadar.css';

interface RadarData {
  category: string;
  value: number;
}

const RadarItem: React.FC<{ m: RadarData }> = ({ m }) => {
  const circleRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (circleRef.current) {
      circleRef.current.style.setProperty('--radar-size', `${m.value}%`);
    }
  }, [m.value]);

  return (
    <div className="radar-item">
      <div className="radar-label">{m.category}</div>
      <div className="radar-circle-outer">
         <div ref={circleRef} className="radar-circle-inner"></div>
         <span className="radar-value">{m.value}%</span>
      </div>
    </div>
  );
};

const EngagementRadar: React.FC = () => {
  // Mock radar categories
  const metrics: RadarData[] = [
    { category: 'Autonomia', value: 85 },
    { category: 'Colaboração', value: 72 },
    { category: 'Engajamento', value: 91 },
    { category: 'Curiosidade', value: 64 },
    { category: 'Assiduidade', value: 98 }
  ];

  const emotionalPulse = 'OTIMISTA'; // v1941 Deep Intelligence

  return (
    <div className="engagement-radar-container">
      <div className="flex justify-between items-start mb-6">
         <h3 className="radar-title">Radar de Engajamento Institucional</h3>
         <div className="sentiment-badge">
            <span className="text-[10px] opacity-50 block">Pulso Afetivo</span>
            <span className="text-emerald-400 font-black">{emotionalPulse}</span>
         </div>
      </div>
      <div className="radar-grid">
        {metrics.map(m => (
          <RadarItem key={m.category} m={m} />
        ))}
      </div>
      <div className="radar-footer">
        🚀 <strong>Insight Pedagógico:</strong> A turma apresenta um pico de <strong>91% em Engajamento</strong>, impulsionado pelo novo módulo de Robótica.
      </div>
    </div>
  );
};

export default EngagementRadar;
