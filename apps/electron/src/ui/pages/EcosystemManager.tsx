import React, { useState, useEffect } from 'react';
import { 
  Zap, Globe, Shield, LayoutGrid, 
  Users, FileText, MessageSquare, Gamepad2, 
  ArrowUpRight, Info, AlertCircle, TrendingDown,
  Cpu, Cloud
} from 'lucide-react';
import './EcosystemManager.css';

interface Module {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  isActive: boolean;
  costPerMonth: number;
}

export const EcosystemManager: React.FC = () => {
  const [aiMode, setAiMode] = useState<'cloud' | 'sovereign'>('cloud');
  const [modules, setModules] = useState<Module[]>([
    { id: 'hr', name: 'Módulo RH', description: 'Gestão de ponto e desempenho docente via IA.', icon: <Users size={24} />, isActive: true, costPerMonth: 45 },
    { id: 'secretary', name: 'Secretaria Digital', description: 'Automação de laudos e históricos escolares.', icon: <FileText size={24} />, isActive: true, costPerMonth: 60 },
    { id: 'attendance', name: 'Rastreador de Alunos', icon: <Globe size={24} />, description: 'Frequência biométrica em tempo real.', isActive: true, costPerMonth: 80 },
    { id: 'messenger', name: 'Mensageiro Águia', icon: <MessageSquare size={24} />, description: 'Notificações via WhatsApp e App próprio.', isActive: false, costPerMonth: 30 },
    { id: 'gamification', name: 'App Gamificado', icon: <Gamepad2 size={24} />, description: 'Portal do aluno com sistema de recompensas.', isActive: false, costPerMonth: 50 },
  ]);

  const [studentCount, setStudentCount] = useState(300);
  const [tokensPerMonth, setTokensPerMonth] = useState(18000000);
  const [isLoading, setIsLoading] = useState(true);
  const [isHardwareCapable, setIsHardwareCapable] = useState(false);

  useEffect(() => {
    loadEcosystemState();
  }, []);

  const loadEcosystemState = async () => {
    try {
      const state = await window.aquila.ecosystem.getState();
      if (state) {
        setAiMode(state.aiProvider);
        setIsHardwareCapable(state.isHardwareCapable);
        setModules(prev => prev.map(m => ({
          ...m,
          isActive: state.activeModules[m.id as keyof typeof state.activeModules] ?? m.isActive
        })));
      }
      setIsLoading(false);
    } catch (err) {
      console.error('Erro ao carregar ecossistema:', err);
      setIsLoading(false);
    }
  };

  const calculateCloudCost = () => {
    const activeModulesCount = modules.filter(m => m.isActive).length;
    const baseCost = (tokensPerMonth / 1000000) * 0.30 * 5.5; 
    return baseCost * (activeModulesCount / 5);
  };

  const calculatePrivacyScore = () => {
    const base = aiMode === 'sovereign' ? 100 : 40;
    const activeModulesCount = modules.filter(m => m.isActive).length;
    return Math.min(100, base + (5 - activeModulesCount) * 10);
  };

  const calculateLatencyReduction = () => {
    return aiMode === 'sovereign' ? '850ms (Zero-Network)' : '0ms';
  };

  const toggleModule = async (id: string) => {
    try {
      const module = modules.find(m => m.id === id);
      if (!module) return;
      const newState = await window.aquila.ecosystem.toggleModule(id, !module.isActive);
      if (newState) {
        setModules(prev => prev.map(m => ({
          ...m,
          isActive: newState.activeModules[m.id as keyof typeof newState.activeModules] ?? m.isActive
        })));
      }
    } catch (err) {
      console.error('Erro ao alternar módulo:', err);
    }
  };

  const toggleAIMode = async () => {
    try {
      const newMode = aiMode === 'cloud' ? 'sovereign' : 'cloud';
      const newState = await window.aquila.ecosystem.setAIProvider(newMode);
      if (newState) {
        setAiMode(newState.aiProvider);
      }
    } catch (err) {
      console.error('Erro ao alternar modo IA:', err);
    }
  };

  return (
    <div className="ecosystem-container">
      <header className="ecosystem-header">
        <div className="title-group">
          <LayoutGrid size={32} className="text-blue-400" />
          <div>
            <h1 className="text-3xl font-black tracking-tight">ECOSISTEMA MODULAR</h1>
            <p className="text-slate-400">Gerencie a inteligência e os módulos ativos da sua unidade.</p>
          </div>
        </div>
        
        <div className="sovereign-switch-card">
          <div className="switch-info">
            <span className="label">MODO DE INTELIGÊNCIA</span>
            <span className="status">{aiMode === 'cloud' ? 'Cloud Acceleration' : 'Sovereign Node'}</span>
          </div>
          <div className="switch-control" onClick={toggleAIMode}>
            <div className={`switch-knob ${aiMode}`}>
              {aiMode === 'cloud' ? <Cloud size={16} /> : <Cpu size={16} />}
            </div>
            <span className="cloud-label">Cloud</span>
            <span className="local-label">Sovereign</span>
          </div>
        </div>

        {isHardwareCapable && (
          <div className="hardware-badge">
            <Zap size={14} />
            NPU/GPU DETECTADA (OTIMIZADO)
          </div>
        )}
      </header>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400"></div>
        </div>
      ) : (
        <div className="ecosystem-grid">
        <div className="modules-section">
          <div className="section-header">
            <h2 className="text-xl font-bold">MÓDULOS DISPONÍVEIS</h2>
            <div className="badge">ON-DEMAND</div>
          </div>
          
          <div className="modules-list">
            {modules.map(module => (
              <div key={module.id} className={`module-card ${module.isActive ? 'active' : 'inactive'}`}>
                <div className="module-icon">
                  {module.icon}
                </div>
                <div className="module-info">
                  <h3>{module.name}</h3>
                  <p>{module.description}</p>
                </div>
                <div className="module-action">
                  <label className="toggle-switch">
                    <input 
                      type="checkbox" 
                      checked={module.isActive} 
                      onChange={() => toggleModule(module.id)} 
                    />
                    <span className="slider round"></span>
                  </label>
                </div>
              </div>
            ))}
          </div>
        </div>

        <aside className="economics-panel">
          <div className="roi-card glass">
            <h3 className="card-title">ESTIMATIVA ECONÔMICA</h3>
            
            <div className="stat-row">
              <span>Módulos Ativos</span>
              <span className="value">{modules.filter(m => m.isActive).length} / {modules.length}</span>
            </div>
            
            <div className="stat-row">
              <span>Alunos na Unidade</span>
              <span className="value">{studentCount}</span>
            </div>

            <div className="stat-row">
              <span>Score de Privacidade</span>
              <span className="value text-blue-400">{calculatePrivacyScore()}%</span>
            </div>

            <div className="stat-row">
              <span>Redução de Latência</span>
              <span className="value text-green-400">-{calculateLatencyReduction()}</span>
            </div>

            <div className="divider"></div>

            <div className="cost-comparison">
              <div className="cost-item">
                <span className="label">Custo Cloud (Est.)</span>
                <span className="value text-red-400">R$ {calculateCloudCost().toFixed(2)}/mês</span>
              </div>
              
              <div className="cost-item">
                <span className="label">Custo Local (Energia)</span>
                <span className="value text-green-400">R$ 0.00/mês*</span>
              </div>
            </div>

            {aiMode === 'sovereign' && (
              <div className="saving-badge">
                <TrendingDown size={18} />
                <span>ECONOMIA DE 100% (MODO SOBERANO)</span>
              </div>
            )}

            <button className="primary-btn mt-6">
              <span>SOLICITAR UPGRADE LOCAL</span>
              <ArrowUpRight size={18} />
            </button>
            
            <p className="disclaimer">
              *Requer Áquila Edge Hub (R$ 1.490,00 investimento único).
            </p>
          </div>

          <div className="info-card glass mt-4">
            <div className="flex gap-3">
              <Shield className="text-blue-400" size={24} />
              <div>
                <h4 className="font-bold">Privacidade Nível 10</h4>
                <p className="text-sm text-slate-400">O Modo Local garante que as biometrias nunca deixam o perímetro da escola.</p>
              </div>
            </div>
          </div>
        </aside>
      </div>
    )}
  </div>
  );
};
