import React, { useState, useEffect, useRef } from 'react';
import { QrCode, ShieldCheck, RefreshCw } from 'lucide-react';
import './DynamicQrCode.css';

interface Props {
  userId: string;
  userName: string;
  size?: number;
}

/**
 * Step 135 — DynamicQrCode
 * Gera um QR Code rotativo baseado em tempo (TOTP approach) para acesso seguro.
 * O código expira a cada 30 segundos.
 */
export const DynamicQrCode: React.FC<Props> = ({ userId, userName, size = 200 }) => {
  const [token, setToken] = useState<string>('');
  const [timeLeft, setTimeLeft] = useState(30);

  const generateToken = () => {
    // Simula um token ultra-seguro assinado (Phase 181-ready)
    const random = Math.random().toString(36).substring(2, 10).toUpperCase();
    const timestamp = Math.floor(Date.now() / 30000);
    setToken(`AQ-${userId}-${timestamp}-${random}`);
    setTimeLeft(30);
  };

  useEffect(() => {
    generateToken();
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          generateToken();
          return 30;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [userId]);

  const progress = (timeLeft / 30) * 100;

  const qrBoxRef = useRef<HTMLDivElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (qrBoxRef.current) {
      qrBoxRef.current.style.setProperty('--qr-size-dynamic', `${size}px`);
    }
  }, [size]);

  useEffect(() => {
    if (progressBarRef.current) {
      progressBarRef.current.style.setProperty('--qr-progress-dynamic', `${progress}%`);
    }
  }, [progress]);

  return (
    <div className="dynamic-qr-container">
      <div 
        ref={qrBoxRef}
        className="qr-box"
        title="QR Code de Acesso Dinâmico"
      >
        <div className="qr-placeholder">
          <QrCode size={size * 0.8} color="#0f172a" />
        </div>
        
        <div ref={progressBarRef} className="qr-progress-bar" />
      </div>

      <div className="qr-info-text">
        <h3>Acesso de {userName}</h3>
        <p>
          <ShieldCheck size={14} color="#22c55e" />
          Expira em {timeLeft}s (Código Dinâmico)
        </p>
      </div>

      <div className="qr-token-label">
        {token}
      </div>
    </div>
  );
};
