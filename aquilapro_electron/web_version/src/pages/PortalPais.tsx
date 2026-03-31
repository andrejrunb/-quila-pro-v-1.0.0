import Footer from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useRef } from "react";
import {
  Users, Clock, CheckCircle2, XCircle, Calendar, Bell,
  TrendingUp, BarChart3, Shield, Eye, Phone, Mail, MessageCircle,
  FileText, Download, User
} from "lucide-react";

interface StatCardProps {
  icon: any;
  label: string;
  value: string;
  color: "blue" | "green" | "red";
}

const StatCard: React.FC<StatCardProps> = ({ icon: Icon, label, value, color }) => (
  <Card className="p-6 bg-white/5 border-white/5 backdrop-blur-xl group hover:border-blue-500/30 transition-all duration-500">
     <div className="flex items-start justify-between">
        <div className={`p-3 rounded-2xl ${
           color === 'blue' ? 'bg-blue-500/20 text-blue-400' : 
           color === 'green' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
        }`}>
           <Icon size={20} />
        </div>
        <div className="text-right">
           <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">{label}</div>
           <div className="text-2xl font-black italic text-white tracking-tighter">{value}</div>
        </div>
     </div>
  </Card>
);

const SubjectRow: React.FC<{ s: any }> = ({ s }) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.style.setProperty('--row-width', `${s.attendance}%`);
    }
  }, [s.attendance]);

  return (
    <div className="p-8 rounded-3xl bg-white/5 border border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-6">
      <div className="flex-1">
          <div className="text-xl font-black italic uppercase tracking-tighter text-white mb-4">{s.name}</div>
          <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
              <div ref={ref} className={`h-full ${s.attendance > 90 ? 'bg-blue-500' : 'bg-red-500'} subject-progress-bar`}></div>
          </div>
      </div>
      <div className="flex items-center gap-8 md:text-right">
          <div>
            <div className="text-2xl font-black italic text-white">{s.attendance}%</div>
            <div className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Presence</div>
          </div>
          <div className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border ${
            s.status === 'Approved' ? 'border-green-500/30 text-green-500 bg-green-500/5' : 'border-red-500/30 text-red-500 bg-red-500/5'
          }`}>
            {s.status}
          </div>
      </div>
    </div>
  );
};

const PortalPais = () => {
   const subjects = [
      { name: "Mathematics", attendance: 96, status: "Approved" },
      { name: "Physics", attendance: 88, status: "Attention" },
      { name: "Chemistry", attendance: 92, status: "Approved" },
      { name: "Literature", attendance: 100, status: "Approved" },
   ];

   return (
      <div className="min-h-screen bg-[#020202] text-white selection:bg-blue-500 selection:text-white">
         <div className="fixed inset-0 pointer-events-none overflow-hidden">
            <div className="absolute top-[10%] left-[5%] w-[40vw] h-[40vw] bg-blue-600/10 rounded-full blur-[120px]" />
            <div className="absolute bottom-[10%] right-[5%] w-[40vw] h-[40vw] bg-purple-600/10 rounded-full blur-[120px]" />
         </div>

         <div className="relative z-10">
            {/* Header / Nav */}
            <div className="container mx-auto px-6 py-12 flex items-center justify-between">
               <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center">
                     <div className="w-12 h-12 border-8 border-black rounded-2xl animate-spin-slow" />
                  </div>
                  <div>
                     <div className="text-2xl font-black italic uppercase tracking-tighter leading-none tracking-tight">quila <span className="text-blue-500">Pro</span></div>
                     <div className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mt-1">Sovereign School OS</div>
                  </div>
               </div>
               <div className="hidden md:flex items-center gap-8">
                  <div className="flex items-center gap-2 group cursor-pointer">
                     <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-blue-600 transition-all">
                        <User size={18} />
                     </div>
                     <div className="text-left">
                        <div className="text-[10px] font-black text-gray-500 uppercase">Guardian</div>
                        <div className="text-xs font-black uppercase tracking-widest text-white">Andrej Karpathy</div>
                     </div>
                  </div>
               </div>
            </div>

            {/* Main Content */}
            <div className="container mx-auto px-6 pb-24">
               
               {/* Grid Stats */}
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
                  <StatCard icon={TrendingUp} label="Progressive Improvement" value="+12%" color="blue" />
                  <StatCard icon={CheckCircle2} label="Global Presence" value="94.2%" color="green" />
                  <StatCard icon={Clock} label="Punctuality" value="98%" color="blue" />
                  <StatCard icon={Bell} label="Notifications" value="3" color="red" />
               </div>

               {/* Subjects List */}
               <div className="max-w-4xl mx-auto">
                  <div className="flex items-center justify-between mb-12">
                     <div>
                        <div className="text-[10px] font-black text-blue-500 uppercase tracking-[0.3em] mb-2">Performance</div>
                        <h2 className="text-5xl font-black italic uppercase tracking-tighter">Subjects & Presence</h2>
                     </div>
                  </div>
                  
                  <div className="space-y-12">
                     <div className="space-y-6">
                        {subjects.map((s, i) => (
                           <SubjectRow key={i} s={s} />
                        ))}
                     </div>
                  </div>
               </div>
            </div>
         </div>
         <Footer />
      </div>
   );
};

export default PortalPais;
