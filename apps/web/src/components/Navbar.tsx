"use client";

import Link from "next/link";
import { Shield, ArrowRight, Menu } from "lucide-react";

export default function Navbar() {
  const navLinks = [
    { name: "Intro", href: "#hero" },
    { name: "Vantagens", href: "#benefits" },
    { name: "Tecnologia", href: "#tech" },
    { name: "ROI", href: "#roi" },
  ];

  return (
    <nav className="fixed top-0 left-0 w-full z-50 px-8 py-6 flex items-center justify-between glass border-b border-white/5 bg-black/40 backdrop-blur-xl">
      <Link href="/" className="flex items-center gap-3 group">
         <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/20 group-hover:scale-110 transition-transform">
            <Shield className="text-white" size={20} />
         </div>
         <div className="flex flex-col -gap-1">
            <span className="text-xl font-black tracking-tighter uppercase italic text-white flex gap-1">
              Áquila<span className="text-indigo-500 not-italic">Pro</span>
            </span>
         </div>
      </Link>

      <div className="hidden lg:flex items-center gap-10">
        {navLinks.map((link) => (
          <a key={link.href} href={link.href} className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 hover:text-white transition-colors">
            {link.name}
          </a>
        ))}
      </div>

      <div className="flex items-center gap-6">
         <Link href="/login" className="hidden sm:block text-[10px] font-black uppercase tracking-[0.2em] text-white hover:text-indigo-400 transition-colors">
            Acesso Cliente
         </Link>
         <Link href="#contact" className="bg-indigo-600 px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-[0.2em] hover:bg-indigo-500 transition-all text-white no-underline shadow-lg shadow-indigo-600/20">
            Consignar
         </Link>
         <button className="lg:hidden text-white" aria-label="Menu">
            <Menu size={24} />
         </button>
      </div>
    </nav>
  );
}
