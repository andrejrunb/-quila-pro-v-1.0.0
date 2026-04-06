import React, { useState, useEffect } from 'react';
import { Users, Mail, Phone, School, Calendar, Search } from 'lucide-react';

/**
 * CRMDashboard.tsx — Passo 23 do Roadmap.
 * Visualização de Leads capturados via landing page.
 */
export const CRMDashboard: React.FC = () => {
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const aquila = (window as any).aquila;

  useEffect(() => {
    loadLeads();
  }, []);

  const loadLeads = async () => {
    try {
      const data = await aquila.invoke('get-leads');
      setLeads(data || []);
    } catch (err) {
      console.error('Erro ao carregar leads:', err);
    }
    setLoading(false);
  };

  return (
    <div className="p-12 text-slate-100">
      <div className="flex justify-between items-end mb-10">
        <div>
          <h1 className="text-4xl font-black flex items-center gap-4">
            <Users className="w-10 h-10 text-emerald-500" />
            CRM & Prospecção
          </h1>
          <p className="text-slate-500 mt-2">Leads interessados capturados via Landing Page B2B</p>
        </div>
        <div className="flex gap-4">
            <div className="bg-slate-900 px-6 py-4 rounded-2xl border border-white/5">
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Conversão</p>
                <p className="text-2xl font-black text-emerald-400">12.5%</p>
            </div>
            <div className="bg-slate-900 px-6 py-4 rounded-2xl border border-white/5">
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Total Leads</p>
                <p className="text-2xl font-black text-white">{leads.length}</p>
            </div>
        </div>
      </div>

      <div className="bg-slate-900/50 border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-white/5 bg-slate-900/50 flex justify-between items-center">
            <div className="flex items-center gap-3 text-slate-400">
                <Search size={18} />
                <input type="text" placeholder="Filtrar leads..." className="bg-transparent border-none outline-none text-sm w-64" />
            </div>
            <button className="bg-blue-600 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-tighter hover:bg-blue-500 transition-all">Exportar CSV</button>
        </div>
        
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[10px] uppercase font-black tracking-widest text-slate-500 border-b border-white/5">
              <th className="px-8 py-6 text-left">Escola</th>
              <th className="px-8 py-6 text-left">Contato</th>
              <th className="px-8 py-6 text-left">E-mail</th>
              <th className="px-8 py-6 text-left">Telefone</th>
              <th className="px-8 py-6 text-left">Data</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {leads.length > 0 ? leads.map((lead, i) => (
              <tr key={i} className="hover:bg-white/5 transition-all group">
                <td className="px-8 py-6">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-slate-800 rounded-lg flex items-center justify-center">
                            <School size={16} className="text-slate-400" />
                        </div>
                        <span className="font-bold text-white">{lead.schoolName}</span>
                    </div>
                </td>
                <td className="px-8 py-6 text-slate-300">{lead.name}</td>
                <td className="px-8 py-6 font-mono text-slate-400 text-xs">{lead.email}</td>
                <td className="px-8 py-6 text-slate-400">{lead.phone}</td>
                <td className="px-8 py-6 text-slate-500 text-xs flex items-center gap-2">
                    <Calendar size={14} /> {new Date(lead.timestamp).toLocaleDateString()}
                </td>
              </tr>
            )) : (
                <tr>
                    <td colSpan={5} className="px-8 py-24 text-center text-slate-600 font-bold text-lg">
                        Nenhum lead capturado ainda. <br/>
                        <span className="text-sm font-normal">Sua Landing Page está pronta para receber contatos.</span>
                    </td>
                </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CRMDashboard;
