import React, { useState, useEffect } from 'react';
import { ScheduleGrid } from '../components/ScheduleGrid';
import { DoorOpen, ArrowLeft, Mic, Clock, Send } from 'lucide-react';
import './ClassroomManagement.css';

interface TeacherScheduleProps {
  user: any;
  onBack: () => void;
}

export const TeacherSchedule: React.FC<TeacherScheduleProps> = ({ user, onBack }) => {
  const [schedules, setSchedules] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [currentClass, setCurrentClass] = useState<any>(null);
  const [isProcessingReport, setIsProcessingReport] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const aquila = (window as any).aquila;

  useEffect(() => {
    const loadData = async () => {
      try {
        const [r, c, s, users] = await Promise.all([
          aquila.invoke('get-rooms'),
          aquila.invoke('get-classes'),
          aquila.invoke('get-schedules'),
          aquila.invoke('get-users')
        ]);
        setRooms(r || []);
        setClasses(c || []);
        
        const allTeachers = (users || []).filter((u: any) => u.role === 'teacher' || u.role === 'professor');
        setTeachers(allTeachers);

        // Pre-filter: Mostrar apenas aulas do professor (ou todas se for coord/admin mas listadas as deles)
        const mySchedules = (s || []).filter((sch: any) => sch.teacherId === user?.id);
        setSchedules(mySchedules);
        // 3. Buscar Aula Atual
        const cur = await aquila.invoke('pedagogical:get-current-class', user?.id);
        setCurrentClass(cur);
      } catch (err) {
        console.error('Erro ao carregar grade do professor:', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [user, aquila]);

  const handleProcessAudio = async () => {
    if (!currentClass) return;
    
    try {
      const fileRes = await aquila.invoke('dialog:openFile');
      if (fileRes && !fileRes.canceled && fileRes.filePaths && fileRes.filePaths.length > 0) {
        const audioPath = fileRes.filePaths[0];
        setIsProcessingReport(true);
        const result = await aquila.invoke('pedagogical:process-audio-report', {
            teacherId: user.id,
            classId: currentClass.classId,
            roomId: currentClass.roomId,
            audioPath: audioPath
        });
        
        if (result && result.success) {
          alert(`Relatório processado com sucesso!\nResumo: ${result.summary}`);
        } else {
          alert('Falha ao processar áudio: ' + (result?.error || 'Erro interno da IA local.'));
        }
      }
    } catch (err: any) {
      console.error(err);
      alert('Erro ao processar áudio pedagógico: ' + err.message);
    } finally {
      setIsProcessingReport(false);
    }
  };

  if (isLoading) {
    return (
      <div className="classroom-page">
         <div className="max-container text-center py-20 animate-pulse">
           <p className="filter-label">Buscando Grade Horária...</p>
         </div>
      </div>
    );
  }

  // Se não tem selectedClassId, vamos simular exibindo TODAS as aulas como um grid,
  // mas o ScheduleGrid filtra por classId. Como o professor dá aula em várias turmas, 
  // o ScheduleGrid precisa ser modificado pra não filtrar, ou enviamos classId="all" e retiramos o filtro lá?
  // O ideal seria que o professor selecionasse a Turma, ou ele veria TUDO junto.
  // Vou permitir selecionar a Turma.

  return (
    <div className="classroom-page animate-fade-in">
      <div className="max-container">
        <header className="page-header">
          <div className="header-title-group">
            <button onClick={onBack} className="btn-nav-back" aria-label="Voltar para a dashboard">
              <ArrowLeft size={18} /> <span>Voltar</span>
            </button>
            <h1>
              <DoorOpen className="text-blue-500" size={32} /> Minha Grade Horária
            </h1>
            <p>Visualização unificada de todas as suas aulas.</p>
          </div>
        </header>

        {currentClass && (
          <div className="current-class-widget glass-card p-6 mb-8 border-l-4 border-blue-500 animate-slide-up">
            <div className="flex items-center justify-between">
              <div>
                <span className="badge badge-blue mb-2">AULA EM ANDAMENTO</span>
                <h2 className="text-2xl font-bold">{currentClass.className}</h2>
                <div className="flex gap-4 mt-2 text-sm text-gray-400">
                  <span className="flex items-center gap-1"><Clock size={14} /> {currentClass.startTime} - {currentClass.endTime}</span>
                  <span className="flex items-center gap-1"><DoorOpen size={14} /> {currentClass.subject}</span>
                </div>
              </div>
              <button 
                onClick={handleProcessAudio}
                disabled={isProcessingReport}
                className={`btn-action ${isProcessingReport ? 'loading' : ''} flex items-center gap-2`}
              >
                {isProcessingReport ? (
                  <span className="animate-spin">🌀</span>
                ) : (
                  <Mic size={20} />
                )}
                <span>{isProcessingReport ? 'Processando...' : 'Gravar Relatório de Aula'}</span>
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <div className="management-card h-full">
              <h3 className="section-title mb-4">
                <Clock className="icon-blue" size={20} /> Agenda de Hoje
              </h3>
              <div className="daily-agenda-list space-y-4">
                {schedules
                  .filter(s => s.dayOfWeek === (new Date().getDay() || 7))
                  .sort((a, b) => a.startTime.localeCompare(b.startTime))
                  .map((item, idx) => (
                    <div key={idx} className={`agenda-item p-4 rounded-lg border border-white/5 ${item.id === currentClass?.id ? 'bg-blue-500/20 border-blue-500/50' : 'bg-white/5'}`}>
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="text-sm font-bold">{item.startTime} - {item.endTime}</div>
                          <div className="text-lg font-semibold mt-1">{item.subject}</div>
                          <div className="text-xs text-gray-400 mt-1">Sala: {rooms.find(r => r.id === item.roomId)?.name || 'N/A'}</div>
                        </div>
                        {item.id === currentClass?.id && (
                          <span className="pulse-dot"></span>
                        )}
                      </div>
                    </div>
                  ))}
                {schedules.filter(s => s.dayOfWeek === (new Date().getDay() || 7)).length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    Nenhuma aula agendada para hoje.
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="management-card h-full">
              <ScheduleGrid 
                classId={""} 
                rooms={rooms}
                schedules={schedules}
                teachers={teachers}
                readOnly={true}
                onSave={async () => {}}
                onDelete={async () => {}}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
