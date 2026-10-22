import React, { useState } from 'react';
import { BookOpen, Search, PlayCircle, FileText, ChevronRight, CheckCircle2, AlertOctagon } from 'lucide-react';

export const HelpHubSOC: React.FC = () => {
  const [search, setSearch] = useState('');

  const categories = [
    { id: '1', title: 'Operação de Catraca', icon: <AlertOctagon size={18} className="text-blue-400" /> },
    { id: '2', title: 'Resolução de Conflitos', icon: <CheckCircle2 size={18} className="text-emerald-400" /> },
    { id: '3', title: 'Auditoria e Logs', icon: <FileText size={18} className="text-fuchsia-400" /> },
    { id: '4', title: 'Treinamento de Rede (NPU)', icon: <PlayCircle size={18} className="text-amber-400" /> },
  ];

  const videos = [
    { id: 'v1', title: 'Como forçar a abertura manual da Catraca', duration: '03:15', category: '1', watched: true },
    { id: 'v2', title: 'O que fazer quando o Aluno pula a catraca?', duration: '05:40', category: '2', watched: false },
    { id: 'v3', title: 'Validando o Log de MAC Address Wi-Fi', duration: '08:20', category: '3', watched: false },
    { id: 'v4', title: 'Recapturando a face de um aluno (Biometria Múltipla)', duration: '04:10', category: '4', watched: true },
    { id: 'v5', title: 'Reboot do Edge Node Local em caso de pânico', duration: '02:05', category: '1', watched: false },
  ];

  const filteredVideos = videos.filter(v => v.title.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="flex flex-col gap-6 animate-fade-in w-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
             <h2 className="text-xl font-bold text-white flex items-center gap-2">
               <BookOpen className="text-blue-500" /> SOC Training & Help Hub
             </h2>
             <p className="text-xs text-slate-400 mt-1">Capacitação On-Demand para Operadores da Portaria, Secretaria e Coordenação.</p>
          </div>
          <div className="relative w-full md:w-auto">
             <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
             <input 
                 type="text" 
                 placeholder="Buscar manual ou vídeo..." 
                 value={search}
                 onChange={(e) => setSearch(e.target.value)}
                 className="w-full md:w-64 bg-black/40 border border-white/10 rounded-lg py-2 pl-9 pr-4 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500/50 transition-colors"
             />
          </div>
      </div>

      {/* Categorias (Horizontal Scroll / Grid) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
         {categories.map(cat => (
             <button key={cat.id} className="flex flex-col items-start gap-3 p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 transition-all text-left">
                 <div className="bg-black/50 p-2 rounded-lg">
                    {cat.icon}
                 </div>
                 <span className="text-sm font-bold text-slate-200">{cat.title}</span>
             </button>
         ))}
      </div>

      <div className="w-full h-px bg-white/5 my-2" />

      {/* Featured Video (Netflix Style Banner) */}
      {!search && (
          <div className="relative w-full h-[300px] rounded-2xl overflow-hidden border border-white/10 group cursor-pointer">
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent z-10" />
              <img src="https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=2670" alt="Cyber Security" className="absolute inset-0 w-full h-full object-cover opacity-30 group-hover:opacity-40 transition-opacity duration-700" />
              
              <div className="absolute bottom-0 left-0 p-8 z-20 flex w-full justify-between items-end">
                  <div className="w-2/3">
                      <span className="bg-blue-500 text-white text-[10px] uppercase font-bold px-3 py-1 rounded-full mb-3 inline-block">Módulo Obrigatório (Semana 1)</span>
                      <h3 className="text-3xl font-black text-white mb-2">Protocolo Zero-Bypass em Portões</h3>
                      <p className="text-sm text-slate-300 line-clamp-2">Aprenda a aplicar o protocolo rigoroso de parada obrigatória em casos de falha do sistema offline, evitando invasões de pessoas não autorizadas.</p>
                      
                      <button className="mt-6 flex items-center gap-2 bg-white text-black px-6 py-2 rounded-lg font-bold hover:bg-slate-200 transition-colors">
                          <PlayCircle size={20} /> Assistir (12:05)
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* Lista de Aulas */}
      <div>
         <h3 className="text-lg font-bold text-white mb-4">Aulas e Manuais</h3>
         <div className="grid grid-cols-1 gap-3">
             {filteredVideos.map(video => (
                 <div key={video.id} className="flex items-center p-3 rounded-xl bg-[#0b0c10] border border-white/5 hover:border-blue-500/30 transition-all cursor-pointer group">
                    <div className="relative flex-shrink-0 w-32 h-20 bg-slate-800 rounded-lg overflow-hidden border border-white/10">
                        {/* Fake thumbnail via gradient */}
                        <div className="absolute inset-0 bg-gradient-to-br from-slate-700 to-black" />
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 backdrop-blur-sm z-10">
                            <PlayCircle size={32} className="text-white" />
                        </div>
                        {video.watched && (
                            <div className="absolute top-0 right-0 p-1 bg-green-500/80 rounded-bl-lg z-20">
                                <CheckCircle2 size={12} className="text-white" />
                            </div>
                        )}
                        <div className="absolute bottom-1 right-1 bg-black/80 px-1.5 py-0.5 rounded text-[10px] font-mono text-white z-20">
                            {video.duration}
                        </div>
                    </div>

                    <div className="ml-4 flex-1">
                        <h4 className="text-sm font-bold text-slate-200 group-hover:text-blue-400 transition-colors">{video.title}</h4>
                        <div className="flex items-center gap-2 mt-2">
                             <FileText size={12} className="text-slate-500" />
                             <span className="text-[10px] uppercase font-bold text-slate-500">
                                {categories.find(c => c.id === video.category)?.title}
                             </span>
                        </div>
                    </div>

                    <div className="text-slate-600 group-hover:text-white transition-colors px-4">
                        <ChevronRight size={20} />
                    </div>
                 </div>
             ))}

             {filteredVideos.length === 0 && (
                 <div className="p-8 text-center text-slate-500 text-sm">
                     Nenhum material encontrado com o termo "{search}".
                 </div>
             )}
         </div>
      </div>

    </div>
  );
};
