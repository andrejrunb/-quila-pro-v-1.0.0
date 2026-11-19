/**
 * mvpProfile.ts — Configuração do Perfil de Entrega MVP 0.1 do Áquila Pro
 *
 * Escopo v0.1:
 *  - Secretaria Digital (matrículas, importação, boletins/fichas, vínculos docentes, Conselho Tutelar)
 *  - Coordenação (frequência, ocorrências, calendário letivo, relatórios/laudos)
 *  - Professores (chamada eletrônica, planilha de notas, diário de classe, relatório diário, mapa de sala)
 *  - Pais / Família (visão geral, presença, boletim/notas, ocorrências, comunicados)
 *  - Direção (APENAS VISUALIZAÇÃO — KPIs, acompanhamento e relatórios em modo somente leitura)
 *
 * O modo completo continua preservado no código e pode ser reativado via
 * localStorage.setItem('aquila_release_profile', 'full').
 */

export type ReleaseProfile = 'mvp-0.1' | 'full';

export const DEFAULT_RELEASE_PROFILE: ReleaseProfile = 'mvp-0.1';

export function getReleaseProfile(): ReleaseProfile {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const saved = window.localStorage.getItem('aquila_release_profile');
      if (saved === 'full' || saved === 'mvp-0.1') {
        return saved;
      }
    }
  } catch {
    // fallback seguro fora do browser
  }
  return DEFAULT_RELEASE_PROFILE;
}

export function isMvp01Active(): boolean {
  return getReleaseProfile() === 'mvp-0.1';
}

export function isDirectorRole(role?: string): boolean {
  const r = (role || '').toLowerCase();
  return r === 'director' || r === 'diretoria';
}

export function isDirectorReadOnlyMode(role?: string): boolean {
  if (!isMvp01Active()) return false;
  const r = (role || '').toLowerCase();
  return r === 'director' || r === 'diretoria';
}

/**
 * Rotas visíveis na navegação da versão MVP 0.1
 */
export const MVP_0_1_SIDEBAR_ROUTES = new Set<string>([
  // Gestão (6 portais + relatórios)
  'executive-cockpit-portal',
  'secretaria-portal',
  'coordination',
  'teacher-dashboard',
  'parent-portal',
  'student-portal',
  'reports-hub',
  'help',

  // Ensino (registros, relatórios e comunicação)
  'attendance',
  'gradebook',
  'diary',
  'daily-report',
  'students',
  'seating-intelligence',
  'tasks',
  'calendar',
]);
