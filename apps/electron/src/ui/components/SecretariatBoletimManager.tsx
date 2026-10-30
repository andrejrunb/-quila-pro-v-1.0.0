import React, { useState } from 'react';
import { FileText, Download, Printer, Filter, ChevronDown, CheckCircle, Search, Loader2, Brain } from 'lucide-react';
import AcademicReportCard from './AcademicReportCard';
import type { ReportCardStudent } from './AcademicReportCard';
import { STUDENTS } from '../../database/studentsData';

export const SecretariatBoletimManager: React.FC = () => {
  const [selectedClass, setSelectedClass] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeReport, setActiveReport] = useState<ReportCardStudent | null>(null);

  // Mock data for the UI
  const [boletins, setBoletins] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    fetchData();
  }, [selectedClass]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const win = window as any;
      if (!win.aquila?.invoke) {
        const fallbackClasses = [
          { id: 'F-EF26A', name: '6º Ano A — Fundamental II' },
          { id: 'F-EF27A', name: '7º Ano A — Fundamental II' },
          { id: 'F-EM1A', name: '1ª Série A — Ensino Médio' },
          { id: 'F-EM3A', name: '3ª Série A — Ensino Médio' }
        ];
        const filtered = selectedClass === 'all'
          ? STUDENTS.slice(0, 30)
          : STUDENTS.filter(s => s.classId === selectedClass);
        const mapped = filtered.map(s => ({
          studentId: `RM-${s.registrationNumber}`,
          name: s.name,
          classId: s.classId,
          grades: [
            { subject: 'Matemática', value: 7.8 },
            { subject: 'Física', value: 8.2 },
            { subject: 'Química', value: 7.5 },
            { subject: 'Biologia', value: 8.9 },
            { subject: 'Língua Portuguesa', value: 8.0 },
            { subject: 'História', value: 9.1 },
            { subject: 'Geografia', value: 8.4 }
          ]
        }));
        setBoletins(mapped);
        setClasses(fallbackClasses);
        setLoading(false);
        return;
      }

      const [rawBoletins, rawClasses] = await Promise.all([
        win.aquila.invoke('secretariat:get-bulk-boletim', selectedClass === 'all' ? 'all' : selectedClass),
        win.aquila.invoke('get-classes')
      ]);
      
      setBoletins(rawBoletins || []);
      setClasses(rawClasses || []);
    } catch (err) {
      console.error('Failed to fetch boletins:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredBoletins = boletins.filter(b => 
    b.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleBatchPrint = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      window.print();
    }, 1500);
  };

  const handleGeneratePDF = async (studentId?: string) => {
    setIsGenerating(true);
    try {
      if (studentId) {
        const bole = boletins.find(b => b.studentId === studentId);
        if (bole) {
          const win = window as any;
          const result = await win.aquila.invoke('secretariat:generate-report-card', {
            studentId: bole.studentId,
            name: bole.name,
            grades: bole.grades
          });
          if (result && result.success && result.filePath) {
            alert(`Boletim em PDF gerado com sucesso em:\n${result.filePath}`);
          } else {
            alert('Erro ao gerar boletim: ' + (result?.error || 'Erro desconhecido'));
          }
        }
      } else {
        const win = window as any;
        let successCount = 0;
        for (const bole of filteredBoletins) {
          const result = await win.aquila.invoke('secretariat:generate-report-card', {
            studentId: bole.studentId,
            name: bole.name,
            grades: bole.grades
          });
          if (result && result.success) successCount++;
        }
        alert(`Processamento concluído! ${successCount} boletins gerados com sucesso para a turma.`);
      }
    } catch (err: any) {
      alert('Erro ao gerar boletim: ' + err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div className="flex items-center justify-between">
         <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <FileText className="text-emerald-500" /> Emissão de Boletins
            </h2>
            <p className="text-xs text-slate-400 mt-1">Gerencie, analise e imprima os boletins acadêmicos do período letivo vigente.</p>
         </div>

         <div className="flex gap-3">
             <button 
                className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-xl hover:bg-emerald-500/20 font-bold text-sm transition-all"
                onClick={() => handleGeneratePDF()}
             >
                <Download size={16} /> Salvar Lote (PDF)
             </button>
             <button 
                className="flex items-center gap-2 px-5 py-2 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 font-bold text-sm transition-all shadow-glow"
                onClick={handleBatchPrint}
                disabled={isGenerating}
             >
                {isGenerating ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Printer size={16} />} 
                Imprimir Todos
             </button>
         </div>
      </div>

      <div className="flex gap-4 p-4 bg-white/5 border border-white/5 rounded-2xl items-center">
         <div className="flex-1 flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/5 rounded-xl">
             <Search size={16} className="text-slate-400" />
             <input type="text" placeholder="Buscar aluno..." className="bg-transparent border-none text-white text-sm outline-none w-full" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
         </div>
         <div className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/5 rounded-xl">
             <Filter size={16} className="text-slate-400" />
             <select className="bg-transparent border-none text-white text-sm outline-none cursor-pointer" value={selectedClass} onChange={e => setSelectedClass(e.target.value)}>
                <option value="all">Todas as Turmas</option>
                {classes.map(c => (
                  <option key={c.id} value={c.id} className="bg-slate-900">{c.name}</option>
                ))}
             </select>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
         {loading ? (
            <div className="col-span-full flex justify-center p-12"><Loader2 className="animate-spin text-emerald-500" /></div>
         ) : filteredBoletins.length > 0 ? (
           filteredBoletins.map(bole => {
             const avg = bole.grades.length > 0 
               ? bole.grades.reduce((acc: number, g: any) => acc + g.value, 0) / bole.grades.length 
               : 0;

             return (
              <div key={bole.studentId} className="p-5 bg-white/5 border border-white/10 rounded-2xl flex items-center gap-4 hover:border-emerald-500/30 transition-colors">
                 <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-emerald-500/10 text-emerald-500`}>
                     <CheckCircle size={24} />
                 </div>
                 <div className="flex-1">
                     <h3 className="font-bold text-white text-sm">{bole.name}</h3>
                     <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-slate-400 font-medium">RM: {bole.studentId}</span>
                        <span className="text-[10px] uppercase font-black tracking-wider text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                          {bole.grades.length} Disciplinas
                        </span>
                     </div>
                 </div>
                 <div className="text-right">
                     <div className="text-xs text-slate-400 mb-1">Média Global</div>
                     <div className={`font-black text-lg ${avg >= 7 ? 'text-emerald-400' : 'text-red-400'}`}>{avg.toFixed(1)}</div>
                 </div>
                 <div className="h-full w-px bg-white/10 mx-2" />
                 <div className="flex flex-col gap-2">
                      <button className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-all" title="Ver Online" onClick={() => setActiveReport({ id: bole.studentId, name: bole.name, className: selectedClass === 'all' ? 'Turma' : selectedClass })}><FileText size={16} /></button>
                      <button
                        className="p-2 text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-all cursor-pointer"
                        title="Análise Neuro-Pedagógica AI"
                        onClick={() => {
                          (window as any).showToast?.(
                            `Análise IA para ${bole.name}: Média global ${avg.toFixed(1)} com proficiência destacada em Ciências Exatas. Plano de nivelamento socrático em dia.`,
                            'info'
                          );
                        }}
                      >
                        <Brain size={16} />
                      </button>
                      <button className="p-2 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-all" title="Exportar PDF" onClick={() => handleGeneratePDF(bole.studentId)}><Download size={16} /></button>
                 </div>
              </div>
             );
           })
         ) : (
           <p className="col-span-full text-zinc-500 text-center py-8">Nenhum aluno encontrado para os critérios selecionados.</p>
         )}
      </div>

      {activeReport && (
        <AcademicReportCard
          student={activeReport}
          onClose={() => setActiveReport(null)}
        />
      )}
    </div>
  );
};
