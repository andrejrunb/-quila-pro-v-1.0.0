import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle, AlertCircle, Users, Clock, Shield } from "lucide-react";

export default function Implantacao() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      
      <main className="flex-1 pt-24">
        {/* Hero Section */}
        <section className="py-20 px-4 bg-gradient-to-br from-green-50 to-white">
          <div className="container max-w-4xl mx-auto">
            <h1 className="text-5xl font-bold text-gray-900 mb-6">
              Implantação do Áquila Pro
            </h1>
            <p className="text-xl text-gray-600 leading-relaxed">
              Processo estruturado e suportado para implementar o Sistema Áquila Pro na sua instituição de ensino.
            </p>
          </div>
        </section>

        {/* Implementation Process */}
        <section className="py-20 px-4 bg-white">
          <div className="container max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-12">
              Processo de Implantação
            </h2>

            <Tabs defaultValue="planejamento" className="w-full">
              <TabsList className="grid w-full grid-cols-4 mb-8">
                <TabsTrigger value="planejamento">Planejamento</TabsTrigger>
                <TabsTrigger value="preparacao">Preparação</TabsTrigger>
                <TabsTrigger value="implantacao">Implantação</TabsTrigger>
                <TabsTrigger value="acompanhamento">Acompanhamento</TabsTrigger>
              </TabsList>

              <TabsContent value="planejamento" className="space-y-6">
                <Card className="p-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-6">
                    Fase 1: Planejamento
                  </h3>

                  <div className="space-y-6">
                    <div className="border-l-4 border-blue-600 pl-6">
                      <h4 className="text-lg font-semibold text-gray-900 mb-2">
                        Avaliação de Necessidades
                      </h4>
                      <p className="text-gray-600 mb-3">
                        Nossa equipe realiza diagnóstico completo da instituição para entender objetivos e desafios específicos.
                      </p>
                      <ul className="text-gray-600 space-y-1 text-sm">
                        <li>✓ Reunião com gestão e coordenação</li>
                        <li>✓ Análise da infraestrutura existente</li>
                        <li>✓ Identificação de necessidades pedagógicas</li>
                        <li>✓ Definição de KPIs e métricas de sucesso</li>
                      </ul>
                    </div>

                    <div className="border-l-4 border-green-600 pl-6">
                      <h4 className="text-lg font-semibold text-gray-900 mb-2">
                        Planejamento de Projeto
                      </h4>
                      <p className="text-gray-600 mb-3">
                        Criamos cronograma detalhado e plano de implementação customizado.
                      </p>
                      <ul className="text-gray-600 space-y-1 text-sm">
                        <li>✓ Cronograma com marcos principais</li>
                        <li>✓ Alocação de recursos</li>
                        <li>✓ Identificação de riscos</li>
                        <li>✓ Plano de comunicação</li>
                      </ul>
                    </div>

                    <div className="border-l-4 border-purple-600 pl-6">
                      <h4 className="text-lg font-semibold text-gray-900 mb-2">
                        Conformidade Legal
                      </h4>
                      <p className="text-gray-600 mb-3">
                        Garantimos conformidade com todas as leis e regulamentações aplicáveis.
                      </p>
                      <ul className="text-gray-600 space-y-1 text-sm">
                        <li>✓ Revisão de políticas de privacidade</li>
                        <li>✓ Preparação de termos de consentimento</li>
                        <li>✓ Conformidade com LGPD e ECA</li>
                        <li>✓ Documentação de aprovações</li>
                      </ul>
                    </div>
                  </div>
                </Card>
              </TabsContent>

              <TabsContent value="preparacao" className="space-y-6">
                <Card className="p-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-6">
                    Fase 2: Preparação
                  </h3>

                  <div className="space-y-6">
                    <div className="border-l-4 border-blue-600 pl-6">
                      <h4 className="text-lg font-semibold text-gray-900 mb-2">
                        Preparação de Infraestrutura
                      </h4>
                      <p className="text-gray-600 mb-3">
                        Verificamos e preparamos a infraestrutura da escola para receber o sistema.
                      </p>
                      <ul className="text-gray-600 space-y-1 text-sm">
                        <li>✓ Avaliação de conectividade e rede</li>
                        <li>✓ Verificação de espaço físico</li>
                        <li>✓ Testes de compatibilidade</li>
                        <li>✓ Planejamento de cabeamento</li>
                      </ul>
                    </div>

                    <div className="border-l-4 border-green-600 pl-6">
                      <h4 className="text-lg font-semibold text-gray-900 mb-2">
                        Treinamento Preliminar
                      </h4>
                      <p className="text-gray-600 mb-3">
                        Preparamos a equipe técnica da escola para gerenciar o sistema.
                      </p>
                      <ul className="text-gray-600 space-y-1 text-sm">
                        <li>✓ Treinamento técnico para TI</li>
                        <li>✓ Preparação de administradores</li>
                        <li>✓ Documentação de procedimentos</li>
                        <li>✓ Criação de plano de suporte</li>
                      </ul>
                    </div>

                    <div className="border-l-4 border-purple-600 pl-6">
                      <h4 className="text-lg font-semibold text-gray-900 mb-2">
                        Comunicação com Comunidade
                      </h4>
                      <p className="text-gray-600 mb-3">
                        Informamos alunos, pais e comunidade sobre a implementação.
                      </p>
                      <ul className="text-gray-600 space-y-1 text-sm">
                        <li>✓ Comunicados para pais</li>
                        <li>✓ Sessões informativas</li>
                        <li>✓ Resposta a dúvidas</li>
                        <li>✓ Coleta de consentimentos</li>
                      </ul>
                    </div>
                  </div>
                </Card>
              </TabsContent>

              <TabsContent value="implantacao" className="space-y-6">
                <Card className="p-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-6">
                    Fase 3: Implantação
                  </h3>

                  <div className="space-y-6">
                    <div className="border-l-4 border-blue-600 pl-6">
                      <h4 className="text-lg font-semibold text-gray-900 mb-2">
                        Instalação do Sistema
                      </h4>
                      <p className="text-gray-600 mb-3">
                        Instalamos e configuramos todos os componentes do Áquila Pro.
                      </p>
                      <ul className="text-gray-600 space-y-1 text-sm">
                        <li>✓ Instalação de equipamentos</li>
                        <li>✓ Configuração de rede</li>
                        <li>✓ Setup de banco de dados</li>
                        <li>✓ Testes de funcionamento</li>
                      </ul>
                    </div>

                    <div className="border-l-4 border-green-600 pl-6">
                      <h4 className="text-lg font-semibold text-gray-900 mb-2">
                        Migração de Dados
                      </h4>
                      <p className="text-gray-600 mb-3">
                        Importamos dados de alunos e estrutura da escola de sistemas existentes.
                      </p>
                      <ul className="text-gray-600 space-y-1 text-sm">
                        <li>✓ Extração de dados legados</li>
                        <li>✓ Validação de dados</li>
                        <li>✓ Importação segura</li>
                        <li>✓ Verificação de integridade</li>
                      </ul>
                    </div>

                    <div className="border-l-4 border-purple-600 pl-6">
                      <h4 className="text-lg font-semibold text-gray-900 mb-2">
                        Testes e Validação
                      </h4>
                      <p className="text-gray-600 mb-3">
                        Realizamos testes abrangentes para garantir funcionamento correto.
                      </p>
                      <ul className="text-gray-600 space-y-1 text-sm">
                        <li>✓ Testes de funcionalidade</li>
                        <li>✓ Testes de segurança</li>
                        <li>✓ Testes de performance</li>
                        <li>✓ Testes de integração</li>
                      </ul>
                    </div>
                  </div>
                </Card>
              </TabsContent>

              <TabsContent value="acompanhamento" className="space-y-6">
                <Card className="p-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-6">
                    Fase 4: Acompanhamento
                  </h3>

                  <div className="space-y-6">
                    <div className="border-l-4 border-blue-600 pl-6">
                      <h4 className="text-lg font-semibold text-gray-900 mb-2">
                        Treinamento de Usuários
                      </h4>
                      <p className="text-gray-600 mb-3">
                        Capacitamos coordenadores, diretores e professores para usar o sistema.
                      </p>
                      <ul className="text-gray-600 space-y-1 text-sm">
                        <li>✓ Treinamento para coordenadores</li>
                        <li>✓ Treinamento para diretores</li>
                        <li>✓ Materiais de suporte</li>
                        <li>✓ Sessões de dúvidas</li>
                      </ul>
                    </div>

                    <div className="border-l-4 border-green-600 pl-6">
                      <h4 className="text-lg font-semibold text-gray-900 mb-2">
                        Suporte Técnico
                      </h4>
                      <p className="text-gray-600 mb-3">
                        Oferecemos suporte contínuo durante e após a implantação.
                      </p>
                      <ul className="text-gray-600 space-y-1 text-sm">
                        <li>✓ Suporte 24/7 nos primeiros 30 dias</li>
                        <li>✓ Resolução de problemas</li>
                        <li>✓ Otimizações de performance</li>
                        <li>✓ Atualizações de segurança</li>
                      </ul>
                    </div>

                    <div className="border-l-4 border-purple-600 pl-6">
                      <h4 className="text-lg font-semibold text-gray-900 mb-2">
                        Monitoramento e Otimização
                      </h4>
                      <p className="text-gray-600 mb-3">
                        Monitoramos o sistema e fazemos ajustes conforme necessário.
                      </p>
                      <ul className="text-gray-600 space-y-1 text-sm">
                        <li>✓ Monitoramento de performance</li>
                        <li>✓ Análise de uso</li>
                        <li>✓ Ajustes de configuração</li>
                        <li>✓ Relatórios de progresso</li>
                      </ul>
                    </div>
                  </div>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </section>

        {/* Timeline */}
        <section className="py-20 px-4 bg-gray-50">
          <div className="container max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-12">
              Cronograma Típico
            </h2>

            <div className="grid md:grid-cols-4 gap-6">
              <Card className="p-6">
                <Clock className="w-8 h-8 text-blue-600 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Semana 1-2
                </h3>
                <p className="text-gray-600 text-sm">
                  Planejamento, avaliação e preparação de infraestrutura.
                </p>
              </Card>

              <Card className="p-6">
                <AlertCircle className="w-8 h-8 text-green-600 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Semana 3-4
                </h3>
                <p className="text-gray-600 text-sm">
                  Instalação, configuração e migração de dados.
                </p>
              </Card>

              <Card className="p-6">
                <CheckCircle className="w-8 h-8 text-purple-600 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Semana 5-6
                </h3>
                <p className="text-gray-600 text-sm">
                  Testes, validação e treinamento de usuários.
                </p>
              </Card>

              <Card className="p-6">
                <Users className="w-8 h-8 text-orange-600 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Semana 7+
                </h3>
                <p className="text-gray-600 text-sm">
                  Suporte contínuo e otimizações.
                </p>
              </Card>
            </div>
          </div>
        </section>

        {/* Support */}
        <section className="py-20 px-4 bg-white">
          <div className="container max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-12">
              Suporte Contínuo
            </h2>

            <div className="grid md:grid-cols-3 gap-8">
              <Card className="p-6">
                <Shield className="w-8 h-8 text-blue-600 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Suporte Técnico
                </h3>
                <p className="text-gray-600 text-sm">
                  Equipe dedicada disponível para resolver problemas técnicos e otimizar o sistema.
                </p>
              </Card>

              <Card className="p-6">
                <Users className="w-8 h-8 text-green-600 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Treinamento Contínuo
                </h3>
                <p className="text-gray-600 text-sm">
                  Atualizações de treinamento e novos recursos conforme o sistema evolui.
                </p>
              </Card>

              <Card className="p-6">
                <CheckCircle className="w-8 h-8 text-purple-600 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Atualizações de Segurança
                </h3>
                <p className="text-gray-600 text-sm">
                  Patches de segurança e atualizações de funcionalidades inclusos no plano.
                </p>
              </Card>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 px-4 bg-gray-50">
          <div className="container max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">
              Pronto para implementar o Áquila Pro?
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              Entre em contato com nossa equipe para discutir o cronograma e processo de implantação.
            </p>
            <a href="/contato" className="inline-block px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
              Solicitar Implantação
            </a>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
