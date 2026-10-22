import React from 'react';
import { SocialGraphView } from '../components/SocialGraphView';
import { Shield, Users, Radio, ArrowLeft } from 'lucide-react';
import './SocialNexus.css';

interface SocialNexusProps {
  onBack?: () => void;
}

export const SocialNexus: React.FC<SocialNexusProps> = ({ onBack }) => {
  return (
    <div className="social-nexus-container">
      <header className="nexus-header">
        <div className="flex items-center gap-4">
          {onBack && (
            <button className="btn-back" onClick={onBack}>
              <ArrowLeft size={18} />
            </button>
          )}
          <div>
            <div className="flex items-center gap-2">
              <Shield className="text-primary" size={20} />
              <h1 className="text-xl font-black tracking-tighter uppercase">Social Nexus</h1>
            </div>
            <p className="text-xs text-dim">Mapeamento de Relacionamentos e Detecção de Tensões em Tempo Real</p>
          </div>
        </div>
        
        <div className="nexus-stats">
          <div className="nexus-stat-chip">
            <div className="pulse-dot" />
            <span>Monitoramento Ativo</span>
          </div>
          <div className="nexus-stat-chip secondary">
            <Users size={14} />
            <span>Modo Soberano</span>
          </div>
        </div>
      </header>

      <main className="nexus-content">
        <div className="nexus-main-view">
          <SocialGraphView />
        </div>
        
        <aside className="nexus-sidebar">
          <div className="glass-card nexus-info-card">
            <div className="flex items-center gap-2 mb-4">
              <Radio size={16} className="text-primary animate-pulse" />
              <h3 className="font-bold text-sm uppercase tracking-wider">Protocolo de Grafo</h3>
            </div>
            <p className="text-xs text-dim leading-relaxed mb-4">
              O Social Nexus utiliza algoritmos de detecção de comunidades (Louvain) para identificar grupos de afinidade e isolamento social.
            </p>
            <div className="nexus-legend">
              <div className="legend-item">
                <div className="dot risk-high" />
                <span>Risco Crítico</span>
              </div>
              <div className="legend-item">
                <div className="dot risk-med" />
                <span>Tensão Detectada</span>
              </div>
              <div className="legend-item">
                <div className="dot normal" />
                <span>Interação Nominal</span>
              </div>
            </div>
          </div>

          <div className="glass-card nexus-alert-card">
             <h4 className="font-bold text-xs uppercase mb-3">Últimas Detecções</h4>
             <div className="nexus-mini-events">
                <div className="nexus-event">
                   <span className="event-time">14:02</span>
                   <p>Novo cluster de tensão identificado no 9º Ano B.</p>
                </div>
                <div className="nexus-event">
                   <span className="event-time">13:45</span>
                   <p>Aumento de interações positivas em Laboratório de IA.</p>
                </div>
             </div>
          </div>
        </aside>
      </main>
    </div>
  );
};
