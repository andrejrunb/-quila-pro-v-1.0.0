import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Check, AlertCircle } from "lucide-react";

export default function Cameras() {
  const cameras = [
    {
      brand: "Hikvision",
      models: ["DS-2CD2143G0-I", "DS-2CD2T43G0-I5", "DS-2CD2T23WD-I5"],
      price: "R$ 400-800",
      status: "Testado ✓"
    },
    {
      brand: "Dahua",
      models: ["IPC-HDBW2431E", "IPC-HDBW2231E", "IPC-HDBW2433C"],
      price: "R$ 350-700",
      status: "Testado ✓"
    },
    {
      brand: "Intelbras",
      models: ["VIP 1130 B", "VIP 1220 B", "VIP 1320 B"],
      price: "R$ 300-600",
      status: "Testado ✓"
    },
    {
      brand: "Positivo",
      models: ["CFTV IP 720p", "CFTV IP 1080p", "CFTV IP 2MP"],
      price: "R$ 250-500",
      status: "Testado ✓"
    },
    {
      brand: "Axis Communications",
      models: ["M1044-W", "M1045-LW", "M1065-LW"],
      price: "R$ 1.200-2.000",
      status: "Testado ✓"
    },
    {
      brand: "Sony",
      models: ["SNC-CH110", "SNC-CH210", "SNC-CH220"],
      price: "R$ 1.500-2.500",
      status: "Testado ✓"
    },
    {
      brand: "Uniview",
      models: ["IPC322SR-DVS28", "IPC322SR-DVP28", "IPC322ER-DVS28"],
      price: "R$ 400-800",
      status: "Testado ✓"
    },
    {
      brand: "Vivotek",
      models: ["FD8134V", "FD8136H", "FD8138H"],
      price: "R$ 800-1.500",
      status: "Testado ✓"
    }
  ];

  const requirements = [
    {
      title: "Protocolo RTSP",
      description: "A câmera deve suportar o protocolo RTSP (Real Time Streaming Protocol) para streaming de vídeo."
    },
    {
      title: "Protocolo ONVIF",
      description: "Suporte a ONVIF (Open Network Video Interface Forum) para descoberta automática e configuração."
    },
    {
      title: "Resolução Mínima",
      description: "Resolução de pelo menos 720p (1280x720) para reconhecimento facial preciso."
    },
    {
      title: "Taxa de Quadros",
      description: "Mínimo de 15 FPS (frames por segundo) para processamento em tempo real."
    },
    {
      title: "Conexão de Rede",
      description: "Conexão Ethernet estável com largura de banda de pelo menos 2 Mbps por câmera."
    },
    {
      title: "Iluminação",
      description: "Funcionamento em ambientes com iluminação entre 50 e 10.000 lux para melhor desempenho."
    }
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      
      <main className="flex-1 pt-24">
        {/* Hero Section */}
        <section className="py-20 px-4 bg-gradient-to-br from-blue-50 to-white">
          <div className="container max-w-4xl mx-auto">
            <h1 className="text-5xl font-bold text-gray-900 mb-6">
              Câmeras Compatíveis
            </h1>
            <p className="text-xl text-gray-600 leading-relaxed">
              O Sistema Áquila Pro é compatível com câmeras IP de qualquer marca que suporte RTSP/ONVIF, incluindo modelos de baixo custo. Veja a lista de câmeras testadas e recomendadas.
            </p>
          </div>
        </section>

        {/* Compatibility Info */}
        <section className="py-16 px-4 bg-blue-50 border-b border-blue-200">
          <div className="container max-w-4xl mx-auto">
            <div className="bg-white p-8 rounded-lg border border-blue-200">
              <div className="flex items-start gap-4 mb-4">
                <AlertCircle className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Compatibilidade Universal
                  </h3>
                  <p className="text-gray-600">
                    Qualquer câmera IP que suporte os protocolos RTSP e ONVIF é compatível com o Sistema Áquila Pro. A lista abaixo contém modelos testados e recomendados, mas não é limitada a eles.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Cameras Grid */}
        <section className="py-20 px-4 bg-white">
          <div className="container max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-12">
              Câmeras Testadas e Recomendadas
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              {cameras.map((camera, idx) => (
                <Card key={idx} className="p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">
                        {camera.brand}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Faixa de preço: {camera.price}
                      </p>
                    </div>
                    <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-1">
                      <Check className="w-4 h-4" />
                      {camera.status}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-700 mb-2">
                      Modelos Compatíveis:
                    </p>
                    <ul className="space-y-1">
                      {camera.models.map((model, midx) => (
                        <li key={midx} className="text-sm text-gray-600">
                          • {model}
                        </li>
                      ))}
                    </ul>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Requirements */}
        <section className="py-20 px-4 bg-gray-50">
          <div className="container max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">
              Requisitos Técnicos
            </h2>
            <div className="grid md:grid-cols-2 gap-8">
              {requirements.map((req, idx) => (
                <div key={idx} className="bg-white p-6 rounded-lg border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    {req.title}
                  </h3>
                  <p className="text-gray-600">
                    {req.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Installation Guide */}
        <section className="py-20 px-4 bg-white">
          <div className="container max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">
              Guia de Instalação
            </h2>
            <div className="space-y-8">
              {[
                {
                  step: 1,
                  title: "Verificar Compatibilidade",
                  description: "Confirme que sua câmera suporta RTSP e ONVIF. Consulte o manual do fabricante ou entre em contato com nosso suporte."
                },
                {
                  step: 2,
                  title: "Conectar à Rede",
                  description: "Conecte a câmera à rede local com Ethernet. Configure um IP estático ou reserve um IP no DHCP."
                },
                {
                  step: 3,
                  title: "Configurar Credenciais",
                  description: "Acesse a interface web da câmera e configure o usuário/senha. Anote as credenciais para uso no Áquila."
                },
                {
                  step: 4,
                  title: "Adicionar no Áquila",
                  description: "No painel do Áquila, vá para Configurações > Câmeras e clique em 'Adicionar Câmera'. Insira o IP, porta, usuário e senha."
                },
                {
                  step: 5,
                  title: "Testar Conexão",
                  description: "Clique em 'Testar' para verificar se a câmera está conectada corretamente. Você deve ver o stream de vídeo."
                },
                {
                  step: 6,
                  title: "Posicionar e Calibrar",
                  description: "Posicione a câmera para capturar os rostos dos alunos. Calibre a altura e ângulo conforme necessário."
                }
              ].map((item) => (
                <div key={item.step} className="flex gap-6">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-lg">
                      {item.step}
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {item.title}
                    </h3>
                    <p className="text-gray-600">
                      {item.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Support */}
        <section className="py-20 px-4 bg-gray-50">
          <div className="container max-w-4xl mx-auto text-center space-y-6">
            <h2 className="text-3xl font-bold text-gray-900">
              Precisa de Ajuda?
            </h2>
            <p className="text-xl text-gray-600">
              Nosso suporte técnico está disponível para ajudar na instalação e configuração de câmeras.
            </p>
            <p className="text-gray-600">
              Entre em contato: <a href="mailto:suporte@aquila.pro" className="text-blue-600 font-semibold hover:underline">suporte@aquila.pro</a>
            </p>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
