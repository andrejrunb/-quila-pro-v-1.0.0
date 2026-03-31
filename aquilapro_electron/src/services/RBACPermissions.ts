/**
 * Step 155 — RBAC Granular: Permissões por tela e ação
 *
 * Define as permissões granulares além das roles.
 * Cada rota/ação tem uma lista explícita de roles permitidas.
 * Uso no Electron (main.ts): verificar antes de cada handler IPC.
 * Uso no React: proteção de rota via ProtectedRoute.
 */

export type UserRole = 'admin' | 'director' | 'coordinator' | 'secretary' | 'teacher' | 'monitor';

export interface Permission {
  /** Página / rota do sistema */
  page: string;
  /** Ações permitidas dentro desta página */
  actions: {
    view: UserRole[];
    edit?: UserRole[];
    delete?: UserRole[];
    export?: UserRole[];
  };
}

/**
 * Mapa completo de permissões granulares do Áquila Pro
 */
export const PERMISSIONS: Permission[] = [
  {
    page: 'dashboard',
    actions: { view: ['admin', 'director', 'coordinator', 'secretary', 'teacher', 'monitor'] },
  },
  {
    page: 'students',
    actions: {
      view: ['admin', 'director', 'coordinator', 'secretary', 'teacher'],
      edit: ['admin', 'director', 'secretary'],
      delete: ['admin'],
      export: ['admin', 'director'],
    },
  },
  {
    page: 'ranking-board',
    actions: {
      view: ['admin', 'director', 'coordinator'],
      export: ['admin', 'director'],
    },
  },
  {
    page: 'lgpd',
    actions: {
      view: ['admin'],
      edit: ['admin'],
      delete: ['admin'],
    },
  },
  {
    page: 'audit-log',
    actions: {
      view: ['admin'],
      export: ['admin'],
    },
  },
  {
    page: 'settings',
    actions: {
      view: ['admin'],
      edit: ['admin'],
    },
  },
  {
    page: 'cameras',
    actions: {
      view: ['admin', 'director', 'coordinator', 'monitor'],
      edit: ['admin'],
    },
  },
  {
    page: 'alerts',
    actions: {
      view: ['admin', 'director', 'coordinator', 'secretary', 'teacher', 'monitor'],
      edit: ['admin', 'director'],
      delete: ['admin'],
    },
  },
  {
    page: 'reports',
    actions: {
      view: ['admin', 'director', 'coordinator'],
      export: ['admin', 'director'],
    },
  },
  {
    page: 'whatsapp',
    actions: {
      view: ['admin'],
      edit: ['admin'],
    },
  },
  {
    page: 'user-management',
    actions: {
      view: ['admin'],
      edit: ['admin'],
      delete: ['admin'],
    },
  },
  {
    page: 'diagnostics',
    actions: {
      view: ['admin'],
    },
  },
  {
    page: 'coordination',
    actions: {
      view: ['admin', 'director', 'coordinator', 'secretary'],
      edit: ['admin', 'director', 'coordinator'],
    },
  },
  {
    page: 'predictive-absence',
    actions: {
      view: ['admin', 'director', 'coordinator', 'teacher'],
      export: ['admin', 'director'],
    },
  },
  {
    page: 'multi-site',
    actions: {
      view: ['admin', 'director'],
      edit: ['admin'],
    },
  },
];

// ─────────────────────────────────────────────────────────────
// Funções utilitárias
// ─────────────────────────────────────────────────────────────

/**
 * Verifica se um role tem permissão para uma ação em uma página.
 * @throws nunca — retorna boolean para uso em guarda de UI
 */
export function can(
  role: UserRole,
  page: string,
  action: 'view' | 'edit' | 'delete' | 'export' = 'view'
): boolean {
  const perm = PERMISSIONS.find(p => p.page === page);
  if (!perm) return false;
  const allowed = perm.actions[action];
  if (!allowed) return false;
  return allowed.includes(role);
}

/**
 * Retorna todas as páginas que um role pode visualizar.
 */
export function getAllowedPages(role: UserRole): string[] {
  return PERMISSIONS
    .filter(p => p.actions.view.includes(role))
    .map(p => p.page);
}

/**
 * Guard para uso em handlers IPC do Electron.
 * Lança erro se o usuário não tiver permissão.
 */
export function assertPermission(
  role: UserRole,
  page: string,
  action: 'view' | 'edit' | 'delete' | 'export' = 'view'
): void {
  if (!can(role, page, action)) {
    throw new Error(
      `[RBAC] Acesso negado: role='${role}' não tem permissão '${action}' em '${page}'.`
    );
  }
}
