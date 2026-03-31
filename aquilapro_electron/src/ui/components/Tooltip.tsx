/**
 * Step 169 — Tooltip Contextual
 * Tooltip acessível com aria-describedby para todos os ícones sem texto.
 *
 * Uso:
 *   <Tooltip content="Exportar relatório em CSV">
 *     <button><Download /></button>
 *   </Tooltip>
 *
 *   <Tooltip content="Ativado" placement="bottom">
 *     <Toggle />
 *   </Tooltip>
 */
import React, { useState, useRef, useId, useCallback } from 'react';
import './Tooltip.css';

interface TooltipProps {
  content: string;
  placement?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number; // ms antes de aparecer
  children: React.ReactElement;
  disabled?: boolean;
}

const PLACEMENT_STYLES: Record<string, React.CSSProperties> = {
  top:    { bottom: 'calc(100% + 8px)', left: '50%', transform: 'translateX(-50%)' },
  bottom: { top: 'calc(100% + 8px)',    left: '50%', transform: 'translateX(-50%)' },
  left:   { right: 'calc(100% + 8px)', top: '50%',  transform: 'translateY(-50%)' },
  right:  { left: 'calc(100% + 8px)',  top: '50%',  transform: 'translateY(-50%)' },
};

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  placement = 'top',
  delay = 400,
  children,
  disabled = false,
}) => {
  const [visible, setVisible] = useState(false);
  const tooltipId = useId();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback(() => {
    if (disabled) return;
    timerRef.current = setTimeout(() => setVisible(true), delay);
  }, [disabled, delay]);

  const hide = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setVisible(false);
  }, []);

  return (
    <span
      className="tooltip-wrapper"
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      {/* Clone child adding aria-describedby */}
      {React.cloneElement(children, {
        'aria-describedby': visible ? tooltipId : undefined,
      })}

      {/* Tooltip bubble */}
      {visible && !disabled && (
        <span
          id={tooltipId}
          role="tooltip"
          aria-live="polite"
          className={`tooltip-bubble tooltip-${placement}`}
        >
          {content}
        </span>
      )}
    </span>
  );
};

export default Tooltip;
