import React from 'react';
import '../styles/CoolmeiaUX.css';

/**
 * HEX CELL CARD (v4001)
 * --------------------
 * O componente base da Cool.me.ia que substitui o EagleCard.
 * Representa uma 'célula' da colmeia escolar, utilizando clippath hexagonal
 * e estética Honey Amber / Obsidian.
 */
interface HexCellProps {
  title: string;
  subtitle: string;
  icon?: React.ReactNode;
  status?: 'active' | 'sync' | 'alert';
  onClick?: () => void;
}

export const HexCellCard: React.FC<HexCellProps> = ({ title, subtitle, icon, status, onClick }) => {
  return (
    <div className={`hex-card ${status === 'sync' ? 'network-pulse-hex' : ''}`} onClick={onClick} data-status={status}>
       <div className="hex-content-wrapper">
          {/* ICONE DA CÉLULA (v4001) */}
          <div className="hex-icon-container">
             {icon || '🐝'}
          </div>

          <h3 className="hive-title">{title}</h3>
          <p className="hive-subtitle">{subtitle}</p>

          {/* STATUS INTEGRITY (v4001) */}
          <div className="hex-status-badge">
             {status ? status.toUpperCase() : 'STABLE'}
          </div>
       </div>
    </div>
  );
};
