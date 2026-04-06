"use client";

import { Shield, Zap, Globe, Cpu, CheckCircle2, ArrowRight, MessageSquare, Target, FileText, Camera, Clock, Lock } from "lucide-react";

export default function Produto() {
  const modules = [
    {
      id: "seguranca",
      name: "Segurança & Visão Onipresente",
      tag: "Ghost-Vision Architecture",
      icon: <Camera className="text-indigo-400" size={32} />,
      description: "Nossa I.A. nativa processa imagens em tempo real para detectar evasão, acessos não autorizados e áreas de risco sem violar a privacidade.",
      features: ["Presença automática por reconhecimento facial (Edge)", "Detecção de comportamento anômalo", "Alertas de evasão por corredor"],
      color: "border-indigo-500/20 bg-indigo-500/5"
    },
    {
      id: "presenca",
      name: "Presença & Timetable",
      tag: "Deep Efficiency",
      icon: <Clock className="text-emerald-400" size={32} />,
      description: "Elimine 100% da burocracia das chamadas. O sistema sincroniza a grade horária com a presença real em sala.",
      features: ["Solver de grade horária por IA", "Registro automático de atrasos", "Relatórios de ocupação térmica"],
      color: "border-emerald-500/20 bg-emerald-500/5"
    },
    {
      id: "cortex",
      name: "Córtex Docente",
      tag: "Teacher Productivity",
      icon: <Zap className="text-amber-400" size={32} />,
      description: "O diário de classe do futuro. Registro de ocorrências por voz e acompanhamento pedagógico preditivo.",
      features: ["Diário de voz integrado", "Mapa de calor de comportamento", "Automação de relatórios de progressão"],
      color: "border-amber-500/20 bg-amber-500/5"
    },
    {
      id: "governanca",
      name: "LGPD & Governança Soberana",
      tag: "Privacy-by-Design",
      icon: <Lock className="text-zinc-400" size={32} />,
      description: "Segurança jurídica e técnica total. Seus dados são vetores matemáticos, não imagens.",
      features: ["Delete on RAM permanent policy", "Logs de auditoria imutáveis", "Central de Direitos do Titular"],
      color: "border-white/10 bg-white/5"
    }
  ];

  return (
    <div className="flex flex-col min-h-screen bg-black text-white">
      {/* Short Nav placeholder or Hero */}
      <section className="pt-40 pb-20 px-8 flex flex-col items-center">
        <div className="max-w-4xl text-center">
          <h1 className="text-6xl font-black uppercase tracking-tighter mb-6">Explorando o <span className="text-indigo-500">School OS</span></h1>
          <p className="text-zinc-500 text-xl font-medium leading-relaxed">
            A infraestrutura tecnológica definitiva para a gestão de segurança, presença e comunicação escolar de elite.
          </p>
        </div>
      </section>

      {/* Modules Grid */}
      <section className="py-20 px-8">
        <div className="max-w-7xl mx-auto flex flex-col gap-32">
          {modules.map((mod, idx) => (
            <div key={idx} className={`grid grid-cols-1 lg:grid-cols-2 gap-20 items-center ${idx % 2 === 1 ? 'lg:flex-row-reverse' : ''}`}>
              <div className="flex flex-col gap-8">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-3xl flex items-center justify-center bg-white/5">
                    {mod.icon}
                  </div>
                  <span className="text-xs font-black uppercase tracking-[0.3em] text-zinc-500">{mod.tag}</span>
                </div>
                <h2 className="text-5xl font-black tracking-tighter uppercase leading-none">{mod.name}</h2>
                <p className="text-zinc-400 text-lg leading-relaxed">{mod.description}</p>
                <div className="flex flex-col gap-4">
                  {mod.features.map((feat, i) => (
                    <div key={i} className="flex items-center gap-3 text-sm font-bold text-zinc-300">
                      <CheckCircle2 size={18} className="text-indigo-500" />
                      {feat}
                    </div>
                  ))}
                </div>
                <button className="flex items-center gap-2 text-indigo-400 font-black uppercase tracking-widest text-xs mt-4">
                  Detalhamento Técnico <ArrowRight size={14} />
                </button>
              </div>
              
              <div className={`aspect-video rounded-[56px] border ${mod.color} overflow-hidden flex items-center justify-center glass`}>
                 <div className="text-zinc-600 font-black italic text-2xl uppercase tracking-tighter opacity-20">Preview {mod.id}.os</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-32 px-8 border-t border-white/5 bg-zinc-950/40 mt-20">
        <div className="max-w-5xl mx-auto glass p-20 rounded-[64px] border-indigo-500/10 flex flex-col items-center text-center gap-10 bg-indigo-500/5">
          <h2 className="text-5xl font-black uppercase tracking-tighter">Pronto para digitalizar sua soberania?</h2>
          <div className="flex gap-6">
            <button className="bg-white text-black px-12 py-5 rounded-full font-black uppercase tracking-widest hover:bg-zinc-200 transition-all shadow-2xl">
               Agendar Demonstração Local
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
