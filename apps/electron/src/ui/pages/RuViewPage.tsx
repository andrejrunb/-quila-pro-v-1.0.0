import React from 'react';
import { RuViewMapping } from '../components/RuViewMapping';
import './RuViewPage.css';

export const RuViewPage: React.FC = () => {
    const [points, setPoints] = React.useState<any[]>([]);
    const [telemetry, setTelemetry] = React.useState<any>(null);

    // Mapeamento de Nós de Câmera para Coordenadas no Mapa (X, Y)
    // Isso transforma o ID da câmera em uma posição física na planta SVG
    const nodePositionMap: Record<string, { x: number, y: number }> = {
        'cam-front': { x: 50, y: 10 },    // Corredor entrada
        'cam-room-a1': { x: 20, y: 22 },  // Sala A-1
        'cam-room-a2': { x: 20, y: 57 },  // Sala A-2
        'cam-lab-ti': { x: 80, y: 27 },   // Laboratório TI
        'cam-refet': { x: 80, y: 67 },    // Refeitório
        'cam-coord': { x: 20, y: 92 },   // Coordenação
    };

    const fetchData = async () => {
        try {
            // 1. Obter telemetria de presença (Contagem Real)
            const attendance = await (window as any).electron.invoke('get-attendance-telemetry');
            setTelemetry(attendance);

            // 2. Obter sessões Re-ID (Alunos Reais detectados)
            const sessions = await (window as any).electron.invoke('get-reid-sessions');
            
            // 3. Obter dispositivos de rede (Infraestrutura Real)
            const netDevices = await (window as any).electron.invoke('discover-cameras');

            const newPoints: any[] = [];

            // Adicionar Alunos (Baseado em ReID)
            sessions.forEach((s: any) => {
                const pos = nodePositionMap[s.lastSeenNode] || { x: 50, y: 60 }; // Default corredor se não mapeado
                newPoints.push({
                    id: `person-${s.studentId}`,
                    x: pos.x + (Math.random() * 6 - 3), // Pequeno jitter para não sobrepor
                    y: pos.y + (Math.random() * 6 - 3),
                    intensity: s.confidence,
                    type: 'person',
                    label: `Aluno ${s.studentId.split('_')[0]}`
                });
            });

            // Adicionar Dispositivos de Infraestrutura (WiFi/Câmeras detectadas)
            netDevices.slice(0, 8).forEach((d: any, idx: number) => {
                 // Dispositivos de rede sem localização fixa são espalhados pela borda/corredor
                 newPoints.push({
                    id: d.id,
                    x: d.type === 'webcam' ? 50 : (10 + (idx * 10) % 80),
                    y: d.type === 'webcam' ? 5 : (5 + (idx * 15) % 110),
                    intensity: 0.3,
                    type: 'infrastructure',
                    label: d.name.includes('Device') ? 'WiFi Node' : d.name
                 });
            });

            setPoints(newPoints);
        } catch (error) {
            console.error('Erro ao atualizar RuView:', error);
        }
    };

    React.useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 10000); // Polling mais lento como backup

        // Escutar atualizações REAIS via IPC (Event-Driven)
        const removeReidListener = (window as any).electron.on('reid:update', (session: any) => {
            setPoints(prev => {
                const pos = nodePositionMap[session.lastSeenNode] || { x: 50, y: 60 };
                const existing = prev.find(p => p.id === `person-${session.studentId}`);
                
                if (existing) {
                    return prev.map(p => p.id === existing.id ? { 
                        ...p, 
                        x: pos.x + (Math.random() * 4 - 2), 
                        y: pos.y + (Math.random() * 4 - 2),
                        label: `Aluno ${session.studentId.split('_')[0]}`
                    } : p);
                } else {
                    return [...prev, {
                        id: `person-${session.studentId}`,
                        x: pos.x + (Math.random() * 4 - 2),
                        y: pos.y + (Math.random() * 4 - 2),
                        intensity: session.confidence,
                        type: 'person',
                        label: `Aluno ${session.studentId.split('_')[0]}`
                    }];
                }
            });
        });

        const removeTeleListener = (window as any).electron.on('attendance:telemetry-update', (data: any) => {
            setTelemetry(data);
        });

        return () => {
            clearInterval(interval);
            if (removeReidListener) removeReidListener();
            if (removeTeleListener) removeTeleListener();
        };
    }, []);

    return (
        <div className="ruview-page-container animate-fade-in">
            <header className="page-header flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <div className="header-icon-box">📡</div>
                    <div>
                        <h1>Mapeamento Espacial RuView</h1>
                        <p>WiFi-CSI Bio-Tracking & Human Topology v3.2.0</p>
                    </div>
                </div>
                <button 
                    className="px-4 py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-xl text-xs font-bold uppercase tracking-widest transition-all"
                    onClick={() => (window as any).electron.invoke('navigate', 'cameras')}
                >
                    Configurar Infraestrutura
                </button>
            </header>
            
            <div className="ruview-content-wrapper">
                <RuViewMapping points={points} zoneName="Laboratório Principal (Campina Grande)" />
            </div>
        </div>
    );
};

export default RuViewPage;
