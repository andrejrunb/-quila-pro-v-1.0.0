import React, { useState } from 'react';
import { Brain, CheckCircle2, XCircle, SkipForward, Play, Award, Zap } from 'lucide-react';
import './SRSMorpher.css';

interface SRSReviewCard {
  id: string;
  question: string;
  answer: string;
  category: string;
}

interface SRSMorpherProps {
  cards: SRSReviewCard[];
  tone: 'Encouraging' | 'Firm' | 'Practical' | 'Normal';
  onFinish: (results: { cardId: string; quality: number }[]) => void;
}

/**
 * SRSMorpher (v3461/v3480)
 * Interface imersiva de revisão de flashcards com adaptação de tom pedagógico.
 */
export const SRSMorpher: React.FC<SRSMorpherProps> = ({ cards, tone, onFinish }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [results, setResults] = useState<{ cardId: string; quality: number }[]>([]);

  const currentCard = cards[currentIndex];

  const handleRate = (quality: number) => {
    const newResults = [...results, { cardId: currentCard.id, quality }];
    setResults(newResults);

    if (currentIndex < cards.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setShowAnswer(false);
    } else {
      onFinish(newResults);
    }
  };

  if (!currentCard) return null;

  return (
    <div className="srs-morpher-container glass animate-fade-in">
       <div className="srs-progress-bar">
          <div 
            className="progress-fill" 
            style={{ width: `${((currentIndex + 1) / cards.length) * 100}%` }} 
          />
       </div>

       <header className="srs-header">
          <div className="srs-meta-left">
             <div className="category-tag">
                <Brain size={12} /> {currentCard.category.toUpperCase()}
             </div>
             <div className={`tone-badge tone-${tone.toLowerCase()}`}>
                <Zap size={10} /> TOM IA: {tone.toUpperCase()}
             </div>
          </div>
          <span className="card-counter">Card {currentIndex + 1} de {cards.length}</span>
       </header>

       <main className="srs-card-stage">
          <div className={`flip-card ${showAnswer ? 'flipped' : ''}`}>
             <div className="card-face card-front">
                <p className="card-question">{currentCard.question}</p>
                {!showAnswer && (
                  <button className="btn-reveal" onClick={() => setShowAnswer(true)}>
                     <Play size={18} fill="currentColor" /> MOSTRAR RESPOSTA
                  </button>
                )}
             </div>

                <div className="morph-progress-track">
                    <div className="morph-progress-fill srs-morph-fill-logic"></div>
                </div>
             <div className="card-face card-back">
                <p className="card-answer">{currentCard.answer}</p>
                <div className="rating-actions">
                   <button className="rate-btn rate-0" onClick={() => handleRate(0)} title="Esqueci Totalmente">
                      <XCircle size={20} />
                      <span>ESQUECI</span>
                   </button>
                   <button className="rate-btn rate-3" onClick={() => handleRate(3)} title="Difícil">
                      <SkipForward size={20} />
                      <span>DIFÍCIL</span>
                   </button>
                   <button className="rate-btn rate-5" onClick={() => handleRate(5)} title="Fácil">
                      <CheckCircle2 size={20} />
                      <span>FÁCIL</span>
                   </button>
                </div>
             </div>
          </div>
       </main>

       <footer className="srs-footer">
          <div className="srs-hint">
             <Zap size={14} className="text-orange-400" />
             DICA: Tente explicar o conceito em voz alta antes de virar o card.
          </div>
       </footer>
    </div>
  );
};
