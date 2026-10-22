"use client";

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { EagleCard } from '@/components/ui/EagleCard';
import { EliteButton } from '@/components/ui/EliteButton';
import { Shield, Activity, Cpu, Bell, ShieldCheck, Zap, BrainCircuit } from 'lucide-react';
import { TelemetryPulse } from '@/components/TelemetryPulse';

// Import dinâmico do ApexCharts para compatibilidade com Next.js (SSR safe)
const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });

export default function SocDashboard() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Opções do Gráfico de Coração do Sistema (NPU/CPU)
  const chartOptions: ApexCharts.ApexOptions = {
    chart: {
      id: 'system-heartbeat',
      toolbar: { show: false },
      sparkline: { enabled: false },
      background: 'transparent',
    },
    colors: ['#00a2ff', '#00fff2'],
    stroke: { curve: 'smooth', width: 2 },
    fill: {
      type: 'gradient',
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.45,
        opacityTo: 0.05,
        stops: [20, 100, 100, 100],
      },
    },
    xaxis: {
      labels: { show: false },
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: {
      labels: { style: { colors: '#64748b' } },
    },
    grid: {
      borderColor: 'rgba(255, 255, 255, 0.05)',
      strokeDashArray: 4,
    },
    theme: { mode: 'dark' },
    legend: { position: 'top', horizontalAlign: 'right' },
  };

  const chartSeries = [
    { name: 'NPU Usage', data: [31, 40, 28, 51, 42, 109, 100] },
    { name: 'GPU Load', data: [11, 32, 45, 32, 34, 52, 41] },
  ];

  if (!isMounted) return null;

  return (
    <div className="min-h-screen bg-slate-950 text-white p-8">
      {/* Header SOC */}
      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-glow-blue flex items-center gap-3">
            <Shield className="text-blue-500 w-8 h-8" />
            Security Operations Center
          </h1>
          <p className="text-slate-400 mt-1">Sovereign Intelligence Monitor v1.5.0</p>
        </div>
        <div className="flex gap-4">
          <EliteButton variant="ghost"><Bell className="w-4 h-4 mr-2" /> Alertas</EliteButton>
          <EliteButton variant="primary"><Zap className="w-4 h-4 mr-2" /> Modo Pânico</EliteButton>
        </div>
      </div>

      {/* Grid de Monitoramento */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Card de Saúde do Enxame */}
        <EagleCard glow="cyan" className="col-span-2">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Activity className="text-cyan-400 w-5 h-5" />
                System Heartbeat
              </h3>
              <p className="text-sm text-slate-400">Eficiência da NPU e Carga de Inferência</p>
            </div>
            <div className="text-right">
              <span className="text-2xl font-mono text-cyan-400">26.4 TFLOPS</span>
              <p className="text-xs text-slate-500">Live Optimization Active</p>
            </div>
          </div>
          <div className="h-[250px]">
             <Chart options={chartOptions} series={chartSeries} type="area" height="100%" />
          </div>
        </EagleCard>

        {/* Card de Status de Nós */}
        <EagleCard glow="blue">
          <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
            <ShieldCheck className="text-blue-500 w-5 h-5" />
            Hive Immunity
          </h3>
          <div className="space-y-6">
            <div className="flex justify-between items-center p-3 rounded-lg bg-white/5 border border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
                <span className="text-sm">Lab de Informática A</span>
              </div>
              <span className="text-xs font-mono text-slate-400">ONLINE</span>
            </div>
            <div className="flex justify-between items-center p-3 rounded-lg bg-white/5 border border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
                <span className="text-sm">Secretaria Principal</span>
              </div>
              <span className="text-xs font-mono text-slate-400">ONLINE</span>
            </div>
            <div className="flex justify-between items-center p-3 rounded-lg bg-red-500/10 border border-red-500/20">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)] animate-pulse" />
                <span className="text-sm text-red-400">Pátio Externo Node 2</span>
              </div>
              <span className="text-xs font-mono text-red-500">OFFLINE</span>
            </div>
          </div>
          <EliteButton 
            className="w-full mt-10" 
            variant="secondary" 
            size="sm"
            onClick={() => window.location.href = '/soc/collective-brain'}
          >
            Gerenciar Inteligência Coletiva
          </EliteButton>
        </EagleCard>
      </div>

      {/* Córtex Sovereign Pulse (AG-402 Expansion) */}
      <div className="mb-10">
        <h2 className="text-xl font-bold mb-6 text-glow-cyan flex items-center gap-2">
          <BrainCircuit className="text-cyan-400 w-6 h-6" />
          Intelligence Evolution Layer
        </h2>
        <TelemetryPulse />
      </div>

      {/* Alertas de Segurança */}
      <EagleCard glow="purple">
        <h3 className="text-lg font-semibold mb-4">Sovereign Security Logs</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-400">
            <thead>
              <tr className="border-b border-white/10 uppercase text-[10px] tracking-widest font-bold">
                <th className="py-3 px-1">Timestamp</th>
                <th className="py-3 px-1">Node</th>
                <th className="py-3 px-1">Event</th>
                <th className="py-3 px-1">Status</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-white/5 hover:bg-white/5 transition-colors">
                <td className="py-3 px-1 font-mono">18:32:01</td>
                <td className="py-3 px-1">Gate-A</td>
                <td className="py-3 px-1">Face Recognition: Aluno Aprovado</td>
                <td className="py-3 px-1 text-green-400 font-bold">SECURE</td>
              </tr>
              <tr className="border-b border-white/5 hover:bg-white/5 transition-colors">
                <td className="py-3 px-1 font-mono">18:31:45</td>
                <td className="py-3 px-1">Library-Central</td>
                <td className="py-3 px-1">Córtex Sync Completo</td>
                <td className="py-3 px-1 text-blue-400 font-bold">UPDATED</td>
              </tr>
            </tbody>
          </table>
        </div>
      </EagleCard>
    </div>
  );
}
