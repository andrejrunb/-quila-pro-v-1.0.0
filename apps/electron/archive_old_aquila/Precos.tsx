import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Check } from "lucide-react";
import { Link } from "wouter";

export default function Precos() {
  const plans = [
    {
      name: "Essencial",
      description: "Para pequenas escolas com até 100 alunos",
      price: "R$ 1.990",
      period: "/mês",
      features: [
        "Até 100 alunos",
        "Até 5 salas de aula",
        "Reconhecimento facial",
        "Gestão de presença",
        "1 câmera IP",
        "Relatórios básicos",
        "Suporte por email",
        "Dashboard web"
      ],
      cta: "Começar",
      highlighted: false
    },
    {
      name: "Profissional",
      description: "Para escolas médias com até 300 alunos",
      price: "R$ 4.990",
      period: "/mês",
      features: [
        "Até 300 alunos",
        "Até 15 salas de aula",
        "Reconhecimento facial avançado",
        "Gestão de presença completa",
        "Até 10 câmeras IP",
        "Análise de engajamento",
        "Relatórios detalhados",
        "Alertas em tempo real",
        "Suporte por telefone",
        "Portal para familiares",
        "Integração com câmeras de baixo custo"
      ],
      cta: "Começar Teste Gratuito",
      highlighted: true
    },
    {
      name: "Enterprise",
      description: "Para grandes instituições com mais de 300 alunos",
      price: "Personalizado",
      period: "",
      features: [
        "Alunos ilimitados",
        "Salas ilimitadas",
        "Reconhecimento facial com Deep Learning",
        "Gestão completa de presença",
        "Câmeras ilimitadas",
        "Análise avançada de comportamento",
        "Relatórios customizados",
        "Alertas inteligentes",
        "Suporte 24/7 dedicado",
        "Treinamento personalizado",
        "Integração com sistemas existentes",
        "SLA garantido"
      ],
      cta: "Solicitar Orçamento",
      highlighted: false
    }
  ];

  const faqs = [
    {
      question: "Qual é o período mínimo de contrato?",
      answer: "Oferecemos flexibilidade com planos mensais, trimestrais e anuais. Não há compromisso de longo prazo para os planos Essencial e Profissional."
    },
    {
      question: "Há custos adicionais de implementação?",
      answer: "A implementação básica está incluída no preço. Para customizações especiais ou integrações complexas, podemos fornecer um orçamento adicional."
    },
    {
      question: "Posso fazer upgrade ou downgrade de plano?",
      answer: "Sim, você pode alterar seu plano a qualquer momento. A mudança será refletida na próxima fatura com ajuste proporcional."
    },
    {
      question: "Vocês oferecem período de teste?",
      answer: "Sim, oferecemos 14 dias de teste gratuito para os planos Profissional e Enterprise. Não é necessário cartão de crédito."
    }
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      
      <main className="flex-1 pt-24">
        {/* Hero Section */}
        <section className="py-20 px-4 bg-gradient-to-br from-blue-50 to-white">
          <div className="container max-w-4xl mx-auto text-center">
            <h1 className="text-5xl font-bold text-gray-900 mb-6">
              Preços Transparentes e Justos
            </h1>
            <p className="text-xl text-gray-600 leading-relaxed">
              Escolha o plano ideal para sua instituição. Todos incluem suporte técnico e atualizações de software.
            </p>
          </div>
        </section>

        {/* Pricing Cards */}
        <section className="py-20 px-4 bg-white">
          <div className="container max-w-6xl mx-auto">
            <div className="grid md:grid-cols-3 gap-8">
              {plans.map((plan, idx) => (
                <Card
                  key={idx}
                  className={`p-8 flex flex-col ${
                    plan.highlighted ? "ring-2 ring-blue-600 relative" : ""
                  }`}
                >
                  {plan.highlighted && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                      <span className="bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                        Mais Popular
                      </span>
                    </div>
                  )}

                  <div className="mb-8 pt-4">
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">
                      {plan.name}
                    </h3>
                    <p className="text-gray-600 text-sm mb-6">
                      {plan.description}
                    </p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-bold text-gray-900">
                        {plan.price}
                      </span>
                      <span className="text-gray-600">{plan.period}</span>
                    </div>
                  </div>

                  <Button
                    className="w-full mb-8"
                    variant={plan.highlighted ? "default" : "outline"}
                    onClick={() => window.location.href = '/contato'}
                  >
                    {plan.cta}
                  </Button>

                  <div className="space-y-4 flex-1">
                    {plan.features.map((feature, fidx) => (
                      <div key={fidx} className="flex items-start gap-3">
                        <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-700 text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Comparison Table */}
        <section className="py-20 px-4 bg-gray-50">
          <div className="container max-w-6xl mx-auto">
            <h2 className="text-4xl font-bold text-gray-900 mb-12 text-center">
              Comparação Detalhada
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    <th className="text-left py-4 px-4 font-semibold text-gray-900">Recurso</th>
                    <th className="text-center py-4 px-4 font-semibold text-gray-900">Essencial</th>
                    <th className="text-center py-4 px-4 font-semibold text-gray-900">Profissional</th>
                    <th className="text-center py-4 px-4 font-semibold text-gray-900">Enterprise</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { feature: "Reconhecimento Facial", essencial: "✓", profissional: "✓", enterprise: "✓" },
                    { feature: "Gestão de Presença", essencial: "✓", profissional: "✓", enterprise: "✓" },
                    { feature: "Análise de Engajamento", essencial: "—", profissional: "✓", enterprise: "✓" },
                    { feature: "Alertas em Tempo Real", essencial: "—", profissional: "✓", enterprise: "✓" },
                    { feature: "Portal para Familiares", essencial: "—", profissional: "✓", enterprise: "✓" },
                    { feature: "Suporte 24/7", essencial: "—", profissional: "—", enterprise: "✓" },
                    { feature: "Integração Customizada", essencial: "—", profissional: "—", enterprise: "✓" },
                  ].map((row, idx) => (
                    <tr key={idx} className="border-b border-gray-200 hover:bg-white transition-colors">
                      <td className="py-4 px-4 font-medium text-gray-900">{row.feature}</td>
                      <td className="text-center py-4 px-4 text-gray-600">{row.essencial}</td>
                      <td className="text-center py-4 px-4 text-gray-600">{row.profissional}</td>
                      <td className="text-center py-4 px-4 text-gray-600">{row.enterprise}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-20 px-4 bg-white">
          <div className="container max-w-4xl mx-auto">
            <h2 className="text-4xl font-bold text-gray-900 mb-12 text-center">
              Perguntas Frequentes
            </h2>
            <div className="space-y-6">
              {faqs.map((faq, idx) => (
                <div key={idx} className="p-6 bg-gray-50 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    {faq.question}
                  </h3>
                  <p className="text-gray-600">
                    {faq.answer}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 px-4 bg-gradient-to-r from-blue-600 to-blue-800 text-white">
          <div className="container max-w-4xl mx-auto text-center space-y-8">
            <h2 className="text-4xl font-bold">
              Pronto para Começar?
            </h2>
            <p className="text-xl text-blue-100">
              Agende uma demonstração gratuita e descubra qual plano é ideal para sua escola.
            </p>
            <Button size="lg" variant="secondary" onClick={() => window.location.href = '/contato'}>
              Agendar Demonstração
            </Button>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
