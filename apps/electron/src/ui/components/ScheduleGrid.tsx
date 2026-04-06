import React, { useState, useEffect, useRef } from 'react';
import { 
  Trash2, FileSpreadsheet, Download, 
  RefreshCw, Zap, AlertCircle 
} from 'lucide-react';
import '../pages/ClassroomManagement.css';

interface Schedule {
  id: string;
  classId: string;
  roomId: string;
  subject: string;
  startTime: string;
  endTime: string;
  dayOfWeek: number;
}

interface Suggestion {
  originalTime: string;
  suggestedTime: string;
  reason: string;
}

interface ScheduleGridProps {
  classId: string;
  rooms: any[];
  schedules: Schedule[];
  onSave: (schedule: Schedule) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

const DAYS = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
const TIME_SLOTS = [
  '07:30 - 08:20',
  '08:20 - 09:10',
  '09:10 - 10:00',
  '10:20 - 11:10',
  '11:10 - 12:00',
  '13:00 - 13:50',
  '13:50 - 14:40',
];

export const ScheduleGrid: React.FC<ScheduleGridProps> = ({ 
  classId, 
  rooms, 
  schedules, 
  onSave, 
  onDelete 
}) => {
  const [localSchedules, setLocalSchedules] = useState<Schedule[]>(schedules);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const aquila = (window as any).aquila;

  useEffect(() => {
    setLocalSchedules(schedules.filter(s => s.classId === classId));
  }, [schedules, classId]);

  const fetchOptimizations = async () => {
    try {
      const result = await aquila.invoke('get-schedule-optimizations');
      setSuggestions(result || []);
      setShowSuggestions(true);
    } catch (err) {
      console.error('Erro ao buscar otimizações:', err);
    }
  };

  const getCellData = (day: number, timeSlot: string) => {
    const [start] = timeSlot.split(' - ');
    return localSchedules.find(s => 
      s.dayOfWeek === day && 
      s.startTime === start
    );
  };

  const handleCellChange = (day: number, timeSlot: string, field: string, value: any) => {
    const [start, end] = timeSlot.split(' - ');
    const existing = getCellData(day, timeSlot);

    if (existing) {
      const updated = { ...existing, [field]: value };
      setLocalSchedules(prev => prev.map(s => s.id === existing.id ? updated : s));
      onSave(updated);
    } else {
      const newEntry: Schedule = {
        id: `sch-${Date.now()}`,
        classId,
        roomId: rooms[0]?.id || '',
        subject: field === 'subject' ? value : '',
        startTime: start,
        endTime: end,
        dayOfWeek: day
      };
      if (field === 'roomId') newEntry.roomId = value;
      setLocalSchedules(prev => [...prev, newEntry]);
      onSave(newEntry);
    }
  };

  const handleDownloadTemplate = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Turma,Dia(1-6),HorarioInicio,HorarioFim,Materia,Sala\n"
      + "Turma A,1,07:30,08:20,Matematica,Sala 101";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "template_grade_horaria.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      const rows = text.split('\n').slice(1);
      
      for (const row of rows) {
        if (!row.trim()) continue;
        const [_, day, start, end, subject, roomName] = row.split(',');
        const room = rooms.find(r => r.name === roomName) || rooms[0];
        
        const newEntry: Schedule = {
          id: `sch-${Date.now()}-${Math.random()}`,
          classId,
          roomId: room?.id || '',
          subject: subject?.trim() || 'Aula',
          startTime: start?.trim() || '07:30',
          endTime: end?.trim() || '08:20',
          dayOfWeek: parseInt(day) || 1
        };
        await onSave(newEntry);
      }
      alert('Grade importada com sucesso!');
    };
    reader.readAsText(file);
  };

  return (
    <div className="schedule-grid-container animate-fade-in">
      <div className="section-header">
        <h3 className="section-title">
          <FileSpreadsheet className="icon-blue" size={20} /> Grade Horária Inteligente V3.6
        </h3>
        <div className="grid-actions">
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="btn-outline-action"
            title="Importar CSV"
          >
            <FileSpreadsheet size={16} /> Importar
          </button>
          <button 
            onClick={handleDownloadTemplate}
            className="btn-outline-action"
            title="Baixar Template"
          >
            <Download size={16} /> Template
          </button>
          <button 
            onClick={fetchOptimizations}
            className="btn-outline-action btn-alert-action"
            title="Otimização Oraculum (AI)"
          >
            <Zap size={16} /> IA
          </button>
        </div>
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          accept=".csv" 
          onChange={handleFileUpload} 
          title="Upload de Grade"
          aria-label="Upload de Grade"
        />
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <div className="optimization-banner animate-slide-up">
          <AlertCircle className="icon-purple-shrink" size={20} />
          <div className="banner-content-flex">
            <p className="banner-title">Otimização Oraculum Sugere Mudanças:</p>
            <ul className="banner-list">
              {suggestions.map((s, i) => (
                <li key={i}>
                  Mover <span className="text-white-bold">{s.originalTime}</span> → <span className="text-white-bold">{s.suggestedTime}</span>: {s.reason}
                </li>
              ))}
            </ul>
          </div>
          <button onClick={() => setShowSuggestions(false)} className="btn-close-minimal">✕</button>
        </div>
      )}

      <div className="table-wrapper">
        <table className="premium-grid-table">
          <thead>
            <tr>
              <th>Horário</th>
              {DAYS.map((day) => (
                <th key={day}>{day}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {TIME_SLOTS.map((timeSlot) => (
              <tr key={timeSlot}>
                <td className="time-slot-cell">{timeSlot}</td>
                {[1, 2, 3, 4, 5, 6].map((dayIdx) => {
                  const data = getCellData(dayIdx, timeSlot);
                  const isSuggested = suggestions.some(s => s.originalTime === timeSlot.split(' - ')[0]);

                  return (
                    <td 
                      key={`${dayIdx}-${timeSlot}`} 
                      className={isSuggested ? 'cell-suggested' : ''}
                    >
                      <div className="cell-content">
                        <input 
                          type="text"
                          className="subject-input"
                          placeholder="Matéria..."
                          value={data?.subject || ''}
                          title="Nome da Matéria"
                          aria-label="Nome da Matéria"
                          onChange={(e) => handleCellChange(dayIdx, timeSlot, 'subject', e.target.value)}
                        />
                        <select 
                          className="room-select-mini"
                          value={data?.roomId || ''}
                          title="Selecionar Sala"
                          aria-label="Selecionar Sala"
                          onChange={(e) => handleCellChange(dayIdx, timeSlot, 'roomId', e.target.value)}
                        >
                          <option value="">Sala...</option>
                          {rooms.map(r => (
                            <option key={r.id} value={r.id}>{r.name}</option>
                          ))}
                        </select>
                      </div>
                      {data && (
                        <button 
                          onClick={() => onDelete(data.id)}
                          title="Remover Aula"
                          className="btn-delete-cell"
                          aria-label="Remover Aula"
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="footer-tip">
        <RefreshCw size={14} className="animate-spin" /> 
        <span>Sincronia Áquila Ativa. Todas as alterações são persistidas no banco Eagles em tempo real.</span>
      </div>
    </div>
  );
};
