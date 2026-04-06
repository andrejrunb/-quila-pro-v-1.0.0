import React, { useState, useEffect, useRef } from 'react';
import { Users, AlertCircle, MapPin, Activity } from 'lucide-react';
import './AttendanceDensityMap.css';

export interface ReIDSession {
  studentId: string;
  lastSeenNode: string;
  confidence: number;
  featureVector: number[];
  timestamp: number;
  clothingRef: string;
}

export interface PresenceDiscrepancy {
  id: string;
  studentId: string;
  expectedRoom: string;
  actualRoom: string;
  timestamp: number;
  severity: 'low' | 'medium' | 'high';
}

export const AttendanceDensityMap: React.FC = () => {
  const [sessions, setSessions] = useState<ReIDSession[]>([]);
  const [discrepancies, setDiscrepancies] = useState<PresenceDiscrepancy[]>([]);

  useEffect(() => {
    const loadInitialData = async () => {
      const initialSessions = await window.aquila.getReIDSessions();
      const initialDiscrepancies = await window.aquila.getPresenceDiscrepancies();
      setSessions(initialSessions || []);
      setDiscrepancies(initialDiscrepancies || []);
    };
    loadInitialData();

    const handleReIDUpdate = (session: ReIDSession) => {
      setSessions(prev => {
        const index = prev.findIndex(s => s.studentId === session.studentId);
        if (index > -1) {
          const next = [...prev];
          next[index] = session;
          return next;
        }
        return [...prev, session];
      });
    };

    const handlePresenceUpdate = (data: any) => {
      // Recarrega todas as discrepâncias do main para garantir sincronia (SOC v3)
      window.aquila.getPresenceDiscrepancies().then(setDiscrepancies);
    };

    if (window.aquila?.onReIDUpdate) {
      window.aquila.onReIDUpdate(handleReIDUpdate);
    }
    
    if (window.aquila?.onPresenceDiscrepancy) {
      window.aquila.onPresenceDiscrepancy(handlePresenceUpdate);
    }

    return () => {
      // Clean up happens on window unload
    };
  }, []);

  const getNodeData = (nodeId: string) => {
    const nodeSessions = sessions.filter(s => s.lastSeenNode === nodeId);
    const nodeDiscrepancies = discrepancies.filter(d => d.actualRoom === nodeId);
    return { count: nodeSessions.length, alerts: nodeDiscrepancies };
  };

  const rooms = [
    { id: 'room_101', name: 'Sala 101' },
    { id: 'room_102', name: 'Sala 102' },
    { id: 'lab_gen_01', name: 'Laboratório Maker' },
    { id: 'playground_beta', name: 'Pátio Recreativo' }
  ];

  const integrity = sessions.length > 0 
    ? ((sessions.length - discrepancies.length) / sessions.length) * 100 
    : 100;

  const meterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (meterRef.current) {
      meterRef.current.style.setProperty('--integrity-width', `${integrity}%`);
    }
  }, [integrity]);

  return (
    <div className="density-map-container">
      <header className="flex justify-between items-center">
        <h3 className="section-title !mb-0"><Activity size={14} /> Integridade de Fluxo</h3>
        <div className="flex items-center gap-2 text-[10px] font-bold text-secondary">
          <Users size={12} /> {sessions.length} ALUNOS RASTREADOS
        </div>
      </header>

      <div className="map-grid-visualizer">
        {rooms.map(room => {
          const { count, alerts } = getNodeData(room.id);
          return (
            <div key={room.id} className={`node-heat-box ${count > 0 ? 'active' : ''}`}>
              {count > 0 && <div className="heat-pulse" />}
              <div className="node-header">
                <span className="node-name">{room.name}</span>
                <span className="node-count">{count}</span>
              </div>
              {alerts.length > 0 && (
                <div className="discrepancy-badge" title={`Discrepância detectada: ${alerts.length}`} />
              )}
            </div>
          );
        })}
      </div>

      <div className="integrity-meter">
        <div className="meter-header">
          <span>Conformidade Pedagógica</span>
          <span>{integrity.toFixed(0)}%</span>
        </div>
        <div className="meter-bg">
          <div ref={meterRef} className="meter-fill" />
        </div>
      </div>

      {discrepancies.length > 0 && (
        <div className="discrepancy-list">
          {discrepancies.map(d => (
            <div key={d.id} className="discrepancy-item">
              <AlertCircle size={12} />
              <span>Aluno {d.studentId.replace('std_', '#')} fora da zona esperada ({d.expectedRoom})</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
