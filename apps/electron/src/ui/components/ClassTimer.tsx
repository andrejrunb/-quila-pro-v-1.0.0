import React, { useState, useEffect } from 'react';
import './ClassTimer.css';

const ClassTimer: React.FC = () => {
  const [timeLeft, setTimeLeft] = useState(50 * 60); // 50 minutos de aula
  const [alert, setAlert] = useState<string | null>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 0) return 0;
        
        // Alertas automáticos
        if (prev === 5 * 60) setAlert('⚠️ Faltam 5 min: Verifique as tarefas dos alunos!');
        if (prev === 1 * 60) setAlert('⚠️ Faltam 1 min: Inicie o Protocolo de Logoff!');
        
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  const timerStatusClass = timeLeft < 5 * 60 ? 'urgent' : (timeLeft < 10 * 60 ? 'warning' : '');

  return (
    <div className="class-timer-container">
      <div className="timer-label">Aula em Progresso</div>
      <div className={`timer-clock ${timerStatusClass}`}>
        {formatTime(timeLeft)}
      </div>
      
      {alert && (
        <div className="timer-alert">
          {alert}
        </div>
      )}

      <div style={{display: 'flex', gap: '8px', marginTop: '12px'}}>
        <div style={{width: '60px', height: '4px', borderRadius: '2px', background: 'var(--timer-accent)'}}></div>
        <div style={{width: '60px', height: '4px', borderRadius: '2px', background: 'rgba(255,255,255,0.1)'}}></div>
        <div style={{width: '40px', height: '4px', borderRadius: '2px', background: 'rgba(255,255,255,0.1)'}}></div>
      </div>
    </div>
  );
};

export default ClassTimer;
