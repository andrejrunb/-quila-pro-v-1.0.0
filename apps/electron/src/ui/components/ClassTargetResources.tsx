import React, { useState, useEffect } from 'react';
import './ClassTargetResources.css';

interface Resources {
  name: string;
  directives: string;
  oldExams: string[];
}

interface ClassTargetResourcesProps {
  classId: string;
  targetBancaId?: string;
}

export const ClassTargetResources: React.FC<ClassTargetResourcesProps> = ({ classId, targetBancaId }) => {
  const [resources, setResources] = useState<Resources | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (targetBancaId) {
      loadResources(targetBancaId);
    }
  }, [targetBancaId, classId]);

  const loadResources = async (bancaId: string) => {
    setIsLoading(true);
    try {
      const data = await (window as any).aquila.pedagogy.getResources(bancaId);
      setResources(data);
    } catch (error) {
      console.error('Failed to load target resources', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!targetBancaId || !resources) return null;

  return (
    <div className={`class-target-resources ${isLoading ? 'loading' : ''}`}>
      <div className="resources-header">
        <div className="target-badge">ALVO ATIVO: {resources.name}</div>
        <div className="header-glow"></div>
      </div>

      <div className="resources-grid">
        <div className="resource-card directives">
          <div className="card-lbl">DIRETRIZES DE IA</div>
          <p>{resources.directives}</p>
          <div className="ai-status">Sintonizado no NPU</div>
        </div>

        <div className="resource-card exams">
          <div className="card-lbl">PROVAS ANTIGAS</div>
          <div className="exams-list">
            {resources.oldExams.length > 0 ? (
              resources.oldExams.map((link, idx) => (
                <button 
                  key={idx} 
                  className="exam-link-btn"
                  onClick={() => window.open(link, '_blank')}
                >
                  <span className="file-icon">📄</span>
                  Prova Sugerida #{idx + 1}
                  <span className="arrow">→</span>
                </button>
              ))
            ) : (
              <p className="no-exams">Nenhum material cadastrado.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
