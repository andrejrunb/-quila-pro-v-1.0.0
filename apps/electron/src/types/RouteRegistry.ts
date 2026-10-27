/**
 * RouteRegistry.ts — Contrato Tipado Estrito de Rotas, Portais e Permissões
 * Áquila Pro — Nível P0 de Governança e Resiliência Arquitetural
 * 
 * Elimina rotas órfãs e garante que qualquer navegação seja verificada em tempo de compilação.
 */

export type UserRole = 
  | 'student' 
  | 'aluno'
  | 'teacher' 
  | 'docente' 
  | 'coordinator' 
  | 'coordenacao'
  | 'secretary' 
  | 'secretaria' 
  | 'hr' 
  | 'rh' 
  | 'finance'
  | 'financeiro'
  | 'security'
  | 'seguranca'
  | 'parent' 
  | 'responsavel'
  | 'admin' 
  | 'director' 
  | 'diretoria';

export type PortalId = 
  | 'student-portal'
  | 'teacher-portal'
  | 'coordination-portal'
  | 'secretaria-portal'
  | 'parent-portal'
  | 'admin-portal'
  | 'security-portal';

export interface RouteDefinition {
  id: string;
  label: string;
  primaryPortal: PortalId;
  secondaryPortals?: PortalId[];
  allowedRoles: UserRole[];
  requiresAuth: boolean;
  category: 'academic' | 'administrative' | 'pedagogical' | 'security' | 'gamification' | 'financial';
}

/**
 * Catálogo Canônico e Exaustivo de Rotas do Áquila Pro
 */
export const SOVEREIGN_ROUTE_REGISTRY: Record<string, RouteDefinition> = {
  // ═══ PORTAL DO ALUNO & GAMIFICAÇÃO ═══
  'student-portal': {
    id: 'student-portal',
    label: 'Portal do Aluno (Jornada Épica)',
    primaryPortal: 'student-portal',
    allowedRoles: ['student', 'aluno', 'admin', 'director'],
    requiresAuth: true,
    category: 'gamification'
  },
  'mastery-chamber': {
    id: 'mastery-chamber',
    label: 'Câmara de Maestria ENEM',
    primaryPortal: 'student-portal',
    secondaryPortals: ['teacher-portal', 'coordination-portal', 'admin-portal'],
    allowedRoles: ['student', 'aluno', 'teacher', 'docente', 'coordinator', 'admin', 'director'],
    requiresAuth: true,
    category: 'pedagogical'
  },
  'cosmetics-chamber': {
    id: 'cosmetics-chamber',
    label: 'Câmara de Cosméticos & Battle Banners',
    primaryPortal: 'student-portal',
    secondaryPortals: ['admin-portal'],
    allowedRoles: ['student', 'aluno', 'admin', 'director'],
    requiresAuth: true,
    category: 'gamification'
  },
  'battle-banner': {
    id: 'battle-banner',
    label: 'Customização de Battle Banner 3D',
    primaryPortal: 'student-portal',
    allowedRoles: ['student', 'aluno', 'admin'],
    requiresAuth: true,
    category: 'gamification'
  },
  'youtube-radar': {
    id: 'youtube-radar',
    label: 'Radar Pedagógico de Videoaulas YouTube',
    primaryPortal: 'student-portal',
    secondaryPortals: ['teacher-portal', 'admin-portal'],
    allowedRoles: ['student', 'aluno', 'teacher', 'docente', 'coordinator', 'admin', 'director'],
    requiresAuth: true,
    category: 'pedagogical'
  },
  'arena': {
    id: 'arena',
    label: 'Arena de Batalhas Socráticas (LAN)',
    primaryPortal: 'student-portal',
    secondaryPortals: ['teacher-portal'],
    allowedRoles: ['student', 'aluno', 'teacher', 'docente', 'admin'],
    requiresAuth: true,
    category: 'gamification'
  },
  'essay-lab': {
    id: 'essay-lab',
    label: 'Laboratório de Redação INEP 1000',
    primaryPortal: 'student-portal',
    secondaryPortals: ['teacher-portal'],
    allowedRoles: ['student', 'aluno', 'teacher', 'docente', 'admin'],
    requiresAuth: true,
    category: 'pedagogical'
  },
  'skill-tree': {
    id: 'skill-tree',
    label: 'Árvore de Competências BNCC',
    primaryPortal: 'student-portal',
    secondaryPortals: ['teacher-portal', 'coordination-portal'],
    allowedRoles: ['student', 'aluno', 'teacher', 'docente', 'coordinator', 'admin'],
    requiresAuth: true,
    category: 'academic'
  },
  'phet-mastery': {
    id: 'phet-mastery',
    label: 'Laboratório PhET & Drills Kumon',
    primaryPortal: 'student-portal',
    allowedRoles: ['student', 'aluno', 'teacher', 'docente', 'admin'],
    requiresAuth: true,
    category: 'pedagogical'
  },
  'multimodal-studio': {
    id: 'multimodal-studio',
    label: 'Estúdio Multimodal & Gamificação',
    primaryPortal: 'student-portal',
    allowedRoles: ['student', 'aluno', 'admin'],
    requiresAuth: true,
    category: 'gamification'
  },
  'ai-lab': {
    id: 'ai-lab',
    label: 'Córtex AI Lab (Cientistas Históricos)',
    primaryPortal: 'student-portal',
    secondaryPortals: ['teacher-portal', 'admin-portal'],
    allowedRoles: ['student', 'aluno', 'teacher', 'docente', 'coordinator', 'admin'],
    requiresAuth: true,
    category: 'pedagogical'
  },

  // ═══ PORTAL DO PROFESSOR ═══
  'teacher-dashboard': {
    id: 'teacher-dashboard',
    label: 'Cockpit Docente (Neuro-IA)',
    primaryPortal: 'teacher-portal',
    allowedRoles: ['teacher', 'docente', 'admin', 'director'],
    requiresAuth: true,
    category: 'pedagogical'
  },
  'seating-intelligence': {
    id: 'seating-intelligence',
    label: 'Mapa de Assentos Inteligente (IA)',
    primaryPortal: 'teacher-portal',
    secondaryPortals: ['coordination-portal', 'admin-portal'],
    allowedRoles: ['teacher', 'docente', 'coordinator', 'admin', 'director'],
    requiresAuth: true,
    category: 'pedagogical'
  },
  'gradebook': {
    id: 'gradebook',
    label: 'Planilha de Notas & Desempenho',
    primaryPortal: 'teacher-portal',
    secondaryPortals: ['secretaria-portal'],
    allowedRoles: ['teacher', 'docente', 'secretary', 'admin', 'director'],
    requiresAuth: true,
    category: 'academic'
  },
  'attendance': {
    id: 'attendance',
    label: 'Chamada Digital & Presença',
    primaryPortal: 'teacher-portal',
    secondaryPortals: ['coordination-portal', 'secretaria-portal'],
    allowedRoles: ['teacher', 'docente', 'coordinator', 'secretary', 'admin'],
    requiresAuth: true,
    category: 'academic'
  },
  'diary': {
    id: 'diary',
    label: 'Diário de Classe & Registro de Aulas',
    primaryPortal: 'teacher-portal',
    allowedRoles: ['teacher', 'docente', 'admin'],
    requiresAuth: true,
    category: 'academic'
  },
  'exam-foundry': {
    id: 'exam-foundry',
    label: 'Gerador de Provas A4 & Banco de Questões',
    primaryPortal: 'teacher-portal',
    secondaryPortals: ['coordination-portal', 'admin-portal'],
    allowedRoles: ['teacher', 'docente', 'coordinator', 'admin', 'director'],
    requiresAuth: true,
    category: 'pedagogical'
  },
  'omr-scanner': {
    id: 'omr-scanner',
    label: 'Leitor de Gabaritos OMR (Câmera)',
    primaryPortal: 'teacher-portal',
    secondaryPortals: ['coordination-portal'],
    allowedRoles: ['teacher', 'docente', 'coordinator', 'admin'],
    requiresAuth: true,
    category: 'academic'
  },
  'slide-studio': {
    id: 'slide-studio',
    label: 'Estúdio de Slides Pedagógicos',
    primaryPortal: 'teacher-portal',
    allowedRoles: ['teacher', 'docente', 'admin'],
    requiresAuth: true,
    category: 'pedagogical'
  },
  'ai-studio': {
    id: 'ai-studio',
    label: 'Estúdio de Atividades com IA',
    primaryPortal: 'teacher-portal',
    allowedRoles: ['teacher', 'docente', 'admin'],
    requiresAuth: true,
    category: 'pedagogical'
  },

  // ═══ PORTAL DA COORDENAÇÃO ═══
  'coordination': {
    id: 'coordination',
    label: 'Cockpit da Coordenação Pedagógica',
    primaryPortal: 'coordination-portal',
    allowedRoles: ['coordinator', 'coordenacao', 'admin', 'director'],
    requiresAuth: true,
    category: 'academic'
  },
  'timetable': {
    id: 'timetable',
    label: 'Grade Horária Mestra (Urânia+ IA)',
    primaryPortal: 'coordination-portal',
    allowedRoles: ['coordinator', 'coordenacao', 'admin', 'director'],
    requiresAuth: true,
    category: 'academic'
  },
  'growth-agents': {
    id: 'growth-agents',
    label: 'Agentes de Crescimento & Autoridade',
    primaryPortal: 'coordination-portal',
    secondaryPortals: ['admin-portal'],
    allowedRoles: ['coordinator', 'admin', 'director'],
    requiresAuth: true,
    category: 'pedagogical'
  },
  'calendar': {
    id: 'calendar',
    label: 'Calendário Letivo & Eventos',
    primaryPortal: 'coordination-portal',
    secondaryPortals: ['admin-portal'],
    allowedRoles: ['coordinator', 'admin', 'director'],
    requiresAuth: true,
    category: 'academic'
  },
  'bncc-heatmap': {
    id: 'bncc-heatmap',
    label: 'Mapa de Calor de Proficiência BNCC',
    primaryPortal: 'coordination-portal',
    secondaryPortals: ['teacher-portal', 'admin-portal'],
    allowedRoles: ['coordinator', 'teacher', 'docente', 'admin', 'director'],
    requiresAuth: true,
    category: 'academic'
  },

  // ═══ SECRETARIA DIGITAL & RH ═══
  'secretaria-portal': {
    id: 'secretaria-portal',
    label: 'Secretaria Digital & Matrículas',
    primaryPortal: 'secretaria-portal',
    allowedRoles: ['secretary', 'secretaria', 'hr', 'rh', 'admin', 'director'],
    requiresAuth: true,
    category: 'administrative'
  },
  'hr-portal': {
    id: 'hr-portal',
    label: 'Gestão de Talentos & Folha Docente',
    primaryPortal: 'secretaria-portal',
    allowedRoles: ['hr', 'rh', 'secretary', 'admin', 'director'],
    requiresAuth: true,
    category: 'administrative'
  },
  'schedule-upload': {
    id: 'schedule-upload',
    label: 'Importação de Cargas Horárias',
    primaryPortal: 'secretaria-portal',
    allowedRoles: ['secretary', 'hr', 'admin'],
    requiresAuth: true,
    category: 'administrative'
  },

  // ═══ PORTAL DA FAMÍLIA ═══
  'parent-portal': {
    id: 'parent-portal',
    label: 'Portal da Família (Acompanhamento Escolar)',
    primaryPortal: 'parent-portal',
    allowedRoles: ['parent', 'responsavel', 'admin', 'director'],
    requiresAuth: true,
    category: 'academic'
  },

  // ═══ ADMIN & DIREÇÃO ESTRATÉGICA ═══
  'executive-cockpit-portal': {
    id: 'executive-cockpit-portal',
    label: 'Cockpit Direção Executiva',
    primaryPortal: 'admin-portal',
    allowedRoles: ['admin', 'director', 'diretoria'],
    requiresAuth: true,
    category: 'administrative'
  },
  'finance': {
    id: 'finance',
    label: 'Módulo Financeiro & Inadimplência',
    primaryPortal: 'admin-portal',
    allowedRoles: ['admin', 'director', 'finance'],
    requiresAuth: true,
    category: 'financial'
  },
  'user-management': {
    id: 'user-management',
    label: 'Controle de Acessos & Usuários',
    primaryPortal: 'admin-portal',
    allowedRoles: ['admin', 'director', 'hr'],
    requiresAuth: true,
    category: 'security'
  },
  'settings': {
    id: 'settings',
    label: 'Configurações Institucionais',
    primaryPortal: 'admin-portal',
    allowedRoles: ['admin', 'director'],
    requiresAuth: true,
    category: 'administrative'
  },
  'reports-hub': {
    id: 'reports-hub',
    label: 'Central de Laudos & Relatórios',
    primaryPortal: 'admin-portal',
    secondaryPortals: ['coordination-portal'],
    allowedRoles: ['admin', 'director', 'coordinator'],
    requiresAuth: true,
    category: 'academic'
  },

  // ═══ CENTRO DE SEGURANÇA ═══
  'cameras': {
    id: 'cameras',
    label: 'Monitoramento de Câmeras Edge',
    primaryPortal: 'security-portal',
    secondaryPortals: ['admin-portal'],
    allowedRoles: ['admin', 'security', 'director'],
    requiresAuth: true,
    category: 'security'
  },
  'security-monitor': {
    id: 'security-monitor',
    label: 'Estado de Segurança & Rede',
    primaryPortal: 'security-portal',
    secondaryPortals: ['admin-portal'],
    allowedRoles: ['admin', 'security', 'director'],
    requiresAuth: true,
    category: 'security'
  },
  'night-sentry': {
    id: 'night-sentry',
    label: 'Sentinela Noturno Autônomo',
    primaryPortal: 'security-portal',
    allowedRoles: ['admin', 'security'],
    requiresAuth: true,
    category: 'security'
  }
};

/**
 * Validador Estático de Rotas: Garante que uma rota seja válida e autorizada.
 */
export function validateRoute(routeId: string, role?: string): { valid: boolean; definition?: RouteDefinition; reason?: string } {
  const def = SOVEREIGN_ROUTE_REGISTRY[routeId];
  if (!def) {
    return { valid: false, reason: `Rota '${routeId}' não cadastrada no RouteRegistry oficial.` };
  }
  if (role) {
    const normalizedRole = role.toLowerCase() as UserRole;
    if (!def.allowedRoles.includes(normalizedRole) && normalizedRole !== 'admin') {
      return { valid: false, definition: def, reason: `Perfil '${role}' não possui permissão para acessar '${routeId}'.` };
    }
  }
  return { valid: true, definition: def };
}

/**
 * Retorna todas as rotas primárias de um portal específico
 */
export function getRoutesForPortal(portalId: PortalId): RouteDefinition[] {
  return Object.values(SOVEREIGN_ROUTE_REGISTRY).filter(
    r => r.primaryPortal === portalId || (r.secondaryPortals && r.secondaryPortals.includes(portalId))
  );
}
