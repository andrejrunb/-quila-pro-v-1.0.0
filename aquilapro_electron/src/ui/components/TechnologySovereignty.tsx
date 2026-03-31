import React, { useState, useEffect } from 'react';
import { ShieldAlert, Cpu as NpuIcon } from 'lucide-react';
import './TechnologySovereignty.css';

/**
 * Componente Phase 321-400: Technology Sovereignty
 * Visualiza métricas de hardware especializado (NPU) e soberania de dados.
 */
export const TechnologySovereignty: React.FC = () => {
  const [status, setStatus] = useState<any>(null);

  useEffect(() => {
    // Phase v3460: Usando o bridge seguro para soberania tecnológica
    const unsub = window.aquila?.onNpuStatus?.(setStatus);
    return () => {
      if (unsub) unsub();
    };
  }, []);

  if (!status) return null;

  return (
    <div className="sovereignty-container" role="region" aria-label="Soberania Tecnológica Áquila">
      <header className="sovereignty-header">
        <div className="sovereignty-title-group">
          <NpuIcon className="npu-icon-main" size={20} />
          <h2 className="sovereignty-title">Technology Sovereignty Layer</h2>
        </div>
        <div className="sovereignty-badge">
          <ShieldAlert size={12} className="badge-icon" />
          <span className="badge-text">Proprietary Edge Hub</span>
        </div>
      </header>

      <div className="sovereignty-content">
        <div className="npu-metrics-grid">
          <div className="stat-box">
            <div className="stat-label">NPU Model Acceleration</div>
            <div className="stat-value">{status.modelAcceleration}x</div>
          </div>
          <div className="stat-box">
            <div className="stat-label">Operating Temperature</div>
            <div className="stat-value">{status.temperature.toFixed(1)}°C</div>
          </div>
          <div className="stat-box">
            <div className="stat-label">Kernel Power Draw</div>
            <div className="stat-value">{status.powerDraw.toFixed(2)}W</div>
          </div>
          <div className="stat-box">
            <div className="stat-label">Optimization State</div>
            <div className="stat-value stat-value--nominal">NOMINAL</div>
          </div>
        </div>

        <div className="npu-visual-stack">
          <div className="npu-chip-visual">
            <div className="npu-pulse-overlay" />
          </div>
          <div className="kernel-pool">
            {status.activeKernels.map((kernel: string) => (
              <span key={kernel} className="kernel-tag">{kernel}</span>
            ))}
          </div>
        </div>
      </div>

      <div className="sovereignty-footer">
        <div className="footer-label">Local Sovereignty Audit</div>
        <div className="footer-text">
          O Áquila Pro está processando todas as redes neurais internamente no NPU local. 
          Nenhum dado biométrico ou imagem está deixando os limites físicos do campus. 
          Criptografia de disco AES-256 ativa via Secure Element.
        </div>
      </div>
    </div>
  );
};
