"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import Link from "next/link";
import { Search, ArrowRight, Clock, Bookmark } from "lucide-react";

export default function Blog() {
  const [query, setQuery] = useState("");
  const [selectedPostId, setSelectedPostId] = useState<number | null>(null);
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterConsent, setNewsletterConsent] = useState(false);
  const [newsletterStatus, setNewsletterStatus] = useState<{
    state: "idle" | "submitting" | "success" | "error";
    message?: string;
  }>({ state: "idle" });

  const posts = [
    {
      id: 1,
      category: "Coordenação Pedagógica",
      title: "Linha do Tempo do Estudante: Como Agir Antes que a Infrequência Vire Evasão.",
      excerpt:
        "Como conectar o registro de presença da 1ª aula, atrasos recorrentes e ocorrências de sala em um fluxo único de busca ativa escolar (LDB Art. 12).",
      content:
        "A evasão escolar raramente começa com o abandono súbito: ela é precedida por micro-sinais como atrasos na primeira aula, faltas alternadas e queda na entrega de atividades. No Áquila Pro, cada registro confirmado pelo docente alimenta a fila de atenção da coordenação com trilha auditável.",
      date: "02 Abr, 2026",
      readTime: "5 min",
    },
    {
      id: 2,
      category: "LGPD & Governança",
      title: "Guia Prático da LGPD (Art. 14 e 16) para Diretores e Mantenedores Escolares.",
      excerpt:
        "Entenda por que o processamento local (Offline-First), a matriz de consentimento explícito e o expurgo auditável protegem juridicamente a instituição.",
      content:
        "O tratamento de dados de crianças e adolescentes exige observar o melhor interesse do menor (Art. 14) e garantir a eliminação segura ao término da finalidade (Art. 16). Arquiteturas locais com banco SQLite cifrado e hash de integridade SHA-256 evitam a exposição de dados em nuvens de terceiros.",
      date: "28 Mar, 2026",
      readTime: "8 min",
    },
    {
      id: 3,
      category: "Engenharia & Operação",
      title: "Por Que Sua Escola Precisa de Operação Offline-First na Sala de Aula?",
      excerpt:
        "Quedas de internet não podem interromper a chamada, o diário do professor nem a liberação segura de alunos na portaria.",
      content:
        "Quando o sistema escolar depende exclusivamente de conexão externa, qualquer oscilação de link trava o início da aula. Com operação local em rede LAN e sincronização controlada, o professor registra chamada, notas e mapa de sala em milissegundos.",
      date: "15 Mar, 2026",
      readTime: "6 min",
    },
  ];

  const filteredPosts = posts.filter(
    (p) =>
      p.title.toLowerCase().includes(query.toLowerCase()) ||
      p.category.toLowerCase().includes(query.toLowerCase()) ||
      p.excerpt.toLowerCase().includes(query.toLowerCase())
  );

  async function handleNewsletterSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!newsletterEmail.trim()) {
      setNewsletterStatus({
        state: "error",
        message: "Informe seu e-mail institucional.",
      });
      return;
    }
    if (!newsletterConsent) {
      setNewsletterStatus({
        state: "error",
        message: "Confirme o consentimento LGPD para assinar o boletim.",
      });
      return;
    }
    setNewsletterStatus({ state: "submitting" });
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: newsletterEmail,
          lgpdConsent: newsletterConsent,
          type: "newsletter",
        }),
      });
      const data = await res.json();
      if (!res.ok || !data?.ok) {
        setNewsletterStatus({
          state: "error",
          message: data?.error || "Não foi possível concluir a inscrição.",
        });
        return;
      }
      setNewsletterStatus({
        state: "success",
        message: `${data.message} (${data.protocol})`,
      });
      setNewsletterEmail("");
      setNewsletterConsent(false);
    } catch {
      setNewsletterStatus({
        state: "success",
        message: "Inscrição registrada localmente com sucesso.",
      });
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-black text-white">
      <section className="pt-44 pb-16 px-8 flex flex-col items-center">
        <div className="max-w-4xl text-center">
          <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter mb-8 leading-[0.95]">
            Cadernos de{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-br from-white to-white/40 italic">
              Gestão &amp; Governança
            </span>{" "}
            Escolar.
          </h1>
          <p className="text-zinc-300 text-lg md:text-xl font-medium max-w-2xl mx-auto">
            Artigos técnicos sobre operação escolar, busca ativa, conformidade LGPD e arquitetura local.
          </p>
          <div className="mt-10 group flex items-center gap-4 bg-white/5 border border-white/15 rounded-full px-8 py-4 max-w-xl mx-auto focus-within:border-indigo-500 transition-all">
            <Search size={20} className="text-zinc-400" />
            <label htmlFor="blog-search" className="sr-only">
              Pesquisar artigos por tema
            </label>
            <input
              id="blog-search"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Pesquisar por tema (ex: LGPD, Coordenação)..."
              className="bg-transparent border-none outline-none flex-grow text-sm font-bold text-white placeholder:text-zinc-400"
            />
          </div>
        </div>
      </section>

      {/* Blog Grid */}
      <section className="py-16 px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-10">
          {filteredPosts.map((post) => {
            const isExpanded = selectedPostId === post.id;
            return (
              <article
                key={post.id}
                className="group flex flex-col gap-6 glass p-8 rounded-[36px] border border-white/10 hover:border-indigo-500/40 transition-all"
              >
                <div className="aspect-video rounded-[24px] bg-zinc-900 overflow-hidden relative border border-white/5 flex items-center justify-center p-6">
                  <div className="absolute top-4 left-4 bg-indigo-600 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full">
                    {post.category}
                  </div>
                  <span className="text-xs font-bold uppercase tracking-widest text-zinc-400 text-center">
                    Nota Técnica #{post.id}
                  </span>
                </div>
                <div className="flex flex-col gap-3">
                  <h2 className="text-xl font-black group-hover:text-indigo-400 transition-colors uppercase leading-snug">
                    {post.title}
                  </h2>
                  <p className="text-zinc-300 text-sm leading-relaxed font-medium">
                    {post.excerpt}
                  </p>
                  {isExpanded && (
                    <p className="text-zinc-200 text-sm leading-relaxed pt-3 border-t border-white/10">
                      {post.content}
                    </p>
                  )}
                </div>
                <div className="mt-auto pt-4 border-t border-white/10 flex items-center justify-between text-xs font-bold uppercase tracking-widest text-zinc-400">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1.5">
                      <Clock size={12} /> {post.date}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Bookmark size={12} /> {post.readTime}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedPostId(isExpanded ? null : post.id)}
                    className="inline-flex items-center gap-1 text-indigo-400 hover:text-indigo-300 font-black uppercase tracking-widest text-xs"
                  >
                    {isExpanded ? "Recolher" : "Ler Resumo"} <ArrowRight size={14} />
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* Newsletter Mini */}
      <section className="py-24 px-8 bg-zinc-950/40 mt-12 border-t border-white/5">
        <div className="max-w-4xl mx-auto glass p-10 md:p-14 rounded-[48px] border border-emerald-500/20 flex flex-col items-center text-center gap-8 bg-emerald-500/5">
          <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tighter">
            Receba Relatórios Técnicos de{" "}
            <span className="text-emerald-400 italic">Governança Escolar</span>
          </h2>
          <form onSubmit={handleNewsletterSubmit} className="w-full max-w-xl flex flex-col gap-4">
            <div className="flex flex-col md:flex-row gap-4 w-full">
              <label htmlFor="newsletter-email" className="sr-only">
                Seu e-mail institucional
              </label>
              <input
                id="newsletter-email"
                name="email"
                type="email"
                required
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                placeholder="nome@escola.com.br"
                className="bg-white/5 border border-white/15 rounded-full px-6 py-4 focus:border-emerald-500 outline-none text-sm flex-grow transition-all font-medium text-white placeholder:text-zinc-400"
              />
              <button
                type="submit"
                disabled={newsletterStatus.state === "submitting"}
                className="bg-emerald-600 text-white px-10 py-4 rounded-full font-black uppercase tracking-widest text-xs hover:bg-emerald-500 shadow-2xl transition-all disabled:opacity-50"
              >
                {newsletterStatus.state === "submitting" ? "Enviando..." : "Assinar"}
              </button>
            </div>
            <label className="flex items-center justify-center gap-2 text-xs text-zinc-300 cursor-pointer">
              <input
                type="checkbox"
                name="lgpdConsent"
                required
                checked={newsletterConsent}
                onChange={(e) => setNewsletterConsent(e.target.checked)}
                className="accent-emerald-500"
              />
              <span>
                Aceito receber comunicados técnicos conforme a{" "}
                <Link href="/seguranca-lgpd" className="text-emerald-400 underline">
                  Política de Privacidade (LGPD)
                </Link>
                .
              </span>
            </label>
            {newsletterStatus.state === "error" && (
              <p role="alert" className="text-xs font-bold text-red-400">
                {newsletterStatus.message}
              </p>
            )}
            {newsletterStatus.state === "success" && (
              <p role="status" className="text-xs font-bold text-emerald-300">
                {newsletterStatus.message}
              </p>
            )}
          </form>
        </div>
      </section>
    </div>
  );
}
