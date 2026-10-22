import React, { useState, useEffect, useRef } from 'react';
import { 
  Upload, FileText, Image as ImageIcon, CheckCircle, 
  BookOpen, Brain, Bell, Calendar, ChevronRight, Play, Info, Mic, Shield
} from 'lucide-react';
import './SmartClass.css';

interface Flashcard {
  question: string;
  answer: string;
  tags: string[];
}

interface SmartMaterial {
  id: string;
  title: string;
  type: 'image' | 'text' | 'pdf';
  summary: string;
  flashcards: Flashcard[];
  timestamp: Date;
}

export const SmartClassHub: React.FC = () => {
  const [role, setRole] = useState<'teacher' | 'student' | 'parent'>('teacher');
  const [dragging, setDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [materials, setMaterials] = useState<SmartMaterial[]>([]);
  const [activeMaterial, setActiveMaterial] = useState<SmartMaterial | null>(null);
  const [showFlashcardAnswer, setShowFlashcardAnswer] = useState(false);

  // Stats simulados
  const [engagementScore] = useState(82);
  const metrics = { engagement: engagementScore, innovation: 78 };

  const classEngagement = [
    { name: 'Ana Silva', score: 95, tasks: ['Resumo', 'Podcast', 'Flash'] },
    { name: 'Bruno Costa', score: 42, tasks: ['Resumo'] },
    { name: 'Carla Dias', score: 88, tasks: ['Resumo', 'Flash'] },
  ];

  useEffect(() => {
    const fetchMaterials = async () => {
      try {
        const api = (window as any).aquila;
        const mats = await api.invoke('pedagogical:get-materials');
        setMaterials(mats || []);
      } catch (err) {
        console.error('Falha ao buscar materiais reais:', err);
      }
    };
    fetchMaterials();
  }, []);

  const handleFileUpload = async (e: any) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsProcessing(true);
    try {
      const api = (window as any).aquila;
      const type = file.type.includes('image') ? 'image' : 'text';
      const result = await api.invoke('pedagogy:process-material', { 
        title: file.name.split('.')[0], 
        type, 
        content: 'Simulated parsed content of: ' + file.name 
      });

      if (result && result.success) {
        const mat = result.data;
        const newMaterial: SmartMaterial = {
          id: `mat-${Date.now()}`,
          title: file.name.split('.')[0],
          type,
          summary: mat.summary,
          flashcards: mat.flashcards,
          timestamp: new Date()
        };
        setMaterials(prev => [newMaterial, ...prev]);
        setActiveMaterial(newMaterial);
        (window as any).showToast?.('Material processado com sucesso no ecossistema de aula!', 'success');
      } else {
        (window as any).showToast?.('Falha ao processar material: ' + (result?.error || 'Erro interno da IA local.'), 'error');
      }
    } catch (err: any) {
      (window as any).showToast?.('Erro de comunicação: ' + err.message, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="page-container smart-class-elite">
      <header className="smart-header glass-card">
        <div className="flex items-center gap-4">
          <div className="smart-icon-main"><Brain size={32} /></div>
          <div>
            <h1>Córtex Pedagógico — Aulas Inteligentes</h1>
            <p className="text-dim">IA Multimodal & Portfólio Familiar</p>
          </div>
        </div>
        <div className="role-switcher">
          <button className={role === 'teacher' ? 'active' : ''} onClick={() => setRole('teacher')}>Professor</button>
          <button className={role === 'student' ? 'active' : ''} onClick={() => setRole('student')}>Aluno</button>
          <button className={role === 'parent' ? 'active' : ''} onClick={() => setRole('parent')}>Pai/Mãe</button>
        </div>
      </header>

      <div className="project-health-hud">
        <HudCard label="Engajamento" value={metrics.engagement} color="purple" />
        <HudCard label="Inovação" value={metrics.innovation} color="gold" />
        <div className="hud-card mini-glass pointer" onClick={() => (window as any).showToast?.('Sanidade Operacional Áquila: 100% Nominal', 'info')}>
          <div className="hud-label">Status Global</div>
          <div className="hud-value text-purple">Ascending</div>
        </div>
      </div>

      <div className="smart-grid">
        <section className="smart-main-content">
          {role === 'teacher' && (
            <div className="teacher-view animate-fade-in">
              <div className="glass-card engagement-dashboard">
                <table className="engagement-table">
                  <thead>
                    <tr><th>Aluno</th><th>Integridade</th><th>Status</th></tr>
                  </thead>
                  <tbody>
                    {classEngagement.map((entry, idx) => (
                      <tr key={idx}>
                        <td>{entry.name}</td>
                        <td><ProgressBar value={entry.score} /></td>
                        <td>{entry.score > 50 ? 'OK' : 'Alerta'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>
      </div>

      <footer className="hub-footer">
        <Shield size={14} className="text-accent" />
        <span className="text-muted-xs">Áquila Pro V1.0 • Sovereign Architecture</span>
      </footer>
    </div>
  );
};

const HudCard: React.FC<{ label: string; value: number; color: string }> = ({ label, value, color }) => {
  const barRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (barRef.current) barRef.current.style.width = `${value}%`;
  }, [value]);
  return (
    <div className="hud-card mini-glass">
      <div className="hud-label">{label}</div>
      <div className={`hud-value text-${color}`}>{value}%</div>
      <div className="progress-bar-small">
        <div ref={barRef} className={`bg-${color} progress-fill-var`} />
      </div>
    </div>
  );
};

const ProgressBar: React.FC<{ value: number }> = ({ value }) => {
  const barRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (barRef.current) barRef.current.style.width = `${value}%`;
  }, [value]);
  return (
    <div className="speedometer-mini">
      <div className="speed-track">
        <div ref={barRef} className="speed-fill" />
      </div>
      <span className="score-text">{value}%</span>
    </div>
  );
};
