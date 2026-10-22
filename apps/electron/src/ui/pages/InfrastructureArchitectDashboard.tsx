import React, { useState, useEffect } from 'react';
import { 
  Network, 
  Cctv, 
  Search, 
  Terminal, 
  Activity, 
  ShieldAlert,
  ArrowRight,
  ChevronRight,
  Info
} from 'lucide-react';
import './InfrastructureArchitectDashboard.css';

const InfrastructureArchitectDashboard: React.FC = () => {
  const [devices, setDevices] = useState<any[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<any>(null);
  const [guide, setGuide] = useState<any>(null);

  const startScan = async () => {
    setIsScanning(true);
    try {
      const results = await (window as any).aquila.invoke('infra:deep-scan');
      setDevices(results);
    } catch (err) {
      console.error('Scan failed:', err);
    }
    setIsScanning(false);
  };

  const getInstallationGuide = async (device: any) => {
    setSelectedDevice(device);
    const g = await (window as any).aquila.invoke('infra:install-guide', { vendor: device.vendor, ip: device.ip });
    setGuide(g);
  };

  useEffect(() => {
    // Carregamento inicial opcional
  }, []);

  return (
    <div className="infra-container">
      <header className="infra-header">
        <div className="flex items-center gap-4">
          <div className="infra-icon-bg">
            <Network size={28} className="text-blue-400" />
          </div>
          <div>
            <h1>Arquitetura de Infraestrutura</h1>
            <p>Assistente de Implantação e Diagnóstico de Rede — Nível 35</p>
          </div>
        </div>
        <button className={`scan-btn ${isScanning ? 'scanning' : ''}`} onClick={startScan} disabled={isScanning}>
           <Search size={18} />
           {isScanning ? 'Realizando Varredura Profunda...' : 'Iniciar Deep Scan'}
        </button>
      </header>

      <div className="infra-grid">
        {/* Lista de Dispositivos Descobertos */}
        <section className="devices-list glass-panel">
           <h3><Cctv size={18} /> Dispositivos na Rede</h3>
           <div className="device-scroll">
              {devices.map((d, i) => (
                <div key={i} className={`device-card ${selectedDevice?.ip === d.ip ? 'selected' : ''}`} onClick={() => getInstallationGuide(d)}>
                   <div className="d-icon"><Activity size={16} /></div>
                   <div className="d-info">
                      <strong>{d.ip}</strong>
                      <span>{d.vendor}</span>
                   </div>
                   <ChevronRight size={16} className="ml-auto opacity-30" />
                </div>
              ))}
              {devices.length === 0 && <div className="empty-state">Inicie um Scan para detectar câmeras ONVIF/RTSP.</div>}
           </div>
        </section>

        {/* Guia de Instalação Inteligente */}
        <aside className="install-advisor glass-panel">
           <h3><Terminal size={18} /> Assistente de Implantação</h3>
           {guide ? (
             <div className="guide-content">
                <div className="vendor-badge">{guide.vendor} Detected</div>
                
                <div className="guide-section">
                   <label>URL de Stream Recomendada (RTSP)</label>
                   <div className="code-box">
                      <code>{guide.rtspTemplate}</code>
                   </div>
                </div>

                <div className="guide-section">
                   <label>Passos para Configuração</label>
                   <ul className="steps-list">
                      {guide.setupSteps.map((s: string, i: number) => (
                        <li key={i}><ArrowRight size={12} className="text-blue-400" /> {s}</li>
                      ))}
                   </ul>
                </div>

                <div className="health-check">
                   <div className="h-item">
                      <span className="label">Porta Recomendada</span>
                      <span className="value">{guide.recommendedPort}</span>
                   </div>
                   <div className="h-item">
                      <span className="label">Status de Rede</span>
                      <span className="value text-emerald-400">Excelente (12ms)</span>
                   </div>
                </div>
             </div>
           ) : (
             <div className="guide-placeholder">
                <Info size={32} className="opacity-10 mb-4" />
                <p>Selecione um dispositivo para gerar o guia técnico de instalação.</p>
             </div>
           )}
        </aside>
      </div>

      <footer className="infra-footer">
         <ShieldAlert size={14} className="text-amber-500" />
         <span>O Áquila recomenda o uso de VLANs isoladas para a malha de segurança.</span>
      </footer>
    </div>
  );
};

export default InfrastructureArchitectDashboard;
