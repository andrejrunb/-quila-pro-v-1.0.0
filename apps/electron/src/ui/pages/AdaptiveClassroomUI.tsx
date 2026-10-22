import React, { useState, useEffect } from 'react';
import { 
  Sun, 
  Volume2, 
  Eye, 
  Settings, 
  RefreshCw,
  CheckCircle,
  ToggleLeft,
  Zap
} from 'lucide-react';
import './AdaptiveClassroomUI.css';

const AdaptiveClassroomUI: React.FC = () => {
  const [tuning, setTuning] = useState<any>(null);
  const [activeRoom, setActiveRoom] = useState('Sala 102 - Bloco A');

  const fetchTuning = async () => {
    try {
      const t = await (window as any).aquila.invoke('neuro:get-tuning', { roomId: activeRoom });
      setTuning(t);
    } catch (err) {
      console.error('Erro ao carregar tuning neuro:', err);
    }
  };

  const setMode = async (mode: string) => {
    await (window as any).aquila.invoke('neuro:set-mode', { roomId: activeRoom, mode });
    fetchTuning();
  };

  useEffect(() => {
    fetchTuning();
  }, []);

  if (!tuning) return null;

  return (
    <div className="adaptive-container">
      <header className="adaptive-header">
        <div className="flex items-center gap-4">
          <Settings size={32} className="text-indigo-400" />
          <div>
            <h1>Adaptive Classroom</h1>
            <p>Arquitetura Neuro-Inclusiva — Nível 42</p>
          </div>
        </div>
        <div className="room-selector glass-panel">
           <span>Monitorando: <strong>{activeRoom}</strong></span>
        </div>
      </header>

      <div className="adaptive-grid">
        {/* Configurações Atuais */}
        <section className="tuning-status glass-panel">
           <h3>Estado Ambiental Atual</h3>
           
           <div className="tuning-card">
              <Sun size={24} className="text-amber-400" />
              <div className="t-info">
                 <label>Iluminação Inclusiva</label>
                 <strong>{tuning.lighting.colorTemp}K (Quente)</strong>
                 <span>Intensidade: {tuning.lighting.intensity}%</span>
              </div>
              <CheckCircle size={18} className="text-emerald-400 ms-auto" />
           </div>

           <div className="tuning-card">
              <Volume2 size={24} className="text-sky-400" />
              <div className="t-info">
                 <label>Máscara Sonora</label>
                 <strong>{tuning.soundMasking ? 'Ativa' : 'Inativa'}</strong>
                 <span>Frequência: 432Hz (Calm)</span>
              </div>
              <CheckCircle size={18} className="text-emerald-400 ms-auto" />
           </div>

           <div className="tuning-card">
              <Eye size={24} className="text-purple-400" />
              <div className="t-info">
                 <label>Estímulo Visual</label>
                 <strong>{tuning.visualClutter}</strong>
                 <span>Telas secundárias desativadas</span>
              </div>
              <CheckCircle size={18} className="text-emerald-400 ms-auto" />
           </div>
        </section>

        {/* Modos de Atuação */}
        <main className="modes-area glass-panel">
           <h3>Ajustar Modo da Sala</h3>
           <div className="modes-grid">
              <button className={`mode-btn ${tuning.mode === 'CALM' ? 'active' : ''}`} onClick={() => setMode('CALM')}>
                 <ToggleLeft size={24} />
                 <strong>Modo Calmaria</strong>
                 <span>Para redução de ansiedade e hipersensibilidade.</span>
              </button>
              <button className={`mode-btn ${tuning.mode === 'FOCUS' ? 'active' : ''}`} onClick={() => setMode('FOCUS')}>
                 <RefreshCw size={24} />
                 <strong>Modo Foco</strong>
                 <span>Luz branca e redução de ruído máxima.</span>
              </button>
              <button className={`mode-btn ${tuning.mode === 'ACTIVE' ? 'active' : ''}`} onClick={() => setMode('ACTIVE')}>
                 <Zap size={24} />
                 <strong>Modo Atividade</strong>
                 <span>Estímulo visual moderado e iluminação dinâmica.</span>
              </button>
           </div>
        </main>
      </div>

      <footer className="adaptive-footer">
         <Settings size={14} className="text-indigo-400" />
         <span>Neuro-Architecture: Ajustando o espaço para que todos os cérebros floresçam.</span>
      </footer>
    </div>
  );
};

export default AdaptiveClassroomUI;
