import React from 'react';
import { PortalLayout } from '../layouts/PortalLayout';
import TeacherDashboard from '../pages/TeacherDashboard';
import { ClassroomManagement } from '../pages/ClassroomManagement';
import { Diary } from '../pages/Diary';
import { StudentPortfolio } from '../pages/StudentPortfolio';
import { BiometricEnrollment } from '../pages/BiometricEnrollment';

interface TeacherPortalProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  studentParams?: any;
}

export const TeacherPortal: React.FC<TeacherPortalProps> = ({ currentPage, onNavigate, studentParams }) => {
  const renderTeacherPage = () => {
    const onBack = () => onNavigate('dashboard');

    switch (currentPage) {
      case 'dashboard':
      case 'teacher-dashboard':
        return <TeacherDashboard />;
      case 'rooms':
      case 'schedule':
        return <ClassroomManagement onBack={onBack} />;
      case 'diary':
        return <Diary onBack={onBack} />;
      case 'student-portfolio':
        return (
          <StudentPortfolio 
            studentId={studentParams?.studentId || ''} 
            studentName={studentParams?.studentName || 'Aluno'} 
            onBack={onBack} 
          />
        );
      case 'biometric-enrollment':
        return (
          <BiometricEnrollment 
            studentId={studentParams?.studentId} 
            onBack={onBack} 
          />
        );
      default:
        return <TeacherDashboard />;
    }
  };

  return (
    <PortalLayout portalName="Portal Pedagógico (Neuro-IA)" themeColor="#10b981">
      {renderTeacherPage()}
    </PortalLayout>
  );
};

export default TeacherPortal;
