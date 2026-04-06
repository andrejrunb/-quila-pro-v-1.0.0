import React, { useState, useEffect } from 'react';
import { FloorPlanMapper, Zone } from '../components/FloorPlanMapper';
import { Settings, Save, Upload } from 'lucide-react';

export const IndoorMappingDashboard: React.FC = () => {
    const [zones, setZones] = useState<Zone[]>([]);
    const [imageUrl, setImageUrl] = useState<string>('');
    const [mode, setMode] = useState<'view' | 'edit'>('edit');

    // Escuta eventos das Câmeras (Áquila Edge) via IPC
    useEffect(() => {
        const handleDetection = (_event: any, data: { zoneId: string, timestamp: string }) => {
            setZones(prevZones => prevZones.map(zone => {
                if (zone.id === data.zoneId || zone.name === data.zoneId) {
                    return { ...zone, active: true };
                }
                return zone;
            }));

            // Apaga o glow após 3 segundos
            setTimeout(() => {
                setZones(prevZones => prevZones.map(zone => {
                    if (zone.id === data.zoneId || zone.name === data.zoneId) {
                        return { ...zone, active: false };
                    }
                    return zone;
                }));
            }, 3000);
        };

        if ((window as any).electron?.ipcRenderer) {
            (window as any).electron.ipcRenderer.on('indoor-detection', handleDetection);
        }
        
        return () => {
            if ((window as any).electron?.ipcRenderer) {
                (window as any).electron.ipcRenderer.removeListener('indoor-detection', handleDetection);
            }
        };
    }, []);

    const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const url = URL.createObjectURL(e.target.files[0]);
            setImageUrl(url);
        }
    };

    return (
        <div className="p-6 h-full flex flex-col">
            <header className="mb-6 flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-white">Mapeamento Indoor (2D)</h1>
                    <p className="text-slate-400">Desenhe as zonas de segurança sobre a planta baixa da escola.</p>
                </div>
                <div className="flex gap-4">
                    <button 
                        onClick={() => {
                            if(zones.length > 0) {
                                // Simula disparo num zoneId aleatorio dentre os criados
                                const randomZone = zones[Math.floor(Math.random() * zones.length)];
                                if ((window as any).electron?.ipcRenderer) {
                                    (window as any).electron.ipcRenderer.emit('indoor-detection', null, { zoneId: randomZone.id, timestamp: new Date().toISOString() });
                                } else {
                                  // simulacao nativa fallback
                                  setZones(prev => prev.map(z => z.id === randomZone.id ? { ...z, active: true } : z));
                                  setTimeout(() => setZones(prev => prev.map(z => z.id === randomZone.id ? { ...z, active: false } : z)), 3000);
                                }
                            }
                        }}
                        className="px-4 py-2 rounded-xl flex items-center gap-2 transition bg-purple-600 hover:bg-purple-500 text-white"
                    >
                        Simular Detecção Espacial
                    </button>
                    <label className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 cursor-pointer transition">
                        <Upload size={18} />
                        Upload Planta (Img)
                        <input type="file" accept="image/*" onChange={handleUpload} className="hidden" />
                    </label>
                    <button 
                        onClick={() => setMode(mode === 'edit' ? 'view' : 'edit')}
                        className={`px-4 py-2 rounded-xl flex items-center gap-2 transition ${mode === 'edit' ? 'bg-blue-600' : 'bg-slate-800'}`}
                    >
                        <Settings size={18} />
                        {mode === 'edit' ? 'Modo Visualização' : 'Modo Edição'}
                    </button>
                    <button className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-xl flex items-center gap-2 transition">
                        <Save size={18} />
                        Salvar Mapa
                    </button>
                </div>
            </header>

            <div className="flex-1 bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden relative">
                {imageUrl ? (
                    <FloorPlanMapper 
                        imageUrl={imageUrl}
                        zones={zones}
                        onZonesChange={setZones}
                        mode={mode}
                    />
                ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500">
                        <MapIcon className="w-16 h-16 mb-4 opacity-50" />
                        <p>Nenhuma planta baixa selecionada.</p>
                        <p className="text-sm">Faça o upload de uma imagem comum (JPG/PNG) para começar.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

// Componente simples só pro placeholder
const MapIcon = (props: any) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"></polygon>
        <line x1="9" y1="3" x2="9" y2="21"></line>
        <line x1="15" y1="3" x2="15" y2="21"></line>
    </svg>
);
