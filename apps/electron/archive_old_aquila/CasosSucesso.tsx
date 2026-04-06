import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Star } from "lucide-react";

export default function CasosSucesso() {
  const cases = [
    {
      escola: "Colégio São Paulo",
      local: "São Paulo, SP",
      alunos: 450,
      resultado: "Redução de 78% em incidentes de segurança",
      testimonial: "O Sistema Áquila Pro transformou completamente a forma como gerenciamos a segurança e presença dos alunos. Os coordenadores agora têm visibilidade em tempo real de toda a escola.",
      autor: "Diretora Maria Silva",
      impacto: [
        "Resposta mais rápida a incidentes",
        "Redução de faltas não registradas",
        "Melhor comunicação com familiares"
      ]
    },
    {
      escola: "Escola Municipal Futuro",
      local: "Rio de Janeiro, RJ",
      alunos: 320,
      resultado: "Aumento de 45% na precisão de registros de presença",
      testimonial: "Implementar o Áquila foi simples e o suporte técnico foi excelente. Nossos dados de presença agora são 100% confiáveis e automatizados.",
      autor: "Coordenador Pedagógico João Costa",
      impacto: [
        "Eliminação de erros manuais",
        "Economia de tempo administrativo",
        "Relatórios mais precisos"
      ]
    },
    {
      escola: "Instituto Educacional Excelência",
      local: "Belo Horizonte, MG",
      alunos: 520,
      resultado: "Detecção de 12 padrões de desengajamento",
      testimonial: "Os insights de engajamento fornecidos pelo Áquila nos permitiram identificar alunos que precisavam de apoio pedagógico. Conseguimos intervir antes que os problemas se agravassem.",
      autor: "Psicopedagoga Ana Santos",
      impacto: [
        "Intervenções pedagógicas mais efetivas",
        "Redução de evasão escolar",
        "Melhor acompanhamento individual"
      ]
    },
    {
      escola: "Colégio Privado Inovação",
      local: "Curitiba, PR",
      alunos: 380,
      resultado: "Compatibilidade com 15 modelos diferentes de câmeras",
      testimonial: "A flexibilidade de integração com câmeras de baixo custo foi decisiva. Conseguimos implementar a solução sem necessidade de investimento em infraestrutura cara.",
      autor: "Gerente de TI Carlos Mendes",
      impacto: [
        "ROI em 6 meses",
        "Escalabilidade para futuras expansões",
        "Suporte técnico responsivo"
      ]
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
              Casos de Sucesso
            </h1>
            <p className="text-xl text-gray-600 leading-relaxed">
              Conheça como instituições de ensino de todo o Brasil estão transformando sua segurança e gestão com o Sistema Áquila Pro.
            </p>
          </div>
        </section>

        {/* Cases Grid */}
        <section className="py-20 px-4 bg-white">
          <div className="container max-w-6xl mx-auto">
            <div className="grid md:grid-cols-2 gap-8">
              {cases.map((caseItem, idx) => (
                <Card key={idx} className="p-8 hover:shadow-lg transition-shadow">
                  <div className="mb-6">
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">
                      {caseItem.escola}
                    </h3>
                    <p className="text-gray-600 mb-4">{caseItem.local}</p>
                    <div className="flex items-center gap-4 mb-4">
                      <span className="text-sm font-medium text-gray-700">
                        {caseItem.alunos} alunos
                      </span>
                      <div className="flex gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className="w-4 h-4 fill-yellow-400 text-yellow-400"
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm font-semibold text-blue-900">
                      Resultado Principal
                    </p>
                    <p className="text-lg font-bold text-blue-600 mt-2">
                      {caseItem.resultado}
                    </p>
                  </div>

                  <blockquote className="mb-6 border-l-4 border-blue-600 pl-4">
                    <p className="text-gray-700 italic mb-3">
                      "{caseItem.testimonial}"
                    </p>
                    <footer className="text-sm text-gray-600">
                      — {caseItem.autor}
                    </footer>
                  </blockquote>

                  <div>
                    <p className="text-sm font-semibold text-gray-900 mb-3">
                      Impactos Observados
                    </p>
                    <ul className="space-y-2">
                      {caseItem.impacto.map((item, iidx) => (
                        <li key={iidx} className="flex items-start gap-2 text-sm text-gray-600">
                          <span className="text-blue-600 font-bold mt-0.5">✓</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Statistics */}
        <section className="py-20 px-4 bg-gray-50">
          <div className="container max-w-6xl mx-auto">
            <h2 className="text-4xl font-bold text-gray-900 mb-12 text-center">
              Impacto Geral
            </h2>
            <div className="grid md:grid-cols-4 gap-8">
              {[
                { number: "45+", label: "Escolas Implementadas" },
                { number: "12.5K+", label: "Alunos Monitorados" },
                { number: "95%", label: "Taxa de Satisfação" },
                { number: "24/7", label: "Suporte Técnico" }
              ].map((stat, idx) => (
                <div key={idx} className="text-center">
                  <p className="text-5xl font-bold text-blue-600 mb-2">
                    {stat.number}
                  </p>
                  <p className="text-gray-600 font-medium">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 px-4 bg-white">
          <div className="container max-w-4xl mx-auto text-center space-y-8">
            <h2 className="text-4xl font-bold text-gray-900">
              Sua Escola Pode Ser Nosso Próximo Caso de Sucesso
            </h2>
            <p className="text-xl text-gray-600">
              Entre em contato conosco para uma demonstração personalizada e descubra como o Áquila Pro pode transformar sua instituição.
            </p>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
