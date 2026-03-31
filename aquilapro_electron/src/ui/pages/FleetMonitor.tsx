import React, { useState, useEffect, useRef } from 'react';
import { 
  Bus, MapPin, Navigation, 
  Users, Activity, AlertTriangle, 
  ArrowLeft, RefreshCcw, ShieldCheck 
} from 'lucide-react';
import transportTracking, { TransportFleet } from '../../services/TransportTrackingService';
import './FleetMonitor.css';

interface FleetMonitorProps {
  onBack: () => void;
}

/**
 * FleetMonitor (v3500)
 * Gestão de logística e frotas escolares.
 * Monitoramento de rotas e telemetria de motoristas.
 */
export const FleetMonitor: React.FC<FleetMonitorProps> = ({ onBack }) => {
  const [fleet, setFleet] = useState<TransportFleet[]>(transportTracking.getFleet());
  const [lastSync, setLastSync] = useState(Date.now());

  useEffect(() => {
    const handleUpdate = (newFleet: TransportFleet[]) => {
      setFleet(newFleet);
      setLastSync(Date.now());
    };

    transportTracking.on('fleet-updated', handleUpdate);
    return () => {
      transportTracking.off('fleet-updated', handleUpdate);
    };
  }, []);

  const totalStudents = fleet.reduce((acc, bus) => acc + bus.studentCount, 0);

  return (
    <div className="fleet-container animate-fade-in">
      <header className="fleet-header">
        <div className="fleet-title-group">
          <div className="fleet-badge">
             <Navigation size={14} className="text-amber" />
             <span className="fleet-badge-text">LOGISTICS COMMAND // V3500</span>
          </div>
          <h1 className="fleet-main-title">Transport <span className="text-amber">Fleet</span> Monitor</h1>
        </div>

        <div className="header-actions">
           <button onClick={onBack} className="back-btn">
              <ArrowLeft size={18} /> Voltar ao Painel
           </button>
        </div>
      </header>

      <div className="fleet-grid">
        {/* Radar View */}
        <section className="fleet-radar-view">
          <div className="radar-grid"></div>
          <div className="radar-sweep"></div>
          
          {fleet.map((bus, index) => {
            // Posicionamento simulado baseado na lat/lng (offset do centro)
            const x = 50 + (bus.location.lng + 46.65) * 2000;
            const y = 50 + (bus.location.lat + 23.55) * 2000;
            
            return (
              <BusMarker 
                key={bus.busId} 
                bus={bus} 
                x={x} 
                y={y} 
              />
            );
          })}

          <div className="radar-legend">
             <div className="legend-item">
                <ShieldCheck size={12} color="#10b981" />
                <span>Canais Seguros Ativos</span>
             </div>
          </div>
        </section>

        {/* Sidebar Stats & List */}
        <aside className="fleet-list-sidebar">
          <div className="fleet-stats-mini">
            <div className="mini-stat-card">
              <span className="mini-stat-label">Alunos em Trânsito</span>
              <span className="mini-stat-value text-amber">{totalStudents}</span>
            </div>
            <div className="mini-stat-card">
              <span className="mini-stat-label">Veículos Ativos</span>
              <span className="mini-stat-value">{fleet.length}</span>
            </div>
          </div>

          <div className="glass-card sidebar-data-container">
             <h3 className="section-title">Status da Frota</h3>
             <div className="bus-card-list">
               {fleet.map(bus => (
                 <div key={bus.busId} className="bus-item-card">
                   <div className="bus-icon-mini">
                      <Bus size={20} />
                   </div>
                   <div className="bus-info-group">
                      <div className="bus-id-text">{bus.busId}</div>
                      <div className="bus-route-text">{bus.route} // {bus.driverName}</div>
                   </div>
                   <div className={`status-indicator ${bus.status}`}></div>
                 </div>
               ))}
             </div>
          </div>

          <div className="fleet-sync-meta">
             <RefreshCcw size={12} className="spin-slow" />
             <span>Última sincronização: {new Date(lastSync).toLocaleTimeString()}</span>
          </div>
        </aside>
      </div>
    </div>
  );
};
const BusMarker: React.FC<{ bus: TransportFleet; x: number; y: number }> = ({ bus, x, y }) => {
  const markerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (markerRef.current) {
      markerRef.current.style.setProperty('--bus-x', `${x}%`);
      markerRef.current.style.setProperty('--bus-y', `${y}%`);
    }
  }, [x, y]);

  return (
    <div 
      ref={markerRef}
      className="bus-marker-wrapper"
      title={`${bus.busId} - ${bus.driverName}`}
    >
      <div className="bus-marker">
        <Bus size={20} />
        <div className="bus-label">
          {bus.busId} // {bus.status.toUpperCase()}
        </div>
      </div>
    </div>
  );
};
