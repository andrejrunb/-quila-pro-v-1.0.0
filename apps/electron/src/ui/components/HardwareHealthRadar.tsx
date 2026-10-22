import React, { useEffect, useState } from 'react';
import './HardwareHealthRadar.css';

interface HardwareStatus {
  isThrottled: boolean;
  cpuLoad: number;
  memoryUsage: number;
  npu?: {
    temperature: number;
    healthScore: number;
    load_factor: number;
  };
}

export const HardwareHealthRadar: React.FC = () => {
  const [status, setStatus] = useState<HardwareStatus | null>(null);

  const fetchStatus = async () => {
    try {
      const data = await (window as any).aquila.invoke('hardware:get-status');
      setStatus(data);
    } catch (err) {
      console.error('Failed to fetch hardware status:', err);
    }
  };

  useEffect(() => {
    fetchStatus();
    const timer = setInterval(fetchStatus, 5000);
    return () => clearInterval(timer);
  }, []);

  if (!status) return <div className="radar-skeleton">Iniciando Sensores...</div>;

  const getGlowColor = () => {
    if (status.isThrottled) return 'var(--danger-glow)';
    if (status.npu && status.npu.temperature > 70) return 'var(--warning-glow)';
    return 'var(--success-glow)';
  };

  return (
    <div className={`hardware-radar glass-card ${status.isThrottled ? 'throttled' : ''}`} style={{ '--radar-glow': getGlowColor() } as any}>
      <div className="radar-header">
        <h4 className="radar-title">Radar de Saúde Soberana</h4>
        <span className={`status-dot ${status.isThrottled ? 'blink' : ''}`}></span>
      </div>

      <div className="metrics-grid">
        <div className="metric-item">
          <span className="metric-label">NPU TEMP</span>
          <span className="metric-value">{status.npu?.temperature.toFixed(1)}°C</span>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${(status.npu?.temperature || 0)}%`, backgroundColor: (status.npu?.temperature || 0) > 70 ? '#f43f5e' : '#0d9488' }}></div>
          </div>
        </div>

        <div className="metric-item">
          <span className="metric-label">CPU LOAD</span>
          <span className="metric-value">{status.cpuLoad.toFixed(1)}%</span>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${status.cpuLoad}%` }}></div>
          </div>
        </div>

        <div className="metric-item">
          <span className="metric-label">NEURAL HEALTH</span>
          <span className="metric-value">{status.npu?.healthScore}%</span>
        </div>
      </div>

      {status.isThrottled && (
        <div className="throttled-warning">
          <span className="warning-icon">⚠️</span>
          Modo THERMAL_SAFE Ativo (v1.0)
        </div>
      )}
    </div>
  );
};
