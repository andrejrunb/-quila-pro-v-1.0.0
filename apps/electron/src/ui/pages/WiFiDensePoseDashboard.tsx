import React, { useState, useEffect } from 'react';
import { Wifi, AlertTriangle, User, MapPin, Activity, Zap } from 'lucide-react';
// Import type apenas para tipagem centralizada
import type { GhostPresence } from '../../services/AiTypes';
import './WiFiDensePoseDashboard.css';

const WiFiDensePoseDashboard: React.FC = () => {
    const [ghosts, setGhosts] = useState<GhostPresence[]>([]);
    const [alerts, setAlerts] = useState<any[]>([]);

    useEffect(() => {
        const updateGhosts = () => {
            window.aquila.getWiFiStatus().then((data: GhostPresence[]) => {
                setGhosts(data);
            });
        };

        const handleFall = (ghost: any) => {
            setAlerts(prev => [{ ...ghost, type: 'FALL', id: Date.now() }, ...prev].slice(0, 5));
        };

        updateGhosts();
        
        window.aquila.onGhostDetected(() => updateGhosts());
        window.aquila.onPassiveFallAlert(handleFall);

        return () => {
            // Cleanup dependendo da implementaÃ§Ã£o da ponte
        };
    }, []);

    return (
        <div className="densepose-container">
            <header className="densepose-header">
                <div className="header-title">
                    <Wifi className="icon-pulse" />
                    <h1>Mapa de Presença Digital <span className="badge">v1.3.4</span></h1>
                </div>
                <div className="status-indicator">
                    <Zap size={16} />
                    <span>CSI Active Scanning</span>
                </div>
            </header>

            <main className="densepose-grid">
                <section className="live-radar glass">
                    <div className="radar-header">
                        <h2>Mapa de Movimentação em Tempo Real</h2>
                        <span className="live-tag">LIVE</span>
                    </div>
                    <div className="radar-view">
                        <div className="radar-circles">
                            <div className="circle"></div>
                            <div className="circle"></div>
                            <div className="circle"></div>
                        </div>
                        {ghosts.map(ghost => (
                            <div 
                                key={ghost.id} 
                                className={`ghost-marker ${ghost.posture.toLowerCase()}`}
                                style={{ 
                                    '--marker-x': `${ghost.x * 4}%`, 
                                    '--marker-y': `${ghost.y * 8}%`,
                                    '--marker-opacity': ghost.confidence 
                                } as React.CSSProperties}
                            >
                                <div className="marker-ping"></div>
                                <User size={14} />
                                <span className="tooltip">{ghost.posture} ({Math.round(ghost.confidence * 100)}%)</span>
                            </div>
                        ))}
                    </div>
                    <div className="radar-legend">
                        <div className="legend-item"><div className="dot moving"></div> Em Movimento</div>
                        <div className="legend-item"><div className="dot standing"></div> Parado</div>
                        <div className="legend-item"><div className="dot horizontal"></div> Possível Queda</div>
                    </div>
                </section>

                <div className="side-panel">
                    <section className="active-zones glass">
                        <h3>Áreas com Alunos/Pessoas</h3>
                        <div className="zone-list">
                            {ghosts.length === 0 ? (
                                <p className="empty-msg">Nenhuma presença detectada nas áreas cegas.</p>
                            ) : (
                                Array.from(new Set(ghosts.map(g => (g as any).zoneId))).map(zone => (
                                    <div key={zone} className="zone-card">
                                        <MapPin size={16} />
                                        <span>{zone}</span>
                                        <Activity size={14} className="activity-icon" />
                                    </div>
                                ))
                            )}
                        </div>
                    </section>

                    <section className="passive-alerts glass">
                        <h3>Avisos Importantes</h3>
                        <div className="alert-list">
                            {alerts.map(alert => (
                                <div key={alert.id} className="alert-card critical-pulse">
                                    <AlertTriangle size={18} />
                                    <div className="alert-info">
                                        <strong>POSSÍVEL QUEDA</strong>
                                        <span>Detetado em {alert.zoneId}</span>
                                    </div>
                                </div>
                            ))}
                            {alerts.length === 0 && <p className="empty-msg">Nenhum evento crítico.</p>}
                        </div>
                    </section>
                </div>
            </main>
        </div>
    );
};

export default WiFiDensePoseDashboard;
