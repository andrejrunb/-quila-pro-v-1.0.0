/**
 * Step 168 — Empty State Component
 * Estado vazio ilustrado para todas as listas e tabelas.
 *
 * Uso:
 *   <EmptyState
 *     icon="🎓"
 *     title="Nenhum aluno cadastrado"
 *     description="Comece adicionando o primeiro aluno."
 *     action={{ label: 'Adicionar Aluno', onClick: () => navigate('add-student') }}
 *   />
 */
import React from 'react';
import './EmptyState.css';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
  };
  size?: 'sm' | 'md' | 'lg';
  /** Para o aria-label do container */
  'aria-label'?: string;
}

// Ícones padrão por contexto
export const EMPTY_ICONS = {
  students:  '🎓',
  alerts:    '🔔',
  cameras:   '📹',
  reports:   '📊',
  whatsapp:  '💬',
  search:    '🔍',
  events:    '📅',
  generic:   '📭',
  ranking:   '🏆',
  logs:      '📋',
} as const;

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = '📭',
  title,
  description,
  action,
  size = 'md',
  'aria-label': ariaLabel,
}) => {
  return (
    <div
      role="status"
      aria-label={ariaLabel || title}
      className={`empty-state-container empty-state-${size}`}
    >
      {/* Icon bubble */}
      <div
        aria-hidden="true"
        className="empty-state-icon-bubble"
      >
        {icon}
      </div>

      {/* Title */}
      <h3 className="empty-state-title">
        {title}
      </h3>

      {/* Description */}
      {description && (
        <p className="empty-state-description">
          {description}
        </p>
      )}

      {/* Action Button */}
      {action && (
        <button
          onClick={action.onClick}
          className="empty-state-action"
        >
          {action.icon && <span aria-hidden="true">{action.icon}</span>}
          {action.label}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
