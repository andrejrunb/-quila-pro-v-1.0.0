import React, { useEffect, useState, useRef } from 'react';
import './QuantumBoot.css';
import logo from '../../assets/logo.png';

export const QuantumBoot: React.FC = () => {
  const [percent, setPercent] = useState(0);
  const [status, setStatus] = useState('INICIALIZANDO NÚCLEO... ');
  const loaderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (loaderRef.current) {
      loaderRef.current.style.setProperty('--boot-percent', `${percent}%`);
    }
  }, [percent]);

  const bootMessages = [
    'MAPEANDO REDE SOBERANA...',
    'SINCRONIZANDO BIOMETRIA...',
    'CARREGANDO MODELOS PREDITIVOS...',
    'OTIMIZANDO ECOSSISTEMA ÁQUILA...',
    'ESTABELECENDO CANAL SEGURO...'
  ];

  useEffect(() => {
    let current = 0;
    const interval = setInterval(() => {
      current += Math.random() * 15;
      if (current >= 100) {
        current = 100;
        clearInterval(interval);
      }
      setPercent(Math.floor(current));
      setStatus(bootMessages[Math.floor((current / 101) * bootMessages.length)]);
    }, 200);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="quantum-boot-container">
      <div className="boot-content">
        <div className="boot-logo-wrapper">
          <img src={logo} alt="Áquila Pro" className="boot-logo" />
          <div className="logo-glitch"></div>
        </div>
        
        <div className="boot-loader-track">
          <div className="boot-loader-fill" ref={loaderRef}></div>
        </div>

        <div className="boot-status">
          <span className="status-text">{status}</span>
          <span className="percent-text">{percent}%</span>
        </div>

        <div className="boot-grid-overlay"></div>
      </div>
    </div>
  );
};

export default QuantumBoot;
