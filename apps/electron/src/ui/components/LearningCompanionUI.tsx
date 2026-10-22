import React, { useState, useEffect } from 'react';
import { Sparkles, MessageCircle, Heart, X, Send } from 'lucide-react';
import './LearningCompanionUI.css';

const LearningCompanionUI: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [companion, setCompanion] = useState<any>(null);
  const [nudge, setNudge] = useState<string>("");
  const [inputText, setInputText] = useState("");
  const [messages, setMessages] = useState<{ role: 'bot' | 'user'; text: string }[]>([
    { role: 'bot', text: 'Olá! Sou o Áquila Guide. Pergunte sobre qualquer funcionalidade do sistema.' },
  ]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchCompanionData = async () => {
    try {
      const studentId = 'STU-123';
      const data = await (window as any).aquila.invoke('companion:get-state', { studentId });
      setCompanion(data);
    } catch (err) {
      // Fallback: companion data não é obrigatório
      setCompanion({ name: 'Áquila Guide', symbiosisLevel: 75 });
    }
  };

  useEffect(() => {
    fetchCompanionData();
    const timer = setTimeout(() => {
      setNudge("Precisa de ajuda? Clique aqui para conversar!");
    }, 5000);
    return () => clearTimeout(timer);
  }, []);

  const sendMessage = async () => {
    const text = inputText.trim();
    if (!text || isLoading) return;

    setMessages((prev) => [...prev, { role: 'user', text }]);
    setInputText("");
    setIsLoading(true);

    try {
      const response = await (window as any).aquila.invoke('ai:chat', {
        message: text,
        context: 'Você é o Áquila Guide, um assistente de ajuda do sistema escolar Áquila Pro. Responda de forma curta e útil em português.'
      });
      setMessages((prev) => [...prev, { role: 'bot', text: response || 'Desculpe, não consegui processar. Tente novamente.' }]);
    } catch {
      setMessages((prev) => [...prev, { role: 'bot', text: 'Sem conexão com a IA no momento. Tente mais tarde ou consulte a Central de Ajuda no menu.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!companion) return null;

  return (
    <div className={`companion-overlay ${isOpen ? 'expanded' : 'collapsed'}`}>
      {nudge && !isOpen && (
        <div className="nudge-bubble animate-bounce-subtle" onClick={() => { setIsOpen(true); setNudge(""); }}>
          {nudge}
        </div>
      )}

      <div className="companion-avatar" onClick={() => setIsOpen(!isOpen)}>
        <div className="avatar-glow"></div>
        <Sparkles className="avatar-icon" size={24} />
        {companion.symbiosisLevel > 50 && <Heart className="symbiosis-heart" size={10} />}
      </div>

      {isOpen && (
        <div className="companion-window glass-panel">
          <header className="c-win-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MessageCircle size={14} style={{ color: '#60a5fa' }} />
              <span>{companion.name}</span>
            </div>
            <button onClick={() => setIsOpen(false)} className="close-btn"><X size={14} /></button>
          </header>

          <div className="c-win-body">
             <div className="companion-chat">
               {messages.map((msg, idx) => (
                 <div key={idx} className={msg.role === 'bot' ? 'msg-bot' : 'msg-user'}>
                   {msg.text}
                 </div>
               ))}
               {isLoading && (
                 <div className="msg-bot msg-loading">
                   <span className="dot-anim">●</span> <span className="dot-anim d2">●</span> <span className="dot-anim d3">●</span>
                 </div>
               )}
             </div>
          </div>

          <footer className="c-win-footer">
             <div className="guide-input-row">
               <input
                 type="text"
                 placeholder="Pergunte algo..."
                 autoFocus
                 value={inputText}
                 onChange={(e) => setInputText(e.target.value)}
                 onKeyDown={handleKeyDown}
               />
               <button className="guide-send-btn" onClick={sendMessage} disabled={isLoading || !inputText.trim()}>
                 <Send size={16} />
               </button>
             </div>
          </footer>
        </div>
      )}
    </div>
  );
};

export default LearningCompanionUI;

