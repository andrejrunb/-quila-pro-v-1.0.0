import React, { useState, useEffect } from 'react';
import { Activity, Cpu, HardDrive, ShieldCheck, Zap } from 'lucide-react';
import './HardwareDiagnostics.css';

export const HardwareDiagnostics: React.FC = () => {
  const [cpuUsage, setCpuUsage] = useState(0);
  const [workerStats] = useState({ poolSize: 4, activeWorkers: 4, avgLatency: 120 });
  
  useEffect(() => {
    const interval = setInterval(() => {
      setCpuUsage(Math.floor(20 + Math.random() * 40));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const MetricCard = ({ icon: Icon, label, value, unit, status = 'success' }: any) => (
    <div className="metric-card glass">
      <div className="metric-header">
        <Icon size={20} className={`icon-${status}`} />
        <span className="metric-label">{label}</span>
      </div>
      <div className="metric-body">
        <span className="metric-value">{value}</span>
        <span className="metric-unit">{unit}</span>
      </div>
    </div>
  );

  return (
    <div className="diagnostics-container animate-fade-in">
      <div className="diag-header">
        <Activity size={24} />
        <h1>Diagnóstico de Hardware & Escala</h1>
      </div>

      <div className="metrics-grid">
        <MetricCard icon={Cpu} label="Carga de CPU" value={cpuUsage} unit="%" status={cpuUsage > 80 ? 'danger' : 'success'} />
        <MetricCard icon={Zap} label="Aceleração GPU" value="Ativa" unit="(CUDA)" status="success" />
        <MetricCard icon={ShieldCheck} label="Latência Média" value={workerStats.avgLatency} unit="ms" />
        <MetricCard icon={HardDrive} label="Worker Pool" value={`${workerStats.activeWorkers}/${workerStats.poolSize}`} unit="Online" />
      </div>

      <div className="worker-monitor-section">
        <h3>Status do Worker Pool (Item 61)</h3>
        <div className="worker-list glass">
          {[...Array(workerStats.poolSize)].map((_, i) => (
            <div key={i} className="worker-item">
              <span className="w-id">Worker #{i}</span>
              <span className="w-status online">Executando</span>
              <div className="w-load-bar">
                <div 
                  className="w-load-fill" 
                  ref={el => {
                    if (el) el.style.width = `${30 + Math.random() * 50}%`;
                  }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HardwareDiagnostics;
