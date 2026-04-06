import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Shield, TrendingUp, Users, Zap, Eye, BarChart3, Lock, Brain, Network, Database, Mail, Phone } from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

export default function Home() {
  // The userAuth hooks provides authentication state
  // To implement login/logout functionality, simply call logout() or redirect to getLoginUrl()
  let { user, loading, error, isAuthenticated, logout } = useAuth();

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      
      {/* Hero Section - Fixed Layout */}
      <section className="pt-20 pb-16 px-4 bg-gradient-to-br from-blue-50 via-white to-blue-50">
        <div className="container max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div className="space-y-8 flex flex-col justify-center">
              <div className="space-y-4">
                <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight">
                  Transforme a Segurança e o Engajamento Escolar
                </h1>
                <p className="text-lg text-gray-600 leading-relaxed">
                  Com o Sistema Áquila, sua instituição de ensino alcança um novo patamar em segurança, gestão de presença e insights pedagógicos utilizando Inteligência Artificial e Reconhecimento Facial de ponta.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Button size="lg" className="w-full sm:w-auto" onClick={() => window.location.href = '/demo'}>
                  Ver Demonstração Interativa
                </Button>
                <Button size="lg" variant="outline" className="w-full sm:w-auto" onClick={() => window.location.href = '/contato'}>
                  Solicitar Contato
                </Button>
              </div>
            </div>
            <div className="flex justify-center">
              <img 
                src="https://d2xsxph8kpxj0f.cloudfront.net/108236306/dHESmq7FeuWLF4xGhiT9FT/school-modern-Mvjd45VNM8XCWac5XMGQyb.webp" 
                alt="Escola Moderna" 
                className="rounded-2xl shadow-lg w-full h-auto max-h-96 object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Technology Stack Section */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="container max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Tecnologia de Ponta
            </h2>
            <p className="text-xl text-gray-600">
              Arquitetura robusta baseada em Visão Computacional, Machine Learning e Segurança de Nível Empresarial
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8 mb-12">
            {[
              {
                icon: Brain,
                title: "Machine Learning",
                description: "Detecção de pessoas, rastreamento e reconhecimento facial com YOLO e OpenCV"
              },
              {
                icon: Network,
                title: "Arquitetura Distribuída",
                description: "Servidor local na escola + Cloud para escalabilidade e redundância"
              },
              {
                icon: Lock,
                title: "Segurança LGPD",
                description: "Criptografia end-to-end, logs de auditoria e conformidade regulatória"
              },
              {
                icon: Database,
                title: "Banco de Dados",
                description: "PostgreSQL com índices otimizados para consultas em tempo real"
              }
            ].map((tech, idx) => (
              <div key={idx} className="p-6 rounded-xl bg-white border border-gray-200 hover:border-blue-400 transition-colors">
                <tech.icon className="w-12 h-12 text-blue-600 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {tech.title}
                </h3>
                <p className="text-gray-600 text-sm">
                  {tech.description}
                </p>
              </div>
            ))}
          </div>

          <div className="text-center">
            <Button variant="outline" size="lg" onClick={() => window.location.href = '/arquitetura'}>
              Ver Arquitetura Completa
            </Button>
          </div>
        </div>
      </section>

      {/* Cameras & Monitoring Section */}
      <section className="py-20 px-4 bg-white">
        <div className="container max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="flex justify-center">
              <img 
                src="https://d2xsxph8kpxj0f.cloudfront.net/108236306/dHESmq7FeuWLF4xGhiT9FT/corridor-cameras-2oywWUncnR3bhHCdWswHo3.webp" 
                alt="Câmeras de Segurança" 
                className="rounded-2xl shadow-lg w-full h-auto max-h-96 object-cover"
              />
            </div>
            <div className="space-y-6">
              <h2 className="text-4xl font-bold text-gray-900">
                Sistema de Câmeras Inteligente
              </h2>
              <p className="text-lg text-gray-600 leading-relaxed">
                Integre câmeras IP de qualquer marca para monitoramento em tempo real. Nosso sistema detecta automaticamente pessoas, rastreia movimentos e gera alertas inteligentes para situações críticas.
              </p>
              <ul className="space-y-3">
                {[
                  "Compatibilidade com 8+ marcas de câmeras",
                  "Detecção de pessoas em tempo real",
                  "Rastreamento automático entre câmeras",
                  "Alertas de saídas não autorizadas"
                ].map((item, idx) => (
                  <li key={idx} className="flex items-center gap-3">
                    <Eye className="w-5 h-5 text-blue-600 flex-shrink-0" />
                    <span className="text-gray-700">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Real-time Tracking Section */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="container max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6 order-2 md:order-1">
              <h2 className="text-4xl font-bold text-gray-900">
                Rastreamento em Tempo Real
              </h2>
              <p className="text-lg text-gray-600 leading-relaxed">
                Dashboard inteligente que mostra a localização exata de cada aluno dentro da escola. Identifique padrões de comportamento, monitore frequência e receba alertas automáticos.
              </p>
              <ul className="space-y-3">
                {[
                  "Localização de alunos em tempo real",
                  "Análise de padrões de comportamento",
                  "Alertas de saídas da escola",
                  "Relatórios de frequência automáticos"
                ].map((item, idx) => (
                  <li key={idx} className="flex items-center gap-3">
                    <TrendingUp className="w-5 h-5 text-blue-600 flex-shrink-0" />
                    <span className="text-gray-700">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex justify-center order-1 md:order-2">
              <img 
                src="https://d2xsxph8kpxj0f.cloudfront.net/108236306/dHESmq7FeuWLF4xGhiT9FT/technology-tracking-XhkzP5ePpA6RbQXLeRrRXb.webp" 
                alt="Dashboard de Rastreamento" 
                className="rounded-2xl shadow-lg w-full h-auto max-h-96 object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Map Section */}
      <section className="py-20 px-4 bg-white">
        <div className="container max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="flex justify-center">
              <img 
                src="https://d2xsxph8kpxj0f.cloudfront.net/108236306/dHESmq7FeuWLF4xGhiT9FT/map-interactive-K8QJMSfLdZq2iHU4KAAxEm.webp" 
                alt="Mapa Interativo" 
                className="rounded-2xl shadow-lg w-full h-auto max-h-96 object-cover"
              />
            </div>
            <div className="space-y-6">
              <h2 className="text-4xl font-bold text-gray-900">
                Mapa Interativo da Escola
              </h2>
              <p className="text-lg text-gray-600 leading-relaxed">
                Visualize toda a escola em um mapa interativo com posicionamento de câmeras, localização de alunos e zonas de risco. Personalize as áreas críticas e receba alertas contextualizados.
              </p>
              <ul className="space-y-3">
                {[
                  "Mapa customizável da escola",
                  "Posicionamento de câmeras",
                  "Zonas de risco configuráveis",
                  "Alertas por localização"
                ].map((item, idx) => (
                  <li key={idx} className="flex items-center gap-3">
                    <Shield className="w-5 h-5 text-blue-600 flex-shrink-0" />
                    <span className="text-gray-700">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="container max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Por que escolher o Áquila?
            </h2>
            <p className="text-xl text-gray-600">
              Descubra os diferenciais que tornam o Áquila a solução ideal para sua escola
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Shield,
                title: "Segurança Aprimorada",
                description: "Identificação facial precisa para controle de acesso e alertas instantâneos sobre presenças não autorizadas."
              },
              {
                icon: TrendingUp,
                title: "Insights de Engajamento",
                description: "Análise de dados para identificar padrões de comportamento e apoiar intervenções pedagógicas."
              },
              {
                icon: Users,
                title: "Gestão de Presença Eficiente",
                description: "Automatize o registro de entrada e saída com relatórios detalhados de frequência."
              },
              {
                icon: Zap,
                title: "Alertas em Tempo Real",
                description: "Receba notificações imediatas sobre eventos críticos e aja rapidamente."
              },
              {
                icon: BarChart3,
                title: "Relatórios Avançados",
                description: "Gere análises detalhadas para apoiar decisões pedagógicas e administrativas."
              },
              {
                icon: Eye,
                title: "Compatibilidade Flexível",
                description: "Integre com câmeras IP de qualquer marca, incluindo modelos de baixo custo."
              }
            ].map((feature, idx) => (
              <div key={idx} className="p-6 rounded-xl bg-white hover:bg-blue-50 transition-colors border border-gray-200">
                <feature.icon className="w-12 h-12 text-blue-600 mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 px-4 bg-white">
        <div className="container max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Como Funciona
            </h2>
            <p className="text-xl text-gray-600">
              Fluxo de dados integrado e processamento em tempo real
            </p>
          </div>

          <div className="grid md:grid-cols-5 gap-4 mb-8">
            {[
              { step: 1, title: "Câmeras IP", desc: "Capturam vídeo via RTSP" },
              { step: 2, title: "Servidor Local", desc: "Processa frames e detecta pessoas" },
              { step: 3, title: "ML Pipeline", desc: "Identifica alunos e salas" },
              { step: 4, title: "API Segura", desc: "Transmite dados criptografados" },
              { step: 5, title: "Dashboard", desc: "Visualiza e alerta em tempo real" }
            ].map((item, idx) => (
              <div key={idx} className="text-center">
                <div className="bg-blue-600 text-white rounded-full w-12 h-12 flex items-center justify-center font-bold mx-auto mb-3">
                  {item.step}
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">{item.title}</h3>
                <p className="text-sm text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Portfolio & Alerts Section */}
      <section className="py-20 px-4 bg-white">
        <div className="container max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Portfólio Completo e Alertas Inteligentes
            </h2>
            <p className="text-xl text-gray-600">
              Acompanhe o desempenho de cada aluno com análise detalhada e alertas automáticos
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center mb-16">
            <div className="space-y-6">
              <h3 className="text-2xl font-bold text-gray-900">
                Análise Comportamental Cumulativa
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Cada aluno tem um portfólio completo que registra presença, atrasos, faltas, tempo em sala e fora de sala ao longo de todo o ano letivo.
              </p>
              <ul className="space-y-3">
                {[
                  "Métricas cumulativas por período",
                  "Comparativos com turma e escola",
                  "Alertas automáticos contextualizados",
                  "Relatórios para pais em PDF",
                  "Histórico completo de eventos",
                  "Análise de padrões de comportamento"
                ].map((item, idx) => (
                  <li key={idx} className="flex items-center gap-3">
                    <BarChart3 className="w-5 h-5 text-blue-600 flex-shrink-0" />
                    <span className="text-gray-700">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex justify-center">
              <img 
                src="https://d2xsxph8kpxj0f.cloudfront.net/108236306/dHESmq7FeuWLF4xGhiT9FT/aquila-coordinator-panel-2SYuKSwf5oiBg6wk4JiaZv.webp" 
                alt="Painel do Coordenador" 
                className="rounded-2xl shadow-lg w-full h-auto max-h-96 object-cover"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: "Detecção de Violência",
                description: "Sistema inteligente que detecta armas, facas e comportamentos agressivos em tempo real.",
                icon: Shield
              },
              {
                title: "Monitoramento de Intrusos",
                description: "Identifica pessoas não-autorizadas nos corredores e áreas restritas da escola.",
                icon: Eye
              },
              {
                title: "Alertas Críticos",
                description: "Notificações imediatas para coordenação sobre situações de segurança ou comportamento anormal.",
                icon: Zap
              }
            ].map((item, idx) => (
              <div key={idx} className="p-6 rounded-xl bg-gradient-to-br from-red-50 to-orange-50 border border-red-200">
                <item.icon className="w-12 h-12 text-red-600 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-600">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="container max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Entre em Contato
            </h2>
            <p className="text-xl text-gray-600">
              Tire suas dúvidas e agende uma demonstração personalizada
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-200">
              <div className="flex items-center gap-4 mb-4">
                <Mail className="w-8 h-8 text-blue-600" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Email</h3>
                  <a href="mailto:andrejrunb@yahoo.com.br" className="text-blue-600 hover:underline">
                    andrejrunb@yahoo.com.br
                  </a>
                </div>
              </div>
              <p className="text-gray-600">
                Envie suas dúvidas e receba uma resposta em até 24 horas.
              </p>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-200">
              <div className="flex items-center gap-4 mb-4">
                <Phone className="w-8 h-8 text-blue-600" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Telefone</h3>
                  <a href="tel:+5561999623099" className="text-blue-600 hover:underline">
                    +55 61 99962-3099
                  </a>
                </div>
              </div>
              <p className="text-gray-600">
                Ligue para agendar uma demonstração ou tirar dúvidas imediatas.
              </p>
            </div>
          </div>

          <div className="text-center mt-12">
            <Button size="lg" onClick={() => window.location.href = '/contato'}>
              Enviar Mensagem
            </Button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-blue-600 to-blue-800 text-white">
        <div className="container max-w-4xl mx-auto text-center space-y-8">
          <h2 className="text-4xl font-bold">
            Pronto para Elevar o Nível da sua Escola?
          </h2>
          <p className="text-xl text-blue-100">
            Agende uma demonstração personalizada e descubra como o Sistema Áquila pode atender às necessidades específicas da sua instituição.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" className="w-full sm:w-auto" onClick={() => window.location.href = '/contato'}>
              Agendar Demonstração
            </Button>
            <Button size="lg" variant="outline" className="w-full sm:w-auto text-white border-white hover:bg-white hover:text-blue-600" onClick={() => window.location.href = '/arquitetura'}>
              Ver Documentação Técnica
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
