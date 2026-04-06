import React, { useState, useEffect } from 'react';
import { Camera, Server, Activity, Thermometer, Shield, AlertTriangle, RefreshCw, Plus, Trash2, Zap } from 'lucide-react';
import { SwarmMonitor } from '../components/SwarmMonitor';
import { AIServerSetup } from '../components/AIServerSetup';

/**
 * InfrastructureDashboard.tsx — Passo 52 do Roadmap.
 * Monitoramento de hardware, câmeras e status do sistema.
 */
export const InfrastructureDashboard: React.FC<{ onBack?: () => void }> = ({ onBack }) => {
    const [view, setView] = useState<'main' | 'ai-setup'>('main');
    const [cameras, setCameras] = useState<any[]>([]);
    const [systemHealth, setSystemHealth] = useState({
        cpu: 0,
        temp: 0,
        memory: 0,
        totalMemory: 0,
        uptime: 'Calculando...'
    });
    const aquila = (window as any).aquila;

    useEffect(() => {
        loadCameras();
        fetchSystemHealth();
        const interval = setInterval(fetchSystemHealth, 5000);
        return () => clearInterval(interval);
    }, []);

    const fetchSystemHealth = async () => {
        const health = await aquila.invoke('get-system-health');
        if (health) setSystemHealth(health);
    };

    const loadCameras = async () => {
        const data = await aquila.invoke('get-cameras');
        setCameras(data || [
            { id: 'cam-01', name: 'Entrada Principal', status: 'online', rtspUrl: 'rtsp://192.168.1.100/ch1' },
            { id: 'cam-02', name: 'Corredor Norte', status: 'online', rtspUrl: 'rtsp://192.168.1.101/ch1' },
            { id: 'cam-03', name: 'Pátio Central', status: 'warning', rtspUrl: 'rtsp://192.168.1.102/ch1' },
        ]);
    };

    return (
        <div className="p-10 text-white min-h-screen bg-slate-950">
            <div className="mb-10 flex justify-between items-center">
                <div className="flex items-center gap-6">
                    {onBack && (
                        <button onClick={onBack} title="Voltar ao Dashboard" className="p-4 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/10 transition-all group">
                            <Activity className="rotate-180 group-hover:-translate-x-1 transition-transform" />
                        </button>
                    )}
                    <div>
                        <h1 className="text-4xl font-black flex items-center gap-3">
                        <Server className="w-10 h-10 text-blue-500" />
                        Infraestrutura & Saúde
                    </h1>
                    <p className="text-slate-500 mt-2 font-medium">Status dos servidores locais e inventário de captura</p>
                    </div>
                </div>
                <div className="flex gap-3">
                    <button 
                      onClick={() => setView('ai-setup')}
                      className="bg-blue-600 px-6 py-3 rounded-2xl flex items-center gap-2 hover:bg-blue-500 transition-all shadow-lg shadow-blue-500/20"
                    >
                        <Zap size={18} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Otimizar IA</span>
                    </button>
                    <button className="bg-slate-900 border border-white/10 px-6 py-3 rounded-2xl flex items-center gap-2 hover:bg-slate-800 transition-all">
                        <Plus size={18} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Nova Câmera</span>
                    </button>
                </div>
            </div>

            {view === 'ai-setup' ? (
                <AIServerSetup onBack={() => setView('main')} />
            ) : (
                <>
                    {/* Swarm Monitor - Soberania V */}
                    <SwarmMonitor />

                    {/* Hardware Status */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
                        <div className="bg-slate-900/50 border border-white/5 p-6 rounded-[32px] flex items-center gap-6">
                            <div className="p-4 bg-blue-500/10 rounded-2xl text-blue-500"><Activity /></div>
                            <div>
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">CPU Load</p>
                                <p className="text-2xl font-black">{systemHealth.cpu}%</p>
                            </div>
                        </div>
                        <div className="bg-slate-900/50 border border-white/5 p-6 rounded-[32px] flex items-center gap-6">
                            <div className="p-4 bg-orange-500/10 rounded-2xl text-orange-500"><Thermometer /></div>
                            <div>
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Temperatura</p>
                                <p className="text-2xl font-black">{systemHealth.temp}°C</p>
                            </div>
                        </div>
                        <div className="bg-slate-900/50 border border-white/5 p-6 rounded-[32px] flex items-center gap-6">
                            <div className="p-4 bg-purple-500/10 rounded-2xl text-purple-500"><Shield /></div>
                            <div>
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Memória (RAM)</p>
                                <p className="text-2xl font-black">{systemHealth.memory} / {systemHealth.totalMemory} GB</p>
                            </div>
                        </div>
                        <div className="bg-slate-900/50 border border-white/5 p-6 rounded-[32px] flex items-center gap-6">
                            <div className="p-4 bg-emerald-500/10 rounded-2xl text-emerald-500"><RefreshCw /></div>
                            <div>
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Uptime</p>
                                <p className="text-2xl font-black">{systemHealth.uptime}</p>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                        {/* Camera List */}
                        <div className="lg:col-span-2 space-y-4">
                            <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                                <Camera size={20} className="text-blue-500" /> Inventário de Câmeras
                            </h3>
                            {cameras.map(cam => (
                                <div key={cam.id} className="bg-slate-900 border border-white/5 rounded-3xl p-6 flex items-center justify-between hover:border-blue-500/20 transition-all group">
                                    <div className="flex items-center gap-6">
                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                                            cam.status === 'online' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'
                                        }`}>
                                            <Camera size={24} />
                                        </div>
                                        <div>
                                            <p className="font-bold text-lg">{cam.name}</p>
                                            <p className="text-[10px] text-slate-500 font-mono">{cam.rtspUrl}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-6">
                                        <div className="text-right">
                                            <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                                                cam.status === 'online' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'
                                            }`}>
                                                {cam.status}
                                            </span>
                                            <p className="text-[10px] text-slate-500 mt-1">SLA: 99.9%</p>
                                        </div>
                                        <button title="Remover Câmera" className="p-3 text-slate-600 hover:text-red-500 transition-colors">
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Alerts / Security Info */}
                        <div className="bg-slate-900 border border-white/5 rounded-[44px] p-8 shadow-2xl h-fit">
                            <h3 className="text-lg font-bold mb-8 flex items-center gap-2">
                                <AlertTriangle size={20} className="text-orange-500" /> Alertas de Infra
                            </h3>
                            <div className="space-y-6">
                                <div className="p-4 bg-orange-500/10 border border-orange-500/20 rounded-2xl flex gap-4">
                                    <AlertTriangle className="text-orange-500 shrink-0" size={20} />
                                    <p className="text-sm text-slate-300">Latência acima de 500ms detectada no link RTSP da Câmera 03.</p>
                                </div>
                                <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex gap-4">
                                    <Shield className="text-emerald-500 shrink-0" size={20} />
                                    <p className="text-sm text-slate-300">Criptografia AES-256 ativa em todos os streams de vídeo locais.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};
