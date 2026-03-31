import React, { useState, useEffect, useRef } from 'react';
import { 
  Wind, Thermometer, Droplets, 
  AlertTriangle, CheckCircle, Zap 
} from 'lucide-react';
import { environmentalService, EnvironmentalData } from '../../services/EnvironmentalService';
import { cognitiveAnalysisService, CognitiveAlert } from '../../services/CognitiveAnalysisService';
import './EnvironmentalHUD.css';

interface EnvironmentalHUDProps {
  roomId: string;
}

/**
 * ENVIRONMENTAL HUD (v3610)
 * -------------------------
 * Displays real-time classroom telemetry and cognitive safety alerts.
 * Aesthetic: "Cognitive-Slate" design.
 */
export const EnvironmentalHUD: React.FC<EnvironmentalHUDProps> = ({ roomId }) => {
  const [data, setData] = useState<EnvironmentalData | undefined>(environmentalService.getRoomData(roomId));
  const [alerts, setAlerts] = useState<CognitiveAlert[]>(cognitiveAnalysisService.getAlertsForRoom(roomId));

  useEffect(() => {
    const updateHandler = (newData: EnvironmentalData) => {
      setData({ ...newData });
      setAlerts(cognitiveAnalysisService.getAlertsForRoom(roomId));
    };

    environmentalService.on(`room-updated-${roomId}`, updateHandler);
    return () => {
      environmentalService.off(`room-updated-${roomId}`, updateHandler);
    };
  }, [roomId]);

  const fillRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (fillRef.current && data) {
      fillRef.current.style.setProperty('--co2-width', `${Math.min((data.co2 / 1200) * 100, 100)}%`);
    }
  }, [data]);

  if (!data) return <div className="hud-error">NO SENSOR DATA</div>;

  return (
    <div className="environmental-hud-container">
      {/* CO2 Monitor */}
      <div className="hud-metric-row">
        <span className="metric-label"><Wind size={12} /> CO2 Level</span>
        <span className={`metric-value ${data.status}`}>
          {data.co2} PPM
        </span>
      </div>
      <div className="hud-progress-bg">
        <div 
          ref={fillRef}
          className={`hud-progress-fill ${data.status}`}
        />
      </div>

      {/* Temperature & Humidity */}
      <div className="flex justify-between items-center mt-2">
        <div className="flex flex-col gap-1">
          <span className="metric-label"><Thermometer size={12} /> Temp</span>
          <span className="metric-value text-sm">{data.temperature}°C</span>
        </div>
        <div className="flex flex-col gap-1 items-end">
          <span className="metric-label">Humidity <Droplets size={12} /></span>
          <span className="metric-value text-sm">{data.humidity}%</span>
        </div>
      </div>

      {/* Cognitive Alerts */}
      {alerts.length > 0 && (
        <div className="cognitive-alert-box animate-pulse">
          <AlertTriangle size={16} className="text-alert flex-shrink-0" />
          <div className="alert-message">{alerts[0].message}</div>
        </div>
      )}

      {/* Autonomous Action */}
      {data.status !== 'optimal' && (
        <button 
          className="force-vent-btn"
          onClick={() => environmentalService.forceVentilation(roomId)}
        >
          FORCE VENTILATION
        </button>
      )}

      {data.status === 'optimal' && alerts.length === 0 && (
        <div className="flex items-center gap-2 text-[9px] text-success font-bold mt-2 uppercase opacity-60">
          <CheckCircle size={10} /> Room Status: Optimal
        </div>
      )}
    </div>
  );
};
