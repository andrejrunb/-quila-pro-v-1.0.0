import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Smartphone, Download, CheckCircle2, Bell, Users, Eye,
  BarChart3, Shield, Clock, Zap, Wifi, Lock, Cpu, Globe
} from "lucide-react";

export default function MobileApp() {
  const features = [
    {
      icon: <Bell className="w-8 h-8 text-blue-500" />,
      title: "Alerta Instantâneo V3",
      description: "Push notifications em menos de 180ms para eventos críticos de segurança."
    },
    {
      icon: <Users className="w-8 h-8 text-green-500" />,
      title: "Painel de Presença Live",
      description: "Visualização em tempo real da densidade populacional por setor escolar."
    },
    {
      icon: <Eye className="w-8 h-8 text-purple-500" />,
      title: "Video Stream Neural",
      description: "Acesse streams otimizados com overlay de metadados da IA diretamente no celular."
    },
    {
      icon: <BarChart3 className="w-8 h-8 text-orange-500" />,
      title: "Relatórios de Engajamento",
      description: "Insights analíticos convertidos em gráficos intuitivos para tomada de decisão ágil."
    },
    {
      icon: <Shield className="w-8 h-8 text-red-500" />,
      title: "Segurança de Acesso",
      description: "Autenticação biométrica nativa e logs de acesso auditáveis via App."
    },
    {
      icon: <Cpu className="w-8 h-8 text-indigo-500" />,
      title: "Mobile Edge Sync",
      description: "Sincronização delta que reduz o consumo de dados em até 85%."
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
        {/* Hero Section */}
        <section className="py-20 px-4 relative z-10 overflow-hidden">
          <div className="container max-w-6xl mx-auto">
            <div className="grid md:grid-cols-2 gap-20 items-center">
              <div className="space-y-10">
                <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs font-bold text-blue-400 uppercase tracking-widest">
                  <Smartphone className="w-4 h-4" /> Final Testing Phase
                </div>
                <h1 className="text-6xl md:text-8xl font-black tracking-tight leading-tight italic bg-gradient-to-b from-white via-white to-white/60 bg-clip-text text-transparent">
                  A Escola no <br /> Seu Bolso.
                </h1>
                <p className="text-xl text-gray-400 font-light leading-relaxed max-w-lg">
                  O Áquila Pro Mobile traz o controle absoluto da segurança e engajamento da sua escola para a ponta dos dedos. Design de alta performance para decisões em tempo real.
                </p>
                <div className="flex flex-wrap gap-6">
                  <Button size="lg" className="px-12 py-8 rounded-2xl text-xl font-bold bg-white text-blue-600 hover:scale-105 shadow-xl shadow-white/5">
                    Disponível Q3/2026
                  </Button>
                  <Button size="lg" variant="outline" className="px-12 py-8 rounded-2xl text-xl font-bold border-white/20 hover:bg-white/10 uppercase italic tracking-widest text-[10px]">
                    Invite Only Access
                  </Button>
                </div>
                <div className="flex items-center gap-8 text-xs font-bold text-gray-500 uppercase tracking-[0.2em] pt-4">
                  <span className="flex items-center gap-2"><Globe className="w-4 h-4 text-blue-500" /> IOS Native</span>
                  <span className="flex items-center gap-2"><Cpu className="w-4 h-4 text-green-500" /> Android Pro</span>
                </div>
              </div>

              {/* Mockup Showcase */}
              <div className="relative flex justify-center">
                 <div className="absolute inset-0 bg-blue-600/20 blur-[130px] rounded-full"></div>
                 <div className="w-[320px] h-[660px] bg-[#030712] rounded-[3.5rem] p-4 border border-white/10 shadow-2xl relative z-10 ring-1 ring-white/5 ring-inset">
                    <div className="w-full h-full bg-[#050a1a] rounded-[2.8rem] overflow-hidden flex flex-col border border-white/5">
                       {/* App UI Simulation */}
                       <div className="p-8 bg-gradient-to-b from-blue-600/20 to-transparent">
                          <div className="flex justify-between items-center mb-8">
                             <div className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Áquila Mobile V3</div>
                             <Lock size={14} className="text-gray-500" />
                          </div>
                          <h3 className="text-2xl font-black italic tracking-tighter text-white mb-2">Monitor Alpha</h3>
                          <div className="flex gap-2">
                             <div className="px-2 py-1 rounded bg-green-500/20 border border-green-500/30 text-[8px] font-bold text-green-400 uppercase">System Online</div>
                             <div className="px-2 py-1 rounded bg-blue-500/20 border border-blue-500/30 text-[8px] font-bold text-blue-400 uppercase">12 Nodes</div>
                          </div>
                       </div>
                       
                       <div className="px-6 py-4 space-y-4">
                          <div className="glass-card p-5 rounded-2xl border-white/10">
                             <div className="text-[8px] font-black text-gray-500 uppercase mb-3 tracking-widest">Live Attendance Score</div>
                             <div className="text-3xl font-black italic text-blue-500">98.2%</div>
                             <div className="w-full h-1 bg-white/5 rounded-full mt-4 overflow-hidden">
                                <div className="w-[98%] h-full bg-blue-600"></div>
                             </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                             <div className="glass-card p-5 rounded-2xl border-white/10 text-center">
                                <Zap size={16} className="text-yellow-500 mx-auto mb-2" />
                                <div className="text-lg font-black italic">0.4s</div>
                                <div className="text-[6px] font-bold text-gray-600 uppercase">Latency</div>
                             </div>
                             <div className="glass-card p-5 rounded-2xl border-white/10 text-center">
                                <Shield size={16} className="text-blue-500 mx-auto mb-2" />
                                <div className="text-lg font-black italic">Secured</div>
                                <div className="text-[6px] font-bold text-gray-600 uppercase">SSL V3</div>
                             </div>
                          </div>

                          <div className="glass-card p-5 rounded-2xl border-red-500/20 bg-red-500/5">
                             <div className="flex items-center gap-3 mb-2">
                                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                                <div className="text-[8px] font-black text-red-400 uppercase tracking-widest">Critical Alert</div>
                             </div>
                             <div className="text-[10px] text-gray-200 font-light">Unauthorized access detected: Zone B4 - North Hallway</div>
                          </div>
                       </div>

                       <div className="mt-auto p-6 flex justify-around border-t border-white/5 bg-white/5 backdrop-blur-md">
                          <BarChart3 size={18} className="text-blue-500" />
                          <Smartphone size={18} className="text-gray-500" />
                          <Bell size={18} className="text-gray-500" />
                       </div>
                    </div>
                 </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="py-32 px-4 relative bg-white/5 border-y border-white/5">
          <div className="container max-w-6xl mx-auto">
            <div className="text-center mb-24">
              <h2 className="text-4xl md:text-5xl font-black italic uppercase tracking-tighter mb-6">Mobile Intelligence Core</h2>
              <p className="text-gray-400 max-w-xl mx-auto font-light leading-relaxed">Arquitetura nativa desenvolvida para velocidade e clareza informativa sob pressão.</p>
            </div>
            <div className="grid md:grid-cols-3 gap-10">
              {features.map((feature, idx) => (
                <div key={idx} className="glass-card p-10 rounded-[3rem] border-white/5 hover:border-blue-500/30 transition-all group hover:-translate-y-2 duration-500">
                  <div className="mb-8 group-hover:scale-110 transition-transform duration-500">{feature.icon}</div>
                  <h3 className="text-2xl font-black italic uppercase tracking-tighter mb-4 group-hover:text-blue-400 transition-colors">{feature.title}</h3>
                  <p className="text-gray-400 text-sm font-light leading-relaxed">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Tech Specs */}
        <section className="py-32 px-4 relative">
          <div className="container max-w-5xl mx-auto">
            <h2 className="text-3xl font-black italic text-center mb-20 uppercase tracking-[0.2em] text-gray-600">App Specifications</h2>
            <div className="grid md:grid-cols-2 gap-16">
               <div className="space-y-12">
                  {[
                    { t: "Neural Stream V3", d: "Até 48 streams simultâneos com decodificação via GPU mobile." },
                    { t: "Offline Database", d: "Cache local SQLite criptografado para acesso sem internet." },
                    { t: "Dynamic Scaling", d: "Interface que se adapta a tablets e smartphones de qualquer resolução." }
                  ].map((item, i) => (
                    <div key={i} className="flex gap-6 items-start">
                       <Zap className="text-blue-500 mt-1" size={20} />
                       <div>
                          <h4 className="font-black italic text-xl mb-2">{item.t}</h4>
                          <p className="text-gray-500 font-light text-sm">{item.d}</p>
                       </div>
                    </div>
                  ))}
               </div>
               <div className="space-y-12">
                  {[
                    { t: "Zero-Latency Push", d: "Engine baseada em protocolo MQTT para entrega imediata." },
                    { t: "Biometric Vault", d: "Integração total com FaceID / TouchID e Samsung Knox." },
                    { t: "Global Sync", d: "Sincronização em menos de 1s entre Cloud e Mobile App." }
                  ].map((item, i) => (
                    <div key={i} className="flex gap-6 items-start">
                       <Shield className="text-indigo-500 mt-1" size={20} />
                       <div>
                          <h4 className="font-black italic text-xl mb-2">{item.t}</h4>
                          <p className="text-gray-500 font-light text-sm">{item.d}</p>
                       </div>
                    </div>
                  ))}
               </div>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-40 px-4 mb-20">
          <div className="container max-w-5xl mx-auto rounded-[5rem] p-12 md:p-24 text-center relative border border-white/10 bg-blue-600 overflow-hidden shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-700 to-indigo-900 opacity-90"></div>
            <div className="relative z-10">
              <h2 className="text-4xl md:text-6xl font-black mb-8 italic text-white uppercase tracking-tighter leading-tight">Mantenha o Controle, <br /> Em Qualquer Lugar.</h2>
              <p className="text-lg md:text-xl text-blue-100 max-w-xl mx-auto mb-12 font-light">
                Inscreva-se hoje para ser um dos primeiros Beta Testers do Áquila Pro Mobile e influenciar o desenvolvimento do futuro da gestão escolar.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-lg mx-auto">
                <input
                  type="email"
                  placeholder="name@school.com"
                  className="flex-1 px-8 py-6 rounded-2xl bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-white placeholder:text-white/40 font-bold"
                />
                <Button size="lg" className="px-10 py-6 rounded-2xl text-lg font-black italic bg-white text-blue-600 hover:scale-105 transition-all">
                  Join Beta V3
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
