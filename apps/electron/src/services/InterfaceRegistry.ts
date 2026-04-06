export type UserRole = 'admin' | 'coordinator' | 'teacher' | 'parent' | 'student' | 'secretary' | 'security' | 'totem';

export interface AppInterface {
  id: string;
  name: string;
  role: UserRole;
  icon: string;
  description: string;
  primaryServices: string[]; // v1633: Serviços vinculados
  permissionLevel: number;    // v1633: 1 (Básico) a 5 (Total)
}

/**
 * InterfaceRegistry (v1632)
 * Define os 9 portais/interfaces do ecossistema Áquila.
 */
export const INTERFACE_REGISTRY: AppInterface[] = [
  { 
    id: 'admin_hub', 
    name: 'Admin HUB', 
    role: 'admin', 
    icon: 'Settings', 
    description: 'Gestão total do sistema e ROI.',
    primaryServices: ['ROIAnalytics', 'ExternalSync', 'Finance'],
    permissionLevel: 5
  },
  { 
    id: 'coord_portal', 
    name: 'Portal Coordenação', 
    role: 'coordinator', 
    icon: 'Shield', 
    description: 'Monitoramento de segurança e disciplina.',
    primaryServices: ['SafetyMonitor', 'IdentityBridge', 'IncidentManagement'],
    permissionLevel: 4
  },
  { 
    id: 'teacher_mode', 
    name: 'Teacher Mode', 
    role: 'teacher', 
    icon: 'BookOpen', 
    description: 'Diário de classe e engajamento.',
    primaryServices: ['PedagogicalReporting', 'StudentPortfolio', 'Attendance'],
    permissionLevel: 3
  },
  { 
    id: 'secretary_desk', 
    name: 'Secretaria Digital', 
    role: 'secretary', 
    icon: 'FileText', 
    description: 'Matrículas e Comunicação.',
    primaryServices: ['AcademicRecords', 'CommunicationHub', 'Enrollment'],
    permissionLevel: 3
  },
  { 
    id: 'parent_app', 
    name: 'Áquila Pais', 
    role: 'parent', 
    icon: 'Heart', 
    description: 'Acompanhamento em tempo real.',
    primaryServices: ['RealTimeTracking', 'Messaging', 'ProgressReports'],
    permissionLevel: 2
  },
  { 
    id: 'student_app', 
    name: 'Áquila Aluno', 
    role: 'student', 
    icon: 'User', 
    description: 'Notas, faltas e notificações.',
    primaryServices: ['AcademicProgress', 'IDBadge', 'Notifications'],
    permissionLevel: 1
  },
  { 
    id: 'security_soc', 
    name: 'Security SOC', 
    role: 'security', 
    icon: 'Eye', 
    description: 'Monitoramento de rádio e câmeras.',
    primaryServices: ['RawTelemetry', 'CrisisResponse', 'CSIFingerprint'],
    permissionLevel: 4
  },
  { 
    id: 'totem_info', 
    name: 'Totem Informativo', 
    role: 'totem', 
    icon: 'Monitor', 
    description: 'Sinalização digital e mapas.',
    primaryServices: ['PublicMapping', 'Wayfinding', 'ScheduleDisplay'],
    permissionLevel: 1
  }
];
