import React, { useState } from 'react';
import { Users, Link as LinkIcon, Search, Check, AlertTriangle, Presentation, BookOpen } from 'lucide-react';

export const TeacherClassLinkManager: React.FC = () => {
  const [selectedClass, setSelectedClass] = useState<any>(null);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [links, setLinks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generatingAI, setGeneratingAI] = useState(false);

  React.useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const win = window as any;
      const [rawTeachers, rawClasses, rawSubjects, rawLinks] = await Promise.all([
        win.aquila.invoke('secretariat:get-teachers'),
        win.aquila.invoke('get-classes'),
        win.aquila.invoke('secretariat:get-subjects'),
        win.aquila.invoke('secretariat:get-teacher-classes')
      ]);
      setTeachers(rawTeachers || []);
      setClasses(rawClasses || []);
      setSubjects(rawSubjects || []);
      setLinks(rawLinks || []);
      if (rawClasses?.length > 0) setSelectedClass(rawClasses[0]);
    } catch (err) {
      console.error('Failed to fetch data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLink = async (subjectId: string, teacherId: string) => {
    if (!selectedClass) return;
    try {
      const win = window as any;
      await win.aquila.invoke('secretariat:link-teacher', {
        teacherId,
        classId: selectedClass.id,
        subjectId
      });
      // Refresh links
      const updatedLinks = await win.aquila.invoke('secretariat:get-teacher-classes');
      setLinks(updatedLinks || []);
    } catch (err) {
      console.error('Failed to link teacher:', err);
    }
  };

  const getTeacherForSubject = (subjectId: string) => {
    return links.find(l => l.classId === selectedClass?.id && l.subjectId === subjectId)?.teacherId || '';
  };

  const currentLinks = links.filter(l => l.classId === selectedClass?.id);

  const getTeacherName = (tId: string) => teachers.find(t => t.id === tId)?.name || 'Não alocado';

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div className="flex items-center justify-between">
         <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Presentation className="text-blue-500" /> Grade Acadêmica & Vínculos
            </h2>
            <p className="text-xs text-slate-400 mt-1">Aloque os docentes às turmas ativas do período letivo.</p>
         </div>
         <button 
            onClick={async () => {
              setGeneratingAI(true);
              const win = window as any;
              try {
                const res = await win.aquila.invoke('secretaria:generate-schedule');
                if (res.success) alert(res.message);
                else alert('Erro: ' + res.message);
                fetchData();
              } catch (e) {
                alert('Falha na IA');
              } finally {
                setGeneratingAI(false);
              }
            }}
            disabled={generatingAI}
            className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 ${generatingAI ? 'bg-slate-500 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600 text-white shadow-glow transition-all'}`}
         >
           {generatingAI ? 'Processando IA...' : 'Gerar Grade com IA'}
         </button>
      </div>

      <div className="flex gap-6">
         {/* Class Selector Sidebar */}
          <div className="w-1/4 flex flex-col gap-2">
              <h3 className="font-bold text-xs uppercase tracking-widest text-slate-500 mb-2">Turmas Ativas</h3>
              {loading ? (
                <div className="p-4 bg-white/5 rounded-2xl border border-white/5 animate-pulse h-24" />
              ) : classes.map(cls => {
                 const isSelected = selectedClass?.id === cls.id;
                 const allocatedCount = links.filter(l => l.classId === cls.id).length;
                 const progress = subjects.length > 0 ? (allocatedCount / subjects.length) * 100 : 0;
                 
                 return (
                   <button 
                      key={cls.id}
                      onClick={() => setSelectedClass(cls)}
                      className={`text-left p-4 rounded-2xl border transition-all relative overflow-hidden ${isSelected ? 'bg-blue-500/10 border-blue-500/30' : 'bg-white/5 border-white/5 hover:bg-white/10'}`}
                   >
                      <div className={`absolute bottom-0 left-0 h-1 bg-blue-500 transition-all`} style={{ width: `${progress}%` }} />
                      <div className="font-bold text-sm text-white mb-1">{cls.name}</div>
                      <div className="text-[10px] uppercase font-bold text-slate-400">{allocatedCount} de {subjects.length} Disciplinas</div>
                   </button>
                 );
              })}
          </div>

         {/* Link configuration panel */}
          <div className="w-3/4 bg-white/5 border border-white/5 rounded-2xl p-6 flex flex-col">
              <div className="flex items-center justify-between mb-6">
                 <div>
                    <h3 className="text-lg font-black text-white">{selectedClass?.name || 'Selecione uma turma'} <span className="text-sm font-medium text-slate-500">| Composição de Corpo Docente</span></h3>
                 </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {loading ? (
                    <div className="col-span-full py-12 text-center text-slate-400">Carregando grade curricular...</div>
                  ) : subjects.map(subject => {
                     const currentTeacherId = getTeacherForSubject(subject.id);
                     const isAllocated = !!currentTeacherId;

                     return (
                         <div key={subject.id} className={`p-4 rounded-xl border flex flex-col gap-3 ${isAllocated ? 'bg-black/20 border-white/10' : 'bg-amber-500/5 border-amber-500/20'}`}>
                             <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                   <BookOpen size={14} className={isAllocated ? 'text-slate-400' : 'text-amber-500'} />
                                   <span className="font-bold text-sm text-white">{subject.name}</span>
                                </div>
                                {!isAllocated && <AlertTriangle size={14} className="text-amber-500" title="Disciplina sem professor" />}
                             </div>
                             
                             <select 
                                className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-xs text-white outline-none cursor-pointer"
                                value={currentTeacherId || ''}
                                onChange={(e) => handleLink(subject.id, e.target.value)}
                             >
                                 <option value="" className="text-slate-500">-- Selecione um Professor --</option>
                                 {teachers.map(t => (
                                     <option key={t.id} value={t.id} className="bg-slate-900">{t.name} ({t.role})</option>
                                 ))}
                             </select>
                         </div>
                     );
                  })}
              </div>
          </div>
      </div>
    </div>
  );
};
