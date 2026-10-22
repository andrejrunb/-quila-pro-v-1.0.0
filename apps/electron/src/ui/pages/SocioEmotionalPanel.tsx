import React, { useState } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar
} from 'recharts';
import { Brain, HeartPulse, TrendingUp, Users, MessageSquare } from 'lucide-react';

const TREND_DATA = [
  { week: 'Sem 1', engagement: 65, frustration: 20 },
  { week: 'Sem 2', engagement: 68, frustration: 18 },
  { week: 'Sem 3', engagement: 75, frustration: 15 },
  { week: 'Sem 4', engagement: 82, frustration: 10 },
  { week: 'Sem 5', engagement: 78, frustration: 25 },
  { week: 'Sem 6', engagement: 85, frustration: 12 },
];

const TEACHER_OBSERVATIONS = [
  { id: 1, teacher: 'Prof. Carla (Mat)', date: 'Hoje', note: 'Turma A muito dispersa na terceira aula. Clara queda de foco coletivo.', type: 'alert' },
  { id: 2, teacher: 'Prof. Marcos (Hist)', date: 'Ontem', note: 'Engajamento excelente durante o debate. João e Maria particaparam muito.', type: 'positive' },
  { id: 3, teacher: 'Coordenação', date: '2 dias atrás', note: 'Pátio detectou aglomerações e picos de ruído.', type: 'neutral' },
];

export const SocioEmotionalPanel: React.FC = () => {
  const [selectedClass, setSelectedClass] = useState('Turma 101 - A');

  return (
    <div className="min-h-screen p-8 text-slate-200" style={{ background: 'var(--profile-bg, #020617)' }}>
      
      <header className="mb-8">
        <h1 className="flex items-center gap-2 text-3xl m-0 text-sky-400">
          <HeartPulse size={28} />
          Painel Socioemocional & Clima
        </h1>
        <p className="text-slate-400 mt-1">Monitoramento de engajamento e frustração contínuo (Sovereign Cortex)</p>
      </header>

      <div className="flex gap-4 mb-8">
        <select 
          value={selectedClass} 
          onChange={e => setSelectedClass(e.target.value)}
          className="bg-slate-900/60 backdrop-blur-md text-white border border-white/10 px-4 py-2 rounded-lg focus:outline-none focus:border-sky-500 transition-all shadow-[0_4px_15px_rgba(0,0,0,0.1)]"
        >
          <option>Turma 101 - A</option>
          <option>Turma 102 - B</option>
          <option>Turma 201 - C</option>
        </select>
        <button className="bg-sky-500 hover:bg-sky-400 text-white px-4 py-2 rounded-lg font-bold transition-all shadow-[0_0_15px_rgba(14,165,233,0.3)] hover:shadow-[0_0_25px_rgba(14,165,233,0.5)] hover:-translate-y-0.5">
          Analisar Turma
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Esquerda: Gráficos (Passo 206) */}
        <div className="flex flex-col gap-8 lg:col-span-2">
          
          <div className="bg-slate-900/60 backdrop-blur-md p-6 rounded-2xl border border-white/10 shadow-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_15px_35px_rgba(0,0,0,0.3),0_0_15px_rgba(59,130,246,0.3)] hover:border-white/20">
            <h3 className="m-0 mb-4 flex items-center gap-2 text-lg font-semibold text-white">
              <TrendingUp size={18} className="text-sky-400" /> Tendências de Engajamento vs Frustração
            </h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={TREND_DATA}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="week" stroke="#9ca3af" />
                  <YAxis stroke="#9ca3af" />
                  <Tooltip contentStyle={{ background: 'rgba(30, 41, 59, 0.8)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '8px', color: '#fff' }} />
                  <Legend />
                  <Line type="monotone" dataKey="engagement" name="Engajamento (IA)" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="frustration" name="Frustração Estimada" stroke="#ef4444" strokeWidth={3} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Sugestões Pedagógicas (Passo 207) */}
          <div className="bg-sky-900/20 backdrop-blur-md p-6 rounded-2xl border border-sky-500/20 shadow-lg transition-all duration-300 hover:shadow-[0_0_20px_rgba(14,165,233,0.2)] hover:border-sky-500/40">
            <h3 className="m-0 mb-4 text-sky-400 flex items-center gap-2 text-lg font-semibold">
              <Brain size={18} /> Recomendações da IA (NPU)
            </h3>
            <ul className="m-0 pl-6 leading-relaxed space-y-2">
              <li><strong>Alerta Moderado:</strong> Notado pico de frustração na Semana 5. Recomenda-se aplicar metodologias ativas (ex: Kahoot) nas aulas de Exatas.</li>
              <li><strong>Dinâmica:</strong> O engajamento sobe 15% quando há discussões em grupo nesta turma. Evitar aulas puramente expositivas maiores que 30 minutos.</li>
            </ul>
          </div>
        </div>

        {/* Direita: Observações de Professores (Passo 205) */}
        <div className="bg-slate-900/60 backdrop-blur-md p-6 rounded-2xl border border-white/10 shadow-xl flex flex-col transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_15px_35px_rgba(0,0,0,0.3),0_0_15px_rgba(139,92,246,0.2)] hover:border-white/20">
          <h3 className="m-0 mb-4 flex items-center gap-2 text-lg font-semibold text-white">
            <MessageSquare size={18} className="text-purple-400" /> Diário de Observações Coletivas
          </h3>
          
          <div className="flex flex-col gap-4 flex-1 overflow-y-auto pr-2">
            {TEACHER_OBSERVATIONS.map(obs => (
              <div key={obs.id} className="bg-slate-800/50 p-4 rounded-xl border border-white/5 backdrop-blur-sm transition-all hover:bg-slate-800/80" style={{ 
                borderLeft: `4px solid ${obs.type === 'alert' ? '#ef4444' : obs.type === 'positive' ? '#10b981' : '#64748b'}`
              }}>
                <div className="flex justify-between mb-2">
                  <strong className="text-sm text-white">{obs.teacher}</strong>
                  <span className="text-xs text-slate-400">{obs.date}</span>
                </div>
                <p className="m-0 text-sm text-slate-300 leading-relaxed">{obs.note}</p>
              </div>
            ))}
          </div>

          <button className="mt-6 w-full bg-slate-800 hover:bg-slate-700 text-white border border-white/10 px-4 py-3 rounded-xl cursor-pointer transition-all hover:shadow-[0_0_15px_rgba(255,255,255,0.1)] hover:-translate-y-0.5 font-medium">
            + Nova Observação (Contexto)
          </button>
        </div>

      </div>

    </div>
  );
};

export default SocioEmotionalPanel;
