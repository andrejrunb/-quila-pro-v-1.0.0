import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Check, AlertCircle, Video, ShieldCheck, Zap, Globe } from "lucide-react";
import { config } from "../../server/_core/config";

export default function Cameras() {
  const cameras = [
    {
      brand: "Hikvision",
      models: ["DS-2CD2143G0-I", "DS-2CD2T43G0-I5", "DS-2CD2T23WD-I5"],
      price: "R$ 400-800",
      status: "Verificado V3"
    },
    {
      brand: "Dahua",
      models: ["IPC-HDBW2431E", "IPC-HDBW2231E", "IPC-HDBW2433C"],
      price: "R$ 350-700",
      status: "Verificado V3"
    },
    {
      brand: "Intelbras",
      models: ["VIP 1130 B", "VIP 1220 B", "VIP 1320 B"],
      price: "R$ 300-600",
      status: "Verificado V3"
    },
    {
      brand: "Axis Communications",
      models: ["M1044-W", "M1045-LW", "M1065-LW"],
      price: "R$ 1.200-2.000",
      status: "Hi-End Logic"
    }
  ];

  const requirements = [
    {
      title: "Protocolo RTSP / ONVIF",
      description: "Padrão universal para streaming e descoberta automática de dispositivos IP.",
      icon: Globe
    },
    {
      title: "Resolução Ultra HD",
      description: "Mínimo de 1080p (Full HD) recomendado para máxima precisão neural.",
      icon: Video
    },
    {
      title: "Low Latency Stream",
      description: "Conexão de rede Gigabit para garantir resposta em milissegundos.",
      icon: Zap
    },
    {
      title: "Night Vision Pro",
      description: "Infravermelho ativo para segurança 24h em ambientes críticos.",
      icon: ShieldCheck
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
              Hardware Compatibility List
            </div>
            <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-tight mb-8 bg-gradient-to-b from-white via-white to-white/70 bg-clip-text text-transparent italic">
              Visão Digital <br /> Sem Restrições
            </h1>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto font-light leading-relaxed">
              O Áquila Pro é agnóstico. Integramos qualquer câmera IP que suporte RTSP/ONVIF, garantindo economia e aproveitamento de sua infraestrutura atual.
            </p>
          </div>
        </section>

        {/* Compatibility Highlight */}
        <section className="py-12 px-4 relative">
          <div className="container max-w-5xl mx-auto">
            <div className="glass-card p-10 rounded-[3rem] border-blue-500/20 bg-blue-600/5 flex flex-col md:flex-row items-center gap-8 text-center md:text-left">
              <div className="w-20 h-20 rounded-3xl bg-blue-600 flex items-center justify-center shadow-xl shadow-blue-600/30">
                 <ShieldCheck size={40} />
              </div>
              <div>
                 <h2 className="text-2xl font-black italic mb-2 uppercase tracking-tighter">Compatibilidade Universal V3</h2>
                 <p className="text-gray-400 font-light max-w-2xl">
                    Utilizamos um core de processamento baseado em frames brutos que aceita fluxos de vídeo de praticamente qualquer fabricante global. Se tem IP, tem Áquila.
                 </p>
              </div>
            </div>
          </div>
        </section>

        {/* Cameras Grid */}
        <section className="py-20 px-4 relative">
          <div className="container max-w-6xl mx-auto">
            <h2 className="text-3xl font-black mb-12 italic">Câmeras Flagship Testadas</h2>
            <div className="grid md:grid-cols-2 gap-8">
              {cameras.map((camera, idx) => (
                <div key={idx} className="glass-card p-10 rounded-[2.5rem] border-white/5 hover:border-blue-500/30 transition-all group">
                  <div className="flex items-start justify-between mb-8">
                    <div>
                      <h3 className="text-3xl font-black italic tracking-tighter uppercase group-hover:text-blue-400 transition-colors">
                        {camera.brand}
                      </h3>
                      <p className="text-xs font-bold text-gray-500 mt-2 uppercase tracking-widest">
                        Estimativa: {camera.price}
                      </p>
                    </div>
                    <span className="bg-blue-600/20 text-blue-400 border border-blue-500/30 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                      <Check size={12} strokeWidth={3} />
                      {camera.status}
                    </span>
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-gray-400 mb-4 uppercase tracking-widest">Modelos Recomendados:</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {camera.models.map((model, midx) => (
                        <div key={midx} className="flex items-center gap-3 text-sm text-gray-300 font-light bg-white/5 p-3 rounded-xl border border-white/5">
                          <Video size={14} className="text-blue-500" />
                          {model}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Requirements Grid */}
        <section className="py-24 px-4 relative">
          <div className="container max-w-6xl mx-auto">
            <div className="text-center mb-20">
               <h2 className="text-4xl md:text-5xl font-black mb-6 italic">Protocolos Obrigatórios</h2>
               <p className="text-gray-400 max-w-xl mx-auto font-light">Garanta a máxima performance do sistema seguindo nossos padrões de conectividade.</p>
            </div>
            
            <div className="grid md:grid-cols-4 gap-8">
               {requirements.map((req, i) => (
                 <div key={i} className="text-center group p-8">
                    <div className="w-16 h-16 rounded-[1.5rem] bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-8 group-hover:bg-blue-600 group-hover:border-blue-400 transition-all duration-500">
                       <req.icon size={28} className="text-blue-500 group-hover:text-white transition-colors" />
                    </div>
                    <h4 className="text-lg font-black mb-4 uppercase tracking-tighter italic">{req.title}</h4>
                    <p className="text-gray-400 text-sm font-light leading-relaxed">{req.description}</p>
                 </div>
               ))}
            </div>
          </div>
        </section>

        {/* Installation Steps */}
        <section className="py-32 px-4 relative bg-white/5 border-y border-white/5">
          <div className="container max-w-5xl mx-auto">
            <h2 className="text-4xl font-black mb-20 italic text-center">Fast-Track Deployment</h2>
            <div className="grid md:grid-cols-2 gap-x-20 gap-y-16 relative">
               <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-blue-500/20 to-transparent"></div>
               
               {[
                 { step: "01", title: "Audit de Rede", desc: "Confirme se sua câmera possui IP estático e se as portas 554 (RTSP) ou 8000 (ONVIF) estão acessíveis." },
                 { step: "02", title: "Configuração de Stream", desc: "Ajuste o bitrate para CBR (Constant Bit Rate) para evitar oscilações na análise de IA." },
                 { step: "03", title: "V3 Portal Connect", desc: "Acesse o painel do Áquila e insira a string de conexão. Nossa IA fará o resto automaticamente." },
                 { step: "04", title: "Calibragem Neural", desc: "Ajuste o ângulo para que o rosto dos alunos ocupe pelo menos 15% da área do frame." }
               ].map((item, i) => (
                 <div key={i} className={`flex gap-8 items-start ${i % 2 === 1 ? 'md:pt-12' : ''}`}>
                    <span className="text-5xl font-black italic text-blue-600/20">{item.step}</span>
                    <div>
                       <h4 className="text-xl font-bold mb-3">{item.title}</h4>
                       <p className="text-gray-400 font-light leading-relaxed">{item.desc}</p>
                    </div>
                 </div>
               ))}
            </div>
          </div>
        </section>

        {/* Support Section */}
        <section className="py-32 px-4 mb-20 text-center">
            <h2 className="text-3xl md:text-5xl font-black mb-8 italic">Suas Câmeras Não Estão na Lista?</h2>
            <p className="text-xl text-gray-400 mb-12 max-w-2xl mx-auto font-light leading-relaxed">
              Não se preocupe. Nossa equipe de hardware pode realizar um teste de compatibilidade remoto em menos de 10 minutos.
            </p>
            <div className="glass-card max-w-xl mx-auto p-10 rounded-[2.5rem] border-white/10">
               <p className="text-gray-400 mb-6 font-light">Envie o modelo do seu equipamento para:</p>
               <a href={`mailto:${config.adminEmail}`} className="text-3xl font-black italic text-blue-500 hover:text-blue-400 transition-colors uppercase tracking-tighter">
                 {config.adminEmail}
               </a>
            </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
