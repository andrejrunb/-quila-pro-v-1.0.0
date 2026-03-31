import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Smile, 
  Meh, 
  Frown, 
  Zap, 
  Save, 
  ChevronLeft,
  Users,
  Clock,
  MessageSquare
} from 'lucide-react';

interface Student {
  id: string;
  name: string;
  photoPath?: string;
}

interface DiaryEntry {
  studentId: string;
  mood: 'happy' | 'neutral' | 'tired' | 'energetic' | null;
  observation: string;
}

export const Diary: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [entries, setEntries] = useState<Record<string, DiaryEntry>>({});
  const [selectedClass, setSelectedClass] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStudents();
  }, [selectedClass]);

  const loadStudents = async () => {
    try {
      setLoading(true);
      const data = await (window as any).aquila.invoke('get-students', selectedClass);
      setStudents(data);
    } catch (err) {
      console.error('Erro ao carregar alunos:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateMood = (studentId: string, mood: DiaryEntry['mood']) => {
    setEntries(prev => ({
      ...prev,
      [studentId]: {
        ...(prev[studentId] || { studentId, observation: '' }),
        mood
      }
    }));
  };

  const updateObservation = (studentId: string, observation: string) => {
    setEntries(prev => ({
      ...prev,
      [studentId]: {
        ...(prev[studentId] || { studentId, mood: null }),
        observation
      }
    }));
  };

  const handleSave = async () => {
    try {
      // Simulação de salvamento - no futuro enviar para o backend
      console.log('Salvando diário:', entries);
      alert('Diário de classe salvo com sucesso!');
    } catch (err) {
      alert('Erro ao salvar diário.');
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-100 p-8 space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="p-2 hover:bg-slate-800 rounded-lg transition text-slate-400"
            title="Voltar ao Dashboard"
          >
            <ChevronLeft size={24} />
          </button>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent flex items-center gap-3">
              <BookOpen className="text-emerald-400" />
              Diário Pedagógico
            </h1>
            <p className="text-slate-400 text-sm mt-1">Registre o acompanhamento diário dos seus alunos</p>
          </div>
        </div>

        <button 
          onClick={handleSave}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-xl font-bold transition shadow-lg shadow-emerald-900/20"
        >
          <Save size={20} />
          Salvar Diário
        </button>
      </div>

      {/* Filters & Tools */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-900/50 p-4 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-3 p-3 bg-slate-950/50 rounded-xl border border-slate-800/50">
          <Users className="text-slate-500" size={20} />
          <select 
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="bg-transparent border-none text-slate-200 outline-none flex-1 font-medium"
            title="Selecionar Turma"
            aria-label="Selecionar Turma"
          >
            <option value="all" className="bg-slate-900 text-slate-200">Todas as Turmas</option>
            <option value="Maternal I" className="bg-slate-900 text-slate-200">Maternal I</option>
            <option value="Jardim II" className="bg-slate-900 text-slate-200">Jardim II</option>
          </select>
        </div>
        
        <div className="flex items-center gap-3 p-3 bg-slate-950/50 rounded-xl border border-slate-800/50">
          <Clock className="text-slate-500" size={20} />
          <span className="text-slate-400 font-medium">Data: {new Date().toLocaleDateString()}</span>
        </div>

        <div className="flex items-center justify-end px-3">
           <span className="text-slate-500 text-sm">{students.length} alunos listados</span>
        </div>
      </div>

      {/* Students List */}
      <div className="flex-1 overflow-y-auto pr-2 space-y-4">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-400"></div>
          </div>
        ) : students.length === 0 ? (
          <div className="text-center py-20 text-slate-500">
             Nenhum aluno encontrado para os filtros selecionados.
          </div>
        ) : (
          students.map(student => (
            <div key={student.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-slate-700 transition group">
              <div className="flex flex-col md:flex-row gap-8">
                {/* Profile Info */}
                <div className="flex items-center gap-4 min-w-[240px]">
                  <div className="w-16 h-16 rounded-2xl bg-slate-800 border-2 border-slate-700 overflow-hidden flex items-center justify-center">
                    {student.photoPath ? (
                      <img src={`file://${student.photoPath}`} className="w-full h-full object-cover" alt="" />
                    ) : (
                      <Users className="text-slate-600" size={32} />
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-slate-100 group-hover:text-emerald-400 transition">{student.name}</h3>
                    <p className="text-slate-500 text-sm">ID: {student.id}</p>
                  </div>
                </div>

                {/* Mood Selector */}
                <div className="flex flex-col gap-2">
                   <p className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                     <Smile size={14} /> Humor do Dia
                   </p>
                   <div className="flex gap-2">
                      <button 
                        onClick={() => updateMood(student.id, 'happy')}
                        className={`p-3 rounded-xl transition ${entries[student.id]?.mood === 'happy' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50' : 'bg-slate-800 hover:bg-slate-750 text-slate-400 border border-transparent'}`}
                        title="Feliz / Disposto"
                      >
                        <Smile size={24} />
                      </button>
                      <button 
                        onClick={() => updateMood(student.id, 'energetic')}
                        className={`p-3 rounded-xl transition ${entries[student.id]?.mood === 'energetic' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/50' : 'bg-slate-800 hover:bg-slate-750 text-slate-400 border border-transparent'}`}
                        title="Agitado / Com Energia"
                      >
                        <Zap size={24} />
                      </button>
                      <button 
                        onClick={() => updateMood(student.id, 'neutral')}
                        className={`p-3 rounded-xl transition ${entries[student.id]?.mood === 'neutral' ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/50' : 'bg-slate-800 hover:bg-slate-750 text-slate-400 border border-transparent'}`}
                        title="Calmo / Neutro"
                      >
                        <Meh size={24} />
                      </button>
                      <button 
                        onClick={() => updateMood(student.id, 'tired')}
                        className={`p-3 rounded-xl transition ${entries[student.id]?.mood === 'tired' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/50' : 'bg-slate-800 hover:bg-slate-750 text-slate-400 border border-transparent'}`}
                        title="Cansado / Triste"
                      >
                        <Frown size={24} />
                      </button>
                   </div>
                </div>

                {/* Observations */}
                <div className="flex-1 flex flex-col gap-2">
                   <p className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                     <MessageSquare size={14} /> Observações Pedagógicas
                   </p>
                   <textarea 
                    value={entries[student.id]?.observation || ''}
                    onChange={(e) => updateObservation(student.id, e.target.value)}
                    placeholder="Ex: Aluno interagiu bem com os colegas no parquinho..."
                    className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-3 text-sm text-slate-300 focus:border-emerald-500/50 outline-none h-20 resize-none transition"
                   />
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
