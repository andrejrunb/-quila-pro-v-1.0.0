import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { TrendingUp, Users, AlertTriangle, Calendar } from 'lucide-react';

const data = [
  { name: 'Seg', presenca: 140, alertas: 2 },
  { name: 'Ter', presenca: 135, alertas: 0 },
  { name: 'Qua', presenca: 145, alertas: 1 },
  { name: 'Qui', presenca: 142, alertas: 5 },
  { name: 'Sex', presenca: 148, alertas: 1 },
];

const tooltipStyle = {
  background: '#1e293b',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '12px',
  color: '#fff',
  fontSize: '12px',
};

const AnalyticsDashboard: React.FC = () => {
  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Eagle Analytics</h1>
          <p className="text-slate-400 mt-1">Visão preditiva de frequência e engajamento escolar.</p>
        </div>
        <div className="flex gap-4">
          <button className="px-4 py-2 border border-white/10 rounded-xl flex items-center gap-2 text-slate-300 hover:bg-white/5 transition">
            <Calendar size={18} /> Últimos 7 dias
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card p-6 rounded-2xl flex items-center gap-4">
          <div className="p-3 bg-emerald-500/15 text-emerald-400 rounded-xl">
            <TrendingUp size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-400">Taxa de Presença Média</p>
            <h3 className="text-2xl font-bold text-white">94.2%</h3>
          </div>
        </div>
        <div className="glass-card p-6 rounded-2xl flex items-center gap-4">
          <div className="p-3 bg-blue-500/15 text-blue-400 rounded-xl">
            <Users size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-400">Pico de Ocupação</p>
            <h3 className="text-2xl font-bold text-white">Pátio Central</h3>
          </div>
        </div>
        <div className="glass-card p-6 rounded-2xl flex items-center gap-4">
          <div className="p-3 bg-amber-500/15 text-amber-400 rounded-xl">
            <AlertTriangle size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-400">Probabilidade Evasão</p>
            <h3 className="text-2xl font-bold text-amber-400">Baixa</h3>
          </div>
        </div>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="glass-card p-6 rounded-3xl">
          <h4 className="font-bold mb-6 text-white flex items-center gap-2">Fluxo de Presença</h4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Line type="monotone" dataKey="presenca" stroke="#10b981" strokeWidth={3} dot={{ r: 6, fill: '#10b981' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card p-6 rounded-3xl">
          <h4 className="font-bold mb-6 text-white">Alertas de Comportamento</h4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="alertas" fill="#f43f5e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
