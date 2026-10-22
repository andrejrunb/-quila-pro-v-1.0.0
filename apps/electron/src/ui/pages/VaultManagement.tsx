import React, { useState, useEffect } from 'react';
import { 
  Key, 
  Lock, 
  ShieldCheck, 
  RefreshCw, 
  Activity, 
  AlertTriangle,
  History,
  Cpu,
  Layers
} from 'lucide-react';
import './VaultManagement.css';

const VaultManagement: React.FC = () => {
  const [vaultInfo, setVaultInfo] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchVaultData = async () => {
    try {
      const info = await (window as any).aquila.invoke('vault:get-health');
      setVaultInfo(info);
      setLoading(false);
    } catch (err) {
      console.error('Erro ao buscar dados do Vault:', err);
    }
  };

  useEffect(() => {
    fetchVaultData();
    const interval = setInterval(fetchVaultData, 5000);
    return () => clearInterval(interval);
  }, []);

  if (loading || !vaultInfo) {
    return <div className="vault-loading">Iniciando protocolo de acesso ao Vault...</div>;
  }

  return (
    <div className="vault-container">
      <header className="vault-header">
        <div className="flex items-center gap-4">
          <Key className="vault-logo-glow" size={32} />
          <div>
            <h1>Sovereign Quantum Vault</h1>
            <p>Gerenciamento de Segredos e Chaves Quânticas — Áquila Pro v2.0.0</p>
          </div>
        </div>
        <div className="vault-status-badge">
           <span className="label">Status do Vault</span>
           <span className="value">NOMINAL</span>
        </div>
      </header>

      <div className="vault-grid">
        {/* Métricas Quânticas */}
        <section className="vault-stats glass-panel">
          <div className="stat-card">
             <Layers size={20} className="text-blue-400" />
             <div className="stat-info">
                <span className="s-label">Algoritmo Ativo</span>
                <span className="s-value">{vaultInfo.algorithm}</span>
             </div>
          </div>
          <div className="stat-card">
             <ShieldCheck size={20} className="text-emerald-400" />
             <div className="stat-info">
                <span className="s-label">Resiliência PQC</span>
                <span className="s-value">Habilitada (Kyber/Lattice)</span>
             </div>
          </div>
          <div className="stat-card">
             <Cpu size={20} className="text-purple-400" />
             <div className="stat-info">
                <span className="s-label">Nível de Entropia</span>
                <span className="s-value">{vaultInfo.entropyLevel}%</span>
             </div>
          </div>
        </section>

        {/* Chaves e Rotação */}
        <section className="key-management glass-panel">
          <h3><RefreshCw size={18} /> Rotação de Chaves Soberanas</h3>
          <div className="key-list">
             <div className="key-item">
                <div className="k-header">
                   <strong>ARK-ENXAME-PRINCIPAL</strong>
                   <span className="k-tag">ACTIVE</span>
                </div>
                <div className="k-footer">
                   <span>Última rotação: há 12h</span>
                   <button className="btn-rotate">Rotacionar Agora</button>
                </div>
             </div>
             <div className="key-item">
                <div className="k-header">
                   <strong>ARK-BIOMETRIA-REPOUSO</strong>
                   <span className="k-tag">ENCRYPTED</span>
                </div>
                <div className="k-footer">
                   <span>Última rotação: há 24h</span>
                   <button className="btn-rotate">Rotacionar Agora</button>
                </div>
             </div>
          </div>
        </section>

        {/* Logs de Acesso Zero-Trust */}
        <section className="zero-trust-logs glass-panel">
          <h3><History size={18} /> Auditoria Zero-Trust</h3>
          <div className="audit-list">
             <div className="audit-item success">
                <div className="a-marker"></div>
                <div className="a-content">
                   <p>Ação Administrativa Autorizada via Biometria Face</p>
                   <span>Admin: andrej | há 5 min</span>
                </div>
             </div>
             <div className="audit-item warning">
                <div className="a-marker"></div>
                <div className="a-content">
                   <p>Desafio Zero-Trust Ignorado / Expirado</p>
                   <span>IP: 192.168.1.42 | há 15 min</span>
                </div>
             </div>
          </div>
        </section>
      </div>

      <footer className="vault-footer">
         <Lock size={14} className="text-emerald-500" />
         <span>Proteção Quântica Ativa em Repouso e Trânsito</span>
      </footer>
    </div>
  );
};

export default VaultManagement;
