"use client";

import React, { useState } from "react";
import {
  Sparkles, Brain, Trophy, Flame, Target, BookOpen, Clock,
  CheckCircle2, ArrowRight, MessageSquare, Send, Award, Zap,
  TrendingUp, Calendar, ShieldCheck, ChevronRight
} from "lucide-react";
import { EagleCard } from "@/components/ui/EagleCard";
import { EliteButton } from "@/components/ui/EliteButton";

interface ChatMessage {
  id: string;
  sender: "user" | "ai";
  text: string;
  timestamp: string;
}

export default function PortalAluno() {
  const [activeTab, setActiveTab] = useState<"missoes" | "tutor" | "boletim" | "horarios">("missoes");
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: "1",
      sender: "ai",
      text: "Olá, Lucas! Sou seu Tutor IA Áquila Pro. Vi que você tem simulado de Física (Termodinâmica) esta semana. Como posso te apoiar hoje?",
      timestamp: "07:15",
    },
  ]);
  const [isTyping, setIsTyping] = useState(false);

  const [quests, setQuests] = useState([
    {
      id: "q1",
      title: "Simulado Express: Eletrodinâmica & Leis de Ohm",
      desc: "5 questões estilo TRI do ENEM",
      reward: "+150 XP • 40 Áquila Coins",
      progress: 60,
      completed: false,
    },
    {
      id: "q2",
      title: "Revisão Espaçada SRS: Biologia Celular",
      desc: "12 flashcards pendentes para consolidação",
      reward: "+80 XP • 20 Áquila Coins",
      progress: 100,
      completed: true,
    },
    {
      id: "q3",
      title: "Ensaio Redação 1000: 'Inteligência Artificial & Ética'",
      desc: "Análise de repertório sociocultural e proposta de intervenção",
      reward: "+250 XP • 60 Áquila Coins",
      progress: 25,
      completed: false,
    },
  ]);

  const grades = [
    { subject: "Matemática & Raciocínio", b1: 9.2, b2: 8.8, b3: 9.5, b4: 9.0, freq: "98%", status: "Ótimo" },
    { subject: "Física Aplicada", b1: 8.5, b2: 7.8, b3: 8.4, b4: 8.9, freq: "96%", status: "Bom" },
    { subject: "Química & Termoquímica", b1: 8.0, b2: 8.5, b3: 9.0, b4: 8.8, freq: "95%", status: "Ótimo" },
    { subject: "Redação Dissertativa", b1: 9.6, b2: 9.2, b3: 9.8, b4: 9.6, freq: "100%", status: "Destaque" },
    { subject: "Biologia Molecular", b1: 8.9, b2: 9.1, b3: 9.0, b4: 9.4, freq: "97%", status: "Ótimo" },
    { subject: "História & Humanidades", b1: 9.0, b2: 9.4, b3: 8.7, b4: 9.1, freq: "98%", status: "Ótimo" },
  ];

  const schedule = [
    { time: "07:00 - 07:50", subject: "Matemática", room: "SALA 12", teacher: "Prof. Ricardo", current: false },
    { time: "07:50 - 08:40", subject: "Matemática", room: "SALA 12", teacher: "Prof. Ricardo", current: false },
    { time: "08:40 - 09:30", subject: "Física Aplicada", room: "LAB 03", teacher: "Profª Helena", current: true },
    { time: "09:50 - 10:40", subject: "Redação & Linguagens", room: "SALA 12", teacher: "Profª Clara", current: false },
    { time: "10:40 - 11:30", subject: "Biologia", room: "LAB 01", teacher: "Prof. Marcos", current: false },
    { time: "11:30 - 12:20", subject: "Química", room: "LAB 02", teacher: "Profª Joana", current: false },
  ];

  const handleSendMessage = () => {
    if (!chatInput.trim()) return;
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: "user",
      text: chatInput,
      timestamp: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
    };
    setChatMessages((prev) => [...prev, userMsg]);
    setChatInput("");
    setIsTyping(true);

    setTimeout(() => {
      let reply = "Excelente pergunta, Lucas! Vamos decompor esse conceito passo a passo usando a metodologia de aprendizado ativo do Áquila Pro.";
      if (userMsg.text.toLowerCase().includes("física") || userMsg.text.toLowerCase().includes("termo")) {
        reply = "Na Primeira Lei da Termodinâmica (ΔU = Q - W), lembre-se: calor fornecido ao sistema (Q > 0) aumenta a energia interna, enquanto o trabalho realizado pelo gás em expansão (W > 0) consome energia. Quer praticar uma questão do ENEM sobre isso?";
      } else if (userMsg.text.toLowerCase().includes("redação")) {
        reply = "Para a proposta de intervenção nota 200 no ENEM, garanta os 5 elementos: Agente, Ação, Meio/Modo, Efeito e Detalhamento. Exemplo de detalhamento: especificar o papel do Ministério da Educação via plataformas digitais.";
      } else if (userMsg.text.toLowerCase().includes("matemática")) {
        reply = "Em funções quadráticas, o vértice da parábola dá o ponto máximo ou mínimo: Xv = -b/(2a) e Yv = -Δ/(4a). Muito útil para otimização de custos e trajetórias balísticas no ENEM!";
      }

      setChatMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: "ai",
          text: reply,
          timestamp: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
      setIsTyping(false);
    }, 900);
  };

  const handleChipClick = (text: string) => {
    setChatInput(text);
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* Aluno Hero HUD */}
      <EagleCard glow="purple" className="border-purple-500/30 bg-purple-950/10 p-5 sm:p-7">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          {/* Identity & Avatar */}
          <div className="flex items-center gap-4 sm:gap-5">
            <div className="relative">
              {/* Retângulo Soberano ("Sem Bolinha") */}
              <div className="w-14 h-16 sm:w-16 sm:h-20 rounded-xl bg-gradient-to-br from-purple-600 via-indigo-600 to-cyan-500 p-0.5 shadow-xl shadow-purple-950/60">
                <div className="w-full h-full rounded-[10px] bg-zinc-950 flex items-center justify-center overflow-hidden">
                  <div className="text-xl sm:text-2xl font-black text-purple-300">LA</div>
                </div>
              </div>
              <div className="absolute -bottom-1.5 -right-1.5 px-1.5 py-0.5 rounded bg-emerald-500 text-[9px] font-black tracking-wider text-black uppercase">
                PRESENTE
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                  Lucas Andrade
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/40">
                  Nível 14 • Guardião
                </span>
              </div>
              <p className="text-xs sm:text-sm text-zinc-400 font-medium">
                3º Ano A • Ensino Médio Integral • Matrícula #2026-0842
              </p>
              <div className="flex items-center gap-3 text-[11px] text-zinc-400 mt-1">
                <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                  <ShieldCheck size={13} /> Portaria Sul • 07:12 (Biometria)
                </span>
                <span>•</span>
                <span>Média Geral: <strong className="text-white">9.1</strong></span>
              </div>
            </div>
          </div>

          {/* Gamification Stats Strip */}
          <div className="flex items-center gap-3 sm:gap-6 w-full lg:w-auto justify-between lg:justify-end border-t lg:border-t-0 border-white/10 pt-4 lg:pt-0">
            <div className="flex flex-col items-center px-3 py-2 rounded-xl bg-white/5 border border-white/5 min-w-[70px]">
              <span className="text-xs text-amber-400 font-bold flex items-center gap-1">
                <Flame size={14} className="animate-pulse" /> 12 Dias
              </span>
              <span className="text-[10px] text-zinc-400 uppercase font-semibold">Streak</span>
            </div>

            <div className="flex flex-col items-center px-3 py-2 rounded-xl bg-white/5 border border-white/5 min-w-[80px]">
              <span className="text-xs text-cyan-400 font-bold flex items-center gap-1">
                <Zap size={14} /> 1.420
              </span>
              <span className="text-[10px] text-zinc-400 uppercase font-semibold">Coins</span>
            </div>

            {/* XP Bar */}
            <div className="flex flex-col gap-1 min-w-[140px] sm:min-w-[180px]">
              <div className="flex justify-between text-[11px]">
                <span className="text-zinc-400 font-medium">Progresso XP</span>
                <span className="text-purple-300 font-bold">2.680 / 3.000</span>
              </div>
              <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-purple-500 to-cyan-400 w-[89%]" />
              </div>
              <span className="text-[10px] text-zinc-400 text-right">320 XP para o Nível 15</span>
            </div>
          </div>
        </div>
      </EagleCard>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab("missoes")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
            activeTab === "missoes"
              ? "bg-purple-600/30 text-purple-200 border border-purple-500/40 shadow-lg shadow-purple-900/20"
              : "text-zinc-400 hover:text-white hover:bg-white/5"
          }`}
        >
          <Target size={16} /> Missões & Quests
        </button>

        <button
          onClick={() => setActiveTab("tutor")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
            activeTab === "tutor"
              ? "bg-purple-600/30 text-purple-200 border border-purple-500/40 shadow-lg shadow-purple-900/20"
              : "text-zinc-400 hover:text-white hover:bg-white/5"
          }`}
        >
          <Brain size={16} /> Tutor IA Áquila
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
        </button>

        <button
          onClick={() => setActiveTab("boletim")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
            activeTab === "boletim"
              ? "bg-purple-600/30 text-purple-200 border border-purple-500/40 shadow-lg shadow-purple-900/20"
              : "text-zinc-400 hover:text-white hover:bg-white/5"
          }`}
        >
          <BookOpen size={16} /> Boletim & Desempenho
        </button>

        <button
          onClick={() => setActiveTab("horarios")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
            activeTab === "horarios"
              ? "bg-purple-600/30 text-purple-200 border border-purple-500/40 shadow-lg shadow-purple-900/20"
              : "text-zinc-400 hover:text-white hover:bg-white/5"
          }`}
        >
          <Calendar size={16} /> Grade Horária
        </button>
      </div>

      {/* Tab 1: Missões & Quests */}
      {activeTab === "missoes" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 flex flex-col gap-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Zap className="text-amber-400" size={18} /> Missões do Dia (Aceleração Pedagógica)
            </h2>

            <div className="flex flex-col gap-3">
              {quests.map((q) => (
                <EagleCard
                  key={q.id}
                  glow={q.completed ? "cyan" : "purple"}
                  className={`p-5 transition-all ${
                    q.completed ? "opacity-75 border-emerald-500/30" : "hover:border-purple-500/50"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex flex-col gap-1.5 flex-1">
                      <div className="flex items-center gap-2">
                        {q.completed ? (
                          <CheckCircle2 size={16} className="text-emerald-400 flex-shrink-0" />
                        ) : (
                          <Target size={16} className="text-purple-400 flex-shrink-0" />
                        )}
                        <h3 className="text-sm font-bold text-white">{q.title}</h3>
                      </div>
                      <p className="text-xs text-zinc-400">{q.desc}</p>
                      <span className="text-[11px] font-semibold text-amber-400 mt-1">{q.reward}</span>

                      {/* Progress bar */}
                      <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden mt-2">
                        <div
                          className={`h-full rounded-full ${
                            q.completed ? "bg-emerald-400" : "bg-gradient-to-r from-purple-500 to-indigo-400"
                          }`}
                          style={{ width: `${q.progress}%` }}
                        />
                      </div>
                    </div>

                    <EliteButton
                      variant={q.completed ? "secondary" : "primary"}
                      size="sm"
                      className="self-center"
                    >
                      {q.completed ? "Concluída" : "Praticar"}
                    </EliteButton>
                  </div>
                </EagleCard>
              ))}
            </div>
          </div>

          {/* Side Badges & Ranking */}
          <div className="flex flex-col gap-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Trophy className="text-amber-400" size={18} /> Ranking da Turma (3º A)
            </h2>

            <EagleCard glow="amber" className="p-5 flex flex-col gap-4">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <span className="text-xs font-bold text-zinc-400">POSIÇÃO ATUAL</span>
                <span className="text-sm font-black text-amber-400">#4 LUGAR • 2.680 XP</span>
              </div>

              <div className="flex flex-col gap-2.5">
                {[
                  { pos: 1, name: "Sofia Costa", xp: "3.120 XP", badge: "🥇" },
                  { pos: 2, name: "Gabriel Santos", xp: "2.940 XP", badge: "🥈" },
                  { pos: 3, name: "Helena Oliveira", xp: "2.810 XP", badge: "🥉" },
                  { pos: 4, name: "Lucas Andrade (Você)", xp: "2.680 XP", badge: "⭐", isUser: true },
                  { pos: 5, name: "Matheus Lima", xp: "2.450 XP", badge: "" },
                ].map((item) => (
                  <div
                    key={item.pos}
                    className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs ${
                      item.isUser
                        ? "bg-purple-600/20 border border-purple-500/40 text-purple-200 font-bold"
                        : "bg-white/5 text-zinc-300"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="w-5 text-center font-bold text-zinc-400">{item.badge || item.pos}</span>
                      <span>{item.name}</span>
                    </div>
                    <span className="font-semibold text-zinc-400">{item.xp}</span>
                  </div>
                ))}
              </div>

              <div className="text-[11px] text-zinc-400 text-center pt-2">
                Atualização em tempo real via Áquila Gateway
              </div>
            </EagleCard>
          </div>
        </div>
      )}

      {/* Tab 2: Tutor IA Áquila */}
      {activeTab === "tutor" && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Chat Stream */}
          <div className="lg:col-span-3 flex flex-col gap-4">
            <EagleCard glow="cyan" className="p-5 flex flex-col h-[520px]">
              {/* Chat Header */}
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-300">
                    <Brain size={16} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Córtex Copilot • Ensino Médio & ENEM</h3>
                    <p className="text-[10px] text-zinc-400">Modelo RAG local • Base Pedagógica BNCC</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  ONLINE
                </span>
              </div>

              {/* Message History */}
              <div className="flex-1 overflow-y-auto py-4 flex flex-col gap-3 pr-2">
                {chatMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex flex-col max-w-[85%] ${
                      msg.sender === "user" ? "self-end items-end" : "self-start items-start"
                    }`}
                  >
                    <div
                      className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                        msg.sender === "user"
                          ? "bg-purple-600 text-white rounded-br-none shadow-md shadow-purple-950/40"
                          : "bg-white/10 text-zinc-200 border border-white/10 rounded-bl-none shadow-md"
                      }`}
                    >
                      {msg.text}
                    </div>
                    <span className="text-[10px] text-zinc-400 mt-1 px-1">{msg.timestamp}</span>
                  </div>
                ))}

                {isTyping && (
                  <div className="self-start flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-white/5 border border-white/10 text-xs text-zinc-400">
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce" />
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce [animation-delay:0.2s]" />
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce [animation-delay:0.4s]" />
                    <span className="ml-1 text-[11px]">Tutor Áquila pensando...</span>
                  </div>
                )}
              </div>

              {/* Suggestion Chips */}
              <div className="flex items-center gap-2 py-2 overflow-x-auto border-t border-white/5 text-[11px]">
                <span className="text-zinc-400 font-medium whitespace-nowrap">Sugestões:</span>
                {[
                  "Física: Primeira Lei Termodinâmica",
                  "Redação: Proposta de Intervenção",
                  "Matemática: Vértice da Parábola",
                ].map((chip) => (
                  <button
                    key={chip}
                    onClick={() => handleChipClick(chip)}
                    className="px-2.5 py-1 rounded-full bg-white/5 border border-white/10 hover:border-cyan-400/50 hover:bg-white/10 transition-all text-zinc-300 whitespace-nowrap"
                  >
                    {chip}
                  </button>
                ))}
              </div>

              {/* Input Area */}
              <div className="flex items-center gap-2 pt-2 border-t border-white/10">
                <input
                  type="text"
                  placeholder="Pergunte ao Tutor IA (ex: Como calcular o rendimento do ciclo de Carnot?)..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                  className="flex-1 bg-white/5 border border-white/10 focus:border-cyan-400/60 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-white placeholder-zinc-500 outline-none transition-all"
                />
                <EliteButton
                  variant="primary"
                  size="md"
                  onClick={handleSendMessage}
                  className="px-4"
                >
                  <Send size={15} />
                </EliteButton>
              </div>
            </EagleCard>
          </div>

          {/* Quick Study Tools */}
          <div className="flex flex-col gap-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Laboratórios IA</h3>

            <EagleCard glow="purple" className="p-4 flex flex-col gap-3">
              <div className="flex items-center gap-2 text-purple-300 font-bold text-xs">
                <Sparkles size={14} /> Redação Nota 1000
              </div>
              <p className="text-xs text-zinc-400">
                Submeta seu texto e receba correção automática com os 5 critérios oficiais do ENEM.
              </p>
              <EliteButton variant="secondary" size="sm" className="w-full">
                Abrir Essay Lab
              </EliteButton>
            </EagleCard>

            <EagleCard glow="blue" className="p-4 flex flex-col gap-3">
              <div className="flex items-center gap-2 text-blue-300 font-bold text-xs">
                <Brain size={14} /> Flashcards SRS
              </div>
              <p className="text-xs text-zinc-400">
                Revisão ativa baseada no algoritmo SuperMemo 2 para retenção de longo prazo.
              </p>
              <EliteButton variant="secondary" size="sm" className="w-full">
                Praticar 12 Cartões
              </EliteButton>
            </EagleCard>
          </div>
        </div>
      )}

      {/* Tab 3: Boletim & Desempenho */}
      {activeTab === "boletim" && (
        <EagleCard glow="purple" className="p-6 flex flex-col gap-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-white">Boletim Escolar Bimestral • Ano Letivo 2026</h2>
              <p className="text-xs text-zinc-400">Notas homologadas e sincronizadas com a Secretaria Digital.</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold px-3 py-1.5 rounded-xl bg-purple-500/10 text-purple-300 border border-purple-500/30">
                Média Geral: 9.1
              </span>
              <span className="text-xs font-bold px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                Frequência: 97.4%
              </span>
            </div>
          </div>

          {/* Grades Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-white/10 text-[11px] uppercase tracking-wider text-zinc-400">
                  <th className="py-3 px-4 font-bold">Disciplina</th>
                  <th className="py-3 px-3 text-center font-bold">1º Bim</th>
                  <th className="py-3 px-3 text-center font-bold">2º Bim</th>
                  <th className="py-3 px-3 text-center font-bold">3º Bim</th>
                  <th className="py-3 px-3 text-center font-bold">4º Bim (Atual)</th>
                  <th className="py-3 px-3 text-center font-bold">Frequência</th>
                  <th className="py-3 px-4 text-center font-bold">Situação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {grades.map((g) => (
                  <tr key={g.subject} className="hover:bg-white/5 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-white">{g.subject}</td>
                    <td className="py-3.5 px-3 text-center text-zinc-300">{g.b1.toFixed(1)}</td>
                    <td className="py-3.5 px-3 text-center text-zinc-300">{g.b2.toFixed(1)}</td>
                    <td className="py-3.5 px-3 text-center text-zinc-300">{g.b3.toFixed(1)}</td>
                    <td className="py-3.5 px-3 text-center font-bold text-purple-300">{g.b4.toFixed(1)}</td>
                    <td className="py-3.5 px-3 text-center text-zinc-300">{g.freq}</td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                        {g.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </EagleCard>
      )}

      {/* Tab 4: Grade Horária */}
      {activeTab === "horarios" && (
        <EagleCard glow="blue" className="p-6 flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white">Quadro de Aulas • Quarta-feira</h2>
              <p className="text-xs text-zinc-400">Ambiente inteligente com monitoramento de presença em tempo real.</p>
            </div>
            <span className="text-xs font-bold text-cyan-400 border border-cyan-500/30 px-3 py-1.5 rounded-xl bg-cyan-500/10">
              Aula Ativa: Física Aplicada
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {schedule.map((slot) => (
              <div
                key={slot.time}
                className={`p-4 rounded-2xl border transition-all flex flex-col gap-2 ${
                  slot.current
                    ? "bg-cyan-500/15 border-cyan-400/50 shadow-lg shadow-cyan-950/40"
                    : "bg-white/5 border-white/10"
                }`}
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-400 font-mono flex items-center gap-1.5">
                    <Clock size={13} /> {slot.time}
                  </span>
                  {slot.current && (
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-cyan-400 text-black">
                      EM CURSO
                    </span>
                  )}
                </div>
                <h3 className="text-sm font-bold text-white">{slot.subject}</h3>
                <div className="flex items-center justify-between text-xs text-zinc-400 mt-1">
                  <span>{slot.teacher}</span>
                  <span className="font-mono text-zinc-300 font-semibold">{slot.room}</span>
                </div>
              </div>
            ))}
          </div>
        </EagleCard>
      )}
    </div>
  );
}
