"use client";

import Link from "next/link";
import { Shield, ArrowRight, Mail, MapPin, Phone, Globe, ExternalLink } from "lucide-react";
// Usando ícones genéricos seguros para evitar erros de exportação na versão atual do lucide-react

export default function Footer() {
  const sections = [
    {
       title: "Plataforma",
       links: [
         { name: "Módulos / Produto", href: "/produto" },
         { name: "Segurança & LGPD", href: "/seguranca-lgpd" },
         { name: "Preços & Planos", href: "/precos" },
         { name: "Área do Cliente", href: "/login" },
       ]
    },
    {
       title: "Recursos",
       links: [
         { name: "Blog / Insights", href: "/blog" },
         { name: "Central de Casos", href: "/casos" },
         { name: "FAQ / Suporte", href: "/precos" },
       ]
    },
    {
       title: "Institucional",
       links: [
         { name: "Sobre a Áquila Labs", href: "/sobre" },
         { name: "Manifesto Soberano", href: "/sobre" },
         { name: "Trabalhe Conosco", href: "/sobre" },
         { name: "Falar com Consultor", href: "/contato" },
       ]
    }
  ];

  return (
    <footer className="py-32 px-8 border-t border-white/5 bg-zinc-950/20">
      <div className="max-w-7xl mx-auto flex flex-col gap-24">
        
        {/* Top Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-20">
           <div className="lg:col-span-2 flex flex-col gap-8">
              <Link href="/" className="flex items-center gap-3 group">
                 <div className="w-12 h-12 bg-indigo-500 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                    <Shield className="text-white" size={28} />
                 </div>
                 <div className="flex flex-col -gap-1">
                    <span className="text-2xl font-black uppercase tracking-tighter leading-none">Áquila <span className="text-indigo-500 italic">Pro</span></span>
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 leading-none font-bold">School OS</span>
                 </div>
              </Link>
              <p className="text-zinc-500 text-sm leading-relaxed max-w-sm font-medium">A infraestrutura tecnológica definitiva para a gestão de segurança, presença e comunicação escolar com soberania digital.</p>
              <div className="flex items-center gap-6">
                 <Link href="#" className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors"><Globe size={18} className="text-zinc-500" /></Link>
                 <Link href="#" className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors"><ExternalLink size={18} className="text-zinc-500" /></Link>
                 <Link href="#" className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors"><Mail size={18} className="text-zinc-500" /></Link>
              </div>
           </div>

           {sections.map((section, idx) => (
              <div key={idx} className="flex flex-col gap-8">
                 <h4 className="text-[10px] font-black uppercase tracking-widest text-white border-l-2 border-indigo-500/20 pl-4 font-bold">{section.title}</h4>
                 <div className="flex flex-col gap-4">
                    {section.links.map((link, i) => (
                       <Link key={i} href={link.href} className="text-xs font-black uppercase tracking-widest text-zinc-500 hover:text-white transition-colors">
                          {link.name}
                       </Link>
                    ))}
                 </div>
              </div>
           ))}
        </div>

        {/* Bottom Line */}
        <div className="pt-16 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-10">
           <div className="flex flex-wrap items-center justify-center gap-8 text-[10px] font-black uppercase tracking-widest text-zinc-600 font-bold">
              <span>© 2026 Áquila Labs — Global Education Sovereignty</span>
              <Link href="/seguranca-lgpd" className="hover:text-white transition-colors">Politica de Privacidade</Link>
              <Link href="/seguranca-lgpd" className="hover:text-white transition-colors">Gestão de Dados (LGPD)</Link>
              <Link href="/seguranca-lgpd" className="hover:text-white transition-colors">SLA de Segurança</Link>
           </div>
           
           <div className="flex items-center gap-4 text-xs font-black uppercase tracking-widest text-zinc-400 group cursor-default font-bold">
              Powered by <span className="text-indigo-500 italic">Antigravity Engine</span> 🦅
           </div>
        </div>
      </div>
    </footer>
  );
}
