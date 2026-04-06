import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Shield, Lock, AlertCircle, CheckCircle, FileText, Users } from "lucide-react";

export default function Seguranca() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      
      <main className="flex-1 pt-24">
        {/* Hero Section */}
        <section className="py-20 px-4 bg-gradient-to-br from-red-50 to-white">
          <div className="container max-w-4xl mx-auto">
            <h1 className="text-5xl font-bold text-gray-900 mb-6">
              Segurança e Conformidade LGPD
            </h1>
            <p className="text-xl text-gray-600 leading-relaxed">
              O Sistema Áquila Pro foi desenvolvido com segurança de nível empresarial e conformidade total com a Lei Geral de Proteção de Dados Pessoais (LGPD).
            </p>
          </div>
        </section>

        {/* Security Overview */}
        <section className="py-20 px-4 bg-white">
          <div className="container max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-12">
              Pilares de Segurança
            </h2>

            <div className="grid md:grid-cols-3 gap-8">
              <Card className="p-8 border-l-4 border-blue-600">
                <Lock className="w-12 h-12 text-blue-600 mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  Criptografia
                </h3>
                <ul className="text-gray-600 space-y-2 text-sm">
                  <li>✓ TLS 1.3 para todas as conexões</li>
                  <li>✓ AES-256 para dados em repouso</li>
                  <li>✓ Chaves gerenciadas por HSM</li>
                  <li>✓ Certificados SSL/TLS válidos</li>
                </ul>
              </Card>

              <Card className="p-8 border-l-4 border-green-600">
                <Shield className="w-12 h-12 text-green-600 mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  Controle de Acesso
                </h3>
                <ul className="text-gray-600 space-y-2 text-sm">
                  <li>✓ RBAC com 4 níveis de permissão</li>
                  <li>✓ Autenticação JWT com refresh tokens</li>
                  <li>✓ Suporte a MFA (2FA)</li>
                  <li>✓ Rate limiting e throttling</li>
                </ul>
              </Card>

              <Card className="p-8 border-l-4 border-purple-600">
                <FileText className="w-12 h-12 text-purple-600 mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  Auditoria
                </h3>
                <ul className="text-gray-600 space-y-2 text-sm">
                  <li>✓ Logs completos de acesso</li>
                  <li>✓ Rastreamento de modificações</li>
                  <li>✓ Retenção de 2 anos</li>
                  <li>✓ Alertas de atividades suspeitas</li>
                </ul>
              </Card>
            </div>
          </div>
        </section>

        {/* LGPD Compliance */}
        <section className="py-20 px-4 bg-gray-50">
          <div className="container max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-12">
              Conformidade LGPD
            </h2>

            <div className="space-y-8">
              <Card className="p-8">
                <div className="flex items-start gap-4">
                  <CheckCircle className="w-8 h-8 text-green-600 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      Consentimento Informado
                    </h3>
                    <p className="text-gray-600 mb-3">
                      O Sistema Áquila Pro requer consentimento explícito dos pais/responsáveis antes de coletar dados biométricos dos alunos. Fornecemos:
                    </p>
                    <ul className="text-gray-600 space-y-2 ml-4">
                      <li>• Termo de consentimento padrão em conformidade com LGPD</li>
                      <li>• Explicação clara sobre coleta, uso e armazenamento de dados</li>
                      <li>• Direito de revogar consentimento a qualquer momento</li>
                      <li>• Registro digital de consentimento com timestamp</li>
                    </ul>
                  </div>
                </div>
              </Card>

              <Card className="p-8">
                <div className="flex items-start gap-4">
                  <CheckCircle className="w-8 h-8 text-green-600 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      Direito ao Esquecimento
                    </h3>
                    <p className="text-gray-600 mb-3">
                      Qualquer pessoa pode solicitar a exclusão de seus dados pessoais:
                    </p>
                    <ul className="text-gray-600 space-y-2 ml-4">
                      <li>• Exclusão de fotos e face encodings em até 30 dias</li>
                      <li>• Anonimização de registros históricos</li>
                      <li>• Confirmação escrita de exclusão</li>
                      <li>• Sem custo adicional para o solicitante</li>
                    </ul>
                  </div>
                </div>
              </Card>

              <Card className="p-8">
                <div className="flex items-start gap-4">
                  <CheckCircle className="w-8 h-8 text-green-600 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      Portabilidade de Dados
                    </h3>
                    <p className="text-gray-600 mb-3">
                      Usuários podem solicitar seus dados em formato estruturado:
                    </p>
                    <ul className="text-gray-600 space-y-2 ml-4">
                      <li>• Exportação em JSON, CSV ou XML</li>
                      <li>• Inclui histórico completo de presença</li>
                      <li>• Processamento em até 15 dias úteis</li>
                      <li>• Transferência para outro sistema</li>
                    </ul>
                  </div>
                </div>
              </Card>

              <Card className="p-8">
                <div className="flex items-start gap-4">
                  <CheckCircle className="w-8 h-8 text-green-600 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      Política de Retenção
                    </h3>
                    <p className="text-gray-600 mb-3">
                      Dados são retidos apenas pelo tempo necessário:
                    </p>
                    <ul className="text-gray-600 space-y-2 ml-4">
                      <li>• Fotos: 90 dias (após exclusão automática)</li>
                      <li>• Face encodings: 90 dias</li>
                      <li>• Registros de presença: 2 anos</li>
                      <li>• Logs de auditoria: 2 anos</li>
                      <li>• Dados de alunos inativos: 1 ano após saída</li>
                    </ul>
                  </div>
                </div>
              </Card>

              <Card className="p-8">
                <div className="flex items-start gap-4">
                  <CheckCircle className="w-8 h-8 text-green-600 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      Proteção de Dados Pessoais
                    </h3>
                    <p className="text-gray-600 mb-3">
                      Implementamos medidas técnicas e organizacionais:
                    </p>
                    <ul className="text-gray-600 space-y-2 ml-4">
                      <li>• Criptografia de ponta a ponta</li>
                      <li>• Acesso restrito por autenticação forte</li>
                      <li>• Segregação de dados por escola</li>
                      <li>• Backup criptografado com replicação</li>
                      <li>• Testes de penetração regulares</li>
                    </ul>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </section>

        {/* Data Protection Officer */}
        <section className="py-20 px-4 bg-white">
          <div className="container max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-12">
              Governança de Dados
            </h2>

            <div className="grid md:grid-cols-2 gap-8">
              <Card className="p-8">
                <Users className="w-12 h-12 text-blue-600 mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  Data Protection Officer (DPO)
                </h3>
                <p className="text-gray-600 mb-4">
                  Designamos um DPO responsável por:
                </p>
                <ul className="text-gray-600 space-y-2">
                  <li>• Supervisionar conformidade com LGPD</li>
                  <li>• Processar solicitações de direitos</li>
                  <li>• Investigar incidentes de segurança</li>
                  <li>• Treinar equipe sobre proteção de dados</li>
                  <li>• Manter documentação de conformidade</li>
                </ul>
                <p className="text-gray-600 mt-4">
                  <strong>Contato DPO:</strong> dpo@aquila.pro
                </p>
              </Card>

              <Card className="p-8">
                <AlertCircle className="w-12 h-12 text-orange-600 mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  Notificação de Incidentes
                </h3>
                <p className="text-gray-600 mb-4">
                  Em caso de vazamento de dados:
                </p>
                <ul className="text-gray-600 space-y-2">
                  <li>• Notificação em até 72 horas</li>
                  <li>• Informações sobre o incidente</li>
                  <li>• Medidas de mitigação tomadas</li>
                  <li>• Recomendações de proteção</li>
                  <li>• Contato para mais informações</li>
                </ul>
                <p className="text-gray-600 mt-4">
                  <strong>Reportar incidente:</strong> security@aquila.pro
                </p>
              </Card>
            </div>
          </div>
        </section>

        {/* Risk Mitigation */}
        <section className="py-20 px-4 bg-gray-50">
          <div className="container max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-12">
              Mitigação de Riscos
            </h2>

            <div className="space-y-6">
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Risco: Falsos Positivos em Reconhecimento Facial
                </h3>
                <p className="text-gray-600 mb-3">
                  <strong>Impacto:</strong> Aluno identificado incorretamente, afetando registro de presença.
                </p>
                <p className="text-gray-600">
                  <strong>Mitigação:</strong> Validação manual de identificações com confiança &lt; 85%, feedback dos coordenadores para re-treinamento, teste mensal de acurácia.
                </p>
              </Card>

              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Risco: Viés Algorítmico
                </h3>
                <p className="text-gray-600 mb-3">
                  <strong>Impacto:</strong> Modelo pode ter desempenho diferente por etnia, gênero ou idade.
                </p>
                <p className="text-gray-600">
                  <strong>Mitigação:</strong> Treinamento com dataset diversificado, testes de equidade, auditoria externa anual, documentação de limitações.
                </p>
              </Card>

              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Risco: Vazamento de Dados Biométricos
                </h3>
                <p className="text-gray-600 mb-3">
                  <strong>Impacto:</strong> Face encodings ou fotos acessadas por terceiros não autorizados.
                </p>
                <p className="text-gray-600">
                  <strong>Mitigação:</strong> Criptografia AES-256, acesso restrito por RBAC, VPN para servidor local, testes de penetração trimestrais, seguro de cibersegurança.
                </p>
              </Card>

              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Risco: Vigilância Excessiva
                </h3>
                <p className="text-gray-600 mb-3">
                  <strong>Impacto:</strong> Monitoramento contínuo pode violar privacidade dos alunos.
                </p>
                <p className="text-gray-600">
                  <strong>Mitigação:</strong> Câmeras apenas em áreas comuns, não em banheiros/vestiários, consentimento dos pais, política de retenção de dados, direito ao esquecimento.
                </p>
              </Card>

              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Risco: Falha de Câmeras ou Rede
                </h3>
                <p className="text-gray-600 mb-3">
                  <strong>Impacto:</strong> Indisponibilidade do sistema afeta registro de presença.
                </p>
                <p className="text-gray-600">
                  <strong>Mitigação:</strong> Cache local com sincronização posterior, redundância de câmeras, failover automático, SLA de 99.9% uptime.
                </p>
              </Card>
            </div>
          </div>
        </section>

        {/* Certifications */}
        <section className="py-20 px-4 bg-white">
          <div className="container max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">
              Certificações e Conformidades
            </h2>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                { title: "LGPD", desc: "Lei Geral de Proteção de Dados Pessoais (Brasil)" },
                { title: "ISO 27001", desc: "Gestão de Segurança da Informação" },
                { title: "GDPR Ready", desc: "Compatível com regulamentações europeias" },
                { title: "SOC 2 Type II", desc: "Auditoria de segurança e conformidade" },
                { title: "PCI DSS", desc: "Padrão de Segurança de Dados de Pagamento" },
                { title: "WCAG 2.1 AA", desc: "Acessibilidade Web" }
              ].map((cert, idx) => (
                <Card key={idx} className="p-6 text-center">
                  <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-3" />
                  <h3 className="font-semibold text-gray-900 mb-2">{cert.title}</h3>
                  <p className="text-sm text-gray-600">{cert.desc}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
