export type AgentRole = 
  | 'ADMIN' | 'COORDINATOR' | 'TEACHER' | 'SECRETARY' 
  | 'PARENT' | 'STUDENT' | 'SECURITY' | 'TOTEM' | 'PUBLIC' | 'FINANCE' | 'INFRA' | 'PEDAGOGY';

export interface AgentTask {
  id: string;
  from: AgentRole;
  to: AgentRole;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  payload?: any;
}

export interface AgentCapability {
  role: AgentRole;
  specialization: string;
  primaryTasks: string[];
}

export const AGENT_DEFINITIONS: Record<AgentRole, AgentCapability> = {
  ADMIN: {
    role: 'ADMIN',
    specialization: 'Institutional Health & ROI',
    primaryTasks: ['Monitor cost savings', 'System performance analytics', 'Global compliance check']
  },
  COORDINATOR: {
    role: 'COORDINATOR',
    specialization: 'Behavioral & Safety Management',
    primaryTasks: ['Analyze student trends', 'Trigger discipline protocols', 'Manage staff allocation']
  },
  TEACHER: {
    role: 'TEACHER',
    specialization: 'Pedagogical Success',
    primaryTasks: ['Track student engagement', 'Generate lesson reports', 'Notify parents of academic milestones']
  },
  SECRETARY: {
    role: 'SECRETARY',
    specialization: 'Institutional Logistics',
    primaryTasks: ['Sync external SIS data', 'Process enrollments', 'Manage formal communications']
  },
  PARENT: {
    role: 'PARENT',
    specialization: 'Child Well-being & Logistics',
    primaryTasks: ['Monitor child location', 'Request pickup (Cheguei)', 'Receive behavioral alerts']
  },
  STUDENT: {
    role: 'STUDENT',
    specialization: 'Personal Growth',
    primaryTasks: ['Track personal portfolio', 'Manage assignments', 'Monitor behavioral score']
  },
  SECURITY: {
    role: 'SECURITY',
    specialization: 'Physical Threat Protection',
    primaryTasks: ['Weapon detection', 'Intrusion monitoring', 'Crowd control']
  },
  TOTEM: {
    role: 'TOTEM',
    specialization: 'Public Interface & Screening',
    primaryTasks: ['Visitor registration', 'Cross-check watchlists', 'Airport-style arrival announcements']
  },
  PUBLIC: {
    role: 'PUBLIC',
    specialization: 'External Reputation',
    primaryTasks: ['Public info desk', 'Event scheduling for visitors', 'Institutional showcase']
  },
  FINANCE: {
    role: 'FINANCE',
    specialization: 'Economic Sustainability',
    primaryTasks: ['Predictive revenue forecasting', 'Automatic bank reconciliation', 'Churn risk analysis']
  },
  INFRA: {
    role: 'INFRA',
    specialization: 'Institutional Resilience',
    primaryTasks: ['Self-healing system monitoring', 'Environmental cognitive health', 'IoT hardware redundancy']
  },
  PEDAGOGY: {
    role: 'PEDAGOGY',
    specialization: 'Student Behavioral Intelligence',
    primaryTasks: ['Academic engagement monitoring', 'Sentiment analysis of student feedback', 'Automated portfolio synthesis']
  }
};
