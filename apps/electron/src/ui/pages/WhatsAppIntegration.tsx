import React, { useState } from 'react';
import { 
  Search, 
  MoreVertical, 
  Paperclip, 
  Smile, 
  Send, 
  Phone, 
  Video, 
  Check, 
  CheckCheck 
} from 'lucide-react';

// Dados simulados para demonstração
const mockChats = [
  { id: 1, name: 'João Silva (Pai)', lastMessage: 'Bom dia, o boletim já está disponível?', time: '10:30', unread: 2, avatar: 'JS' },
  { id: 2, name: 'Maria Souza (Aluna)', lastMessage: 'Professora, não entendi a tarefa.', time: '09:15', unread: 0, avatar: 'MS' },
  { id: 3, name: 'Carlos Oliveira (Pai)', lastMessage: 'Obrigado pela informação.', time: 'Ontem', unread: 0, avatar: 'CO' },
  { id: 4, name: 'Ana Costa (Aluna)', lastMessage: 'Estou enviando o trabalho em anexo.', time: 'Ontem', unread: 1, avatar: 'AC' },
];

const mockMessages = [
  { id: 1, sender: 'them', text: 'Bom dia!', time: '10:28' },
  { id: 2, sender: 'me', text: 'Bom dia, João! Como posso ajudar?', time: '10:29' },
  { id: 3, sender: 'them', text: 'O boletim já está disponível?', time: '10:30' },
];

export default function WhatsAppIntegration() {
  const [selectedChat, setSelectedChat] = useState(mockChats[0]);
  const [messageInput, setMessageInput] = useState('');

  return (
    <div className="flex h-screen w-full bg-[#0f172a] text-slate-200 p-2 sm:p-4 font-sans">
      <div className="flex w-full h-full max-w-7xl mx-auto rounded-3xl overflow-hidden border border-slate-700/50 bg-slate-900/40 backdrop-blur-xl shadow-2xl relative">
        
        {/* Painel Esquerdo - Lista de Conversas */}
        <div className="w-full sm:w-1/3 sm:min-w-[340px] sm:max-w-[400px] flex flex-col border-r border-slate-700/50 bg-slate-800/20 z-10 hidden sm:flex">
          {/* Cabeçalho da Sidebar */}
          <div className="flex items-center justify-between p-4 border-b border-slate-700/50 bg-slate-800/40 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30 text-indigo-300 font-semibold shadow-[0_0_15px_rgba(99,102,241,0.2)]">
                AP
              </div>
              <span className="font-medium text-slate-100">Áquila Bot</span>
            </div>
            <div className="flex gap-4 text-slate-400">
              <button className="hover:text-indigo-400 transition-colors duration-200">
                <MoreVertical size={20} />
              </button>
            </div>
          </div>

          {/* Barra de Pesquisa */}
          <div className="p-3 border-b border-slate-700/30">
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-400 transition-colors" size={18} />
              <input 
                type="text" 
                placeholder="Pesquisar ou começar nova conversa" 
                className="w-full bg-slate-900/50 text-slate-200 text-sm rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 border border-slate-700/50 placeholder-slate-500 transition-all shadow-inner"
              />
            </div>
          </div>

          {/* Lista de Chats */}
          <div className="flex-1 overflow-y-auto space-y-1 p-2 custom-scrollbar">
            {mockChats.map(chat => (
              <div 
                key={chat.id}
                onClick={() => setSelectedChat(chat)}
                className={`flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition-all duration-300 ${
                  selectedChat.id === chat.id 
                    ? 'bg-indigo-500/20 border border-indigo-500/30 shadow-[0_4px_20px_-4px_rgba(99,102,241,0.1)]' 
                    : 'hover:bg-slate-800/40 border border-transparent'
                }`}
              >
                <div className="w-12 h-12 rounded-full bg-slate-700/50 flex-shrink-0 flex items-center justify-center text-slate-300 font-medium border border-slate-600/30">
                  {chat.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-1">
                    <h3 className="font-medium text-slate-100 truncate pr-2">{chat.name}</h3>
                    <span className={`text-xs flex-shrink-0 ${chat.unread > 0 ? 'text-indigo-400 font-medium' : 'text-slate-400'}`}>
                      {chat.time}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-slate-400 truncate pr-2">{chat.lastMessage}</p>
                    {chat.unread > 0 && (
                      <span className="bg-indigo-500 text-white text-[10px] font-bold h-5 min-w-[20px] px-1.5 flex items-center justify-center rounded-full flex-shrink-0 shadow-[0_0_10px_rgba(99,102,241,0.4)]">
                        {chat.unread}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Área Principal - Chat */}
        <div className="flex-1 flex flex-col bg-slate-900/20 relative z-0">
          {/* Header do Chat */}
          <div className="flex items-center justify-between p-4 border-b border-slate-700/50 bg-slate-800/40 backdrop-blur-md z-10">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-slate-700/50 flex items-center justify-center text-slate-300 font-medium border border-slate-600/30 shadow-inner">
                {selectedChat.avatar}
              </div>
              <div>
                <h2 className="font-medium text-slate-100 text-lg">{selectedChat.name}</h2>
                <p className="text-xs text-indigo-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse"></span>
                  Online
                </p>
              </div>
            </div>
            <div className="flex gap-4 text-slate-400">
              <button className="p-2 hover:bg-slate-700/50 rounded-full hover:text-indigo-400 transition-all duration-200">
                <Video size={20} />
              </button>
              <button className="p-2 hover:bg-slate-700/50 rounded-full hover:text-indigo-400 transition-all duration-200">
                <Phone size={20} />
              </button>
              <div className="w-px h-6 bg-slate-700/50 self-center mx-1"></div>
              <button className="p-2 hover:bg-slate-700/50 rounded-full hover:text-slate-200 transition-all duration-200">
                <Search size={20} />
              </button>
            </div>
          </div>

          {/* Área de Mensagens */}
          <div className="flex-1 p-4 sm:p-6 overflow-y-auto flex flex-col gap-4 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-blend-overlay opacity-90 custom-scrollbar">
            {/* Separador de Data */}
            <div className="flex justify-center mb-4 mt-2">
              <span className="text-xs text-slate-300 bg-slate-800/80 px-4 py-1.5 rounded-full border border-slate-700/50 backdrop-blur-md shadow-sm">
                Hoje
              </span>
            </div>

            {mockMessages.map(msg => (
              <div key={msg.id} className={`flex ${msg.sender === 'me' ? 'justify-end' : 'justify-start'} group`}>
                <div className={`max-w-[85%] sm:max-w-[70%] rounded-2xl px-4 py-2.5 shadow-lg backdrop-blur-sm relative ${
                  msg.sender === 'me' 
                    ? 'bg-indigo-600/90 text-white border border-indigo-500/50 rounded-tr-sm shadow-[0_4px_15px_-3px_rgba(99,102,241,0.2)]' 
                    : 'bg-slate-800/90 text-slate-200 border border-slate-700/50 rounded-tl-sm'
                }`}>
                  <p className="text-[15px] leading-relaxed">{msg.text}</p>
                  <div className={`flex items-center justify-end gap-1.5 mt-1 ${msg.sender === 'me' ? 'text-indigo-200' : 'text-slate-400'}`}>
                    <span className="text-[10px] opacity-80">{msg.time}</span>
                    {msg.sender === 'me' && <CheckCheck size={14} className="text-sky-300 drop-shadow-[0_0_2px_rgba(125,211,252,0.5)]" />}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Área de Input */}
          <div className="p-3 sm:p-4 border-t border-slate-700/50 bg-slate-800/60 backdrop-blur-xl z-10">
            <div className="flex items-end gap-2 sm:gap-3 max-w-5xl mx-auto">
              <button className="p-3 text-slate-400 hover:text-indigo-400 transition-colors rounded-full hover:bg-slate-700/50 flex-shrink-0">
                <Smile size={24} />
              </button>
              <button className="p-3 text-slate-400 hover:text-indigo-400 transition-colors rounded-full hover:bg-slate-700/50 flex-shrink-0 hidden sm:block">
                <Paperclip size={24} />
              </button>
              
              <div className="flex-1 bg-slate-900/60 rounded-3xl border border-slate-700/50 focus-within:border-indigo-500/50 focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all flex items-center min-h-[52px] shadow-inner">
                <textarea 
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  placeholder="Digite uma mensagem..." 
                  className="w-full bg-transparent text-slate-200 px-5 py-3.5 focus:outline-none resize-none max-h-32 text-[15px]"
                  rows={1}
                />
              </div>
              
              {messageInput.trim() ? (
                <button 
                  className="p-3.5 rounded-full flex-shrink-0 bg-indigo-600 text-white shadow-[0_0_15px_rgba(99,102,241,0.4)] hover:bg-indigo-500 hover:scale-105 hover:shadow-[0_0_20px_rgba(99,102,241,0.6)] transition-all duration-300 transform"
                >
                  <Send size={22} className="ml-0.5" />
                </button>
              ) : (
                <button className="p-3.5 rounded-full flex-shrink-0 bg-slate-800 text-slate-500 border border-slate-700/50 transition-all duration-300">
                  <Phone size={22} className="opacity-0 hidden" />
                  <Send size={22} className="opacity-50" />
                </button>
              )}
            </div>
          </div>
        </div>

      </div>
      
      {/* Estilos globais extras embutidos */}
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: rgba(71, 85, 105, 0.5);
          border-radius: 10px;
        }
        .custom-scrollbar:hover::-webkit-scrollbar-thumb {
          background-color: rgba(99, 102, 241, 0.5);
        }
      `}} />
    </div>
  );
}
