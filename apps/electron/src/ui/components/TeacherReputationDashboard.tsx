import React from 'react';
import './TeacherReputationDashboard.css';

interface ReputationMetric {
  label: string;
  value: string;
  subValue: string;
  icon: string;
}

export const TeacherReputationDashboard: React.FC = () => {
  const metrics: ReputationMetric[] = [
    { label: 'Índice de Impacto', value: '4.8', subValue: 'Top 5% da Malha', icon: '💎' },
    { label: 'Alunos Impactados', value: '1,250', subValue: '+150 este mês', icon: '👥' },
    { label: 'Créditos de Mérito', value: '3,840', subValue: 'Saldo disponível', icon: '💰' },
    { label: 'Contribuições Elite', value: '12', subValue: 'Materiais publicados', icon: '📚' }
  ];

  const recentImpact = [
    { school: 'Escola Primária B', asset: 'Física Quântica 101', improvement: '+18%', date: '2h atrás' },
    { school: 'Colégio Estadual C', asset: 'Álgebra Flashcards', improvement: '+12%', date: 'Ontem' },
    { school: 'Instituto Técnico D', asset: 'História RPG', improvement: '+25%', date: '3 dias atrás' }
  ];

  return (
    <div className="reputation-container">
      <header className="reputation-header">
        <h1>Meu Perfil de Mérito Soberano</h1>
        <p>Monitoramento de Influência Pedagógica v1.5</p>
      </header>

      <div className="metrics-grid">
        {metrics.map((metric, idx) => (
          <div key={idx} className="metric-card">
            <div className="metric-icon">{metric.icon}</div>
            <div className="metric-info">
              <div className="metric-label">{metric.label}</div>
              <div className="metric-value">{metric.value}</div>
              <div className="metric-sub">{metric.subValue}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="impact-feed">
        <h2>Feed de Impacto em Tempo Real</h2>
        <div className="feed-list">
          {recentImpact.map((item, idx) => (
            <div key={idx} className="feed-item">
              <div className="feed-bullet"></div>
              <div className="feed-content">
                <strong>{item.school}</strong> aplicou seu material <em>"{item.asset}"</em>. 
                <span className="improvement-badge">{item.improvement} melhoria em notas</span>
              </div>
              <div className="feed-date">{item.date}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TeacherReputationDashboard;
