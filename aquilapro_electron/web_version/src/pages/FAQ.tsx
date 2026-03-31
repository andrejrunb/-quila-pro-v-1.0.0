import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { useState } from "react";
import { ChevronDown, Search, MessageCircle, Mail, Phone, ExternalLink } from "lucide-react";
import { config } from "../../server/_core/config";
import { Button } from "@/components/ui/button";

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqs = [
    {
      category: "Infraestrutura & IA",
      questions: [
        {
          q: "Qual a precisão do reconhecimento facial V3?",
          a: "Nossa tecnologia alcança precisão superior a 99.7% em ambientes controlados e 95% em situações de alto tráfego. Utilizamos detecção de profundidade binocular para evitar fraudes com fotos ou vídeos."
        },
        {
          q: "O sistema exige troca das câmeras atuais?",
          a: "Absolutamente não. Se suas câmeras suportam os protocolos RTSP ou ONVIF, nossa arquitetura as integrará via software. Nossa missão é otimizar seu investimento atual."
        },
        {
          q: "Como o áquila pro lida com a privacidade?",
          a: "A IA processa as imagens localmente na escola (Edge Computing). Apenas vetores matemáticos e metadados anonimizados são sincronizados com a nuvem, garantindo segurança total conforme a LGPD."
        }
      ]
    },
    {
      category: "Segurança de Dados",
      questions: [
        {
          q: "Os dados dos alunos são compartilhados?",
          a: "Nunca. Os dados pertencem exclusivamente à instituição e aos responsáveis legais. O acesso é segmentado através de autenticação multifator e logs de auditoria imutáveis."
        },
        {
          q: "Como funciona a conformidade com a LGPD?",
          a: "O Áquila Pro possui um DPO dedicado e ferramentas integradas para gestão de consentimento, exclusão de dados e relatórios de impacto à proteção de dados (RIPD)."
        }
      ]
    },
    {
      category: "Implementação & Custos",
      questions: [
        {
          q: "Quanto tempo dura o deploy completo?",
          a: "Em média, uma escola de médio porte está operante em 10 dias úteis. Isso inclui configuração de rede, treinamento de staff e período de calibragem da IA."
        },
        {
          q: "Existe taxa de instalação?",
          a: "Depende do plano escolhido e da infraestrutura necessária. Geralmente oferecemos setup gratuito no plano Profissional e Enterprise para contratos anuais."
        }
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
              Knowledge Base and Support
            </div>
            <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-tight mb-8 bg-gradient-to-b from-white via-white to-white/70 bg-clip-text text-transparent italic">
              Central de <br /> Inteligência FAQ
            </h1>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto font-light leading-relaxed">
              Tudo o que você precisa saber sobre a segurança, implementação e tecnologia por trás do Áquila Pro.
            </p>
          </div>
        </section>

        {/* FAQ Content Section */}
        <section className="py-20 px-4 relative">
          <div className="container max-w-5xl mx-auto">
            <div className="space-y-24">
              {faqs.map((section, sidx) => (
                <div key={sidx} className="animate-in fade-in slide-in-from-bottom-5">
                  <div className="flex items-center gap-4 mb-10">
                     <div className="h-px flex-1 bg-gradient-to-r from-transparent to-white/10"></div>
                     <h2 className="text-sm font-black uppercase tracking-[0.3em] text-blue-500 italic">
                       {section.category}
                     </h2>
                     <div className="h-px flex-1 bg-gradient-to-l from-transparent to-white/10"></div>
                  </div>

                  <div className="grid gap-4">
                    {section.questions.map((faq, qidx) => {
                      const globalIndex = sidx * 100 + qidx;
                      const isOpen = openIndex === globalIndex;

                      return (
                        <div
                          key={qidx}
                          className={`glass-card p-8 rounded-[2rem] cursor-pointer transition-all duration-500 border-white/5 ${
                            isOpen ? "bg-white/10 border-blue-500/30 ring-1 ring-blue-500/20" : "hover:border-white/20"
                          }`}
                          onClick={() => setOpenIndex(isOpen ? null : globalIndex)}
                        >
                          <div className="flex items-start justify-between gap-6">
                            <h3 className="text-xl font-bold text-gray-200 tracking-tight flex-1">
                              {faq.q}
                            </h3>
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center bg-white/5 transition-transform duration-500 ${isOpen ? "rotate-180 bg-blue-600" : ""}`}>
                               <ChevronDown size={20} className={isOpen ? "text-white" : "text-gray-500"} />
                            </div>
                          </div>
                          
                          <div className={`overflow-hidden transition-all duration-700 ease-[cubic-bezier(0.4,0,0.2,1)] ${isOpen ? "max-h-[500px] opacity-100 mt-8" : "max-h-0 opacity-0"}`}>
                             <div className="pt-8 border-t border-white/5">
                                <p className="text-gray-400 font-light leading-relaxed text-lg italic">
                                  {faq.a}
                                </p>
                             </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Contact/Support Footer */}
        <section className="py-32 px-4 relative">
           <div className="container max-w-6xl mx-auto">
              <div className="grid md:grid-cols-3 gap-8">
                 <div className="glass-card p-10 rounded-[3rem] text-center hover:border-blue-500/30 transition-all">
                    <Mail size={32} className="text-blue-500 mx-auto mb-6" />
                    <h4 className="font-black uppercase tracking-widest text-xs mb-4">Email Principal</h4>
                    <p className="text-gray-400 font-light mb-6">Suporte técnico especializado 24/7.</p>
                    <a href={`mailto:${config.adminEmail}`} className="text-blue-400 font-bold hover:underline">{config.adminEmail}</a>
                 </div>

                 <div className="glass-card p-10 rounded-[3rem] text-center hover:border-blue-500/30 transition-all">
                    <Phone size={32} className="text-blue-500 mx-auto mb-6" />
                    <h4 className="font-black uppercase tracking-widest text-xs mb-4">Telefone Direto</h4>
                    <p className="text-gray-400 font-light mb-6">Fale agora com um consultor técnico.</p>
                    <a href="tel:+5561999623099" className="text-blue-400 font-bold hover:underline">(61) 99962-3099</a>
                 </div>

                 <div className="glass-card p-10 rounded-[3rem] text-center hover:border-blue-500/30 transition-all">
                    <MessageCircle size={32} className="text-blue-500 mx-auto mb-6" />
                    <h4 className="font-black uppercase tracking-widest text-xs mb-4">WhatsApp Prioritário</h4>
                    <p className="text-gray-400 font-light mb-6">Tempo de resposta médio: 5 minutos.</p>
                    <a href="https://wa.me/5561999623099" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition-all">
                       Abrir WhatsApp <ExternalLink size={14} />
                    </a>
                 </div>
              </div>
           </div>
        </section>

        {/* Final CTA */}
        <section className="py-32 px-4 mb-20 text-center">
            <h2 className="text-3xl md:text-5xl font-black mb-8 italic">Ainda tem Dúvidas?</h2>
            <p className="text-xl text-gray-400 mb-12 max-w-2xl mx-auto font-light leading-relaxed">
              Nossa equipe está pronta para uma sessão de mentoria técnica para planejar o deploy ideal para sua escola.
            </p>
            <Button size="lg" className="px-12 py-8 rounded-2xl text-xl font-bold bg-white text-blue-600 shadow-xl shadow-white/10 animate-pulse hover:animate-none" onClick={() => window.location.href = '/contato'}>
              Agendar Consultoria Grátis
            </Button>
        </section>
      </main>

      <Footer />
    </div>
  );
}
