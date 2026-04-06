import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from "recharts";
import { Users, Clock, AlertCircle, TrendingUp, Activity, ShieldCheck, Zap, Maximize2 } from "lucide-react";

export default function Demo() {
  const [selectedDate] = useState("2026-02-26");

  // Mock data for charts
  const presenceData = [
    { time: "08:00", presente: 95, ausente: 5 },
    { time: "09:00", presente: 98, ausente: 2 },
    { time: "10:00", presente: 97, ausente: 3 },
    { time: "11:00", presente: 96, ausente: 4 },
    { time: "12:00", presente: 85, ausente: 15 },
    { time: "13:00", presente: 99, ausente: 1 },
    { time: "14:00", presente: 98, ausente: 2 },
  ];

  const engagementData = [
    { name: "High", value: 65, color: "#3b82f6" },
    { name: "Mid", value: 25, color: "#60a5fa" },
    { name: "Low", value: 10, color: "#93c5fd" },
  ];

  const roomData = [
    { sala: "101", presentes: 28, ausentes: 2 },
    { sala: "102", presentes: 30, ausentes: 0 },
    { sala: "103", presentes: 27, ausentes: 3 },
    { sala: "104", presentes: 29, ausentes: 1 },
    { sala: "105", presentes: 26, ausentes: 4 },
  ];

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-[#030712] text-white font-sans">
      {/* Background Elements */}
      <div className="bg-blobs">
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
      </div>

      <Navigation />
      
      <main className="flex-1 pt-32">
        {/* Hero Section */}
        <section className="py-12 px-4 relative z-10 text-center">
          <div className="container max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-[10px] font-black text-blue-400 uppercase tracking-[0.3em] mb-8">
              Live Simulation V3
            </div>
            <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-tight mb-4 bg-gradient-to-b from-white via-white to-white/70 bg-clip-text text-transparent italic">
              Control Room.
            </h1>
            <p className="text-gray-400 font-light text-lg">
              Explore o poder da análise preditiva e reconhecimento facial em tempo real.
            </p>
          </div>
        </section>

        {/* Dashboard Section */}
        <section className="py-12 px-4 relative">
          <div className="container max-w-7xl mx-auto">
            {/* KPI Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
              {[
                { label: "Total Students", value: "487", icon: Users, color: "text-blue-500", bg: "bg-blue-500/10" },
                { label: "Live Present", value: "465", icon: Clock, color: "text-green-500", bg: "bg-green-500/10" },
                { label: "Attendance %", value: "95.5%", icon: TrendingUp, color: "text-purple-500", bg: "bg-purple-500/10" },
                { label: "Neural Alerts", value: "03", icon: AlertCircle, color: "text-red-500", bg: "bg-red-500/10" }
              ].map((kpi, i) => (
                <div key={i} className="glass-card p-8 rounded-[2.5rem] border-white/5 group hover:border-blue-500/30 transition-all">
                  <div className={`w-12 h-12 rounded-xl ${kpi.bg} flex items-center justify-center mb-6`}>
                    <kpi.icon size={24} className={kpi.color} />
                  </div>
                  <div className="text-[10px] font-black uppercase text-gray-500 tracking-widest mb-1">{kpi.label}</div>
                  <div className={`text-4xl font-black italic ${kpi.color}`}>{kpi.value}</div>
                </div>
              ))}
            </div>

            {/* Main Visualizer */}
            <div className="grid lg:grid-cols-3 gap-8 mb-12">
               {/* Left: Charts */}
               <div className="lg:col-span-2 space-y-8">
                 <div className="glass-card p-10 rounded-[3rem] border-white/10 bg-white/5 relative overflow-hidden">
                    <div className="flex justify-between items-center mb-8">
                       <h3 className="text-xl font-black italic uppercase tracking-tighter">Temporal Attendance Pulse</h3>
                       <div className="flex gap-2">
                          <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Live Sync</span>
                       </div>
                    </div>
                    <div className="h-[400px] w-full">
                       <ResponsiveContainer width="100%" height="100%">
                         <AreaChart data={presenceData}>
                           <defs>
                             <linearGradient id="colorPres" x1="0" y1="0" x2="0" y2="1">
                               <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                               <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                             </linearGradient>
                           </defs>
                           <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                           <XAxis dataKey="time" stroke="#ffffff40" fontSize={10} tickLine={false} axisLine={false} />
                           <YAxis stroke="#ffffff40" fontSize={10} tickLine={false} axisLine={false} />
                           <Tooltip 
                             contentStyle={{ backgroundColor: '#111827', border: '1px solid #ffffff10', borderRadius: '12px' }}
                             itemStyle={{ fontSize: '12px', fontWeight: '900', fontStyle: 'italic', textTransform: 'uppercase' }}
                           />
                           <Area type="monotone" dataKey="presente" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorPres)" />
                           <Area type="monotone" dataKey="ausente" stroke="#ef4444" strokeWidth={2} fillOpacity={0} />
                         </AreaChart>
                       </ResponsiveContainer>
                    </div>
                 </div>

                 <div className="grid md:grid-cols-2 gap-8">
                    <div className="glass-card p-8 rounded-[2.5rem] border-white/5 bg-white/5">
                       <h4 className="text-sm font-black italic uppercase mb-6 tracking-widest text-gray-400">Section distribution</h4>
                       <div className="h-[250px]">
                          <ResponsiveContainer width="100%" height="100%">
                             <BarChart data={roomData}>
                               <Bar dataKey="presentes" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                               <XAxis dataKey="sala" hide />
                               <Tooltip 
                                 cursor={{fill: 'transparent'}}
                                 contentStyle={{ backgroundColor: '#111827', border: '1px solid #ffffff10', borderRadius: '12px' }}
                               />
                             </BarChart>
                          </ResponsiveContainer>
                       </div>
                    </div>
                    <div className="glass-card p-8 rounded-[2.5rem] border-white/5 bg-white/5 flex flex-col items-center justify-center">
                       <h4 className="text-sm font-black italic uppercase mb-6 tracking-widest text-gray-400">Engagement Score</h4>
                       <div className="h-[250px] w-full">
                          <ResponsiveContainer width="100%" height="100%">
                             <PieChart>
                               <Pie data={engagementData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                                  {engagementData.map((e, i) => <Cell key={i} fill={e.color} />)}
                               </Pie>
                               <Tooltip />
                             </PieChart>
                          </ResponsiveContainer>
                       </div>
                    </div>
                 </div>
               </div>

               {/* Right: Real-time Feed */}
               <div className="lg:col-span-1 space-y-8">
                  <div className="glass-card p-10 rounded-[3rem] border-red-500/20 bg-red-600/5 h-full">
                     <div className="flex items-center gap-3 mb-10">
                        <Activity className="text-red-500 animate-pulse" size={20} />
                        <h3 className="text-xl font-black italic uppercase tracking-tighter">Neural Alert Stack</h3>
                     </div>
                     
                     <div className="space-y-6">
                        {[
                          { name: "Joana Dark", event: "Unauthorized Zone Access", time: "2m ago", level: "CRITICAL", color: "bg-red-500" },
                          { name: "Marcus Aurelius", event: "Late Arrival Detected", time: "15m ago", level: "WARNING", color: "bg-yellow-500" },
                          { name: "Socrates Netto", event: "Behavioral Anomaly", time: "1h ago", level: "INFO", color: "bg-blue-500" },
                          { name: "Hypatia Lima", event: "Early Departure", time: "3h ago", level: "AUTORIZED", color: "bg-green-500" }
                        ].map((alert, i) => (
                          <div key={i} className="group p-6 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 transition-all cursor-pointer">
                             <div className="flex justify-between items-start mb-2">
                                <div className="text-xs font-black italic uppercase tracking-tighter text-white">{alert.name}</div>
                                <div className={`text-[8px] font-black px-2 py-0.5 rounded ${alert.color} text-white`}>{alert.level}</div>
                             </div>
                             <div className="text-[10px] text-gray-500 font-light mb-4">{alert.event}</div>
                             <div className="text-[8px] font-bold text-gray-600 uppercase tracking-widest">{alert.time}</div>
                          </div>
                        ))}
                     </div>

                     <button className="w-full mt-10 py-4 rounded-xl border border-white/10 text-[10px] font-black uppercase tracking-widest hover:bg-white/5 transition-all mb-4">
                        View Complete Audit Log
                     </button>
                  </div>
               </div>
            </div>

            {/* Bottom: Feature Cards */}
            <div className="grid md:grid-cols-3 gap-8 py-20">
               {[
                 { icon: ShieldCheck, title: "Zero Data Leak", desc: "Processamento vetorial que garante que nunca armazenamos imagens brutas após a identificação." },
                 { icon: Zap, t: "Ultra-Low Latency", desc: "Engine neurais otimizadas para hardware RTX/Edge com resposta sub-100ms." },
                 { icon: Maximize2, t: "Unlimited nodes", desc: "Escalabilidade horizontal infinita para cobrir 100% do perímetro escolar." }
               ].map((f, i) => (
                 <div key={i} className="text-center p-8">
                    <div className="w-16 h-16 rounded-full bg-blue-600/10 border border-blue-500/20 flex items-center justify-center mx-auto mb-8">
                       <f.icon size={28} className="text-blue-500" />
                    </div>
                    <h5 className="text-lg font-black italic uppercase tracking-tighter mb-4">{f.title || f.t}</h5>
                    <p className="text-gray-500 font-light text-sm">{f.desc}</p>
                 </div>
               ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
