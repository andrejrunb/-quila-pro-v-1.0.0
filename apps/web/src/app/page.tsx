"use client";

import { 
  Shield, Zap, Globe, Cpu, CheckCircle2, ArrowRight, MessageSquare, Target, 
  ChevronDown, GraduationCap, Users, Calendar, Landmark, Briefcase, FileText, Contact,
  Activity, TrendingUp, BarChart3, Clock, Lock, Eye
} from "lucide-react";
import { animate, stagger } from "animejs";
import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
const AScene = "a-scene" as any;
const ASky = "a-sky" as any;
const ABox = "a-box" as any;
const APlane = "a-plane" as any;
const ALight = "a-light" as any;
const AEntity = "a-entity" as any;
const ACamera = "a-camera" as any;

export default function LandingPage() {
  const [studentCount, setStudentCount] = useState(1200);
  const [staffSize, setStaffSize] = useState(45);
  const [isMounted, setIsMounted] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [isAnnual, setIsAnnual] = useState(true);

  const cloudSavings = studentCount * 10;
  const hoursRecovered = Math.floor(studentCount * 2.92); 

  const showcaseTabs = [
    {
      title: "Para Administradores",
      features: ["Gestão financeira completa", "Relatórios de evasão preditivos", "Controle de acessos biométricos", "Dashboard de ROI em tempo real"]
    },
    {
      title: "Para Professores",
      features: ["Chamada automática com IA", "Geração de provas e correção", "Diário de classe simplificado", "Comunicação direta com pais"]
    },
    {
      title: "Para Pais",
      features: ["Notificações de entrada e saída", "Boletim e desempenho escolar", "Pagamento de mensalidades", "Acompanhamento disciplinar"]
    }
  ];

  useEffect(() => {
    setIsMounted(true);
    
    animate('.hero-stagger', {
      translateY: [40, 0],
      opacity: [0, 1],
      delay: stagger(150),
      duration: 1200,
      easing: 'easeOutExpo'
    });

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animate(entry.target, {
            translateY: [50, 0],
            opacity: [0, 1],
            duration: 800,
            easing: 'easeOutCubic'
          });
          
          if (entry.target.classList.contains('stats-section')) {
             const statsElements = document.querySelectorAll('.stat-number');
             statsElements.forEach((el) => {
                const finalVal = parseFloat(el.getAttribute('data-value') || '0');
                const isFloat = el.getAttribute('data-float') === 'true';
                const myObj = { prop: 0 };
                
                animate(myObj, {
                  prop: finalVal,
                  duration: 2500,
                  easing: 'easeOutExpo',
                  update: () => {
                     el.innerHTML = isFloat ? myObj.prop.toFixed(1) : Math.floor(myObj.prop).toLocaleString('pt-BR');
                  }
                });
             });
          }
          
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });

    document.querySelectorAll('.animate-on-scroll, .stats-section').forEach(card => observer.observe(card));

    return () => observer.disconnect();
  }, []);

  return (
    <div className="flex flex-col min-h-screen selection:bg-blue-500 selection:text-white bg-[#020617] text-white">
      {isMounted && (
        <script src="https://aframe.io/releases/1.4.0/aframe.min.js" async />
      )}

      <Navbar />

      {/* Hero Section */}
      <section id="hero" className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden pt-20 px-8">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,#1e293b_0%,#020617_100%)]">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-500/20 blur-[120px] rounded-full animate-pulse" style={{ animationDuration: '4s' }} />
        </div>
        
        <div className="max-w-5xl mx-auto text-center z-10 flex flex-col items-center gap-8 mt-16">
          <h1 className="hero-stagger text-7xl md:text-8xl lg:text-9xl font-black tracking-tighter text-white">
            Áquila <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-cyan-400">Pro</span>
          </h1>
          <h2 className="hero-stagger text-2xl md:text-3xl font-bold text-zinc-300">
            A Plataforma de Gestão Escolar com IA Soberana
          </h2>
          <p className="hero-stagger text-lg text-zinc-400 max-w-2xl leading-relaxed">
            Segurança, Presença Automática e Comunicação Familiar unificadas em uma única zona de tecnologia. Reduza a evasão e automatize a burocracia com a arquitetura <span className="text-white italic">Ghost-Vision</span>.
          </p>
          <div className="hero-stagger flex flex-wrap justify-center gap-6 pt-4">
            <a href="#contact" className="eagle-glass-card px-8 py-4 rounded-full font-bold text-white flex items-center gap-3 hover:bg-blue-600/20 transition-all border border-blue-500/50 shadow-[0_0_30px_rgba(59,130,246,0.4)] no-underline">
              Agendar Demo <ArrowRight size={18} />
            </a>
            <a href="#features" className="eagle-glass-card px-8 py-4 rounded-full font-bold text-zinc-300 flex items-center gap-2 hover:bg-white/5 transition-all border border-white/10 no-underline">
              Explorar Recursos
            </a>
          </div>
        </div>
      </section>

      {/* Stats Counter Section */}
      <section className="py-20 px-8 border-y border-white/5 bg-slate-900/50 stats-section relative opacity-0">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="eagle-glass-card p-6 flex flex-col items-center justify-center text-center">
             <div className="text-4xl md:text-5xl font-black text-white mb-2 flex items-center">
                <span className="stat-number" data-value="500" data-float="false">0</span>+
             </div>
             <div className="text-sm font-bold text-zinc-400 uppercase tracking-widest">Escolas</div>
          </div>
          <div className="eagle-glass-card p-6 flex flex-col items-center justify-center text-center">
             <div className="text-4xl md:text-5xl font-black text-white mb-2 flex items-center">
                <span className="stat-number" data-value="150000" data-float="false">0</span>+
             </div>
             <div className="text-sm font-bold text-zinc-400 uppercase tracking-widest">Alunos</div>
          </div>
          <div className="eagle-glass-card p-6 flex flex-col items-center justify-center text-center">
             <div className="text-4xl md:text-5xl font-black text-white mb-2 flex items-center">
                <span className="stat-number" data-value="99.9" data-float="true">0</span>%
             </div>
             <div className="text-sm font-bold text-zinc-400 uppercase tracking-widest">Uptime</div>
          </div>
          <div className="eagle-glass-card p-6 flex flex-col items-center justify-center text-center">
             <div className="text-4xl md:text-5xl font-black text-white mb-2 flex items-center">
                <span className="stat-number" data-value="100" data-float="false">0</span>%
             </div>
             <div className="text-sm font-bold text-zinc-400 uppercase tracking-widest">LGPD</div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-32 px-8 relative bg-[#020617]">
        <div className="max-w-7xl mx-auto flex flex-col items-center">
          <h2 className="text-4xl md:text-5xl font-black text-center mb-16 text-white uppercase tracking-tighter animate-on-scroll opacity-0">Vantagens <span className="text-blue-500">Exclusivas</span></h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full">
            <div className="eagle-glass-card p-10 flex flex-col gap-6 animate-on-scroll opacity-0 hover:border-blue-500/30">
               <div className="w-16 h-16 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-400">
                  <Shield size={32} />
               </div>
               <h3 className="text-2xl font-bold text-white uppercase tracking-tight">🛡️ Soberania Total</h3>
               <p className="text-zinc-400 leading-relaxed font-medium">Dados processados localmente, sem dependência de nuvem. A privacidade dos seus alunos garantida por arquitetura on-premise.</p>
            </div>
            <div className="eagle-glass-card p-10 flex flex-col gap-6 animate-on-scroll opacity-0 hover:border-cyan-500/30">
               <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 flex items-center justify-center text-cyan-400">
                  <Cpu size={32} />
               </div>
               <h3 className="text-2xl font-bold text-white uppercase tracking-tight">🧠 IA Integrada</h3>
               <p className="text-zinc-400 leading-relaxed font-medium">Visão computacional para chamada automática, chatbots inteligentes e tutores virtuais disponíveis 24/7 para suporte acadêmico.</p>
            </div>
            <div className="eagle-glass-card p-10 flex flex-col gap-6 animate-on-scroll opacity-0 hover:border-indigo-500/30">
               <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                  <Globe size={32} />
               </div>
               <h3 className="text-2xl font-bold text-white uppercase tracking-tight">📱 Multi-Plataforma</h3>
               <p className="text-zinc-400 leading-relaxed font-medium">Experiência sincronizada e fluida entre Desktop, Web e Mobile. Controle a sua instituição de qualquer dispositivo.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Portal Showcase Section */}
      <section className="py-32 px-8 bg-slate-900/30 relative border-t border-white/5">
        <div className="max-w-7xl mx-auto flex flex-col items-center">
           <h2 className="text-4xl md:text-5xl font-black mb-16 text-white text-center uppercase tracking-tighter animate-on-scroll opacity-0">Portais <span className="text-blue-500">Especializados</span></h2>
           <div className="flex flex-wrap gap-4 justify-center mb-12 animate-on-scroll opacity-0">
              {showcaseTabs.map((tab, idx) => (
                 <button 
                   key={idx} 
                   onClick={() => setActiveTab(idx)}
                   className={`px-8 py-3 rounded-full font-bold transition-all uppercase tracking-widest text-xs ${activeTab === idx ? 'bg-blue-600 text-white shadow-[0_0_20px_rgba(59,130,246,0.4)]' : 'eagle-glass-card text-zinc-400 hover:text-white'}`}
                 >
                   {tab.title}
                 </button>
              ))}
           </div>
           <div className="eagle-glass-card w-full max-w-5xl p-8 md:p-12 min-h-[400px] flex flex-col md:flex-row gap-12 items-center animate-on-scroll opacity-0">
              <div className="flex-1 space-y-6 w-full">
                 <h3 className="text-3xl font-black text-white">{showcaseTabs[activeTab].title}</h3>
                 <ul className="space-y-4">
                    {showcaseTabs[activeTab].features.map((feature, i) => (
                       <li key={i} className="flex items-center gap-3 text-zinc-300 font-medium">
                          <CheckCircle2 className="text-cyan-400 shrink-0" size={20} />
                          {feature}
                       </li>
                    ))}
                 </ul>
              </div>
              <div className="flex-1 w-full aspect-video rounded-3xl bg-slate-950/80 border border-white/10 flex items-center justify-center relative overflow-hidden shadow-2xl">
                 <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-cyan-500/10" />
                 <BarChart3 className="text-white/20 drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]" size={64} />
                 <div className="absolute bottom-4 left-4 right-4 h-1/2 bg-gradient-to-t from-[#020617] to-transparent" />
              </div>
           </div>
        </div>
      </section>

      {/* A-Frame 3D School Preview (Elite Interaction) */}
      <section className="py-32 px-8 bg-[#020617] relative border-t border-white/5">
        <div className="max-w-7xl mx-auto flex flex-col gap-12">
          <div className="flex flex-col md:flex-row justify-between items-end gap-8 animate-on-scroll opacity-0">
            <div className="max-w-2xl">
              <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter text-white">Ambiente <span className="text-blue-500 italic">3D Ativo</span></h2>
              <p className="text-zinc-400 mt-4 text-lg font-medium">Visualize sua instituição em tempo real com mapeamento espacial digital (Digital Twin).</p>
            </div>
            <button className="eagle-glass-card px-8 py-4 rounded-full text-[10px] font-black uppercase tracking-widest text-white hover:bg-white/5">Expandir Visualização</button>
          </div>
          
          <div className="relative w-full aspect-video rounded-[48px] overflow-hidden border border-white/10 shadow-[0_0_50px_rgba(59,130,246,0.15)] animate-on-scroll opacity-0">
            {isMounted && (
              <AScene embedded style={{ height: '100%', width: '100%' }}>
                <ASky color="#040816"></ASky>
                <ABox position="0 0.5 -3" rotation="0 45 0" color="#3b82f6" scale="1.5 1.5 1.5"
                       animation="property: rotation; to: 0 405 0; loop: true; dur: 10000; easing: linear"></ABox>
                <APlane position="0 0 -4" rotation="-90 0 0" width="10" height="10" color="#0a0f1c"></APlane>
                <ALight type="ambient" color="#333"></ALight>
                <ALight type="point" intensity="1.5" position="2 4 -3" color="#3b82f6"></ALight>
                <AEntity position="0 1.6 0">
                  <ACamera look-controls="enabled: true" wasd-controls="enabled: true"></ACamera>
                </AEntity>
              </AScene>
            )}
            <div className="absolute top-8 left-8 eagle-glass-card px-6 py-3 rounded-2xl flex items-center gap-3">
              <Activity className="text-blue-500 animate-pulse" size={18} />
              <span className="text-[10px] font-bold text-white uppercase tracking-widest">Live Architectural Twin</span>
            </div>
          </div>
        </div>
      </section>

      {/* ROI Calculator Section */}
      <section id="roi" className="py-32 px-8 bg-slate-900/50 relative overflow-hidden border-t border-white/5">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-500/10 blur-[180px] rounded-full" />
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
          <div className="flex flex-col gap-8 animate-on-scroll opacity-0">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-[10px] font-bold uppercase tracking-[0.2em] w-fit">
              <TrendingUp size={14} /> ROI & Strategic Gains
            </div>
            <h2 className="text-5xl md:text-6xl font-black uppercase tracking-tighter leading-[0.9] text-white">
              Transforme Burocracia em <span className="text-cyan-400">Valor Real</span>.
            </h2>
            <p className="text-zinc-400 text-lg font-medium leading-relaxed max-w-xl">
              O Áquila Pro reduz custos operacionais críticos através da automação inteligente. Nossa calculadora projeta ganhos baseados em métricas institucionais reais.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-4">
              <div className="flex gap-4 items-start">
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0 border border-blue-500/20 text-blue-400">
                  <Clock size={24} />
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm mb-1">Recuperação de Tempo</h4>
                  <p className="text-zinc-500 text-[11px] font-medium leading-snug">Liberamos o staff para tarefas pedagógicas, reduzindo horas extras administrativas.</p>
                </div>
              </div>
              <div className="flex gap-4 items-start">
                <div className="w-12 h-12 rounded-xl bg-cyan-500/10 flex items-center justify-center shrink-0 border border-cyan-500/20 text-cyan-400">
                  <Lock size={24} />
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm mb-1">Segurança de Dados</h4>
                  <p className="text-zinc-500 text-[11px] font-medium leading-snug">Conformidade total com LGPD, eliminando riscos jurídicos e multas de privacidade.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="eagle-glass-card p-12 animate-on-scroll opacity-0 relative">
            <div className="absolute -top-12 -right-12 w-48 h-48 bg-blue-500/20 blur-[100px] rounded-full opacity-60 pointer-events-none" />
            <h3 className="text-2xl font-black mb-10 uppercase tracking-tighter text-white">Impacto <span className="text-blue-400">Institutional</span></h3>
            
            <div className="space-y-12">
              <div className="space-y-4">
                <div className="flex justify-between text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">
                  <span>Volume de Alunos</span>
                  <span className="text-white text-base">{studentCount}</span>
                </div>
                <input 
                  type="range" 
                  min="100" 
                  max="5000" 
                  step="50"
                  value={studentCount}
                  onChange={(e) => setStudentCount(parseInt(e.target.value))}
                  className="w-full h-2 bg-slate-800 rounded-full appearance-none cursor-pointer accent-blue-500"
                />
              </div>

              <div className="space-y-4">
                <div className="flex justify-between text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">
                  <span>Equipe Operacional</span>
                  <span className="text-white text-base">{staffSize}</span>
                </div>
                <input 
                  type="range" 
                  min="10" 
                  max="250" 
                  step="5"
                  value={staffSize}
                  onChange={(e) => setStaffSize(parseInt(e.target.value))}
                  className="w-full h-2 bg-slate-800 rounded-full appearance-none cursor-pointer accent-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-6 pt-6">
                 <div className="p-6 rounded-[28px] bg-white/5 border border-white/10 flex flex-col gap-2">
                    <div className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Chamada Automática</div>
                    <div className="text-2xl font-black text-blue-400">+{hoursRecovered}h/ano</div>
                    <div className="text-[9px] font-bold text-zinc-500">recuperadas para ensino</div>
                 </div>
                 <div className="p-6 rounded-[28px] bg-cyan-500/5 border border-cyan-500/10 flex flex-col gap-2">
                    <div className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Economia com Nuvem</div>
                    <div className="text-2xl font-black text-cyan-400">R$ {cloudSavings.toLocaleString('pt-BR')}</div>
                    <div className="text-[9px] font-bold text-zinc-500">anuais sem servidores</div>
                 </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-32 px-8 bg-[#020617] relative border-t border-white/5">
        <div className="max-w-7xl mx-auto flex flex-col items-center">
          <h2 className="text-4xl md:text-5xl font-black mb-8 text-white uppercase tracking-tighter animate-on-scroll opacity-0">Planos <span className="text-cyan-400">Transparentes</span></h2>
          <div className="flex items-center gap-2 mb-16 eagle-glass-card px-2 py-2 rounded-full animate-on-scroll opacity-0">
             <button onClick={() => setIsAnnual(false)} className={`px-6 py-2 rounded-full font-bold text-sm transition-all uppercase tracking-widest ${!isAnnual ? 'bg-white/10 text-white' : 'text-zinc-500 hover:text-white'}`}>Mensal</button>
             <button onClick={() => setIsAnnual(true)} className={`px-6 py-2 rounded-full font-bold text-sm transition-all uppercase tracking-widest ${isAnnual ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(59,130,246,0.5)]' : 'text-zinc-500 hover:text-white'}`}>Anual (20% off)</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-6xl">
             <div className="eagle-glass-card p-10 flex flex-col animate-on-scroll opacity-0">
                <h3 className="text-xl font-bold text-zinc-300 mb-2 uppercase tracking-widest">Sovereign Essential</h3>
                <div className="text-4xl font-black text-white mb-6">R$ 4,50<span className="text-sm font-normal text-zinc-500">/aluno/mês</span></div>
                <ul className="space-y-4 mb-10 flex-1">
                   <li className="flex items-center gap-3 text-sm text-zinc-400 font-medium"><CheckCircle2 size={18} className="text-blue-500 shrink-0" /> Presença Facial (Ghost-Vision)</li>
                   <li className="flex items-center gap-3 text-sm text-zinc-400 font-medium"><CheckCircle2 size={18} className="text-blue-500 shrink-0" /> Alertas de Evasão</li>
                   <li className="flex items-center gap-3 text-sm text-zinc-400 font-medium"><CheckCircle2 size={18} className="text-blue-500 shrink-0" /> Portal Familiar Básico</li>
                   <li className="flex items-center gap-3 text-sm text-zinc-400 font-medium"><CheckCircle2 size={18} className="text-blue-500 shrink-0" /> Relatórios de Frequência</li>
                </ul>
                <button className="w-full py-4 rounded-xl border border-white/10 text-white font-bold hover:bg-white/5 transition-all uppercase tracking-widest text-xs">Contratar Essencial</button>
             </div>
             <div className="eagle-glass-card p-10 flex flex-col border-blue-500/50 shadow-[0_0_40px_rgba(59,130,246,0.15)] relative transform md:-translate-y-4 animate-on-scroll opacity-0">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-blue-600 text-white px-6 py-1 rounded-full text-[10px] font-black tracking-widest uppercase shadow-[0_0_15px_rgba(59,130,246,0.5)] whitespace-nowrap">Mais Popular</div>
                <h3 className="text-xl font-bold text-blue-400 mb-2 uppercase tracking-widest">Sovereign Pro</h3>
                <div className="text-4xl font-black text-white mb-6">R$ 8,90<span className="text-sm font-normal text-zinc-500">/aluno/mês</span></div>
                <ul className="space-y-4 mb-10 flex-1">
                   <li className="flex items-center gap-3 text-sm text-zinc-300 font-medium"><CheckCircle2 size={18} className="text-blue-500 shrink-0" /> Tudo no Essential</li>
                   <li className="flex items-center gap-3 text-sm text-zinc-300 font-medium"><CheckCircle2 size={18} className="text-blue-500 shrink-0" /> Córtex Docente por Voz</li>
                   <li className="flex items-center gap-3 text-sm text-zinc-300 font-medium"><CheckCircle2 size={18} className="text-blue-500 shrink-0" /> Integração de WhatsApp</li>
                   <li className="flex items-center gap-3 text-sm text-zinc-300 font-medium"><CheckCircle2 size={18} className="text-blue-500 shrink-0" /> Timetable Solver IA</li>
                </ul>
                <button className="w-full py-4 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-500 transition-all shadow-[0_0_20px_rgba(59,130,246,0.4)] uppercase tracking-widest text-xs">Demonstração Pro</button>
             </div>
             <div className="eagle-glass-card p-10 flex flex-col animate-on-scroll opacity-0">
                <h3 className="text-xl font-bold text-cyan-400 mb-2 uppercase tracking-widest">Sovereign Elite</h3>
                <div className="text-3xl font-black text-white mb-6">Sob consulta</div>
                <ul className="space-y-4 mb-10 flex-1">
                   <li className="flex items-center gap-3 text-sm text-zinc-400 font-medium"><CheckCircle2 size={18} className="text-cyan-500 shrink-0" /> Tudo no Pro</li>
                   <li className="flex items-center gap-3 text-sm text-zinc-400 font-medium"><CheckCircle2 size={18} className="text-cyan-500 shrink-0" /> White-Label Completo (Sua Marca)</li>
                   <li className="flex items-center gap-3 text-sm text-zinc-400 font-medium"><CheckCircle2 size={18} className="text-cyan-500 shrink-0" /> API de Integração Aberta</li>
                   <li className="flex items-center gap-3 text-sm text-zinc-400 font-medium"><CheckCircle2 size={18} className="text-cyan-500 shrink-0" /> DPO as a Service (LGPD)</li>
                </ul>
                <button className="w-full py-4 rounded-xl border border-white/10 text-white font-bold hover:bg-white/5 transition-all uppercase tracking-widest text-xs">Falar com Consultor</button>
             </div>
          </div>
        </div>
      </section>

      {/* Contact CTA Section */}
      <section id="contact" className="py-40 px-8 bg-slate-900/50 relative overflow-hidden flex flex-col items-center justify-center border-t border-white/5">
         <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1200px] h-[1200px] border-[1px] border-blue-500/20 rounded-full animate-[ping_10s_linear_infinite]" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] border-[1px] border-cyan-500/20 rounded-full animate-[ping_15s_linear_infinite]" />
         </div>
         
         <div className="max-w-4xl w-full mx-auto eagle-glass-card p-10 md:p-16 flex flex-col items-center text-center relative z-10 animate-on-scroll opacity-0 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
            <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter text-white mb-6">Transforme Sua Escola</h2>
            <p className="text-zinc-400 mb-12 text-lg md:text-xl max-w-2xl font-medium">A revolução da soberania escolar está a um clique de distância. Agende uma demonstração e veja o Áquila Pro em ação na sua instituição.</p>
            
            <form className="w-full flex flex-col gap-5">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <input type="text" placeholder="Nome Completo" className="eagle-glass-card bg-[#020617]/50 px-6 py-4 rounded-xl text-white outline-none focus:border-blue-500/80 transition-colors w-full font-medium placeholder:text-zinc-600" />
                  <input type="text" placeholder="Cargo" className="eagle-glass-card bg-[#020617]/50 px-6 py-4 rounded-xl text-white outline-none focus:border-blue-500/80 transition-colors w-full font-medium placeholder:text-zinc-600" />
               </div>
               <input type="text" placeholder="Nome da Escola" className="eagle-glass-card bg-[#020617]/50 px-6 py-4 rounded-xl text-white outline-none focus:border-blue-500/80 transition-colors w-full font-medium placeholder:text-zinc-600" />
               <div className="flex flex-col md:flex-row gap-5 mt-2">
                  <input type="email" placeholder="Seu melhor e-mail corporativo" className="eagle-glass-card bg-[#020617]/50 px-6 py-4 rounded-xl text-white outline-none focus:border-blue-500/80 transition-colors flex-1 font-medium placeholder:text-zinc-600" />
                  <button type="submit" className="bg-blue-600 text-white px-8 py-4 rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-blue-500 hover:shadow-[0_0_20px_rgba(59,130,246,0.6)] transition-all shrink-0">
                     Agendar Demo
                  </button>
               </div>
            </form>
         </div>
      </section>

      <Footer />
    </div>
  );
}
