import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Star, Quote, MapPin, Users, Award, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function CasosSucesso() {
  const cases = [
    {
      escola: "Colégio São Paulo",
      local: "São Paulo, SP",
      alunos: 450,
      resultado: "Redução de 78% em incidentes de segurança",
      testimonial: "O Sistema Áquila Pro transformou completamente a forma como gerenciamos a segurança e presença dos alunos. Os coordenadores agora têm visibilidade em tempo real de toda a escola.",
      autor: "Diretora Maria Silva",
      impacto: [
        "Resposta mais rápida a incidentes",
        "Redução de faltas não registradas",
        "Melhor comunicação com familiares"
      ]
    },
    {
      escola: "Escola Municipal Futuro",
      local: "Rio de Janeiro, RJ",
      alunos: 320,
      resultado: "Aumento de 45% na precisão de registros",
      testimonial: "Implementar o Áquila foi simples e o suporte técnico foi excelente. Nossos dados de presença agora são 100% confiáveis e automatizados.",
      autor: "Coordenador João Costa",
      impacto: [
        "Eliminação de erros manuais",
        "Economia de tempo administrativo",
        "Relatórios mais precisos"
      ]
    },
    {
      escola: "Instituto Excelência",
      local: "Belo Horizonte, MG",
      alunos: 520,
      resultado: "Detecção de 12 padrões de desengajamento",
      testimonial: "Os insights de engajamento fornecidos pelo Áquila nos permitiram identificar alunos que precisavam de apoio pedagógico. Conseguimos intervir antes que os problemas se agravassem.",
      autor: "Dra. Ana Santos",
      impacto: [
        "Intervenções pedagógicas efetivas",
        "Redução de evasão escolar",
        "Acompanhamento individualizado"
      ]
    },
    {
      escola: "Colégio Inovação",
      local: "Curitiba, PR",
      alunos: 380,
      resultado: "ROI em 6 meses com Hardware Legado",
      testimonial: "A flexibilidade de integração com câmeras existentes foi decisiva. Conseguimos implementar a solução sem necessidade de investimento em infraestrutura cara.",
      autor: "TI Carlos Mendes",
      impacto: [
        "Zero investimento em câmeras novas",
        "Escalabilidade para futuras expansões",
        "Monitoramento 24/7 centralizado"
      ]
    }
  ];

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-[#030712] text-white font-sans">
      {/* Background Elements */}
      <div className="bg-blobs">
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
      </div>

      <Navigation />
      
      <main className="flex-1 pt-32">
        {/* Header Section */}
        <section className="py-20 px-4 relative z-10">
          <div className="container max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs font-bold text-blue-400 uppercase tracking-widest mb-8">
              Impact and Evidence V3
            </div>
            <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-tight mb-8 bg-gradient-to-b from-white via-white to-white/70 bg-clip-text text-transparent italic">
              Resultados que <br /> Movem o Ensino
            </h1>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto font-light leading-relaxed">
              Descubra por que as principais instituições de ensino do país confiam no Áquila Pro para elevar o patamar de segurança e engajamento.
            </p>
          </div>
        </section>

        {/* Statistics Section */}
        <section className="py-12 px-4 relative">
          <div className="container max-w-6xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
               {[
                 { icon: Users, label: "Alunos Protegidos", value: "125K+" },
                 { icon: Award, label: "Escolas V3 Pro", value: "450+" },
                 { icon: Zap, label: "Alertas Gerados", value: "1.2M+" },
                 { icon: ShieldCheck, label: "Uptime do Sistema", value: "99.9%" }
               ].map((stat, i) => (
                 <div key={i} className="text-center group">
                    <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-600 transition-all">
                       <stat.icon size={20} className="text-blue-500 group-hover:text-white" />
                    </div>
                    <div className="text-3xl font-black italic tracking-tighter mb-1">{stat.value}</div>
                    <div className="text-[10px] uppercase font-bold text-gray-500 tracking-widest">{stat.label}</div>
                 </div>
               ))}
            </div>
          </div>
        </section>

        {/* Cases Grid */}
        <section className="py-32 px-4 relative">
          <div className="container max-w-6xl mx-auto">
            <div className="grid md:grid-cols-2 gap-10">
              {cases.map((caseItem, idx) => (
                <div key={idx} className="glass-card p-12 rounded-[3.5rem] border-white/5 hover:border-blue-500/30 transition-all group flex flex-col">
                  <div className="mb-10 flex justify-between items-start">
                    <div>
                      <h3 className="text-3xl font-black italic tracking-tighter uppercase mb-2 group-hover:text-blue-400 transition-colors">
                        {caseItem.escola}
                      </h3>
                      <div className="flex items-center gap-2 text-gray-500 text-xs font-bold uppercase tracking-widest">
                        <MapPin size={12} />
                        {caseItem.local}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      {[1,2,3,4,5].map(i => <Star key={i} size={14} className="fill-blue-500 text-blue-500" />)}
                    </div>
                  </div>

                  <div className="p-8 rounded-3xl bg-blue-600/10 border border-blue-500/20 mb-10">
                     <span className="text-[10px] font-black uppercase text-blue-400 tracking-widest mb-2 block">KPI Principal</span>
                     <p className="text-2xl font-black italic text-white tracking-tighter leading-tight">
                        {caseItem.resultado}
                     </p>
                  </div>

                  <div className="mb-12 relative">
                    <Quote className="absolute -top-4 -left-4 text-white/10" size={60} />
                    <p className="text-gray-300 italic font-light leading-relaxed mb-6 pl-6">
                      "{caseItem.testimonial}"
                    </p>
                    <footer className="pl-6 text-sm font-bold text-blue-400 uppercase tracking-widest">
                      — {caseItem.autor}
                    </footer>
                  </div>

                  <div className="mt-auto pt-8 border-t border-white/5">
                    <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-6">Impacto Institucional:</h4>
                    <div className="grid grid-cols-1 gap-4">
                      {caseItem.impacto.map((item, iidx) => (
                        <div key={iidx} className="flex items-center gap-3 text-sm text-gray-400 font-light px-4 py-3 bg-white/5 rounded-xl border border-white/5">
                          <Check size={14} className="text-blue-500" />
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Banner */}
        <section className="py-32 px-4 mb-20">
          <div className="container max-w-5xl mx-auto rounded-[4rem] p-12 md:p-24 text-center overflow-hidden relative border border-white/10 bg-gradient-to-br from-blue-600/20 to-violet-600/20 backdrop-blur-3xl shadow-2xl">
            <h2 className="text-4xl md:text-6xl font-black mb-8 italic">Seu Sucesso é Nossa <br /> Próxima Missão</h2>
            <p className="text-lg md:text-xl text-gray-400 max-w-xl mx-auto mb-12 font-light">
              Junte-se às instituições que já estão operando em um novo patamar de excelência tecnológica.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
               <Button size="lg" className="px-12 py-8 rounded-2xl text-xl font-bold bg-white text-blue-600 hover:scale-105" onClick={() => window.location.href = '/precos'}>
                 Ver Testemunhos V3
               </Button>
               <Button size="lg" variant="outline" className="px-12 py-8 rounded-2xl text-xl font-bold border-white/20 hover:bg-white/10" onClick={() => window.location.href = '/contato'}>
                 Agendar Apresentação
               </Button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

// Icon helper since lucide-react might not export ShieldCheck but ShieldCheckMark or similar in some versions, 
// using ShieldCheck here as it's common.
import { ShieldCheck } from "lucide-react";
