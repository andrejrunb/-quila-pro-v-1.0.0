import React, { useState } from 'react';
import { MessageSquare, Save, Plus, Trash2, Smartphone, BellRing } from 'lucide-react';

/**
 * WhatsAppTemplates.tsx — Passo 35 do Roadmap.
 * Gestão de templates dinâmicos para mensagens automáticas.
 */
export const WhatsAppTemplates: React.FC = () => {
  const [templates, setTemplates] = useState<any[]>([
    { id: 'entry', title: 'Confirmação de Entrada', content: 'Olá, {parent_name}. O(A) aluno(a) {student_name} acabou de entrar na escola às {time}. Tenha um bom dia!' },
    { id: 'exit', title: 'Alerta de Saída', content: 'URGENTE: O(A) aluno(a) {student_name} passou pela saída principal às {time}. Caso não esteja acompanhado, entre em contato imediatamente.' }
  ]);
  const [isSaving, setIsSaving] = useState(false);
  const aquila = (window as any).aquila;

  const handleSave = async () => {
    setIsSaving(true);
    await aquila.invoke('save-whatsapp-templates', templates);
    setIsSaving(false);
    alert('Templates salvos com sucesso!');
  };

  return (
    <div className="p-12 max-w-4xl mx-auto text-white">
      <div className="mb-12">
        <h1 className="text-4xl font-black flex items-center gap-4">
          <MessageSquare className="w-10 h-10 text-emerald-400" />
          Templates de WhatsApp
        </h1>
        <p className="text-slate-500 mt-2">Personalize a comunicação automática com os pais</p>
      </div>

      <div className="space-y-8">
        {templates.map((tpl, i) => (
          <div key={tpl.id} className="bg-slate-900 border border-white/5 rounded-[40px] p-8 shadow-2xl relative overflow-hidden">
            <div className="flex justify-between items-start mb-6">
                <div>
                    <h3 className="text-xl font-bold">{tpl.title}</h3>
                    <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mt-1">Gatilho: {tpl.id === 'entry' ? 'Detecção na Entrada' : 'Detecção na Saída'}</p>
                </div>
                <div className="p-3 bg-emerald-500/10 rounded-2xl">
                    <Smartphone size={20} className="text-emerald-500" />
                </div>
            </div>

            <textarea 
                title="Conteúdo do Template"
                aria-label="Conteúdo do Template"
                value={tpl.content}
                onChange={(e) => {
                    const next = [...templates];
                    next[i].content = e.target.value;
                    setTemplates(next);
                }}
                className="w-full h-32 bg-slate-950 border border-white/10 rounded-2xl p-6 text-sm text-slate-300 outline-none focus:border-emerald-500/50 transition-all font-medium leading-relaxed"
            />

            <div className="mt-4 flex gap-2">
                {['{student_name}', '{time}', '{parent_name}'].map(tag => (
                    <span key={tag} className="px-3 py-1 bg-slate-800 rounded-lg text-[10px] font-mono text-slate-400">{tag}</span>
                ))}
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={handleSave}
        disabled={isSaving}
        className="mt-12 w-full py-6 bg-emerald-600 hover:bg-emerald-500 rounded-3xl font-black text-sm uppercase tracking-widest transition-all flex items-center justify-center gap-3 shadow-2xl"
      >
        {isSaving ? 'Salvando...' : <><Save size={20} /> Salvar Todos os Templates</>}
      </button>
    </div>
  );
};

export default WhatsAppTemplates;
