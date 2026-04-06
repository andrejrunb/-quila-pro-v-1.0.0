import React from 'react';
import { PortalLayout } from '../layouts/PortalLayout';
import { RankingBoard } from '../pages/RankingBoard';
import { gamificationEngine } from '../../services/GamificationEngine';
import { StudentRPGPortal } from '../components/StudentRPGPortal';

interface StudentPortalProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

export const StudentPortal: React.FC<StudentPortalProps> = ({ currentPage, onNavigate }) => {
  const achievements = gamificationEngine.getAvailableAchievements();
  const health = gamificationEngine.getProjectHealth();

  return (
    <PortalLayout portalName="Portal do Aluno (Jornada Épica)" themeColor="#8b5cf6">
      <StudentRPGPortal />
    </PortalLayout>
  );
};

export default StudentPortal;
