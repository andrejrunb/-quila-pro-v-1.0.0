import React, { useState } from 'react';
import { Eye, Map, Wifi, RadioTower, ShieldAlert, Cpu, Maximize, Clock } from 'lucide-react';

export const CrossAuditValidation: React.FC = () => {
  const [filter, setFilter] = useState<'all' | 'high_risk'>('all');

  // Dados Mockados da Auditoria
  const auditFusions = [
    { id: 1, name: 'Lucas Mendes', rm: '11029', entry: '07:05 (Catraca A)', wifi: 'Detectado (Pátio Central, 07:45)', camera: 'Não Detectado (Sala 3B)', schedule: '07:15 - Matemática (Sala 3B)', status: 'HIGH_RISK', description: 'O aluno deveria estar na aula de Matemática às 07:15, mas a câmera não o detectou na sala, e o Wi-Fi o localizou no Pátio.' },
    { id: 2, name: 'Beatriz Souza', rm: '10982', entry: '07:12 (Catraca B)', wifi: 'Não detectado', camera: 'Detectado (Sala 1A, 07:22)', schedule: '07:15 - História (Sala 1A)', status: 'OK', description: 'Fluxo perfeito. Biometria, horário escolar e presença via Visão confirmadas na sala correta.' },
    { id: 3, name: 'Carlos Andrade', rm: '09912', entry: 'Ausente (Catraca A)', wifi: 'Detectado (Quadra, 08:10)', camera: 'Não Detectado', schedule: '08:00 - Geografia (Sala 2B)', status: 'CRITICAL', description: 'Evasão invertida. O aluno devia estar em Geografia, mas pulou catraca e o Wi-Fi rastreou na Quadra.' },
    { id: 4, name: 'Mariana Silva', rm: '11200', entry: '07:08 (Catraca A)', wifi: 'Detectado (Refeitório, 07:15)', camera: 'Detectado (Sala 2C, 07:30)', schedule: '07:15 - Física (Sala 2C)', status: 'OK', description: 'Fluxo perfeito. Aluna na sala compatível com a grade horária.' }
  ];

  const filteredLogs = filter === 'all' ? auditFusions : auditFusions.filter(a => a.status === 'HIGH_RISK' || a.status === 'CRITICAL');

  return (
    <div className="flex flex-col gap-6 animate-fade-in w-full">
      <div className="flex items-center justify-between">
          <div>
             <h2 className="text-xl font-bold text-white flex items-center gap-2">
               <Map className="text-emerald-500" /> Auditoria Cruzada Espacial
             </h2>
             <p className="text-xs text-slate-400 mt-1">Triangulação Quádrupla: Catraca vs. Wi-Fi vs. Visão Computacional vs. Grade Escolar.</p>
          </div>
          <div className="flex gap-2">
             <button 
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${filter === 'all' ? 'bg-white/10 text-white border border-white/20' : 'bg-transparent text-slate-400 hover:bg-white/5 border border-transparent'}`}
             >
                TODOS OS LOGS
             </button>
             <button 
                onClick={() => setFilter('high_risk')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${filter === 'high_risk' ? 'bg-red-500/20 text-red-500 border border-red-500/30' : 'bg-transparent text-slate-400 hover:bg-white/5 border border-transparent'}`}
             >
                APENAS INCIDENTES
             </button>
          </div>
      </div>

      {/* Estatísticas Macro */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white/5 border border-white/5 p-4 rounded-xl flex items-center gap-4">
             <div className="bg-slate-800 p-3 rounded-lg"><Cpu className="text-slate-400" size={20} /></div>
             <div>
                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Fusões NPU Realizadas</p>
                <div className="text-2xl font-black text-white">4.892 <span className="text-xs font-normal text-slate-500">Hoje</span></div>
             </div>
          </div>
          <div className="bg-indigo-500/10 border border-indigo-500/20 p-4 rounded-xl flex items-center gap-4">
             <div className="bg-indigo-500/20 p-3 rounded-lg"><Wifi className="text-indigo-400" size={20} /></div>
             <div>
                <p className="text-[10px] text-indigo-400 uppercase font-bold tracking-wider">Dispositivos Rastreados</p>
                <div className="text-2xl font-black text-white">1.045 <span className="text-xs font-normal text-indigo-500/50">MACs únicos</span></div>
             </div>
          </div>
          <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl flex items-center gap-4">
             <div className="bg-red-500/20 p-3 rounded-lg"><ShieldAlert className="text-red-400" size={20} /></div>
             <div>
                <p className="text-[10px] text-red-400 uppercase font-bold tracking-wider">Evasões/Ausências Detectadas</p>
                <div className="text-2xl font-black text-white">12 <span className="text-xs font-normal text-red-500/50">Nas últimas 4h</span></div>
             </div>
          </div>
      </div>

      {/* Grid de Logs */}
      <div className="grid grid-cols-1 gap-3 mt-4">
         {filteredLogs.map(log => (
            <div key={log.id} className="bg-[#0b0c10] border border-white/5 rounded-xl p-4 flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4 group hover:border-white/10 transition-colors">
               
               {/* Identity */}
               <div className="flex-1 w-full xl:w-auto">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                     <span className="font-bold text-slate-200 text-sm">{log.name}</span>
                     <span className="text-[10px] text-slate-500 bg-white/5 px-2 py-0.5 rounded">RM: {log.rm}</span>
                     {log.status === 'HIGH_RISK' && <span className="text-[10px] font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">SUSPEITO</span>}
                     {log.status === 'CRITICAL' && <span className="text-[10px] font-bold text-red-500 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20 animate-pulse">ALERTA VERMELHO</span>}
                     {log.status === 'OK' && <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">VALIDADO</span>}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-2">{log.description}</p>
               </div>

               {/* Triangulation Matrix */}
               <div className="flex w-full xl:w-auto overflow-hidden rounded-lg border border-white/5 text-[10px] uppercase font-bold flex-col sm:flex-row">
                   <div className="flex flex-col border-b sm:border-b-0 sm:border-r border-white/5 flex-1">
                      <div className="bg-white/5 text-slate-500 px-3 py-1 flex items-center justify-center gap-1"><Clock size={10} /> Grade Horária</div>
                      <div className="px-3 py-2 text-center text-xs text-sky-400 bg-sky-500/5">{log.schedule}</div>
                   </div>
                   <div className="flex flex-col border-b sm:border-b-0 sm:border-r border-white/5 flex-1">
                      <div className="bg-white/5 text-slate-500 px-3 py-1 flex items-center justify-center gap-1"><RadioTower size={10} /> Catraca FÍS.</div>
                      <div className={`px-3 py-2 text-center text-xs ${log.entry.includes('Ausente') ? 'bg-red-500/5 text-red-400' : 'bg-transparent text-slate-300'}`}>{log.entry}</div>
                   </div>
                   <div className="flex flex-col border-b sm:border-b-0 sm:border-r border-white/5 flex-1">
                      <div className="bg-white/5 text-slate-500 px-3 py-1 flex items-center justify-center gap-1"><Wifi size={10} /> Sonda Wi-Fi</div>
                      <div className="px-3 py-2 text-center text-xs text-indigo-400 bg-indigo-500/5">{log.wifi}</div>
                   </div>
                   <div className="flex flex-col flex-1">
                      <div className="bg-white/5 text-slate-500 px-3 py-1 flex items-center justify-center gap-1"><Eye size={10} /> NPU Câmera</div>
                      <div className={`px-3 py-2 text-center text-xs ${log.camera.includes('Não') ? 'bg-amber-500/5 text-amber-400' : 'bg-transparent text-slate-300'}`}>{log.camera}</div>
                   </div>
               </div>

               {/* Action */}
               <button className="w-full sm:w-auto aspect-square flex items-center justify-center p-3 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 transition-colors">
                  <Maximize size={16} />
               </button>

            </div>
         ))}
         
         {filteredLogs.length === 0 && (
             <div className="py-12 text-center flex flex-col items-center justify-center">
                <ShieldAlert size={48} className="text-slate-800 mb-4" />
                <p className="text-slate-500 font-bold">Nenhum evento neste filtro.</p>
             </div>
         )}
      </div>
    </div>
  );
};
