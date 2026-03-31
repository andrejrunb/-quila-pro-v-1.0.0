import React from 'react';
import './Skeleton.css';

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
  className?: string;
  'aria-label'?: string;
}

// ─── Base Skeleton Pulse ─────────────────────────────────────
const SkeletonBase: React.FC<SkeletonProps> = ({
  width = '100%',
  height = 16,
  borderRadius = 8,
  className = '',
  'aria-label': ariaLabel = 'Carregando...',
}) => (
  <div
    role="status"
    aria-label={ariaLabel}
    aria-busy="true"
    className={`skeleton-pulse ${className}`}
    data-width={width}
    data-height={height}
    data-radius={borderRadius}
  />
);

// ─── Card Skeleton (usado em DashboardCard, StudentCard) ──────
const Card: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div
    role="status"
    aria-label="Carregando card..."
    aria-busy="true"
    className={`skeleton-card ${className}`}
  >
    <div className="skeleton-flex-row" data-gap="12px">
      <SkeletonBase width={48} height={48} borderRadius={12} />
      <div className="skeleton-flex-col" data-grow="1" data-gap="6px">
        <SkeletonBase width="60%" height={14} />
        <SkeletonBase width="40%" height={11} />
      </div>
    </div>
    <SkeletonBase width="100%" height={10} />
    <SkeletonBase width="80%" height={10} />
    <SkeletonBase width="90%" height={10} />
  </div>
);

// ─── Avatar Row Skeleton (usado em listas de alunos) ─────────
const AvatarRow: React.FC = () => (
  <div
    role="status"
    aria-label="Carregando item..."
    aria-busy="true"
    className="skeleton-avatar-row"
  >
    <SkeletonBase width={44} height={44} borderRadius={999} />
    <div className="skeleton-flex-col" data-grow="1" data-gap="6px">
      <SkeletonBase width="50%" height={13} />
      <SkeletonBase width="35%" height={10} />
    </div>
    <SkeletonBase width={60} height={24} borderRadius={8} />
  </div>
);

// ─── Table Skeleton ───────────────────────────────────────────
const Table: React.FC<{ rows?: number }> = ({ rows = 5 }) => (
  <div role="status" aria-label="Carregando tabela..." aria-busy="true" className="skeleton-table">
    {/* Header */}
    <div className="skeleton-table-header">
      <SkeletonBase width={44} height={11} />
      <SkeletonBase width="30%" height={11} />
      <SkeletonBase width="20%" height={11} />
      <SkeletonBase width="15%" height={11} />
    </div>
    {/* Rows */}
    {Array.from({ length: rows }).map((_, i) => (
      <AvatarRow key={i} />
    ))}
  </div>
);

// ─── Stat Skeleton (usado em DashboardStats) ─────────────────
const Stat: React.FC = () => (
  <div
    role="status"
    aria-label="Carregando estatística..."
    aria-busy="true"
    className="skeleton-stat"
  >
    <SkeletonBase width="40%" height={11} />
    <SkeletonBase width="60%" height={32} borderRadius={6} />
    <SkeletonBase width="50%" height={10} />
  </div>
);

// ─── Compose ─────────────────────────────────────────────────
export const Skeleton = Object.assign(SkeletonBase, { Card, AvatarRow, Table, Stat });

export default Skeleton;
