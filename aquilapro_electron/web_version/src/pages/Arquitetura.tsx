import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Database, Server, Shield, Network, Lock, CheckCircle, Cpu, Cloud, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Arquitetura() {
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
              Infraestrutura V3 Hybrid
            </div>
            <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-tight mb-8 bg-gradient-to-b from-white via-white to-white/70 bg-clip-text text-transparent italic">
              Arquitetura de <br /> Elite e Escala
            </h1>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto font-light">
              O Áquila Pro foi desenvolvido com uma arquitetura robusta, escalável e segura para proteger dados de alunos e garantir performance em milissegundos.
            </p>
          </div>
        </section>

        {/* Architecture Components Grid */}
        <section className="py-20 px-4 relative">
          <div className="container max-w-6xl mx-auto">
            <h2 className="text-3xl font-black mb-12 italic text-center md:text-left">Ecossistema Tecnológico</h2>
            
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-12 h-16 bg-white/5 border border-white/10 p-2 rounded-2xl">
                <TabsTrigger value="overview" className="rounded-xl data-[state=active]:bg-blue-600 data-[state=active]:text-white transition-all font-bold">Visão Geral Controlada</TabsTrigger>
                <TabsTrigger value="seguranca" className="rounded-xl data-[state=active]:bg-blue-600 data-[state=active]:text-white transition-all font-bold">Protocolos de Segurança</TabsTrigger>
                <TabsTrigger value="performance" className="rounded-xl data-[state=active]:bg-blue-600 data-[state=active]:text-white transition-all font-bold">Performance & Cloud</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-8 animate-in fade-in slide-in-from-bottom-5">
                <div className="glass-card p-12 rounded-[3.5rem] relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
                     <Cpu size={240} className="text-white" />
                  </div>
                  
                  <h3 className="text-3xl font-black mb-10 italic">Arquitetura Distribuída V3</h3>
                  
                  <div className="grid md:grid-cols-3 gap-10">
                    <div className="p-8 rounded-3xl bg-white/5 border border-white/10 hover:border-blue-500/30 transition-all">
                      <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center mb-6 shadow-lg shadow-blue-600/40">
                         <Network size={24} />
                      </div>
                      <h4 className="text-xl font-bold mb-4">Edge Computing</h4>
                      <p className="text-gray-400 text-sm font-light leading-relaxed">
                        Processamento local ultra-rápido para privacidade total. A IA roda diretamente na escola, garantindo que imagens sensíveis nunca precisem sair da rede local.
                      </p>
                    </div>

                    <div className="p-8 rounded-3xl bg-white/5 border border-white/10 hover:border-blue-500/30 transition-all">
                      <div className="w-12 h-12 rounded-xl bg-violet-600 flex items-center justify-center mb-6 shadow-lg shadow-violet-600/40">
                         <Zap size={24} />
                      </div>
                      <h4 className="text-xl font-bold mb-4">Hybrid Cloud</h4>
                      <p className="text-gray-400 text-sm font-light leading-relaxed">
                        Sincronização inteligente com servidores globais para geração de relatórios massivos e backup de segurança redundante.
                      </p>
                    </div>

                    <div className="p-8 rounded-3xl bg-white/5 border border-white/10 hover:border-blue-500/30 transition-all">
                      <div className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center mb-6 shadow-lg shadow-indigo-600/40">
                         <Database size={24} />
                      </div>
                      <h4 className="text-xl font-bold mb-4">Neural Data Lake</h4>
                      <p className="text-gray-400 text-sm font-light leading-relaxed">
                        Armazenamento criptografado de metadados para análise preditiva de comportamento e suporte pedagógico avançado.
                      </p>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="seguranca" className="animate-in fade-in slide-in-from-bottom-5">
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {[
                    { icon: Lock, title: "LGPD Compliance", desc: "Criptografia end-to-end e política de retenção automática de dados sensíveis." },
                    { icon: Shield, title: "Auth V3", desc: "Autenticação multifator e controle de acesso granular baseado em funções (RBAC)." },
                    { icon: Server, title: "Redundância", desc: "Sistemas em failover geográfico para garantir disponibilidade extrema." },
                    { icon: CheckCircle, title: "Auditoria", desc: "Logs imutáveis de cada acesso e ação realizada dentro da plataforma." }
                  ].map((item, i) => (
                    <div key={i} className="glass-card p-10 rounded-[2.5rem] border-white/10 hover:border-blue-500/40 transition-all group">
                       <item.icon size={40} className="text-blue-500 mb-6 group-hover:scale-110 transition-transform" />
                       <h4 className="text-lg font-black mb-4 uppercase tracking-tighter italic">{item.title}</h4>
                       <p className="text-gray-400 text-sm font-light">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="performance" className="animate-in fade-in slide-in-from-bottom-5">
                <div className="glass-card p-12 rounded-[3.5rem]">
                   <div className="grid md:grid-cols-2 gap-12">
                      <div>
                        <h3 className="text-3xl font-black mb-8 italic">Métricas de Performance</h3>
                        <div className="space-y-6">
                           {[
                             { label: "Latência de Resposta", value: "< 80ms" },
                             { label: "Uptime Garantido", value: "99.99%" },
                             { label: "Capacidade de Captura", value: "∞ Câmeras" },
                             { label: "Propagação de Alerta", value: "Real-time" }
                           ].map((m, i) => (
                             <div key={i} className="flex justify-between items-center p-4 bg-white/5 rounded-xl border border-white/10">
                               <span className="text-gray-400 font-light">{m.label}</span>
                               <span className="text-blue-400 font-black">{m.value}</span>
                             </div>
                           ))}
                        </div>
                      </div>
                      <div className="flex flex-col justify-center bg-blue-600/10 rounded-[2rem] p-10 border border-blue-500/20">
                         <Cloud className="text-blue-500 mb-6" size={48} />
                         <h4 className="text-2xl font-black mb-4 italic">Auto-Scalable Infra</h4>
                         <p className="text-gray-400 font-light leading-relaxed">
                           Nossa infraestrutura utiliza Kubernetes e computação serveless para escalar instantaneamente durante horários de pico (entrada/saída escolar), mantendo o custo eficiente e a performance constante.
                         </p>
                      </div>
                   </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </section>

        {/* Technical Features Section */}
        <section className="py-24 px-4 relative overflow-hidden">
          <div className="container max-w-6xl mx-auto">
            <div className="grid md:grid-cols-3 gap-12">
               <div className="space-y-4">
                  <h3 className="text-6xl font-black italic opacity-20">01</h3>
                  <h4 className="text-2xl font-bold">Deep Neural Ops</h4>
                  <p className="text-gray-400 font-light">Monitoramento proativo da saúde de cada nó da rede escolar com auto-healing via scripts inteligentes.</p>
               </div>
               <div className="space-y-4">
                  <h3 className="text-6xl font-black italic opacity-20">02</h3>
                  <h4 className="text-2xl font-bold">Zero Trust Net</h4>
                  <p className="text-gray-400 font-light">Nenhum pacote de dados é confiado por padrão. Cada comunicação requer validação de token RSA de 4096 bits.</p>
               </div>
               <div className="space-y-4">
                  <h3 className="text-6xl font-black italic opacity-20">03</h3>
                  <h4 className="text-2xl font-bold">Polyglot Storage</h4>
                  <p className="text-gray-400 font-light">Uso otimizado de SQL para dados estruturados, NoSQL para eventos de tempo real e S3 para armazenamento de mídia.</p>
               </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-32 px-4 mb-20 text-center">
            <h2 className="text-4xl md:text-5xl font-black mb-8 italic">Engenharia em sua Melhor Forma</h2>
            <p className="text-xl text-gray-400 mb-12 max-w-2xl mx-auto font-light leading-relaxed">
              Curioso sobre como o Áquila Pro se integra à sua infraestrutura atual? Temos documentação técnica detalhada para sua equipe de TI.
            </p>
            <div className="flex flex-wrap gap-6 justify-center">
               <Button size="lg" className="px-12 py-8 rounded-2xl text-xl font-bold bg-blue-600 hover:scale-105" onClick={() => window.location.href = '/api'}>
                 Documentação V3
               </Button>
               <Button size="lg" variant="outline" className="px-12 py-8 rounded-2xl text-xl font-bold border-white/20 hover:bg-white/10" onClick={() => window.location.href = '/contato'}>
                 Consultar Arquiteto
               </Button>
            </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
