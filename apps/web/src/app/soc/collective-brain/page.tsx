"use client";

import React, { useEffect, useState } from 'react';
import { EagleCard } from '@/components/ui/EagleCard';
import { EliteButton } from '@/components/ui/EliteButton';
import { Brain, Globe, Activity, Zap, Network, Server, ShieldCheck } from 'lucide-react';
import dynamic from 'next/dynamic';

const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });

interface MeshNode {
  id: string;
  name?: string;
  isLocal: boolean;
  status: string;
  npuLoad: number;
  address?: string;
}

interface MeshTask {
  id: string;
  type: string;
  status: string;
  assignedTo: string;
  consensus: number;
}

export default function CollectiveBrain() {
  const [nodes, setNodes] = useState<MeshNode[]>([]);
  const [tasks, setTasks] = useState<MeshTask[]>([]);
  const [security, setSecurity] = useState<{ encryption: string, layer: string, status: string } | null>(null);
  const [wasm, setWasm] = useState<{ activeModules: number, totalMemoryLimitMb: number, securityViolations: number } | null>(null);
  const [pulse, setPulse] = useState<{ localHash: string, globalConsensusHash: string | null, agreementRate: number, peerCount: number } | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const fetchData = async () => {
      try {
        if (!window.aquila?.inference) return;
        const state = await window.aquila.inference.getInferenceState();
        setNodes(state.nodes || []);
        setTasks(state.tasks || []);
        setSecurity(state.security || null);
        setWasm(state.wasm || null);
        setPulse(state.pulse || null);
      } catch {
        console.error("Failed to fetch mesh data");
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleSync = async () => {
    try {
      await window.aquila.inference.dispatch('GLOBAL_COGNITIVE_SYNC', { timestamp: Date.now() }, 0.6);
      alert("Sincronização Cognitiva Iniciada no Enxame");
    } catch (e) {
      alert("Falha ao iniciar sincronização");
    }
  };

  const chartOptions: ApexCharts.ApexOptions = {
    chart: { type: 'bar', toolbar: { show: false }, background: 'transparent' },
    plotOptions: { bar: { borderRadius: 4, horizontal: true } },
    colors: ['#00a2ff'],
    theme: { mode: 'dark' },
    xaxis: { categories: nodes.map(n => n.id === 'local' ? 'Local Hub' : n.id.substring(0, 8)) },
    grid: { borderColor: 'rgba(255,255,255,0.05)' }
  };

  const chartSeries = [{
    name: 'NPU Load %',
    data: nodes.map(n => n.npuLoad || 0)
  }];

  if (!isMounted) return null;

  return (
    <div className="min-h-screen bg-slate-950 text-white p-8">
      <div className="flex justify-between items-center mb-12">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-glow-cyan flex items-center gap-3">
            <Brain className="text-cyan-400 w-10 h-10" />
            Collective Brain Dashboard
          </h1>
          <p className="text-slate-400 mt-2 italic">Córtex Transcendente (Nível 13) — Distributed NPU Mesh</p>
          {security && (
            <div className="mt-4 flex gap-4">
              <div className="flex items-center gap-2 px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-full">
                <ShieldCheck className="w-4 h-4 text-green-400" />
                <span className="text-[10px] font-bold text-green-400 uppercase tracking-wider">Neural Hardening Active: {security.encryption}</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1 bg-cyan-500/10 border border-cyan-500/20 rounded-full">
                <Zap className="w-4 h-4 text-cyan-400" />
                <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider">Layer: {security.layer}</span>
              </div>
            </div>
          )}
          {wasm && (
            <div className="mt-2 flex gap-4">
              <div className="flex items-center gap-2 px-3 py-1 bg-purple-500/10 border border-purple-500/20 rounded-full">
                <Brain className="w-4 h-4 text-purple-400" />
                <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider">Sandbox WASM: {wasm.activeModules} Modules</span>
              </div>
              <div className={`flex items-center gap-2 px-3 py-1 rounded-full border ${wasm.securityViolations > 0 ? 'bg-red-500/10 border-red-500/20' : 'bg-green-500/10 border-green-500/20'}`}>
                <Activity className={`w-4 h-4 ${wasm.securityViolations > 0 ? 'text-red-400' : 'text-green-400'}`} />
                <span className={`text-[10px] font-bold uppercase tracking-wider ${wasm.securityViolations > 0 ? 'text-red-400' : 'text-green-400'}`}>
                  Violations: {wasm.securityViolations}
                </span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1 bg-slate-500/10 border border-slate-500/20 rounded-full">
                <Server className="w-4 h-4 text-slate-400" />
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Memory Limit: {wasm.totalMemoryLimitMb.toFixed(1)} MB</span>
              </div>
            </div>
          )}
        </div>
        <div className="flex gap-4">
          <EliteButton variant="secondary" onClick={() => window.history.back()}>
            Voltar ao SOC
          </EliteButton>
          <EliteButton variant="primary" onClick={handleSync}>
            <Zap className="w-4 h-4 mr-2" /> Global Cognitive Sync
          </EliteButton>
        </div>
      </div>

      {pulse && (
        <div className="mb-8 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col gap-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Local Reality Hash</span>
            <span className="text-xs font-mono text-cyan-400">{pulse.localHash.substring(0, 16)}...</span>
          </div>
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col gap-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Global Consensus</span>
            <span className="text-xs font-mono text-purple-400">{pulse.globalConsensusHash?.substring(0, 16) || 'Pending...'}</span>
          </div>
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col gap-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Reality Agreement</span>
            <div className="flex items-center gap-3">
              <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div className={`h-full transition-all duration-1000 ${pulse.agreementRate >= 0.6 ? 'bg-green-500' : 'bg-yellow-500'}`} style={{ width: `${pulse.agreementRate * 100}%` }} />
              </div>
              <span className="text-xs font-bold">{(pulse.agreementRate * 100).toFixed(0)}%</span>
            </div>
          </div>
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col gap-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Sync Status</span>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full animate-pulse ${pulse.agreementRate >= 0.6 ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]'}`} />
              <span className={`text-xs font-bold ${pulse.agreementRate >= 0.6 ? 'text-green-400' : 'text-red-400'}`}>
                {pulse.agreementRate >= 0.6 ? 'CONSOLIDATED' : 'DIVERGENT'}
              </span>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Mesh Status */}
        <EagleCard glow="cyan" className="lg:col-span-2">
          <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
            <Network className="text-cyan-400" /> Distributed NPU Topology
          </h3>
          <div className="h-[300px]">
            {nodes.length > 0 ? (
              <Chart options={chartOptions} series={chartSeries} type="bar" height="100%" />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-slate-500 gap-4">
                <Globe className="w-12 h-12 animate-pulse text-slate-700" />
                <p>Aguardando conexão com o enxame de inteligência...</p>
              </div>
            )}
          </div>
        </EagleCard>

        {/* Node List */}
        <EagleCard glow="blue">
          <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
            <Server className="text-blue-400" /> Active Nodes
          </h3>
          <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
            {nodes.length > 0 ? nodes.map((node) => (
              <div key={node.id} className="p-4 rounded-xl bg-white/5 border border-white/10 hover:border-cyan-500/50 transition-all group">
                <div className="flex justify-between items-center">
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-slate-200 group-hover:text-cyan-400 transition-colors">
                      {node.id === 'local' ? 'Local Hub (Sovereign)' : `Peer ${node.id.substring(0, 8)}`}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">{node.address || 'Internal Mesh'}</span>
                  </div>
                  <div className={`px-2 py-1 rounded text-[10px] font-bold ${node.status === 'online' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                    {node.status?.toUpperCase() || 'ONLINE'}
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-4">
                  <div className="flex-1 h-1 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.5)] transition-all duration-1000" style={{ width: `${node.npuLoad || 0}%` }} />
                  </div>
                  <span className="text-[10px] font-mono text-cyan-400">{node.npuLoad || 0}%</span>
                </div>
              </div>
            )) : (
                <p className="text-center text-slate-600 italic py-10">Buscando hubs federados...</p>
            )}
          </div>
        </EagleCard>

        {/* Active Tasks */}
        <EagleCard glow="purple" className="lg:col-span-3">
          <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
            <Activity className="text-purple-400" /> Cognitive Task Queue
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-white/10 text-slate-500 uppercase text-[10px] font-bold tracking-widest">
                  <th className="pb-4">Task ID</th>
                  <th className="pb-4">Intelligence Type</th>
                  <th className="pb-4">Status</th>
                  <th className="pb-4">Assigned Node</th>
                  <th className="pb-4">Consensus Threshold</th>
                </tr>
              </thead>
              <tbody className="text-slate-300">
                {tasks.length > 0 ? tasks.map((task) => (
                  <tr key={task.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="py-4 font-mono text-xs text-purple-400">{task.id}</td>
                    <td className="py-4"><span className="px-2 py-1 bg-purple-500/10 text-purple-400 rounded text-[10px] font-bold border border-purple-500/20">{task.type}</span></td>
                    <td className="py-4 text-xs">
                        <span className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                            {task.status}
                        </span>
                    </td>
                    <td className="py-4 text-xs font-mono">{task.assignedTo === 'local' ? 'LOCAL_HUB' : `NODE_${task.assignedTo.substring(0, 8)}`}</td>
                    <td className="py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div className="h-full bg-green-500" style={{ width: `${(task.consensus || 0) * 100}%` }} />
                        </div>
                        <span className="text-xs font-mono">{(task.consensus * 100).toFixed(0)}%</span>
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-500 italic">
                      <div className="flex flex-col items-center gap-2 opacity-30">
                        <Brain className="w-8 h-8" />
                        Nenhuma tarefa cognitiva distribuída em execução.
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </EagleCard>
      </div>

      <style>{`
        .text-glow-cyan {
          text-shadow: 0 0 15px rgba(6, 182, 212, 0.4);
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255,255,255,0.02);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(6, 182, 212, 0.2);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(6, 182, 212, 0.4);
        }
      `}</style>
    </div>
  );
}
