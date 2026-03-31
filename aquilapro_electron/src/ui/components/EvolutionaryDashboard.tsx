import React from 'react';
import './EvolutionaryDashboard.css';

interface LifecycleEntry {
  year: number;
  gradeLevel: string;
  avgBehaviorScore: number;
  avgAcademicScore: number;
  attendanceRate: number;
  milestones: string[];
}

interface EvolutionaryDashboardProps {
  history: LifecycleEntry[];
  studentName: string;
}

const TimelineCard: React.FC<{ entry: LifecycleEntry; isActive: boolean }> = ({ entry, isActive }) => {
  const behaviorRef = React.useRef<HTMLDivElement>(null);
  const academicRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (behaviorRef.current) behaviorRef.current.style.setProperty('--behavior-width', `${entry.avgBehaviorScore}%`);
    if (academicRef.current) academicRef.current.style.setProperty('--academic-width', `${entry.avgAcademicScore}%`);
  }, [entry]);

  return (
    <div className={`timeline-card ${isActive ? 'active' : ''}`}>
      <div className="timeline-year">{entry.year}</div>
      <div className="timeline-body">
        <span className="grade-badge">{entry.gradeLevel}</span>
        
        <div className="stat-row">
          <div className="stat-label">Comportamento</div>
          <div className="stat-bar-bg">
            <div ref={behaviorRef} className="stat-bar-fill behavior"></div>
          </div>
          <span className="stat-value">{entry.avgBehaviorScore}%</span>
        </div>

        <div className="stat-row">
          <div className="stat-label">Acadêmico</div>
          <div className="stat-bar-bg">
            <div ref={academicRef} className="stat-bar-fill academic"></div>
          </div>
          <span className="stat-value">{entry.avgAcademicScore}%</span>
        </div>

        <div className="milestones-list">
          {entry.milestones.map((m, i) => (
            <span key={i} className="milestone-tag">✨ {m}</span>
          ))}
        </div>
      </div>
    </div>
  );
};

const EvolutionaryDashboard: React.FC<EvolutionaryDashboardProps> = ({ history, studentName }) => {
  return (
    <div className="evolutionary-container">
      <header className="evo-header">
        <h3>Linha do Tempo Evolutiva: {studentName}</h3>
        <p className="evo-subtitle">Acompanhamento de longo prazo desde o ingresso na instituição</p>
      </header>

      <div className="timeline-grid">
        {history.map((entry, index) => (
          <TimelineCard key={entry.year} entry={entry} isActive={index === history.length - 1} />
        ))}
      </div>

      <div className="evo-insight">
        <div className="insight-icon">💡</div>
        <div className="insight-text">
          <strong>Insight do Enxame:</strong> O aluno apresenta uma curva de amadurecimento comportamental consistente (↑ 14% em 3 anos). O forte interesse em Robótica em 2026 sugere uma trilha técnica promissora.
        </div>
      </div>
    </div>
  );
};

export default EvolutionaryDashboard;
