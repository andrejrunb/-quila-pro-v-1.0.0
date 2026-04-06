import React, { useState } from 'react';
import { Mic, Play, FileText, Loader2, Sparkles, AudioLines, CheckCircle } from 'lucide-react';
import './EduPodcast.css';

export interface PodcastSegment {
  speaker: 'Teacher' | 'Assistant';
  text: string;
}

export const EduPodcast: React.FC = () => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [podcast, setPodcast] = useState<any>(null);

  const handleGenerate = async () => {
    if (!title || !content) return;
    setIsGenerating(true);
    try {
      const api = (window as any).aquila;
      const result = await api.invoke('edu:generate-podcast', { title, content });
      if (result.success) {
        setPodcast(result.data);
      }
    } catch (err) {
      console.error('Erro ao gerar podcast:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="edu-podcast-container">
      <header className="page-header">
        <div className="header-wrapper">
          <div className="header-icon">
            <Mic size={24} />
          </div>
          <div>
            <h1>Edu-Podcast Engine</h1>
            <p className="text-secondary">Transforme materiais didáticos em áudio conversacional local.</p>
          </div>
        </div>
      </header>

      <div className="podcast-grid">
        {/* Editor de Conteúdo */}
        <div className="glass-panel editor-panel">
          <div className="section-title-wrapper">
            <FileText size={18} />
            <h2 className="section-title">Material de Origem</h2>
          </div>
          
          <input 
            type="text" 
            placeholder="Título do Episódio (ex: Revolução Industrial)" 
            className="modern-input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <textarea 
            placeholder="Cole o texto da apostila ou plano de aula aqui..." 
            className="modern-textarea"
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />

          <button 
            disabled={isGenerating || !title || !content}
            onClick={handleGenerate}
            className="primary-btn"
          >
            {isGenerating ? (
              <>
                <Loader2 className="animate-spin" size={18} />
                Gerando Podcast Local...
              </>
            ) : (
              <>
                <Sparkles size={18} />
                Transformar em Podcast
              </>
            )}
          </button>
        </div>

        {/* Player / Resultado */}
        <div className="glass-panel result-panel">
          <div className="section-title-wrapper">
            <AudioLines size={18} />
            <h2 className="section-title">Pré-visualização do Áudio</h2>
          </div>

          {!podcast && !isGenerating && (
            <div className="empty-state">
              <Mic size={64} className="empty-state-icon" />
              <p>Nenhum áudio gerado ainda.<br/>Carregue um conteúdo ao lado para começar.</p>
            </div>
          )}

          {isGenerating && (
            <div className="loading-state">
              <div className="waveform-animation">
                <div className="bar" />
                <div className="bar" />
                <div className="bar" />
                <div className="bar" />
                <div className="bar" />
              </div>
              <p className="loading-text">Sintetizando Vozes do Professor & Assistente...</p>
              <span className="loading-subtext">google/turboquant (3-bit) acelerando processamento NPU</span>
            </div>
          )}

          {podcast && (
            <div className="player-ui">
              <div className="player-card">
                <div className="player-header">
                  <div>
                    <h3 className="podcast-title">{podcast.title}</h3>
                    <p className="podcast-duration">
                      Duração: {Math.floor(podcast.durationSeconds / 60)}:{(podcast.durationSeconds % 60).toString().padStart(2, '0')}
                    </p>
                  </div>
                  <div className="status-badge">
                    <CheckCircle size={14} className="status-icon" /> Pronto
                  </div>
                </div>

                <div className="audio-player-mock">
                  <div className="audio-progress" />
                </div>

                <div className="player-controls">
                  <button className="icon-btn-large" title="Play Podcast">
                    <Play fill="currentColor" size={24} />
                  </button>
                </div>
              </div>

              <div className="script-timeline">
                {podcast.segments.map((seg: any, idx: number) => (
                  <div key={idx} className={`script-bubble ${seg.speaker.toLowerCase()}`}>
                    <span className="speaker-label">{seg.speaker === 'Teacher' ? '👨‍🏫 Professor' : '🤖 Assistente'}</span>
                    <p className="text-sm">{seg.text}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EduPodcast;
