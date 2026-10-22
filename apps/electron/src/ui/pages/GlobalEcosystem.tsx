import React, { useState, useEffect } from 'react';
import { 
  Settings, Shield, BookOpen, FileText, 
  Heart, User, Eye, Monitor, Globe,
  LayoutGrid, LogOut, ChevronRight, BrainCircuit,
  Network, Activity
} from 'lucide-react';
import { INTERFACE_REGISTRY, AppInterface } from '../../services/InterfaceRegistry';
import { EcosystemIntelligence } from './EcosystemIntelligence';
import { agentOrchestratorService } from '../../services/AgentOrchestratorService';
import { AgentActivityFeed } from '../components/AgentActivityFeed';
import FinancialPulseWidget from '../components/FinancialPulseWidget';
import { UnitSelector } from '../components/UnitSelector';
import FinancialGlassUI from '../components/FinancialGlassUI';
import EduScienceHub from '../components/EduScienceHub';
import EvasionRadarUI from '../components/EvasionRadarUI';
import ColdStorageUI from '../components/ColdStorageUI';
import BrandingLogo from '../components/BrandingLogo';
import ClusterOverview from '../components/ClusterOverview';
import AriaVoiceAssistant from '../components/AriaVoiceAssistant';
import CortexPulseWidget from '../components/CortexPulseWidget';
import './GlobalEcosystem.css';

/**
 * GlobalEcosystem (v1632-v1636)
 * O "School OS" que unifica as 9 interfaces do sistema Áquila com Orquestração Multi-Agente.
 */
export const GlobalEcosystem: React.FC = () => {
  const [activePortal, setActivePortal] = useState<AppInterface>(INTERFACE_REGISTRY[0]);
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [clusterMode, setClusterMode] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState('unit-hq');
  const [showVault, setShowVault] = useState(false);

  const handleUnitChange = async (unitId: string) => {
    setSelectedUnit(unitId);
    await agentOrchestratorService.setUnitContext(unitId);
    // Adicionar log visual de transição se necessário
  };

  useEffect(() => {
    const handleAriaNavigation = (e: any) => {
      const pageId = e.detail;
      const portal = INTERFACE_REGISTRY.find(p => p.id === pageId || p.role === pageId.toLowerCase());
      if (portal) {
        setActivePortal(portal);
      }
    };

    window.addEventListener('aria-navigate', handleAriaNavigation);
    return () => window.removeEventListener('aria-navigate', handleAriaNavigation);
  }, []);

  const getIcon = (iconName: string) => {
    const icons: any = { Settings, Shield, BookOpen, FileText, Heart, User, Eye, Monitor, Globe };
    const IconComponent = icons[iconName] || LayoutGrid;
    return <IconComponent size={18} />;
  };

  const agentContext = agentOrchestratorService.getAgentContext(activePortal.role.toUpperCase() as any);

  return (
    <div className="ecosystem-container">
      {/* Sidebar de Navegação entre Personas */}
      <aside className={`ecosystem-sidebar ${isSidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          <BrandingLogo className="sidebar-logo" size={32} />
          <p className="os-label">School OS v1.0</p>
        </div>

        {/* Agent Presence Widget (v1636) */}
        <div className="agent-presence-widget">
           <div className="agent-avatar-glow">
              <BrainCircuit size={20} className="text-blue-400" />
           </div>
           <div className="flex-1 overflow-hidden">
              <p className="agent-name">AGENTE {activePortal.role.toUpperCase()}</p>
              <p className="agent-status-msg truncate">Otimizando {activePortal.name}...</p>
           </div>
        </div>

        <nav className="sidebar-nav">
          {INTERFACE_REGISTRY.map(portal => (
            <button 
              key={portal.id}
              className={`nav-item ${activePortal.id === portal.id ? 'active' : ''}`}
              onClick={() => setActivePortal(portal)}
              title={portal.description}
            >
              <div className="icon-wrapper">
                {getIcon(portal.icon)}
              </div>
              <span className="nav-label">{portal.name}</span>
              {activePortal.id === portal.id && <ChevronRight size={14} className="active-arrow" />}
            </button>
          ))}
        </nav>

        {/* Inter-Agent Activity Feed (v1636) */}
        <div className="sidebar-agent-feed">
           <AgentActivityFeed />
        </div>

        {/* Evolution Pulse Telemetry (v402) */}
        <div className="sidebar-cortex-widget p-4">
           <CortexPulseWidget />
        </div>

        {/* Financial Pulse Telemetry (v2641) */}
        <div className="sidebar-finance-widget p-4">
           <FinancialPulseWidget />
        </div>

        {/* Cluster View Toggle (v3341) */}
        <div className="sidebar-cluster-toggle p-4 border-t border-slate-700/50">
           <button 
             className={`cluster-toggle-btn ${clusterMode ? 'active' : ''}`}
             onClick={() => setClusterMode(!clusterMode)}
           >
              <Network size={16} />
              <span>CLUSTER VIEW</span>
              <div className={`status-dot ${clusterMode ? 'online' : 'offline'}`}></div>
           </button>
        </div>

        <div className="sidebar-footer">
           <button className="logout-btn">
              <LogOut size={16} />
              <span>Sair do Sistema</span>
           </button>
        </div>
      </aside>

      {/* Área de Conteúdo Dinâmico */}
      <main className="ecosystem-main">
        <header className="portal-header">
           <div className="header-left">
              <div className="portal-breadcrumb">
                 <span className="crumb">Instituição</span>
                 <ChevronRight size={12} />
                 <span className="crumb active">{activePortal.name}</span>
              </div>
           </div>

           {/* Unit Context Switcher (v3341) */}
           <div className="header-center">
              <UnitSelector 
                selectedUnit={selectedUnit} 
                onSelect={handleUnitChange} 
              />
           </div>

           <div className="user-profile">
              <div className="user-info">
                 <span className="user-name">Diretoria Unificada</span>
                 <span className="user-role">{activePortal.role.toUpperCase()}</span>
              </div>
              <div className="user-avatar">
                 <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=admin" alt="User" />
              </div>
           </div>
        </header>

        <section className="portal-content container animate-fade-in">
           {clusterMode ? (
              <ClusterOverview />
           ) : activePortal.id === 'admin_hub' ? (
              <div className="admin-view-wrapper h-full flex flex-col">
                <div className="admin-tabs flex gap-4 mb-6">
                  <button 
                    className={`tab-btn ${!showVault ? 'active' : ''}`}
                    onClick={() => setShowVault(false)}
                  >
                    FINANCIAL GLASS
                  </button>
                  <button 
                    className={`tab-btn ${showVault ? 'active' : ''}`}
                    onClick={() => setShowVault(true)}
                  >
                    EVIDENCE VAULT
                  </button>
                </div>
                {showVault ? <ColdStorageUI /> : <FinancialGlassUI />}
              </div>
           ) : activePortal.id === 'teacher_mode' || activePortal.id === 'coord_portal' ? (
              <EduScienceHub />
           ) : activePortal.id === 'security_soc' ? (
              <EvasionRadarUI />
           ) : (
              <div className="bespoke-placeholder">
                 <div className="placeholder-icon">
                    {getIcon(activePortal.icon)}
                 </div>
                 <h2 className="text-2xl font-black">{activePortal.name}</h2>
                 <p className="text-slate-500 max-w-md mx-auto mt-2">
                    {activePortal.description} - Este módulo bespoked (sob medida) integra todos os dados de {activePortal.role} em uma única visão unificada.
                 </p>
                 
                 <div className="grid grid-cols-3 gap-6 mt-12 w-full max-w-4xl mx-auto">
                    <div className="mock-card"></div>
                    <div className="mock-card"></div>
                    <div className="mock-card"></div>
                 </div>
              </div>
           )}
        </section>
      </main>
      
      {/* Aria Multimodal AI (v3801) */}
      <AriaVoiceAssistant />
    </div>
  );
};
