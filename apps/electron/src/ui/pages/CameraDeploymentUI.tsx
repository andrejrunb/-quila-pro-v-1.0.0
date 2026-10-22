import React, { useState, useEffect } from 'react';
import { 
  Camera, 
  Map as MapIcon, 
  Crosshair, 
  PlusCircle, 
  AlertTriangle,
  Eye,
  Settings,
  ArrowRight
} from 'lucide-react';
import './CameraDeploymentUI.css';

const CameraDeploymentUI: React.FC = () => {
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [detected, setDetected] = useState<any[]>([]);
  const [scanning, setScanning] = useState(false);

  const startAudit = async () => {
    setScanning(true);
    try {
      const d = await (window as any).aquila.invoke('audit:detect-cameras', { sectorId: 'Main' });
      const s = await (window as any).aquila.invoke('audit:get-suggestions');
      setDetected(d);
      setSuggestions(s);
    } catch (err) {
      console.error('Erro na auditoria de visão:', err);
    } finally {
      setScanning(false);
    }
  };

  useEffect(() => {
    startAudit();
  }, []);

  return (
    <div className="deployment-container">
      <header className="deployment-header">
        <div className="flex items-center gap-4">
          <div className="header-icon-glow">
             <MapIcon size={32} className="text-blue-400" />
          </div>
          <div>
            <h1>Áquila Vision Audit</h1>
            <p>Detecção de Hardware & Auxílio de Instalação</p>
          </div>
        </div>
        <button className={`audit-btn ${scanning ? 'scanning' : ''}`} onClick={startAudit}>
           {scanning ? 'Escaneando...' : 'Iniciar Auditoria de Cobertura'}
           <Crosshair size={18} />
        </button>
      </header>

      <div className="deployment-grid">
        {/* Mapa Blueprint */}
        <section className="blueprint-view glass-panel">
           <div className="blueprint-overlay">
              <div className="grid-lines"></div>
              {/* Representação simbólica das câmeras */}
              {detected.map((cam, i) => (
                <div key={i} className={`blueprint-node detected status-${cam.status.toLowerCase()}`} style={{ left: `${50 + cam.position.x}%`, top: `${50 + cam.position.y}%` }}>
                   <Camera size={14} />
                   <span className="tooltip">{cam.type} - {cam.status}</span>
                </div>
              ))}
              {suggestions.map((sug, i) => (
                <div key={i} className="blueprint-node suggestion" style={{ left: `${60 + sug.coordinates.x / 10}%`, top: `${40 + sug.coordinates.y / 10}%` }}>
                   <PlusCircle size={14} />
                   <span className="tooltip">Sugerido: {sug.recommendedType}</span>
                </div>
              ))}
           </div>
           <div className="blueprint-footer">
              <div className="legend">
                 <span className="dot green"></span> Verificada
                 <span className="dot yellow"></span> Desalinhada
                 <span className="dot blue"></span> Sugestão IA
              </div>
           </div>
        </section>

        {/* Painel de Sugestões Técnicas */}
        <aside className="suggestions-panel">
           <h3>Sugestões de Instalação</h3>
           <div className="sug-list">
              {suggestions.map((sug, i) => (
                <div key={i} className={`sug-card glass-panel priority-${sug.priority.toLowerCase()}`}>
                   <div className="sug-header">
                      <span className="priority-tag">{sug.priority}</span>
                      <Settings size={16} className="text-slate-400" />
                   </div>
                   <h4>{sug.zone}</h4>
                   <p>{sug.reason}</p>
                   <div className="sug-details">
                      <div className="detail">
                         <label>Hardware</label>
                         <span>{sug.recommendedType}</span>
                      </div>
                      <div className="detail">
                         <label>Coord.</label>
                         <span>{sug.coordinates.x}, {sug.coordinates.y}, {sug.coordinates.z}</span>
                      </div>
                   </div>
                   <div style={{ display: 'flex', gap: '0.5rem' }}>
                     <button className="guide-btn">
                        Ver Guia de Instalação <ArrowRight size={14} />
                     </button>
                     <button 
                        className="guide-btn" 
                        style={{ background: '#3b82f6', borderColor: '#3b82f6', width: 'auto' }}
                        onClick={() => {
                           (window as any).aquila.invoke('blender:simulate-camera', {
                              id: `SUG_${i}`,
                              x: sug.coordinates.x / 10, // Escala pro Blender
                              y: sug.coordinates.y / 10,
                              z: sug.coordinates.z,
                              type: sug.recommendedType.includes('PTZ') ? 'PTZ' : 'BULLET'
                           });
                        }}
                     >
                        Simular em 3D
                     </button>
                   </div>
                </div>
              ))}

           </div>
        </aside>
      </div>

      <footer className="deployment-footer">
         <Eye size={14} className="text-blue-400" />
         <span>Áquila Vision Audit: Garantindo 100% de visibilidade através da inteligência geoespacial.</span>
      </footer>
    </div>
  );
};

export default CameraDeploymentUI;
