"use client";

import React, { useState } from "react";
import {
  Award, TrendingDown, AlertTriangle, Users, BookOpen,
  Calendar, FileSpreadsheet, RefreshCw, CheckCircle2,
  Clock, ShieldAlert, ArrowRight, Download, Server, Sparkles, FolderArchive
} from "lucide-react";
import { EagleCard } from "@/components/ui/EagleCard";
import { EliteButton } from "@/components/ui/EliteButton";

export default function PortalCoordenacao() {
  const [activeTab, setActiveTab] = useState<"evasao" | "dominio" | "sigaweb" | "campus">("evasao");
  const [isExportingDominio, setIsExportingDominio] = useState(false);
  const [dominioExported, setDominioExported] = useState(true);
  const [isSyncingSigaWeb, setIsSyncingSigaWeb] = useState(false);

  const [atRiskStudents, setAtRiskStudents] = useState([
    {
      id: "std-1",
      name: "Matheus Lima",
      grade: "2º Ano B",
      absences: 14,
      limit: 15,
      riskLevel: "Crítico",
      trend: "3 faltas consecutivas",
      contacted: true,
      lastContact: "21/10 às 14:20 (WhatsApp Mãe)",
    },
    {
      id: "std-2",
      name: "Enzo Ferreira",
      grade: "1º Ano A",
      absences: 12,
      limit: 15,
      riskLevel: "Alto",
      trend: "Ausências nas sextas-feiras",
      contacted: false,
      lastContact: "Nenhum registro",
    },
    {
      id: "std-3",
      name: "Lara Vasconcelos",
      grade: "3º Ano C",
      absences: 11,
      limit: 15,
      riskLevel: "Médio",
      trend: "Atestado médico pendente",
      contacted: true,
      lastContact: "19/10 às 09:15 (Reunião Presencial)",
    },
  ]);

  const handleExportDominio = () => {
    setIsExportingDominio(true);
    setTimeout(() => {
      setIsExportingDominio(false);
      setDominioExported(true);
    }, 1500);
  };

  const handleSyncSigaWebGlobal = () => {
    setIsSyncingSigaWeb(true);
    setTimeout(() => {
      setIsSyncingSigaWeb(false);
    }, 1800);
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* Coordination Cockpit HUD */}
      <EagleCard glow="amber" className="p-5 sm:p-7 border-amber-500/30 bg-amber-950/10">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="flex items-center gap-4 sm:gap-5">
            {/* Rectangular Avatar */}
            <div className="w-14 h-16 sm:w-16 sm:h-20 rounded-xl bg-gradient-to-br from-amber-500 via-orange-600 to-indigo-600 p-0.5 shadow-xl shadow-amber-950/60">
              <div className="w-full h-full rounded-[10px] bg-zinc-950 flex items-center justify-center">
                <span className="text-xl sm:text-2xl font-black text-amber-300">CP</span>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                  Coordenação Neuro-Pedagógica
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  Gestão Central Institucional
                </span>
              </div>
              <p className="text-xs sm:text-sm text-zinc-400 font-medium">
                Colégio Áquila Pro • Matriz Alpha • 18 Turmas Ativas (1.200 Estudantes)
              </p>
              <div className="flex items-center gap-3 text-[11px] text-zinc-400 mt-1">
                <span className="text-emerald-400 font-semibold flex items-center gap-1">
                  <CheckCircle2 size={13} /> Sistema 100% Operacional
                </span>
                <span>•</span>
                <span>Próximo Fechamento SigaWeb: 18:30 (Cron)</span>
              </div>
            </div>
          </div>

          {/* Quick Action Button */}
          <div className="flex items-center gap-3 w-full lg:w-auto justify-between lg:justify-end border-t lg:border-t-0 border-white/10 pt-4 lg:pt-0">
            <EliteButton
              variant="primary"
              size="sm"
              onClick={handleSyncSigaWebGlobal}
              disabled={isSyncingSigaWeb}
              className="gap-2"
            >
              <RefreshCw size={14} className={isSyncingSigaWeb ? "animate-spin" : ""} />
              {isSyncingSigaWeb ? "Sincronizando RPA..." : "Sincronizar Todas as Turmas"}
            </EliteButton>
          </div>
        </div>

        {/* 4 Master KPIs Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-white/10">
          <div className="p-3.5 rounded-xl bg-white/5 border border-white/5 flex flex-col">
            <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">
              Presença Geral
            </span>
            <span className="text-xl sm:text-2xl font-black text-emerald-400">95.4%</span>
            <span className="text-[10px] text-zinc-400">+1.2% vs semana anterior</span>
          </div>

          <div className="p-3.5 rounded-xl bg-white/5 border border-white/5 flex flex-col">
            <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">
              Risco Evasão (LDB)
            </span>
            <span className="text-xl sm:text-2xl font-black text-amber-400">8 Alunos</span>
            <span className="text-[10px] text-amber-300 font-semibold">&gt; 10 ausências</span>
          </div>

          <div className="p-3.5 rounded-xl bg-white/5 border border-white/5 flex flex-col">
            <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">
              Turmas Ativas
            </span>
            <span className="text-xl sm:text-2xl font-black text-cyan-400">18 Turmas</span>
            <span className="text-[10px] text-zinc-400">Todas monitoradas por IA</span>
          </div>

          <div className="p-3.5 rounded-xl bg-white/5 border border-white/5 flex flex-col">
            <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">
              Média Institucional
            </span>
            <span className="text-xl sm:text-2xl font-black text-purple-400">8.1</span>
            <span className="text-[10px] text-zinc-400">Meta: 8.0 atingida</span>
          </div>
        </div>
      </EagleCard>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab("evasao")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
            activeTab === "evasao"
              ? "bg-amber-600/30 text-amber-200 border border-amber-500/40 shadow-lg shadow-amber-900/20"
              : "text-zinc-400 hover:text-white hover:bg-white/5"
          }`}
        >
          <ShieldAlert size={16} /> Radar de Evasão (Art. 12 LDB)
        </button>

        <button
          onClick={() => setActiveTab("dominio")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
            activeTab === "dominio"
              ? "bg-amber-600/30 text-amber-200 border border-amber-500/40 shadow-lg shadow-amber-900/20"
              : "text-zinc-400 hover:text-white hover:bg-white/5"
          }`}
        >
          <FolderArchive size={16} /> Domínio Sistemas (Contábil & Financeiro)
        </button>

        <button
          onClick={() => setActiveTab("sigaweb")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
            activeTab === "sigaweb"
              ? "bg-amber-600/30 text-amber-200 border border-amber-500/40 shadow-lg shadow-amber-900/20"
              : "text-zinc-400 hover:text-white hover:bg-white/5"
          }`}
        >
          <Server size={16} /> SigaWeb RPA Global
        </button>

        <button
          onClick={() => setActiveTab("campus")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
            activeTab === "campus"
              ? "bg-amber-600/30 text-amber-200 border border-amber-500/40 shadow-lg shadow-amber-900/20"
              : "text-zinc-400 hover:text-white hover:bg-white/5"
          }`}
        >
          <Users size={16} /> Densidade & Fluxo do Campus
        </button>
      </div>

      {/* Tab 1: Radar de Evasão */}
      {activeTab === "evasao" && (
        <EagleCard glow="amber" className="p-6 flex flex-col gap-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <AlertTriangle className="text-amber-400" size={20} /> Monitoramento de Alunos com Risco de Evasão
              </h2>
              <p className="text-xs text-zinc-400">
                Gatilho automático de alerta aos responsáveis e Conselho Tutelar (limite legal: 15 faltas - Art. 12 da LDB).
              </p>
            </div>
            <span className="text-xs font-bold px-3 py-1.5 rounded-xl bg-red-500/10 text-red-400 border border-red-500/30">
              3 Casos em Risco Imediato
            </span>
          </div>

          <div className="flex flex-col gap-3">
            {atRiskStudents.map((std) => (
              <div
                key={std.id}
                className="p-4 rounded-xl bg-white/5 border border-white/10 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
              >
                <div className="flex flex-col gap-1.5 flex-1">
                  <div className="flex items-center gap-2.5">
                    <h4 className="text-sm font-bold text-white">{std.name}</h4>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/10 text-zinc-300">
                      {std.grade}
                    </span>
                    <span
                      className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${
                        std.riskLevel === "Crítico"
                          ? "bg-red-500/20 text-red-300 border border-red-500/40"
                          : "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                      }`}
                    >
                      {std.riskLevel}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-zinc-400 flex-wrap">
                    <span>
                      Total de Faltas: <strong className="text-red-400">{std.absences}</strong> / {std.limit} max
                    </span>
                    <span>•</span>
                    <span className="text-amber-300">{std.trend}</span>
                    <span>•</span>
                    <span>Último Contato: {std.lastContact}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <EliteButton variant="secondary" size="sm">
                    Histórico
                  </EliteButton>
                  <EliteButton variant="primary" size="sm">
                    Disparar Intervenção
                  </EliteButton>
                </div>
              </div>
            ))}
          </div>
        </EagleCard>
      )}

      {/* Tab 2: Domínio Sistemas ERP */}
      {activeTab === "dominio" && (
        <EagleCard glow="cyan" className="p-6 flex flex-col gap-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <FolderArchive className="text-cyan-400" size={20} /> Hot-Folder Thomson Reuters Domínio
              </h2>
              <p className="text-xs text-zinc-400">
                Geração automatizada de lotes contábeis (|6000|) e liquidação de contas a receber (|5100|) salvos em <code>C:\aquila\storage\dominio_out</code>.
              </p>
            </div>

            <EliteButton
              variant="primary"
              size="md"
              onClick={handleExportDominio}
              disabled={isExportingDominio}
              className="gap-2"
            >
              <Download size={16} className={isExportingDominio ? "animate-bounce" : ""} />
              {isExportingDominio ? "Gerando Arquivos TXT..." : "Exportar Lotes Domínio"}
            </EliteButton>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 rounded-2xl bg-white/5 border border-white/10 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-white">|6000| Lançamentos Contábeis</h4>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  LAYOUT HOMOLOGADO
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Partidas dobradas automatizadas: débito em contas correntes / caixas e crédito em receitas de mensalidades escolares.
              </p>
              <span className="text-[11px] font-mono text-cyan-300">
                Último arquivo: DOMINIO_LANC_CONTABEIS_20261022.txt (148 registros)
              </span>
            </div>

            <div className="p-5 rounded-2xl bg-white/5 border border-white/10 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-white">|5100| Baixas de Contas a Receber</h4>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  LAYOUT HOMOLOGADO
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Liquidações bancárias automáticas de PIX e boletos vinculadas ao código de cliente do responsável.
              </p>
              <span className="text-[11px] font-mono text-cyan-300">
                Último arquivo: DOMINIO_BAIXAS_RECEBER_20261022.txt (34 baixas)
              </span>
            </div>
          </div>
        </EagleCard>
      )}

      {/* Tab 3: SigaWeb RPA Global */}
      {activeTab === "sigaweb" && (
        <EagleCard glow="blue" className="p-6 flex flex-col gap-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Server className="text-blue-400" size={20} /> Orquestrador SigaWeb RPA Headless
              </h2>
              <p className="text-xs text-zinc-400">
                Robô automatizado rodando em background com sincronização idempotente (SHA-256) sem duplicidade.
              </p>
            </div>
            <span className="text-xs font-bold px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              Cron 18:30 Ativo
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-white/10 text-[11px] uppercase tracking-wider text-zinc-400">
                  <th className="py-3 px-4 font-bold">Turma</th>
                  <th className="py-3 px-3 font-bold">Disciplina</th>
                  <th className="py-3 px-3 font-bold">Docente</th>
                  <th className="py-3 px-3 text-center font-bold">Presenças</th>
                  <th className="py-3 px-4 text-center font-bold">Status RPA</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {[
                  { turma: "3º Ano A", disc: "Matemática", prof: "Ricardo Silva", pres: "31/32", status: "Sincronizado" },
                  { turma: "2º Ano B", disc: "Física Aplicada", prof: "Ricardo Silva", pres: "30/32", status: "Sincronizado" },
                  { turma: "1º Ano C", disc: "Química", prof: "Joana Prado", pres: "28/29", status: "Sincronizado" },
                  { turma: "3º Ano B", disc: "Redação", prof: "Clara Mendes", pres: "30/30", status: "Pendente Fechamento" },
                ].map((row) => (
                  <tr key={row.turma} className="hover:bg-white/5 transition-colors">
                    <td className="py-3 px-4 font-bold text-white">{row.turma}</td>
                    <td className="py-3 px-3 text-zinc-300">{row.disc}</td>
                    <td className="py-3 px-3 text-zinc-300">{row.prof}</td>
                    <td className="py-3 px-3 text-center font-mono text-zinc-300">{row.pres}</td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          row.status === "Sincronizado"
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                            : "bg-amber-500/10 text-amber-300 border border-amber-500/30"
                        }`}
                      >
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </EagleCard>
      )}

      {/* Tab 4: Campus Density */}
      {activeTab === "campus" && (
        <EagleCard glow="purple" className="p-6 flex flex-col gap-6">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Users className="text-purple-400" size={20} /> Densidade & Ocupação em Tempo Real
            </h2>
            <p className="text-xs text-zinc-400">
              Detecção de aglomerações e fluxo de estudantes nos setores do campus físico.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { zone: "Pátio Central", occ: 65, status: "Normal", cap: "180 / 280" },
              { zone: "Refeitório", occ: 22, status: "Livre", cap: "45 / 200" },
              { zone: "Prédio A (Salas 1 a 10)", occ: 92, status: "Em Aula", cap: "320 / 350" },
              { zone: "Laboratórios de Ciências", occ: 80, status: "Em Aula", cap: "64 / 80" },
            ].map((z) => (
              <div key={z.zone} className="p-4 rounded-xl bg-white/5 border border-white/10 flex flex-col gap-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-white">{z.zone}</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-white/10 text-zinc-300">
                    {z.status}
                  </span>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-2xl font-black text-cyan-400">{z.occ}%</span>
                  <span className="text-xs text-zinc-400 font-mono">{z.cap}</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-indigo-500"
                    style={{ width: `${z.occ}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </EagleCard>
      )}
    </div>
  );
}
