import React, { useState, useEffect } from 'react';
import { Smartphone, Truck, ShoppingBag, MessageSquare, ShieldCheck, MapPin } from 'lucide-react';
import { parentPortal, ParentMessage } from '../../services/ParentPortalService';
import { transportTracking, TransportFleet } from '../../services/TransportTrackingService';
import './GlobalEcosystem.css';

/**
 * Componente Phase 281-290: Global Ecosystem Hub
 * Integra o Portal de Pais V2 e Monitoramento de Transporte Escolar.
 */
export const GlobalEcosystem: React.FC = () => {
  const [messages, setMessages] = useState<ParentMessage[]>([
    { id: '1', parentId: 'p1', studentId: 's1', content: 'Como está a segurança hoje?', aiResponse: 'Tudo normal! 100% integridade.', timestamp: Date.now() - 100000 }
  ]);
  const [fleet, setFleet] = useState<TransportFleet[]>([]);

  useEffect(() => {
    setFleet(transportTracking.getFleet());
    
    const unsubMsg = parentPortal.on('new-message', (msg: ParentMessage) => {
      setMessages(prev => [msg, ...prev]);
    });

    const unsubFleet = transportTracking.on('fleet-updated', setFleet);

    return () => {
      // Cleanup
    };
  }, []);

  return (
    <div className="ecosystem-container" role="region" aria-label="Ecossistema Global Áquila">
      <header className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Smartphone className="text-emerald-400" size={20} />
          <h2 className="text-lg font-bold">Global Ecosystem v2.0</h2>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 rounded-full border border-emerald-500/20">
          <ShieldCheck size={12} className="text-emerald-400" />
          <span className="text-[10px] text-emerald-300 font-bold tracking-widest uppercase">Certified Secure</span>
        </div>
      </header>

      <div className="ecosystem-grid">
        <div className="eco-card">
          <h3 className="text-xs font-bold text-slate-500 mb-4 uppercase flex items-center gap-2">
            <MessageSquare size={14} /> Parent Portal AI (V2)
          </h3>
          <div className="chat-preview">
            {messages.map(msg => (
              <React.Fragment key={msg.id}>
                <div className="chat-bubble bubble--user">{msg.content}</div>
                {msg.aiResponse && <div className="chat-bubble bubble--ai">{msg.aiResponse}</div>}
              </React.Fragment>
            ))}
          </div>
        </div>

        <div className="eco-card">
          <h3 className="text-xs font-bold text-slate-500 mb-4 uppercase flex items-center gap-2">
            <Truck size={14} /> Transport Fleet Tracking
          </h3>
          <div className="transport-list">
            {fleet.map(bus => (
              <div key={bus.busId} className="bus-item">
                <div>
                  <div className="text-xs font-bold">{bus.busId} // {bus.driverName}</div>
                  <div className="text-[9px] text-slate-500 flex items-center gap-1">
                    <MapPin size={8} /> {bus.route} • {bus.studentCount} Alunos
                  </div>
                </div>
                <div className={`bus-status-badge status--${bus.status}`}>
                  {bus.status.toUpperCase().replace('_', ' ')}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="marketplace-preview">
        <div className="plugin-mini">
          <ShoppingBag size={16} className="mx-auto mb-2 text-blue-400" />
          <div className="text-[10px] font-bold">Plugin Marketplace</div>
          <div className="text-[8px] text-slate-600">3 Apps Disponíveis</div>
        </div>
        <div className="flex-1 bg-blue-500/5 border border-blue-500/10 rounded-lg p-3 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-blue-300">Áquila API Token</div>
            <div className="text-[9px] text-slate-500 font-mono">AQ_PRO_EXT_88X...</div>
          </div>
          <button className="text-[9px] bg-blue-500/20 text-blue-400 px-2 py-1 rounded">Gerenciar SDK</button>
        </div>
      </div>
    </div>
  );
};
