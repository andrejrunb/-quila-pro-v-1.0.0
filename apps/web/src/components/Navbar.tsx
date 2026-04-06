"use client";

import Link from "next/link";
import { Shield, ArrowRight, Menu } from "lucide-react";

export default function Navbar() {
  const navLinks = [
    { name: "Produto", href: "/produto" },
    { name: "Soluções", href: "/solucoes" },
    { name: "Preços", href: "/precos" },
    { name: "Segurança", href: "/seguranca-lgpd" },
    { name: "Casos", href: "/casos" },
    { name: "Blog", href: "/blog" },
  ];

  return (
    <nav className="fixed top-0 left-0 w-full z-50 px-8 py-6 flex items-center justify-between glass border-b border-white/5 bg-black/40">
      <Link href="/" className="flex items-center gap-3 group">
         <div className="w-10 h-10 bg-indigo-500 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
            <Shield className="text-white" size={24} />
         </div>
         <div className="flex flex-col -gap-1">
            <span className="text-xl font-black uppercase tracking-tighter leading-none">Áquila <span className="text-indigo-500 italic">Pro</span></span>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 leading-none font-bold">School OS</span>
         </div>
      </Link>

      <div className="hidden lg:flex items-center gap-10">
        {navLinks.map((link) => (
          <Link key={link.href} href={link.href} className="text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-white transition-colors">
            {link.name}
          </Link>
        ))}
      </div>

      <div className="flex items-center gap-6">
         <Link href="/login" className="hidden sm:block text-[10px] font-black uppercase tracking-widest text-white hover:text-indigo-400 transition-colors">
            Acesso Cliente
         </Link>
         <Link href="/contato" className="bg-white text-black px-8 py-3 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-zinc-200 transition-all shadow-xl">
            Agendar Demo <ArrowRight className="inline-block ml-1" size={12} />
         </Link>
         <button className="lg:hidden text-white" aria-label="Menu">
            <Menu size={24} />
         </button>
      </div>
    </nav>
  );
}
