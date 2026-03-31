import React, { useState, useEffect } from 'react';
import { 
  PlaneLanding, MapPin, Info
} from 'lucide-react';
import { geofenceMonitorService, ParentArrival } from '../../services/GeofenceMonitorService';
import './ArrivalBoard.css';

/**
 * ArrivalBoard (v1634)
 * Mural estilo "Aeroporto" para a portaria da escola.
 */
export const ArrivalBoard: React.FC = () => {
  const [arrivals, setArrivals] = useState<ParentArrival[]>([]);

  useEffect(() => {
    // Mock de atualização periódica
    const interval = setInterval(() => {
      const data = geofenceMonitorService.getArrivingParents();
      setArrivals(data);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="arrival-board-container">
      <header className="board-header">
         <div className="header-left">
            <PlaneLanding size={40} className="text-yellow-400" />
            <h1 className="board-title">MURAL DE CHEGADA (PAIS)</h1>
         </div>
         <div className="board-status">SISTEMA GEOFENCING: ATIVO</div>
      </header>

      <table className="airport-table">
         <thead>
            <tr>
               <th className="time-header-col">TEMPO</th>
               <th>ALUNOS(AS)</th>
               <th>RESPONSÁVEL</th>
               <th>SÉRIE/ANO</th>
               <th>LOCALIZAÇÃO</th>
               <th>STATUS</th>
            </tr>
         </thead>
         <tbody>
            {arrivals.length > 0 ? arrivals.map((p, idx) => (
               <tr key={idx} className={`arrival-row ${p.status === 'AT_GATE' ? 'highlight-gate' : ''}`}>
                  <td className="time-col">0 min</td>
                  <td className="student-col">{p.studentNames.join(', ')}</td>
                  <td className="parent-col">{p.parentName}</td>
                  <td className="class-col">6º e 7º Ano</td>
                  <td className="dist-col">
                     <div className="dist-container">
                        <MapPin size={14} />
                        {p.distanceMeters}m
                     </div>
                  </td>
                  <td className="status-col">
                     <span className={`status-pill ${p.status}`}>
                        {p.status === 'AT_GATE' ? 'NA PORTA' : 'CHEGANDO'}
                     </span>
                  </td>
               </tr>
            )) : (
               <tr className="empty-row">
                  <td colSpan={6}>Nenhuma chegada detectada via GPS no momento...</td>
               </tr>
            )}
         </tbody>
      </table>

      <footer className="board-footer">
         <div className="footer-content">
            <Info size={14} />
            <span>Por favor, aguarde na área coberta. O sistema anuncia sua vez automaticamente.</span>
         </div>
      </footer>
    </div>
  );
};

export default ArrivalBoard;
