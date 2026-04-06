import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle, AlertCircle, Users, Clock, ShieldCheck, Rocket, Settings, BarChart } from "lucide-react";

export default function Implantacao() {
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
              Seamless Deployment Strategy
            </div>
            <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-tight mb-8 bg-gradient-to-b from-white via-white to-white/70 bg-clip-text text-transparent italic text-center">
              Deploy V3 em <br /> Tempo Recorde
            </h1>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto font-light leading-relaxed text-center">
              Nossa metodologia de implantação foi desenhada para ser invisível e altamente eficiente, sem interromper o fluxo escolar.
            </p>
          </div>
        </section>

        {/* Process Tabs */}
        <section className="py-20 px-4 relative">
          <div className="container max-w-6xl mx-auto">
            <Tabs defaultValue="planejamento" className="w-full">
              <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 gap-4 bg-transparent h-auto mb-20 p-0">
                {['planejamento', 'preparacao', 'implantacao', 'acompanhamento'].map((tab) => (
                   <TabsTrigger 
                     key={tab}
                     value={tab} 
                     className="data-[state=active]:bg-blue-600 data-[state=active]:text-white bg-white/5 border border-white/10 p-6 rounded-2xl font-black italic uppercase tracking-widest text-[10px] hover:bg-white/10 transition-all h-20"
                   >
                     {tab}
                   </TabsTrigger>
                ))}
              </TabsList>

              <div className="glass-card p-12 rounded-[4rem] border-white/5 bg-white/5 overflow-hidden relative">
                 <div className="absolute top-0 right-0 p-20 opacity-5">
                    <Rocket size={400} />
                 </div>
                 
                 <TabsContent value="planejamento" className="mt-0 animate-in fade-in slide-in-from-right-10 duration-500">
                    <div className="grid md:grid-cols-2 gap-16">
                       <div>
                          <h3 className="text-4xl font-black italic mb-8 uppercase tracking-tighter">Fase 01: Arch Design</h3>
                          <p className="text-gray-400 font-light text-lg mb-10 leading-relaxed">Avaliação sistêmica de hardware e gap analysis de segurança.</p>
                          <ul className="space-y-6">
                            {[
                              { t: "Deep Audit de Rede", d: "Escaneamento de portas e largura de banda segura." },
                              { t: "Plano Pedagógico", d: "Definição de fluxos de entrada/saída customizados." },
                              { t: "Legal Onboarding", d: "Suporte completo para LGPD e termos de consentimento." }
                            ].map((item, i) => (
                              <li key={i} className="flex gap-4">
                                <CheckCircle className="text-blue-500 flex-shrink-0" size={20} />
                                <div>
                                   <div className="font-bold text-white uppercase text-xs tracking-widest mb-1">{item.t}</div>
                                   <div className="text-sm text-gray-500 font-light">{item.d}</div>
                                </div>
                              </li>
                            ))}
                          </ul>
                       </div>
                       <div className="hidden md:block bg-blue-600/10 rounded-[3rem] border border-blue-500/20 p-10 flex items-center justify-center">
                          <Settings size={120} className="text-blue-500" />
                       </div>
                    </div>
                 </TabsContent>

                 <TabsContent value="preparacao" className="mt-0 animate-in fade-in slide-in-from-right-10 duration-500">
                    <div className="grid md:grid-cols-2 gap-16">
                       <div>
                          <h3 className="text-4xl font-black italic mb-8 uppercase tracking-tighter">Fase 02: Core Ready</h3>
                          <p className="text-gray-400 font-light text-lg mb-10 leading-relaxed">Configuração das camadas de processamento local.</p>
                          <ul className="space-y-6">
                            {[
                              { t: "Provisionamento Edge", d: "Setup dos servidores de análise de IA locais." },
                              { t: "Data Migration", d: "Sincronização segura da base de alunos legada." },
                              { t: "Treinamento Staff", d: "Capacitação técnica para equipe de TI e coordenação." }
                            ].map((item, i) => (
                              <li key={i} className="flex gap-4">
                                <CheckCircle className="text-blue-500 flex-shrink-0" size={20} />
                                <div>
                                   <div className="font-bold text-white uppercase text-xs tracking-widest mb-1">{item.t}</div>
                                   <div className="text-sm text-gray-500 font-light">{item.d}</div>
                                </div>
                              </li>
                            ))}
                          </ul>
                       </div>
                       <div className="hidden md:block bg-green-600/10 rounded-[3rem] border border-green-500/20 p-10 flex items-center justify-center">
                          <Users size={120} className="text-green-500" />
                       </div>
                    </div>
                 </TabsContent>
                 
                 <TabsContent value="implantacao" className="mt-0 animate-in fade-in slide-in-from-right-10 duration-500">
                    <div className="grid md:grid-cols-2 gap-16">
                       <div>
                          <h3 className="text-4xl font-black italic mb-8 uppercase tracking-tighter">Fase 03: GO LIVE V3</h3>
                          <p className="text-gray-400 font-light text-lg mb-10 leading-relaxed">Ativação dos protocolos neurais em tempo real.</p>
                          <ul className="space-y-6">
                            {[
                              { t: "Calibragem Óptica", d: "Ajuste fino de FOV e FOI das câmeras IP." },
                              { t: "Stress Test", d: "Simulação de carga máxima no reconhecimento facial." },
                              { t: "Sync Cloud-Edge", d: "Ativação do link de segurança criptografado." }
                            ].map((item, i) => (
                              <li key={i} className="flex gap-4">
                                <CheckCircle className="text-blue-500 flex-shrink-0" size={20} />
                                <div>
                                   <div className="font-bold text-white uppercase text-xs tracking-widest mb-1">{item.t}</div>
                                   <div className="text-sm text-gray-500 font-light">{item.d}</div>
                                </div>
                              </li>
                            ))}
                          </ul>
                       </div>
                       <div className="hidden md:block bg-purple-600/10 rounded-[3rem] border border-purple-500/20 p-10 flex items-center justify-center">
                          <Rocket size={120} className="text-purple-500 italic" />
                       </div>
                    </div>
                 </TabsContent>

                 <TabsContent value="acompanhamento" className="mt-0 animate-in fade-in slide-in-from-right-10 duration-500">
                    <div className="grid md:grid-cols-2 gap-16">
                       <div>
                          <h3 className="text-4xl font-black italic mb-8 uppercase tracking-tighter">Fase 04: Hyper Growth</h3>
                          <p className="text-gray-400 font-light text-lg mb-10 leading-relaxed">Monitoramento de KPIs e otimização contínua de IA.</p>
                          <ul className="space-y-6">
                            {[
                              { t: "Weekly Insights", d: "Relatórios de otimização pedagógica semanais." },
                              { t: "Active Patching", d: "Atualizações de segurança auto-executáveis." },
                              { t: "IA Fine Tuning", d: "Refinamento dos pesos neurais via aprendizado local." }
                            ].map((item, i) => (
                              <li key={i} className="flex gap-4">
                                <CheckCircle className="text-blue-500 flex-shrink-0" size={20} />
                                <div>
                                   <div className="font-bold text-white uppercase text-xs tracking-widest mb-1">{item.t}</div>
                                   <div className="text-sm text-gray-500 font-light">{item.d}</div>
                                </div>
                              </li>
                            ))}
                          </ul>
                       </div>
                       <div className="hidden md:block bg-orange-600/10 rounded-[3rem] border border-orange-500/20 p-10 flex items-center justify-center">
                          <BarChart size={120} className="text-orange-500" />
                       </div>
                    </div>
                 </TabsContent>
              </div>
            </Tabs>
          </div>
        </section>

        {/* Timeline Graphic */}
        <section className="py-24 px-4 relative">
          <div className="container max-w-6xl mx-auto">
            <h2 className="text-3xl font-black italic uppercase mb-16 tracking-tighter">Velocity Roadmap</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              {[
                { time: "Day 01-03", title: "Strategy", icon: Clock },
                { time: "Day 04-06", title: "Setup Core", icon: AlertCircle },
                { time: "Day 07-09", title: "Active Test", icon: Rocket },
                { time: "Day 10+", title: "Operations", icon: Users }
              ].map((step, i) => (
                <div key={i} className="glass-card p-10 rounded-3xl border-white/5 group hover:border-blue-500/30 transition-all">
                  <div className="text-blue-500 mb-6 group-hover:scale-110 transition-transform"><step.icon size={32} /></div>
                  <div className="text-xs font-black uppercase text-gray-500 tracking-widest mb-2">{step.time}</div>
                  <div className="text-2xl font-black italic uppercase tracking-tighter">{step.title}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Support Banner */}
        <section className="py-32 px-4 mb-20">
          <div className="container max-w-5xl mx-auto glass-card p-16 rounded-[4rem] border-white/10 flex flex-col items-center text-center">
             <ShieldCheck size={64} className="text-blue-500 mb-8" />
             <h2 className="text-4xl font-black italic mb-6">Garantia de Uptime Áquila</h2>
             <p className="text-gray-400 max-w-2xl font-light mb-12">
               Nossa equipe de suporte técnico e engenharia de IA monitora cada implantação 24/7 durante os primeiros 30 dias para garantir estabilidade absoluta.
             </p>
             <button className="px-12 py-6 rounded-2xl bg-blue-600 text-white font-black italic uppercase tracking-widest hover:bg-blue-700 hover:scale-105 transition-all text-xs" onClick={() => window.location.href = '/contato'}>
                Iniciar Diagnóstico Gratuito
             </button>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
