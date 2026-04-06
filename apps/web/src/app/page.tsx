"use client";

import { useState } from "react";
import Image from "next/image";
import { 
  Shield, Zap, Globe, Cpu, CheckCircle2, ArrowRight, MessageSquare, Target, 
  ChevronDown, GraduationCap, Users, Calendar, Landmark, Briefcase, FileText, Contact 
} from "lucide-react";

export default function Home() {
  const [showPortals, setShowPortals] = useState(false);

  const portals = [
    { name: "Portal dos Pais", icon: <Users size={18} />, href: "#login/pais" },
    { name: "Espaço do Aluno", icon: <GraduationCap size={18} />, href: "#login/alunos" },
    { name: "Coordenação", icon: <Calendar size={18} />, href: "#login/coordenadores" },
    { name: "Direção Geral", icon: <Landmark size={18} />, href: "#login/direcao" },
    { name: "Recursos Humanos (RH)", icon: <Briefcase size={18} />, href: "#login/rh" },
    { name: "Secretaria Digital", icon: <FileText size={18} />, href: "#login/secretaria" },
    { name: "Operações & Staff", icon: <Contact size={18} />, href: "#login/funcionarios" },
  ];

  return (
    <div className="flex flex-col min-h-screen">
      {/* Navigation */}

      {/* BLOCK 1: Hero Section (v3441) */}
      <section className="relative pt-48 pb-32 px-8 flex flex-col items-center overflow-hidden">
        {/* Deep Glow Background */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[700px] bg-indigo-500/10 blur-[200px] rounded-full -z-10 opacity-40" />
        
        <div className="max-w-7xl w-full grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
          <div className="flex flex-col gap-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-bold uppercase tracking-[0.2em] animate-pulse">
              <Zap size={14} /> Sovereign Education OS
            </div>
            <h1 className="text-7xl md:text-9xl font-black leading-[0.85] tracking-tighter text-white">
              O Sistema <span className="text-transparent bg-clip-text bg-gradient-to-br from-white via-white to-white/20">Operacional</span> Escolar Soberano.
            </h1>
            <p className="text-xl text-zinc-400 leading-relaxed max-w-xl font-medium">
              Segurança, Presença Automática e Comunicação Familiar unificadas em uma única zona de tecnologia. Reduza a evasão e automatize a burocracia com a arquitetura <span className="text-white italic">Ghost-Vision</span>.
            </p>
            <div className="flex flex-wrap gap-6 pt-4">
              <button className="bg-white text-black px-12 py-6 rounded-full font-black flex items-center gap-3 hover:bg-zinc-200 transition-all text-sm uppercase tracking-widest shadow-2xl">
                Agendar Conversa <ArrowRight size={20} />
              </button>
              <button className="glass px-12 py-6 rounded-full font-black hover:bg-white/5 transition-all text-sm uppercase tracking-widest text-zinc-300">
                Ver Áquila em Ação
              </button>
            </div>
          </div>
          
          <div className="relative group">
            <div className="absolute inset-0 bg-indigo-500/20 blur-[100px] rounded-full opacity-30 group-hover:opacity-50 transition-opacity" />
            <div className="relative aspect-[4/5] rounded-[64px] overflow-hidden glass p-4 border-white/10 shadow-[0_0_100px_rgba(0,0,0,0.5)]">
              <Image
                src="/aquila_human_security_115_v1_1775171364148.png"
                alt="Áquila Sovereign Dashboard"
                fill
                className="object-cover rounded-[48px] brightness-75 group-hover:brightness-100 transition-all duration-700"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80" />
              
              {/* Trust Badge overlay (Cialdini Authority) */}
              <div className="absolute bottom-12 left-12 glass p-8 rounded-[32px] border-white/10 backdrop-blur-3xl flex items-center gap-5 max-w-xs border-l-4 border-indigo-500">
                <div className="w-14 h-14 bg-indigo-500/20 text-indigo-400 rounded-2xl flex items-center justify-center shadow-inner">
                  <Shield size={28} />
                </div>
                <div>
                  <div className="text-sm font-black text-white uppercase tracking-wider">Privacidade Soberana</div>
                  <div className="text-[10px] text-zinc-500 font-bold mt-1 uppercase tracking-widest">Processamento 100% Local (Ghost-Vision Architecture)</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* BLOCK 2: 3 Benefícios Centrais (Executive Value) */}
      <section id="benefits" className="py-24 px-8 border-y border-white/5 bg-zinc-950/20">
        <div className="max-w-7xl mx-auto flex flex-col items-center">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-16 w-full">
                <div className="flex flex-col gap-6 p-8 rounded-[40px] hover:bg-white/5 transition-all group">
                    <div className="w-16 h-16 bg-emerald-500/10 text-emerald-400 rounded-3xl flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Shield size={32} />
                    </div>
                    <h3 className="text-2xl font-black uppercase tracking-tighter">Segurança & Presença</h3>
                    <p className="text-zinc-500 text-sm leading-relaxed">
                        Automatize a chamada em 0.2s e receba alertas de evasão ou risco em tempo real. Segurança que não interfere no ensino.
                    </p>
                </div>
                <div className="flex flex-col gap-6 p-8 rounded-[40px] hover:bg-white/5 transition-all group">
                    <div className="w-16 h-16 bg-indigo-500/10 text-indigo-400 rounded-3xl flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Globe size={32} />
                    </div>
                    <h3 className="text-2xl font-black uppercase tracking-tighter">Transparência Real</h3>
                    <p className="text-zinc-500 text-sm leading-relaxed">
                        Dê aos pais paz de espírito total com monitoramento de presença e atualizações biometrizadas via WhatsApp.
                    </p>
                </div>
                <div className="flex flex-col gap-6 p-8 rounded-[40px] hover:bg-white/5 transition-all group">
                    <div className="w-16 h-16 bg-amber-500/10 text-amber-400 rounded-3xl flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Target size={32} />
                    </div>
                    <h3 className="text-2xl font-black uppercase tracking-tighter">Zero Burocracia</h3>
                    <p className="text-zinc-500 text-sm leading-relaxed">
                        Elimine diários de papel e relatórios manuais. O Córtex Docente faz o trabalho pesado para que o professor foque no aluno.
                    </p>
                </div>
            </div>
        </div>
      </section>

      {/* BLOCK 3: Como Funciona em 3 Passos (Strategic Flow) */}
      <section className="py-32 px-8 bg-black relative">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-24">
            <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter">O Caminho para a <span className="text-indigo-500">Soberania</span></h2>
            <p className="text-zinc-500 mt-4 text-lg">Três passos para transformar a gestão da sua escola.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
            {/* Step 1 */}
            <div className="glass p-12 rounded-[48px] border-white/5 relative z-10">
              <div className="text-6xl font-black opacity-10 absolute top-8 right-12 italic">01</div>
              <h4 className="text-xl font-black text-indigo-400 mb-4 uppercase tracking-widest">Setup Local</h4>
              <p className="text-zinc-400 leading-relaxed font-medium">Configuramos a infraestrutura <span className="text-white">Edge AI</span> e os portais de acesso para sua equipe.</p>
            </div>
            {/* Step 2 */}
            <div className="glass p-12 rounded-[48px] border-indigo-500/30 bg-indigo-500/5 relative z-10 shadow-[0_0_50px_rgba(79,70,229,0.1)]">
              <div className="text-6xl font-black opacity-10 absolute top-8 right-12 italic">02</div>
              <h4 className="text-xl font-black text-indigo-400 mb-4 uppercase tracking-widest">Córtex Operacional</h4>
              <p className="text-zinc-400 leading-relaxed font-medium">Seus professores e coordenação utilizam o <span className="text-white">Córtex Docente</span> para automatizar o dia a dia.</p>
            </div>
            {/* Step 3 */}
            <div className="glass p-12 rounded-[48px] border-white/5 relative z-10">
              <div className="text-6xl font-black opacity-10 absolute top-8 right-12 italic">03</div>
              <h4 className="text-xl font-black text-indigo-400 mb-4 uppercase tracking-widest">Dashboard Hub</h4>
              <p className="text-zinc-400 leading-relaxed font-medium">Direção e famílias acompanham tudo em tempo real através de <span className="text-white">dashboards inteligentes</span>.</p>
            </div>
            
            {/* Connecting Line (Desktop) */}
            <div className="hidden md:block absolute top-1/2 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent -translate-y-1/2 -z-0" />
          </div>
        </div>
      </section>

      {/* BLOCK 4: Prova Social & Números (Cialdini Numbers) */}
      <section className="py-24 px-8 bg-zinc-950/40">
        <div className="max-w-7xl mx-auto flex flex-col items-center">
          <div className="flex flex-wrap justify-center gap-20 mb-20 opacity-40 grayscale hover:grayscale-0 transition-all">
             <div className="text-2xl font-black italic tracking-tighter">COLEGIO <span className="text-zinc-500">ALPHA</span></div>
             <div className="text-2xl font-black italic tracking-tighter">INSTITUTO <span className="text-zinc-500">SAVANT</span></div>
             <div className="text-2xl font-black italic tracking-tighter">SCHOOL <span className="text-zinc-500">MATRIX</span></div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12 w-full text-center">
            <div>
              <div className="text-5xl font-black text-white mb-2">0.2<span className="text-indigo-500">s</span></div>
              <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">Tempo de Presença</p>
            </div>
            <div>
              <div className="text-5xl font-black text-white mb-2">+98<span className="text-indigo-500">%</span></div>
              <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">Precisão Biométrica</p>
            </div>
            <div>
              <div className="text-5xl font-black text-white mb-2">-40<span className="text-indigo-500">%</span></div>
              <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">Evasão Escolar</p>
            </div>
            <div>
              <div className="text-5xl font-black text-white mb-2">100<span className="text-indigo-500">%</span></div>
              <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">Privacidade Local</p>
            </div>
          </div>
        </div>
      </section>

      {/* BLOCK 5: Segmentação por Persona (Strategic Targeting) */}
      <section className="py-32 px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-end gap-8 mb-20">
            <div className="max-w-2xl">
              <h2 className="text-5xl font-black uppercase tracking-tighter leading-none mb-4 italic">Soluções que <span className="text-indigo-500 not-italic">Falam sua Língua</span>.</h2>
              <p className="text-zinc-500 text-lg">O Áquila Pro se adapta ao seu papel estrategicamente.</p>
            </div>
            <button className="text-white font-black uppercase tracking-[0.2em] text-xs pb-2 border-b-2 border-indigo-500">Ver todas as soluções</button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Persona: Private Schools */}
            <div className="group relative glass p-10 rounded-[56px] border-white/5 hover:border-indigo-500/30 transition-all overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-3xl -z-10 group-hover:bg-indigo-500/20 transition-all" />
               <h4 className="text-sm font-black text-indigo-500 uppercase tracking-widest mb-2">Escolas Privadas</h4>
               <h3 className="text-3xl font-black text-white mb-6 leading-tight">Diferenciação e Valor Percebido.</h3>
               <p className="text-zinc-500 text-sm leading-relaxed mb-8">Escale o valor da sua mensalidade oferecendo segurança de última geração e transparência total para os pais.</p>
               <button aria-label="Ver soluções para Escolas Privadas" className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center group-hover:bg-white group-hover:text-black transition-all">
                 <ArrowRight size={20} />
               </button>
            </div>
            {/* Persona: Networks */}
            <div className="group relative glass p-10 rounded-[56px] border-white/5 hover:border-indigo-500/30 transition-all overflow-hidden bg-indigo-500/5 border-indigo-500/20">
               <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 blur-3xl -z-10" />
               <h4 className="text-sm font-black text-indigo-500 uppercase tracking-widest mb-2">Redes de Ensino</h4>
               <h3 className="text-3xl font-black text-white mb-6 leading-tight">Visão Swarm e Gestão Centralizada.</h3>
               <p className="text-zinc-500 text-sm leading-relaxed mb-8">Monitore múltiplas unidades de uma única tela. Dados unificados, governança centralizada e conformidade total.</p>
               <button aria-label="Ver soluções para Redes de Ensino" className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center group-hover:bg-white group-hover:text-black transition-all">
                 <ArrowRight size={20} />
               </button>
            </div>
            {/* Persona: Public sector */}
            <div className="group relative glass p-10 rounded-[56px] border-white/5 hover:border-indigo-500/30 transition-all overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-3xl -z-10 group-hover:bg-emerald-500/20 transition-all" />
               <h4 className="text-sm font-black text-emerald-500 uppercase tracking-widest mb-2">Gestão Pública</h4>
               <h3 className="text-3xl font-black text-white mb-6 leading-tight">Eficiência Fiscal e Redução de Risco.</h3>
               <p className="text-zinc-500 text-sm leading-relaxed mb-8">Garanta a presença real dos alunos para repasses governamentais e proteja o patrimônio público com visão inteligente.</p>
               <button aria-label="Ver soluções para Gestão Pública" className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-black transition-all">
                 <ArrowRight size={20} />
               </button>
            </div>
          </div>
        </div>
      </section>

      {/* BLOCK 6: Conteúdo Pilar & Hub (Authority Building) */}
      <section className="py-32 px-8 bg-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl font-black uppercase tracking-tighter">Hub de <span className="text-indigo-500 italic">Soberania</span> Digital</h2>
            <p className="text-zinc-500 mt-4">Educação e estratégia para a gestão escolar moderna.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            <div className="flex flex-col gap-6 group cursor-pointer">
              <div className="aspect-video rounded-[32px] overflow-hidden bg-zinc-900 border border-white/5 group-hover:border-indigo-500/50 transition-all">
                <div className="w-full h-full bg-gradient-to-br from-indigo-500/20 to-transparent flex items-center justify-center">
                  <Shield size={48} className="text-indigo-500 opacity-30" />
                </div>
              </div>
              <div>
                <h4 className="text-xs font-black text-indigo-500 uppercase tracking-widest mb-2">Artigo de Estratégia</h4>
                <h3 className="text-xl font-black group-hover:text-indigo-400 transition-colors">Como a Presença Automática Reduz a Evasão em até 40%.</h3>
              </div>
            </div>
            <div className="flex flex-col gap-6 group cursor-pointer">
              <div className="aspect-video rounded-[32px] overflow-hidden bg-zinc-900 border border-white/5 group-hover:border-indigo-500/50 transition-all">
                <div className="w-full h-full bg-gradient-to-br from-indigo-500/20 to-transparent flex items-center justify-center">
                  <FileText size={48} className="text-indigo-500 opacity-30" />
                </div>
              </div>
              <div>
                <h4 className="text-xs font-black text-indigo-500 uppercase tracking-widest mb-2">Guia Prático</h4>
                <h3 className="text-xl font-black group-hover:text-indigo-400 transition-colors">LGPD Escolar: O Guia Definitivo para Diretores e DPOs.</h3>
              </div>
            </div>
            <div className="flex flex-col gap-6 group cursor-pointer">
              <div className="aspect-video rounded-[32px] overflow-hidden bg-zinc-900 border border-white/5 group-hover:border-indigo-500/50 transition-all">
                <div className="w-full h-full bg-gradient-to-br from-indigo-500/20 to-transparent flex items-center justify-center">
                  <Zap size={48} className="text-indigo-500 opacity-30" />
                </div>
              </div>
              <div>
                <h4 className="text-xs font-black text-indigo-500 uppercase tracking-widest mb-2">Tecnologia</h4>
                <h3 className="text-xl font-black group-hover:text-indigo-400 transition-colors">Entendendo a Arquitetura Ghost-Vision no Áquila Pro.</h3>
              </div>
            </div>
          </div>
          
          <div className="mt-20 flex justify-center">
            <button className="bg-indigo-600 text-white px-12 py-5 rounded-full font-black uppercase tracking-widest hover:bg-indigo-500 transition-all shadow-xl shadow-indigo-500/20">
               Explorar Hub de Conteúdo
            </button>
          </div>
        </div>
      </section>

    </div>
  );
}
