import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Database, Server, Shield, Network, Lock, CheckCircle } from "lucide-react";

export default function Arquitetura() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      
      <main className="flex-1 pt-24">
        {/* Hero Section */}
        <section className="py-20 px-4 bg-gradient-to-br from-blue-50 to-white">
          <div className="container max-w-4xl mx-auto">
            <h1 className="text-5xl font-bold text-gray-900 mb-6">
              Arquitetura do Sistema
            </h1>
            <p className="text-xl text-gray-600 leading-relaxed">
              O Áquila Pro foi desenvolvido com arquitetura robusta, escalável e segura para proteger dados de alunos e garantir performance em tempo real.
            </p>
          </div>
        </section>

        {/* Architecture Overview */}
        <section className="py-20 px-4 bg-white">
          <div className="container max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-12">
              Visão Geral da Arquitetura
            </h2>

            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-8">
                <TabsTrigger value="overview">Visão Geral</TabsTrigger>
                <TabsTrigger value="seguranca">Segurança</TabsTrigger>
                <TabsTrigger value="performance">Performance</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                <Card className="p-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-6">
                    Arquitetura Distribuída
                  </h3>
                  
                  <div className="space-y-8">
                    <div className="border-l-4 border-blue-600 pl-6">
                      <h4 className="text-xl font-semibold text-gray-900 mb-2">
                        Coleta de Dados
                      </h4>
                      <p className="text-gray-600 mb-4">
                        Equipamentos de captura instalados na escola processam informações em tempo real de forma segura e privada.
                      </p>
                      <ul className="space-y-2 text-gray-600">
                        <li>✓ Processamento local para privacidade</li>
                        <li>✓ Criptografia de dados em trânsito</li>
                        <li>✓ Sincronização segura com servidores</li>
                        <li>✓ Cache local para continuidade</li>
                      </ul>
                    </div>

                    <div className="border-l-4 border-green-600 pl-6">
                      <h4 className="text-xl font-semibold text-gray-900 mb-2">
                        Processamento e Análise
                      </h4>
                      <p className="text-gray-600 mb-4">
                        Servidores em nuvem processam dados coletados e geram insights pedagógicos e de segurança.
                      </p>
                      <ul className="space-y-2 text-gray-600">
                        <li>✓ Análise com Inteligência Artificial</li>
                        <li>✓ Geração de alertas contextualizados</li>
                        <li>✓ Relatórios automáticos</li>
                        <li>✓ Escalabilidade horizontal</li>
                      </ul>
                    </div>

                    <div className="border-l-4 border-purple-600 pl-6">
                      <h4 className="text-xl font-semibold text-gray-900 mb-2">
                        Interface e Acesso
                      </h4>
                      <p className="text-gray-600 mb-4">
                        Painel web responsivo para coordenadores, diretores e pais acessarem informações relevantes.
                      </p>
                      <ul className="space-y-2 text-gray-600">
                        <li>✓ Dashboard em tempo real</li>
                        <li>✓ Controle de acesso por papel</li>
                        <li>✓ Notificações instantâneas</li>
                        <li>✓ Compatível com todos os dispositivos</li>
                      </ul>
                    </div>
                  </div>
                </Card>
              </TabsContent>

              <TabsContent value="seguranca" className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <Card className="p-6">
                    <Lock className="w-8 h-8 text-blue-600 mb-4" />
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">
                      Proteção de Dados
                    </h4>
                    <ul className="text-gray-600 space-y-2 text-sm">
                      <li>✓ Criptografia end-to-end</li>
                      <li>✓ Conformidade com LGPD</li>
                      <li>✓ Backup automático e redundância</li>
                      <li>✓ Isolamento de dados por escola</li>
                      <li>✓ Auditoria completa de acessos</li>
                      <li>✓ Política de retenção automática</li>
                    </ul>
                  </Card>

                  <Card className="p-6">
                    <Shield className="w-8 h-8 text-green-600 mb-4" />
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">
                      Autenticação e Autorização
                    </h4>
                    <ul className="text-gray-600 space-y-2 text-sm">
                      <li>✓ Autenticação segura com tokens</li>
                      <li>✓ Controle de acesso granular</li>
                      <li>✓ Suporte a SSO (Single Sign-On)</li>
                      <li>✓ Autenticação multifator disponível</li>
                      <li>✓ Sessões seguras com timeout</li>
                      <li>✓ Proteção contra ataques comuns</li>
                    </ul>
                  </Card>

                  <Card className="p-6">
                    <Network className="w-8 h-8 text-purple-600 mb-4" />
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">
                      Comunicação Segura
                    </h4>
                    <ul className="text-gray-600 space-y-2 text-sm">
                      <li>✓ HTTPS obrigatório</li>
                      <li>✓ Certificados SSL/TLS válidos</li>
                      <li>✓ Rate limiting e DDoS protection</li>
                      <li>✓ Validação de entrada rigorosa</li>
                      <li>✓ Proteção contra CSRF e XSS</li>
                      <li>✓ Monitoramento de segurança 24/7</li>
                    </ul>
                  </Card>

                  <Card className="p-6">
                    <CheckCircle className="w-8 h-8 text-orange-600 mb-4" />
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">
                      Conformidade
                    </h4>
                    <ul className="text-gray-600 space-y-2 text-sm">
                      <li>✓ LGPD (Lei Geral de Proteção de Dados)</li>
                      <li>✓ COPPA (Children's Online Privacy)</li>
                      <li>✓ ECA (Estatuto da Criança e Adolescente)</li>
                      <li>✓ Auditorias de segurança regulares</li>
                      <li>✓ Certificações de segurança</li>
                      <li>✓ Transparência de dados</li>
                    </ul>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="performance" className="space-y-6">
                <Card className="p-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-6">
                    Otimização e Escalabilidade
                  </h3>

                  <div className="space-y-8">
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-3">
                        Performance em Tempo Real
                      </h4>
                      <p className="text-gray-600 mb-4">
                        O Áquila Pro foi otimizado para processar dados de múltiplas câmeras simultaneamente sem latência perceptível.
                      </p>
                      <ul className="text-gray-600 space-y-2">
                        <li>✓ Processamento distribuído para escalabilidade</li>
                        <li>✓ Cache inteligente de dados frequentes</li>
                        <li>✓ Otimização de consultas ao banco de dados</li>
                        <li>✓ Compressão de dados em trânsito</li>
                        <li>✓ Latência típica: &lt; 100ms</li>
                      </ul>
                    </div>

                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-3">
                        Escalabilidade Horizontal
                      </h4>
                      <p className="text-gray-600 mb-4">
                        Arquitetura preparada para crescer com a instituição sem perda de performance.
                      </p>
                      <ul className="text-gray-600 space-y-2">
                        <li>✓ Suporta múltiplas escolas simultaneamente</li>
                        <li>✓ Centenas de câmeras por escola</li>
                        <li>✓ Milhares de alunos monitorados</li>
                        <li>✓ Replicação automática de dados</li>
                        <li>✓ Failover automático em caso de falhas</li>
                      </ul>
                    </div>

                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-3">
                        Disponibilidade
                      </h4>
                      <p className="text-gray-600 mb-4">
                        Compromisso com alta disponibilidade e continuidade de serviço.
                      </p>
                      <ul className="text-gray-600 space-y-2">
                        <li>✓ SLA de 99.9% de uptime</li>
                        <li>✓ Redundância em múltiplas regiões</li>
                        <li>✓ Backup automático contínuo</li>
                        <li>✓ Recuperação de desastres testada</li>
                        <li>✓ Suporte técnico 24/7</li>
                      </ul>
                    </div>
                  </div>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </section>

        {/* Key Features */}
        <section className="py-20 px-4 bg-gray-50">
          <div className="container max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-12">
              Características Técnicas
            </h2>

            <div className="grid md:grid-cols-3 gap-8">
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Inteligência Artificial
                </h3>
                <p className="text-gray-600 text-sm">
                  Algoritmos avançados de IA para análise de comportamento, detecção de padrões e geração de insights pedagógicos contextualizados.
                </p>
              </Card>

              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Processamento em Tempo Real
                </h3>
                <p className="text-gray-600 text-sm">
                  Análise instantânea de eventos com alertas imediatos para situações críticas de segurança.
                </p>
              </Card>

              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Integração Fácil
                </h3>
                <p className="text-gray-600 text-sm">
                  Compatível com infraestrutura existente da escola. Instalação simples com suporte técnico completo.
                </p>
              </Card>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 px-4 bg-white">
          <div className="container max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">
              Quer conhecer mais sobre a arquitetura?
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              Entre em contato com nossa equipe técnica para uma apresentação detalhada e demonstração prática.
            </p>
            <a href="/contato" className="inline-block px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
              Solicitar Demonstração
            </a>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
