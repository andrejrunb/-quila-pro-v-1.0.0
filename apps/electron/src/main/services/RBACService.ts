/**
 * RBACService.ts — Item 26
 * Role-Based Access Control: Professor, Porteiro, Diretor, Admin
 * Define quais páginas e ações cada papel pode acessar.
 */

export type UserRole = 'admin' | 'director' | 'teacher' | 'doorman';

export interface RBACPolicy {
  pages: string[];         // Rotas permitidas
  actions: string[];       // IPC channels permitidos
  canExport: boolean;
  canDeleteStudents: boolean;
  canViewLGPDData: boolean;
  canManageLicense: boolean;
}

const POLICIES: Record<UserRole, RBACPolicy> = {
  admin: {
    pages: ['*'],
    actions: ['*'],
    canExport: true,
    canDeleteStudents: true,
    canViewLGPDData: true,
    canManageLicense: true,
  },
  director: {
    pages: ['dashboard', 'students', 'reports', 'heatmap', 'alerts', 'sync', 'whatsapp'],
    actions: ['get-*', 'export-*', 'force-sync'],
    canExport: true,
    canDeleteStudents: false,
    canViewLGPDData: false,
    canManageLicense: false,
  },
  teacher: {
    pages: ['dashboard', 'students', 'alerts'],
    actions: ['get-students', 'get-alerts', 'get-attendance'],
    canExport: false,
    canDeleteStudents: false,
    canViewLGPDData: false,
    canManageLicense: false,
  },
  doorman: {
    pages: ['live-monitor', 'alerts'],
    actions: ['start-recognition', 'stop-recognition', 'get-recognition-status'],
    canExport: false,
    canDeleteStudents: false,
    canViewLGPDData: false,
    canManageLicense: false,
  },
};

export class RBACService {
  /**
   * Retorna a política de acesso para um papel.
   */
  static getPolicy(role: UserRole): RBACPolicy {
    return POLICIES[role] ?? POLICIES.doorman;
  }

  /**
   * Verifica se um role pode acessar uma página específica.
   */
  static canAccessPage(role: UserRole, page: string): boolean {
    const policy = this.getPolicy(role);
    return policy.pages.includes('*') || policy.pages.includes(page);
  }

  /**
   * Verifica se um role pode executar uma ação IPC.
   */
  static canExecute(role: UserRole, action: string): boolean {
    const policy = this.getPolicy(role);
    if (policy.actions.includes('*')) return true;
    return policy.actions.some(allowed => {
      if (allowed.endsWith('*')) {
        return action.startsWith(allowed.slice(0, -1));
      }
      return allowed === action;
    });
  }

  /**
   * Gera um token de sessão simples com o role embutido.
   */
  static buildSessionPayload(userId: string, role: UserRole): Record<string, any> {
    return {
      userId,
      role,
      policy: this.getPolicy(role),
      issuedAt: Date.now(),
    };
  }
}

