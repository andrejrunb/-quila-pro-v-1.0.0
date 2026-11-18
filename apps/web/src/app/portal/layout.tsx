"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Shield, GraduationCap, Users, Briefcase, Award,
  LogOut, ChevronDown
} from "lucide-react";
import type { PortalRole } from "@/lib/session";

interface PortalLayoutProps {
  children: React.ReactNode;
}

export default function PortalLayout({ children }: PortalLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [gatewayOnline, setGatewayOnline] = useState(false);
  const [showPortalMenu, setShowPortalMenu] = useState(false);
  const [sessionRole, setSessionRole] = useState<PortalRole | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    let active = true;
    fetch("/api/auth/session", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (active && data?.authenticated && data?.user?.role) {
          setSessionRole(data.user.role as PortalRole);
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (process.env.NEXT_PUBLIC_ENABLE_LOCAL_EDGE_WS !== "true") return;
    const isLocalHost =
      window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
    if (!isLocalHost) return;

    let ws: WebSocket | null = null;
    try {
      ws = new WebSocket("ws://localhost:9000");
      ws.onopen = () => setGatewayOnline(true);
      ws.onerror = () => setGatewayOnline(false);
      ws.onclose = () => setGatewayOnline(false);
    } catch {
      ws = null;
    }

    return () => {
      if (ws) ws.close();
    };
  }, []);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      router.push("/login");
    }
  };

  const portals = [
    {
      name: "Portal do Aluno",
      href: "/portal/aluno",
      role: "Aluno",
      icon: GraduationCap,
      color: "from-purple-500/20 to-indigo-500/20 border-purple-500/40 text-purple-300",
      badgeColor: "bg-purple-500/10 text-purple-400 border-purple-500/30",
    },
    {
      name: "Portal do Professor",
      href: "/portal/professor",
      role: "Docente",
      icon: Briefcase,
      color: "from-blue-500/20 to-cyan-500/20 border-blue-500/40 text-blue-300",
      badgeColor: "bg-blue-500/10 text-blue-400 border-blue-500/30",
    },
    {
      name: "Portal dos Pais",
      href: "/portal/pais",
      role: "Responsável",
      icon: Users,
      color: "from-emerald-500/20 to-teal-500/20 border-emerald-500/40 text-emerald-300",
      badgeColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    },
    {
      name: "Portal da Coordenação",
      href: "/portal/coordenacao",
      role: "Coordenação & Direção",
      icon: Award,
      color: "from-amber-500/20 to-orange-500/20 border-amber-500/40 text-amber-300",
      badgeColor: "bg-amber-500/10 text-amber-400 border-amber-500/30",
    },
  ];

  const currentPortal = portals.find((p) => pathname.startsWith(p.href)) || portals[0];
  const canSwitchPortals = sessionRole === "admin" || sessionRole === "coordinator";
  const visiblePortals = canSwitchPortals ? portals : [currentPortal];

  return (
    <div className="min-h-screen bg-[#07090e] text-white flex flex-col font-sans selection:bg-indigo-500 selection:text-white relative overflow-x-hidden">
      {/* Background Ambient Glows */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute -top-32 left-1/4 w-[600px] h-[500px] bg-indigo-600/10 rounded-full blur-[140px]" />
        <div className="absolute top-1/3 -right-32 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[160px]" />
        <div className="absolute -bottom-32 left-1/3 w-[600px] h-[500px] bg-cyan-600/10 rounded-full blur-[150px]" />
      </div>

      {/* Sovereign Portal Header */}
      <header className="sticky top-0 z-50 border-b border-white/8 bg-black/60 backdrop-blur-xl px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-4 sm:gap-6">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 bg-gradient-to-tr from-indigo-600 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/25 group-hover:scale-105 transition-transform">
              <Shield className="text-white" size={18} />
            </div>
            <div className="flex flex-col">
              <span className="text-base font-black tracking-tight uppercase italic flex items-center gap-1 leading-none">
                Áquila<span className="text-indigo-400 not-italic font-bold">Pro</span>
              </span>
              <span className="text-[9px] uppercase tracking-[0.2em] text-zinc-400 font-bold">
                BFF Portal Cloud
              </span>
            </div>
          </Link>

          {/* Current Portal Badge & Role-Scoped Switcher */}
          <div className="relative">
            {canSwitchPortals ? (
              <button
                type="button"
                onClick={() => setShowPortalMenu(!showPortalMenu)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 transition-all text-xs font-semibold cursor-pointer"
              >
                <currentPortal.icon size={14} className="text-indigo-400" />
                <span className="hidden sm:inline text-zinc-200">{currentPortal.name}</span>
                <span className="sm:hidden text-zinc-200">{currentPortal.role}</span>
                <ChevronDown size={12} className="text-zinc-400 ml-0.5" />
              </button>
            ) : (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 text-xs font-semibold">
                <currentPortal.icon size={14} className="text-indigo-400" />
                <span className="hidden sm:inline text-zinc-200">{currentPortal.name}</span>
                <span className="sm:hidden text-zinc-200">{currentPortal.role}</span>
              </div>
            )}

            {canSwitchPortals && showPortalMenu && (
              <div className="absolute left-0 mt-2 w-64 bg-zinc-900/95 border border-white/15 rounded-2xl shadow-2xl backdrop-blur-2xl p-2 z-50 flex flex-col gap-1 animate-fade-in">
                <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-400 px-3 py-1.5">
                  Alternar Portal Educacional
                </span>
                {visiblePortals.map((portal) => {
                  const Icon = portal.icon;
                  const isActive = pathname.startsWith(portal.href);
                  return (
                    <Link
                      key={portal.href}
                      href={portal.href}
                      onClick={() => setShowPortalMenu(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                        isActive
                          ? "bg-indigo-600/20 text-white border border-indigo-500/30"
                          : "text-zinc-300 hover:bg-white/5 hover:text-white"
                      }`}
                    >
                      <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center">
                        <Icon size={14} />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-semibold">{portal.name}</span>
                        <span className="text-[10px] text-zinc-400">{portal.role}</span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Status Controls */}
        <div className="flex items-center gap-3 sm:gap-5">
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
              gatewayOnline
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                : "bg-indigo-500/10 text-indigo-300 border-indigo-500/30"
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                gatewayOnline ? "bg-emerald-400 animate-pulse" : "bg-indigo-400"
              }`}
            />
            <span className="hidden sm:inline">
              {gatewayOnline ? "Gateway Local Ativo" : "BFF Sync Seletivo (LGPD)"}
            </span>
            <span className="sm:hidden">{gatewayOnline ? "Local" : "BFF"}</span>
          </div>

          <button
            type="button"
            aria-label="Sair da sessão"
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white px-3 py-1.5 rounded-lg border border-transparent hover:border-white/10 hover:bg-white/5 transition-all cursor-pointer disabled:opacity-50"
          >
            <LogOut size={13} />
            <span className="hidden sm:inline">{isLoggingOut ? "Saindo..." : "Sair"}</span>
          </button>
        </div>
      </header>

      {/* Portal Main Body */}
      <main className="flex-1 relative z-10 max-w-7xl w-full mx-auto p-4 sm:p-8">
        {children}
      </main>

      {/* Portal Footer */}
      <footer className="relative z-10 border-t border-white/5 py-4 px-8 text-center text-xs text-zinc-400 flex flex-col sm:flex-row items-center justify-between gap-2 max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
          <span>Áquila Pro • Governança LGPD Art. 14 &amp; 16</span>
        </div>
        <div className="flex items-center gap-4 text-[11px]">
          <span>Crachá QR &amp; Chamada Digital</span>
          <span>•</span>
          <span>SigaWeb RPA</span>
          <span>•</span>
          <span>Domínio Sistemas</span>
        </div>
      </footer>
    </div>
  );
}
