import React, { useState } from 'react';
import { learningPodService, LearningPod } from '../../services/LearningPodService';
import '../styles/CoolmeiaUX.css';

/**
 * LEARNING POD UI (v4001)
 * -----------------------
 * Interface de interação com o conteúdo da aula inspirado em NotebookLM.
 * Foca em Grounding, Flashcards e Síntese de Áudio.
 */

interface PodUIProps {
  pod: LearningPod;
  onClose: () => void;
}

export const LearningPodUI: React.FC<PodUIProps> = ({ pod, onClose }) => {
  const [activeTab, setActiveTab] = useState<'summary' | 'flashcards' | 'audio'>('summary');

  const flashcards = JSON.parse(pod.flashcards || '[]');

  return (
    <div className="learning-pod-overlay">
       <div className="pod-modal hex-container">
          <header className="pod-header">
             <h2 className="hive-title">{pod.subject}</h2>
             <span className="pod-date">CAPTURADO: {new Date(pod.created_at).toLocaleDateString()}</span>
             <button className="close-btn" onClick={onClose}>×</button>
          </header>

          <nav className="pod-tabs">
             <button className={activeTab === 'summary' ? 'active' : ''} onClick={() => setActiveTab('summary')}>SUMÁRIO</button>
             <button className={activeTab === 'flashcards' ? 'active' : ''} onClick={() => setActiveTab('flashcards')}>FLASHCARDS ({flashcards.length})</button>
             <button className={activeTab === 'audio' ? 'active' : ''} onClick={() => setActiveTab('audio')}>AUDIO OVERVIEW</button>
          </nav>

          <div className="pod-content">
             {activeTab === 'summary' && (
               <div className="summary-view animate-fade">
                  <p className="summary-text">{pod.summary}</p>
                  <div className="grounding-badge">BASES: Transcrição Local AI-Sovereign</div>
               </div>
             )}

             {activeTab === 'flashcards' && (
               <div className="flashcards-grid animate-slide">
                  {flashcards.map((f: any, i: number) => (
                    <div key={i} className="flashcard-item">
                       <div className="fc-q">P: {f.q}</div>
                       <div className="fc-a">R: {f.a}</div>
                    </div>
                  ))}
               </div>
             )}

             {activeTab === 'audio' && (
               <div className="audio-pod-view text-center">
                  <div className="wave-animation">
                     <span></span><span></span><span></span><span></span>
                  </div>
                  <p>Escute o resumo da aula gerado pela Córtex Central.</p>
                  <button className="btn-sovereign btn-approve">PLAY PODCAST</button>
               </div>
             )}
          </div>
       </div>

       <style>{`
         .learning-pod-overlay {
           position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
           background: rgba(0, 0, 0, 0.9); backdrop-filter: blur(10px);
           z-index: 9999; display: flex; align-items: center; justify-content: center;
         }
         .pod-modal {
           width: 800px; max-width: 90%; background: #0a0a0a; border: 1px solid rgba(255, 183, 0, 0.2);
           padding: 3rem; border-radius: 12px; position: relative;
         }
         .pod-header { margin-bottom: 2rem; }
         .pod-tabs { display: flex; gap: 2rem; margin-bottom: 3rem; border-bottom: 1px solid rgba(255,183,0,0.1); }
         .pod-tabs button { background: transparent; border: none; color: #fff; opacity: 0.5; padding-bottom: 1rem; cursor: pointer; }
         .pod-tabs button.active { opacity: 1; border-bottom: 2px solid #ffb700; color: #ffb700; }
         .summary-text { font-size: 1.2rem; line-height: 1.8; color: #ccc; }
         .flashcard-item { background: rgba(255,183,0,0.05); padding: 1.5rem; border-radius: 8px; margin-bottom: 1rem; }
         .fc-q { font-weight: bold; color: #ffb700; margin-bottom: 0.5rem; }
         .audio-pod-view button { margin-top: 2rem; width: 200px; }
         .close-btn { position: absolute; top: 1rem; right: 2rem; font-size: 2rem; background: none; border: none; color: #f44336; cursor: pointer; }
       `}</style>
    </div>
  );
};
