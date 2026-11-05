"use client";

import { useState } from "react";
import Link from "next/link";
import { Shield, Menu, X } from "lucide-react";

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { name: "Intro", href: "/#hero" },
    { name: "Vantagens", href: "/#benefits" },
    { name: "Tecnologia", href: "/#tech" },
    { name: "ROI", href: "/#roi" },
    { name: "Módulos", href: "/produto" },
    { name: "Soluções", href: "/solucoes" },
    { name: "Segurança & LGPD", href: "/seguranca-lgpd" },
    { name: "Preços", href: "/precos" },
    { name: "Contato", href: "/contato" },
  ];

  return (
    <nav
      aria-label="Navegação Principal"
      className="fixed top-0 left-0 w-full z-50 px-6 md:px-8 py-4 flex flex-col glass border-b border-white/5 bg-black/75 backdrop-blur-xl"
    >
      <div className="w-full max-w-7xl mx-auto flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/20 group-hover:scale-110 transition-transform">
            <Shield className="text-white" size={20} />
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-black tracking-tighter uppercase italic text-white flex gap-1">
              Áquila<span className="text-indigo-500 not-italic">Pro</span>
            </span>
          </div>
        </Link>

        <div className="hidden lg:flex items-center gap-6">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-300 hover:text-white transition-colors"
            >
              {link.name}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-4">
          <Link
            href="/login"
            className="hidden sm:block text-[10px] font-black uppercase tracking-[0.2em] text-white hover:text-indigo-400 transition-colors"
          >
            Portais Educacionais
          </Link>
          <Link
            href="/login"
            className="bg-indigo-600 px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] hover:bg-indigo-500 transition-all text-white no-underline shadow-lg shadow-indigo-600/20"
          >
            Acesso Soberano
          </Link>
          <button
            type="button"
            className="lg:hidden text-white p-2 rounded-lg hover:bg-white/10 transition-colors"
            aria-label="Menu"
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-nav-drawer"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div
          id="mobile-nav-drawer"
          className="lg:hidden w-full pt-4 pb-6 mt-4 border-t border-white/10 flex flex-col gap-3"
        >
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-widest text-zinc-200 hover:bg-white/10 hover:text-white transition-colors"
            >
              {link.name}
            </Link>
          ))}
          <div className="pt-2 border-t border-white/10 flex flex-col gap-2">
            <Link
              href="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 text-xs font-bold uppercase tracking-widest text-indigo-400"
            >
              Portais Educacionais
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
