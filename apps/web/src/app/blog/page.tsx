"use client";

import { Search, ArrowRight, Clock, User, Bookmark } from "lucide-react";

export default function Blog() {
  const posts = [
    {
      id: 1,
      category: "Segurança",
      title: "Presença Automática: Como Reduzi em 40% a Evasão Escolar.",
      excerpt: "Entenda por que o registro biométrico em tempo real é a maior ferramenta de retenção de alunos no século XXI.",
      date: "02 Abr, 2026",
      readTime: "5 min",
      author: "Áquila Labs"
    },
    {
      id: 2,
      category: "LGPD",
      title: "O Guia Definitivo da Biometria Local para Diretores.",
      excerpt: "Navegar pela LGPD pode ser complexo. Saiba como a nossa arquitetura resolve o compliance sem burocracia.",
      date: "28 Mar, 2026",
      readTime: "8 min",
      author: "Jurídico Áquila"
    },
    {
      id: 3,
      category: "Estratégia",
      title: "O Que é um School OS e Por Que Sua Escola Precisa de Um?",
      excerpt: "Sistemas isolados estão morrendo. O futuro é a unificação de segurança, presença e comunicação.",
      date: "15 Mar, 2026",
      readTime: "6 min",
      author: "Áquila Team"
    }
  ];

  return (
    <div className="flex flex-col min-h-screen bg-black text-white">
      <section className="pt-48 pb-20 px-8 flex flex-col items-center">
        <div className="max-w-4xl text-center">
          <h1 className="text-7xl font-black uppercase tracking-tighter mb-10 leading-[0.9]">Hub de <span className="text-transparent bg-clip-text bg-gradient-to-br from-white to-white/30 italic">Autoridade</span> Educacional.</h1>
          <p className="text-zinc-500 text-xl font-medium max-w-xl mx-auto">
             Estratégia, tecnologia e governança para a gestão escolar de elite.
          </p>
          <div className="mt-12 group flex items-center gap-4 bg-white/5 border border-white/10 rounded-full px-8 py-5 max-w-xl mx-auto focus-within:border-indigo-500 transition-all">
             <Search size={24} className="text-zinc-500" />
             <input type="text" placeholder="Pesquisar por tema (ex: LGPD)..." className="bg-transparent border-none outline-none flex-grow text-sm font-bold uppercase tracking-widest placeholder:text-zinc-500" />
          </div>
        </div>
      </section>

      {/* Blog Grid */}
      <section className="py-20 px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12">
          {posts.map((post, idx) => (
            <div key={idx} className="group flex flex-col gap-8 glass p-10 rounded-[56px] border-white/5 hover:border-indigo-500/30 transition-all cursor-pointer">
               <div className="aspect-video rounded-[36px] bg-zinc-900 overflow-hidden relative border border-white/5">
                  <div className="absolute top-4 left-6 bg-indigo-600 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full font-bold">{post.category}</div>
               </div>
               <div className="flex flex-col gap-4">
                  <h3 className="text-2xl font-black group-hover:text-indigo-400 transition-colors uppercase leading-tight">{post.title}</h3>
                  <p className="text-zinc-500 text-sm leading-relaxed font-medium line-clamp-3">{post.excerpt}</p>
               </div>
               <div className="mt-auto pt-6 border-t border-white/5 flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-zinc-500 font-bold">
                  <div className="flex items-center gap-4">
                     <span className="flex items-center gap-2 font-bold"><Clock size={12} /> {post.date}</span>
                     <span className="flex items-center gap-2 font-bold"><Bookmark size={12} /> {post.readTime}</span>
                  </div>
                  <ArrowRight size={16} className="group-hover:text-indigo-400 transition-colors" />
               </div>
            </div>
          ))}
        </div>
      </section>

      {/* Newsletter Mini */}
      <section className="py-32 px-8 bg-zinc-950/40 mt-20 border-t border-white/5">
         <div className="max-w-4xl mx-auto glass p-16 rounded-[64px] border-emerald-500/10 flex flex-col items-center text-center gap-10 bg-emerald-500/5">
            <h2 className="text-4xl font-black uppercase tracking-tighter">Receba Conteúdo <span className="text-emerald-500 italic">VIP</span> Direto no E-mail.</h2>
            <div className="flex flex-col md:flex-row gap-4 w-full max-w-xl font-bold">
               <input type="email" placeholder="nome@escola.com.br" className="bg-white/5 border border-white/10 rounded-full px-8 py-5 focus:border-emerald-500 outline-none text-sm flex-grow transition-all font-bold placeholder:text-zinc-500" />
               <button className="bg-emerald-600 text-white px-12 py-5 rounded-full font-black uppercase tracking-widest hover:bg-emerald-500 shadow-2xl transition-all">Assinar</button>
            </div>
         </div>
      </section>
    </div>
  );
}
