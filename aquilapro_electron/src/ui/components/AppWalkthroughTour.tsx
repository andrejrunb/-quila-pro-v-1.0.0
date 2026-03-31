import React, { useState } from 'react';
import { X, ChevronLeft, ChevronRight, Map, Camera, Bell, BarChart2, Settings, Shield, Target, Zap } from 'lucide-react';

interface TourStep {
  id: string;
  icon: React.ElementType;
  title: string;
  description: string;
  shortcut?: string;
  target: string; // Nome da página a destacar
  color: string;
}

const TOUR_STEPS: TourStep[] = [
  {
    id: 'dashboard',
    icon: BarChart2,
    title: 'Painel Principal',
    description: 'Visão geral do sistema em tempo real: total de alunos, câmeras ativas, alertas pendentes e frequência do dia.',
    shortcut: 'F1',
    target: 'dashboard',
    color: 'blue',
  },
  {
    id: 'live',
    icon: Camera,
    title: 'Monitor ao Vivo',
    description: 'Visualize os feeds das câmeras com overlay de reconhecimento facial. Inicie e pare o motor diretamente aqui.',
    shortcut: 'F2',
    target: 'live-monitor',
    color: 'indigo',
  },
  {
    id: 'alerts',
    icon: Bell,
    title: 'Central de Alertas',
    description: 'Filtre e revise saídas não autorizadas, confirmações de entrada e alertas críticos com status de entrega WhatsApp.',
    shortcut: 'F3',
    target: 'alerts',
    color: 'rose',
  },
  {
    id: 'students',
    icon: Target,
    title: 'Gestão de Alunos',
    description: 'Cadastre alunos, importe em massa via pasta ou planilha, e visualize a timeline cronológica de cada perfil.',
    shortcut: 'F4',
    target: 'students',
    color: 'amber',
  },
  {
    id: 'heatmap',
    icon: Map,
    title: 'Heatmap de Fluxo',
    description: 'Analise a densidade de movimentação por zona em gráficos visuais. Disponível nos planos Pro e Enterprise.',
    target: 'heatmap',
    color: 'emerald',
  },
  {
    id: 'security',
    icon: Shield,
    title: 'Segurança & LGPD',
    description: 'Todo processamento biométrico ocorre 100% local. O Firewall Eagle bloqueia qualquer tentativa de enviar dados sensíveis.',
    target: 'settings',
    color: 'green',
  },
  {
    id: 'shortcuts',
    icon: Zap,
    title: 'Atalhos de Portaria',
    description: 'Use F1-F10 para navegar sem mouse. Ctrl+Shift+B para backup imediato. Ctrl+Shift+S para sincronização forçada.',
    target: 'settings',
    color: 'yellow',
  },
];

const COLOR_MAP: Record<string, string> = {
  blue: 'from-blue-600 to-indigo-700 shadow-blue-500/30',
  indigo: 'from-indigo-600 to-purple-700 shadow-indigo-500/30',
  rose: 'from-rose-600 to-pink-700 shadow-rose-500/30',
  amber: 'from-amber-500 to-orange-600 shadow-amber-500/30',
  emerald: 'from-emerald-600 to-teal-700 shadow-emerald-500/30',
  green: 'from-green-600 to-emerald-700 shadow-green-500/30',
  yellow: 'from-yellow-500 to-amber-600 shadow-yellow-500/30',
};

interface Props {
  onClose: () => void;
}

export const AppWalkthroughTour: React.FC<Props> = ({ onClose }) => {
  const [step, setStep] = useState(0);
  const current = TOUR_STEPS[step];
  const Icon = current.icon;
  const colorGradient = COLOR_MAP[current.color] ?? COLOR_MAP.blue;
  const isLast = step === TOUR_STEPS.length - 1;

  return (
    <div className="fixed inset-0 z-[99999] bg-black/60 backdrop-blur-md flex items-center justify-center p-8">
      <div className="w-full max-w-2xl bg-slate-900 border border-white/10 rounded-[48px] overflow-hidden shadow-3xl">
        {/* Header Gradient */}
        <div className={`bg-gradient-to-br ${colorGradient} p-12 flex flex-col items-center text-center relative overflow-hidden shadow-2xl`}>
          <button onClick={onClose} className="absolute top-6 right-6 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-all">
            <X className="w-5 h-5 text-white" />
          </button>
          <div className="w-24 h-24 bg-white/10 rounded-[32px] flex items-center justify-center mb-6 shadow-2xl">
            <Icon className="w-12 h-12 text-white" />
          </div>
          <h2 className="text-3xl font-black text-white">{current.title}</h2>
          {current.shortcut && (
            <div className="mt-3 px-4 py-1 bg-white/10 rounded-full text-xs font-black uppercase tracking-widest text-white/70">
              Atalho: {current.shortcut}
            </div>
          )}
          {/* Background circles */}
          <div className="absolute -right-16 -top-16 w-48 h-48 rounded-full bg-white/5" />
          <div className="absolute -left-10 -bottom-10 w-32 h-32 rounded-full bg-white/5" />
        </div>

        {/* Content */}
        <div className="p-10">
          <p className="text-slate-300 text-lg leading-relaxed text-center">
            {current.description}
          </p>

          {/* Step Dots */}
          <div className="flex justify-center gap-2 mt-8">
            {TOUR_STEPS.map((_, i) => (
              <button
                key={i}
                onClick={() => setStep(i)}
                className={`rounded-full transition-all ${i === step ? 'w-8 h-2 bg-blue-500' : 'w-2 h-2 bg-slate-700 hover:bg-slate-600'}`}
              />
            ))}
          </div>

          {/* Navigation */}
          <div className="flex gap-4 mt-8">
            <button
              onClick={() => setStep(s => Math.max(0, s - 1))}
              disabled={step === 0}
              className="flex-1 py-4 bg-slate-800 hover:bg-slate-700 rounded-2xl font-black text-sm uppercase tracking-widest transition-all flex items-center justify-center gap-2 disabled:opacity-30"
            >
              <ChevronLeft className="w-4 h-4" /> Anterior
            </button>
            <button
              onClick={isLast ? onClose : () => setStep(s => Math.min(TOUR_STEPS.length - 1, s + 1))}
              className="flex-1 py-4 bg-blue-600 hover:bg-blue-500 rounded-2xl font-black text-sm uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-xl shadow-blue-500/20"
            >
              {isLast ? '🚀 Começar' : (<>Próximo <ChevronRight className="w-4 h-4" /></>)}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppWalkthroughTour;
