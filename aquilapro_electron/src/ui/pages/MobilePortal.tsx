import React, { useState, useEffect } from 'react';
import { Bell, User, Clock, Shield, MapPin, Menu, Wallet } from 'lucide-react';
import DigitalIDWallet from '../components/DigitalIDWallet';

/**
 * MobilePortal.tsx — AG-013
 * Interface otimizada para visualização Mobile (WebView Companion).
 */
const MobilePortal: React.FC = () => {
  const [activeTab, setActiveTab] = useState('home');
  const [recentDetections, setRecentDetections] = useState<any[]>([]);

  useEffect(() => {
    // Mock de deteccões recentes para o portal
    setRecentDetections([
      { id: 1, name: 'João Silva', zone: 'Entrada Principal', time: '17:35', status: 'present' },
      { id: 2, name: 'Pedro Oliveira', zone: 'Biblioteca', time: '16:20', status: 'present' },
    ]);
  }, []);

  return (
    <div className="mobile-view bg-slate-50 min-h-screen text-slate-900 font-sans pb-20">
      {/* Top Header */}
      <header className="bg-white p-4 border-b flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <Shield className="text-emerald-500 w-6 h-6" />
          <h1 className="text-lg font-bold">Áquila Mobile</h1>
        </div>
        <button className="p-2" title="Abrir Menu"><Menu size={20} /></button>
      </header>

      {/* Main Stats Card */}
      <main className="p-4 space-y-4">
        <div className="bg-emerald-600 rounded-2xl p-6 text-white shadow-lg">
          <p className="opacity-80 text-sm">Status Hoje</p>
          <h2 className="text-2xl font-bold mt-1">Sincronizado</h2>
          <div className="flex gap-4 mt-4">
            <div className="bg-white/20 px-3 py-1 rounded-full text-xs">8 fluxos online</div>
            <div className="bg-white/20 px-3 py-1 rounded-full text-xs">v1.2.0-PRO</div>
          </div>
        </div>

        {/* Live Timeline */}
        {activeTab === 'home' ? (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold flex items-center gap-2">
                <Clock size={16} className="text-emerald-600" />
                Linha do Tempo
              </h3>
              <button className="text-xs text-blue-600">Ver Todas</button>
            </div>

            <div className="space-y-3">
              {recentDetections.map((d) => (
                <div key={d.id} className="bg-white p-4 rounded-xl border border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600">
                      <User size={20} />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold">{d.name}</h4>
                      <p className="text-[10px] opacity-60 flex items-center gap-1">
                        <MapPin size={8} /> {d.zone}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-mono opacity-50">{d.time}</span>
                </div>
              ))}
            </div>
          </section>
        ) : (
          <DigitalIDWallet studentName="João Silva" studentId="STU_998877" />
        )}

        {/* Alerts / Security */}
        <section className="bg-white p-4 rounded-xl border border-red-100">
          <h3 className="text-red-600 font-bold text-sm mb-2 flex items-center gap-2">
            <Bell size={14} /> Alertas Críticos
          </h3>
          <p className="text-xs opacity-60 italic">Nenhum alerta crítico ativo no momento.</p>
        </section>
      </main>

      {/* Bottom Navbar (Mobile Style) */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t p-3 flex justify-around items-center z-50">
        <button 
          onClick={() => setActiveTab('home')}
          className={`flex flex-col items-center gap-1 transition ${activeTab === 'home' ? 'text-emerald-600 opacity-100' : 'opacity-40'}`}
        >
          <Shield size={20} />
          <span className="text-[10px]">Home</span>
        </button>
        <button 
          onClick={() => setActiveTab('wallet')}
          className={`flex flex-col items-center gap-1 transition ${activeTab === 'wallet' ? 'text-emerald-600 opacity-100' : 'opacity-40'}`}
        >
          <Wallet size={20} />
          <span className="text-[10px]">ID Digital</span>
        </button>
        <button className="flex flex-col items-center gap-1 opacity-40">
          <Bell size={20} />
          <span className="text-[10px]">Alertas</span>
        </button>
      </nav>
    </div>
  );
};

export default MobilePortal;
