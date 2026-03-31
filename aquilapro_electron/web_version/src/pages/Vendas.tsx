import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Check, Shield, TrendingUp, Users, Clock, Eye, BarChart3, Bell, ArrowRight, Star, Phone, Mail, MessageCircle, Loader2, CheckCircle2, Zap, Target, Lock, Download, Send } from "lucide-react";
import { Link } from "wouter";
import { useState } from "react";
import { trpc } from "@/lib/trpc";

export default function Vendas() {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [studentCount, setStudentCount] = useState(250);
  const [classroomCount, setClassroomCount] = useState(10);

  const calculateROI = () => {
    const monthlyCostSecurity = studentCount * 15;
    const monthlyCostAttendance = classroomCount * 200;
    const monthlySavings = monthlyCostSecurity + monthlyCostAttendance;
    const annualSavings = monthlySavings * 12;
    const systemCost = studentCount <= 200 ? 15000 : studentCount <= 500 ? 25000 : 40000;
    const roiMonths = Math.ceil(systemCost / monthlySavings);
    return { monthlySavings, annualSavings, systemCost, roiMonths };
  };

  const roi = calculateROI();

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-[#030712] text-white font-sans">
      {/* Background Elements */}
      <div className="bg-blobs">
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
      </div>

      <Navigation />
      
      <main className="flex-1 pt-32">
        {/* Hero Section */}
        <section className="py-24 px-4 relative z-10 overflow-hidden">
          <div className="container max-w-7xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-20 items-center">
              <div className="space-y-10">
                <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs font-bold text-blue-400 uppercase tracking-widest">
                  <Shield className="w-4 h-4" /> Enterprise Security V3
                </div>
                <h1 className="text-6xl md:text-8xl font-black tracking-tight leading-tight italic bg-gradient-to-b from-white via-white to-white/60 bg-clip-text text-transparent">
                   Lidere a <br /> Escola 4.0.
                </h1>
                <p className="text-xl text-gray-400 font-light leading-relaxed max-w-xl">
                  O Sistema Áquila Pro traz a supremacia do reconhecimento facial e IA neural para o controle total da sua instituição. Segurança absoluta, burocracia zero.
                </p>
                <div className="flex flex-wrap gap-6 pt-4">
                  <Button size="lg" className="px-12 py-8 rounded-2xl text-xl font-bold bg-white text-blue-600 hover:scale-105 shadow-xl shadow-white/5 transition-all" onClick={() => {
                     document.getElementById('orcamento')?.scrollIntoView({ behavior: 'smooth' });
                  }}>
                    Solicitar Proposta V3
                  </Button>
                  <Button size="lg" variant="outline" className="px-12 py-8 rounded-2xl text-xl font-bold border-white/20 hover:bg-white/10 uppercase italic tracking-widest text-[10px]" onClick={() => window.location.href = '/demo'}>
                    Ver Simulador Live
                  </Button>
                </div>
                
                <div className="flex gap-12 pt-10 border-t border-white/5">
                   {[
                     { l: "Precisão", v: "99.2%" },
                     { l: "Latência", v: "<120ms" },
                     { l: "Cloud Cost", v: "R$ 0" }
                   ].map((item, i) => (
                     <div key={i}>
                        <div className="text-3xl font-black italic text-blue-500">{item.v}</div>
                        <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{item.l}</div>
                     </div>
                   ))}
                </div>
              </div>

              {/* ROI Calculator Card */}
              <div className="relative">
                 <div className="absolute inset-0 bg-blue-600/20 blur-[130px] rounded-full"></div>
                 <div className="glass-card p-12 rounded-[4rem] border-white/10 bg-white/5 relative z-10 backdrop-blur-2xl">
                    <h3 className="text-2xl font-black italic uppercase tracking-tighter mb-8 text-center bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">Predictive ROI Engine</h3>
                    <div className="space-y-10">
                       <div className="space-y-4">
                          <div className="flex justify-between items-center px-2">
                             <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest">Student Payload</label>
                             <span className="text-xl font-black italic text-white">{studentCount} alunos</span>
                          </div>
                          <input type="range" min="50" max="2000" step="50" value={studentCount} onChange={(e) => setStudentCount(Number(e.target.value))} className="w-full accent-blue-600 bg-white/5 h-2 rounded-full appearance-none cursor-pointer" title="Quantidade de Alunos" aria-label="Ajustar quantidade de alunos" />
                       </div>
                       
                       <div className="space-y-4">
                          <div className="flex justify-between items-center px-2">
                             <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest">Active Channels (Rooms)</label>
                             <span className="text-xl font-black italic text-white">{classroomCount} salas</span>
                          </div>
                          <input type="range" min="5" max="100" step="5" value={classroomCount} onChange={(e) => setClassroomCount(Number(e.target.value))} className="w-full accent-blue-600 bg-white/5 h-2 rounded-full appearance-none cursor-pointer" title="Quantidade de Salas" aria-label="Ajustar quantidade de salas" />
                       </div>

                       <div className="pt-8 border-t border-white/10 grid grid-cols-1 gap-6">
                          <div className="flex justify-between items-center p-6 rounded-3xl bg-blue-500/10 border border-blue-500/20">
                             <div className="text-[10px] font-black uppercase text-blue-400 tracking-widest italic">Anual Net Savings</div>
                             <div className="text-3xl font-black italic text-white">R$ {roi.annualSavings.toLocaleString('pt-BR')}</div>
                          </div>
                          <div className="flex justify-between items-center p-6 rounded-3xl bg-white/5 border border-white/10">
                             <div className="text-[10px] font-black uppercase text-gray-500 tracking-widest italic">Payload Breakeven</div>
                             <div className="text-3xl font-black italic text-yellow-500">{roi.roiMonths} MONTHS</div>
                          </div>
                       </div>
                    </div>
                 </div>
              </div>
            </div>
          </div>
        </section>

        {/* Benefits Grid */}
        <section className="py-32 px-4 relative bg-white/5 border-y border-white/5">
           <div className="container max-w-7xl mx-auto">
              <div className="text-center mb-24">
                 <h2 className="text-4xl md:text-6xl font-black italic mb-6 tracking-tighter uppercase">Tecnologia de Vanguarda.</h2>
                 <p className="text-gray-400 font-light max-w-xl mx-auto text-lg leading-relaxed">Desenvolvido por engenheiros de elite para transformar dados brutos em decisões pedagógicas estratégicas.</p>
              </div>
              <div className="grid md:grid-cols-3 gap-8">
                 {[
                   { icon: Zap, t: "Neural Attendance", d: "Chamada automática 100% via reconhecimento facial V3. Ganhe 15min por aula.", m: "15min/class gain" },
                   { icon: Shield, t: "Panic Link V3", d: "Alertas críticos em menos de 100ms para saídas não autorizadas ou riscos.", m: "<100ms Response" },
                   { icon: Eye, t: "Deep Analytics", d: "Mapas de calor e padrões de engajamento baseados em movimentação neural.", m: "Full Insight" },
                   { icon: Bell, t: "Direct Sync", d: "Notificações instantâneas via Mobile App nativo para pais e responsáveis.", m: "24/7 Connectivity" },
                   { icon: Lock, t: "Edge Privacy", d: "Processamento 100% local. Zero-cloud architecture para sigilo total.", m: "100% LGPD Safe" },
                   { icon: TrendingUp, t: "Hyper ROI", d: "Redução drástica de custos operacionais e infraestrutura de TI legada.", m: "90% Efficiency" }
                 ].map((b, i) => (
                    <div key={i} className="glass-card p-10 rounded-[3rem] border-white/5 group hover:border-blue-500/30 transition-all duration-500">
                       <div className="w-14 h-14 rounded-2xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center mb-8 group-hover:bg-blue-600 transition-all duration-500">
                          <b.icon size={24} className="text-blue-500 group-hover:text-white" />
                       </div>
                       <h3 className="text-2xl font-black italic uppercase tracking-tighter mb-4 group-hover:text-blue-400 transition-colors">{b.t}</h3>
                       <p className="text-gray-400 font-light text-sm leading-relaxed mb-6">{b.d}</p>
                       <div className="px-4 py-2 rounded-full bg-white/5 text-[10px] font-black uppercase tracking-widest text-blue-500 w-fit">{b.m}</div>
                    </div>
                 ))}
              </div>
           </div>
        </section>

        {/* Pricing Form Section */}
        <QuoteForm />

        {/* Support Banner */}
        <section className="py-32 px-4 mb-20">
           <div className="container max-w-4xl mx-auto glass-card p-16 rounded-[4rem] border-white/10 text-center flex flex-col items-center">
              <MessageCircle size={64} className="text-blue-500 mb-8" />
              <h2 className="text-4xl font-black italic mb-6">Expert Strategic Support</h2>
              <p className="text-gray-400 font-light max-w-xl mb-12 text-lg italic">
                "O Áquila Pro não é apenas um software; é uma nova filosofia de gestão escolar. Nosso time de implantação age como consultores estratégicos."
              </p>
              <div className="flex flex-wrap justify-center gap-6">
                 <a href="tel:+5561999623099" className="px-10 py-5 rounded-2xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all">Direct: (61) 99962-3099</a>
                 <a href="https://wa.me/5561999623099" target="_blank" rel="noopener noreferrer" className="px-10 py-5 rounded-2xl bg-green-500/10 border border-green-500/20 text-[10px] font-black uppercase tracking-widest text-green-500 hover:bg-green-500/20 transition-all">WhatsApp Business</a>
              </div>
           </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

const STATES = ["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"];
const FEATURES = ["Reconhecimento Facial V3", "Presença Autônomo", "Mobile App Sync", "Portal Pais Premium", "Deep Analytics", "Ollama IA Local", "Gestão LGPD", "Heatmaps Fluxo"];

function QuoteForm() {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    schoolName: "", schoolType: "private" as const, city: "", state: "DF",
    contactName: "", contactRole: "", contactEmail: "", contactPhone: "",
    totalStudents: 250, totalRooms: 10, existingCameras: 0,
    interestedFeatures: [] as string[], budget: "unknown" as const,
    timeline: "unknown" as const, message: "",
  });

  const submitQuote = trpc.quotes.submit.useMutation({
    onSuccess: () => setSubmitted(true),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitQuote.mutate(formData);
  };

  const toggleFeature = (f: string) => {
    setFormData(prev => ({
      ...prev,
      interestedFeatures: prev.interestedFeatures.includes(f) 
        ? prev.interestedFeatures.filter(x => x !== f) 
        : [...prev.interestedFeatures, f]
    }));
  };

  if (submitted) {
    return (
      <section id="orcamento" className="py-32 px-4 animate-in fade-in duration-1000">
        <div className="container max-w-4xl mx-auto glass-card p-24 rounded-[5rem] border-green-500/20 text-center bg-green-950/5">
           <CheckCircle2 size={80} className="text-green-500 mx-auto mb-8" />
           <h2 className="text-5xl font-black italic uppercase tracking-tighter mb-4 text-white">Transmissão Recebida.</h2>
           <p className="text-gray-400 font-light text-xl mb-12">Nossa equipe de engenharia de IA analisará seu payload e entrará em contato em menos de 12 horas.</p>
           <button onClick={() => setSubmitted(false)} className="px-12 py-6 rounded-2xl border border-white/10 text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-white transition-all">Enviar Novo Payload</button>
        </div>
      </section>
    );
  }

  return (
    <section id="orcamento" className="py-32 px-4 relative">
      <div className="container max-w-6xl mx-auto">
         <div className="glass-card p-12 md:p-24 rounded-[5rem] border-white/10 bg-white/5 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-20 opacity-5 -mr-40 mt-20">
               <Send size={500} className="text-blue-600" />
            </div>
            
            <div className="relative z-10">
               <div className="mb-20">
                  <h2 className="text-4xl md:text-6xl font-black italic mb-6 tracking-tighter uppercase">Payload de <br /> Orçamento V3</h2>
                  <p className="text-gray-500 font-light text-lg">Precisamos de alguns metadados sobre sua estrutura para gerar sua proposta customizada.</p>
               </div>

               <form onSubmit={handleSubmit} className="space-y-12">
                  {/* Step 1: School Identity */}
                  <div className="grid md:grid-cols-2 gap-10">
                     <div className="space-y-4">
                        <label className="text-[10px] font-black uppercase text-gray-600 tracking-widest ml-4">Institution Name</label>
                        <input required value={formData.schoolName} onChange={e => setFormData({...formData, schoolName: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-3xl px-8 py-6 focus:ring-2 focus:ring-blue-500 outline-none font-light italic" placeholder="Ex: Colégio Millenium V3" />
                     </div>
                     <div className="space-y-4">
                        <label className="text-[10px] font-black uppercase text-gray-600 tracking-widest ml-4">HQ State</label>
                        <select value={formData.state} onChange={e => setFormData({...formData, state: e.target.value})} title="Estado de Sede" className="w-full bg-white/5 border border-white/10 rounded-3xl px-8 py-6 focus:ring-2 focus:ring-blue-500 outline-none font-light italic text-gray-400 appearance-none">
                           {STATES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                     </div>
                  </div>

                  {/* Step 2: Contact Layer */}
                  <div className="grid md:grid-cols-2 gap-10">
                     <div className="space-y-4">
                        <label className="text-[10px] font-black uppercase text-gray-600 tracking-widest ml-4">Decision Maker Name</label>
                        <input required value={formData.contactName} onChange={e => setFormData({...formData, contactName: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-3xl px-8 py-6 focus:ring-2 focus:ring-blue-500 outline-none font-light italic" placeholder="Seu nome completo" />
                     </div>
                     <div className="space-y-4">
                        <label className="text-[10px] font-black uppercase text-gray-600 tracking-widest ml-4">Official Email</label>
                        <input required type="email" value={formData.contactEmail} onChange={e => setFormData({...formData, contactEmail: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-3xl px-8 py-6 focus:ring-2 focus:ring-blue-500 outline-none font-light italic" placeholder="corpo@escola.com.br" />
                     </div>
                  </div>

                  {/* Step 3: Infrastructure Scaling */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-10">
                      {[
                        { l: "Estimated Students", n: "totalStudents" },
                        { l: "Active Channels (Rooms)", n: "totalRooms" },
                        { l: "Existing IP Cameras", n: "existingCameras" }
                      ].map((item, i) => (
                        <div key={i} className="space-y-4">
                           <label className="text-[10px] font-black uppercase text-gray-600 tracking-widest ml-4">{item.l}</label>
                           <input type="number" value={(formData as any)[item.n]} onChange={e => setFormData({...formData, [item.n]: parseInt(e.target.value) || 0})} title={item.l} className="w-full bg-white/5 border border-white/10 rounded-3xl px-8 py-6 focus:ring-2 focus:ring-blue-500 outline-none font-black italic text-center text-blue-500" />
                        </div>
                      ))}
                  </div>

                  {/* Step 4: Modules Selection */}
                  <div className="space-y-8">
                     <label className="text-[10px] font-black uppercase text-gray-600 tracking-widest ml-4 text-center block">Select Neural Modules of Interest</label>
                     <div className="flex flex-wrap justify-center gap-4">
                        {FEATURES.map(f => (
                           <button key={f} type="button" onClick={() => toggleFeature(f)} className={`px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border ${
                              formData.interestedFeatures.includes(f) ? 'bg-blue-600 border-blue-600 text-white shadow-xl shadow-blue-500/20' : 'bg-white/5 border-white/5 text-gray-500 hover:bg-white/10'
                           }`}>
                              {f}
                           </button>
                        ))}
                     </div>
                  </div>

                  <div className="pt-10 flex flex-col items-center gap-10">
                     <button type="submit" disabled={submitQuote.isPending} className="px-20 py-8 rounded-3xl bg-white text-blue-600 font-black italic uppercase tracking-widest text-xl hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-white/5 disabled:opacity-50">
                        {submitQuote.isPending ? "TRANSMITTING..." : "GENERATE V3 PROPOSAL"}
                     </button>
                     <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest text-center">
                        <Lock size={12} className="inline mr-2" /> Encrypted via AES-256 for Primary Deployment Compliance
                     </p>
                  </div>
               </form>
            </div>
         </div>
      </div>
    </section>
  );
}
