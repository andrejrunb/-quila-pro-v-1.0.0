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

interface SecurityPortalProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

export const SecurityPortal: React.FC<SecurityPortalProps> = ({ currentPage, onNavigate }) => {
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
        return <InfrastructureDashboard onBack={onBack} />;
      case 'hardware':
        return <HardwareCalculator onBack={onBack} />;
      case 'predictive-absence':
        return <PredictiveAbsenceDashboard onBack={onBack} />;
      case 'visitor-management':
        return <VisitorManagement onBack={onBack} />;
      case 'cameras':
        return <CameraConfiguration />;
      case 'ruview':
        return <RuViewPage />;
      default:
        return <SecurityMonitor />;
    }
  };

  return (
    <PortalLayout portalName="Centro de Segurança & Resiliência" themeColor="#ef4444">
      {renderSecurityPage()}
    </PortalLayout>
  );
};

export default SecurityPortal;
