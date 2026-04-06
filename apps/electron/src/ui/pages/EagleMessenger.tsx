import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, Lock, ShieldAlert, Users, 
  MessageSquare, Hash, Zap, Globe, 
  Search, ArrowLeft, ShieldCheck, MoreVertical, CheckCheck, Megaphone,
  UserCircle, Settings2, Sparkles, BrainCircuit
} from 'lucide-react';
import { SecureMessage } from '../../services/AiTypes';
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
  const [messages, setMessages] = useState<(SecureMessage & { decryptedContent: string })[]>([]);
  const [inputText, setInputText] = useState('');
  const [activeChannel, setActiveChannel] = useState<string>('gen');
  const [channels, setChannels] = useState<{ id: string; name: string; type: string }[]>([]);
  const [isAlarmActive, setIsAlarmActive] = useState(false);
  const [isBroadcast, setIsBroadcast] = useState(false);
  
  // Adaptive AI State
  const [senderRole, setSenderRole] = useState('TEACHER');
  const [recipientRole, setRecipientRole] = useState('STUDENT');
  const [isAdapting, setIsAdapting] = useState(false);
  const [adaptedPreview, setAdaptedPreview] = useState<string | null>(null);
  
  const feedRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadInitialData = async () => {
      // @ts-ignore - window.aquila bridge
      const channelData = await window.aquila.messenger.getChannels();
      setChannels(channelData);
      
      // @ts-ignore - window.aquila bridge
      const initialMessages = await window.aquila.messenger.getMessages(activeChannel);
      setMessages(initialMessages);
    };
    loadInitialData();

    // @ts-ignore - window.aquila bridge
    const unbind = window.aquila.messenger.onNewMessage((msg: any) => {
      setMessages(prev => [...prev, msg]);
    });

    // @ts-ignore - window.aquila bridge
    const unbindAlarm = window.aquila.messenger.onSilentAlarm(() => {
      setIsAlarmActive(true);
      setTimeout(() => setIsAlarmActive(false), 5000);
    });

    return () => {
      unbind();
      unbindAlarm();
    };
  }, [activeChannel]);

  useEffect(() => {
    if (feedRef.current) {
      feedRef.current.scrollTop = feedRef.current.scrollHeight;
    }
  }, [messages]);

  const handleAdapt = async () => {
    if (!inputText.trim()) return;
    setIsAdapting(true);
    try {
      // @ts-ignore - Sovereign AI IPC call
      const adapted = await window.aquila.invoke('adapt-messenger-content', {
        senderRole,
        recipientRole,
        content: inputText
      });
      setAdaptedPreview(adapted);
    } catch (err) {
      console.error('Falha na adaptação Áquila:', err);
    } finally {
      setIsAdapting(false);
    }
  };

  const handleSend = () => {
    const finalContent = adaptedPreview || inputText;
    if (!finalContent.trim()) return;

    // @ts-ignore - window.aquila bridge
    window.aquila.messenger.send({
      sender: `Operador [${senderRole}]`,
      recipient: activeChannel === 'gen' ? `Todos [${recipientRole}]` : activeChannel,
      content: isBroadcast ? `[BROADCAST] ${finalContent}` : finalContent,
      priority: (inputText.startsWith('!') || isBroadcast) ? 'critical' : 'normal',
      isSilentAlarm: inputText.includes('ALERTA SILENCIOSO'),
      timestamp: new Date().toISOString()
    });

    setInputText('');
    setAdaptedPreview(null);
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
                 {channels.map(channel => (
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
          
          <div className="message-feed custom-scroll" ref={feedRef}>
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

          {/* Adaptive AI Preview Area */}
          {(isAdapting || adaptedPreview) && (
            <div className="ai-refinement-panel glass animate-slide-up">
               <div className="panel-header">
                  <span className="sparkle-pulse"><Sparkles size={14} /> Refinamento Eagle-AI</span>
                  {isAdapting && <div className="loader-mini"></div>}
               </div>
               <div className="panel-body">
                  {adaptedPreview ? (
                    <div className="preview-content">
                       <p className="preview-label">MENSAGEM REFINADA:</p>
                       <p className="adapted-text">{adaptedPreview}</p>
                    </div>
                  ) : (
                    <span className="adapting-label">O Cérebro Áquila está otimizando a comunicação...</span>
                  )}
               </div>
               <button className="confirm-refinement" onClick={handleSend} disabled={isAdapting}>
                  <BrainCircuit size={16} /> APROVAR E ENVIAR
               </button>
            </div>
          )}

          <div className="chat-input-area">
             <div className="role-selectors">
                <select value={senderRole} onChange={(e) => setSenderRole(e.target.value)} title="Papel do Remetente">
                   <option value="TEACHER">Professor (α)</option>
                   <option value="HR">RH</option>
                   <option value="DIRECTOR">Diretoria</option>
                   <option value="JANITOR">Operação/TI</option>
                </select>
                <span className="role-arrow">→</span>
                <select value={recipientRole} onChange={(e) => setRecipientRole(e.target.value)} title="Papel do Destinatário">
                   <option value="STUDENT">Aluno</option>
                   <option value="PARENT">Pais/Responsáveis</option>
                   <option value="JANITOR">Equipe Operacional</option>
                   <option value="HR">RH</option>
                </select>
             </div>
             
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
               placeholder="Digite sua mensagem oficial... Áquila adaptará o tom."
               value={inputText}
               onChange={(e) => setInputText(e.target.value)}
               onKeyDown={(e) => e.key === 'Enter' && (adaptedPreview ? handleSend() : handleAdapt())}
             />
             <button 
               className={`send-trigger ${isAdapting ? 'adapting' : ''}`} 
               onClick={adaptedPreview ? handleSend : handleAdapt} 
               title="Enviar / Adaptar" 
               aria-label="Processar Mensagem"
             >
                {adaptedPreview ? <Send size={20} /> : <Zap size={20} />}
             </button>
          </div>
        </main>
      </div>
    </div>
  );
};
