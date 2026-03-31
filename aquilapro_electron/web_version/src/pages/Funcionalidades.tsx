import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { CheckCircle2, BarChart3, Users, AlertCircle, TrendingUp, ShieldAlert, Binary, Eye, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Funcionalidades() {
  const features = [
    {
      title: "Reconhecimento Neural V3",
      description: "Identificação ultrarrápida baseada em arquiteturas ResNet-50 com processamento em micro-latência.",
      icon: Binary,
      details: [
        "Precisão superior a 99.7% (V3 Core)",
        "Anti-spoofing biométrico ativo",
        "Processamento local (Edge AI)",
        "Reidentificação em múltiplos ângulos"
      ]
    },
    {
      title: "Fluxo de Presença Autônomo",
      description: "Elimine chamadas manuais. O sistema registra presença por evidência visual contínua.",
      icon: Activity,
      details: [
        "Check-in/out via face em 0.5s",
        "Heatmaps de permanência em sala",
        "Detecção de saídas não autorizadas",
        "Logs imutáveis protegidos por hash"
      ]
    },
    {
      title: "Detecção de Ameaças Críticas",
      description: "Segurança reativa e proativa com identificação de objetos perigosos e agressividade.",
      icon: ShieldAlert,
      details: [
        "Identificação de armas e objetos",
        "Alerta de comportamento agressivo",
        "Pessoas não autorizadas (Blacklist)",
        "Notificação imediata para COI"
      ]
    },
    {
      title: "Insights de Engajamento",
      description: "Transforme comportamento em dados pedagógicos para intervenções assertivas.",
      icon: TrendingUp,
      details: [
        "Score de atenção por aula",
        "Padrões de deserto escolar",
        "Análise de interação social",
        "Predição de evasão (AI Predict)"
      ]
    }
  ];

  const portfolioFeatures = [
    {
      icon: <BarChart3 className="w-8 h-8" />,
      title: "Métricas Cumulativas",
      description: "Visão macro do ano letivo com cruzamento de dados de presença e performance."
    },
    {
      icon: <AlertCircle className="w-8 h-8" />,
      title: "Alertas Inteligentes",
      description: "Engine de regras personalizada para cada perfil de aluno e necessidade escolar."
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: "Deep Profiling",
      description: "Histórico completo com evidências visuais de toda a jornada do aluno na escola."
    },
    {
      icon: <Eye className="w-8 h-8" />,
      title: "Live Monitoring",
      description: "Interface de 'War Room' para coordenação com visão total em tempo real."
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
        <section className="py-20 px-4 relative z-10">
          <div className="container max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs font-bold text-blue-400 uppercase tracking-widest mb-8">
              Advanced Feature Set V3
            </div>
            <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-tight mb-8 bg-gradient-to-b from-white via-white to-white/70 bg-clip-text text-transparent italic">
              Tecnologia que <br /> Antecipa o Futuro
            </h1>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto font-light leading-relaxed">
              Do reconhecimento facial à detecção proativa de ameaças, o Áquila Pro oferece o ecossistema mais robusto de segurança escolar do mercado.
            </p>
          </div>
        </section>

        {/* Features Grid */}
        <section className="py-20 px-4 relative">
          <div className="container max-w-6xl mx-auto">
            <div className="grid md:grid-cols-2 gap-8">
              {features.map((feature, idx) => (
                <div key={idx} className="glass-card p-12 rounded-[3.5rem] border-white/5 hover:border-blue-500/30 transition-all group">
                  <div className="w-16 h-16 rounded-[1.5rem] bg-blue-600/10 border border-blue-500/20 flex items-center justify-center mb-8 group-hover:bg-blue-600 transition-all duration-500">
                     <feature.icon size={32} className="text-blue-500 group-hover:text-white" />
                  </div>
                  <h3 className="text-3xl font-black italic tracking-tighter uppercase mb-4 group-hover:text-blue-400 transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-gray-400 mb-8 font-light leading-relaxed">
                    {feature.description}
                  </p>
                  <div className="grid grid-cols-1 gap-4">
                    {feature.details.map((detail, didx) => (
                      <div key={didx} className="flex items-center gap-3 text-sm text-gray-300 font-light px-4 py-3 bg-white/5 rounded-xl border border-white/5">
                        <CheckCircle2 size={16} className="text-blue-500" />
                        {detail}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Intelligence Banner */}
        <section className="py-32 px-4 relative bg-blue-600/5 border-y border-white/5">
           <div className="container max-w-6xl mx-auto">
              <div className="text-center mb-20">
                <h2 className="text-4xl md:text-5xl font-black mb-6 italic">Visão 360 do Ecossistema</h2>
                <p className="text-gray-400 max-w-xl mx-auto font-light">Gestão baseada em evidências, não em suposições.</p>
              </div>
              <div className="grid md:grid-cols-4 gap-8">
                {portfolioFeatures.map((item, i) => (
                  <div key={i} className="text-center group">
                     <div className="text-blue-500 mb-6 flex justify-center group-hover:scale-110 transition-transform">{item.icon}</div>
                     <h4 className="text-lg font-bold mb-3 italic">{item.title}</h4>
                     <p className="text-gray-500 text-sm font-light leading-relaxed">{item.description}</p>
                  </div>
                ))}
              </div>
           </div>
        </section>

        {/* UI Showcase / Portfolio */}
        <section className="py-32 px-4 relative">
          <div className="container max-w-6xl mx-auto">
             <div className="grid md:grid-cols-2 gap-12">
                {[
                  {
                    title: "Live Edge Analytics",
                    desc: "Detecção multi-ponto com identificação instantânea de cada indivíduo no frame.",
                    img: "https://d2xsxph8kpxj0f.cloudfront.net/108236306/dHESmq7FeuWLF4xGhiT9FT/aquila-student-entry-detection-Q5qsA7Fw7zwS7E6dQYzz6M.webp"
                  },
                  {
                    title: "War Room Dashboard",
                    desc: "Visão em tempo real da distribuição de alunos e alertas críticos por setor.",
                    img: "https://d2xsxph8kpxj0f.cloudfront.net/108236306/dHESmq7FeuWLF4xGhiT9FT/aquila-coordinator-panel-2SYuKSwf5oiBg6wk4JiaZv.webp"
                  }
                ].map((item, i) => (
                  <div key={i} className="group cursor-pointer">
                     <div className="relative overflow-hidden rounded-[3rem] border border-white/10 aspect-video mb-8">
                        <img src={item.img} alt={item.title} className="w-full h-full object-cover grayscale opacity-50 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-700 hover:scale-105" />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#030712] to-transparent opacity-60"></div>
                        <div className="absolute bottom-10 left-10 p-2 rounded-full bg-blue-600/20 border border-blue-500/30 backdrop-blur-md">
                           <Eye size={20} className="text-white" />
                        </div>
                     </div>
                     <h3 className="text-2xl font-black italic mb-2 uppercase tracking-tighter group-hover:text-blue-400 transition-colors">{item.title}</h3>
                     <p className="text-gray-400 font-light">{item.desc}</p>
                  </div>
                ))}
             </div>
          </div>
        </section>

        {/* Technical Footer */}
        <section className="py-32 px-4">
           <div className="container max-w-4xl mx-auto border-t border-white/5 pt-20">
              <div className="grid md:grid-cols-2 gap-16">
                 <div>
                    <h4 className="text-[10px] font-black uppercase text-blue-500 tracking-[0.3em] mb-8 italic">Performance AI</h4>
                    <ul className="space-y-4">
                       {[
                         "Motor de inferência de 12 GFLOPS",
                         "Latência média de identificação: 480ms",
                         "Cluster de sincronização assíncrova",
                         "Criptografia AES-256 no armazenamento local"
                       ].map((t, i) => (
                         <li key={i} className="flex gap-4 items-center text-gray-400 font-light">
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-600"></div> {t}
                         </li>
                       ))}
                    </ul>
                 </div>
                 <div className="flex flex-col justify-center items-center md:items-end">
                    <p className="text-gray-400 mb-8 font-light italic text-center md:text-right max-w-sm">Pronto para elevar o nível da sua instituição com o estado da arte em IA?</p>
                    <Button size="lg" className="px-12 py-8 rounded-2xl text-xl font-bold bg-white text-blue-600 hover:scale-105" onClick={() => window.location.href = '/precos'}>
                       Solicitar Demo V3
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
