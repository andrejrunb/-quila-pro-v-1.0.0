import React, { useState, useEffect, useRef } from 'react';
import { Users, AlertCircle, MapPin, Activity } from 'lucide-react';
import { reIDService, ReIDSession } from '../../services/ReIDService';
import { presenceMonitorService, PresenceDiscrepancy } from '../../services/PresenceMonitorService';
import './AttendanceDensityMap.css';

/**
 * ATTENDANCE DENSITY MAP (v3620)
 * ------------------------------
 * High-fidelity visualization of student pedagogical flow and presence integrity.
 * Aesthetic: "Flow-Slate" design.
 */
export const AttendanceDensityMap: React.FC = () => {
  const [sessions, setSessions] = useState<ReIDSession[]>(reIDService.getAllSessions());
  const [discrepancies, setDiscrepancies] = useState<PresenceDiscrepancy[]>(presenceMonitorService.getDiscrepancies());

  useEffect(() => {
    const handleUpdate = () => {
      setSessions(reIDService.getAllSessions());
      setDiscrepancies(presenceMonitorService.getDiscrepancies());
    };

    reIDService.on('movement-detected', handleUpdate);
    reIDService.on('session-updated', handleUpdate);
    presenceMonitorService.on('discrepancy-found', handleUpdate);
    presenceMonitorService.on('discrepancy-resolved', handleUpdate);

    // Initial Registration of Mock Students if none exist
    if (sessions.length === 0) {
      reIDService.registerStudent('std_001', 'room_101', 'blue-hoodie');
      reIDService.registerStudent('std_002', 'room_101', 'yellow-shirt');
      reIDService.registerStudent('std_003', 'lab_gen_01', 'red-jacket');
      reIDService.registerStudent('std_004', 'playground_beta', 'white-polo');
    }

    return () => {
      reIDService.off('movement-detected', handleUpdate);
      reIDService.off('session-updated', handleUpdate);
      presenceMonitorService.off('discrepancy-found', handleUpdate);
      presenceMonitorService.off('discrepancy-resolved', handleUpdate);
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
