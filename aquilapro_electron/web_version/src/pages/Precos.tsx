import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Check, CheckCircle2, Zap, Shield, Crown } from "lucide-react";
import { Link } from "wouter";

export default function Precos() {
  const plans = [
    {
      name: "Essencial",
      description: "Para pequenas instituições em ascensão",
      price: "1.990",
      period: "/mês",
      features: [
        "Até 500 alunos registrados",
        "2 Entradas de Câmeras Edge",
        "Reconhecimento Facial V3",
        "Gestão de Presença Básica",
        "Alertas WhatsApp Standard",
        "Dashboard de Coordenação",
        "Suporte por Email"
      ],
      cta: "Começar Agora",
      highlighted: false,
      icon: Shield
    },
    {
      name: "Profissional",
      description: "O padrão ouro para escolas modernas",
      price: "4.990",
      period: "/mês",
      features: [
        "Até 1.500 alunos registrados",
        "12 Entradas de Câmeras Edge",
        "IA Preditiva de Evasão",
        "Portal de Pais Full Experience",
        "WhatsApp Ultra (Fila Zero)",
        "Relatórios PDF Automatizados",
        "Integração IoT (Catracas)",
        "Suporte Prioritário 24/7"
      ],
      cta: "Assinar V3 Pro",
      highlighted: true,
      icon: Zap
    },
    {
      name: "Enterprise",
      description: "Escalabilidade ilimitada para grandes redes",
      price: "Custom",
      period: "",
      features: [
        "Alunos e Usuários Ilimitados",
        "Câmeras Ilimitadas (Escalável)",
        "Deep Learning Customizado",
        "White-Label Completo",
        "API para ERPs de Terceiros",
        "On-Premise / Hybrid Cloud",
        "Gerente de Sucesso Dedicado",
        "SLA de 99.99% Garantido"
      ],
      cta: "Falar com Consultor",
      highlighted: false,
      icon: Crown
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
        <section className="py-20 px-4">
          <div className="container max-w-4xl mx-auto text-center z-10 relative">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs font-bold text-blue-400 uppercase tracking-widest mb-8 animate-fade-in">
              Planos e Investimento V3
            </div>
            <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-tight mb-8 bg-gradient-to-b from-white via-white to-white/70 bg-clip-text text-transparent italic">
              O Investimento que <br /> Transforma Vidas
            </h1>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto font-light">
              Escolha o nível de proteção e inteligência ideal para o tamanho da sua instituição educacional.
            </p>
          </div>
        </section>

        {/* Pricing Grid */}
        <section className="py-20 px-4 relative">
          <div className="container max-w-6xl mx-auto">
            <div className="grid md:grid-cols-3 gap-8 items-stretch">
              {plans.map((plan, idx) => (
                <div 
                  key={idx} 
                  className={`glass-card p-10 rounded-[3rem] flex flex-col transition-all duration-500 hover:-translate-y-2 ${
                    plan.highlighted ? "border-blue-600/50 bg-gradient-to-br from-blue-600/10 to-violet-600/10 scale-105 z-10 shadow-[0_30px_60px_-15px_rgba(37,99,235,0.2)]" : "hover:border-white/20"
                  }`}
                >
                  {plan.highlighted && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-blue-600 text-[10px] font-black uppercase tracking-widest whitespace-nowrap">
                      MAIS POPULAR
                    </div>
                  )}
                  
                  <div className="mb-10 text-center md:text-left">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-6 border ${plan.highlighted ? 'bg-blue-600 text-white border-blue-400' : 'bg-white/5 text-blue-400 border-white/10'}`}>
                      <plan.icon size={24} />
                    </div>
                    <h3 className="text-2xl font-black mb-2 uppercase tracking-tight">{plan.name}</h3>
                    <p className="text-gray-400 text-sm font-light mb-8">
                      {plan.description}
                    </p>
                    <div className="flex items-baseline gap-1">
                      {plan.price !== "Custom" && <span className="text-sm font-bold text-gray-400">R$</span>}
                      <span className="text-5xl font-black">{plan.price}</span>
                      <span className="text-sm font-normal text-gray-500">{plan.period}</span>
                    </div>
                  </div>

                  <div className="space-y-4 mb-10 flex-grow">
                    {plan.features.map((feature, fidx) => (
                      <div key={fidx} className="flex items-start gap-3">
                        <CheckCircle2 size={18} className={plan.highlighted ? "text-blue-400" : "text-blue-600"} />
                        <span className="text-gray-300 text-sm font-light">{feature}</span>
                      </div>
                    ))}
                  </div>

                  <Button
                    size="lg"
                    className={`w-full py-7 rounded-2xl font-black text-lg transition-all ${
                      plan.highlighted 
                        ? "bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-600/30" 
                        : "bg-white/5 border border-white/10 hover:bg-white/10"
                    }`}
                    onClick={() => {
                        if (plan.name === "Enterprise") {
                            window.location.href = '/contato';
                        } else {
                            window.location.href = `/checkout?plan=${plan.name.toLowerCase()}`;
                        }
                    }}
                  >
                    {plan.cta}
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Comparison Table */}
        <section className="py-32 px-4 relative">
          <div className="container max-w-6xl mx-auto">
            <div className="text-center mb-20">
               <h2 className="text-4xl md:text-5xl font-black mb-6 italic">Visão Analítica</h2>
               <p className="text-gray-400 max-w-xl mx-auto font-light text-lg">
                 Compare os recursos técnicos e descubra por que o Áquila Pro é a melhor escolha.
               </p>
            </div>
            
            <div className="glass-card rounded-[3rem] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-white/10 bg-white/5">
                      <th className="py-6 px-8 font-black text-gray-400 uppercase tracking-widest text-xs">Recurso V3</th>
                      <th className="py-6 px-8 font-black text-center text-xs">Essencial</th>
                      <th className="py-6 px-8 font-black text-center text-xs text-blue-400">Profissional</th>
                      <th className="py-6 px-8 font-black text-center text-xs">Enterprise</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {[
                      { feature: "Reconhecimento Facial V3", essencial: "✓", profissional: "Ultra", enterprise: "Deep Learning" },
                      { feature: "Gestão de Presença", essencial: "Básica", profissional: "Completa", enterprise: "Híbrida" },
                      { feature: "Análise Preditiva", essencial: "—", profissional: "Sim", enterprise: "Sim (Custom)" },
                      { feature: "WhatsApp Omni", essencial: "Standard", profissional: "Ultra Prioritário", enterprise: "Ultra Prioritário" },
                      { feature: "Câmeras Edge", essencial: "2", profissional: "12", enterprise: "Ilimitado" },
                      { feature: "SLA Garantido", essencial: "—", profissional: "99.9%", enterprise: "99.99%" },
                      { feature: "Suporte", essencial: "Email", profissional: "24/7", enterprise: "Gerente Dedicado" },
                    ].map((row, idx) => (
                      <tr key={idx} className="hover:bg-white/5 transition-colors">
                        <td className="py-6 px-8 font-bold text-sm text-gray-300">{row.feature}</td>
                        <td className="py-6 px-8 text-center text-sm text-gray-500">{row.essencial}</td>
                        <td className="py-6 px-8 text-center text-sm text-blue-400 font-bold">{row.profissional}</td>
                        <td className="py-6 px-8 text-center text-sm text-gray-500">{row.enterprise}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Banner */}
        <section className="py-32 px-4 mb-20">
          <div className="container max-w-5xl mx-auto rounded-[4rem] p-12 md:p-24 text-center overflow-hidden relative border border-white/10 bg-gradient-to-br from-blue-600/20 to-violet-600/20 backdrop-blur-3xl shadow-2xl">
            <h2 className="text-4xl md:text-6xl font-black mb-8 italic italic">Precisa de uma Proposta Customizada?</h2>
            <p className="text-lg md:text-xl text-gray-400 max-w-xl mx-auto mb-12 font-light">
              Nossos especialistas em arquitetura de segurança estão prontos para projetar a solução ideal para sua rede escolar.
            </p>
            <Button size="lg" className="px-12 py-8 rounded-2xl text-xl font-bold bg-white text-blue-600 hover:scale-105 transition-transform" onClick={() => window.location.href = '/contato'}>
              Falar com um Especialista
            </Button>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
