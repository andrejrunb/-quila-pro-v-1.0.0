import React from 'react';
import { PortalLayout } from '../layouts/PortalLayout';
import { RankingBoard } from '../pages/RankingBoard';

interface StudentPortalProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

export const StudentPortal: React.FC<StudentPortalProps> = ({ currentPage, onNavigate }) => {
  const renderStudentPage = () => {
    switch (currentPage) {
      case 'ranking-board':
      case 'dashboard':
        return <RankingBoard onBack={() => onNavigate('dashboard')} />;
      default:
        return <RankingBoard onBack={() => onNavigate('dashboard')} />;
    }
  };

  return (
    <PortalLayout portalName="Portal do Aluno (Jornada Épica)" themeColor="#8b5cf6">
      {renderStudentPage()}
    </PortalLayout>
  );
};

export default StudentPortal;
