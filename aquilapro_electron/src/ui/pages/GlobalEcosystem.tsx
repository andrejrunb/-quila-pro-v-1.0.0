import React, { useState } from 'react';
import { 
  Settings, Shield, BookOpen, FileText, 
  Heart, User, Eye, Monitor, Globe,
  LayoutGrid, LogOut, ChevronRight, BrainCircuit
} from 'lucide-react';
import { INTERFACE_REGISTRY, AppInterface } from '../../services/InterfaceRegistry';
import { EcosystemIntelligence } from './EcosystemIntelligence';
import { agentOrchestratorService } from '../../services/AgentOrchestratorService';
import { AgentActivityFeed } from '../components/AgentActivityFeed';
import FinancialPulseWidget from '../components/FinancialPulseWidget';
import './GlobalEcosystem.css';

/**
 * GlobalEcosystem (v1632-v1636)
 * O "School OS" que unifica as 9 interfaces do sistema Áquila com Orquestração Multi-Agente.
 */
export const GlobalEcosystem: React.FC = () => {
  const [activePortal, setActivePortal] = useState<AppInterface>(INTERFACE_REGISTRY[0]);
  const [isSidebarOpen, setSidebarOpen] = useState(true);

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
          <div className="logo-container">
             <div className="logo-spark"></div>
             <span className="logo-text">Áquila PRO</span>
          </div>
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

        {/* Financial Pulse Telemetry (v2641) */}
        <div className="sidebar-finance-widget p-4">
           <FinancialPulseWidget />
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
           <div className="portal-breadcrumb">
              <span className="crumb">Instituição</span>
              <ChevronRight size={12} />
              <span className="crumb active">{activePortal.name}</span>
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
           {activePortal.id === 'admin_hub' ? (
              <EcosystemIntelligence />
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
    </div>
  );
};
