import React, { useEffect, useState } from 'react';
import { vrPortalService } from '../../services/VRPortalService';
import './DigitalTwinHub.css';

/**
 * DigitalTwinHub (v2441)
 * Immersive 3D situational awareness interface.
 * Replaces the 2D map with a real-time digital twin replica.
 */
const DigitalTwinHub: React.FC = () => {
  const [activeSubjects, setActiveSubjects] = useState(42);
  const [isVRReady, setIsVRReady] = useState(true);

  useEffect(() => {
    // Logic: Poll Digital Twin state and sync with VR service
    const interval = setInterval(() => {
       vrPortalService.syncDigitalTwin({ subjects: activeSubjects });
    }, 1000);
    return () => clearInterval(interval);
  }, [activeSubjects]);

  const handleEnterVR = () => {
    vrPortalService.startImmersiveSession('ADMIN');
  };

  return (
    <div className="digital-twin-container">
      <header className="twin-header">
        <h2 className="twin-title">DIGITAL TWIN V1.0</h2>
        <p className="twin-description">REPLICA EM TEMPO REAL COM TELEMETRIA BIOMÉTRICA</p>
      </header>

      <main className="three-canvas-container">
         {/* Placeholder for Three.js / R3F Canvas */}
         <div className="mesh-placeholder">
            <div className="mesh-grid" />
            <span className="mesh-label">SINCRONIZANDO MALHA 3D...</span>
         </div>
      </main>

      <section className="twin-controls">
         <button 
           className="vr-button"
           onClick={handleEnterVR}
           disabled={!isVRReady}
           aria-label="Entrar no Portal VR"
         >
           ENTRAR NO PORTAL VR
         </button>
      </section>

      <footer className="twin-stats">
         <div className="stat-card">
            <span className="label">INDIVÍDUOS EM CENA</span>
            <span className="value">{activeSubjects}</span>
         </div>
         <div className="stat-card">
            <span className="label">LATÊNCIA DIGITAL TWIN</span>
            <span className="value">14ms</span>
         </div>
      </footer>
    </div>
  );
};

export default DigitalTwinHub;
