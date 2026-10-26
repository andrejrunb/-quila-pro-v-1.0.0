import React from 'react';
import { PortalLayout } from '../layouts/PortalLayout';
import { SecurityMonitor } from '../pages/SecurityMonitor';
import MultiStreamGrid from '../components/MultiStreamGrid';
import { IoTManager } from '../pages/IoTManager';
import HardwareDiagnostics from '../pages/HardwareDiagnostics';
import { InfrastructureDashboard } from '../pages/InfrastructureDashboard';
import HardwareCalculator from '../pages/HardwareCalculator';
import { PredictiveAbsenceDashboard } from '../pages/PredictiveAbsenceDashboard';
import VisitorManagement from '../pages/VisitorManagement';
import { CameraConfiguration } from '../pages/CameraConfiguration';
import { RuViewPage } from '../pages/RuViewPage';
import SecurityAuditDashboard from '../pages/SecurityAuditDashboard';
import TwinNavigator from '../pages/TwinNavigator';
import { NightSentry } from '../pages/NightSentry';
import { LoadTesting } from '../pages/LoadTesting';
import NetworkTrafficDashboard from '../pages/NetworkTrafficDashboard';

interface SecurityPortalProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  userRole?: string;
}

export const SecurityPortal: React.FC<SecurityPortalProps> = ({ currentPage, onNavigate, userRole = '' }) => {
  const renderSecurityPage = () => {
    const onBack = () => onNavigate('dashboard');

    switch (currentPage) {
      case 'security-monitor':
      case 'dashboard':
        return <SecurityMonitor />;
      case 'multistream':
        return <MultiStreamGrid />;
      case 'iot-manager':
        return <IoTManager />;
      case 'diagnostics':
        return <HardwareDiagnostics />;
      case 'infrastructure':
        const isDirectorAdminInfra = ['director', 'admin', 'diretoria', 'executive'].includes(userRole.toLowerCase());
        if (!isDirectorAdminInfra) {
          return (
            <div className="flex items-center justify-center h-full text-center p-8">
              <div>
                <h2 className="text-2xl font-black text-white mb-2">Acesso Restrito</h2>
                <p className="text-slate-400">O dashboard de infraestrutura de hardware é restrito à direção da escola.</p>
                <button onClick={onBack} className="mt-6 px-6 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-white font-bold transition-all">
                  Voltar ao Painel
                </button>
              </div>
            </div>
          );
        }
        return <InfrastructureDashboard onBack={onBack} />;
      case 'hardware':
        const isDirectorOrAdmin = ['director', 'admin', 'diretoria', 'executive'].includes(userRole.toLowerCase());
        if (!isDirectorOrAdmin) {
          return (
            <div className="flex items-center justify-center h-full text-center p-8">
              <div>
                <h2 className="text-2xl font-black text-white mb-2">Acesso Restrito</h2>
                <p className="text-slate-400">O dimensionamento de hardware é restrito à direção da escola.</p>
                <button onClick={onBack} className="mt-6 px-6 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-white font-bold transition-all">
                  Voltar ao Painel
                </button>
              </div>
            </div>
          );
        }
        return <HardwareCalculator onBack={onBack} />;
      case 'predictive-absence':
        return <PredictiveAbsenceDashboard onBack={onBack} />;
      case 'visitor-management':
        return <VisitorManagement onBack={onBack} />;
      case 'cameras':
        return <CameraConfiguration />;
      case 'ruview':
        return <RuViewPage />;
      case 'red-audit':
        return <SecurityAuditDashboard />;
      case 'twin-navigator':
        return <TwinNavigator />;
      case 'night-sentry':
        return <NightSentry onBack={onBack} />;
      case 'load-testing':
        return <LoadTesting onBack={onBack} />;
      case 'network-traffic':
        return <NetworkTrafficDashboard onBack={onBack} />;
      default:
        return <SecurityMonitor />;
    }
  };

  return (
    <PortalLayout portalName="Centro de Segurança & Resiliência" themeColor="#ef4444" onNavigate={onNavigate}>
      {renderSecurityPage()}
    </PortalLayout>
  );
};

export default SecurityPortal;
