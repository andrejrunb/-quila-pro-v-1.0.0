import React, { useState, useEffect } from 'react';
import { Camera, ShieldAlert, Crosshair, Wifi } from 'lucide-react';
import './DroneLiveFeed.css';

/**
 * Phase 600: DroneLiveFeed
 * Simulação de feed de vídeo de drone com overlay de telemetria AR.
 */
export const DroneLiveFeed: React.FC = () => {
  const [alt, setAlt] = useState(12.5);
  const [speed, setSpeed] = useState(4.2);

  useEffect(() => {
    const interval = setInterval(() => {
      setAlt(a => Math.max(10, a + (Math.random() - 0.5)));
      setSpeed(s => Math.max(0, s + (Math.random() - 0.5)));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="drone-feed-container">
      <div className="feed-header">
        <div className="flex items-center gap-2">
          <div className="recording-dot" />
          <span className="text-[10px] font-bold">LIVE // DRONE-ALPHA</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1 text-[10px]">
            <Wifi size={12} className="text-emerald-400" />
            <span>98% SIG</span>
          </div>
          <span className="text-[10px] font-mono">2026-03-25 21:04:12</span>
        </div>
      </div>

      {/* Mock do Vídeo */}
      <div className="feed-video-mock">
        <div className="ar-overlay">
          <div className="ar-corner tl" />
          <div className="ar-corner tr" />
          <div className="ar-corner bl" />
          <div className="ar-corner br" />
          
          <div className="ar-crosshair">
            <Crosshair size={40} className="text-emerald-400/30" />
          </div>

          <div className="ar-telemetry-left">
            <div className="ar-stat">
              <span className="label">ALT</span>
              <span className="value">{alt.toFixed(1)}m</span>
            </div>
            <div className="ar-stat">
              <span className="label">SPD</span>
              <span className="value">{speed.toFixed(1)}m/s</span>
            </div>
          </div>

          <div className="ar-target-box">
            <div className="target-outline" />
            <span className="target-label">HUMAN_DETECTED // 98%</span>
          </div>
        </div>
        
        <div className="feed-noise" />
      </div>

      <div className="feed-footer">
        <div className="flex items-center gap-2 text-amber-400">
          <ShieldAlert size={14} />
          <span className="text-[10px] font-bold uppercase">Patrulha Autônoma em Curso</span>
        </div>
        <button className="feed-expand-btn">
          <Camera size={14} /> FULLSCREEN
        </button>
      </div>
    </div>
  );
};
