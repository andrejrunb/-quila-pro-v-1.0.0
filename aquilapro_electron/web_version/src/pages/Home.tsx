import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { 
  Shield, 
  TrendingUp, 
  Users, 
  Zap, 
  Eye, 
  BarChart3, 
  Lock, 
  Brain, 
  Network, 
  Database, 
  Mail, 
  Phone,
  ArrowRight,
  ShieldCheck,
  ScanFace,
  MessageSquare,
  Smartphone,
  CheckCircle2,
  Calendar
} from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

export default function Home() {
  let { user, loading, error, isAuthenticated, logout } = useAuth();

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-[#030712] text-white font-sans">
      {/* Background Elements */}
      <div className="bg-blobs">
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
      </div>

      <Navigation />
      
      {/* HERO SECTION */}
      <section id="hero" className="relative min-h-[90vh] flex items-center justify-center pt-32 pb-20 px-4">
        <div className="container max-w-6xl mx-auto text-center z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs font-bold text-blue-400 uppercase tracking-widest mb-8 animate-fade-in">
            <ShieldCheck size={14} />
            Certificação Enterprise V3 Ativa
          </div>
          
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tight leading-[0.9] mb-8 bg-gradient-to-b from-white via-white to-white/70 bg-clip-text text-transparent italic">
            Inteligência que <br /> Protege o Amanhã
          </h1>
          
          <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-10 font-light">
            O ecossistema definitivo de segurança escolar com reconhecimento facial em tempo real, 
            engajamento biometrizado e automação 100% brasileira.
          </p>
          
          <div className="flex flex-wrap gap-4 justify-center mb-16">
            <Button 
              size="lg" 
              className="px-8 py-7 rounded-2xl text-lg font-bold bg-gradient-to-r from-blue-600 to-violet-600 hover:scale-105 transition-transform shadow-[0_10px_40px_rgba(37,99,235,0.3)]"
              onClick={() => window.location.href = '/vendas'}
            >
              Consultar V3 Sales
              <ArrowRight className="ml-2" />
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="px-8 py-7 rounded-2xl text-lg font-bold border-white/10 bg-white/5 backdrop-blur-md hover:bg-white/10 transition-colors"
              onClick={() => window.location.href = '/demo'}
            >
              Demonstração ao Vivo
            </Button>
          </div>

          {/* Hero Visual Component */}
          <div className="relative w-full max-w-5xl mx-auto aspect-[16/9] rounded-[3rem] border border-white/10 overflow-hidden shadow-2xl group">
            <div className="absolute inset-0 bg-gradient-to-t from-[#030712] via-transparent to-transparent z-10"></div>
            <img 
              src="/assets/hero_bg.png" 
              alt="Áquila Pro V3 Interface" 
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000"
            />
            
            {/* Stats Overlay */}
            <div className="absolute bottom-10 left-0 right-0 z-20 flex justify-center gap-8 md:gap-16 flex-wrap px-4">
               <div className="text-center">
                  <div className="text-3xl md:text-4xl font-black text-white">99.8%</div>
                  <div className="text-[10px] md:text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Precisão Facial</div>
               </div>
               <div className="text-center">
                  <div className="text-3xl md:text-4xl font-black text-white">&lt; 0.2s</div>
                  <div className="text-[10px] md:text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Latência Edge</div>
               </div>
               <div className="text-center">
                  <div className="text-3xl md:text-4xl font-black text-white">2.5k+</div>
                  <div className="text-[10px] md:text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Escolas Ativas</div>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES SECTION */}
      <section id="features" className="py-32 px-4 relative">
        <div className="container max-w-6xl mx-auto">
          <div className="text-center mb-20">
            <div className="inline-block px-4 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-bold text-emerald-400 uppercase tracking-widest mb-4">
              Inovação V3
            </div>
            <h2 className="text-4xl md:text-6xl font-black mb-6">Engine de Segurança Proativa</h2>
            <p className="text-lg text-gray-400 max-w-xl mx-auto">
              Desenvolvido para coordenadores que não aceitam menos que o estado da arte.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: ScanFace,
                title: "Visão Computacional",
                description: "Motor de inferência local (Edge Computing) que identifica alunos mesmo com oclusões, óculos ou iluminação adversa."
              },
              {
                icon: MessageSquare,
                title: "WhatsApp Omni",
                description: "Despacho inteligente de notificações para os pais com fila prioritária e confirmação de leitura em tempo real."
              },
              {
                icon: Lock,
                title: "Fortaleza LGPD",
                description: "Anonimização automática de terceiros no feed de vídeo e criptografia AES-256 para todos os vetores biométricos."
              },
              {
                icon: TrendingUp,
                title: "Análise Preditiva",
                description: "O Machine Learning do Áquila identifica padrões de evasão e sugere intervenções antes que o aluno abandone o curso."
              },
              {
                icon: Smartphone,
                title: "App Full Experience",
                description: "Timeline de presença biometrizada e alerta de chegada (Drive-thru) para os pais direto no smartphone."
              },
              {
                icon: Database,
                title: "Relatórios Enterprise",
                description: "Geração de PDFs corporativos e planilhas Excel automatizadas com métricas de saúde financeira e frequência."
              }
            ].map((feature, idx) => (
              <div key={idx} className="glass-card p-10 rounded-[2.5rem] hover:-translate-y-2 transition-all duration-300">
                <div className="w-14 h-14 rounded-2xl bg-blue-600/10 flex items-center justify-center text-blue-500 mb-6 border border-blue-500/20">
                  <feature.icon size={28} />
                </div>
                <h3 className="text-xl font-bold mb-4">{feature.title}</h3>
                <p className="text-gray-400 leading-relaxed text-sm font-light">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING SECTION */}
      <section id="pricing" className="py-32 px-4">
        <div className="container max-w-6xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-6xl font-black mb-6">Planos Transparentes</h2>
            <p className="text-lg text-gray-400 max-w-xl mx-auto">
              Escolha o nível de proteção ideal para o tamanho da sua instituição.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
            {/* Essencial */}
            <div className="glass-card p-10 rounded-[3rem] flex flex-col hover:border-white/20 transition-colors">
              <div className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-2">Essencial</div>
              <div className="text-5xl font-black mb-10">R$1.990<span className="text-sm font-normal text-gray-500">/mês</span></div>
              <ul className="space-y-4 mb-10 flex-grow">
                <li className="flex items-center gap-3 text-sm text-gray-400"><CheckCircle2 size={16} className="text-blue-500" /> 500 Alunos Registrados</li>
                <li className="flex items-center gap-3 text-sm text-gray-400"><CheckCircle2 size={16} className="text-blue-500" /> 2 Entradas de Câmeras Edge</li>
                <li className="flex items-center gap-3 text-sm text-gray-400"><CheckCircle2 size={16} className="text-blue-500" /> Reconhecimento Facial V3</li>
                <li className="flex items-center gap-3 text-sm text-gray-400"><CheckCircle2 size={16} className="text-blue-500" /> Gestão de Presença Básica</li>
                <li className="flex items-center gap-3 text-sm text-gray-400"><CheckCircle2 size={16} className="text-blue-500" /> Suporte Standard</li>
              </ul>
              <Button onClick={() => window.location.href = '/checkout?plan=essencial'} variant="outline" className="w-full py-6 rounded-2xl font-bold border-white/10 hover:bg-white/5">Assinar Agora</Button>
            </div>

            {/* Pro */}
            <div className="glass-card p-10 rounded-[3rem] border-blue-600/50 bg-gradient-to-br from-blue-600/10 to-violet-600/10 flex flex-col relative scale-105 z-10 shadow-[0_30px_60px_-15px_rgba(37,99,235,0.2)]">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-blue-600 text-[10px] font-black uppercase tracking-widest whitespace-nowrap">MAIS POPULAR</div>
              <div className="text-sm font-bold text-blue-400 uppercase tracking-widest mb-2">Profissional</div>
              <div className="text-5xl font-black mb-10">R$4.990<span className="text-sm font-normal text-gray-500">/mês</span></div>
              <ul className="space-y-4 mb-10 flex-grow">
                <li className="flex items-center gap-3 text-sm text-white font-medium"><CheckCircle2 size={16} className="text-blue-400" /> 1.500 Alunos Registrados</li>
                <li className="flex items-center gap-3 text-sm text-white font-medium"><CheckCircle2 size={16} className="text-blue-400" /> 12 Entradas de Câmeras Edge</li>
                <li className="flex items-center gap-3 text-sm text-white font-medium"><CheckCircle2 size={16} className="text-blue-400" /> IA Preditiva de Evasão</li>
                <li className="flex items-center gap-3 text-sm text-white font-medium"><CheckCircle2 size={16} className="text-blue-400" /> WhatsApp Ultra Prioritário</li>
                <li className="flex items-center gap-3 text-sm text-white font-medium"><CheckCircle2 size={16} className="text-blue-400" /> Portal Full Experience</li>
                <li className="flex items-center gap-3 text-sm text-white font-medium"><CheckCircle2 size={16} className="text-blue-400" /> Suporte Prioritário 24/7</li>
              </ul>
              <Button onClick={() => window.location.href = '/checkout?plan=profissional'} className="w-full py-6 rounded-2xl font-bold bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-600/30">Assinar V3 Pro</Button>
            </div>

            {/* Enterprise */}
            <div className="glass-card p-10 rounded-[3rem] flex flex-col hover:border-white/20 transition-colors">
              <div className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-2">Enterprise</div>
              <div className="text-5xl font-black mb-10">Custom</div>
              <ul className="space-y-4 mb-10 flex-grow">
                <li className="flex items-center gap-3 text-sm text-gray-400"><CheckCircle2 size={16} className="text-blue-500" /> Unidades Multi-Escola</li>
                <li className="flex items-center gap-3 text-sm text-gray-400"><CheckCircle2 size={16} className="text-blue-500" /> White-Label Completo</li>
                <li className="flex items-center gap-3 text-sm text-gray-400"><CheckCircle2 size={16} className="text-blue-500" /> API para ERPs Externos</li>
                <li className="flex items-center gap-3 text-sm text-gray-400"><CheckCircle2 size={16} className="text-blue-500" /> On-Premise / Hybrid</li>
                <li className="flex items-center gap-3 text-sm text-gray-400"><CheckCircle2 size={16} className="text-blue-500" /> Gerente de Sucesso</li>
              </ul>
              <Button onClick={() => window.location.href = '/contato'} variant="outline" className="w-full py-6 rounded-2xl font-bold border-white/10 hover:bg-white/5">Falar com Consultor</Button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA SECTION */}
      <section className="py-20 px-4">
        <div className="container max-w-5xl mx-auto rounded-[4rem] p-12 md:p-24 text-center overflow-hidden relative border border-white/10 bg-gradient-to-br from-blue-600/20 to-violet-600/20 backdrop-blur-3xl shadow-2xl">
          <div className="relative z-10">
            <h2 className="text-4xl md:text-6xl font-black mb-8 italic">Preparado para transformar sua escola?</h2>
            <p className="text-lg md:text-xl text-gray-400 max-w-xl mx-auto mb-12">
              Agende uma demonstração ao vivo com nossos especialistas em IA.
            </p>
            <Button size="lg" className="px-10 py-8 rounded-2xl text-xl font-bold bg-white text-blue-600 hover:scale-105 transition-transform">
              Solicitar Demo Grátis
              <Calendar className="ml-2" />
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
