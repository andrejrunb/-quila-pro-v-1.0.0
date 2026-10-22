import React, { useState, useEffect } from 'react';
import { 
  Cpu, 
  Cloud, 
  Smartphone, 
  ShieldCheck, 
  Zap, 
  Activity,
  HardDrive,
  RefreshCw
} from 'lucide-react';
import './InfrastructureDashboardUI.css';

const InfrastructureDashboardUI: React.FC = () => {
  const [telemetry, setTelemetry] = useState<any>(null);
  const [cloud, setCloud] = useState<any>(null);
  const [mobile, setMobile] = useState<any>(null);

  const fetchData = async () => {
    try {
      const t = await (window as any).aquila.invoke('infra:npu-telemetry');
      const c = await (window as any).aquila.invoke('infra:cloud-sync');
      const m = await (window as any).aquila.invoke('mobile:get-status');
      setTelemetry(t);
      setCloud(c);
      setMobile(m);
    } catch (err) {
      console.error('Erro ao carregar telemetria de infraestrutura:', err);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="infra-container">
      <header className="infra-header">
        <div className="flex items-center gap-4">
          <div className="infra-icon-glow">
             <Cpu size={32} className="text-emerald-400" />
          </div>
          <div>
            <h1>Centro de Comando de Infraestrutura</h1>
            <p>Monitoramento Soberano — Fase de Expansão</p>
          </div>
        </div>
        <div className="system-health">
           <ShieldCheck size={20} className="text-emerald-400" />
           <span>NÚCLEO ESTÁVEL</span>
        </div>
      </header>

      <div className="infra-grid">
        {/* Card NPU (NpuOptimizer) */}
        <div className="infra-card glass-panel">
           <div className="card-header">
              <Zap size={24} className="text-amber-400" />
              <h3>Áquila Edge Hub (NPU)</h3>
           </div>
           <div className="metric-row">
              <div className="metric">
                 <label>Carga de Trabalho</label>
                 <div className="val">{telemetry?.load.toFixed(1)}%</div>
              </div>
              <div className="metric">
                 <label>Temperatura</label>
                 <div className="val">42°C</div>
              </div>
           </div>
           <div className="progress-bar"><div className="fill" style={{ width: `${telemetry?.load}%` }}></div></div>
           <p className="card-footer">Perfil: MAX_PERFORMANCE (26 TOPS)</p>
        </div>

        {/* Card Cloud (aquila-cloud) */}
        <div className="infra-card glass-panel">
           <div className="card-header">
              <Cloud size={24} className="text-blue-400" />
              <h3>Sovereign Cloud Mirror</h3>
           </div>
           <div className="sync-status">
              <RefreshCw size={16} className="animate-spin text-blue-400" />
              <span>Sincronizando Delta...</span>
           </div>
           <div className="metric">
              <label>Última Resposta</label>
              <div className="val-small">{cloud?.lastSync}</div>
           </div>
           <p className="card-footer">Provedor: {cloud?.provider}</p>
        </div>

        {/* Card Mobile (aquilapro_mobile) */}
        <div className="infra-card glass-panel">
           <div className="card-header">
              <Smartphone size={24} className="text-purple-400" />
              <h3>Gateway Mobile</h3>
           </div>
           <div className="metric-row">
              <div className="metric">
                 <label>Dispositivos Ativos</label>
                 <div className="val">{mobile?.activeClients || 0}</div>
              </div>
              <div className="metric">
                 <label>Porta WebSocket</label>
                 <div className="val">9000</div>
              </div>
           </div>
           <button className="infra-btn">Gerenciar Pareamentos</button>
        </div>

        {/* Status Geral */}
        <div className="infra-card glass-panel status-overview">
           <div className="card-header">
              <Activity size={24} className="text-pink-400" />
              <h3>Saúde da Rede</h3>
           </div>
           <div className="health-stat">
              <HardDrive size={16} />
              <span>Banco de Dados: OTIMIZADO</span>
           </div>
           <div className="health-stat">
              <ShieldCheck size={16} />
              <span>Criptografia: AES-256-GCM (Quantum Ready)</span>
           </div>
        </div>
      </div>

      <footer className="infra-footer">
         <Cpu size={14} className="text-emerald-400" />
         <span>Infraestrutura Áquila Pro: Poder de processamento local com redundância soberana.</span>
      </footer>
    </div>
  );
};

export default InfrastructureDashboardUI;
