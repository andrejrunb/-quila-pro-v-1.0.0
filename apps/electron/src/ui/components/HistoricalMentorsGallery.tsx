import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  HISTORICAL_CHARACTERS,
  HistoricalCharacter,
  CharacterArea,
  generateCharacterResponse
} from '../utils/historicalPersonas';
import {
  Search,
  Sparkles,
  Volume2,
  VolumeX,
  Send,
  MessageSquare,
  Award,
  BookOpen,
  Filter,
  CheckCircle2,
  RotateCcw,
  Zap,
  Globe
} from 'lucide-react';
import './HistoricalMentorsGallery.css';

interface HistoricalMentorsGalleryProps {
  studentName?: string;
  gradeLevel?: string;
  onRewardXp?: (amount: number, reason: string) => void;
}

interface ChatMessage {
  sender: 'student' | 'mentor';
  text: string;
  timestamp: string;
}

const AREA_LABELS: Record<string, string> = {
  all: 'Todos os Pensadores',
  physics_astronomy: 'Física & Cosmologia',
  biology_medicine: 'Biologia & Medicina',
  chemistry_matter: 'Química & Matéria',
  math_computing: 'Matemática & Computação',
  humanities_philosophy: 'Humanidades & Letras',
  engineering_invention: 'Engenharia & Invenções'
};

export const HistoricalMentorsGallery: React.FC<HistoricalMentorsGalleryProps> = ({
  studentName = 'Estudante Áquila',
  gradeLevel = '3º Ano do Ensino Médio',
  onRewardXp
}) => {
  const [selectedArea, setSelectedArea] = useState<'all' | CharacterArea>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeMentor, setActiveMentor] = useState<HistoricalCharacter>(HISTORICAL_CHARACTERS[0]); // Marie Curie
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([
    {
      sender: 'mentor',
      text: HISTORICAL_CHARACTERS[0].introGreeting,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputQuestion, setInputQuestion] = useState<string>('');
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [dialogCount, setDialogCount] = useState<number>(0);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  // Filtra personagens por área e busca
  const filteredCharacters = useMemo(() => {
    return HISTORICAL_CHARACTERS.filter(char => {
      const matchArea = selectedArea === 'all' || char.area === selectedArea;
      const q = searchQuery.trim().toLowerCase();
      const matchQuery =
        !q ||
        char.name.toLowerCase().includes(q) ||
        char.areaLabel.toLowerCase().includes(q) ||
        char.country.toLowerCase().includes(q) ||
        char.notableWork.toLowerCase().includes(q) ||
        char.keyTopics.some(t => t.toLowerCase().includes(q));
      return matchArea && matchQuery;
    });
  }, [selectedArea, searchQuery]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, isTyping]);

  // Ao selecionar novo mentor
  const handleSelectMentor = (mentor: HistoricalCharacter) => {
    window.speechSynthesis?.cancel();
    setIsSpeaking(false);
    setActiveMentor(mentor);
    setChatHistory([
      {
        sender: 'mentor',
        text: mentor.introGreeting,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  };

  // Síntese de Voz (TTS)
  const speakText = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    if (isSpeaking) {
      setIsSpeaking(false);
      return;
    }
    const clean = text.replace(/[*#_`>]/g, '');
    const utterance = new SpeechSynthesisUtterance(clean);
    utterance.lang = 'pt-BR';
    utterance.rate = 1.05;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  // Enviar Pergunta ao Mentor
  const handleSendMessage = async (textToSend?: string) => {
    const question = (textToSend || inputQuestion).trim();
    if (!question || isTyping) return;

    setInputQuestion('');
    const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    setChatHistory(prev => [
      ...prev,
      { sender: 'student', text: question, timestamp: timeNow }
    ]);
    setIsTyping(true);

    try {
      let reply = '';
      // Tenta rota neural via IPC se disponível
      if ((window as any).aquila?.invoke) {
        try {
          const aiRes = await (window as any).aquila.invoke('ai:chat', {
            message: question,
            context: `Você é ${activeMentor.name} (${activeMentor.epoch}, ${activeMentor.country}). 
Obra notável: ${activeMentor.notableWork}. 
Diretriz de Persona: ${activeMentor.systemPrompt}. 
Responda em 1ª pessoa com rigor científico e clareza para o estudante ${studentName} (${gradeLevel}).`
          });
          if (aiRes && typeof aiRes === 'string' && !aiRes.includes('Erro')) {
            reply = aiRes;
          }
        } catch {
          // fallback
        }
      }

      if (!reply) {
        // Fallback socrático determinístico de alta fidelidade
        reply = generateCharacterResponse(activeMentor, question, gradeLevel);
      }

      setTimeout(() => {
        setChatHistory(prev => [
          ...prev,
          {
            sender: 'mentor',
            text: reply,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
        setIsTyping(false);

        // Recompensa XP no primeiro e terceiro diálogo
        const newCount = dialogCount + 1;
        setDialogCount(newCount);
        if (newCount === 1) {
          onRewardXp?.(50, `Diálogo inaugural com ${activeMentor.name}`);
        } else if (newCount === 3) {
          onRewardXp?.(100, `Mestria socrática com ${activeMentor.name}`);
        }
      }, 600);
    } catch {
      setIsTyping(false);
    }
  };

  return (
    <div className="mentors-gallery-shell">
      {/* Coluna Esquerda: Catálogo dos 75+ Cientistas */}
      <div className="mentors-sidebar">
        <div className="mentors-search-box">
          <div className="search-input-wrapper">
            <Search size={14} className="search-icon" />
            <input
              type="text"
              placeholder="Buscar cientista, país, tema (ex: Marie Curie, relatividade, radioatividade)..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>

          {/* Filtros por Área */}
          <div className="areas-filter-strip">
            {Object.entries(AREA_LABELS).map(([areaKey, label]) => (
              <button
                key={areaKey}
                className={`area-filter-btn ${selectedArea === areaKey ? 'active' : ''}`}
                onClick={() => setSelectedArea(areaKey as any)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Lista de Cards de Mentores */}
        <div className="mentors-list-scroll">
          <div className="mentors-count-badge">
            <span>{filteredCharacters.length} CIENTISTAS & PENSADORES EM DOMÍNIO PÚBLICO</span>
          </div>

          <div className="mentors-cards-grid">
            {filteredCharacters.map(char => (
              <div
                key={char.id}
                className={`mentor-card ${activeMentor.id === char.id ? 'active' : ''}`}
                onClick={() => handleSelectMentor(char)}
              >
                <div className="mentor-avatar">{char.avatarIcon}</div>
                <div className="mentor-info">
                  <div className="mentor-name-row">
                    <strong>{char.name}</strong>
                    <span className="mentor-epoch">{char.epoch}</span>
                  </div>
                  <span className="mentor-area-label">{char.areaLabel}</span>
                  <span className="mentor-country">{char.country}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Coluna Direita: Diálogo Socrático Interativo */}
      <div className="mentor-dialog-panel">
        {/* Banner do Mentor Ativo */}
        <header className="active-mentor-banner">
          <div className="banner-left">
            <div className="banner-avatar">{activeMentor.avatarIcon}</div>
            <div>
              <div className="banner-title-row">
                <h2>{activeMentor.name}</h2>
                <span className="banner-area-pill">{activeMentor.areaLabel}</span>
                <span className="banner-country-pill">{activeMentor.country} • {activeMentor.epoch}</span>
              </div>
              <p className="banner-work">
                <strong>Legado Notável:</strong> {activeMentor.notableWork}
              </p>
            </div>
          </div>

          <div className="banner-actions">
            <button
              className="voice-synth-btn"
              onClick={() => {
                const lastMentorMsg = [...chatHistory].reverse().find(m => m.sender === 'mentor');
                if (lastMentorMsg) speakText(lastMentorMsg.text);
              }}
              title="Ouvir resposta do mentor em voz alta"
            >
              {isSpeaking ? <VolumeX size={15} color="#F59E0B" /> : <Volume2 size={15} color="#00F0FF" />}
              <span>{isSpeaking ? 'Pausar Áudio' : 'Ouvir Mentor'}</span>
            </button>
          </div>
        </header>

        {/* Citação Histórica */}
        <div className="famous-quote-bar">
          <span className="quote-mark">“</span>
          <span>{activeMentor.famousQuote}</span>
          <span className="quote-mark">”</span>
        </div>

        {/* Histórico do Diálogo */}
        <div className="chat-messages-container">
          {chatHistory.map((msg, idx) => (
            <div key={idx} className={`dialog-bubble ${msg.sender === 'mentor' ? 'mentor-msg' : 'student-msg'}`}>
              <div className="bubble-header">
                <strong>{msg.sender === 'mentor' ? activeMentor.name : studentName}</strong>
                <span className="bubble-time">{msg.timestamp}</span>
              </div>
              <div className="bubble-text" style={{ whiteSpace: 'pre-line' }}>
                {msg.text}
              </div>
              {msg.sender === 'mentor' && (
                <button
                  className="inline-voice-btn"
                  onClick={() => speakText(msg.text)}
                  title="Ouvir esta mensagem"
                >
                  <Volume2 size={12} />
                  <span>Ouvir</span>
                </button>
              )}
            </div>
          ))}

          {isTyping && (
            <div className="dialog-bubble mentor-msg typing-bubble">
              <span className="typing-dot" />
              <span className="typing-dot" />
              <span className="typing-dot" />
              <span style={{ fontSize: '0.75rem', color: '#94a3b8', marginLeft: '0.5rem' }}>
                {activeMentor.name} está formulando a explicação socrática...
              </span>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Sugestões de Perguntas do Próprio Mentor */}
        <div className="suggested-prompts-bar">
          <span className="prompts-label">Desafios de {activeMentor.name}:</span>
          <button
            className="prompt-chip"
            onClick={() => handleSendMessage(activeMentor.suggestedPrompt)}
          >
            <Sparkles size={11} />
            <span>{activeMentor.suggestedPrompt}</span>
          </button>
          <button
            className="prompt-chip"
            onClick={() => handleSendMessage(`Como o conceito central de ${activeMentor.keyTopics[0]} cai nas provas do ENEM e vestibulares?`)}
          >
            <span>Questão ENEM sobre {activeMentor.keyTopics[0]}</span>
          </button>
        </div>

        {/* Barra de Digitação */}
        <div className="dialog-input-bar">
          <input
            type="text"
            placeholder={`Faça uma pergunta sobre ciência, história ou faça um desafio a ${activeMentor.name}...`}
            value={inputQuestion}
            onChange={e => setInputQuestion(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
            className="dialog-input"
          />
          <button
            className="dialog-send-btn"
            onClick={() => handleSendMessage()}
            disabled={!inputQuestion.trim() || isTyping}
          >
            <Send size={15} />
            <span>Dialogar</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default HistoricalMentorsGallery;
