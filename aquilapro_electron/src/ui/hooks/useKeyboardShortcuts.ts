/**
 * Step 164 — Atalhos de Teclado Globais
 *
 * Hook para registrar atalhos de teclado no Electron.
 * Uso no App.tsx: useKeyboardShortcuts({ onNavigate, onSearch, ... })
 *
 * Mapa de atalhos:
 *   F1          → Dashboard
 *   F2          → Monitor ao Vivo
 *   F3          → Alertas
 *   F4          → Alunos
 *   F5          → Relatórios
 *   F6          → Configurações
 *   F10         → Ranking
 *   Ctrl+F      → Busca Global
 *   Ctrl+Shift+B → Backup imediato
 *   Ctrl+Shift+S → Sincronização forçada
 *   Ctrl+Shift+L → Logout
 *   Escape       → Fechar modal/tour
 *   ?            → Mostrar atalhos (Help)
 */
import { useEffect, useCallback } from 'react';

export type ShortcutPage =
  | 'dashboard'
  | 'live-monitor'
  | 'alerts'
  | 'students'
  | 'reports'
  | 'settings'
  | 'ranking-board'
  | 'heatmap'
  | 'coordination';

interface ShortcutHandlers {
  onNavigate?: (page: ShortcutPage) => void;
  onSearch?: () => void;
  onBackup?: () => void;
  onSync?: () => void;
  onLogout?: () => void;
  onEscape?: () => void;
  onHelp?: () => void;
  /** Desabilitar quando um modal/input estiver ativo */
  disabled?: boolean;
}

const FUNCTION_KEY_MAP: Record<string, ShortcutPage> = {
  F1:  'dashboard',
  F2:  'live-monitor',
  F3:  'alerts',
  F4:  'students',
  F5:  'reports',
  F6:  'settings',
  F10: 'ranking-board',
};

export function useKeyboardShortcuts(handlers: ShortcutHandlers): void {
  const handle = useCallback(
    (e: KeyboardEvent) => {
      if (handlers.disabled) return;

      // Não ativar atalhos dentro de inputs, textareas, selects
      const target = e.target as HTMLElement;
      const isEditing = ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)
        || target.isContentEditable;

      // Teclas de função não bloqueadas por inputs
      const isFunctionKey = e.key.startsWith('F') && !isNaN(Number(e.key.slice(1)));

      if (isEditing && !isFunctionKey) return;

      // ─── Teclas de Função ────────────────────────────────────
      if (isFunctionKey && FUNCTION_KEY_MAP[e.key]) {
        e.preventDefault();
        handlers.onNavigate?.(FUNCTION_KEY_MAP[e.key]);
        return;
      }

      // ─── Ctrl + combinações ──────────────────────────────────
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'f' || e.key === 'F') {
          e.preventDefault();
          handlers.onSearch?.();
          return;
        }

        if (e.shiftKey) {
          switch (e.key) {
            case 'B':
              e.preventDefault();
              handlers.onBackup?.();
              break;
            case 'S':
              e.preventDefault();
              handlers.onSync?.();
              break;
            case 'L':
              e.preventDefault();
              handlers.onLogout?.();
              break;
          }
          return;
        }
      }

      // ─── Teclas simples (sem modificadores) ──────────────────
      if (!e.ctrlKey && !e.metaKey && !e.altKey && !isEditing) {
        if (e.key === 'Escape') {
          handlers.onEscape?.();
          return;
        }
        if (e.key === '?') {
          e.preventDefault();
          handlers.onHelp?.();
          return;
        }
      }
    },
    [handlers]
  );

  useEffect(() => {
    window.addEventListener('keydown', handle);
    return () => window.removeEventListener('keydown', handle);
  }, [handle]);
}

// ─── Mapa de atalhos para exibir no HelpModal ────────────────
export const SHORTCUT_REFERENCE = [
  { keys: ['F1'], description: 'Ir para Dashboard' },
  { keys: ['F2'], description: 'Monitor ao Vivo' },
  { keys: ['F3'], description: 'Central de Alertas' },
  { keys: ['F4'], description: 'Gestão de Alunos' },
  { keys: ['F5'], description: 'Relatórios' },
  { keys: ['F6'], description: 'Configurações' },
  { keys: ['F10'], description: 'Ranking Pedagógico' },
  { keys: ['Ctrl', 'F'], description: 'Busca Global' },
  { keys: ['Ctrl', '⇧', 'B'], description: 'Backup Imediato' },
  { keys: ['Ctrl', '⇧', 'S'], description: 'Sincronização Forçada' },
  { keys: ['Ctrl', '⇧', 'L'], description: 'Logout' },
  { keys: ['Esc'], description: 'Fechar modal / Cancelar' },
  { keys: ['?'], description: 'Mostrar esta ajuda' },
] as const;

export default useKeyboardShortcuts;
