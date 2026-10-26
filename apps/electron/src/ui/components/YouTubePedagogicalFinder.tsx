import React, { useState, useEffect } from 'react';
import {
  Tv, Search, Play, ExternalLink, Filter, BookOpen,
  Award, Sparkles, Clock, CheckCircle2, ChevronRight, Video, X
} from 'lucide-react';
import {
  PedagogicalVideoItem,
  youtubeRecommender,
  CURATED_YOUTUBE_PEDAGOGICAL_BANK
} from '../../services/YouTubePedagogicalRecommender';
import './YouTubePedagogicalFinder.css';

interface Props {
  initialSubject?: string;
  initialTopic?: string;
  onSelectVideoForLessonPlan?: (video: PedagogicalVideoItem) => void;
}

export const YouTubePedagogicalFinder: React.FC<Props> = ({
  initialSubject = 'Física',
  initialTopic = 'Eletrodinâmica e Corrente Alternada',
  onSelectVideoForLessonPlan
}) => {
  const [searchTerm, setSearchTerm] = useState(initialTopic);
  const [selectedDiscipline, setSelectedDiscipline] = useState(initialSubject);
  const [selectedStage, setSelectedStage] = useState<'all' | 'Nivel_1_Fundamentos' | 'Nivel_2_Aplicacao' | 'Nivel_3_Aprofundamento'>('all');
  const [activeVideo, setActiveVideo] = useState<PedagogicalVideoItem | null>(null);

  // Fechamento acessível com tecla Escape (WCAG 2.1 AA)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && activeVideo) {
        setActiveVideo(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeVideo]);

  const searchOutcome = youtubeRecommender.searchRecommendedVideos({
    queryText: searchTerm,
    discipline: selectedDiscipline === 'Todas' ? undefined : selectedDiscipline,
    stage: selectedStage === 'all' ? undefined : selectedStage,
    maxResults: 8
  });

  return (
    <section className="yt-finder-container" aria-label="Assistente de Videoaulas YouTube Pedagógicas">
      <header className="yt-finder-header">
        <div className="yt-finder-badge" role="note" aria-label="Aviso de Curadoria">
          <Tv className="w-5 h-5 text-red-500 mr-2 inline" aria-hidden="true" />
          <span>Áquila Video Radar • Curadoria Pedagógica Inteligente</span>
        </div>
        <h2 className="yt-finder-title">Sugestor de Videoaulas Integrado ao Conteúdo do Professor</h2>
        <p className="yt-finder-subtitle">
          Alinha automaticamente as aulas ministradas aos canais educacionais abertos selecionados pela curadoria Áquila (Física com Boaro, Ferretto, Michel Arthaud, Jubilut, Débora Aladim, Marcos Aba, Gabs) com descritores BNCC e Níveis Áquila (Fundamentos, Aplicação e Aprofundamento).
        </p>
      </header>

      <div className="yt-finder-searchbar" role="search" aria-label="Pesquisar videoaulas">
        <div className="yt-search-input-wrap">
          <label htmlFor="yt-pedagogical-search-input" className="sr-only">Conteúdo da aula ou tópico de busca</label>
          <Search className="yt-search-icon" aria-hidden="true" />
          <input
            id="yt-pedagogical-search-input"
            type="text"
            className="yt-search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Digite o conteúdo da aula, fórmula ou dúvida do aluno (ex: Nikola Tesla, Leis de Ohm, Mitose, Estequiometria)..."
            aria-label="Digite o conteúdo da aula ou dúvida para busca de videoaulas"
          />
        </div>

        <div className="yt-filter-row">
          <div className="yt-filter-group" role="group" aria-label="Filtrar por Disciplina">
            <span className="yt-filter-label" id="disc-label">Disciplina:</span>
            {['Todas', 'Física', 'Matemática', 'Química', 'Biologia', 'História', 'Língua Portuguesa'].map((disc) => (
              <button
                key={disc}
                type="button"
                className={`yt-filter-chip ${selectedDiscipline === disc ? 'active' : ''}`}
                onClick={() => setSelectedDiscipline(disc)}
                aria-pressed={selectedDiscipline === disc}
                aria-labelledby={`disc-label`}
              >
                {disc}
              </button>
            ))}
          </div>

          <div className="yt-filter-group" role="group" aria-label="Filtrar por Nível Didático">
            <span className="yt-filter-label" id="stage-label">Nível Didático:</span>
            {[
              { id: 'all', label: 'Todos os Níveis' },
              { id: 'Nivel_1_Fundamentos', label: 'Nível 1: Fundamentos' },
              { id: 'Nivel_2_Aplicacao', label: 'Nível 2: Aplicação Curricular' },
              { id: 'Nivel_3_Aprofundamento', label: 'Nível 3: Aprofundamento' }
            ].map((stg) => (
              <button
                key={stg.id}
                type="button"
                className={`yt-filter-chip ${selectedStage === stg.id ? 'active' : ''}`}
                onClick={() => setSelectedStage(stg.id as any)}
                aria-pressed={selectedStage === stg.id}
                aria-labelledby={`stage-label`}
              >
                {stg.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="yt-results-grid" role="region" aria-label="Resultados de Videoaulas Recomendadas">
        {searchOutcome.results.map((video) => (
          <article key={video.id} className="yt-card" aria-label={`Vídeo: ${video.title}`}>
            <div
              className="yt-card-thumb-wrap"
              onClick={() => setActiveVideo(video)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setActiveVideo(video);
                }
              }}
              role="button"
              tabIndex={0}
              aria-label={`Abrir prévia da videoaula ${video.title}`}
            >
              <div className="yt-thumb-placeholder">
                <Video className="w-10 h-10 text-red-400" aria-hidden="true" />
                <span className="yt-duration" aria-label={`Duração: ${video.durationMinutes} minutos`}>{video.durationMinutes} min</span>
                <div className="yt-play-overlay" aria-hidden="true">
                  <Play className="w-12 h-12 text-white fill-white" />
                </div>
              </div>
            </div>

            <div className="yt-card-content">
              <div className="yt-card-tags" aria-label="Classificações curriculares">
                <span className="yt-tag discipline">{video.discipline}</span>
                <span className="yt-tag exam">{video.targetExam}</span>
                <span className="yt-tag stage">{video.difficultyStage.replace(/_/g, ' ')}</span>
                {video.bnccSkillCode && <span className="yt-tag bncc" aria-label={`Código BNCC ${video.bnccSkillCode}`}>{video.bnccSkillCode}</span>}
              </div>

              <h3 className="yt-card-title" title={video.title}>{video.title}</h3>
              <p className="yt-channel-name">Canal: <strong>{video.channelName}</strong></p>
              <p className="yt-summary">{video.pedagogicalSummary}</p>

              <div className="yt-card-footer">
                <button
                  type="button"
                  className="yt-btn-preview"
                  onClick={() => setActiveVideo(video)}
                  aria-label={`Assistir prévia de ${video.title}`}
                >
                  <Play className="w-4 h-4 mr-1 inline" aria-hidden="true" /> Assistir Prévia
                </button>
                {onSelectVideoForLessonPlan && (
                  <button
                    type="button"
                    className="yt-btn-attach"
                    onClick={() => onSelectVideoForLessonPlan(video)}
                    aria-label={`Vincular vídeo ${video.title} ao Plano de Aula do Professor`}
                  >
                    <CheckCircle2 className="w-4 h-4 mr-1 inline" aria-hidden="true" /> Vincular ao Plano
                  </button>
                )}
              </div>
            </div>
          </article>
        ))}
      </div>

      <div className="yt-external-helper">
        <a
          href={searchOutcome.suggestedYoutubeLiveSearchUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="yt-live-link"
          aria-label="Pesquisar este tema ao vivo no YouTube oficial (abre em nova aba)"
        >
          <span>Não encontrou exatamente o que precisava? Pesquisar ao vivo no YouTube</span>
          <ExternalLink className="w-4 h-4 ml-2 inline" aria-hidden="true" />
        </a>
      </div>

      {activeVideo && (
        <div
          className="yt-modal-backdrop"
          onClick={() => setActiveVideo(null)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="yt-modal-video-title"
        >
          <div className="yt-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="yt-modal-header">
              <h3 id="yt-modal-video-title">{activeVideo.title}</h3>
              <button
                type="button"
                className="yt-modal-close"
                onClick={() => setActiveVideo(null)}
                aria-label="Fechar janela de prévia do vídeo"
              >
                <X className="w-5 h-5 inline" aria-hidden="true" />
              </button>
            </div>
            <div className="yt-modal-player-box">
              <div className="yt-simulated-player">
                <div className="yt-player-center">
                  <Tv className="w-16 h-16 text-red-500 mb-2 inline" aria-hidden="true" />
                  <h4>Canal: {activeVideo.channelName}</h4>
                  <p className="text-sm text-gray-300 max-w-md mx-auto mb-4">{activeVideo.pedagogicalSummary}</p>
                  <a
                    href={`https://www.youtube.com/results?search_query=${encodeURIComponent(activeVideo.title + ' ' + activeVideo.channelName)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="yt-watch-direct-btn"
                    aria-label={`Abrir vídeo original do canal ${activeVideo.channelName} no YouTube oficial`}
                  >
                    <Play className="w-5 h-5 mr-2 inline" aria-hidden="true" /> Abrir Aula no YouTube Oficial
                  </a>
                </div>
              </div>
            </div>
            <div className="yt-modal-footer">
              <span className="text-sm text-purple-300">
                Alinhamento Curricular: <strong>{activeVideo.bnccSkillCode || 'BNCC Transversal'}</strong> • Nível: <strong>{activeVideo.difficultyStage.replace(/_/g, ' ')}</strong>
              </span>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default YouTubePedagogicalFinder;
