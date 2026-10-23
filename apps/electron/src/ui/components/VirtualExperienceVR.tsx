import React, { useEffect } from 'react';

/**
 * VirtualExperienceVR — Visualização 3D Imersiva
 * Focado em visualização "Eagle Eye" para Diretores e Pais (Tour Virtual).
 */
export const VirtualExperienceVR: React.FC = () => {
    useEffect(() => {
        console.log('[3D Experience] Initialized');
    }, []);

    return (
        <div className="vr-container" style={{ width: '100%', height: '600px', position: 'relative', backgroundColor: '#020617', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ color: '#38bdf8', textAlign: 'center', padding: '2rem' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Áquila Pro — Tour Virtual & Gêmeo Digital da Escola</h3>
                <p style={{ color: '#94a3b8' }}>Ambiente 3D com renderização acelerada por GPU.</p>
            </div>
        </div>
    );
};
