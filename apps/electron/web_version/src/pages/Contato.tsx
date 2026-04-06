import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Mail, Phone, MapPin, Clock, Send, ShieldCheck, Zap, MessageCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { config } from "../../server/_core/config";

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
      if (!formData.name || !formData.email || !formData.subject || !formData.message) {
        toast.error("Por favor, preencha todos os campos obrigatórios.");
        setIsSubmitting(false);
        return;
      }

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
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-[#030712] text-white font-sans">
      {/* Background Elements */}
      <div className="bg-blobs">
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
      </div>

      <Navigation />
      
      <main className="flex-1 pt-32">
        {/* Header Section */}
        <section className="py-20 px-4 relative z-10">
          <div className="container max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs font-bold text-blue-400 uppercase tracking-widest mb-8">
              Strategic Support Channel V3
            </div>
            <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-tight mb-8 bg-gradient-to-b from-white via-white to-white/70 bg-clip-text text-transparent italic">
              Conecte-se com a <br /> Nossa Inteligência.
            </h1>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto font-light leading-relaxed">
              Dúvidas técnicas? Agendamento de POC? Nossa equipe de engenharia está pronta para desenhar o seu deploy V3.
            </p>
          </div>
        </section>

        {/* Contact Info Cards */}
        <section className="py-12 px-4 relative">
          <div className="container max-w-6xl mx-auto">
            <div className="grid md:grid-cols-4 gap-6">
               {[
                 { icon: Mail, title: "Email Direct", value: config.adminEmail, link: `mailto:${config.adminEmail}` },
                 { icon: Phone, title: "Central BR", value: "(61) 99962-3099", link: "tel:+5561999623099" },
                 { icon: MapPin, title: "Sede Global", value: "Brasília - DF", link: "https://maps.app.goo.gl/..." },
                 { icon: MessageCircle, title: "WhatsApp Pro", value: "Atendimento 24/7", link: "https://wa.me/5561999623099" }
               ].map((item, i) => (
                 <a key={i} href={item.link} target="_blank" className="glass-card p-8 rounded-[2.5rem] border-white/5 hover:border-blue-500/30 transition-all group flex flex-col items-center text-center">
                    <div className="w-12 h-12 rounded-xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center mb-4 group-hover:bg-blue-600 transition-all duration-500">
                       <item.icon size={20} className="text-blue-500 group-hover:text-white" />
                    </div>
                    <h3 className="text-[10px] font-black uppercase text-gray-500 mb-2 tracking-[0.2em]">{item.title}</h3>
                    <p className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors">{item.value}</p>
                 </a>
               ))}
            </div>
          </div>
        </section>

        {/* Form and CTA Section */}
        <section className="py-32 px-4 relative">
          <div className="container max-w-6xl mx-auto">
             <div className="grid md:grid-cols-2 gap-20">
                {/* Form Side */}
                <div className="glass-card p-12 rounded-[4rem] border-white/10 bg-white/5 relative overflow-hidden">
                   <div className="absolute top-0 right-0 p-10 opacity-5 -mr-20">
                      <Send size={300} className="text-blue-600" />
                   </div>
                   
                   <h2 className="text-3xl font-black italic uppercase italic tracking-tighter mb-10">Direct Message V3</h2>
                   
                   <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                         <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-gray-500 tracking-[0.3em] ml-2">Name</label>
                            <input name="name" value={formData.name} onChange={handleChange} required className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 focus:ring-2 focus:ring-blue-500 outline-none font-light placeholder:text-gray-700" placeholder="Primeiro e último nome" />
                         </div>
                         <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-gray-500 tracking-[0.3em] ml-2">Work Email</label>
                            <input name="email" value={formData.email} onChange={handleChange} required type="email" className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 focus:ring-2 focus:ring-blue-500 outline-none font-light placeholder:text-gray-700" placeholder="seu@email.com" />
                         </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                         <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-gray-500 tracking-[0.3em] ml-2">School Name</label>
                            <input name="schoolName" value={formData.schoolName} onChange={handleChange} className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 focus:ring-2 focus:ring-blue-500 outline-none font-light placeholder:text-gray-700" placeholder="Nome da instituição" />
                         </div>
                         <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-gray-500 tracking-[0.3em] ml-2">Target Subject</label>
                            <input name="subject" value={formData.subject} onChange={handleChange} required className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 focus:ring-2 focus:ring-blue-500 outline-none font-light placeholder:text-gray-700" placeholder="Ex: Agendamento Demo V3" />
                         </div>
                      </div>

                      <div className="space-y-2">
                         <label className="text-[10px] font-black uppercase text-gray-500 tracking-[0.3em] ml-2">Message Payload</label>
                         <textarea name="message" value={formData.message} onChange={handleChange} required rows={5} className="w-full bg-white/5 border border-white/10 rounded-3xl px-6 py-4 focus:ring-2 focus:ring-blue-500 outline-none font-light placeholder:text-gray-700 resize-none" placeholder="Como podemos potencializar sua segurança hoje?" />
                      </div>

                      <button type="submit" disabled={isSubmitting} className="w-full py-6 rounded-2xl bg-white text-blue-600 font-black italic uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50">
                         {isSubmitting ? "TRANSMITTING..." : "EXECUTE SEND"}
                      </button>
                   </form>
                </div>

                {/* Content Side */}
                <div className="flex flex-col justify-center space-y-20">
                   <div>
                      <h4 className="text-[10px] font-black uppercase text-blue-500 tracking-[0.4em] mb-8 italic">Deployment Excellence</h4>
                      <h3 className="text-4xl font-black italic tracking-tighter mb-6 uppercase">O Próximo Nível <br /> Começa Agora.</h3>
                      <p className="text-gray-400 font-light leading-relaxed text-lg">
                        Ao entrar em contato, você receberá um diagnóstico preliminar da sua infraestrutura atual de hardware em menos de 24 horas.
                      </p>
                   </div>
                   
                   <div className="space-y-12">
                      {[
                        { icon: ShieldCheck, t: "Suporte SLA 2h", d: "Resposta ultra-rápida para qualquer interrupção crítica." },
                        { icon: Zap, t: "Engine Customizada", d: "Criamos regras de IA específicas para o seu regimento escolar." }
                      ].map((item, i) => (
                        <div key={i} className="flex gap-8 group">
                           <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-blue-600 transition-all duration-500">
                              <item.icon size={24} className="text-blue-500 group-hover:text-white" />
                           </div>
                           <div>
                              <h5 className="text-lg font-bold mb-2 italic uppercase tracking-tight">{item.t}</h5>
                              <p className="text-gray-500 font-light text-sm">{item.d}</p>
                           </div>
                        </div>
                      ))}
                   </div>

                   <div className="p-10 rounded-[3rem] bg-gradient-to-br from-blue-600/10 to-indigo-600/10 border border-white/5">
                      <div className="text-[10px] font-black uppercase text-gray-600 mb-6 tracking-widest text-center italic">Escritório Central DF</div>
                      <div className="flex justify-center flex-wrap gap-10 opacity-30 mt-4">
                         <Clock size={32} />
                         <MapPin size={32} />
                         <MessageCircle size={32} />
                      </div>
                   </div>
                </div>
             </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
