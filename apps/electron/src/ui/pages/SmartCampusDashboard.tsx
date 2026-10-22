import React, { useState, useEffect } from 'react';
import { 
  Zap, 
  Leaf, 
  Thermometer, 
  Wind, 
  Lightbulb, 
  Activity, 
  Settings,
  ArrowDownCircle,
  Map as MapIcon
} from 'lucide-react';
import './SmartCampusDashboard.css';

const SmartCampusDashboard: React.FC = () => {
  const [campus, setCampus] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const state = await (window as any).aquila.invoke('iot:get-campus-state');
      setCampus(state);
      setLoading(false);
    } catch (err) {
      console.error('Erro ao buscar estado do campus:', err);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  if (loading || !campus) {
    return <div className="loading-eco">Conectando ao Smart Campus IoT...</div>;
  }

  return (
    <div className="eco-container">
      <header className="eco-header">
        <div className="flex items-center gap-4">
          <Leaf className="eco-logo-glow" size={32} />
          <div>
            <h1>Smart Campus & ESG</h1>
            <p>Gestão Energética Soberana — Áquila Pro v2.0.0</p>
          </div>
        </div>
        <div className="instant-usage-badge">
           <span className="label">Uso Instantâneo</span>
           <span className="value">{campus.totalInstantUsage.toFixed(1)} kW</span>
        </div>
      </header>

      <div className="eco-grid-main">
        {/* Isometric Map Placeholder / Visualization */}
        <div className="campus-map-container glass-panel">
           <div className="map-controls">
              <button className="btn-map active">Visualização Térmica</button>
              <button className="btn-map">Consumo por Bloco</button>
           </div>
           
           <div className="isometric-map-sim">
              {/* Simulação visual dos blocos */}
              <div className="block block-a active">
                <div className="block-label">BLOCO A</div>
                <div className="energy-pulse"></div>
              </div>
              <div className="block block-b eco">
                <div className="block-label">BLOCO B</div>
                <div className="energy-pulse eco"></div>
              </div>
              <div className="block block-c">
                <div className="block-label">BIBLIOTECA</div>
              </div>
           </div>

           <div className="map-legend">
              <div className="legend-item"><span className="dot active"></span> Alta Ocupação</div>
              <div className="legend-item"><span className="dot eco"></span> Modo Eco Ativo</div>
              <div className="legend-item"><span className="dot idle"></span> Standby</div>
           </div>
        </div>

        <aside className="eco-sidebar">
          <div className="stats-box glass-panel">
            <h3><Zap size={18} /> Impacto Ambiental</h3>
            <div className="impact-metrics">
               <div className="impact-item">
                  <span className="i-val">450 kg</span>
                  <span className="i-lab">CO2 Evitado</span>
               </div>
               <div className="impact-item">
                  <span className="i-val">R$ 1.2k</span>
                  <span className="i-lab">Economia Mensal</span>
               </div>
            </div>
          </div>

          <div className="device-control glass-panel">
             <h3><Settings size={18} /> Dispositivos de Borda</h3>
             <div className="device-list">
                {campus.devices.map((device: any) => (
                  <div key={device.id} className={`device-card ${device.status}`}>
                     <div className="d-icon">
                        {device.type === 'light' ? <Lightbulb size={16} /> : <Thermometer size={16} />}
                     </div>
                     <div className="d-info">
                        <strong>{device.name}</strong>
                        <span>Zona: {device.zoneId} | {device.consumptionKw.toFixed(1)} kW</span>
                     </div>
                     <div className={`d-status-tag ${device.status}`}>{device.status.toUpperCase()}</div>
                  </div>
                ))}
             </div>
          </div>
        </aside>
      </div>

      <footer className="eco-footer">
         <ArrowDownCircle size={14} className="text-emerald-500" />
         <span>Economia em Tempo Real: <strong>12% vs Média Histórica</strong></span>
      </footer>
    </div>
  );
};

export default SmartCampusDashboard;
