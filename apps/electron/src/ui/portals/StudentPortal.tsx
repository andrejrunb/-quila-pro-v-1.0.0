import React from 'react';
import { PortalLayout } from '../layouts/PortalLayout';
import StudentRPGPortal from '../components/StudentRPGPortal';
import { StudentAILab } from '../pages/StudentAILab';
import { StudentMasteryChamber } from '../pages/StudentMasteryChamber';
import { SovereignPvPArena } from '../components/SovereignPvPArena';
import { BNCCSkillTree } from '../components/BNCCSkillTree';
import { EssayLab1000 } from '../components/EssayLab1000';
import { PhetKumonMasteryLab } from '../components/PhetKumonMasteryLab';
import { MultimodalPedagogicalStudio } from '../components/MultimodalPedagogicalStudio';
import { NativePhETSimulationLab } from '../components/NativePhETSimulationLab';
import { StudentCosmeticsChamber } from '../components/StudentCosmeticsChamber';

interface StudentPortalProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  studentId?: string;
}

export const StudentPortal: React.FC<StudentPortalProps> = ({ currentPage, onNavigate, studentId }) => {
  const renderStudentPage = () => {
    switch (currentPage) {
      case 'mastery-chamber':
        return <StudentMasteryChamber studentId={studentId} onBack={() => onNavigate('student-portal')} />;
      case 'knowledge-canvas':
      case 'albus-canvas':
        return <StudentMasteryChamber studentId={studentId} initialMode="canvas" onBack={() => onNavigate('student-portal')} />;
      case 'ai-lab':
        return <StudentAILab studentId={studentId} onBack={() => onNavigate('student-portal')} />;
      case 'arena':
      case 'pvp-arena':
        return <SovereignPvPArena studentId={studentId} onBack={() => onNavigate('student-portal')} />;
      case 'skill-tree':
      case 'bncc-skills':
        return <BNCCSkillTree studentId={studentId} onBack={() => onNavigate('student-portal')} />;
      case 'essay-lab':
      case 'redacao':
        return <EssayLab1000 studentId={studentId} onBack={() => onNavigate('student-portal')} />;
      case 'phet-mastery':
      case 'stem-lab':
        return <PhetKumonMasteryLab />;
      case 'multimodal-studio':
      case 'podcast-wordwall':
        return <MultimodalPedagogicalStudio />;
      case 'native-phet':
        return <NativePhETSimulationLab />;
      case 'cosmetics-chamber':
      case 'battle-banner':
      case 'skins-shop':
        return <StudentCosmeticsChamber studentId={studentId} />;
      case 'student-portal':
      case 'dashboard':
      default:
        return <StudentRPGPortal studentId={studentId} onNavigate={onNavigate} />;
    }
  };

  return (
    <PortalLayout portalName="Portal do Aluno (Jornada Épica)" themeColor="#8B5CF6" onNavigate={onNavigate}>
      {renderStudentPage()}
    </PortalLayout>
  );
};

export default StudentPortal;
