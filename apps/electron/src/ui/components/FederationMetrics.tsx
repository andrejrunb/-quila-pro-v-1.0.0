import React from 'react';
import { Activity, Shield, Zap, Globe } from 'lucide-react';
import './FederationMetrics.css';

interface FederationMetricsProps {
    peers: any[];
    tops: number;
}

export const FederationMetrics: React.FC<FederationMetricsProps> = ({ peers, tops }) => {
    const activePeers = peers.filter(p => p.status === 'online').length;

    return (
        <div className="federation-metrics-card">
            <div className="metrics-header">
                <Globe className="icon-pulse" size={20} />
                <h3>Métricas da Federação Nexus</h3>
            </div>
            
            <div className="metrics-grid">
                <div className="metric-box">
                    <div className="m-label">Nós Online</div>
                    <div className="m-value">{activePeers} / {peers.length}</div>
                    <div className="m-sub">Units Sincronizadas</div>
                </div>

                <div className="metric-box">
                    <div className="m-label">Poder NPU</div>
                    <div className="m-value">{tops} <small>TOPS</small></div>
                    <div className="m-sub">Capacidade da Malha</div>
                </div>

                <div className="metric-box">
                    <div className="m-label">Vacinas Ativas</div>
                    <div className="m-value">12</div>
                    <div className="m-sub">Padrões de Ameaça</div>
                </div>
            </div>

            <div className="mesh-health">
                <div className="health-label">
                    <span>Consenso Swarm</span>
                    <span>99.8%</span>
                </div>
                <div className="health-bar">
                    <div className="health-fill" style={{ width: '99.8%' }}></div>
                </div>
            </div>
        </div>
    );
};
