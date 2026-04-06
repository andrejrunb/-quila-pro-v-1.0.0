import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { CheckCircle2, BarChart3, Users, AlertCircle, TrendingUp } from "lucide-react";

export default function Funcionalidades() {
  const features = [
    {
      title: "Reconhecimento Facial Avançado",
      description: "Identificação precisa de alunos utilizando algoritmos de aprendizado de máquina baseados em LBPH (Local Binary Patterns Histograms) com planejamento de upgrade para ResNet.",
      details: [
        "Precisão acima de 95% em condições normais de iluminação",
        "Suporte para múltiplos ângulos de câmera",
        "Processamento em tempo real",
        "Treinamento contínuo com novos dados"
      ]
    },
    {
      title: "Gestão de Presença em Tempo Real",
      description: "Registro automático de entrada, saída e movimentação dos alunos dentro da escola.",
      details: [
        "Entrada/Saída automática com timestamp",
        "Rastreamento de localização por sala",
        "Tempo em sala de aula",
        "Tempo fora da sala",
        "Registro de visitas ao banheiro",
        "Alertas de saída não autorizada"
      ]
    },
    {
      title: "Portfólio Completo do Aluno",
      description: "Análise comportamental detalhada com histórico cumulativo ao longo do ano letivo.",
      details: [
        "Métricas cumulativas de presença",
        "Histórico de atrasos com datas e horários",
        "Registro de faltas justificadas/injustificadas",
        "Tempo em sala vs. fora de sala",
        "Comparativos com turma e escola",
        "Alertas automáticos contextualizados"
      ]
    },
    {
      title: "Análise de Desempenho e Engajamento",
      description: "Identificação de padrões comportamentais e geração de insights para apoiar decisões pedagógicas.",
      details: [
        "Detecção de faltas frequentes",
        "Identificação de saídas anormais",
        "Score de engajamento por aluno",
        "Análise de padrões de comportamento",
        "Relatórios de tendências",
        "Comparação com médias da turma"
      ]
    },
    {
      title: "Detecção de Violência e Armas",
      description: "Sistema inteligente de segurança que detecta objetos perigosos e comportamentos agressivos.",
      details: [
        "Detecção de armas em tempo real",
        "Identificação de facas e objetos cortantes",
        "Análise de comportamento agressivo",
        "Diferenciação entre brincadeira e violência",
        "Alertas críticos imediatos",
        "Registro de eventos de segurança"
      ]
    },
    {
      title: "Monitoramento de Pessoas Não-Autorizadas",
      description: "Identificação de pessoas estranhas nos corredores e áreas restritas da escola.",
      details: [
        "Detecção de pessoas desconhecidas",
        "Alertas de aglomeração suspeita",
        "Monitoramento de corredores",
        "Rastreamento de movimento",
        "Notificações para coordenação",
        "Histórico de incidentes"
      ]
    }
  ];

  const portfolioFeatures = [
    {
      icon: <BarChart3 className="w-8 h-8" />,
      title: "Métricas Cumulativas",
      description: "Acompanhe presença, atrasos, faltas e tempo fora de sala ao longo de todo o ano letivo com gráficos e estatísticas."
    },
    {
      icon: <AlertCircle className="w-8 h-8" />,
      title: "Alertas Automáticos",
      description: "Receba notificações quando alunos ultrapassam limites de atrasos, faltas ou tempo fora de sala."
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: "Comparativos",
      description: "Compare o desempenho do aluno com a média da turma e da escola para contexto completo."
    },
    {
      icon: <TrendingUp className="w-8 h-8" />,
      title: "Relatórios para Pais",
      description: "Gere relatórios visuais e amigáveis para compartilhar com responsáveis sobre o comportamento do aluno."
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
              Funcionalidades Avançadas
            </h1>
            <p className="text-xl text-gray-600 leading-relaxed">
              Descubra todas as capacidades do Sistema Áquila Pro, desenvolvidas com base em pesquisas científicas e melhores práticas em segurança escolar.
            </p>
          </div>
        </section>

        {/* Features Grid */}
        <section className="py-20 px-4 bg-white">
          <div className="container max-w-6xl mx-auto">
            <div className="grid md:grid-cols-2 gap-8">
              {features.map((feature, idx) => (
                <Card key={idx} className="p-8 hover:shadow-lg transition-shadow">
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 mb-6">
                    {feature.description}
                  </p>
                  <ul className="space-y-3">
                    {feature.details.map((detail, didx) => (
                      <li key={didx} className="flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-700">{detail}</span>
                      </li>
                    ))}
                  </ul>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Portfolio Section */}
        <section className="py-20 px-4 bg-gradient-to-br from-blue-50 to-indigo-50">
          <div className="container max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                Portfólio Completo do Aluno
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Análise comportamental detalhada que permite coordenadores e pais acompanharem o desempenho e engajamento do aluno ao longo de todo o ano letivo.
              </p>
            </div>

            {/* Portfolio Features */}
            <div className="grid md:grid-cols-2 gap-8 mb-16">
              {portfolioFeatures.map((feature, idx) => (
                <div key={idx} className="bg-white p-8 rounded-lg shadow-md hover:shadow-lg transition-shadow">
                  <div className="text-blue-600 mb-4">{feature.icon}</div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </div>
              ))}
            </div>

            {/* Portfolio Images */}
            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="font-bold text-gray-900 mb-4">Detecção de Aluno</h3>
                <img 
                  src="https://d2xsxph8kpxj0f.cloudfront.net/108236306/dHESmq7FeuWLF4xGhiT9FT/aquila-student-entry-detection-Q5qsA7Fw7zwS7E6dQYzz6M.webp"
                  alt="Detecção de entrada do aluno"
                  className="w-full h-64 object-cover rounded-lg"
                />
                <p className="text-sm text-gray-600 mt-3">Reconhecimento facial automático na entrada da sala com registro de horário e presença.</p>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="font-bold text-gray-900 mb-4">Dashboard de Presença</h3>
                <img 
                  src="https://d2xsxph8kpxj0f.cloudfront.net/108236306/dHESmq7FeuWLF4xGhiT9FT/aquila-attendance-dashboard-aWYKxhRmpdQJPTFCSzo5rS.webp"
                  alt="Dashboard de presença"
                  className="w-full h-64 object-cover rounded-lg"
                />
                <p className="text-sm text-gray-600 mt-3">Visualização em tempo real de presença, atrasos e ausências por turma.</p>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="font-bold text-gray-900 mb-4">Reconhecimento Multi-Estudante</h3>
                <img 
                  src="https://d2xsxph8kpxj0f.cloudfront.net/108236306/dHESmq7FeuWLF4xGhiT9FT/aquila-multi-student-detection-LzgipnDaiMofLfbtBeGWac.webp"
                  alt="Reconhecimento de múltiplos estudantes"
                  className="w-full h-64 object-cover rounded-lg"
                />
                <p className="text-sm text-gray-600 mt-3">Sistema rastreando múltiplos alunos simultaneamente nos corredores.</p>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="font-bold text-gray-900 mb-4">Painel do Coordenador</h3>
                <img 
                  src="https://d2xsxph8kpxj0f.cloudfront.net/108236306/dHESmq7FeuWLF4xGhiT9FT/aquila-coordinator-panel-2SYuKSwf5oiBg6wk4JiaZv.webp"
                  alt="Painel do coordenador"
                  className="w-full h-64 object-cover rounded-lg"
                />
                <p className="text-sm text-gray-600 mt-3">Dashboard em tempo real com mapa da escola mostrando localização dos alunos.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Research Foundation */}
        <section className="py-20 px-4 bg-gray-50">
          <div className="container max-w-4xl mx-auto">
            <h2 className="text-4xl font-bold text-gray-900 mb-12 text-center">
              Fundamentação Científica
            </h2>
            <div className="space-y-8">
              <div className="bg-white p-8 rounded-lg border border-gray-200">
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  Reconhecimento Facial e Segurança Escolar
                </h3>
                <p className="text-gray-600 mb-4">
                  Nossa solução é baseada em pesquisas consolidadas sobre reconhecimento facial e sua aplicação em ambientes educacionais. Utilizamos algoritmos validados cientificamente para garantir precisão e confiabilidade.
                </p>
                <p className="text-sm text-gray-500">
                  Referências: Estudos sobre Local Binary Patterns (LBP) e Deep Learning em visão computacional
                </p>
              </div>

              <div className="bg-white p-8 rounded-lg border border-gray-200">
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  Análise Comportamental e Engajamento
                </h3>
                <p className="text-gray-600 mb-4">
                  Aplicamos metodologias de análise de dados comportamentais para identificar padrões que indicam desengajamento ou problemas de frequência, permitindo intervenções pedagógicas mais efetivas.
                </p>
                <p className="text-sm text-gray-500">
                  Referências: Pesquisas em análise de comportamento estudantil e Machine Learning em educação
                </p>
              </div>

              <div className="bg-white p-8 rounded-lg border border-gray-200">
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  Privacidade e Conformidade
                </h3>
                <p className="text-gray-600 mb-4">
                  Implementamos as melhores práticas em proteção de dados e privacidade, garantindo conformidade com regulamentações como LGPD (Lei Geral de Proteção de Dados Pessoais).
                </p>
                <p className="text-sm text-gray-500">
                  Referências: LGPD, GDPR e melhores práticas em segurança de dados
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Specifications */}
        <section className="py-20 px-4 bg-white">
          <div className="container max-w-4xl mx-auto">
            <h2 className="text-4xl font-bold text-gray-900 mb-12 text-center">
              Especificações Técnicas
            </h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Capacidade</h3>
                <ul className="space-y-3 text-gray-600">
                  <li>• Até 500 alunos por instituição</li>
                  <li>• Até 20 salas de aula</li>
                  <li>• Cadastro ilimitado de usuários</li>
                  <li>• Múltiplas câmeras por sala</li>
                  <li>• Processamento em tempo real</li>
                </ul>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Requisitos de Sistema</h3>
                <ul className="space-y-3 text-gray-600">
                  <li>• Câmeras IP com suporte RTSP/ONVIF</li>
                  <li>• Conexão de internet estável</li>
                  <li>• Servidor com 4GB RAM mínimo</li>
                  <li>• Armazenamento de 100GB recomendado</li>
                  <li>• Navegador moderno para acesso web</li>
                </ul>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
