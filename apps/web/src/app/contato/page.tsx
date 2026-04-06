"use client";

import { Shield, Mail, Phone, MapPin, ArrowRight, CheckCircle2 } from "lucide-react";

export default function Contato() {
  return (
    <div className="flex flex-col min-h-screen bg-black text-white">
      <section className="pt-48 pb-20 px-8 flex flex-col items-center">
        <div className="max-w-4xl text-center">
          <h2 className="text-xs font-black uppercase tracking-[0.5em] text-indigo-500 mb-8 font-bold">Initiate Your Sovereignty</h2>
          <h1 className="text-7xl font-black uppercase tracking-tighter mb-10 leading-[0.9]">Vamos Iniciar <span className="text-transparent bg-clip-text bg-gradient-to-br from-white to-white/40 italic">O Diálogo</span>.</h1>
          <p className="text-zinc-500 text-xl font-medium max-w-xl mx-auto">
             Transforme a segurança e a gestão da sua escola hoje mesmo. Nossos consultores entrarão em contato em até 4h úteis.
          </p>
        </div>
      </section>

      {/* Form & Info Section */}
      <section className="py-20 px-8">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-24">
          {/* Form */}
          <div className="glass p-12 rounded-[56px] border-white/5 bg-zinc-950/20">
             <form className="flex flex-col gap-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   <div className="flex flex-col gap-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 font-bold ml-4">Seu Nome</label>
                      <input type="text" placeholder="Ex: Roberto Silva" className="bg-white/5 border border-white/10 rounded-full px-8 py-4 focus:border-indigo-500 outline-none text-sm transition-all" />
                   </div>
                   <div className="flex flex-col gap-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 font-bold ml-4">Nome da Instituição</label>
                      <input type="text" placeholder="Ex: Colégio Magnum" className="bg-white/5 border border-white/10 rounded-full px-8 py-4 focus:border-indigo-500 outline-none text-sm transition-all" />
                   </div>
                </div>
                <div className="flex flex-col gap-2">
                   <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 font-bold ml-4">E-mail Corporativo</label>
                   <input type="email" placeholder="nome@escola.com.br" className="bg-white/5 border border-white/10 rounded-full px-8 py-4 focus:border-indigo-500 outline-none text-sm transition-all" />
                </div>
                <div className="flex flex-col gap-2">
                   <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 font-bold ml-4">Sua Mensagem</label>
                   <textarea placeholder="Como o Áquila Pro pode ajudar sua escola hoje?" className="bg-white/5 border border-white/10 rounded-[32px] px-8 py-6 focus:border-indigo-500 outline-none text-sm h-32 transition-all"></textarea>
                </div>
                <button className="bg-white text-black py-6 rounded-full font-black uppercase tracking-widest shadow-2xl hover:bg-zinc-200 transition-all text-sm mt-4">
                   Agendar Minha Apresentação <ArrowRight className="inline-block ml-2" size={20} />
                </button>
             </form>
          </div>

          {/* Social Proof & Contact Info */}
          <div className="flex flex-col gap-12 py-10">
             <div className="flex flex-col gap-4">
                <h4 className="text-2xl font-black uppercase tracking-tighter">Por que agendar?</h4>
                <div className="flex flex-col gap-6">
                   <div className="flex items-center gap-4 text-zinc-400 font-bold">
                      <CheckCircle2 size={24} className="text-indigo-500" />
                      Auditoria de Infraestrutura Gratuita
                   </div>
                   <div className="flex items-center gap-4 text-zinc-400 font-bold">
                      <CheckCircle2 size={24} className="text-indigo-500" />
                      Simulação de ROI Baseada em Evasão
                   </div>
                   <div className="flex items-center gap-4 text-zinc-400 font-bold">
                      <CheckCircle2 size={24} className="text-indigo-500" />
                      Demo Real da Ghost-Vision Architecture
                   </div>
                </div>
             </div>

             <div className="flex flex-col gap-8 opacity-60">
                <div className="flex items-center gap-6">
                   <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center">
                      <Mail size={24} className="text-zinc-500" />
                   </div>
                   <span className="text-lg font-bold">contato@aquilalabs.io</span>
                </div>
                <div className="flex items-center gap-6">
                   <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center">
                      <Phone size={24} className="text-zinc-500" />
                   </div>
                   <span className="text-lg font-bold">+55 (11) 9999-9999</span>
                </div>
             </div>
          </div>
        </div>
      </section>
    </div>
  );
}
