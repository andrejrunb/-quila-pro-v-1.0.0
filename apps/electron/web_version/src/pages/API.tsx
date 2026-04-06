import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Code, Lock, Zap, BookOpen, Terminal, Smartphone, Key } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function API() {
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
              Áquila Dev Ecosystem V3
            </div>
            <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-tight mb-8 bg-gradient-to-b from-white via-white to-white/70 bg-clip-text text-transparent italic">
              Conectividade Sem <br /> Limites para o Futuro
            </h1>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto font-light">
              O Áquila Pro oferece integração profunda com sistemas educacionais legados e modernos através de APIs robustas e webhooks em tempo real.
            </p>
          </div>
        </section>

        {/* API Key Features */}
        <section className="py-20 px-4 relative">
          <div className="container max-w-6xl mx-auto">
            <div className="grid md:grid-cols-3 gap-8 mb-20">
              <div className="glass-card p-10 rounded-[2.5rem] border-white/10 hover:border-blue-500/30 transition-all group">
                <Terminal className="w-12 h-12 text-blue-500 mb-6 group-hover:scale-110 transition-all" />
                <h3 className="text-xl font-black mb-4 uppercase italic">Integração Modular</h3>
                <p className="text-gray-400 text-sm font-light leading-relaxed">
                  Conecte o Áquila Pro com seus sistemas de gestão escolar (ERP) de forma segura através de nossa API RESTful escalável.
                </p>
              </div>

              <div className="glass-card p-10 rounded-[2.5rem] border-white/10 hover:border-violet-500/30 transition-all group">
                <Key className="w-12 h-12 text-violet-500 mb-6 group-hover:scale-110 transition-all" />
                <h3 className="text-xl font-black mb-4 uppercase italic">OAuth 2.0 Security</h3>
                <p className="text-gray-400 text-sm font-light leading-relaxed">
                  Todas as integrações utilizam protocolos de segurança de nível bancário, conformes com os mais altos padrões de LGPD.
                </p>
              </div>

              <div className="glass-card p-10 rounded-[2.5rem] border-white/10 hover:border-cyan-500/30 transition-all group">
                <BookOpen className="w-12 h-12 text-cyan-500 mb-6 group-hover:scale-110 transition-all" />
                <h3 className="text-xl font-black mb-4 uppercase italic">SDK V3 Pro</h3>
                <p className="text-gray-400 text-sm font-light leading-relaxed">
                  Bibliotecas prontas em diversas linguagens e documentação técnica detalhada para sua equipe de TI acelerar o deploy.
                </p>
              </div>
            </div>

            {/* API Explorer Tabs */}
            <div className="glass-card p-12 rounded-[3.5rem]">
              <h2 className="text-3xl font-black mb-12 italic text-center md:text-left">Explorador de Integração</h2>
              
              <Tabs defaultValue="sistemas" className="w-full">
                <TabsList className="grid w-full grid-cols-3 mb-10 h-16 bg-white/5 border border-white/10 p-2 rounded-2xl">
                  <TabsTrigger value="sistemas" className="rounded-xl data-[state=active]:bg-blue-600 font-bold">ERP Educacional</TabsTrigger>
                  <TabsTrigger value="notificacoes" className="rounded-xl data-[state=active]:bg-blue-600 font-bold">Push & Alertas</TabsTrigger>
                  <TabsTrigger value="dados" className="rounded-xl data-[state=active]:bg-blue-600 font-bold">Data Insights</TabsTrigger>
                </TabsList>

                <TabsContent value="sistemas" className="space-y-8 animate-in fade-in slide-in-from-bottom-5">
                   <div className="grid md:grid-cols-2 gap-12">
                      <div className="space-y-8">
                         <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                            <h4 className="font-bold text-blue-400 mb-2">Sync Sincronizado</h4>
                            <p className="text-sm text-gray-400 font-light">Sincronize automaticamente dados de alunos e turmas a cada 15 minutos ou via webhook instantâneo.</p>
                         </div>
                         <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                            <h4 className="font-bold text-blue-400 mb-2">SSO Enterprise</h4>
                            <p className="text-sm text-gray-400 font-light">Login unificado via Microsoft 365, Google Workspace ou seu provedor SAML/Active Directory.</p>
                         </div>
                      </div>
                      <div className="bg-black/40 rounded-3xl p-8 border border-white/5 font-mono text-xs overflow-x-auto shadow-inner">
                         <div className="flex justify-between items-center mb-6">
                            <span className="text-blue-500 font-black px-3 py-1 bg-blue-500/10 rounded-lg">POST</span>
                            <span className="text-gray-600">/api/v3/sync/students</span>
                         </div>
                         <pre className="text-gray-300">
{`{
  "school_id": "99A2B1-X",
  "batch_id": "BATCH-2026-001",
  "payload": [
    {
      "id": "STU-001",
      "name": "Alex Smith",
      "class": "A-301",
      "parent_id": "PAR-404"
    }
  ]
}`}
                         </pre>
                         <div className="mt-8 pt-8 border-t border-white/10">
                            <span className="text-green-500 font-bold">200 OK</span>
                            <span className="text-gray-600 ml-4 font-light">Sincronização iniciada</span>
                         </div>
                      </div>
                   </div>
                </TabsContent>

                <TabsContent value="notificacoes" className="space-y-8 animate-in fade-in slide-in-from-bottom-5">
                  <div className="grid md:grid-cols-3 gap-6">
                     {[
                       { icon: Zap, name: "Webhooks Real-time", desc: "Receba notificações em seus servidores no exato momento de uma ocorrência." },
                       { icon: Smartphone, name: "Push Customizado", desc: "Acione o aplicativo móvel da sua escola com dados do Áquila Pro." },
                       { icon: Smartphone, name: "WhatsApp Multi-Flow", desc: "Envie alertas via API para nossa fila prioritária de WhatsApp Business." }
                     ].map((box, i) => (
                       <div key={i} className="p-8 rounded-3xl bg-white/5 border border-white/10 hover:bg-blue-600/10 transition-all">
                          <box.icon size={32} className="text-blue-500 mb-6" />
                          <h4 className="font-bold mb-4">{box.name}</h4>
                          <p className="text-sm text-gray-400 font-light leading-relaxed">{box.desc}</p>
                       </div>
                     ))}
                  </div>
                </TabsContent>

                <TabsContent value="dados" className="space-y-8 animate-in fade-in slide-in-from-bottom-5">
                  <div className="p-12 bg-gradient-to-br from-blue-600/10 to-violet-600/10 border border-blue-500/20 rounded-[2.5rem]">
                    <div className="grid md:grid-cols-2 gap-12 items-center">
                       <div>
                          <h3 className="text-2xl font-black mb-6 italic">Arquitetura de Dados em Escala</h3>
                          <p className="text-gray-400 font-light leading-relaxed mb-8">
                             Nossa API permite a exportação massiva de metadados anonimizados para ferramentas de BI como PowerBI, Tableau ou notebooks Python (Jupyter).
                          </p>
                          <ul className="space-y-4">
                             <li className="flex items-center gap-3 text-sm font-bold"><Zap size={16} className="text-blue-400" /> Exportação CSV / JSON / Parquet</li>
                             <li className="flex items-center gap-3 text-sm font-bold"><Zap size={16} className="text-blue-400" /> Query Language Proprietária (AQL)</li>
                             <li className="flex items-center gap-3 text-sm font-bold"><Zap size={16} className="text-blue-400" /> Snapshot diário de performance</li>
                          </ul>
                       </div>
                       <div className="glass-card p-8 rounded-3xl border-white/10 flex items-center justify-center min-h-[300px]">
                          <Database size={80} className="text-blue-500 opacity-20 absolute" />
                          <div className="text-center">
                             <span className="text-6xl font-black text-white italic">Big Data</span>
                             <p className="text-blue-400 font-bold mt-2 uppercase tracking-widest text-xs">Ready for Enterprise</p>
                          </div>
                       </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </section>

        {/* Support Section */}
        <section className="py-32 px-4 mb-20">
          <div className="container max-w-4xl mx-auto rounded-[3.5rem] p-12 md:p-24 text-center border border-white/10 bg-white/5 backdrop-blur-3xl shadow-2xl">
            <h2 className="text-3xl md:text-5xl font-black mb-8 italic">Suporte Técnico Especializado</h2>
            <p className="text-lg text-gray-400 max-w-xl mx-auto mb-12 font-light">
              Nossa equipe de engenheiros de integração está pronta para auxiliar sua escola na implementação técnica, desde o setup inicial até customizações complexas.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
               <Button size="lg" className="px-10 py-7 rounded-2xl bg-blue-600 hover:scale-105 font-bold" onClick={() => window.open('https://github.com/andrejrunb/aquila-pro-api-v3', '_blank')}>
                 Repositório GitHub
               </Button>
               <Button size="lg" variant="outline" className="px-10 py-7 rounded-2xl border-white/20 hover:bg-white/10 font-bold" onClick={() => window.location.href = '/contato'}>
                 Falar com Suporte Dev
               </Button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
