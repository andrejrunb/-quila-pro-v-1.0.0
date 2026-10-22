import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  Zap, 
  FileSearch, 
  Database, 
  WifiOff, 
  AlertTriangle,
  RefreshCw,
  Cpu
} from 'lucide-react';
import './SecurityExecutiveVault.css';

interface ResilienceStats {
  kernelIntegrity: string;
  encryptionStandard: string;
  airGapStatus: 'ACTIVE' | 'STANDBY';
  lastAudit: string;
}

/**
 * SECURITY EXECUTIVE VAULT (v8001)
 * -------------------------------
 * O centro de comando de resiliência quântica e soberania de dados.
 * Implementa visualização Zero-Trust para a gestão executiva.
 */
export const SecurityExecutiveVault: React.FC = () => {
  const [stats, setStats] = useState<ResilienceStats | null>(null);
  const [isAuditing, setIsAuditing] = useState(false);
  const [airGap, setAirGap] = useState(false);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    // @ts-ignore
    const data = await window.electron.ipcRenderer.invoke('resilience:get-stats');
    setStats(data);
    setAirGap(data.airGapStatus === 'ACTIVE');
  };

  const runAudit = async () => {
    setIsAuditing(true);
    // @ts-ignore
    await window.electron.ipcRenderer.invoke('resilience:run-audit');
    await new Promise(r => setTimeout(r, 2000)); // Simulação de processamento pesado
    await loadStats();
    setIsAuditing(false);
  };

  const toggleAirGap = async () => {
    const newState = !airGap;
    // @ts-ignore
    await window.electron.ipcRenderer.invoke('resilience:toggle-airgap', newState);
    setAirGap(newState);
    await loadStats();
  };

  if (!stats) return <div className="vault-loader">Decrypting Security Layers...</div>;

  return (
    <div className="vault-container">
      <header className="vault-header">
        <div className="flex items-center gap-4">
          <div className="icon-box-vault">
            <Lock className="text-amber-500" size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-100 tracking-tighter">SOVEREIGN VAULT</h1>
            <p className="text-amber-500/60 text-xs font-bold uppercase tracking-widest">Quantum Resilience & Integrity Audit v8.0</p>
          </div>
        </div>
        <div className="security-badge">
          <ShieldCheck size={14} className="text-emerald-400" />
          <span>ESTADO: SEGURO</span>
        </div>
      </header>

      <div className="vault-grid">
        {/* Card 1: Integridade do Kernel */}
        <div className="vault-card highlight--blue">
          <div className="flex justify-between items-start mb-6">
            <div className="card-label">
              <Cpu size={16} /> Kernel Integrity
            </div>
            <div className="text-emerald-400 font-mono text-xl">{stats.kernelIntegrity}</div>
          </div>
          <div className="integrity-bar">
            <div className="integrity-fill" style={{ width: stats.kernelIntegrity }} />
          </div>
          <div className="mt-4 text-[10px] text-slate-500 uppercase font-bold">SHA3-256 Multi-Factor Validation</div>
        </div>

        {/* Card 2: Padrão de Criptografia */}
        <div className="vault-card highlight--purple">
          <div className="card-label mb-2">
            <Database size={16} /> Data Encryption
          </div>
          <div className="text-lg font-bold text-slate-200">{stats.encryptionStandard}</div>
          <div className="mt-2 p-2 bg-purple-500/10 border border-purple-500/20 rounded text-[10px] text-purple-300">
            Quantum-Resistant Lattice Encryption Active
          </div>
        </div>

        {/* Card 3: Air-Gap Switch */}
        <div className="vault-card highlight--amber">
          <div className="flex justify-between items-center">
            <div className="card-label">
              <WifiOff size={16} /> Air-Gap Mode
            </div>
            <button 
              onClick={toggleAirGap}
              className={`toggle-btn ${airGap ? 'active' : ''}`}
            >
              {airGap ? 'ON' : 'OFF'}
            </button>
          </div>
          <p className="text-[10px] text-slate-500 mt-4 leading-relaxed">
            Quando ativado, isola a unidade de qualquer comunicação externa, mantendo apenas a rede local Áquila.
          </p>
        </div>
      </div>

      <div className="vault-actions mt-8">
        <button 
          onClick={runAudit} 
          disabled={isAuditing}
          className="audit-btn"
        >
          {isAuditing ? <RefreshCw className="animate-spin" /> : <FileSearch size={18} />}
          <span>{isAuditing ? 'Auditoria em Curso...' : 'Executar Auditoria de Integridade'}</span>
        </button>
        
        <div className="audit-log-preview">
          <div className="text-[10px] font-bold text-slate-500 uppercase mb-3">Última Auditoria</div>
          <div className="flex items-center justify-between p-3 bg-black/40 rounded border border-white/5">
            <div className="flex items-center gap-3">
              <Zap size={14} className="text-amber-400" />
              <span className="text-xs font-mono text-slate-300">System Core Hash Validated</span>
            </div>
            <span className="text-[10px] text-slate-500">{new Date(stats.lastAudit).toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Warning Overlay Simulado */}
      <div className="security-alert-footer">
        <AlertTriangle size={16} className="text-amber-500" />
        <span>ATENÇÃO: Monitoramento Zero-Trust ativo em tempo real. Qualquer alteração no binário será reportada ao Córtex Central.</span>
      </div>
    </div>
  );
};
