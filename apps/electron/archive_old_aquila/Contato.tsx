import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Mail, Phone, MapPin, Clock } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

export default function Contato() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    schoolName: "",
    studentCount: "",
    classroomCount: "",
    interest: "demo",
    subject: "",
    message: ""
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const submitContact = trpc.contact.submit.useMutation();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Validação básica
      if (!formData.name || !formData.email || !formData.subject || !formData.message) {
        toast.error("Por favor, preencha todos os campos obrigatórios.");
        setIsSubmitting(false);
        return;
      }

      // Enviar para backend
      const result = await submitContact.mutateAsync({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        schoolName: formData.schoolName,
        subject: formData.subject,
        message: formData.message,
      });

      if (result.success) {
        toast.success(result.message);
        setFormData({
          name: "",
          email: "",
          phone: "",
          schoolName: "",
          studentCount: "",
          classroomCount: "",
          interest: "demo",
          subject: "",
          message: ""
        });
      }
    } catch (error: any) {
      toast.error(error.message || "Erro ao enviar mensagem. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };



  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      
      <main className="flex-1 pt-24">
        {/* Hero Section */}
        <section className="py-20 px-4 bg-gradient-to-br from-blue-50 to-white">
          <div className="container max-w-4xl mx-auto">
            <h1 className="text-5xl font-bold text-gray-900 mb-6">
              Entre em Contato Conosco
            </h1>
            <p className="text-xl text-gray-600 leading-relaxed">
              Tem dúvidas sobre o Sistema Áquila Pro? Quer agendar uma demonstração? Estamos aqui para ajudar!
            </p>
          </div>
        </section>

        {/* Contact Info */}
        <section className="py-16 px-4 bg-white border-b">
          <div className="container max-w-6xl mx-auto">
            <div className="grid md:grid-cols-4 gap-8">
              <Card className="p-6 text-center">
                <Mail className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                <h3 className="font-semibold text-gray-900 mb-2">Email</h3>
                <a href="mailto:contato@aquila.pro" className="text-blue-600 hover:underline">
                  contato@aquila.pro
                </a>
              </Card>

              <Card className="p-6 text-center">
                <Phone className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                <h3 className="font-semibold text-gray-900 mb-2">Telefone</h3>
                <a href="tel:+5511999999999" className="text-blue-600 hover:underline">
                  +55 (11) 99999-9999
                </a>
              </Card>

              <Card className="p-6 text-center">
                <MapPin className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                <h3 className="font-semibold text-gray-900 mb-2">Localização</h3>
                <p className="text-gray-600">São Paulo, Brasil</p>
              </Card>

              <Card className="p-6 text-center">
                <Clock className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                <h3 className="font-semibold text-gray-900 mb-2">Horário</h3>
                <p className="text-gray-600 text-sm">Seg-Sex: 9h-18h</p>
              </Card>
            </div>
          </div>
        </section>

        {/* Contact Form */}
        <section className="py-20 px-4 bg-white">
          <div className="container max-w-2xl mx-auto">
            <Card className="p-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-8">
                Envie-nos uma Mensagem
              </h2>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Nome Completo *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition"
                      placeholder="Seu nome"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Email *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition"
                      placeholder="seu@email.com"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Telefone
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition"
                      placeholder="(11) 99999-9999"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Nome da Escola
                    </label>
                    <input
                      type="text"
                      name="schoolName"
                      value={formData.schoolName}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition"
                      placeholder="Nome da instituição"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Quantidade de Alunos
                    </label>
                    <input
                      type="number"
                      name="studentCount"
                      value={formData.studentCount}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition"
                      placeholder="Ex: 500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Quantidade de Salas
                    </label>
                    <input
                      type="number"
                      name="classroomCount"
                      value={formData.classroomCount}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition"
                      placeholder="Ex: 20"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Interesse Principal
                    </label>
                    <select
                      name="interest"
                      value={formData.interest}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition"
                    >
                      <option value="demo">Demonstração</option>
                      <option value="security">Segurança</option>
                      <option value="attendance">Presença</option>
                      <option value="analytics">Análise Comportamental</option>
                      <option value="pricing">Preços</option>
                      <option value="other">Outro</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Assunto *
                  </label>
                  <input
                    type="text"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition"
                    placeholder="Qual é o assunto da sua mensagem?"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Mensagem *
                  </label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    rows={6}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition resize-none"
                    placeholder="Conte-nos sobre sua instituição e como podemos ajudar..."
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full"
                >
                  {isSubmitting ? "Enviando..." : "Enviar Mensagem"}
                </Button>

                <p className="text-sm text-gray-600 text-center">
                  Responderemos em até 24 horas. Seus dados serão tratados conforme nossa Política de Privacidade.
                </p>
              </form>
            </Card>
          </div>
        </section>

        {/* Why Contact Us */}
        <section className="py-20 px-4 bg-gray-50">
          <div className="container max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">
              Por que Entrar em Contato?
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  title: "Demonstração Personalizada",
                  description: "Veja o Sistema Áquila Pro em ação com dados específicos da sua escola."
                },
                {
                  title: "Consultoria Técnica",
                  description: "Nossos especialistas avaliam sua infraestrutura e recomendam a melhor solução."
                },
                {
                  title: "Suporte Dedicado",
                  description: "Tenha um ponto de contato dedicado para implementação e suporte contínuo."
                },
                {
                  title: "Orçamento Customizado",
                  description: "Receba uma proposta personalizada baseada nas necessidades da sua instituição."
                },
                {
                  title: "Treinamento Completo",
                  description: "Oferecemos treinamento completo para coordenadores, diretores e familiares."
                },
                {
                  title: "Período de Teste",
                  description: "Teste o sistema gratuitamente por 14 dias antes de tomar uma decisão."
                },
                {
                  title: "Integração com Câmeras",
                  description: "Suporte para integração com suas câmeras IP existentes sem custos adicionais."
                },
                {
                  title: "Conformidade LGPD",
                  description: "Sistema totalmente compatível com LGPD e regulamentações de privacidade."
                },
                {
                  title: "Suporte Contínuo",
                  description: "Atualizações regulares, melhorias de segurança e suporte técnico 24/7."
                }
              ].map((item, idx) => (
                <div key={idx} className="bg-white p-6 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {item.title}
                  </h3>
                  <p className="text-gray-600">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
