import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { useState } from "react";
import { ChevronDown } from "lucide-react";

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqs = [
    {
      category: "Geral",
      questions: [
        {
          q: "O que é o Sistema Áquila Pro?",
          a: "O Sistema Áquila Pro é uma plataforma completa de segurança e gestão escolar que utiliza reconhecimento facial e IA para identificar alunos, rastrear presença em tempo real, analisar engajamento e fornecer insights pedagógicos para coordenadores e familiares."
        },
        {
          q: "Como o Áquila Pro funciona?",
          a: "O sistema utiliza câmeras IP conectadas à rede da escola. As câmeras capturam imagens dos alunos, que são processadas por algoritmos de reconhecimento facial para identificação. Os dados são armazenados em um banco de dados seguro e visualizados através de um portal web intuitivo."
        },
        {
          q: "Qual é o tamanho mínimo de escola para usar o Áquila?",
          a: "Não há limite mínimo. O sistema é escalável e pode ser usado desde pequenas escolas com 50 alunos até grandes instituições com 500+ alunos. Oferecemos planos diferentes para cada tamanho."
        }
      ]
    },
    {
      category: "Segurança e Privacidade",
      questions: [
        {
          q: "Como o Áquila Pro protege os dados dos alunos?",
          a: "Todos os dados são criptografados usando padrões de segurança de ponta. Implementamos conformidade com LGPD (Lei Geral de Proteção de Dados Pessoais) e outras regulamentações de proteção de dados. Os servidores são hospedados em data centers seguros com backup automático."
        },
        {
          q: "Os dados dos alunos são compartilhados com terceiros?",
          a: "Não. Os dados dos alunos nunca são compartilhados com terceiros sem consentimento explícito. Apenas coordenadores, diretores e familiares autorizados têm acesso aos dados através de seus perfis de usuário."
        },
        {
          q: "Como funciona o consentimento dos pais/responsáveis?",
          a: "Recomendamos que as escolas obtenham consentimento informado dos pais/responsáveis antes de implementar o sistema. Fornecemos modelos de termos de consentimento que estão em conformidade com a LGPD."
        },
        {
          q: "O reconhecimento facial é preciso? Há risco de erros?",
          a: "Nosso sistema alcança precisão acima de 95% em condições normais de iluminação. Como qualquer tecnologia, há margem para erros, especialmente em condições de iluminação inadequada. Por isso, recomendamos sempre usar o sistema como ferramenta de apoio e não como única fonte de verdade."
        }
      ]
    },
    {
      category: "Técnico",
      questions: [
        {
          q: "Qual é a velocidade de processamento do reconhecimento facial?",
          a: "O sistema processa e identifica um aluno em menos de 1 segundo. Múltiplas câmeras podem ser processadas simultaneamente, permitindo monitoramento em tempo real de toda a escola."
        },
        {
          q: "Quantas câmeras posso conectar ao sistema?",
          a: "Não há limite técnico para o número de câmeras. O sistema é escalável e pode suportar desde 1 até 100+ câmeras dependendo da infraestrutura de rede."
        },
        {
          q: "Qual é a largura de banda necessária?",
          a: "Cada câmera requer aproximadamente 2-4 Mbps de largura de banda, dependendo da resolução e taxa de quadros. Para uma escola com 10 câmeras, recomendamos uma conexão de internet de pelo menos 50 Mbps."
        },
        {
          q: "O sistema funciona offline?",
          a: "O sistema requer conexão com a internet para funcionar plenamente. Porém, oferecemos um modo offline limitado onde o sistema continua registrando presença localmente e sincroniza quando a conexão é restaurada."
        }
      ]
    },
    {
      category: "Implementação",
      questions: [
        {
          q: "Quanto tempo leva para implementar o Áquila Pro?",
          a: "A implementação básica leva entre 2-4 semanas, dependendo do tamanho da escola e da complexidade da infraestrutura. Isso inclui instalação de câmeras, configuração do sistema e treinamento da equipe."
        },
        {
          q: "Vocês fornecem suporte na instalação?",
          a: "Sim. Para clientes do plano Profissional e Enterprise, fornecemos suporte técnico completo na instalação e configuração. Para o plano Essencial, oferecemos documentação detalhada e suporte por email."
        },
        {
          q: "Preciso comprar câmeras novas?",
          a: "Não necessariamente. Se sua escola já possui câmeras IP que suportam RTSP/ONVIF, elas podem ser integradas ao sistema. Caso contrário, recomendamos câmeras de marcas como Hikvision, Dahua ou Intelbras, que oferecem bom custo-benefício."
        },
        {
          q: "Qual é o tempo de treinamento necessário?",
          a: "Fornecemos treinamento completo para coordenadores e diretores. O treinamento básico leva 2-4 horas. A maioria dos usuários se sente confortável com o sistema após 1-2 semanas de uso."
        }
      ]
    },
    {
      category: "Funcionalidades",
      questions: [
        {
          q: "Posso gerar relatórios personalizados?",
          a: "Sim. O sistema permite gerar relatórios personalizados de presença, frequência, engajamento e comportamento. Os relatórios podem ser exportados em PDF, Excel ou outros formatos."
        },
        {
          q: "Como funciona o alerta de saída não autorizada?",
          a: "O sistema detecta quando um aluno sai da escola sem autorização. Coordenadores e familiares recebem um alerta em tempo real. Você pode configurar regras personalizadas para diferentes horários e situações."
        },
        {
          q: "O sistema integra com outros softwares de gestão escolar?",
          a: "Sim. Oferecemos integração com sistemas populares como Google Classroom, Microsoft Teams e plataformas de gestão escolar. Entre em contato para saber sobre integrações específicas."
        },
        {
          q: "Posso acessar o sistema pelo celular?",
          a: "Sim. O portal web é responsivo e funciona em smartphones e tablets. Também estamos desenvolvendo aplicativos nativos para iOS e Android."
        }
      ]
    },
    {
      category: "Suporte",
      questions: [
        {
          q: "Qual é o horário de suporte técnico?",
          a: "Oferecemos suporte por email 24/7. Para clientes Enterprise, oferecemos suporte telefônico 24/7. Para outros planos, o suporte telefônico está disponível de segunda a sexta, das 9h às 18h."
        },
        {
          q: "Qual é o tempo de resposta do suporte?",
          a: "Garantimos resposta em até 2 horas para problemas críticos e em até 24 horas para outros problemas. Clientes Enterprise têm SLA de 1 hora."
        },
        {
          q: "Como entro em contato com o suporte?",
          a: "Você pode entrar em contato através de email (suporte@aquila.pro), telefone (+55 11 99999-9999) ou através do portal de suporte no seu painel de controle."
        }
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
              Perguntas Frequentes
            </h1>
            <p className="text-xl text-gray-600 leading-relaxed">
              Encontre respostas para as perguntas mais comuns sobre o Sistema Áquila Pro.
            </p>
          </div>
        </section>

        {/* FAQ Sections */}
        <section className="py-20 px-4 bg-white">
          <div className="container max-w-4xl mx-auto space-y-12">
            {faqs.map((section, sidx) => (
              <div key={sidx}>
                <h2 className="text-3xl font-bold text-gray-900 mb-8">
                  {section.category}
                </h2>
                <div className="space-y-4">
                  {section.questions.map((faq, qidx) => {
                    const globalIndex = sidx * 100 + qidx;
                    const isOpen = openIndex === globalIndex;

                    return (
                      <Card
                        key={qidx}
                        className="p-6 cursor-pointer hover:shadow-md transition-shadow"
                        onClick={() =>
                          setOpenIndex(isOpen ? null : globalIndex)
                        }
                      >
                        <div className="flex items-start justify-between gap-4">
                          <h3 className="text-lg font-semibold text-gray-900 flex-1">
                            {faq.q}
                          </h3>
                          <ChevronDown
                            className={`w-6 h-6 text-gray-600 flex-shrink-0 transition-transform ${
                              isOpen ? "transform rotate-180" : ""
                            }`}
                          />
                        </div>
                        {isOpen && (
                          <p className="text-gray-600 mt-4 leading-relaxed">
                            {faq.a}
                          </p>
                        )}
                      </Card>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 px-4 bg-gray-50">
          <div className="container max-w-4xl mx-auto text-center space-y-6">
            <h2 className="text-3xl font-bold text-gray-900">
              Não encontrou sua pergunta?
            </h2>
            <p className="text-xl text-gray-600">
              Entre em contato com nosso suporte técnico. Estamos aqui para ajudar!
            </p>
            <p className="text-gray-600">
              Email: <a href="mailto:suporte@aquila.pro" className="text-blue-600 font-semibold hover:underline">suporte@aquila.pro</a>
            </p>
            <p className="text-gray-600">
              Telefone: <a href="tel:+5511999999999" className="text-blue-600 font-semibold hover:underline">+55 (11) 99999-9999</a>
            </p>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
