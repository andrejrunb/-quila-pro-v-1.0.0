import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Award, Target, Heart, ShieldCheck, Rocket, Zap, Globe } from "lucide-react";

export default function Sobre() {
  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-[#030712] text-white font-sans">
      {/* Background Elements */}
      <div className="bg-blobs">
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
      </div>

      <Navigation />
      
      <main className="flex-1 pt-32">
        {/* Hero Section */}
        <section className="py-20 px-4 relative z-10">
          <div className="container max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs font-bold text-blue-400 uppercase tracking-widest mb-8">
              The Mission and the Vision V3
            </div>
            <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-tight mb-8 bg-gradient-to-b from-white via-white to-white/70 bg-clip-text text-transparent italic text-center">
              Construindo a <br /> Escola Digital.
            </h1>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto font-light leading-relaxed text-center">
              O Sistema Áquila Pro nasceu da necessidade de criar ambientes educacionais onde a tecnologia protege, sem invadir, e a inteligência potencializa o desenvolvimento humano.
            </p>
          </div>
        </section>

        {/* Core Values / MVV */}
        <section className="py-20 px-4 relative">
          <div className="container max-w-6xl mx-auto">
            <div className="grid md:grid-cols-3 gap-10">
              {[
                { icon: Target, title: "Missão V3", desc: "Digitalizar a segurança escolar com IA de precisão militar, reduzindo incidentes e automatizando a gestão de presença em larga escala." },
                { icon: Rocket, title: "Visão 2030", desc: "Ser o sistema operacional padrão para instituições de ensino inteligentes em toda a América Latina." },
                { icon: Heart, title: "Ética Digital", desc: "Colocar a privacidade do aluno acima de qualquer métrica, seguindo os mais rigorosos padrões globais de proteção de dados." }
              ].map((item, i) => (
                <div key={i} className="glass-card p-12 rounded-[3.5rem] border-white/5 hover:border-blue-500/30 transition-all group">
                   <div className="w-16 h-16 rounded-2xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center mb-8 group-hover:bg-blue-600 transition-all duration-500">
                      <item.icon size={32} className="text-blue-500 group-hover:text-white" />
                   </div>
                   <h3 className="text-2xl font-black italic uppercase tracking-tighter mb-4 group-hover:text-blue-400 transition-colors">{item.title}</h3>
                   <p className="text-gray-400 font-light leading-relaxed text-sm">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Story Section */}
        <section className="py-32 px-4 relative bg-white/5 border-y border-white/5">
           <div className="container max-w-6xl mx-auto">
              <div className="grid md:grid-cols-2 gap-20 items-center">
                 <div>
                    <h2 className="text-4xl font-black italic mb-8 uppercase tracking-tighter">Nossa Gênese Tecnológica</h2>
                    <p className="text-gray-400 font-light text-lg mb-8 leading-relaxed">
                       Fundado por engenheiros de visão computacional e especialistas em gestão pública, o Áquila Pro resolve um problema crítico: a falta de visibilidade em tempo real sobre a segurança estudantil.
                    </p>
                    <p className="text-gray-400 font-light text-lg mb-12 leading-relaxed">
                       Não somos apenas uma empresa de software; somos uma parceira estratégica para diretores que entendem que a segurança é o alicerce de qualquer projeto pedagógico de excelência.
                    </p>
                    <div className="grid grid-cols-2 gap-8">
                       <div>
                          <div className="text-4xl font-black italic text-blue-500 mb-2">450+</div>
                          <div className="text-[10px] uppercase font-bold text-gray-500 tracking-widest">Escolas Implantadas</div>
                       </div>
                       <div>
                          <div className="text-4xl font-black italic text-blue-500 mb-2">12M+</div>
                          <div className="text-[10px] uppercase font-bold text-gray-500 tracking-widest">Faces Processadas/mês</div>
                       </div>
                    </div>
                 </div>
                 <div className="relative">
                    <div className="absolute inset-0 bg-blue-600/20 blur-[120px] rounded-full"></div>
                    <div className="glass-card p-4 rounded-[3.5rem] border-white/10 relative z-10 overflow-hidden aspect-square flex items-center justify-center">
                        <Zap size={200} className="text-blue-600 opacity-20" />
                        <div className="absolute inset-0 flex flex-col justify-center items-center text-center p-12">
                           <h4 className="text-5xl font-black italic text-white uppercase tracking-tighter mb-4">Innovation <br /> First</h4>
                           <p className="text-gray-400 text-sm font-light uppercase tracking-widest">Hardware Agnostic Architecture</p>
                        </div>
                    </div>
                 </div>
              </div>
           </div>
        </section>

        {/* Values Deep Dive */}
        <section className="py-32 px-4">
           <div className="container max-w-4xl mx-auto">
              <h2 className="text-3xl font-black italic text-center mb-20 uppercase tracking-[0.3em] text-gray-600">The Áquila Standard</h2>
              <div className="space-y-12">
                 {[
                   { icon: ShieldCheck, t: "Segurança de Gradação Militar", d: "Criptografia de ponta a ponta e processamento local descentralizado." },
                   { icon: Zap, t: "Performance em Tempo Real", d: "Resultados em milissegundos para ações imediatas em campo." },
                   { icon: Globe, t: "Conformidade Global", d: "Alinhamento total com LGPD (Brasil) e GDPR (Europa)." }
                 ].map((v, i) => (
                   <div key={i} className="flex gap-8 group">
                      <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-blue-600 transition-all duration-500">
                         <v.icon size={24} className="text-blue-500 group-hover:text-white" />
                      </div>
                      <div>
                         <h4 className="text-xl font-bold mb-2 italic uppercase tracking-tight">{v.t}</h4>
                         <p className="text-gray-400 font-light leading-relaxed">{v.d}</p>
                      </div>
                   </div>
                 ))}
              </div>
           </div>
        </section>

        {/* Final Branding Section */}
        <section className="py-40 px-4 bg-gradient-to-b from-transparent to-blue-600/10">
           <div className="container max-w-4xl mx-auto text-center border-t border-white/5 pt-32">
              <h2 className="text-4xl md:text-5xl font-black italic mb-8 uppercase tracking-tighter leading-tight">Preparado para a <br /> Revolução Áquila?</h2>
              <p className="text-gray-400 font-light mb-12 max-w-xl mx-auto leading-relaxed">Dê o primeiro passo para transformar sua instituição em uma referência tecnológica e de segurança no Brasil.</p>
              <button className="px-16 py-8 rounded-2xl bg-white text-blue-600 font-black italic uppercase tracking-widest hover:scale-105 transition-all text-sm shadow-2xl shadow-white/5" onClick={() => window.location.href = '/precos'}>
                 Ver Planos V3
              </button>
           </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
