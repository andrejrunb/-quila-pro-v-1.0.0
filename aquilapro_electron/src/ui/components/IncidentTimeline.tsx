import React, { useEffect, useRef } from 'react';
import { SecurityEvent } from '../../services/AiTypes';
import { Shield, AlertTriangle, Clock, Camera, ChevronRight } from 'lucide-react';

interface IncidentTimelineProps {
  incidents: SecurityEvent[];
  onSelect?: (incident: SecurityEvent) => void;
}

const IncidentItem: React.FC<{ incident: SecurityEvent, index: number, onSelect?: (incident: SecurityEvent) => void }> = ({ incident, index, onSelect }) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.style.setProperty('--animation-delay', `${index * 100}ms`);
      ref.current.style.animationDelay = 'var(--animation-delay)';
    }
  }, [index]);

  // Format timestamp (number) to string if needed
  const formatTime = (ts: number | string) => {
    if (typeof ts === 'string') return ts;
    const date = new Date(ts);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div ref={ref} className="relative flex items-start group animation-slide-in">
      {/* Timeline Dot / Icon */}
      <div className={`absolute left-0 mt-1 flex h-10 w-10 items-center justify-center rounded-full border-4 border-white ring-4 ring-transparent transition-all shadow-sm ${
        incident.type === 'weapon' ? 'bg-red-500 text-white animate-pulse' : 'bg-orange-500 text-white'
      }`}>
        <AlertTriangle size={18} />
      </div>

      <div className="ml-14 flex-1">
        <div 
          className="flex flex-col rounded-2xl border border-slate-100 bg-white p-4 shadow-sm transition-all hover:bg-slate-50 hover:shadow-md cursor-pointer border-l-4 border-l-red-500"
          onClick={() => onSelect?.(incident)}
        >
          <div className="flex items-center justify-between">
            <h4 className="flex items-center gap-2 font-bold text-slate-800 uppercase italic tracking-tighter">
              {incident.type === 'weapon' ? 'WEAPON DETECTED' : (incident.title || 'UNUSUAL BEHAVIOR')}
              <span className="flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-black text-red-600 uppercase tracking-widest leading-none">CRITICAL</span>
            </h4>
            <div className="flex items-center gap-1.5 text-xs font-medium text-slate-400">
              <Clock size={12} />
              {formatTime(incident.timestamp)}
            </div>
          </div>
          
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            {incident.message || 'Severe pedagogical anomaly detected via autonomous analysis.'}
          </p>
          
          <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
            <div className="flex items-center gap-1 text-xs font-semibold text-slate-400">
              <Camera size={12} />
              {incident.cameraName || `CAM_0${incident.cameraId}`} • {incident.zone || 'Global Campus'}
            </div>
            <button className="flex items-center gap-1 text-xs font-bold text-red-600 hover:underline">
              VIEW PROTOCOL <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const IncidentTimeline: React.FC<IncidentTimelineProps> = ({ incidents, onSelect }) => {
  if (incidents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-slate-50/50 rounded-3xl border-2 border-dashed border-slate-200">
        <div className="p-4 bg-white rounded-full shadow-sm mb-4">
          <Shield size={32} className="text-slate-300" />
        </div>
        <h3 className="text-lg font-semibold text-slate-800">No Incidents Detected</h3>
        <p className="text-slate-500 max-w-xs text-center mt-2 px-6">The surveillance system is operating with 100% sovereign integrity.</p>
      </div>
    );
  }

  return (
    <div className="relative space-y-6 before:absolute before:inset-0 before:ml-5 before:h-full before:w-0.5 before:-translate-x-px before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
      {incidents.map((incident, idx) => (
        <IncidentItem key={incident.id} incident={incident} index={idx} onSelect={onSelect} />
      ))}
    </div>
  );
};
