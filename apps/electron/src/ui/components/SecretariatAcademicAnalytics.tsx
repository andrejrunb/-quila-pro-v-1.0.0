import React, { useState } from 'react';
import { BarChart, Bar, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import { TrendingUp, Users, Book, Activity } from 'lucide-react';

export const SecretariatAcademicAnalytics: React.FC = () => {
   const [period, setPeriod] = useState('1b');

   const [data, setData] = useState<any[]>([]);
   const [loading, setLoading] = useState(true);
   const [stats, setStats] = useState({ globalAvg: 0, bestClass: '-', criticalSubject: '-', trend: 0 });

   React.useEffect(() => {
     fetchAnalytics();
   }, [period]);

   const fetchAnalytics = async () => {
     setLoading(true);
     try {
       const win = window as any;
       const allBoletins = await win.aquila.invoke('secretariat:get-bulk-boletim', 'all');
       const classes = await win.aquila.invoke('get-classes');
       
       // Group by class and calculate averages
       const processedData = classes.map((cls: any) => {
         const classBoletins = allBoletins.filter((b: any) => b.classId === cls.id || b.className === cls.name);
         const studentAverages = classBoletins.map((b: any) => 
           b.grades.length > 0 ? b.grades.reduce((acc: number, g: any) => acc + g.value, 0) / b.grades.length : 0
         );
         
         const classAvg = studentAverages.length > 0 
           ? studentAverages.reduce((a, b) => a + b, 0) / studentAverages.length 
           : 0;

         return {
           name: cls.name,
           media: classAvg,
           students: classBoletins.length
         };
       });

       setData(processedData);

       // Calculate school stats
       const totalAvg = processedData.reduce((a, b) => a + b.media, 0) / (processedData.length || 1);
       const best = [...processedData].sort((a, b) => b.media - a.media)[0];
       
       setStats({
          globalAvg: totalAvg,
          bestClass: best ? `${best.name} (${best.media.toFixed(1)})` : '-',
          criticalSubject: 'Matemática', // Simplified for now
          trend: 0.2
       });

     } catch (err) {
       console.error('Failed to fetch analytics:', err);
     } finally {
       setLoading(false);
     }
   };

   return (
     <div className="flex flex-col gap-6 animate-fade-in">
       <div className="flex items-center justify-between">
          <div>
             <h2 className="text-xl font-bold text-white flex items-center gap-2">
               <TrendingUp className="text-indigo-500" /> Analytics Pedagógico
             </h2>
             <p className="text-xs text-slate-400 mt-1">Visão macro do desempenho acadêmico, turmas e disciplinas críticas.</p>
          </div>
          <div>
             <select 
                className="bg-white/10 border border-white/20 text-white px-4 py-2 rounded-xl text-sm outline-none cursor-pointer"
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
             >
                <option value="1b" className="bg-slate-900">1º Bimestre</option>
                <option value="2b" className="bg-slate-900">2º Bimestre</option>
             </select>
          </div>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
           <div className="bg-indigo-500/10 border border-indigo-500/20 p-5 rounded-2xl">
              <div className="flex items-center gap-2 text-indigo-400 mb-2"><Activity size={16} /><span className="text-xs font-bold uppercase">Média Global Escola</span></div>
              <div className="text-3xl font-black text-white">{stats.globalAvg.toFixed(1)}</div>
           </div>
           <div className="bg-emerald-500/10 border border-emerald-500/20 p-5 rounded-2xl">
              <div className="flex items-center gap-2 text-emerald-400 mb-2"><Users size={16} /><span className="text-xs font-bold uppercase">Melhor Turma</span></div>
              <div className="text-xl font-black text-white">{stats.bestClass}</div>
           </div>
           <div className="bg-red-500/10 border border-red-500/20 p-5 rounded-2xl">
              <div className="flex items-center gap-2 text-red-400 mb-2"><Book size={16} /><span className="text-xs font-bold uppercase">Disciplina Crítica</span></div>
              <div className="text-xl font-black text-white">{stats.criticalSubject}</div>
           </div>
           <div className="bg-blue-500/10 border border-blue-500/20 p-5 rounded-2xl">
              <div className="flex items-center gap-2 text-blue-400 mb-2"><TrendingUp size={16} /><span className="text-xs font-bold uppercase">Evolução</span></div>
              <div className="text-xl font-black text-white">{stats.trend > 0 ? '+' : ''}{stats.trend.toFixed(1)} pts</div>
           </div>
       </div>

       {/* Charts Section */}
       <div className="bg-white/5 border border-white/5 p-6 rounded-2xl">
           <h3 className="font-bold text-sm text-slate-300 mb-6 uppercase tracking-widest">Desempenho Médio por Turma</h3>
           <div className="h-80 w-full">
             {loading ? (
               <div className="h-full flex items-center justify-center text-slate-500">Calculando métricas soberanas...</div>
             ) : (
               <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} domain={[0, 10]} />
                    <Tooltip 
                       contentStyle={{ background: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }}
                       itemStyle={{ color: '#fff', fontWeight: 'bold' }}
                    />
                    <Legend wrapperStyle={{ paddingTop: '20px' }} />
                    <Bar dataKey="media" name="Média por Turma" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  </BarChart>
               </ResponsiveContainer>
             )}
           </div>
       </div>
     </div>
   );
};
