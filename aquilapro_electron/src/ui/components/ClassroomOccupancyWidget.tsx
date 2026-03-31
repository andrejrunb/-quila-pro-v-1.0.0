import React from 'react';
import { Users, Info } from 'lucide-react';

interface ClassroomOccupancyProps {
  roomName: string;
  currentCount: number;
  capacity: number;
}

/**
 * ClassroomOccupancyWidget.tsx — AG-021
 * Widget de ocupação em tempo real para salas de aula.
 */
const ClassroomOccupancyWidget: React.FC<ClassroomOccupancyProps> = ({ roomName, currentCount, capacity }) => {
  const percentage = Math.round((currentCount / capacity) * 100);
  const isCrowded = percentage >= 90;

  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition">
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-bold text-slate-700">{roomName}</h4>
        <div className={`p-2 rounded-lg ${isCrowded ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>
          <Users size={18} />
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-xs font-semibold">
          <span className="opacity-50">Ocupação</span>
          <span className={isCrowded ? 'text-red-600' : ''}>{percentage}%</span>
        </div>
        <div className="occupancy-track">
          <div 
            className="occupancy-fill" 
            style={{ '--occ-width': `${percentage}%` } as React.CSSProperties}
          />
        </div>
        <p className="text-[10px] opacity-40 flex items-center gap-1">
          <Info size={10} /> {currentCount} / {capacity} alunos presentes
        </p>
      </div>
    </div>
  );
};

export default ClassroomOccupancyWidget;
