import React, { useState, useEffect } from 'react';
import { 
  Globe, 
  MapPin, 
  Plus, 
  ArrowLeft, 
  Settings, 
  BarChart, 
  Shield, 
  Database,
  RefreshCw,
  ExternalLink,
  CheckCircle2,
  X,
  Wifi,
  Radio,
  Server
} from 'lucide-react';
import './MultiSiteManager.css';

interface Unit {
  id: string;
  name: string;
  address: string;
  inepCode: string;
  status: 'online' | 'offline' | 'syncing';
  lastSync: string;
  studentCount: number;
  cameraCount: number;
  ipEndpoint: string;
}

interface MultiSiteManagerProps {
  onBack: () => void;
  onSelectUnit?: (unitId: string) => void;
}

export const MultiSiteManager: React.FC<MultiSiteManagerProps> = ({ onBack, onSelectUnit }) => {
  const [units, setUnits] = useState<Unit[]>([
    { 
      id: 'unit-matriz', 
      name: 'Colégio Visão — Matriz Asa Sul', 
      address: 'SGAS 915 Lote 68, Brasília - DF', 
      inepCode: '53001892',
      status: 'online', 
      lastSync: 'Agora (Sincronizado)', 
      studentCount: 1250,
      cameraCount: 32,
      ipEndpoint: '10.0.1.1 (Edge Central)'
    },
    { 
      id: 'unit-kids', 
      name: 'Colégio Visão — Unidade Kids Asa Norte', 
      address: 'SGAN 706 Bloco C, Brasília - DF', 
      inepCode: '53002410',
      status: 'online', 
      lastSync: 'Há 4 min', 
      studentCount: 450,
      cameraCount: 16,
      ipEndpoint: '10.0.2.1 (Edge Gateway)'
    },
    { 
      id: 'unit-highschool', 
      name: 'Colégio Visão — Unidade Águas Claras High', 
      address: 'Rua das Figueiras Lote 12, Águas Claras - DF', 
      inepCode: '53003980',
      status: 'online', 
      lastSync: 'Há 12 min', 
      studentCount: 890,
      cameraCount: 24,
      ipEndpoint: '10.0.3.1 (Edge Gateway)'
    },
  ]);

  const [activeUnitId, setActiveUnitId] = useState<string>('unit-matriz');
  const [isSyncingAll, setIsSyncingAll] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  // Form states for new unit
  const [newUnitName, setNewUnitName] = useState('');
  const [newUnitAddress, setNewUnitAddress] = useState('');
  const [newUnitInep, setNewUnitInep] = useState('');
  const [newUnitEndpoint, setNewUnitEndpoint] = useState('');

  const totalStudents = units.reduce((acc, u) => acc + u.studentCount, 0);
  const onlineUnitsCount = units.filter(u => u.status === 'online').length;

  const handleSyncAll = () => {
    setIsSyncingAll(true);
    setSyncFeedback('Disparando sincronização criptográfica Mesh (WireGuard P2P)...');

    setTimeout(() => {
      setUnits(prev => prev.map(u => ({ ...u, lastSync: 'Agora (Auditado)', status: 'online' })));
      setIsSyncingAll(false);
      setSyncFeedback('Rede 100% sincronizada. 3 nós consolidados no Córtex.');
      setTimeout(() => setSyncFeedback(null), 4000);
    }, 1800);
  };

  const handleSwitchUnit = (unitId: string) => {
    setActiveUnitId(unitId);
    if (onSelectUnit) onSelectUnit(unitId);
  };

  const handleCreateUnit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUnitName.trim()) return;

    const newUnit: Unit = {
      id: `unit-${Date.now()}`,
      name: newUnitName.trim(),
      address: newUnitAddress.trim() || 'Endereço em cadastramento',
      inepCode: newUnitInep.trim() || '53009999',
      status: 'online',
      lastSync: 'Criada agora',
      studentCount: 0,
      cameraCount: 4,
      ipEndpoint: newUnitEndpoint.trim() || '10.0.4.1 (Edge)'
    };

    setUnits(prev => [...prev, newUnit]);
    setShowAddModal(false);
    setNewUnitName('');
    setNewUnitAddress('');
    setNewUnitInep('');
    setNewUnitEndpoint('');
  };

  return (
    <div className="ms-cockpit">
      {/* HEADER */}
      <header className="ms-header">
        <div className="ms-title-group">
          <button onClick={onBack} className="ms-back-btn" title="Voltar aos Portais">
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 className="ms-title">Gestão Multi-Unidade da Rede (Tenant Central)</h1>
            <p className="ms-subtitle">
              Sincronização federada P2P • Colégio Visão • Córtex Central v2.1
            </p>
          </div>
        </div>

        <div className="ms-actions">
          <button 
            onClick={handleSyncAll}
            disabled={isSyncingAll}
            className="ms-cmd-btn secondary"
          >
            <RefreshCw size={14} className={isSyncingAll ? 'animate-spin' : ''} />
            {isSyncingAll ? 'Sincronizando...' : 'Sincronizar Rede'}
          </button>
          <button 
            onClick={() => setShowAddModal(true)}
            className="ms-cmd-btn primary"
          >
            <Plus size={14} /> Nova Unidade
          </button>
        </div>
      </header>

      {/* FEEDBACK BANNER */}
      {syncFeedback && (
        <div style={{
          background: 'rgba(16, 185, 129, 0.12)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          borderRadius: 12,
          padding: '10px 16px',
          marginBottom: 20,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          color: '#10b981',
          fontSize: 13,
          fontWeight: 600
        }}>
          <CheckCircle2 size={16} />
          <span>{syncFeedback}</span>
        </div>
      )}

      {/* 4-COLUMN KPI STRIP */}
      <div className="ms-kpi-strip">
        <div className="ms-kpi-card indigo">
          <div className="ms-kpi-header">
            <span className="ms-kpi-label">Alunos da Rede</span>
            <BarChart size={16} color="#6366f1" />
          </div>
          <div className="ms-kpi-val">{totalStudents.toLocaleString('pt-BR')}</div>
          <div className="ms-kpi-sub">Total consolidado nas 3 unidades</div>
        </div>

        <div className="ms-kpi-card emerald">
          <div className="ms-kpi-header">
            <span className="ms-kpi-label">Unidades Ativas</span>
            <Globe size={16} color="#10b981" />
          </div>
          <div className="ms-kpi-val">{onlineUnitsCount} / {units.length}</div>
          <div className="ms-kpi-sub">100% dos nós online via WireGuard</div>
        </div>

        <div className="ms-kpi-card cyan">
          <div className="ms-kpi-header">
            <span className="ms-kpi-label">Latência Mesh</span>
            <Wifi size={16} color="#00f0ff" />
          </div>
          <div className="ms-kpi-val">12 ms</div>
          <div className="ms-kpi-sub">Túnel local criptografado P2P</div>
        </div>

        <div className="ms-kpi-card amber">
          <div className="ms-kpi-header">
            <span className="ms-kpi-label">Soberania LGPD</span>
            <Shield size={16} color="#f59e0b" />
          </div>
          <div className="ms-kpi-val">Nível 10</div>
          <div className="ms-kpi-sub">Zero tráfego biométrico cross-site</div>
        </div>
      </div>

      {/* UNITS LIST */}
      <div className="ms-units-grid">
        {units.map(unit => {
          const isActive = unit.id === activeUnitId;
          return (
            <div 
              key={unit.id} 
              className="ms-unit-card"
              style={{
                borderColor: isActive ? 'rgba(99, 102, 241, 0.5)' : undefined,
                background: isActive ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(10, 16, 32, 0.95) 100%)' : undefined
              }}
            >
              <div className="ms-unit-header">
                <div className="ms-unit-title-group">
                  <div className="ms-unit-icon">
                    <MapPin size={22} />
                  </div>
                  <div>
                    <h3 className="ms-unit-name">{unit.name}</h3>
                    <p className="ms-unit-addr">{unit.address}</p>
                    <span style={{ fontSize: 10, color: '#64748b', fontFamily: 'monospace' }}>
                      INEP: {unit.inepCode} • IP: {unit.ipEndpoint}
                    </span>
                  </div>
                </div>
                <span className={`ms-status-badge ${unit.status}`}>
                  {unit.status}
                </span>
              </div>

              <div className="ms-unit-metrics">
                <div className="ms-metric-item">
                  <span className="ms-metric-label">Matrículas</span>
                  <span className="ms-metric-val">{unit.studentCount}</span>
                </div>
                <div className="ms-metric-item">
                  <span className="ms-metric-label">Câmeras NPU</span>
                  <span className="ms-metric-val">{unit.cameraCount}</span>
                </div>
                <div className="ms-metric-item">
                  <span className="ms-metric-label">Último Sync</span>
                  <span className="ms-metric-val" style={{ fontSize: 12 }}>{unit.lastSync}</span>
                </div>
              </div>

              <div className="ms-unit-actions">
                <button 
                  className="ms-unit-btn secondary"
                  onClick={() => alert(`Configurações de rede da ${unit.name}: Gateway ${unit.ipEndpoint}`)}
                >
                  <Settings size={14} /> Conectividade
                </button>
                <button 
                  className={`ms-unit-btn ${isActive ? 'secondary' : 'primary'}`}
                  onClick={() => handleSwitchUnit(unit.id)}
                >
                  <ExternalLink size={14} />
                  {isActive ? 'Unidade Selecionada' : 'Alternar Visão'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* NOTICE LGPD */}
      <div className="ms-notice-card">
        <Shield size={22} className="ms-notice-icon" />
        <div>
          <h4 className="ms-notice-title">Isolamento Soberano de Biometrias por Unidade (LGPD Art. 11)</h4>
          <p className="ms-notice-desc">
            A rede Áquila Pro replica exclusivamente metadados contábeis, calendários e telemetria gerencial. 
            Os embeddings faciais e dados biométricos dos alunos permanecem estritamente restritos ao hardware local 
            de cada unidade escolar (NPU Edge), impedindo qualquer consolidação centralizada não autorizada.
          </p>
        </div>
      </div>

      {/* MODAL NOVA UNIDADE */}
      {showAddModal && (
        <div className="ms-modal-backdrop" onClick={() => setShowAddModal(false)}>
          <div className="ms-modal-content" onClick={e => e.stopPropagation()}>
            <div className="ms-modal-header">
              <h3 className="ms-modal-title">Cadastrar Nova Unidade Escolar</h3>
              <button 
                onClick={() => setShowAddModal(false)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateUnit}>
              <div className="ms-form-group">
                <label className="ms-form-label">Nome da Unidade</label>
                <input 
                  type="text" 
                  className="ms-form-input" 
                  placeholder="Ex: Colégio Visão — Unidade Sudoeste"
                  value={newUnitName}
                  onChange={e => setNewUnitName(e.target.value)}
                  required 
                />
              </div>

              <div className="ms-form-group">
                <label className="ms-form-label">Endereço Completo</label>
                <input 
                  type="text" 
                  className="ms-form-input" 
                  placeholder="Ex: CCSW 05 Lote 02, Brasília - DF"
                  value={newUnitAddress}
                  onChange={e => setNewUnitAddress(e.target.value)}
                />
              </div>

              <div className="ms-form-group">
                <label className="ms-form-label">Código INEP (MEC)</label>
                <input 
                  type="text" 
                  className="ms-form-input" 
                  placeholder="Ex: 53004812"
                  value={newUnitInep}
                  onChange={e => setNewUnitInep(e.target.value)}
                />
              </div>

              <div className="ms-form-group">
                <label className="ms-form-label">IP / Endpoint WireGuard</label>
                <input 
                  type="text" 
                  className="ms-form-input" 
                  placeholder="Ex: 10.0.4.1:51820"
                  value={newUnitEndpoint}
                  onChange={e => setNewUnitEndpoint(e.target.value)}
                />
              </div>

              <div className="ms-modal-footer">
                <button 
                  type="button" 
                  className="ms-cmd-btn secondary"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="ms-cmd-btn primary"
                >
                  Salvar Unidade
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MultiSiteManager;
