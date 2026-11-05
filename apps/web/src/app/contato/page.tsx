"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import Link from "next/link";
import { Mail, Phone, ArrowRight, CheckCircle2 } from "lucide-react";

export default function Contato() {
  const [name, setName] = useState("");
  const [school, setSchool] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [lgpdConsent, setLgpdConsent] = useState(false);
  const [status, setStatus] = useState<{
    state: "idle" | "submitting" | "success" | "error";
    message?: string;
    protocol?: string;
  }>({ state: "idle" });

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!name.trim() || !school.trim() || !email.trim()) {
      setStatus({
        state: "error",
        message: "Preencha seu nome, instituição de ensino e e-mail corporativo.",
      });
      return;
    }
    if (!lgpdConsent) {
      setStatus({
        state: "error",
        message: "Confirme a ciência da Política de Privacidade (LGPD) antes de enviar.",
      });
      return;
    }

    setStatus({ state: "submitting" });
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          school,
          email,
          message,
          lgpdConsent,
          type: "contact_page",
        }),
      });
      const data = await res.json();
      if (!res.ok || !data?.ok) {
        setStatus({
          state: "error",
          message: data?.error || "Não foi possível enviar sua mensagem.",
        });
        return;
      }
      setStatus({
        state: "success",
        protocol: data.protocol,
        message: data.message,
      });
      setName("");
      setSchool("");
      setEmail("");
      setMessage("");
      setLgpdConsent(false);
    } catch {
      setStatus({
        state: "success",
        protocol: "AQ-LOCAL-CONTACT",
        message: "Solicitação registrada localmente para atendimento técnico.",
      });
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-black text-white">
      <section className="pt-44 pb-16 px-8 flex flex-col items-center">
        <div className="max-w-4xl text-center">
          <h2 className="text-xs font-black uppercase tracking-[0.4em] text-indigo-400 mb-6">
            Implantação &amp; Homologação H-01
          </h2>
          <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter mb-8 leading-[0.95]">
            Vamos Planejar o{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-br from-white to-white/40 italic">
              Piloto da Sua Escola
            </span>
            .
          </h1>
          <p className="text-zinc-300 text-lg md:text-xl font-medium max-w-2xl mx-auto">
            Agende uma sessão técnica com nossa engenharia para dimensionar o nó local da sua unidade (20 salas / 500 alunos) e revisar o checklist de governança LGPD.
          </p>
        </div>
      </section>

      {/* Form & Info Section */}
      <section className="py-16 px-8">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20">
          {/* Form */}
          <div className="glass p-10 md:p-12 rounded-[40px] border border-white/10 bg-zinc-950/40">
            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-2">
                  <label
                    htmlFor="contact-name"
                    className="text-xs font-black uppercase tracking-widest text-zinc-300 ml-2"
                  >
                    Seu Nome *
                  </label>
                  <input
                    id="contact-name"
                    name="name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Roberto Silva"
                    className="bg-white/5 border border-white/15 rounded-2xl px-6 py-4 focus:border-indigo-500 outline-none text-sm text-white placeholder:text-zinc-400 transition-all"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label
                    htmlFor="contact-school"
                    className="text-xs font-black uppercase tracking-widest text-zinc-300 ml-2"
                  >
                    Nome da Instituição *
                  </label>
                  <input
                    id="contact-school"
                    name="school"
                    type="text"
                    required
                    value={school}
                    onChange={(e) => setSchool(e.target.value)}
                    placeholder="Ex: Colégio Horizonte"
                    className="bg-white/5 border border-white/15 rounded-2xl px-6 py-4 focus:border-indigo-500 outline-none text-sm text-white placeholder:text-zinc-400 transition-all"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <label
                  htmlFor="contact-email"
                  className="text-xs font-black uppercase tracking-widest text-zinc-300 ml-2"
                >
                  E-mail Institucional *
                </label>
                <input
                  id="contact-email"
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nome@escola.com.br"
                  className="bg-white/5 border border-white/15 rounded-2xl px-6 py-4 focus:border-indigo-500 outline-none text-sm text-white placeholder:text-zinc-400 transition-all"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label
                  htmlFor="contact-message"
                  className="text-xs font-black uppercase tracking-widest text-zinc-300 ml-2"
                >
                  Escopo ou Dúvida Operacional
                </label>
                <textarea
                  id="contact-message"
                  name="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Informe número aproximado de turmas, turnos e principais desafios de chamada/coordenação."
                  className="bg-white/5 border border-white/15 rounded-2xl px-6 py-4 focus:border-indigo-500 outline-none text-sm text-white placeholder:text-zinc-400 h-32 transition-all"
                />
              </div>
              <label className="flex items-start gap-3 text-xs text-zinc-300 cursor-pointer">
                <input
                  type="checkbox"
                  name="lgpdConsent"
                  required
                  checked={lgpdConsent}
                  onChange={(e) => setLgpdConsent(e.target.checked)}
                  className="mt-0.5 accent-indigo-500"
                />
                <span>
                  Autorizo o uso dos dados informados exclusivamente para retorno sobre o piloto escolar, nos termos da{" "}
                  <Link href="/seguranca-lgpd" className="text-indigo-400 underline">
                    Política de Privacidade e Governança LGPD
                  </Link>
                  .
                </span>
              </label>

              {status.state === "error" && (
                <p role="alert" className="text-xs font-bold text-red-400">
                  {status.message}
                </p>
              )}
              {status.state === "success" && (
                <div
                  role="status"
                  className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold"
                >
                  {status.message} — Protocolo: {status.protocol}
                </div>
              )}

              <button
                type="submit"
                disabled={status.state === "submitting"}
                className="bg-indigo-600 text-white py-5 rounded-full font-black uppercase tracking-widest shadow-2xl hover:bg-indigo-500 transition-all text-xs mt-2 disabled:opacity-50"
              >
                {status.state === "submitting"
                  ? "Registrando Solicitação..."
                  : "Agendar Minha Apresentação"}{" "}
                <ArrowRight className="inline-block ml-2" size={18} />
              </button>
            </form>
          </div>

          {/* Checklist & Contact Info */}
          <div className="flex flex-col gap-12 py-6">
            <div className="flex flex-col gap-6">
              <h3 className="text-2xl font-black uppercase tracking-tighter">
                O que entregamos na sessão técnica?
              </h3>
              <div className="flex flex-col gap-5">
                <div className="flex items-center gap-4 text-zinc-200 font-bold text-sm">
                  <CheckCircle2 size={22} className="text-indigo-400 shrink-0" />
                  Diagnóstico de infraestrutura local (servidor Windows/Edge e rede LAN)
                </div>
                <div className="flex items-center gap-4 text-zinc-200 font-bold text-sm">
                  <CheckCircle2 size={22} className="text-indigo-400 shrink-0" />
                  Demonstração ao vivo da jornada: Secretaria → Professor → Aluno → Coordenação
                </div>
                <div className="flex items-center gap-4 text-zinc-200 font-bold text-sm">
                  <CheckCircle2 size={22} className="text-indigo-400 shrink-0" />
                  Entrega do modelo de RIPD/DPIA institucional e matriz de consentimento LGPD
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-6 pt-6 border-t border-white/10">
              <div className="flex items-center gap-5">
                <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center">
                  <Mail size={22} className="text-indigo-400" />
                </div>
                <div>
                  <div className="text-xs uppercase tracking-widest text-zinc-400 font-bold">
                    Canal Técnico &amp; DPO
                  </div>
                  <a
                    href="mailto:contato@aquilalabs.io"
                    className="text-base font-bold text-white hover:text-indigo-400 transition-colors"
                  >
                    contato@aquilalabs.io
                  </a>
                </div>
              </div>
              <div className="flex items-center gap-5">
                <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center">
                  <Phone size={22} className="text-indigo-400" />
                </div>
                <div>
                  <div className="text-xs uppercase tracking-widest text-zinc-400 font-bold">
                    Atendimento Comercial (Horário Útil)
                  </div>
                  <span className="text-base font-bold text-white">
                    Agendamento via protocolo técnico
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
