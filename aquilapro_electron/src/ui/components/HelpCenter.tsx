import React from 'react';
import { HelpCircle, FileText, Video, MessageCircle, ExternalLink } from 'lucide-react';
import './HelpCenter.css';

/**
 * Phase 401+: Help & Tutorial Center
 * Centro de suporte impecável para exportação global e facilidade de instalação.
 */
export const HelpCenter: React.FC = () => {
  const tutorials = [
    { title: 'Configuração Inicial de Câmeras', type: 'video', duration: '3:45' },
    { title: 'Gestão de Base de Dados de Alunos', type: 'doc', pages: 12 },
    { title: 'Interpretando Alertas do SOC', type: 'video', duration: '5:20' },
    { title: 'Integração com App dos Pais', type: 'doc', pages: 8 },
  ];

  return (
    <div className="help-center-container">
      <header className="flex items-center gap-3 mb-6">
        <HelpCircle className="text-blue-400" size={24} />
        <h2 className="text-xl font-bold uppercase tracking-widest text-slate-200">Eagle Eye Help Center</h2>
      </header>

      <div className="help-grid">
        <div className="support-card principal">
          <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
            <Video size={16} /> TUTORIAIS EM VÍDEO
          </h3>
          <div className="space-y-3">
            {tutorials.filter(t => t.type === 'video').map((t, i) => (
              <div key={i} className="tutorial-item group">
                <div className="w-10 h-10 bg-blue-500/20 rounded flex items-center justify-center group-hover:bg-blue-500/40 transition-colors">
                  <Video size={14} className="text-blue-400" />
                </div>
                <div>
                  <div className="text-xs font-bold">{t.title}</div>
                  <div className="text-[10px] text-slate-500">Duração: {t.duration}</div>
                </div>
                <ExternalLink size={12} className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            ))}
          </div>
        </div>

        <div className="support-card">
          <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
            <FileText size={16} /> MANUAIS TÉCNICOS
          </h3>
          <div className="space-y-3">
            {tutorials.filter(t => t.type === 'doc').map((t, i) => (
              <div key={i} className="tutorial-item">
                <FileText size={14} className="text-slate-400" />
                <div className="text-[11px] hover:text-blue-400 cursor-pointer">{t.title} ({t.pages} pág.)</div>
              </div>
            ))}
          </div>
        </div>

        <div className="support-card border-emerald-500/20 bg-emerald-500/5">
          <h3 className="text-sm font-bold mb-4 flex items-center gap-2 text-emerald-400">
            <MessageCircle size={16} /> SUPORTE DIRETO
          </h3>
          <p className="text-[11px] text-slate-400 leading-relaxed mb-4">
            Dúvidas críticas? Fale diretamente com o time de engenharia Áquila.
          </p>
          <button className="w-full py-2 bg-emerald-500/10 border border-emerald-500/30 rounded text-[10px] font-bold text-emerald-400 hover:bg-emerald-500/20 transition-colors">
            ABRIR CHAMADO TÉCNICO
          </button>
        </div>
      </div>

      <footer className="mt-8 pt-4 border-t border-white/5 text-center">
        <div className="text-[9px] text-slate-600 uppercase tracking-widest">
          Áquila Pro Help v.1.2.x // Design for Global Scale
        </div>
      </footer>
    </div>
  );
};
