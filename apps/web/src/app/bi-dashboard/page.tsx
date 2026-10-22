"use client";

import React, { useState, useEffect } from "react";
import { 
  ArrowLeft, Activity, Map, Users, TrendingUp, Filter, AlertTriangle, Download, 
  MapPin, Clock, Calendar 
} from "lucide-react";
import Link from "next/link";
import { animate, stagger } from "animejs";

// Removida a mock data generation daqui, vai vir do backend via WebSocket

export default function BIDashboard() {
  const [mounted, setMounted] = useState(false);
  const [biData, setBiData] = useState<{
    stats?: any,
    totalStudents?: number,
    heatmap?: { grid: any[], hours: string[], zones: string[] }
  } | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  
  useEffect(() => {
    setMounted(true);
    
    // Connect to Sovereign OS MobileGateway
    const ws = new WebSocket('ws://localhost:9000');
    
    ws.onopen = () => {
      setIsConnected(true);
      // Request initial BI data
      ws.send(JSON.stringify({ type: 'GET_BI_DATA' }));
    };

    ws.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.type === 'BI_DATA_RESPONSE') {
          setBiData(payload.data);
        }
      } catch (err) {
        console.error('Error parsing WS message', err);
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
    };
    
    // Simple staggered animation
    animate('.stagger-item', {
      translateY: [20, 0],
      opacity: [0, 1],
      delay: stagger(100),
      duration: 800,
      easing: 'easeOutExpo'
    });
  }, []);

  if (!mounted) return null;

  const getIntensityColor = (val: number) => {
    if (val < 20) return 'bg-indigo-950/30';
    if (val < 40) return 'bg-indigo-800/60';
    if (val < 60) return 'bg-indigo-600';
    if (val < 80) return 'bg-fuchsia-600';
    return 'bg-pink-500';
  };

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-indigo-500 selection:text-white">
      {/* Background Ambience */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[800px] h-[600px] bg-indigo-600/10 rounded-full blur-[150px]" />
        <div className="absolute bottom-0 right-1/4 w-[600px] h-[500px] bg-fuchsia-600/10 rounded-full blur-[150px]" />
      </div>

      <div className="relative z-10 p-8 max-w-[1400px] mx-auto">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6 stagger-item">
          <div>
            <div className="flex items-center gap-3 mb-2 text-indigo-400">
              <Link href="/" className="hover:text-white transition-colors">
                <ArrowLeft size={20} />
              </Link>
              <span className="text-[10px] font-black uppercase tracking-[0.3em] border border-indigo-500/30 px-3 py-1 rounded-full bg-indigo-500/10">
                Aurochs Cloud Intelligence
              </span>
              {!isConnected && (
                <span className="text-[10px] font-bold text-red-500 animate-pulse ml-2 border border-red-500/30 px-3 py-1 rounded-full bg-red-500/10">
                  OFFLINE
                </span>
              )}
            </div>
            <h1 className="text-4xl font-black uppercase tracking-tighter">BI & Heatmaps</h1>
            <p className="text-zinc-400 font-medium text-sm mt-2">Visão macro de densidade e fluxos operacionais.</p>
          </div>
          
          <div className="flex items-center gap-4">
            <button className="flex items-center gap-2 bg-white/5 border border-white/10 hover:bg-white/10 px-5 py-3 rounded-full text-xs font-bold uppercase tracking-widest transition-all">
              <Filter size={16} /> Filtros
            </button>
            <button className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-3 rounded-full text-xs font-bold uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(79,70,229,0.4)]">
              <Download size={16} /> Exportar
            </button>
          </div>
        </header>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          {[
            { label: "Total de Alunos", value: biData?.totalStudents?.toString() || "...", icon: <Users className="text-indigo-500" />, sub: "Base local atualizada" },
            { label: "Presenças Hoje", value: biData?.stats?.present?.total?.toString() || "...", icon: <Activity className="text-pink-500" />, sub: "Câmeras + Sensores" },
            { label: "Câmeras Ativas", value: biData?.stats?.cameras?.total?.toString() || "...", icon: <Map className="text-emerald-500" />, sub: "Monitoramento 100%" },
            { label: "Alertas Críticos", value: biData?.stats?.alerts?.total?.toString() || "0", icon: <AlertTriangle className="text-amber-500" />, sub: "Prioridade alta" }
          ].map((kpi, i) => (
            <div key={i} className="stagger-item bg-white/5 border border-white/10 p-6 rounded-[32px] backdrop-blur-xl relative overflow-hidden group hover:border-indigo-500/50 transition-colors">
              <div className="absolute top-0 right-0 p-6 opacity-20 group-hover:opacity-100 transition-opacity group-hover:scale-110 duration-500">
                {kpi.icon}
              </div>
              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2">{kpi.label}</p>
              <h3 className="text-4xl font-black mb-1 text-white">{kpi.value}</h3>
              <p className="text-xs font-medium text-zinc-400">{kpi.sub}</p>
            </div>
          ))}
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Heatmap Section */}
          <div className="lg:col-span-2 stagger-item bg-white/5 border border-white/10 p-8 rounded-[40px] backdrop-blur-xl">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <MapPin className="text-indigo-500" />
                <h2 className="text-xl font-black uppercase tracking-tighter">Heatmap de Zonas</h2>
              </div>
              <div className="flex items-center gap-2 text-xs font-bold text-zinc-500">
                <span className="flex items-center gap-1"><div className="w-3 h-3 rounded-sm bg-indigo-950/30"></div> Baixo</span>
                <span className="flex items-center gap-1"><div className="w-3 h-3 rounded-sm bg-indigo-600"></div> Médio</span>
                <span className="flex items-center gap-1"><div className="w-3 h-3 rounded-sm bg-pink-500"></div> Alto</span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <div className="min-w-[600px]">
                {/* Headers */}
                <div className="flex mb-2 pl-32">
                  {biData?.heatmap?.hours.map(h => (
                    <div key={h} className="flex-1 text-center text-[10px] font-black text-zinc-500 tracking-widest">{h}</div>
                  ))}
                </div>
                
                {/* Grid Rows */}
                <div className="flex flex-col gap-2">
                  {biData?.heatmap?.zones.map((zone) => (
                    <div key={zone} className="flex items-center gap-4">
                      <div className="w-28 text-xs font-bold text-zinc-400 text-right shrink-0">{zone}</div>
                      <div className="flex flex-1 gap-2">
                        {biData.heatmap?.hours.map((hour) => {
                          const cell = biData.heatmap?.grid.find(g => g.zone === zone && g.hour === hour);
                          return (
                            <div 
                              key={`${zone}-${hour}`}
                              className={`flex-1 h-12 rounded-xl transition-all duration-300 hover:scale-105 cursor-pointer relative group ${getIntensityColor(cell?.intensity || 0)}`}
                            >
                              <div className="absolute opacity-0 group-hover:opacity-100 -top-10 left-1/2 -translate-x-1/2 bg-black text-white text-[10px] font-bold py-1 px-3 rounded shadow-xl border border-white/20 whitespace-nowrap z-20 pointer-events-none transition-opacity">
                                Densidade: {cell?.intensity}%
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Side Panel: Insights */}
          <div className="stagger-item flex flex-col gap-8">
            <div className="bg-indigo-600/10 border border-indigo-500/20 p-8 rounded-[40px] flex-1">
              <div className="flex items-center gap-3 mb-6 text-indigo-400">
                <Brain size={20} />
                <h3 className="font-black uppercase tracking-widest text-xs">Insights da IA</h3>
              </div>
              <ul className="space-y-6">
                <li className="flex gap-4 items-start">
                  <div className="w-2 h-2 rounded-full bg-pink-500 mt-1.5 shrink-0 animate-pulse" />
                  <p className="text-sm text-indigo-100 leading-relaxed font-medium">
                    A <strong className="text-white">Cantina</strong> apresentou lotação 25% acima do limite projetado às 09:15. Sugerimos escalonar o intervalo das turmas do 1º ano.
                  </p>
                </li>
                <li className="flex gap-4 items-start">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                  <p className="text-sm text-indigo-100 leading-relaxed font-medium">
                    Fluxo na <strong className="text-white">Portaria A</strong> estabilizou com a nova catraca express. Tempo médio de entrada caiu para 1.2s por aluno.
                  </p>
                </li>
              </ul>
            </div>

            <div className="bg-white/5 border border-white/10 p-8 rounded-[40px] flex-1">
               <h3 className="font-black uppercase tracking-widest text-xs text-zinc-400 mb-6">Tendência Semanal</h3>
               <div className="h-40 flex items-end gap-3">
                  {[40, 65, 80, 50, 90, 30, 70].map((h, i) => (
                    <div key={i} className="flex-1 bg-white/10 rounded-t-lg hover:bg-indigo-500/50 transition-colors relative group" style={{ height: `${h}%` }}>
                       <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-bold opacity-0 group-hover:opacity-100 text-white">{h}%</div>
                    </div>
                  ))}
               </div>
               <div className="flex justify-between mt-4 text-[10px] font-black tracking-widest text-zinc-600 uppercase">
                 <span>Seg</span><span>Ter</span><span>Qua</span><span>Qui</span><span>Sex</span><span>Sab</span><span>Dom</span>
               </div>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}

// Simple Brain icon component since we only imported what's above
function Brain(props: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={props.size || 24} height={props.size || 24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z"/>
      <path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z"/>
      <path d="M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4"/>
      <path d="M17.599 6.5a3 3 0 0 0 .399-1.375"/>
      <path d="M6.003 5.125A3 3 0 0 0 6.401 6.5"/>
      <path d="M3.477 10.896a4 4 0 0 1 .585-.396"/>
      <path d="M19.938 10.5a4 4 0 0 1 .585.396"/>
      <path d="M6 18a4 4 0 0 1-1.967-.516"/>
      <path d="M19.967 17.484A4 4 0 0 1 18 18"/>
    </svg>
  )
}
