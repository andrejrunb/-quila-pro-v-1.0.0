import React, { useEffect } from 'react';
import 'aframe';

/**
 * VirtualExperienceVR - Suporte Imersivo via A-Frame
 * Focado em visualização "Eagle Eye" para Diretores e Pais (Tour Virtual).
 */
export const VirtualExperienceVR: React.FC = () => {
    useEffect(() => {
        console.log('[VR] A-Frame Scene Initialized');
    }, []);

    return (
        <div className="vr-container" style={{ width: '100%', height: '600px', position: 'relative' }}>
            {/* @ts-ignore */}
            <a-scene embedded style={{ width: '100%', height: '100%' }}>
                {/* Sky / Environment */}
                <a-sky color="#020617"></a-sky>
                <a-grid color="#3b82f6" opacity="0.2"></a-grid>

                {/* Building Simulation */}
                <a-box 
                    position="0 2 -5" 
                    rotation="0 45 0" 
                    width="10" 
                    height="4" 
                    depth="15" 
                    color="#3b82f6" 
                    material="opacity: 0.3; transparent: true; roughness: 0.1"
                >
                    <a-text value="AGRUPAMENTO NORTE" position="-2 2.5 0" color="white" width="4"></a-text>
                </a-box>

                {/* Camera / Controls */}
                <a-entity position="0 5 15">
                    <a-camera look-controls wasd-controls></a-camera>
                </a-entity>

                {/* Lights */}
                <a-light type="ambient" color="#445451"></a-light>
                <a-light type="point" intensity="2" position="2 4 4"></a-light>
            </a-scene>
            
            <div style={{ position: 'absolute', top: '20px', left: '20px', background: 'rgba(15,23,42,0.8)', padding: '10px', borderRadius: '8px', zIndex: 100 }}>
                <h3 style={{ margin: 0, fontSize: '14px', color: '#60a5fa' }}>MODE: IMMERSIVE VR</h3>
                <p style={{ margin: 0, fontSize: '11px', color: 'white opacity 0.6' }}>A-Frame 1.4.0 Engine • Ready for VR Headsets</p>
            </div>
        </div>
    );
};
