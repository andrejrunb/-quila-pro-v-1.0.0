import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, Lock, ShieldAlert, Users, 
  MessageSquare, Hash, Zap, Globe, 
  Search, ArrowLeft, ShieldCheck, MoreVertical, CheckCheck, Megaphone,
  UserCircle, Settings2, Sparkles, BrainCircuit,
  FileText, Vote, CreditCard, CheckCircle2, FileCheck2, Trash2
} from 'lucide-react';
import { SecureMessage } from '../../services/AiTypes';
import './EagleMessenger.css';

export interface Attachment {
  type: 'poll' | 'authorization' | 'payment';
  title: string;
  data: any;
  status?: string;
}

interface EagleMessengerProps {
  onBack: () => void;
}

/**
 * EagleMessenger (v5.300)
 * Hub de comunicação criptografada (E2EE) com melhorias ClassApp.
 * Suporta canais segmentados, enquetes, autorizações, cobranças digitais e templates de I.A.
 */
export const EagleMessenger: React.FC<EagleMessengerProps> = ({ onBack }) => {
  const [messages, setMessages] = useState<(SecureMessage & { decryptedContent: string; attachment?: Attachment })[]>([]);
  const [inputText, setInputText] = useState('');
  const [activeChannel, setActiveChannel] = useState<string>('gen');
  const [channels, setChannels] = useState<{ id: string; name: string; type: string }[]>([]);
  const [isAlarmActive, setIsAlarmActive] = useState(false);
  const [isBroadcast, setIsBroadcast] = useState(false);
  
  // Target audience checkboxes
  const [targetAudience, setTargetAudience] = useState({
    students: true,
    pedagogical: true,
    financial: false
  });

  // Adaptive AI State
  const [senderRole, setSenderRole] = useState('TEACHER');
  const [isAdapting, setIsAdapting] = useState(false);
  const [adaptedPreview, setAdaptedPreview] = useState<string | null>(null);

  // Attachment States
  const [activeAttachmentType, setActiveAttachmentType] = useState<'poll' | 'authorization' | 'payment' | null>(null);
  const [pendingAttachment, setPendingAttachment] = useState<Attachment | null>(null);
  const [attachmentStates, setAttachmentStates] = useState<Record<string, { votedIndex?: number; authorized?: boolean; paid?: boolean }>>({});

  // Poll Builder
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptionsText, setPollOptionsText] = useState('Sim, Não');

  // Auth Builder
  const [authEventName, setAuthEventName] = useState('');
  const [authDescription, setAuthDescription] = useState('');

  // Payment Builder
  const [paymentTitle, setPaymentTitle] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentDueDate, setPaymentDueDate] = useState('');
  
  const feedRef = useRef<HTMLDivElement>(null);

  const AI_TEMPLATES = [
    {
      title: "📢 Circular de Reunião",
      desc: "Reunião de Pais e Mestres sobre avaliação.",
      prompt: "Olá senhores pais. Convidamos todos para a Reunião de Pais e Mestres que ocorrerá na próxima sexta-feira às 19h na quadra da escola. Discutiremos os resultados do bimestre."
    },
    {
      title: "📝 Registro de Indisciplina",
      desc: "Notificação de uso de celular em sala.",
      prompt: "Gostaríamos de notificar que o aluno foi flagrado utilizando aparelho celular durante a aula de Matemática. Solicitamos apoio para reforçar as regras internas da escola."
    },
    {
      title: "💳 Lembrete de Mensalidade",
      desc: "Aviso amigável de cobrança aberta.",
      prompt: "Lembrete: A mensalidade escolar referente ao mês atual possui vencimento nos próximos dias. Caso já tenha efetuado o pagamento, por favor desconsidere este aviso."
    },
    {
      title: "🚌 Passeio ao Planetário",
      desc: "Solicitação de autorização de saída.",
      prompt: "Prezados pais. No dia 25 de junho realizaremos um passeio pedagógico ao Planetário Municipal. A saída ocorrerá às 8h com retorno previsto para 12h."
    }
  ];

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
      setMessages(prev => {
        // Evitar duplicar se a mensagem já existe no feed local
        if (prev.some(m => m.timestamp === msg.timestamp && m.content === msg.content)) {
          return prev;
        }
        return [...prev, msg];
      });
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

  const playAudioBeep = (type: 'success' | 'error' | 'candidate') => {
    try {
      const AudioContext = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      if (type === 'success') {
        osc.frequency.setValueAtTime(660, ctx.currentTime);
        gain.gain.setValueAtTime(0.04, ctx.currentTime);
        osc.start();
        osc.stop(ctx.currentTime + 0.1);
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.frequency.setValueAtTime(880, ctx.currentTime + 0.12);
        gain2.gain.setValueAtTime(0.04, ctx.currentTime + 0.12);
        osc2.start(ctx.currentTime + 0.12);
        osc2.stop(ctx.currentTime + 0.25);
      } else if (type === 'candidate') {
        osc.frequency.setValueAtTime(587.33, ctx.currentTime);
        gain.gain.setValueAtTime(0.04, ctx.currentTime);
        osc.start();
        osc.stop(ctx.currentTime + 0.15);
      } else {
        osc.frequency.setValueAtTime(220, ctx.currentTime);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        osc.start();
        osc.stop(ctx.currentTime + 0.2);
      }
    } catch {}
  };

  const handleAdapt = async () => {
    if (!inputText.trim()) return;
    setIsAdapting(true);
    try {
      const roleNames = [];
      if (targetAudience.students) roleNames.push('STUDENT');
      if (targetAudience.pedagogical) roleNames.push('PARENT');
      if (targetAudience.financial) roleNames.push('FINANCIAL');
      
      // @ts-ignore - Sovereign AI IPC call
      const adapted = await window.aquila.invoke('adapt-messenger-content', {
        senderRole,
        recipientRole: roleNames.length > 0 ? roleNames[0] : 'PARENT',
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
    if (!finalContent.trim() && !pendingAttachment) return;

    const roleNames = [];
    if (targetAudience.students) roleNames.push('Alunos');
    if (targetAudience.pedagogical) roleNames.push('Pedagógico');
    if (targetAudience.financial) roleNames.push('Financeiro');
    const recipientLabel = roleNames.length > 0 ? roleNames.join(' + ') : 'Filtro Geral';

    const messagePayload = {
      sender: `Operador [${senderRole}]`,
      recipient: activeChannel === 'gen' ? `Público: ${recipientLabel}` : activeChannel,
      content: isBroadcast ? `[BROADCAST] ${finalContent}` : finalContent,
      decryptedContent: isBroadcast ? `[BROADCAST] ${finalContent}` : finalContent,
      priority: (inputText.startsWith('!') || isBroadcast) ? 'critical' : 'normal',
      isSilentAlarm: inputText.includes('ALERTA SILENCIOSO'),
      timestamp: new Date().toISOString(),
      attachment: pendingAttachment || undefined
    };

    // @ts-ignore - window.aquila bridge
    window.aquila.messenger.send(messagePayload);

    // Append locally to guarantee visual updates on the socket
    setMessages(prev => {
      if (prev.some(m => m.timestamp === messagePayload.timestamp && m.content === messagePayload.content)) {
        return prev;
      }
      return [...prev, messagePayload];
    });

    setInputText('');
    setAdaptedPreview(null);
    setIsBroadcast(false);
    setPendingAttachment(null);
    playAudioBeep('success');
  };

  const handleVote = (msgId: string, optionIdx: number) => {
    setAttachmentStates(prev => {
      const state = prev[msgId] || {};
      if (state.votedIndex !== undefined) return prev;
      playAudioBeep('success');
      return {
        ...prev,
        [msgId]: {
          ...state,
          votedIndex: optionIdx
        }
      };
    });
  };

  const handleAuthorize = (msgId: string) => {
    setAttachmentStates(prev => {
      const state = prev[msgId] || {};
      const newStatus = !state.authorized;
      playAudioBeep(newStatus ? 'success' : 'error');
      return {
        ...prev,
        [msgId]: {
          ...state,
          authorized: newStatus
        }
      };
    });
  };

  const handlePay = (msgId: string) => {
    setAttachmentStates(prev => {
      const state = prev[msgId] || {};
      if (state.paid) return prev;
      navigator.clipboard.writeText("00020126580014br.gov.pix0136mock-key-aquila-pro-financial-hub520400005303986540510.005802BR5925Aquila Pro School Ledger6009Fortaleza62070503***6304");
      alert("Código PIX Copiado para a Área de Transferência!");
      playAudioBeep('success');
      return {
        ...prev,
        [msgId]: {
          ...state,
          paid: true
        }
      };
    });
  };

  const renderAttachment = (msgId: string, attachment: Attachment) => {
    const state = attachmentStates[msgId] || {};

    if (attachment.type === 'poll') {
      const options = attachment.data.options || [];
      const votedIdx = state.votedIndex;
      const totalVotes = options.reduce((sum: number, opt: any) => sum + opt.votes, 0) + (votedIdx !== undefined ? 1 : 0);

      return (
        <div className="mt-3 bg-slate-950/80 border border-emerald-500/20 rounded-xl p-4 flex flex-col gap-3 font-sans max-w-sm animate-in zoom-in-95 duration-200 text-left">
          <div className="flex items-center gap-2 border-b border-white/5 pb-2">
            <Vote size={14} className="text-emerald-400" />
            <span className="text-[10px] font-bold tracking-wider uppercase text-emerald-400">Enquete ClassApp</span>
          </div>
          <p className="text-xs font-bold text-slate-100">{attachment.data.question}</p>
          <div className="flex flex-col gap-2">
            {options.map((opt: any, idx: number) => {
              const baseVotes = opt.votes || 0;
              const isSelected = votedIdx === idx;
              const votesForOpt = baseVotes + (isSelected ? 1 : 0);
              const pct = totalVotes > 0 ? Math.round((votesForOpt / totalVotes) * 100) : 0;

              return (
                <button
                  key={idx}
                  disabled={votedIdx !== undefined}
                  onClick={() => handleVote(msgId, idx)}
                  className={`w-full relative overflow-hidden p-2.5 rounded-lg border text-left text-xs transition ${
                    isSelected 
                      ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400 font-bold' 
                      : votedIdx !== undefined 
                        ? 'border-slate-800 bg-slate-900/40 text-slate-500' 
                        : 'border-slate-800 bg-slate-900/60 hover:bg-slate-800 text-slate-300'
                  }`}
                >
                  <div className="absolute top-0 bottom-0 left-0 bg-emerald-500/5 transition-all duration-500" style={{ width: `${pct}%` }} />
                  <div className="relative z-10 flex justify-between">
                    <span>{opt.text}</span>
                    <span className="font-mono text-[10px]">{pct}% ({votesForOpt})</span>
                  </div>
                </button>
              );
            })}
          </div>
          <span className="text-[9px] text-slate-500 text-right">{totalVotes} votos registrados</span>
        </div>
      );
    }

    if (attachment.type === 'authorization') {
      const isAuth = state.authorized;
      return (
        <div className="mt-3 bg-slate-950/80 border border-purple-500/20 rounded-xl p-4 flex flex-col gap-3 font-sans max-w-sm animate-in zoom-in-95 duration-200 text-left">
          <div className="flex items-center gap-2 border-b border-white/5 pb-2">
            <FileCheck2 size={14} className="text-purple-400" />
            <span className="text-[10px] font-bold tracking-wider uppercase text-purple-400">Autorização Digital</span>
          </div>
          <p className="text-xs font-bold text-slate-100">{attachment.data.title}</p>
          <p className="text-[11px] text-slate-400 leading-relaxed">{attachment.data.description}</p>
          
          <button
            onClick={() => handleAuthorize(msgId)}
            className={`w-full py-2.5 rounded-lg font-bold text-xs transition border flex items-center justify-center gap-2 ${
              isAuth 
                ? 'bg-purple-600 border-purple-500 text-white shadow-lg shadow-purple-900/30' 
                : 'bg-purple-500/10 hover:bg-purple-500/20 border-purple-500/30 text-purple-400'
            }`}
          >
            {isAuth ? (
              <>
                <CheckCircle2 size={14} /> AUTORIZADO PELO RESPONSÁVEL
              </>
            ) : (
              "AUTORIZAR SAÍDA"
            )}
          </button>
        </div>
      );
    }

    if (attachment.type === 'payment') {
      const isPaid = state.paid;
      return (
        <div className="mt-3 bg-slate-950/80 border border-blue-500/20 rounded-xl p-4 flex flex-col gap-3 font-sans max-w-sm animate-in zoom-in-95 duration-200 text-left">
          <div className="flex items-center gap-2 border-b border-white/5 pb-2">
            <CreditCard size={14} className="text-blue-400" />
            <span className="text-[10px] font-bold tracking-wider uppercase text-blue-400">Cobrança Digital</span>
          </div>
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-bold text-slate-100">{attachment.data.title}</p>
              <p className="text-[10px] text-slate-500 mt-0.5">Vencimento: {attachment.data.due}</p>
            </div>
            <span className="text-xs font-mono font-bold text-blue-400">R$ {attachment.data.value}</span>
          </div>
          
          <button
            onClick={() => handlePay(msgId)}
            className={`w-full py-2.5 rounded-lg font-bold text-xs transition border ${
              isPaid 
                ? 'bg-emerald-600/20 border-emerald-500/30 text-emerald-400 font-bold cursor-default' 
                : 'bg-blue-600 hover:bg-blue-500 border-blue-500 text-white'
            }`}
          >
            {isPaid ? "PAGAMENTO REALIZADO" : "PAGAR COM PIX (COPIAR CHAVE)"}
          </button>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="messenger-container animate-fade-in relative">
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
        {/* Sidebar Channels & Templates */}
        <aside className="channel-sidebar flex flex-col gap-6">
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

           {/* AI Templates Panel */}
           <div className="sidebar-section">
              <h3 className="section-title flex items-center gap-1.5 text-emerald-400">
                <Sparkles size={14} /> Modelos de I.A. (ClassApp)
              </h3>
              <div className="flex flex-col gap-2 mt-2">
                {AI_TEMPLATES.map((tpl, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setInputText(tpl.prompt);
                      playAudioBeep('candidate');
                    }}
                    className="w-full p-2.5 rounded-xl bg-slate-900/50 hover:bg-slate-800 border border-slate-800/80 hover:border-emerald-500/30 text-left transition flex flex-col gap-0.5"
                  >
                    <span className="text-xs font-bold text-slate-200">{tpl.title}</span>
                    <span className="text-[10px] text-slate-500 leading-tight">{tpl.desc}</span>
                  </button>
                ))}
              </div>
           </div>

           <div className="sidebar-section mt-auto">
              <div className="messenger-footer-stats">
                 <ShieldCheck size={14} color="#10b981" />
                 <span>Criptografia Rotativa Ativa</span>
              </div>
           </div>
        </aside>

        {/* Chat Main */}
        <main className="chat-main flex flex-col h-full">
          {isAlarmActive && <div className="silent-alarm-active"></div>}
          
          <div className="message-feed custom-scroll flex-1" ref={feedRef}>
            {messages.length === 0 ? (
              <div className="empty-state">Iniciando conexão segura com a rede Eagle...</div>
            ) : (
              messages.map(msg => (
                <div key={msg.id} className={`message-bubble ${msg.sender.includes('Operador') ? 'sent' : 'received'}`}>
                  <div className="message-sender">{msg.sender}</div>
                  <div className="message-content">
                    {msg.decryptedContent}
                    {msg.attachment && renderAttachment(msg.id, msg.attachment)}
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

          {/* AI Refinement Preview */}
          {(isAdapting || adaptedPreview) && (
            <div className="ai-refinement-panel glass animate-slide-up">
               <div className="panel-header">
                  <span className="sparkle-pulse"><Sparkles size={14} /> Refinamento Eagle-AI</span>
                  {isAdapting && <div className="loader-mini"></div>}
               </div>
               <div className="panel-body text-left">
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

          {/* Pending Attachment Box */}
          {pendingAttachment && (
            <div className="bg-slate-900 border-t border-emerald-500/30 px-6 py-3 flex items-center justify-between animate-in slide-in-from-bottom duration-200">
              <div className="flex items-center gap-2">
                <div className="bg-emerald-500/20 p-2 rounded-xl text-emerald-400">
                  {pendingAttachment.type === 'poll' && <Vote size={16} />}
                  {pendingAttachment.type === 'authorization' && <FileCheck2 size={16} />}
                  {pendingAttachment.type === 'payment' && <CreditCard size={16} />}
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-100">Anexo Preparado: {pendingAttachment.title}</p>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider">Será enviado junto com o comunicado</p>
                </div>
              </div>
              <button 
                onClick={() => setPendingAttachment(null)}
                className="text-red-400 hover:text-red-300 p-2 hover:bg-slate-800 rounded-lg transition"
                title="Remover Anexo"
              >
                <Trash2 size={16} />
              </button>
            </div>
          )}

          {/* Input Panel with Checkbox Filters */}
          <div className="chat-input-area flex flex-col gap-4 p-4 border-t border-slate-800 bg-slate-950/40">
             
             {/* ClassApp Target Audience Selector */}
             {activeChannel === 'gen' && (
               <div className="flex flex-wrap items-center gap-4 border-b border-white/5 pb-2">
                 <span className="text-[10px] uppercase font-black tracking-widest text-slate-500 flex items-center gap-1.5">
                   <Users size={12} /> Público-Alvo:
                 </span>
                 <div className="flex items-center gap-4 flex-wrap">
                   <label className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer hover:text-white transition select-none">
                     <input 
                       type="checkbox" 
                       checked={targetAudience.students}
                       onChange={(e) => setTargetAudience({...targetAudience, students: e.target.checked})}
                       className="rounded border-slate-800 bg-slate-950 text-emerald-500 focus:ring-0" 
                     />
                     Alunos
                   </label>
                   <label className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer hover:text-white transition select-none">
                     <input 
                       type="checkbox" 
                       checked={targetAudience.pedagogical}
                       onChange={(e) => setTargetAudience({...targetAudience, pedagogical: e.target.checked})}
                       className="rounded border-slate-800 bg-slate-950 text-emerald-500 focus:ring-0" 
                     />
                     Responsáveis Pedagógicos
                   </label>
                   <label className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer hover:text-white transition select-none">
                     <input 
                       type="checkbox" 
                       checked={targetAudience.financial}
                       onChange={(e) => setTargetAudience({...targetAudience, financial: e.target.checked})}
                       className="rounded border-slate-800 bg-slate-950 text-emerald-500 focus:ring-0" 
                     />
                     Responsáveis Financeiros
                   </label>
                 </div>
               </div>
             )}

             <div className="flex items-center gap-3 w-full">
               <div className="role-selectors">
                  <select value={senderRole} onChange={(e) => setSenderRole(e.target.value)} title="Remetente">
                     <option value="TEACHER">Professor (α)</option>
                     <option value="HR">RH</option>
                     <option value="DIRECTOR">Diretoria</option>
                     <option value="JANITOR">Operação/TI</option>
                  </select>
               </div>
               
               <button 
                 className={`input-action-btn ${isBroadcast ? 'active' : ''}`} 
                 title="Modo Broadcast (Aviso Geral)" 
                 onClick={() => setIsBroadcast(!isBroadcast)}
               >
                  <Megaphone size={18} />
               </button>

               {/* Attachments Selector Trigger dropdown */}
               <div className="relative group">
                 <button 
                   className="input-action-btn hover:text-emerald-400"
                   title="Anexar Comunicado ClassApp"
                 >
                   <FileText size={18} />
                 </button>
                 <div className="absolute bottom-full mb-2 left-0 hidden group-hover:flex flex-col bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-1.5 z-40 w-44 font-sans text-xs">
                   <button 
                     onClick={() => {
                       setPollQuestion("");
                       setActiveAttachmentType("poll");
                     }}
                     className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-emerald-400 text-left transition"
                   >
                     <Vote size={14} /> Anexar Enquete
                   </button>
                   <button 
                     onClick={() => {
                       setAuthEventName("");
                       setAuthDescription("");
                       setActiveAttachmentType("authorization");
                     }}
                     className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-purple-400 text-left transition"
                   >
                     <FileCheck2 size={14} /> Pedir Autorização
                   </button>
                   <button 
                     onClick={() => {
                       setPaymentTitle("");
                       setPaymentAmount("");
                       setPaymentDueDate("");
                       setActiveAttachmentType("payment");
                     }}
                     className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-blue-400 text-left transition"
                   >
                     <CreditCard size={14} /> Anexar Boleto/Pix
                   </button>
                 </div>
               </div>

               <input 
                 type="text" 
                 className="chat-input-field flex-1" 
                 placeholder="Digite sua mensagem oficial... Áquila adaptará o tom."
                 value={inputText}
                 onChange={(e) => setInputText(e.target.value)}
                 onKeyDown={(e) => e.key === 'Enter' && (adaptedPreview ? handleSend() : handleAdapt())}
               />

               <button 
                 className={`send-trigger ${isAdapting ? 'adapting' : ''}`} 
                 onClick={adaptedPreview ? handleSend : handleAdapt} 
                 title="Enviar / Adaptar"
                 aria-label="Enviar"
               >
                  {adaptedPreview ? <Send size={20} /> : <Zap size={20} />}
               </button>
             </div>
          </div>
        </main>
      </div>

      {/* Attachment Builder Modal */}
      {activeAttachmentType && (
        <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
           <div className="bg-slate-900 border border-emerald-500/30 w-full max-w-md rounded-2xl shadow-2xl p-6 flex flex-col gap-4 animate-in zoom-in-95 duration-200">
              <div className="flex items-center gap-3 border-b border-white/10 pb-4">
                 <div className="bg-emerald-500/20 p-2.5 rounded-xl text-emerald-400">
                    {activeAttachmentType === 'poll' && <Vote size={20} />}
                    {activeAttachmentType === 'authorization' && <FileCheck2 size={20} />}
                    {activeAttachmentType === 'payment' && <CreditCard size={20} />}
                 </div>
                 <div>
                    <h2 className="text-base font-bold text-white text-left">
                      {activeAttachmentType === 'poll' && "Nova Enquete ClassApp"}
                      {activeAttachmentType === 'authorization' && "Nova Solicitação de Autorização"}
                      {activeAttachmentType === 'payment' && "Nova Cobrança Digital"}
                    </h2>
                    <p className="text-xs text-slate-400 text-left">Configure os dados do anexo interativo:</p>
                 </div>
              </div>

              {activeAttachmentType === 'poll' && (
                <div className="space-y-4 text-left">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] uppercase font-bold text-slate-500">Pergunta da Enquete</label>
                    <input 
                      type="text" 
                      value={pollQuestion} 
                      onChange={(e) => setPollQuestion(e.target.value)} 
                      placeholder="Ex: Seu filho participará do desfile?" 
                      className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] uppercase font-bold text-slate-500">Opções (Separadas por vírgula)</label>
                    <input 
                      type="text" 
                      value={pollOptionsText} 
                      onChange={(e) => setPollOptionsText(e.target.value)} 
                      placeholder="Ex: Sim, Não, Não sei" 
                      className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              )}

              {activeAttachmentType === 'authorization' && (
                <div className="space-y-4 text-left">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] uppercase font-bold text-slate-500">Título do Evento</label>
                    <input 
                      type="text" 
                      value={authEventName} 
                      onChange={(e) => setAuthEventName(e.target.value)} 
                      placeholder="Ex: Autorização Passeio Zoológico" 
                      className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] uppercase font-bold text-slate-500">Descrição/Termos</label>
                    <textarea 
                      value={authDescription} 
                      onChange={(e) => setAuthDescription(e.target.value)} 
                      placeholder="Ex: Autorizo meu filho a participar da visita pedagógica ao zoológico municipal..." 
                      className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 outline-none focus:border-emerald-500 h-24 resize-none"
                    />
                  </div>
                </div>
              )}

              {activeAttachmentType === 'payment' && (
                <div className="space-y-4 text-left">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] uppercase font-bold text-slate-500">Título da Cobrança</label>
                    <input 
                      type="text" 
                      value={paymentTitle} 
                      onChange={(e) => setPaymentTitle(e.target.value)} 
                      placeholder="Ex: Parcela 06/12 - Mensalidade Escolar" 
                      className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] uppercase font-bold text-slate-500">Valor (R$)</label>
                      <input 
                        type="text" 
                        value={paymentAmount} 
                        onChange={(e) => setPaymentAmount(e.target.value)} 
                        placeholder="Ex: 850,00" 
                        className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] uppercase font-bold text-slate-500">Vencimento</label>
                      <input 
                        type="text" 
                        value={paymentDueDate} 
                        onChange={(e) => setPaymentDueDate(e.target.value)} 
                        placeholder="Ex: 15/06/2026" 
                        className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                 <button 
                   onClick={() => setActiveAttachmentType(null)} 
                   className="px-5 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white transition"
                 >
                    DESCARTAR
                 </button>
                 <button 
                   onClick={() => {
                     if (activeAttachmentType === 'poll' && pollQuestion) {
                       setPendingAttachment({
                         type: 'poll',
                         title: 'Enquete: ' + pollQuestion,
                         data: {
                           question: pollQuestion,
                           options: pollOptionsText.split(',').map(o => ({ text: o.trim(), votes: Math.floor(Math.random() * 8) }))
                         }
                       });
                     } else if (activeAttachmentType === 'authorization' && authEventName) {
                       setPendingAttachment({
                         type: 'authorization',
                         title: authEventName,
                         data: {
                           title: authEventName,
                           description: authDescription
                         }
                       });
                     } else if (activeAttachmentType === 'payment' && paymentTitle) {
                       setPendingAttachment({
                         type: 'payment',
                         title: paymentTitle,
                         data: {
                           title: paymentTitle,
                           value: paymentAmount,
                           due: paymentDueDate
                         }
                       });
                     }
                     setActiveAttachmentType(null);
                     playAudioBeep('candidate');
                   }}
                   className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-5 py-2 rounded-xl transition"
                 >
                    ANEXAR COMUNICADO
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};
