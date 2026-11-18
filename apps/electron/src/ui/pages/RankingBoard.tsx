import React from 'react';
import { ArrowLeft, ShieldCheck, BookOpen, Scale } from 'lucide-react';
import './RankingBoard.tsx.css';

export const RankingBoard: React.FC<{ onBack?: () => void }> = ({ onBack }) => {
  return (
    <div className="ranking-board-container">
      <header className="ranking-header">
        {onBack && (
          <button className="back-btn" onClick={onBack}>
            <ArrowLeft size={18} /> Voltar
          </button>
        )}
        <div className="header-titles">
          <h1>Acompanhamento Pedagógico Individual (Não-Competitivo)</h1>
          <p>Módulo readequado às Diretrizes Nacionais CNE/CP nº 15/2026 • Sem ranqueamento de risco ou social scoring</p>
        </div>
      </header>

      <div className="p-6 max-w-4xl mx-auto space-y-6">
        <div className="p-6 rounded-2xl bg-slate-900/80 border border-amber-500/30">
          <div className="flex items-center gap-3 text-amber-300 font-semibold mb-3">
            <Scale size={20} />
            <span>Vedação a Ranqueamento Estudantil e Social Scoring (Parecer CNE/CP nº 15/2026)</span>
          </div>
          <p className="text-slate-300 text-sm leading-relaxed m-0">
            Quadros comparativos de estudantes por atraso, permanência em corredores ou probabilidade algorítmica de
            reprovação foram descontinuados. A análise de frequência deve ocorrer de modo individualizado, sigiloso e
            mediado por docentes, coordenação pedagógica e orientação educacional.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-slate-900/70 border border-white/10">
          <div className="flex items-center gap-3 text-sky-300 font-semibold mb-3">
            <BookOpen size={20} />
            <span>Fluxos Recomendados de Apoio Escolar</span>
          </div>
          <ul className="text-sm text-slate-300 space-y-2 pl-5 m-0 list-disc">
            <li>Consulte o Diário de Classe docente para registro individual de frequência e recuperação paralela.</li>
            <li>Utilize o canal institucional da Coordenação para encaminhamentos formalmente fundamentados (ECA / LDB).</li>
          </ul>
        </div>
      </div>

      <footer className="ranking-footer shadow-glow">
        <div className="footer-insight">
          <ShieldCheck size={18} className="text-emerald-400" />
          <span>Decisões pedagógicas exigem supervisão humana docente e garantia de contestação pela família.</span>
        </div>
      </footer>
    </div>
  );
};
