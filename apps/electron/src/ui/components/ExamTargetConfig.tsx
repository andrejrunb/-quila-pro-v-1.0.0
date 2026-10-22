import React, { useState, useEffect } from 'react';
import { Target, Zap, BookOpen, CheckCircle2, AlertCircle, Save } from 'lucide-react';
import './ExamTargetConfig.css';

interface Banca {
  id: string;
  name: string;
  description: string;
  style: string;
}

interface Class {
  id: string;
  name: string;
  grade: string;
}

interface ClassTarget {
  classId: string;
  targetExamId: string;
  focusYear: number;
}

const aquila = (window as any).aquila;

export const ExamTargetConfig: React.FC = () => {
  const [bancas, setBancas] = useState<Banca[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [targets, setTargets] = useState<Record<string, ClassTarget>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [bancaList, classList, targetList] = await Promise.all([
        aquila?.invoke?.('get-exam-bancas'),
        aquila?.invoke?.('get-classes'),
        aquila?.invoke?.('get-all-class-targets')
      ]);

      setBancas(bancaList || []);
      setClasses(classList || []);
      
      const targetMap: Record<string, ClassTarget> = {};
      (targetList || []).forEach((t: ClassTarget) => {
        targetMap[t.classId] = t;
      });
      setTargets(targetMap);
    } catch (err) {
      console.error('[ExamTargetConfig] Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTarget = async (classId: string, bancaId: string) => {
    setSaving(classId);
    try {
      const focusYear = new Date().getFullYear();
      await aquila?.invoke?.('set-class-target', { classId, targetExamId: bancaId, focusYear });
      
      setTargets(prev => ({
        ...prev,
        [classId]: { classId, targetExamId: bancaId, focusYear }
      }));
    } catch (err) {
      console.error('[ExamTargetConfig] Error saving target:', err);
    } finally {
      setSaving(null);
    }
  };

  if (loading) {
    return (
      <div className="exam-config-loading">
        <div className="spinner"></div>
        <span>Sincronizando Alvos Estratégicos...</span>
      </div>
    );
  }

  return (
    <div className="exam-target-config">
      <div className="config-header">
        <div className="header-info">
          <Target className="icon-gold" size={24} />
          <div>
            <h2>Alinhamento de Vestibulares</h2>
            <p>Defina o foco pedagógico e o estilo de banca para cada turma.</p>
          </div>
        </div>
      </div>

      <div className="classes-grid">
        {classes.map(cls => {
          const currentTarget = targets[cls.id];
          const currentBanca = bancas.find(b => b.id === currentTarget?.targetExamId);

          return (
            <div key={cls.id} className={`class-target-card ${currentBanca ? 'active-target' : ''}`}>
              <div className="card-top">
                <div className="class-identity">
                  <span className="grade-badge">{cls.grade}</span>
                  <h3>{cls.name}</h3>
                </div>
                {saving === cls.id ? (
                  <div className="save-status saving"><Save size={14} className="spin" /></div>
                ) : currentBanca ? (
                  <div className="save-status meta-aligned"><CheckCircle2 size={14} /> Alinhado</div>
                ) : (
                  <div className="save-status not-aligned"><AlertCircle size={14} /> Sem Alvo</div>
                )}
              </div>

              <div className="target-selector">
                <label>Foco Estratégico</label>
                <div className="banca-options">
                  {bancas.map(b => (
                    <button
                      key={b.id}
                      className={`banca-btn ${currentTarget?.targetExamId === b.id ? 'selected' : ''}`}
                      onClick={() => handleUpdateTarget(cls.id, b.id)}
                    >
                      <Zap size={12} />
                      {b.name}
                    </button>
                  ))}
                  <button
                    className={`banca-btn ${!currentTarget ? 'selected' : ''}`}
                    onClick={() => handleUpdateTarget(cls.id, '')}
                  >
                    Nenhum
                  </button>
                </div>
              </div>

              {currentBanca && (
                <div className="target-insight">
                  <div className="insight-header">
                    <BookOpen size={12} />
                    <span>Diretriz do Córtex AI</span>
                  </div>
                  <p>{currentBanca.description}</p>
                  <div className="banca-tag">Estilo: {currentBanca.style.replace('_', ' ')}</div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl mt-8 flex gap-4 items-start">
        <AlertCircle className="text-blue-400 shrink-0" size={20} />
        <p className="text-xs text-blue-200/70 leading-relaxed">
          <strong>Aviso de Inteligência:</strong> Ao alterar o alvo de uma turma, o motor de I.A do 
          LibrarianService e o Gerador de Aulas serão reiniciados para essa turma com os novos tokens 
          de estilo da banca selecionada.
        </p>
      </div>
    </div>
  );
};
export default ExamTargetConfig;
