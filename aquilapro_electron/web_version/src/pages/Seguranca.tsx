import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Shield, Lock, AlertCircle, CheckCircle, FileText, Users, EyeOff, Search } from "lucide-react";
import { config } from "../../server/_core/config";

export default function Seguranca() {
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
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/10 border border-red-500/20 text-xs font-bold text-red-400 uppercase tracking-widest mb-8">
              Protocolo de Segurança V3
            </div>
            <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-tight mb-8 bg-gradient-to-b from-white via-white to-white/70 bg-clip-text text-transparent italic text-center">
              Privacidade por <br /> Arquitetura
            </h1>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto font-light leading-relaxed text-center">
              O Áquila Pro não apenas cumpre a LGPD; nós elevamos o padrão de proteção biométrica escolar com criptografia militar e processamento descentralizado.
            </p>
          </div>
        </section>

        {/* Security Pillars */}
        <section className="py-20 px-4 relative">
          <div className="container max-w-6xl mx-auto">
            <div className="grid md:grid-cols-3 gap-8">
              <div className="glass-card p-10 rounded-[3rem] border-red-500/20 bg-red-600/5 group hover:bg-red-600/10 transition-all">
                <Lock className="w-12 h-12 text-red-500 mb-8 group-hover:scale-110 transition-transform" />
                <h3 className="text-2xl font-black italic uppercase tracking-tighter mb-4">Criptografia L3</h3>
                <ul className="text-gray-400 space-y-4 text-sm font-light">
                  <li className="flex gap-2 items-center"><CheckCircle size={14} className="text-red-500" /> TLS 1.3 Strict Mode</li>
                  <li className="flex gap-2 items-center"><CheckCircle size={14} className="text-red-500" /> AES-256 em Repouso</li>
                  <li className="flex gap-2 items-center"><CheckCircle size={14} className="text-red-500" /> Chaves RSA de 4096 bits</li>
                  <li className="flex gap-2 items-center"><CheckCircle size={14} className="text-red-500" /> Zero-Knowledge Proofs</li>
                </ul>
              </div>

              <div className="glass-card p-10 rounded-[3rem] border-blue-500/20 bg-blue-600/5 group hover:bg-blue-600/10 transition-all">
                <Shield className="w-12 h-12 text-blue-500 mb-8 group-hover:scale-110 transition-transform" />
                <h3 className="text-2xl font-black italic uppercase tracking-tighter mb-4">Acesso Blindado</h3>
                <ul className="text-gray-400 space-y-4 text-sm font-light">
                  <li className="flex gap-2 items-center"><CheckCircle size={14} className="text-blue-500" /> MFA Biométrico Nativo</li>
                  <li className="flex gap-2 items-center"><CheckCircle size={14} className="text-blue-500" /> RBAC Granular (V3)</li>
                  <li className="flex gap-2 items-center"><CheckCircle size={14} className="text-blue-500" /> IP Whitelisting</li>
                  <li className="flex gap-2 items-center"><CheckCircle size={14} className="text-blue-500" /> Revogação Instantânea</li>
                </ul>
              </div>

              <div className="glass-card p-10 rounded-[3rem] border-purple-500/20 bg-purple-600/5 group hover:bg-purple-600/10 transition-all">
                <FileText className="w-12 h-12 text-purple-500 mb-8 group-hover:scale-110 transition-transform" />
                <h3 className="text-2xl font-black italic uppercase tracking-tighter mb-4">Auditoria Real</h3>
                <ul className="text-gray-400 space-y-4 text-sm font-light">
                  <li className="flex gap-2 items-center"><CheckCircle size={14} className="text-purple-500" /> Logs Imutáveis</li>
                  <li className="flex gap-2 items-center"><CheckCircle size={14} className="text-purple-500" /> Rastreamento de IA</li>
                  <li className="flex gap-2 items-center"><CheckCircle size={14} className="text-purple-500" /> Retenção Segura V3</li>
                  <li className="flex gap-2 items-center"><CheckCircle size={14} className="text-purple-500" /> Exportação Legal Compliance</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* LGPD Compliance Section */}
        <section className="py-32 px-4 relative bg-white/5 border-y border-white/5">
          <div className="container max-w-6xl mx-auto">
             <div className="text-center mb-24">
                <h2 className="text-4xl md:text-6xl font-black mb-6 italic uppercase tracking-tighter">Conformidade Radical</h2>
                <p className="text-gray-400 max-w-xl mx-auto font-light leading-relaxed">Implementamos cada diretriz da LGPD no nível do código, não apenas no papel.</p>
             </div>
             
             <div className="grid md:grid-cols-2 gap-12">
                {[
                  { icon: EyeOff, title: "Coleta Minimalista", desc: "Coletamos apenas o vetor biométrico necessário para a identificação. As imagens originais são descartadas imediatamente após o processamento local." },
                  { icon: CheckCircle, title: "Gestão de Consentimento", desc: "Engine nativa para coleta e gestão de autorizações digitais, com revogação instantânea e exclusão garantida." },
                  { icon: Search, title: "Transparência Total", desc: "Relatórios de impacto (RIPD) gerados automaticamente para auditorias internas e externas a qualquer momento." },
                  { icon: FileText, title: "Escalonamento Legal", desc: "Apoio jurídico especializado para a adequação do regimento interno da escola ao uso de IA." }
                ].map((item, i) => (
                  <div key={i} className="flex gap-8 items-start p-8 rounded-[2.5rem] bg-white/5 border border-white/10 hover:border-blue-500/30 transition-all">
                     <div className="text-blue-500 mt-2"><item.icon size={28} /></div>
                     <div>
                        <h4 className="text-xl font-bold mb-3 italic tracking-tight">{item.title}</h4>
                        <p className="text-gray-400 font-light text-sm leading-relaxed">{item.desc}</p>
                     </div>
                  </div>
                ))}
             </div>
          </div>
        </section>

        {/* DPO & Contact */}
        <section className="py-32 px-4 mb-20">
          <div className="container max-w-4xl mx-auto rounded-[4rem] p-12 md:p-24 text-center glass-card border-white/10 relative overflow-hidden">
             <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-600 via-blue-600 to-purple-600"></div>
             <Users size={48} className="text-blue-500 mx-auto mb-8" />
             <h3 className="text-3xl font-black italic mb-6">Governança Centralizada</h3>
             <p className="text-gray-400 font-light mb-12 text-lg">
               Nosso Data Protection Officer (DPO) está disponível para responder dúvidas técnicas e legais de pais, diretores e órgãos reguladores.
             </p>
             <div className="space-y-4">
                <p className="text-xs font-black uppercase text-gray-500 tracking-widest">Canal Direto de Privacidade:</p>
                <a href={`mailto:${config.adminEmail}`} className="text-3xl font-black italic text-blue-500 hover:text-blue-400 transition-colors">
                   {config.adminEmail}
                </a>
             </div>
          </div>
        </section>

        {/* Certifications Map */}
        <section className="py-20 px-4">
           <div className="container max-w-6xl mx-auto text-center">
              <h4 className="text-[10px] font-black uppercase text-gray-600 tracking-[0.4em] mb-12">Global Security Standards</h4>
              <div className="flex flex-wrap justify-center gap-12 opacity-40 grayscale group hover:grayscale-0 hover:opacity-100 transition-all duration-700">
                 {['LGPD Ready', 'ISO 27001', 'SOC 2 Type II', 'AES-256 Military', 'SSL V3 High', 'GDPR Compliant'].map((c, i) => (
                   <div key={i} className="text-sm font-black italic tracking-tighter uppercase border-b border-white/20 pb-2">{c}</div>
                 ))}
              </div>
           </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
