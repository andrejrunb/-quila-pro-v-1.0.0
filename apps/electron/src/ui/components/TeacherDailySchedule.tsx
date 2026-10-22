import React, { useState, useEffect, useRef } from 'react';
import { Mic, Square, Clock, CheckCircle, AlertCircle, Calendar } from 'lucide-react';
import '../styles/TeacherDailySchedule.css';

interface ScheduleEntry {
  id: string;
  subject: string;
  startTime: string;
  endTime: string;
  classId: string;
  className?: string;
  roomId: string;
}

export const TeacherDailySchedule: React.FC = () => {
  const [schedule, setSchedule] = useState<ScheduleEntry[]>([]);
  const [currentClass, setCurrentClass] = useState<any>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [status, setStatus] = useState<'idle' | 'recording' | 'processing' | 'success'>('idle');
  const [auditResults, setAuditResults] = useState<any>(null);
  const [isAuditing, setIsAuditing] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadData();
    // Auto-refresh current class every minute
    const interval = setInterval(loadData, 60000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      // Mock teacher ID for now, in a real scenario we'd get this from auth context
      const teacherId = 'teacher-01'; 
      const dayOfWeek = new Date().getDay(); // 0=Sun, 1=Mon, ..., 6=Sat

      const dailySchedule = await window.aquila.invoke('schedule:get-teacher-daily', { teacherId, dayOfWeek });
      const activeClass = await window.aquila.invoke('pedagogical:get-current-class', teacherId);

      setSchedule(dailySchedule || []);
      setCurrentClass(activeClass);
    } catch (err) {
      console.error('Failed to load teacher schedule', err);
    }
  };

  const performAudit = async (classId: string, roomId: string) => {
    setIsAuditing(true);
    try {
      const result = await window.aquila.invoke('attendance:audit-class', { classId, roomId });
      setAuditResults(result);
    } catch (err) {
      console.error('Audit failed', err);
    } finally {
      setIsAuditing(false);
    }
  };

  const confirmAudit = async () => {
    if (!auditResults) return;
    try {
      await window.aquila.invoke('attendance:confirm-audit', { 
        classId: currentClass?.classId,
        auditData: auditResults
      });
      alert('Chamada confirmada e enviada para o Córtex!');
      setAuditResults(null);
    } catch (err) {
      console.error('Confirmation failed', err);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        // In a real app, we'd save this blob to a file or send it as base64
        // For this demo, we'll simulate the path
        const mockPath = `recordings/report_${Date.now()}.webm`;
        
        setStatus('processing');
        
        const result = await window.aquila.invoke('pedagogical:process-audio-report', {
          teacherId: 'teacher-01',
          classId: currentClass?.classId || 'unknown',
          roomId: currentClass?.roomId || 'unknown',
          audioPath: mockPath
        });

        if (result?.success) {
          setStatus('success');
          setTimeout(() => setStatus('idle'), 3000);
        } else {
          setStatus('idle');
          alert('Erro ao processar áudio. Verifique a conexão com o Córtex.');
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      setStatus('recording');
      
      setRecordingTime(0);
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      
    } catch (err) {
      console.error('Mic access denied', err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="teacher-schedule-container">
      {/* SEÇÃO DA GRADE HORÁRIA */}
      <div className="schedule-timeline">
        <div className="cockpit-header" style={{ marginBottom: '2rem', padding: 0 }}>
           <h2 className="hive-title"><Calendar size={20} style={{ marginRight: '10px' }} /> Grade Diária</h2>
           <span className="hive-badge">AO VIVO</span>
        </div>

        <div className="timeline-line"></div>
        
        {schedule.length > 0 ? (
          schedule.map((entry) => (
            <div 
              key={entry.id} 
              className={`timeline-entry ${currentClass?.classId === entry.classId ? 'active' : ''}`}
            >
              <span className="slot-time">{entry.startTime} - {entry.endTime}</span>
              <h3 className="slot-subject">{entry.subject}</h3>
              <p className="slot-class">Turma: {entry.className || entry.classId} | Sala: {entry.roomId}</p>
              
              {currentClass?.classId === entry.classId && (
                <div className="attendance-audit-section">
                  <div className="flex justify-between items-center">
                    <span className="pulse-text" style={{ fontSize: '0.7rem', color: 'var(--honey-amber)', marginBottom: '10px', display: 'block' }}>
                      AULA ATUAL EM ANDAMENTO
                    </span>
                    
                    {!auditResults ? (
                      <button 
                        className="audit-trigger-btn"
                        onClick={() => performAudit(entry.classId, entry.roomId)}
                        disabled={isAuditing}
                      >
                        <CheckCircle size={16} /> 
                        {isAuditing ? 'Auditando...' : 'Iniciar Chamada Científica'}
                      </button>
                    ) : (
                      <button className="btn-confirm-audit" onClick={confirmAudit}>
                        Confirmar e Enviar Relatório
                      </button>
                    )}
                  </div>

                  {auditResults && (
                    <div className="audit-results-area">
                      <div className="audit-results-mini">
                        <span className="audit-stat-pill present">Presentes: {auditResults.summary.presentCount}</span>
                        <span className="audit-stat-pill absent">Ausentes: {auditResults.summary.absentCount}</span>
                        <span className="audit-stat-pill misplaced">Fora de Sala: {auditResults.summary.misplacedCount}</span>
                      </div>

                      {auditResults.summary.misplacedCount > 0 && (
                        <div className="discrepancy-list">
                          <p style={{ fontSize: '0.75rem', color: '#fbbf24', margin: '10px 0 5px 0' }}>Alertas de Localização:</p>
                          {auditResults.discrepancies.map((d: any, idx: number) => (
                            <div key={idx} className="discrepancy-item">
                              <div className="discrepancy-info">
                                <h4>{d.studentName}</h4>
                                <p>Detectado em: {d.lastSeenRoom || 'Local desconhecido'}</p>
                              </div>
                              <AlertCircle size={14} color="#fbbf24" />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="timeline-entry">
            <p className="hive-subtitle">Nenhuma aula agendada para hoje.</p>
          </div>
        )}
      </div>

      {/* PAINEL DO RELATÓRIO DE ÁUDIO */}
      <div className="audio-recorder-panel">
        <h3 className="hive-title">Relatório Áquila</h3>
        <p className="recorder-status">
          {status === 'idle' && 'PRONTO PARA GRAVAR'}
          {status === 'recording' && 'GRAVANDO RELATO...'}
          {status === 'processing' && 'CÓRTEX PROCESSANDO...'}
          {status === 'success' && 'ENVIADO COM SUCESSO!'}
        </p>

        {status === 'success' ? (
          <div className="success-animation">
            <CheckCircle size={60} color="var(--honey-amber)" className="animate-bounce" />
            <p className="pill-text" style={{ marginTop: '1rem' }}>Sincronizado com Pais e Alunos.</p>
          </div>
        ) : (
          <>
            <div 
              className={`record-btn-large ${status === 'recording' ? 'recording' : ''}`}
              onClick={status === 'recording' ? stopRecording : startRecording}
              disabled={status === 'processing'}
            >
              {status === 'recording' ? <Square className="mic-icon" /> : <Mic className="mic-icon" />}
            </div>

            {status === 'recording' && (
              <div className="recording-timer">
                {formatTime(recordingTime)}
              </div>
            )}

            <div className="recorder-instructions">
              {status === 'idle' && (
                "Toque no microfone ao final da aula para relatar o progresso, comportamento e conteúdos trabalhados. A IA transcreverá e notificará os responsáveis."
              )}
              {status === 'recording' && (
                "Relate: 'Hoje trabalhamos frações. O aluno João foi muito bem, mas a Maria precisa de reforço em divisão.'"
              )}
              {status === 'processing' && (
                <div className="flex items-center gap-2 justify-center">
                  <Clock className="animate-spin" size={16} /> Otimizando narrativa pedagógica...
                </div>
              )}
            </div>
          </>
        )}

        <div className="impact-indicator" style={{ marginTop: '2rem', width: '100%' }}>
           <div style={{ textAlign: 'left' }}>
              <span className="impact-label">Eficiência Pedagógica</span>
              <div className="impact-value positive">+12%</div>
              <span className="impact-meta">vs semana anterior</span>
           </div>
        </div>
      </div>
    </div>
  );
};
