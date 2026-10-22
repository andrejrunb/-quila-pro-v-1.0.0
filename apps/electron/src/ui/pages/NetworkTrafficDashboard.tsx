import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  ShieldAlert, 
  Wifi, 
  Globe, 
  Server, 
  ArrowDownToLine, 
  ArrowUpFromLine, 
  PowerOff, 
  ArrowLeft, 
  ShieldCheck, 
  ExternalLink, 
  RefreshCw,
  Info
} from 'lucide-react';
import './NetworkTrafficDashboard.css';

interface TrafficPoint {
  id: number;
  download: number;
  upload: number;
}

interface Endpoint {
  id: string;
  name: string;
  ip: string;
  usageMbps: number;
  status: 'normal' | 'warning' | 'critical';
}

interface NetworkGuardStatus {
  success: boolean;
  active: boolean;
  dockerInstalled: boolean;
  containerId?: string;
  status?: string;
  error?: string;
}

export const NetworkTrafficDashboard: React.FC<{ onBack?: () => void }> = ({ onBack }) => {
  const [trafficData, setTrafficData] = useState<TrafficPoint[]>([]);
  const [endpoints, setEndpoints] = useState<Endpoint[]>([]);
  const [isIsolated, setIsIsolated] = useState(false);
  const [currentDown, setCurrentDown] = useState(0);
  const [currentUp, setCurrentUp] = useState(0);

  // Network Guard State
  const [guardStatus, setGuardStatus] = useState<NetworkGuardStatus | null>(null);
  const [isLoadingGuard, setIsLoadingGuard] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Simula tráfego em tempo real
  useEffect(() => {
    // Populate initial data
    const initialData = Array.from({ length: 20 }, (_, i) => ({
      id: i,
      download: Math.random() * 150 + 20,
      upload: Math.random() * 50 + 10,
    }));
    setTrafficData(initialData);

    const initialEndpoints: Endpoint[] = [
      { id: 'e1', name: 'NPU Core (Visão Computacional)', ip: '10.0.0.12', usageMbps: 85.4, status: 'normal' },
      { id: 'e2', name: 'Catracas Principais', ip: '10.0.0.45', usageMbps: 12.1, status: 'normal' },
      { id: 'e3', name: 'Câmera Corredor A', ip: '10.0.0.101', usageMbps: 24.5, status: 'normal' },
      { id: 'e4', name: 'Dispositivo Desconhecido (iPhone)', ip: '10.0.2.14', usageMbps: 180.2, status: 'critical' },
      { id: 'e5', name: 'Smart TV Biblioteca', ip: '10.0.1.5', usageMbps: 95.8, status: 'warning' },
    ];
    setEndpoints(initialEndpoints);

    const interval = setInterval(() => {
      setTrafficData(prev => {
        if (prev.length === 0) return prev;
        const newData = [...prev.slice(1)];
        // Se a rede estiver isolada, o tráfego despenca para dispositivos não essenciais
        const mult = isIsolated ? 0.3 : 1;
        const newPoint = {
          id: prev[prev.length - 1].id + 1,
          download: (Math.random() * 200 + 50) * mult,
          upload: (Math.random() * 80 + 10) * mult,
        };
        
        setCurrentDown(newPoint.download);
        setCurrentUp(newPoint.upload);
        
        newData.push(newPoint);
        return newData;
      });
      
      // Update endpoints randomicamente para dar sensação de life
      setEndpoints(prev => prev.map(ep => {
         if (isIsolated && (ep.status === 'critical' || ep.status === 'warning')) {
             return { ...ep, usageMbps: 0, status: 'normal', name: ep.name + ' (ISOLADO)' };
         }
         return { ...ep, usageMbps: Math.max(0, ep.usageMbps + (Math.random() * 10 - 5)) };
      }));
    }, 1500);

    return () => clearInterval(interval);
  }, [isIsolated]);

  // Carrega status do Network Guard (Pi-hole)
  const fetchGuardStatus = async () => {
    try {
      if (window.aquila && typeof window.aquila.getNetworkGuardStatus === 'function') {
        const status = await window.aquila.getNetworkGuardStatus();
        setGuardStatus(status);
        if (!status.success && status.error) {
          setErrorMessage(status.error);
        }
      }
    } catch (err: any) {
      console.error('Erro ao buscar status do DNS Shield:', err);
      setErrorMessage(err.message);
    }
  };

  useEffect(() => {
    fetchGuardStatus();
  }, []);

  const handleStartGuard = async () => {
    setIsLoadingGuard(true);
    setErrorMessage(null);
    try {
      if (window.aquila && typeof window.aquila.startNetworkGuard === 'function') {
        const res = await window.aquila.startNetworkGuard();
        if (res.success) {
          await fetchGuardStatus();
        } else {
          setErrorMessage(res.error || 'Falha ao iniciar o DNS Shield.');
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setIsLoadingGuard(false);
    }
  };

  const handleStopGuard = async () => {
    setIsLoadingGuard(true);
    setErrorMessage(null);
    try {
      if (window.aquila && typeof window.aquila.stopNetworkGuard === 'function') {
        const res = await window.aquila.stopNetworkGuard();
        if (res.success) {
          await fetchGuardStatus();
        } else {
          setErrorMessage(res.error || 'Falha ao parar o DNS Shield.');
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setIsLoadingGuard(false);
    }
  };

  const toggleIsolation = () => {
    if (!isIsolated) {
      if (window.confirm("ATENÇÃO: Acionar o Kill Switch isolará todos os dispositivos não autenticados (Alunos/Visitantes) da rede Edge. Apenas infraestrutura crítica continuará online. Prosseguir?")) {
        setIsIsolated(true);
      }
    } else {
      setIsIsolated(false);
    }
  };

  return (
    <div className="network-traffic-container animate-fade-in">
      <header className="traffic-header">
        <div className="traffic-title">
          {onBack && (
            <button onClick={onBack} className="back-btn" title="Voltar ao Painel">
              <ArrowLeft size={18} />
            </button>
          )}
          <Activity size={28} className="text-sky-400" />
          <div>
            <h1>Sovereign Network Operations (SOC)</h1>
            <p>Análise Profunda de Tráfego LAN / WLAN e Segurança Perimetral</p>
          </div>
        </div>

        <div className="header-status">
          <div className="status-badge">
            <ShieldAlert size={16} />
            FIREWALL: ATIVO (NÍVEL L7)
          </div>
          <button 
            className={`kill-switch-btn ${isIsolated ? 'active' : ''}`}
            onClick={toggleIsolation}
          >
            <PowerOff size={18} />
            {isIsolated ? 'REDE EM MODO DE ISOLAMENTO' : 'KILL SWITCH (ISOLAR REDE)'}
          </button>
        </div>
      </header>

      <div className="traffic-grid">
        <section className="traffic-card">
          <h3><Globe size={18} /> Tráfego de Borda (Live Packets)</h3>
          
          <div className="main-graph-area">
            {trafficData.map((pt) => (
              <div key={pt.id} className="chart-bar-wrapper">
                <div 
                  className={`chart-bar ${pt.download > 180 ? 'heavy' : ''}`} 
                  style={{ height: `${Math.min(100, (pt.download / 300) * 100)}%` }}
                  title={`Down: ${pt.download.toFixed(1)} Mbps`}
                ></div>
              </div>
            ))}
          </div>

          <div className="metrics-summary mt-6">
            <div className="metric-box">
              <div className="label"><ArrowDownToLine size={14} className="inline mr-1"/> Download Agregado</div>
              <div className="value glow">{currentDown.toFixed(1)} Mbps</div>
            </div>
            <div className="metric-box">
              <div className="label"><ArrowUpFromLine size={14} className="inline mr-1"/> Upload Agregado</div>
              <div className="value">{currentUp.toFixed(1)} Mbps</div>
            </div>
          </div>
        </section>

        <div className="traffic-sidebar">
          <section className="traffic-card mb-6">
            <h3><Server size={18} /> Consumo por Endpoint (Top Talkers)</h3>
            
            <div className="endpoints-list">
              {endpoints.sort((a, b) => b.usageMbps - a.usageMbps).map(ep => (
                <div key={ep.id} className={`endpoint-item ${ep.status}`}>
                  <div className="endpoint-info">
                    <span className="endpoint-name">{ep.name}</span>
                    <span className="endpoint-ip"><Wifi size={10} className="inline mr-1"/> {ep.ip}</span>
                  </div>
                  <div className="endpoint-usage">
                    {ep.usageMbps.toFixed(1)} Mb/s
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Sovereign DNS Shield & Adblocker Card */}
          <section className="traffic-card dns-shield-card">
            <div className="dns-card-header">
              <h3>
                {guardStatus?.active ? (
                  <ShieldCheck size={18} className="text-emerald-400" />
                ) : (
                  <ShieldAlert size={18} className="text-slate-400" />
                )}
                Sovereign DNS Shield
              </h3>
              
              {guardStatus && (
                <span className={`dns-status-tag ${guardStatus.active ? 'active' : 'inactive'}`}>
                  {guardStatus.active ? 'ATIVO' : 'DESATIVADO'}
                </span>
              )}
            </div>

            <p className="dns-description">
              Proteção local perimetral de rede via Pi-hole. Bloqueia rastreadores, anúncios e ameaças DNS sem tráfego de dados externo (Compliance total LGPD).
            </p>

            {errorMessage && (
              <div className="dns-error-alert">
                <Info size={14} />
                <span>{errorMessage}</span>
              </div>
            )}

            {guardStatus && !guardStatus.dockerInstalled ? (
              <div className="dns-warning-box">
                <p><strong>Requisito ausente:</strong> Docker não foi detectado no host. Instale o Docker Engine ou Docker Desktop para iniciar o DNS Shield.</p>
              </div>
            ) : (
              <div className="dns-controls">
                {guardStatus?.active ? (
                  <button 
                    onClick={handleStopGuard} 
                    disabled={isLoadingGuard}
                    className="dns-action-btn stop"
                  >
                    {isLoadingGuard ? (
                      <RefreshCw size={16} className="animate-spin" />
                    ) : (
                      <PowerOff size={16} />
                    )}
                    Parar Filtro de Rede
                  </button>
                ) : (
                  <button 
                    onClick={handleStartGuard} 
                    disabled={isLoadingGuard || (guardStatus && !guardStatus.dockerInstalled)}
                    className="dns-action-btn start"
                  >
                    {isLoadingGuard ? (
                      <RefreshCw size={16} className="animate-spin" />
                    ) : (
                      <ShieldCheck size={16} />
                    )}
                    Ativar Blindagem DNS
                  </button>
                )}

                {guardStatus?.active && (
                  <a 
                    href="http://localhost:8082/admin" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="dns-console-btn"
                    title="Acessar painel web do Pi-hole"
                  >
                    <ExternalLink size={16} />
                    Console Admin
                  </a>
                )}
              </div>
            )}

            {/* Config Specs */}
            <div className="dns-specs-table">
              <div className="dns-spec-row">
                <span className="spec-label">IP local do Servidor:</span>
                <span className="spec-val code">127.0.0.1:53</span>
              </div>
              <div className="dns-spec-row">
                <span className="spec-label">Upstream DNS:</span>
                <span className="spec-val">1.1.1.3 (Cloudflare Family)</span>
              </div>
              <div className="dns-spec-row">
                <span className="spec-label">Senha do Console:</span>
                <span className="spec-val code">Admin@2026!</span>
              </div>
              <div className="dns-spec-row">
                <span className="spec-label">Privacidade:</span>
                <span className="spec-val text-emerald-400">100% Offline / Local</span>
              </div>
            </div>

            {/* Live DNS Block Metrics Simulation */}
            {guardStatus?.active && (
              <div className="dns-stats-simulation">
                <div className="dns-sim-box">
                  <span className="sim-label">Queries Bloqueadas</span>
                  <span className="sim-val text-emerald-400">14.250</span>
                </div>
                <div className="dns-sim-box">
                  <span className="sim-label">Taxa de Bloqueio</span>
                  <span className="sim-val text-sky-400">32.4%</span>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};

export default NetworkTrafficDashboard;
