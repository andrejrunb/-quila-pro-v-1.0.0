import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Award, Target, Heart } from "lucide-react";

export default function Sobre() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      
      <main className="flex-1 pt-24">
        {/* Hero Section */}
        <section className="py-20 px-4 bg-gradient-to-br from-blue-50 to-white">
          <div className="container max-w-4xl mx-auto">
            <h1 className="text-5xl font-bold text-gray-900 mb-6">
              Sobre o Áquila Pro
            </h1>
            <p className="text-xl text-gray-600 leading-relaxed">
              O Sistema Áquila Pro nasceu da visão de transformar a segurança e o engajamento nas instituições de ensino através da tecnologia de Inteligência Artificial e reconhecimento facial, tornando as escolas mais seguras, eficientes e focadas no desenvolvimento pedagógico dos alunos.
            </p>
          </div>
        </section>

        {/* Mission, Vision, Values */}
        <section className="py-20 px-4 bg-white">
          <div className="container max-w-6xl mx-auto">
            <div className="grid md:grid-cols-3 gap-12">
              <div className="space-y-4">
                <Target className="w-12 h-12 text-blue-600" />
                <h3 className="text-2xl font-bold text-gray-900">Missão</h3>
                <p className="text-gray-600 leading-relaxed">
                  Fornecer soluções de segurança e gestão escolar baseadas em IA que permitam às instituições de ensino proteger seus alunos, otimizar operações e gerar insights pedagógicos valiosos.
                </p>
              </div>

              <div className="space-y-4">
                <Award className="w-12 h-12 text-blue-600" />
                <h3 className="text-2xl font-bold text-gray-900">Visão</h3>
                <p className="text-gray-600 leading-relaxed">
                  Ser a plataforma líder de segurança e inteligência pedagógica em instituições de ensino, reconhecida por sua inovação, confiabilidade e impacto positivo na educação.
                </p>
              </div>

              <div className="space-y-4">
                <Heart className="w-12 h-12 text-blue-600" />
                <h3 className="text-2xl font-bold text-gray-900">Valores</h3>
                <p className="text-gray-600 leading-relaxed">
                  Segurança, Inovação, Transparência, Responsabilidade Social e Excelência. Acreditamos que a tecnologia deve servir ao bem comum, especialmente na educação.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Technology */}
        <section className="py-20 px-4 bg-gray-50">
          <div className="container max-w-4xl mx-auto">
            <h2 className="text-4xl font-bold text-gray-900 mb-12 text-center">
              Nossa Tecnologia
            </h2>
            <div className="space-y-8">
              <div>
                <h3 className="text-2xl font-semibold text-gray-900 mb-3">
                  Reconhecimento Facial com IA
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  Utilizamos algoritmos avançados de reconhecimento facial baseados em aprendizado de máquina para identificar alunos com alta precisão. Nossa tecnologia é treinada com dados diversificados para garantir equidade e precisão em diferentes grupos demográficos.
                </p>
              </div>

              <div>
                <h3 className="text-2xl font-semibold text-gray-900 mb-3">
                  Integração com Câmeras IP
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  Compatível com qualquer câmera IP que suporte protocolos RTSP/ONVIF, incluindo modelos de baixo custo. Isso permite que escolas de qualquer tamanho implementem a solução sem necessidade de infraestrutura cara.
                </p>
              </div>

              <div>
                <h3 className="text-2xl font-semibold text-gray-900 mb-3">
                  Análise de Dados em Tempo Real
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  Processamos dados de presença, localização e comportamento em tempo real, gerando alertas instantâneos e insights acionáveis para coordenadores e familiares.
                </p>
              </div>

              <div>
                <h3 className="text-2xl font-semibold text-gray-900 mb-3">
                  Segurança e Privacidade
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  Todos os dados são criptografados e armazenados em servidores seguros. Implementamos as melhores práticas de segurança de dados e conformidade com regulamentações de proteção de privacidade.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Why Choose Us */}
        <section className="py-20 px-4 bg-white">
          <div className="container max-w-4xl mx-auto">
            <h2 className="text-4xl font-bold text-gray-900 mb-12 text-center">
              Por que Escolher o Áquila Pro?
            </h2>
            <ul className="space-y-6">
              {[
                "Tecnologia de ponta com reconhecimento facial preciso e confiável",
                "Compatibilidade com câmeras de qualquer marca via RTSP/ONVIF",
                "Interface intuitiva e fácil de usar para coordenadores e familiares",
                "Suporte técnico especializado e treinamento completo",
                "Escalabilidade para escolas de qualquer tamanho",
                "Relatórios detalhados e insights pedagógicos acionáveis",
                "Alertas em tempo real para eventos críticos de segurança",
                "Conformidade com regulamentações de proteção de dados"
              ].map((item, idx) => (
                <li key={idx} className="flex items-start gap-4">
                  <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-white text-sm font-bold">✓</span>
                  </div>
                  <span className="text-gray-700 text-lg">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
