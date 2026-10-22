import React, { useState } from 'react';
import { 
  Send, 
  Brain, 
  ShieldCheck, 
  Trash2, 
  Download,
  Info
} from 'lucide-react';
import './SovereignWorkspace.css';

const SovereignWorkspace: React.FC = () => {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = { role: 'user', content: input, timestamp: Date.now() };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      // Simulação de chamada via Shield Proxy
      const response = await (window as any).aquila.invoke('shield:ask-sovereign', {
        prompt: input
      });

      setMessages(prev => [...prev, {
        role: 'ai',
        content: response.content,
        sanitized: response.sanitized,
        timestamp: Date.now()
      }]);
    } catch (err) {
      console.error('Erro na IA Soberana:', err);
      setMessages(prev => [...prev, {
        role: 'ai',
        content: 'Desculpe, ocorreu uma falha na conexão soberana.',
        error: true,
        timestamp: Date.now()
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="workspace-container">
      <div className="workspace-sidebar">
        <div className="ws-logo">
          <Brain size={24} />
          <span>Sovereign Workspace</span>
        </div>
        <button className="btn-new-chat">Novo Chat de Produtividade</button>
        <div className="history-list">
          <div className="history-item active">Plano de Aula: Genética</div>
          <div className="history-item">Relatório de Frequência</div>
        </div>
        <div className="sovereign-info-box">
          <ShieldCheck size={16} />
          <p>Seus dados nunca saem desta unidade.</p>
        </div>
      </div>

      <main className="chat-area">
        <header className="chat-header">
           <div className="model-info">
             <strong>Áquila Llama 3 (Sovereign Edition)</strong>
             <span className="status">Online — NPU Accelerate</span>
           </div>
           <div className="header-actions">
              <Download size={18} />
              <Trash2 size={18} />
           </div>
        </header>

        <div className="messages-container">
          {messages.length === 0 && (
            <div className="welcome-box">
               <Brain size={48} className="welcome-icon" />
               <h2>Olá, Professor.</h2>
               <p>Como posso ajudar em sua produtividade acadêmica hoje?</p>
               <div className="hint-cards">
                 <div className="hint">"Crie um plano de aula sobre a 2ª Lei de Mendel"</div>
                 <div className="hint">"Resuma o relatório de evasão da Turma 3A"</div>
               </div>
            </div>
          )}
          {messages.map((msg, i) => (
            <div key={i} className={`message-row ${msg.role}`}>
              <div className="avatar">{msg.role === 'ai' ? <Brain size={16} /> : 'U'}</div>
              <div className="msg-content">
                <p>{msg.content}</p>
                {msg.sanitized && <span className="sanitized-badge"><ShieldCheck size={10} /> Prompts Higienizados (DLP)</span>}
              </div>
            </div>
          ))}
          {loading && <div className="loading-dots">O enxame está processando<span>.</span><span>.</span><span>.</span></div>}
        </div>

        <footer className="input-area">
          <div className="input-box-wrapper">
             <input 
               type="text" 
               placeholder="Pergunte qualquer coisa à IA Soberana..." 
               value={input}
               onChange={(e) => setInput(e.target.value)}
               onKeyDown={(e) => e.key === 'Enter' && handleSend()}
             />
             <button onClick={handleSend} className="btn-send"><Send size={20} /></button>
          </div>
          <p className="footer-disclaimer">
             <Info size={12} /> Áquila Pro v2.0.0 — IA Preditiva e Soberana.
          </p>
        </footer>
      </main>
    </div>
  );
};

export default SovereignWorkspace;
