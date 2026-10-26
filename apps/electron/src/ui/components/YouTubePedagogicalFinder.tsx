import React, { useState } from 'react';
import {
  Tv, Search, Play, ExternalLink, Filter, BookOpen,
  Award, Sparkles, Clock, CheckCircle2, ChevronRight, Video
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

  const searchOutcome = youtubeRecommender.searchRecommendedVideos({
    queryText: searchTerm,
    discipline: selectedDiscipline === 'Todas' ? undefined : selectedDiscipline,
    stage: selectedStage === 'all' ? undefined : selectedStage,
    maxResults: 8
  });

  return (
    <div className="yt-finder-container">
      <div className="yt-finder-header">
        <div className="yt-finder-badge">
          <Tv className="w-5 h-5 text-red-500 mr-2 inline" />
          <span>Áquila Video Radar • Curadoria Pedagógica Inteligente</span>
        </div>
        <h2 className="yt-finder-title">Sugestor de Videoaulas Integrado ao Conteúdo do Professor</h2>
        <p className="yt-finder-subtitle">
          Alinha automaticamente as aulas ministradas aos canais educacionais abertos selecionados pela curadoria Áquila (Física com Boaro, Ferretto, Michel Arthaud, Jubilut, Débora Aladim, Marcos Aba, Gabs) com descritores BNCC e Níveis Áquila (Fundamentos, Aplicação e Aprofundamento).
        </p>
      </div>

      <div className="yt-finder-searchbar">
        <div className="yt-search-input-wrap">
          <Search className="yt-search-icon" />
          <input
            type="text"
            className="yt-search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Digite o conteúdo da aula, fórmula ou dúvida do aluno (ex: Nikola Tesla, Leis de Ohm, Mitose, Estequiometria)..."
          />
        </div>

        <div className="yt-filter-row">
          <div className="yt-filter-group">
            <span className="yt-filter-label">Disciplina:</span>
            {['Todas', 'Física', 'Matemática', 'Química', 'Biologia', 'História', 'Língua Portuguesa'].map((disc) => (
              <button
                key={disc}
                className={`yt-filter-chip ${selectedDiscipline === disc ? 'active' : ''}`}
                onClick={() => setSelectedDiscipline(disc)}
              >
                {disc}
              </button>
            ))}
          </div>

          <div className="yt-filter-group">
            <span className="yt-filter-label">Nível Didático:</span>
            {[
              { id: 'all', label: 'Todos os Níveis' },
              { id: 'Nivel_1_Fundamentos', label: 'Nível 1: Fundamentos' },
              { id: 'Nivel_2_Aplicacao', label: 'Nível 2: Aplicação Curricular' },
              { id: 'Nivel_3_Aprofundamento', label: 'Nível 3: Aprofundamento' }
            ].map((stg) => (
              <button
                key={stg.id}
                className={`yt-filter-chip ${selectedStage === stg.id ? 'active' : ''}`}
                onClick={() => setSelectedStage(stg.id as any)}
              >
                {stg.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="yt-results-grid">
        {searchOutcome.results.map((video) => (
          <div key={video.id} className="yt-card">
            <div className="yt-card-thumb-wrap" onClick={() => setActiveVideo(video)}>
              <div className="yt-thumb-placeholder">
                <Video className="w-10 h-10 text-red-400" />
                <span className="yt-duration">{video.durationMinutes} min</span>
                <div className="yt-play-overlay">
                  <Play className="w-12 h-12 text-white fill-white" />
                </div>
              </div>
            </div>

            <div className="yt-card-content">
              <div className="yt-card-tags">
                <span className="yt-tag discipline">{video.discipline}</span>
                <span className="yt-tag exam">{video.targetExam}</span>
                <span className="yt-tag stage">{video.difficultyStage.replace('_', ' ')}</span>
                {video.bnccSkillCode && <span className="yt-tag bncc">{video.bnccSkillCode}</span>}
              </div>

              <h3 className="yt-card-title" title={video.title}>{video.title}</h3>
              <p className="yt-channel-name">Canal: <strong>{video.channelName}</strong></p>
              <p className="yt-summary">{video.pedagogicalSummary}</p>

              <div className="yt-card-footer">
                <button
                  className="yt-btn-preview"
                  onClick={() => setActiveVideo(video)}
                >
                  <Play className="w-4 h-4 mr-1 inline" /> Assistir Prévia
                </button>
                {onSelectVideoForLessonPlan && (
                  <button
                    className="yt-btn-attach"
                    onClick={() => onSelectVideoForLessonPlan(video)}
                  >
                    <CheckCircle2 className="w-4 h-4 mr-1 inline" /> Vincular ao Plano
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="yt-external-helper">
        <a
          href={searchOutcome.suggestedYoutubeLiveSearchUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="yt-live-link"
        >
          <span>Não encontrou exatamente o que precisava? Pesquisar ao vivo no YouTube</span>
          <ExternalLink className="w-4 h-4 ml-2 inline" />
        </a>
      </div>

      {activeVideo && (
        <div className="yt-modal-backdrop" onClick={() => setActiveVideo(null)}>
          <div className="yt-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="yt-modal-header">
              <h3>{activeVideo.title}</h3>
              <button className="yt-modal-close" onClick={() => setActiveVideo(null)}>×</button>
            </div>
            <div className="yt-modal-player-box">
              <div className="yt-simulated-player">
                <div className="yt-player-center">
                  <Tv className="w-16 h-16 text-red-500 mb-2 inline" />
                  <h4>Canal: {activeVideo.channelName}</h4>
                  <p className="text-sm text-gray-300 max-w-md mx-auto mb-4">{activeVideo.pedagogicalSummary}</p>
                  <a
                    href={`https://www.youtube.com/results?search_query=${encodeURIComponent(activeVideo.title + ' ' + activeVideo.channelName)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="yt-watch-direct-btn"
                  >
                    <Play className="w-5 h-5 mr-2 inline" /> Abrir Aula no YouTube Oficial
                  </a>
                </div>
              </div>
            </div>
            <div className="yt-modal-footer">
              <span className="text-sm text-purple-300">
                Alinhamento Curricular: <strong>{activeVideo.bnccSkillCode || 'BNCC Transversal'}</strong> • Nível: <strong>{activeVideo.difficultyStage}</strong>
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default YouTubePedagogicalFinder;
