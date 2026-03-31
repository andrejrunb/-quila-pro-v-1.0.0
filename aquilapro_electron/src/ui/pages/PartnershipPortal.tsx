import React from 'react';
import { Shield, Sparkles, Heart, Zap, Award, ExternalLink, ArrowLeft } from 'lucide-react';

interface PartnershipPortalProps {
  onBack: () => void;
}

export const PartnershipPortal: React.FC<PartnershipPortalProps> = ({ onBack }) => {
  const benefits = [
    {
      icon: <Shield className="text-blue-400" />,
      title: 'Seguro Escolar "SafePass"',
      description: 'Redução de 15% na apólice anual devido ao monitoramento de IA de alta precisão.',
      status: 'Ativo'
    },
    {
      icon: <Award className="text-yellow-400" />,
      title: 'Certificação Anti-Bullying',
      description: 'Selo de Escola Segura emitido pela Federação Nacional de Escolas Particulares.',
      status: 'Disponível'
    },
    {
      icon: <Heart className="text-red-400" />,
      title: 'Convênio Saúde Monitorada',
      description: 'Atendimento médico prioritário via telemedicina para alunos com alertas de queda.',
      status: 'Pendente'
    }
  ];

  return (
    <div className="p-8 max-w-6xl mx-auto animate-fade-in">
      <div className="flex items-center justify-between mb-10">
        <div>
          <button 
            onClick={onBack}
            className="flex items-center text-slate-400 hover:text-white transition-colors mb-4 group"
          >
            <ArrowLeft size={18} className="mr-2 group-hover:-translate-x-1 transition-transform" />
            Voltar ao Dashboard
          </button>
          <h1 className="text-4xl font-black bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">
            Portal de Parcerias & Convênios
          </h1>
          <p className="text-slate-400 mt-2">Benefícios exclusivos baseados no score de segurança Áquila Pro.</p>
        </div>
        <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-2xl flex items-center">
          <Sparkles className="text-blue-400 mr-3" />
          <div>
            <p className="text-[10px] uppercase font-bold text-blue-300">Economia Anual Estimada</p>
            <p className="text-2xl font-black text-white">R$ 12.450,00</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        {benefits.map((benefit, idx) => (
          <div key={idx} className="glass-premium p-6 border-slate-700/50 hover:border-blue-500/30 transition-all hover:scale-[1.02] cursor-pointer group">
            <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center mb-6 border border-white/5 group-hover:bg-blue-500/10 transition-colors">
              {benefit.icon}
            </div>
            <h3 className="text-xl font-bold mb-2">{benefit.title}</h3>
            <p className="text-slate-400 text-sm leading-relaxed mb-6">{benefit.description}</p>
            <div className="flex items-center justify-between pt-4 border-t border-white/5">
              <span className={`text-[10px] px-3 py-1 rounded-full font-black uppercase ${
                benefit.status === 'Ativo' ? 'bg-emerald-500/10 text-emerald-400' :
                benefit.status === 'Disponível' ? 'bg-blue-500/10 text-blue-400' : 'bg-slate-500/10 text-slate-400'
              }`}>
                {benefit.status}
              </span>
              <ExternalLink size={16} className="text-slate-500" />
            </div>
          </div>
        ))}
      </div>

      <div className="glass-premium p-8 border-indigo-500/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none">
          <Zap size={200} className="text-indigo-400" />
        </div>
        <div className="relative z-10 max-w-2xl">
          <h2 className="text-2xl font-black mb-4 flex items-center">
            <Zap className="text-yellow-400 mr-2" />
            Aumente seu Seguro com IA
          </h2>
          <p className="text-slate-400 leading-relaxed mb-6">
            Ao atingir 98% de precisão nas zonas de pátio e implementar o alerta de aglomeração, 
            sua escola se torna elegível para o nível <strong>Platinum</strong> de segurança, 
            desbloqueando coberturas de responsabilidade civil estendidas.
          </p>
          <button className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-3 rounded-2xl font-bold transition-all transform active:scale-95 shadow-lg shadow-indigo-600/20">
            Solicitar Auditoria Gratuita
          </button>
        </div>
      </div>
    </div>
  );
};
