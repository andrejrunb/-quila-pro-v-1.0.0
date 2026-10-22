import React, { useState } from 'react';
import { schoolMessengerService, Message } from '../../services/SchoolMessengerService';
import './MessengerPortal.css';

import { ArrowLeft } from 'lucide-react';

/**
 * MessengerPortal (v2.1.0)
 * Unified interface for official school communication.
 */
const MessengerPortal: React.FC<{ userRole: string; onBack?: () => void }> = ({ userRole, onBack }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');

  const handleSend = async () => {
    if (!input.trim()) return;
    const newMsg = await schoolMessengerService.sendMessage({
      senderRole: userRole,
      content: input,
      type: 'TEXT'
    });
    setMessages([...messages, newMsg]);
    setInput('');
  };

  return (
    <div className="messenger-container">
      <div className="messenger-sidebar">
         <div className="sidebar-header">
            <h3 className="sidebar-title">ÁQUILA ELO</h3>
            <span className="channel-header-tiny">Canais Oficiais</span>
         </div>
         <div className="channel-list">
            <div className="channel active">📍 Mural da Escola</div>
            <div className="channel">📩 Secretaria</div>
            <div className="channel">👨‍🏫 Sala dos Professores</div>
         </div>
      </div>

      <div className="messenger-chat">
         <div className="chat-header">
            <div className="flex items-center gap-4">
               {onBack && (
                  <button onClick={onBack} className="p-2 hover:bg-white/10 rounded-full transition-all mr-2">
                     <ArrowLeft className="w-5 h-5 text-white" />
                  </button>
               )}
               <span className="chat-title">Mural da Escola</span>
            </div>
            <span className="online-stats">● 1.2k Alunos Online</span>
         </div>

         <div className="chat-feed">
            {messages.map(m => (
               <div key={m.id} className={`message-bubble ${m.senderRole === userRole ? 'sent' : 'received'}`}>
                  <span className="sender-tag">{m.senderRole}</span>
                  <p>{m.content}</p>
                  <span className="time-tag">{new Date(m.timestamp).toLocaleTimeString()}</span>
               </div>
            ))}
            <div className="message-bubble received">
               <span className="sender-tag">SISTEMA</span>
               <div className="template-card homework">
                  <h4>TAREFA DE CASA: MATEMÁTICA</h4>
                  <p>Exercícios 1 a 10, página 42.</p>
                  <button className="template-btn">ADICIONAR À AGENDA</button>
               </div>
            </div>
         </div>

         <div className="chat-input-area">
            <input 
              type="text" 
              placeholder="Digite sua mensagem oficial..." 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            />
            <button className="send-btn" onClick={handleSend}>ENVIAR</button>
         </div>
      </div>
    </div>
  );
};

export default MessengerPortal;
