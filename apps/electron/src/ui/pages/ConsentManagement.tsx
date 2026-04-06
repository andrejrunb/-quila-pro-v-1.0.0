import React, { useState } from 'react';
import { ArrowLeft, UserCheck, UserX, Clock, Shield, Search, Filter } from 'lucide-react';

interface ConsentManagementProps {
  onBack: () => void;
}

export const ConsentManagement: React.FC<ConsentManagementProps> = ({ onBack }) => {
  const [searchTerm, setSearchTerm] = useState('');
  
  const students = [
    { id: 'std-001', name: 'Enzo Gabriel', status: 'Aceito', date: '2026-03-01' },
    { id: 'std-002', name: 'Maria Eduarda', status: 'Pendente', date: '-' },
    { id: 'std-003', name: 'Valentina Oliveira', status: 'Aceito', date: '2026-03-05' },
    { id: 'std-004', name: 'Gabriel Santos', status: 'Negado', date: '2026-03-10' },
  ];

  return (
    <div className="p-8 max-w-6xl mx-auto animate-fade-in">
       <button 
        onClick={onBack}
        className="flex items-center text-slate-400 hover:text-white transition-colors mb-4 group"
      >
        <ArrowLeft size={18} className="mr-2 group-hover:-translate-x-1 transition-transform" />
        Voltar ao Dashboard
      </button>

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black text-white flex items-center">
            <Shield className="text-blue-400 mr-3" />
            Gestão de Consentimento Digital
          </h1>
          <p className="text-slate-400 mt-1">Controle de autorização dos pais para tratamento biometríco (LGPD).</p>
        </div>
        <div className="flex space-x-3">
           <div className="relative">
             <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
             <input 
               type="text" 
               placeholder="Buscar aluno..." 
               className="bg-slate-800/50 border border-slate-700 rounded-xl pl-10 pr-4 py-2 text-sm focus:border-blue-500 outline-none transition-colors w-64"
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
             />
           </div>
           <button className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center transition-colors">
             <Filter size={16} className="mr-2" /> Filtrar Pendentes
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="glass-premium p-4 border-emerald-500/20">
          <p className="text-[10px] uppercase font-bold text-emerald-400">Total Aceitos</p>
          <p className="text-2xl font-black text-white mt-1">94%</p>
        </div>
        <div className="glass-premium p-4 border-orange-500/20">
          <p className="text-[10px] uppercase font-bold text-orange-400">Pendentes</p>
          <p className="text-2xl font-black text-white mt-1">12 Alunos</p>
        </div>
        <div className="glass-premium p-4 border-red-500/20">
          <p className="text-[10px] uppercase font-bold text-red-400">Negados</p>
          <p className="text-2xl font-black text-white mt-1">2 Alunos</p>
        </div>
        <div className="glass-premium p-4 border-blue-500/20">
          <p className="text-[10px] uppercase font-bold text-blue-400">Última Atualização</p>
          <p className="text-2xl font-black text-white mt-1">Hoje, 09:42</p>
        </div>
      </div>

      <div className="glass-premium overflow-hidden border-slate-800/50">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-white/5 text-slate-400 text-[10px] uppercase font-black tracking-wider">
              <th className="px-6 py-4">Aluno</th>
              <th className="px-6 py-4">ID Registro</th>
              <th className="px-6 py-4">Status LGPD</th>
              <th className="px-6 py-4">Data Aceite</th>
              <th className="px-6 py-4 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {students.map((student) => (
              <tr key={student.id} className="hover:bg-white/[0.02] transition-colors group">
                <td className="px-6 py-4">
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center font-bold text-xs mr-3">
                      {student.name[0]}
                    </div>
                    <span className="font-bold text-slate-200">{student.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-xs font-mono text-slate-500">{student.id}</td>
                <td className="px-6 py-4 text-xs">
                  <div className="flex items-center">
                    {student.status === 'Aceito' ? (
                      <UserCheck size={14} className="text-emerald-400 mr-2" />
                    ) : student.status === 'Negado' ? (
                      <UserX size={14} className="text-red-400 mr-2" />
                    ) : (
                      <Clock size={14} className="text-orange-400 mr-2" />
                    )}
                    <span className={
                      student.status === 'Aceito' ? 'text-emerald-400' :
                      student.status === 'Negado' ? 'text-red-400' : 'text-orange-400'
                    }>
                      {student.status}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 text-xs text-slate-400">{student.date}</td>
                <td className="px-6 py-4 text-right">
                  <button className="text-[10px] font-black uppercase text-blue-400 hover:text-blue-300 opacity-0 group-hover:opacity-100 transition-opacity">
                    Reenviar Link
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="mt-8 p-6 bg-red-500/5 border border-red-500/10 rounded-2xl">
        <h3 className="text-red-400 font-bold flex items-center mb-2">
          <UserX size={18} className="mr-2" />
          Atenção: Alunos Sem Consentimento
        </h3>
        <p className="text-slate-400 text-sm">
          Alunos com status "Negado" ou "Pendente" não terão notificações de WhatsApp enviadas para os pais 
          e seus logs de imagem serão borrados automaticamente no painel principal para conformidade total.
        </p>
      </div>
    </div>
  );
};
