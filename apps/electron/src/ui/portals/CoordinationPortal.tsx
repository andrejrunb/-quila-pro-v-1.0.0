import React from 'react';
import { PortalLayout } from '../layouts/PortalLayout';
import { CoordinationManagement } from '../pages/CoordinationManagement';
import { AcademicCalendar } from '../pages/AcademicCalendar';

interface CoordinationPortalProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

export const CoordinationPortal: React.FC<CoordinationPortalProps> = ({ currentPage, onNavigate }) => {
  const renderCoordinationPage = () => {
    const onBack = () => onNavigate('dashboard');

    switch (currentPage) {
      case 'coordination':
      case 'dashboard':
        return <CoordinationManagement onBack={onBack} />;
      case 'calendar':
        return <AcademicCalendar onBack={onBack} />;
      default:
        return <CoordinationManagement onBack={onBack} />;
    }
  };

  return (
    <PortalLayout portalName="Coordenação Neuro-Pedagógica" themeColor="#f59e0b">
      {renderCoordinationPage()}
    </PortalLayout>
  );
};

export default CoordinationPortal;
