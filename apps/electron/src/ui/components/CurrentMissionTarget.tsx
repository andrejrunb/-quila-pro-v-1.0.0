import React, { useEffect, useRef, useState } from 'react';
import { animate, stagger } from 'animejs';
import { Target, Zap } from 'lucide-react';
import './CurrentMissionTarget.css';

interface StudentTarget {
  banca: string;
  target_score: number;
  current_progress: number;
  mission_name: string;
}

/**
 * CurrentMissionTarget (Phase 2901)
 * Componente de elite para visualização de metas pedagógicas com Radar Animado.
 */
export const CurrentMissionTarget: React.FC<{ studentId: string }> = ({ studentId }) => {
  const [data, setData] = useState<StudentTarget | null>(null);
  const sweepRef = useRef<SVGLineElement>(null);

  const [pulseActive, setPulseActive] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const aquila = (window as any).aquila;
        if (aquila) {
          const result = await aquila.pedagogy.getStudentTarget(studentId);
          if (result?.success && result.data) {
            setData(result.data);
          } else {
            // Fallback para demonstração (Elite UX)
            setData({
              banca: 'UnB',
              target_score: 750,
              current_progress: 68,
              mission_name: 'Projeto Medicina 2026'
            });
          }
        }
      } catch (err) {
        console.error('[UI] Erro ao buscar alvo do estudante:', err);
      }
    };
    fetchData();

    // Listener para o evento Nexus Pulse (v1.5.0)
    const handlePulse = (event: any, pulse: any) => {
      if (pulse && pulse.studentId === studentId) {
        setPulseActive(true);
        
        // Gatilho de animação de Pulse
        animate({
          targets: '.mission-radar-container',
          scale: [1, 1.15, 1],
          filter: ['brightness(1)', 'brightness(1.8)', 'brightness(1)'],
          duration: 800,
          easing: 'easeOutElastic(1, .6)'
        });

        // Efeito Sonoro / Vibracional Visual
        animate({
          targets: '.mission-aura-glow',
          opacity: [0, 1, 0],
          scale: [1, 3],
          duration: 1200,
          easing: 'easeOutExpo'
        });

        setTimeout(() => setPulseActive(false), 2000);
      }
    };

    if ((window as any).ipcRenderer) {
      (window as any).ipcRenderer.on('nexus-pulse', handlePulse);
    }

    return () => {
      if ((window as any).ipcRenderer) {
        (window as any).ipcRenderer.removeListener('nexus-pulse', handlePulse);
      }
    };
  }, [studentId]);

  useEffect(() => {
    if (data && sweepRef.current) {
      // Animação de varredura do radar
      animate({
        targets: sweepRef.current,
        rotate: [0, 360],
        duration: 3000,
        easing: 'linear',
        loop: true,
        direction: 'normal'
      });

      // Animação de entrada / atualização dos dados
      animate({
        targets: '.mission-content > *',
        translateY: [20, 0],
        opacity: [0, 1],
        delay: stagger(100),
        easing: 'easeOutExpo'
      });
    }
  }, [data]);

  if (!data) return null;

  return (
    <div className={`current-mission-card holographic-card ${pulseActive ? 'pulse-active' : ''}`}>
      <div className="mission-radar-container">
        <svg viewBox="0 0 100 100" className="mission-radar-svg">
          <defs>
            <radialGradient id="radar-gradient" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="rgba(34, 211, 238, 0.4)" />
              <stop offset="100%" stopColor="transparent" />
            </radialGradient>
          </defs>
          <circle cx="50" cy="50" r="48" className="radar-circle-outer" />
          <circle cx="50" cy="50" r="32" className="radar-circle-mid" />
          <circle cx="50" cy="50" r="16" className="radar-circle-inner" />
          
          <line 
            ref={sweepRef} 
            x1="50" y1="50" x2="50" y2="2" 
            className="radar-sweep"
            style={{ transformOrigin: '50% 50%' }}
          />
          
          {pulseActive && (
            <circle cx="50" cy="50" r="1" fill="#22d3ee">
              <animate attributeName="r" from="1" to="48" dur="1.5s" repeatCount="indefinite" />
              <animate attributeName="opacity" from="1" to="0" dur="1.5s" repeatCount="indefinite" />
            </circle>
          )}
        </svg>
        <div className="mission-aura-glow"></div>
      </div>
      
      <div className="mission-content">
        <div className="mission-header">
          <Target className={`mission-icon ${pulseActive ? 'rotating' : ''}`} size={20} />
          <h3 className="mission-title">Missão: {data.banca}</h3>
        </div>
        
        <div className="mission-details">
          <p className="mission-name-text">{data.mission_name}</p>
          <div className="mission-progress-wrapper">
            <div className="progress-labels">
              <span>Sintonia</span>
              <span>{data.current_progress}%</span>
            </div>
            <div className="mission-progress-bar-bg">
              <div 
                className="mission-progress-bar-fill"
                style={{ width: `${data.current_progress}%`, transition: 'width 2s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
              ></div>
            </div>
          </div>
        </div>

        <div className="mission-status-footer">
          <Zap size={14} className={`mission-pulse-icon ${pulseActive ? 'active' : ''}`} />
          <span>{pulseActive ? 'NOVO PULSO RECEBIDO!' : 'Frequência Pedagógica Estabilizada'}</span>
        </div>
      </div>
    </div>
  );
};
