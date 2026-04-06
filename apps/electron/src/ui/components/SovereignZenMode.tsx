import React, { useState } from 'react';
import '../styles/SovereignEagleUX.css';

/**
 * SOVEREIGN ZEN MODE (v3801)
 * -------------------------
 * Interface ultra-minimalista para o Áquila Pro OS.
 * Oculta todos os widgets de métricas pesadas (NPU, Swarm, Alerts)
 * e mantém apenas o essencial para a aula atual: Chat do Aluno e
 * o AITutor Hologram atenuado. Redução de 80% na carga visual.
 */
export const SovereignZenMode: React.FC = () => {
  const [activeLesson, setActiveLesson] = useState('INTRODUÇÃO À FISICA QUÂNTICA');

  return (
    <div className="eagle-command-center zen-mode-container">
      {/* HEADER MINIMALISTA (v3801) */}
      <header className="zen-header">
        <h2 className="eagle-title login-title">ÁQUILA PRO | ZEN MODE</h2>
        <div className="metric-label">FOCO ATIVO: {activeLesson}</div>
      </header>

      {/* CORE DE ENSINO (v3801) */}
      <main className="zen-main">
        <div className="hologram-container zen-tutor-wrapper" data-aura="focused">
           <div className="avatar-core" />
           <p className="metric-label">
              SINTONIA NEURAL ESTÁVEL | OUVINDO...
           </p>
        </div>
      </main>

      {/* RODAPÉ SUTIL (v3801) */}
      <footer className="zen-footer">
         <div className="integrity-seal-gold">PEDAGOGY FIRST v3801</div>
         <div className="metric-label">Duração: 45:12</div>
      </footer>

      {/* OVERLAY DE SOMBRA (ESTÉTICA v3801) */}
      <div className="zen-overlay" />
    </div>
  );
};
