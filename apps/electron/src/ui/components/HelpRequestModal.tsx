import React, { useState } from 'react';
import { Send, X, AlertCircle, HelpCircle, ShieldCheck, CheckCircle2 } from 'lucide-react';
import './HelpRequestModal.css';

interface HelpRequestModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

const HelpRequestModal: React.FC<HelpRequestModalProps> = ({ onClose, onSuccess }) => {
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [urgency, setUrgency] = useState<'low' | 'medium' | 'high'>('medium');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject || !description) return;

    setIsSending(true);
    setError(null);

    try {
      const result = await (window as any).aquila.insight.requestSwarmHelp({
        subject,
        description,
        urgency,
        category: 'pedagogical'
      });

      if (result.success) {
        setShowSuccess(true);
        setTimeout(() => {
          onSuccess();
        }, 2000);
      } else {
        setError(result.error || 'Falha ao processar solicitação.');
      }
    } catch (err) {
      setError('Erro de conexão com o enxame Áquila.');
    } finally {
      setIsSending(false);
    }
  };

  if (showSuccess) {
    return (
      <div className="hrm-overlay">
        <div className="hrm-container shadow-2xl glass-morphism animate-scale-in text-center p-12">
           <div className="success-checkmark-wrapper mb-6">
              <CheckCircle2 size={64} className="text-secondary animate-bounce" />
           </div>
           <h3 className="text-xl font-bold text-white mb-2">Solicitação Enviada!</h3>
           <p className="text-sm text-dim">Seu pedido foi anonimizado e já está propagando na malha Áquila.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="hrm-overlay">
      <div className="hrm-container shadow-2xl glass-morphism animate-fade-in">
        <header className="hrm-header">
          <div className="hrm-title-group">
            <HelpCircle className="hrm-icon-glow" />
            <div>
              <h3>Solicitar Apoio Coletivo</h3>
              <p>Sua dúvida será anonimizada e enviada ao Broker Áquila.</p>
            </div>
          </div>
          <button className="hrm-close" onClick={onClose} aria-label="Fechar">
            <X size={20} />
          </button>
        </header>

        <form className="hrm-form" onSubmit={handleSubmit}>
          {error && (
            <div className="hrm-error">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <div className="hrm-field">
            <label>Assunto / Tópico</label>
            <input 
              type="text" 
              placeholder="Ex: Alfabetização tardia em alunos com TDAH"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
              maxLength={100}
            />
          </div>

          <div className="hrm-field">
            <label>Contexto da Solicitação</label>
            <textarea 
              placeholder="Descreva o desafio pedagógico. Não inclua nomes de alunos ou dados sensíveis próprios."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              rows={4}
            />
          </div>

          <div className="hrm-field">
            <label>Nível de Urgência</label>
            <div className="hrm-urgency-grid">
              {(['low', 'medium', 'high'] as const).map((u) => (
                <button
                  key={u}
                  type="button"
                  className={`hrm-urgency-btn ${urgency === u ? 'active' : ''} ${u}`}
                  onClick={() => setUrgency(u)}
                >
                  {u === 'low' ? 'Rotina' : u === 'medium' ? 'Apoio Médio' : 'Crítico'}
                </button>
              ))}
            </div>
          </div>

          <div className="hrm-privacy-info">
            <ShieldCheck size={16} color="var(--accent-glow)" />
            <span>O Córtex Áquila irá auditar esta mensagem antes do envio para garantir conformidade LGPD.</span>
          </div>

          <footer className="hrm-footer">
            <button type="button" className="hrm-cancel" onClick={onClose}>Cancelar</button>
            <button type="submit" className="hrm-submit" disabled={isSending}>
              {isSending ? (
                <div className="hrm-spinner"></div>
              ) : (
                <>
                  <Send size={16} /> Enviar ao Enxame
                </>
              )}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
};

export default HelpRequestModal;
