import React from 'react';
import { BookOpen, HelpCircle, HardDrive, ShieldCheck, Zap } from 'lucide-react';

const HelpCenter: React.FC = () => {
  const sections = [
    {
      title: 'Início Rápido',
      icon: <Zap className="text-amber-500" />,
      content: 'Para começar, adicione suas câmeras RTSP na aba "Câmeras" e treine o rosto dos alunos na aba "Alunos".'
    },
    {
      title: 'Guia de Hardware',
      icon: <HardDrive className="text-blue-500" />,
      content: 'Recomendamos CPUs i5 de 10ª geração ou superior. O Áquila Pro utiliza Throttling Automático para proteger seu PC.'
    },
    {
      title: 'Segurança & LGPD',
      icon: <ShieldCheck className="text-emerald-500" />,
      content: 'Nenhuma foto sai do seu computador. Os dados biométricos são criptografados localmente com AES-256.'
    },
    {
      title: 'Suporte Técnico',
      icon: <HelpCircle className="text-purple-500" />,
      content: 'Dúvidas? Entre em contato via suporte@aquilapro.ai ou consulte a documentação online.'
    }
  ];

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <BookOpen size={40} className="text-emerald-500" />
        <div>
          <h1 className="text-3xl font-bold">Central de Ajuda</h1>
          <p className="opacity-60 text-lg">Tudo o que você precisa saber para dominar o Áquila Pro.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {sections.map((s, i) => (
          <div key={i} className="p-6 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 transition-colors">
            <div className="flex items-center gap-3 mb-4 text-xl font-semibold">
              {s.icon}
              {s.title}
            </div>
            <p className="opacity-70 leading-relaxed">{s.content}</p>
          </div>
        ))}
      </div>

      <div className="mt-12 p-8 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 text-center">
        <h3 className="text-xl font-bold mb-2">Treinamento On-Boarding</h3>
        <p className="opacity-70 mb-6">Assista ao vídeo tutorial de 5 minutos e aprenda a configurar sua escola em tempo recorde.</p>
        <button className="px-8 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl transition-all">
          Assistir Tutorial
        </button>
      </div>
    </div>
  );
};

export default HelpCenter;
