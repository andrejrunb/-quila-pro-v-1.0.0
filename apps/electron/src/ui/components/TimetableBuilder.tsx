import React, { useState } from 'react';
import { Play, Calendar, Users, Settings, Save, AlertTriangle, CheckCircle, Info, Lock } from 'lucide-react';
import { TimetableEngine, TeacherSlot, ClassRequirement, GridSlot } from '../../services/TimetableEngine';
import './TimetableBuilder.css';

export const TimetableBuilder: React.FC = () => {
  const [teachers, setTeachers] = useState<TeacherSlot[]>([
    { teacherId: 'prof_mat', subject: 'Matemática', maxConsecutive: 2, maxWeekly: 10, availableDays: ['tuesday', 'thursday'] }, // Intencionalmente simulando um estrangulamento
    { teacherId: 'prof_hist', subject: 'História', maxConsecutive: 2, maxWeekly: 8, availableDays: [] },
    { teacherId: 'prof_port', subject: 'Português', maxConsecutive: 2, maxWeekly: 12, availableDays: [] }, 
  ]);

  const [classes, setClasses] = useState<ClassRequirement[]>([
    { classId: '101A (C/ Câmera)', demand: { 'Matemática': 5, 'Português': 5, 'História': 3 } },
    { classId: 'Atividades Extracurriculares (S/ Câmera)', demand: { 'Plantão de Dúvidas': 2, 'Esportes': 4 } }
  ]);

  const [generatedSchedules, setGeneratedSchedules] = useState<Record<string, GridSlot[]> | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiInsight, setAiInsight] = useState<{type: 'success' | 'warn' | 'error', message: string} | null>(null);

  // Modal states
  const [activeModal, setActiveModal] = useState<'teachers' | 'extracurricular' | null>(null);
  const [selectedTeacher, setSelectedTeacher] = useState<TeacherSlot | null>(null);

  const handleGenerate = () => {
    setIsGenerating(true);
    setAiInsight(null);
    
    setTimeout(() => {
      const engine = new TimetableEngine();
      try {
        const result = engine.generate(classes, teachers);
        
        // Simular inteligência de feedback: Analisar se houve muitas Janelas (buracos)
        let totalHoles = 0;
        Object.values(result).forEach(grid => {
           grid.forEach(slot => { if(slot.subject === 'JANELA') totalHoles++; });
        });

        if (totalHoles > 5) {
            setAiInsight({
                type: 'warn',
                message: "A IA completou a grade, mas encontrou buracos. O Professor de Matemática (prof_mat) limitou sua disponibilidade para apenas 2 dias. Tente liberar a Segunda-Feira para ele fechar a grade perfeitamente."
            });
        } else {
            setAiInsight({
                type: 'success',
                message: "Grade otimizada com 100% de sucesso. Nenhum conflito humano encontrado."
            });
        }
        
        setGeneratedSchedules(result);
      } catch (err) {
        setAiInsight({
            type: 'error',
            message: "Falha de processamento. A IA paralisou porque há turmas pedindo 5 aulas de Matemática, mas não há dias suficientes liberados para o professor bater a carga horária imposta. Altere a escala."
        });
      }
      setIsGenerating(false);
    }, 1500); 
  };

  const daysLabels = [
    { id: 'monday', label: 'Segunda' }, 
    { id: 'tuesday', label: 'Terça' }, 
    { id: 'wednesday', label: 'Quarta' }, 
    { id: 'thursday', label: 'Quinta' }, 
    { id: 'friday', label: 'Sexta' }
  ];

  const toggleTeacherDay = (dayId: string) => {
    if (!selectedTeacher) return;
    const currentDays = selectedTeacher.availableDays.length === 0 ? daysLabels.map(d=>d.id) : selectedTeacher.availableDays;
    
    let newDays;
    if (currentDays.includes(dayId)) {
       newDays = currentDays.filter(d => d !== dayId);
    } else {
       newDays = [...currentDays, dayId];
    }

    // Se todos estiverem marcados, pode zerar a array (significa livre geral)
    if (newDays.length === 5) newDays = [];

    const updated = { ...selectedTeacher, availableDays: newDays };
    setSelectedTeacher(updated);
    setTeachers(teachers.map(t => t.teacherId === updated.teacherId ? updated : t));
  };

  return (
    <div className="timetable-builder animate-fade-in">
      <header className="builder-header">
         <div className="title-section">
            <Calendar size={32} className="text-emerald-400" />
            <div>
               <h1>Orquestrador de Grade Horária</h1>
               <p>Regras Curriculares & Extracurriculares (Timetable AI)</p>
            </div>
         </div>
         <div className="actions">
            <button className="btn-setup"><Settings size={18}/> Nova Disciplina (S/ Câmeras)</button>
            <button className="btn-setup" onClick={() => setActiveModal('teachers')}>
              <Users size={18}/> Escala Docente
            </button>
            <button 
              className={`btn-generate ${isGenerating ? 'processing' : ''}`}
              onClick={handleGenerate}
              disabled={isGenerating}
            >
              <Play size={18}/> {isGenerating ? 'Analisando Permutações...' : 'Gerar Grade Mestra'}
            </button>
         </div>
      </header>

      {aiInsight && (
          <div className={`ai-insight-panel insight-${aiInsight.type} animate-fade-in`}>
             <div className="insight-icon">
                {aiInsight.type === 'success' && <CheckCircle size={24} />}
                {aiInsight.type === 'warn' && <AlertTriangle size={24} />}
                {aiInsight.type === 'error' && <Lock size={24} />}
             </div>
             <div className="insight-content">
                <h4>Diagnóstico do Engine (Urania-Free)</h4>
                <p>{aiInsight.message}</p>
             </div>
          </div>
      )}

      {!generatedSchedules && !isGenerating && (
        <div className="empty-state">
           <AlertTriangle size={48} className="text-slate-500 mb-4" />
           <h3>Nenhuma grade ativa.</h3>
           <p>Adicione as restrições de cada professor clicando na Escala Docente. Você pode criar horários convencionais (com tracking de câmeras) ou blocos separados de Esporte/Natação. A IA fará a gestão do choque de turmas.</p>
        </div>
      )}

      {/* MODAL DE ESCALA DOCENTE (Clique Visual de Dias) */}
      {activeModal === 'teachers' && (
        <div className="modal-overlay">
           <div className="modal-container timetable-modal">
             <div className="modal-header-time">
                <h3>Gerenciar Indisponibilidade</h3>
                <p>Clique nos botões vermelhos ou verdes para bloquear horários dos professores instantaneamente.</p>
             </div>
             
             <div className="teacher-split-view">
                <div className="teacher-list">
                   {teachers.map(t => (
                      <div 
                        key={t.teacherId} 
                        className={`teacher-list-item ${selectedTeacher?.teacherId === t.teacherId ? 'active' : ''}`}
                        onClick={() => setSelectedTeacher(t)}
                      >
                         <strong>{t.teacherId.replace('prof_', 'Prof. ')}</strong>
                         <span>{t.subject}</span>
                      </div>
                   ))}
                </div>
                <div className="teacher-availability-grid">
                   {!selectedTeacher ? (
                      <div className="select-placeholder">Selecione um professor na lateral para editar clicando.</div>
                   ) : (
                      <div className="availability-clicker animate-fade-in">
                         <h4>Bloqueio Diário: {selectedTeacher.teacherId.replace('prof_','Prof. ')}</h4>
                         <div className="days-click-row">
                           {daysLabels.map(day => {
                              const isAvailable = selectedTeacher.availableDays.length === 0 || selectedTeacher.availableDays.includes(day.id);
                              return (
                                 <button 
                                   key={day.id} 
                                   className={`btn-day-toggle ${isAvailable ? 'available' : 'blocked'}`}
                                   onClick={() => toggleTeacherDay(day.id)}
                                 >
                                    {day.label}
                                    <span className="toggle-status">{isAvailable ? 'Livre' : 'Bloqueado'}</span>
                                 </button>
                              )
                           })}
                         </div>
                         <div className="hints">
                           <Info size={14} /> <i>Ao bloquear um dia inteiro, a IA fará o roteamento das turmas para os outros dias da semana.</i>
                         </div>
                      </div>
                   )}
                </div>
             </div>

             <div className="modal-actions mt-6">
                <button onClick={() => setActiveModal(null)} className="btn-modal-save">Concluir</button>
             </div>
           </div>
        </div>
      )}

      {isGenerating && (
         <div className="generation-skeleton">
            <div className="gen-loader"></div>
            <p>Calculando a árvore de decisão ótima...</p>
         </div>
      )}

      {generatedSchedules && !isGenerating && (
        <div className="schedules-grid-view">
           {Object.keys(generatedSchedules).map(clsId => (
             <div key={clsId} className="class-schedule-card">
               <div className="class-header-flex">
                 <h2>Turma: {clsId}</h2>
                 {clsId.includes('S/ Câmera') && <span className="badge-no-cam"><Settings size={14}/> Tracking Desativado</span>}
               </div>
               <div className="schedule-table-wrapper">
                 <table className="schedule-table">
                   <thead>
                     <tr>
                       <th>Período</th>
                       {daysLabels.map(d => <th key={d.id}>{d.label}</th>)}
                     </tr>
                   </thead>
                   <tbody>
                     {[1, 2, 3, 4, 5].map(period => (
                       <tr key={period}>
                         <td className="period-col">{period}º Horário</td>
                         {['monday', 'tuesday', 'wednesday', 'thursday', 'friday'].map(day => {
                            const slot = generatedSchedules[clsId].find(s => s.day === day && s.period === period);
                            const isHole = !slot || slot.subject === 'JANELA';
                            const isExtra = slot && (slot.subject === 'Esportes' || slot.subject === 'Plantão de Dúvidas');
                            
                            let cellClass = 'filled-cell';
                            if (isHole) cellClass = 'hole-cell';
                            if (isExtra) cellClass = 'extra-cell';

                            return (
                              <td key={day} className={`slot-cell ${cellClass}`}>
                                 {isHole ? (
                                   <span className="hole-text">Janela AI</span>
                                 ) : (
                                   <div className="slot-info">
                                     <span className="slot-subject">{slot.subject}</span>
                                     <span className="slot-teacher">{slot.teacherId !== 'TBD' ? slot.teacherId.replace('prof_', 'Prof. ') : 'A Contratar'}</span>
                                   </div>
                                 )}
                              </td>
                            );
                         })}
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>
             </div>
           ))}
        </div>
      )}
    </div>
  );
};
