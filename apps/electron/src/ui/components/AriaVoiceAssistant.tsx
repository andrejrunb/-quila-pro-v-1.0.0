import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Command, X, Search, Sparkles, ChevronRight } from 'lucide-react';
import { OmnissearchService, SearchResult } from '../../services/OmnissearchService';
import { Database } from '../../database/Database';
import './AriaVoiceAssistant.css';

/**
 * ARIA Voice Assistant (v3801)
 * Interface flutuante de I.A. Multimodal.
 * Permite controle do School OS via voz e comandos rápidos.
 */
const AriaVoiceAssistant: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const searchService = useRef(new OmnissearchService(Database.getInstance()));
  const recognition = useRef<any>(null);

  useEffect(() => {
    // Configuração de Speech Recognition (v3801)
    if ('webkitSpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition;
      recognition.current = new SpeechRecognition();
      recognition.current.continuous = false;
      recognition.current.interimResults = true;
      recognition.current.lang = 'pt-BR';

      recognition.current.onresult = (event: any) => {
        const current = event.resultIndex;
        const resultTranscript = event.results[current][0].transcript;
        setTranscript(resultTranscript);
        
        if (event.results[current].isFinal) {
          handleCommand(resultTranscript);
        }
      };

      recognition.current.onend = () => {
        setIsListening(false);
      };

      recognition.current.onerror = (event: any) => {
        console.error('[ARIA] Speech error:', event.error);
        setIsListening(false);
      };
    }
  }, []);

  const toggleListening = () => {
    if (isListening) {
      recognition.current?.stop();
    } else {
      setTranscript('');
      setResults([]);
      setIsListening(true);
      recognition.current?.start();
    }
  };

  const handleCommand = async (text: string) => {
    setIsProcessing(true);
    try {
      const response = await searchService.current.processVoiceCommand(text);
      if (response.action === 'SEARCH_RESULTS') {
        setResults(response.data);
      } else if (response.action === 'NAVIGATE') {
        // Lógica de navegação via evento global ou callback
        console.log('[ARIA] Navigating to:', response.data.page);
        window.dispatchEvent(new CustomEvent('aria-navigate', { detail: response.data.page }));
        setIsOpen(false);
      }
    } catch (err) {
      console.error('[ARIA] Command processing failed:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className={`aria-wrapper ${isOpen ? 'aria-active' : ''}`}>
      {/* Botão de Ativação Flutuante */}
      <button 
        className={`aria-trigger ${isListening ? 'listening' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        title="Ativar ARIA (I.A. de Voz)"
      >
        <div className="trigger-core">
          {isListening ? <Mic size={24} /> : <Sparkles size={24} />}
        </div>
        <div className="trigger-rings">
          <div className="ring ring-1"></div>
          <div className="ring ring-2"></div>
        </div>
      </button>

      {/* Painel do Assistente */}
      {isOpen && (
        <div className="aria-panel glass animate-slide-up">
          <header className="aria-header">
            <div className="header-title">
              <Sparkles size={16} className="text-emerald-400" />
              <span>ARIA INTELLIGENCE</span>
            </div>
            <button onClick={() => setIsOpen(false)} className="close-btn" title="Fechar Assistente">
              <X size={16} />
            </button>
          </header>

          <div className="aria-body">
            <div className={`voice-visualizer ${isListening ? 'active' : ''}`}>
              <div className="bar"></div>
              <div className="bar"></div>
              <div className="bar"></div>
              <div className="bar"></div>
              <div className="bar"></div>
            </div>

            <p className="transcript-area">
              {transcript || (isListening ? 'Ouvindo...' : 'Como posso ajudar hoje?')}
            </p>

            {results.length > 0 && (
              <div className="aria-results">
                <p className="results-label">Resultados Encontrados:</p>
                {results.map((res, idx) => (
                  <div key={idx} className="result-item glass-hover">
                    <div className="result-icon">
                      <Search size={14} />
                    </div>
                    <div className="result-info">
                      <p className="result-title">{res.title}</p>
                      <p className="result-subtitle">{res.subtitle}</p>
                    </div>
                    <ChevronRight size={14} className="ml-auto opacity-40" />
                  </div>
                ))}
              </div>
            )}
          </div>

          <footer className="aria-footer">
            <button 
              className={`mic-btn ${isListening ? 'active' : ''}`}
              onClick={toggleListening}
            >
              {isListening ? <MicOff size={20} /> : <Mic size={20} />}
              <span>{isListening ? 'PARAR' : 'FALAR'}</span>
            </button>
            <div className="keyboard-fallback">
              <Command size={14} />
              <input 
                type="text" 
                placeholder="Ou digite um comando..." 
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleCommand((e.target as HTMLInputElement).value);
                    (e.target as HTMLInputElement).value = '';
                  }
                }}
              />
            </div>
          </footer>
        </div>
      )}
    </div>
  );
};

export default AriaVoiceAssistant;
