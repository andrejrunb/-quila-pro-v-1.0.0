import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, Lock, ShieldAlert, Users, 
  MessageSquare, Hash, Zap, Globe, 
  Search, ArrowLeft, ShieldCheck, MoreVertical, CheckCheck, Megaphone 
} from 'lucide-react';
import communicationHubService, { SecureMessage, MessageChannel } from '../../services/CommunicationHubService';
import './EagleMessenger.css';

interface EagleMessengerProps {
  onBack: () => void;
}

/**
 * EagleMessenger (v3510)
 * Hub de comunicação criptografada (E2EE) para o SOC.
 * Suporta broadcasts hierárquicos e Alarmes Silenciosos.
 */
export const EagleMessenger: React.FC<EagleMessengerProps> = ({ onBack }) => {
  const [messages, setMessages] = useState<(SecureMessage & { decryptedContent: string })[]>(
    communicationHubService.getDecryptedHistory()
  );
  const [inputText, setInputText] = useState('');
  const [activeChannel, setActiveChannel] = useState<string>('gen');
  const [isAlarmActive, setIsAlarmActive] = useState(false);
  const [isBroadcast, setIsBroadcast] = useState(false);
  const feedRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleNewMessage = () => {
      setMessages(communicationHubService.getDecryptedHistory());
    };

    const handleSilentAlarm = () => {
      setIsAlarmActive(true);
      setTimeout(() => setIsAlarmActive(false), 5000); // Overlay temporário
    };

    communicationHubService.on('new-message', handleNewMessage);
    communicationHubService.on('silent-alarm', handleSilentAlarm);

    return () => {
      communicationHubService.off('new-message', handleNewMessage);
      communicationHubService.off('silent-alarm', handleSilentAlarm);
    };
  }, []);

  useEffect(() => {
    if (feedRef.current) {
      feedRef.current.scrollTop = feedRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    if (!inputText.trim()) return;

    communicationHubService.sendMessage({
      sender: 'Operador SOC // ALPHA',
      recipient: activeChannel === 'gen' ? 'Todos' : activeChannel,
      content: isBroadcast ? `[BROADCAST] ${inputText}` : inputText,
      priority: inputText.startsWith('!') || isBroadcast ? 'critical' : 'normal',
      isSilentAlarm: inputText.includes('ALERTA SILENCIOSO')
    });

    setInputText('');
    setIsBroadcast(false);
  };

  return (
    <div className="messenger-container animate-fade-in">
      <header className="messenger-header">
        <div>
          <div className="messenger-badge">
             <Lock size={12} className="mr-1.5" />
             Link E2EE Soberano Ativo
          </div>
          <h1 className="messenger-title">Eagle Messenger</h1>
        </div>

        <button onClick={onBack} className="back-btn">
          <ArrowLeft size={18} /> Voltar ao SOC
        </button>
      </header>

      <div className="messenger-grid">
        {/* Sidebar */}
        <aside className="channel-sidebar">
           <div className="sidebar-section">
              <h3 className="section-title">Canais de Comando</h3>
              <div className="channel-list">
                 {communicationHubService.channels.map(channel => (
                   <div 
                     key={channel.id} 
                     className={`channel-item ${activeChannel === channel.id ? 'active' : ''}`}
                     onClick={() => setActiveChannel(channel.id)}
                   >
                     <Hash size={16} />
                     <div className="channel-info">
                        <span className="channel-name">{channel.name}</span>
                        <span className="channel-id">{channel.type}</span>
                     </div>
                   </div>
                 ))}
              </div>
           </div>

           <div className="sidebar-section">
              <h3 className="section-title">Serviços de Segurança</h3>
              <div className="channel-item">
                 <ShieldAlert size={16} color="#f87171" />
                 <span className="channel-name">Alerta Silencioso (Broadcast)</span>
              </div>
              <div className="channel-item">
                 <Users size={16} color="#60a5fa" />
                 <span className="channel-name">Chat Multi-Unidade</span>
              </div>
           </div>

           <div className="messenger-footer-stats">
              <ShieldCheck size={14} color="#10b981" />
              <span>Criptografia Rotativa Ativa</span>
           </div>
        </aside>

        {/* Chat Main */}
        <main className="chat-main">
          {isAlarmActive && <div className="silent-alarm-active"></div>}
          
          <div className="message-feed" ref={feedRef}>
            {messages.length === 0 ? (
              <div className="empty-state">Iniciando conexão segura com a rede Eagle...</div>
            ) : (
              messages.map(msg => (
                <div key={msg.id} className={`message-bubble ${msg.sender.includes('Operador') ? 'sent' : 'received'}`}>
                  <div className="message-sender">{msg.sender}</div>
                  <div className="message-content">
                    {msg.decryptedContent}
                  </div>
                  <div className="message-meta">
                    <span className={`priority-${msg.priority}`}>{msg.priority.toUpperCase()}</span>
                    <span>{new Date(msg.timestamp).toLocaleTimeString()}</span>
                    <div className="status-icons">
                       <Lock size={10} />
                       {msg.sender.includes('Operador') && <CheckCheck size={12} className="text-blue-400" />}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="chat-input-area">
             <button 
               className={`input-action-btn ${isBroadcast ? 'active' : ''}`} 
               title="Modo Broadcast (Aviso Geral)" 
               onClick={() => setIsBroadcast(!isBroadcast)}
             >
                <Megaphone size={20} />
             </button>
             <input 
               type="text" 
               className="chat-input-field" 
               placeholder="Digite uma mensagem segura... (! para Alta Prioridade)"
               value={inputText}
               onChange={(e) => setInputText(e.target.value)}
               onKeyDown={(e) => e.key === 'Enter' && handleSend()}
             />
             <button className="send-trigger" onClick={handleSend} title="Enviar Mensagem Criptografada" aria-label="Enviar Mensagem Criptografada">
                <Send size={20} />
             </button>
          </div>
        </main>
      </div>
    </div>
  );
};
