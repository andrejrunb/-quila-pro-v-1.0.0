import React, { useEffect, useState } from 'react';
import { 
  Users, Activity, AlertTriangle, Cpu, 
  Layers, Maximize2, Zap, BrainCircuit, Search, ShieldCheck
} from 'lucide-react';
import DigitalTwinView from '../components/DigitalTwinView';
import './TwinNavigator.css';

interface TwinEntity {
  id: string;
  type: 'STUDENT' | 'STAFF' | 'ASSET';
  x: number;
  y: number;
  z: number;
  status: string;
}

interface DensityAlert {
  zoneId: string;
  currentDensity: number;
  predictedDensity: number;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  timestamp: number;
}

export const TwinNavigator: React.FC = () => {
  const [entities, setEntities] = useState<TwinEntity[]>([]);
  const [alerts, setAlerts] = useState<DensityAlert[]>([]);
  const [selectedLayer, setSelectedLayer] = useState<'security' | 'flow' | 'energy'>('security');
  const [isSyncing, setIsSyncing] = useState(true);

  const aquila = (window as any).aquila;

  const fetchData = async () => {
    try {
      const activeEntities = await aquila.invoke('twin:get-entities');
      if (activeEntities) setEntities(activeEntities);

      const recentAlerts = await aquila.invoke('twin:get-alerts');
      if (recentAlerts) setAlerts(recentAlerts);
      
      setIsSyncing(false);
    } catch (err) {
      console.error('Erro ao sincronizar Twin Data:', err);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="twin-navigator-page">
      <div className="twin-layout">
        {/* Left Panel: Layers & Stats */}
        <aside className="twin-sidebar">
          <div className="sidebar-section">
            <h3 className="section-title"><Layers size={16} /> CAMADAS</h3>
            <div className="layer-selector">
              <button 
                className={`layer-btn ${selectedLayer === 'security' ? 'active' : ''}`}
                onClick={() => setSelectedLayer('security')}
              >
                <ShieldCheck size={18} /> SEGURANÇA
              </button>
              <button 
                className={`layer-btn ${selectedLayer === 'flow' ? 'active' : ''}`}
                onClick={() => setSelectedLayer('flow')}
              >
                <Activity size={18} /> FLUXO (PREDITIVO)
              </button>
              <button 
                className={`layer-btn ${selectedLayer === 'energy' ? 'active' : ''}`}
                onClick={() => setSelectedLayer('energy')}
              >
                <Zap size={18} /> ENERGIA & HVAC
              </button>
            </div>
          </div>

          <div className="sidebar-section">
            <h3 className="section-title"><Activity size={16} /> TELEMETRIA</h3>
            <div className="telemetry-grid">
              <div className="tel-item">
                <span className="tel-label">Entidades Ativas</span>
                <span className="tel-value">{entities.length}</span>
              </div>
              <div className="tel-item">
                <span className="tel-label">Latência Hub</span>
                <span className="tel-value">12ms</span>
              </div>
              <div className="tel-item">
                <span className="tel-label">NPU Load</span>
                <span className="tel-value">24%</span>
              </div>
            </div>
          </div>

          <div className="sidebar-section alerts-section">
            <h3 className="section-title"><AlertTriangle size={16} /> ALERTAS DE FLUXO</h3>
            <div className="alerts-list-twin">
              {alerts.length === 0 ? (
                <div className="empty-alerts">Ambiente Estável</div>
              ) : (
                alerts.map((alert, i) => (
                  <div key={i} className={`alert-card-twin sev-${alert.severity.toLowerCase()}`}>
                    <div className="alert-header">
                      <span className="alert-zone">{alert.zoneId}</span>
                      <span className="alert-sev">{alert.severity}</span>
                    </div>
                    <div className="alert-body">
                      Densidade Prevista: <strong>{alert.predictedDensity}%</strong>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </aside>

        {/* Main View: The Digital Twin Map */}
        <main className="twin-main-view">
          <div className="twin-header-bar">
            <div className="header-info">
              <h1>GÊMEO DIGITAL <span className="v-tag">V1.0</span></h1>
              <p>Nível 19: Gêmeos Digitais & Predição de Fluxo</p>

            </div>
            <div className="header-actions">
               <div className={`sync-status ${isSyncing ? 'syncing' : ''}`}>
                 <div className="pulse-dot" /> SYNC-PULSE ACTIVE
               </div>
               <button className="header-btn"><Maximize2 size={18} /></button>
            </div>
          </div>

          <div className="map-viewport">
             {/* Background Map (3D Digital Twin via Three.js) */}
             <div className="map-background" style={{ width: '100%', height: '100%' }}>
                <DigitalTwinView />
             </div>

             <div className="map-controls-floating">
                <button className="float-btn"><BrainCircuit size={20} /></button>
                <button className="float-btn"><Search size={20} /></button>
                <button className="float-btn"><Cpu size={20} /></button>
             </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default TwinNavigator;
