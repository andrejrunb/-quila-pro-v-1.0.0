"use client";

import Link from "next/link";
import { Shield, Mail, Globe, ExternalLink } from "lucide-react";

export default function Footer() {
  const sections = [
    {
      title: "Plataforma",
      links: [
        { name: "Módulos / Produto", href: "/produto" },
        { name: "Soluções por Cargo", href: "/solucoes" },
        { name: "Segurança & LGPD", href: "/seguranca-lgpd" },
        { name: "Preços & Planos", href: "/precos" },
        { name: "Área do Cliente", href: "/login" },
      ],
    },
    {
      title: "Recursos",
      links: [
        { name: "Blog / Insights", href: "/blog" },
        { name: "Central de Casos", href: "/casos" },
        { name: "FAQ / Suporte", href: "/precos#faq" },
      ],
    },
    {
      title: "Institucional",
      links: [
        { name: "Sobre a Áquila Labs", href: "/sobre" },
        { name: "Manifesto Soberano", href: "/sobre#manifesto" },
        { name: "Governança de Dados", href: "/seguranca-lgpd#governanca" },
        { name: "Falar com Consultor", href: "/contato" },
      ],
    },
  ];

  return (
    <footer className="py-24 px-8 border-t border-white/5 bg-zinc-950/40">
      <div className="max-w-7xl mx-auto flex flex-col gap-20">
        {/* Top Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-16">
          <div className="lg:col-span-2 flex flex-col gap-6">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-12 h-12 bg-indigo-500 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                <Shield className="text-white" size={28} />
              </div>
              <div className="flex flex-col">
                <span className="text-2xl font-black uppercase tracking-tighter leading-none text-white">
                  Áquila <span className="text-indigo-500 italic">Pro</span>
                </span>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 leading-none mt-1">
                  School OS • Offline-First
                </span>
              </div>
            </Link>
            <p className="text-zinc-400 text-sm leading-relaxed max-w-sm font-medium">
              Infraestrutura local para gestão de presença assistida, diário docente, linha do tempo operacional do estudante e comunicação escolar sob governança LGPD (Art. 14 e 16).
            </p>
            <div className="flex items-center gap-4">
              <Link
                href="/produto"
                aria-label="Arquitetura do Produto"
                className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors"
              >
                <Globe size={18} className="text-zinc-400" />
              </Link>
              <Link
                href="/seguranca-lgpd"
                aria-label="Documentação de Segurança e LGPD"
                className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors"
              >
                <ExternalLink size={18} className="text-zinc-400" />
              </Link>
              <Link
                href="/contato"
                aria-label="Entrar em Contato"
                className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors"
              >
                <Mail size={18} className="text-zinc-400" />
              </Link>
            </div>
          </div>

          {sections.map((section, idx) => (
            <div key={idx} className="flex flex-col gap-6">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-white border-l-2 border-indigo-500/40 pl-4">
                {section.title}
              </h4>
              <div className="flex flex-col gap-3">
                {section.links.map((link, i) => (
                  <Link
                    key={i}
                    href={link.href}
                    className="text-xs font-bold uppercase tracking-widest text-zinc-400 hover:text-white transition-colors"
                  >
                    {link.name}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Line */}
        <div className="pt-12 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex flex-wrap items-center justify-center gap-8 text-[10px] font-black uppercase tracking-widest text-zinc-400">
            <span>© 2026 Áquila Labs — Global Education Sovereignty</span>
            <Link href="/seguranca-lgpd#privacidade" className="hover:text-white transition-colors">
              Política de Privacidade
            </Link>
            <Link href="/seguranca-lgpd#governanca" className="hover:text-white transition-colors">
              Gestão de Dados (LGPD)
            </Link>
            <Link href="/seguranca-lgpd#sla" className="hover:text-white transition-colors">
              Arquitetura &amp; SLA Local
            </Link>
          </div>

          <div className="flex items-center gap-4 text-xs font-black uppercase tracking-widest text-zinc-400 group cursor-default">
            Powered by <span className="text-indigo-500 italic">Antigravity Engine</span> 🦅
          </div>
        </div>
      </div>
    </footer>
  );
}
