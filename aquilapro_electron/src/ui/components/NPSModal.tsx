import React, { useState } from 'react';
import { Star, MessageSquare, Send, X, Heart } from 'lucide-react';
import './NPSModal.css';

interface NPSModalProps {
  onClose: () => void;
  onSubmit: (score: number, feedback: string) => void;
  userName?: string;
}

/**
 * NPSModal
 * High-fidelity feedback modal for school administrators.
 * Zero-Debt Architecture with Vanilla CSS and ARIA compliance.
 */
export const NPSModal: React.FC<NPSModalProps> = ({ onClose, onSubmit, userName }) => {
  const [score, setScore] = useState<number | null>(null);
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleScoreSelect = (val: number) => setScore(val);

  const handleSubmit = async () => {
    if (score === null) return;
    setIsSubmitting(true);
    await onSubmit(score, feedback);
    setIsSubmitting(false);
    onClose();
  };

  return (
    <div className="nps-overlay" role="dialog" aria-modal="true" aria-labelledby="nps-title">
      <div className="nps-modal-card animate-scale-in">
        <button 
          className="nps-close-btn" 
          onClick={onClose}
          aria-label="Close Feedback Modal"
          title="Close"
        >
          <X size={20} />
        </button>

        <div className="nps-header">
           <div className="nps-avatar-ring">
              <Heart size={24} className="text-rose-500 fill-rose-500/20" />
           </div>
           <h2 id="nps-title" className="nps-title">How was your experience, {userName || 'Manager'}?</h2>
           <p className="nps-subtitle">Your sovereign feedback helps us improve the quila ecosystem.</p>
        </div>

        <div className="nps-body">
           <div className="nps-score-label">HOW LIKELY ARE YOU TO RECOMMEND QUILA?</div>
           
           <div className="nps-score-grid" role="radiogroup" aria-label="Recommendation Score (0-10)">
              {[...Array(11)].map((_, i) => (
                score === i ? (
                  <button
                    key={i}
                    type="button"
                    role="radio"
                    aria-checked="true"
                    aria-label={`Score ${i}`}
                    className="nps-score-btn active"
                    onClick={() => handleScoreSelect(i)}
                    title={`Rate ${i}`}
                  >
                    {i}
                  </button>
                ) : (
                  <button
                    key={i}
                    type="button"
                    role="radio"
                    aria-checked="false"
                    aria-label={`Score ${i}`}
                    className="nps-score-btn"
                    onClick={() => handleScoreSelect(i)}
                    title={`Rate ${i}`}
                  >
                    {i}
                  </button>
                )
              ))}
           </div>
           
           <div className="flex justify-between text-[10px] items-center mt-2 px-1 text-gray-500 font-bold uppercase tracking-widest">
              <span>Not Likely</span>
              <span>Extremely Likely</span>
           </div>

           <div className="nps-feedback-area mt-8">
              <label htmlFor="nps-feedback" className="nps-score-label mb-3 block">TELL US MORE (OPTIONAL)</label>
              <div className="relative">
                 <MessageSquare size={16} className="absolute left-4 top-4 text-gray-400" />
                 <textarea
                   id="nps-feedback"
                   className="nps-textarea"
                   placeholder="Your insights drive our evolution..."
                   value={feedback}
                   onChange={(e) => setFeedback(e.target.value)}
                 />
              </div>
           </div>
        </div>

        <div className="nps-footer">
           <button 
             className={`nps-submit-btn ${score === null ? 'disabled' : ''}`}
             disabled={score === null || isSubmitting}
             onClick={handleSubmit}
           >
              {isSubmitting ? 'Sending...' : 'Send Feedback'}
              <Send size={18} className="ml-2" />
           </button>
        </div>
      </div>
    </div>
  );
};
