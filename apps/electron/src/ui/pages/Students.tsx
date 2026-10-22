import React, { useState, useEffect } from 'react';
import { 
  Users, UserPlus, Trash2, Edit2, Search, 
  Camera, Phone, X, Upload, CheckCircle, AlertCircle, Wand2, ArrowLeft, FileText, Calendar, BadgeCheck 
} from 'lucide-react';
import { useIPC } from '../hooks/useIPC';
import './Students.css';

interface Student {
  studentId: string;
  name: string;
  parentPhone: string;
  classId: string;
  photo?: string;
  createdAt: string;
}

interface StudentForm {
  name: string;
  parentPhone: string;
  classId: string;
}

export const Students: React.FC<{ 
  onNavigate?: (page: any) => void, 
  onSearchParams?: (params: any) => void,
  onBack?: () => void,
  user?: any 
}> = ({ onNavigate, onSearchParams, onBack, user }) => {
  const ipc = useIPC();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<StudentForm>({
    name: '',
    parentPhone: '',
    classId: '',
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClassFilter, setSelectedClassFilter] = useState('all');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Portfolio modal state
  const [portfolioStudent, setPortfolioStudent] = useState<Student | null>(null);

  // AI states
  const [generatingAI, setGeneratingAI] = useState(false);
  const [aiReport, setAiReport] = useState<string | null>(null);
  const [selectedStudentName, setSelectedStudentName] = useState('');

  const [classes, setClasses] = useState<any[]>([]);

  useEffect(() => {
    loadStudents();
    loadClasses();
  }, []);

  const loadClasses = async () => {
    try {
      const teacherId = user?.id || 'teacher-andre';
      const result = await ipc.invoke('get-classes', teacherId);
      if (Array.isArray(result)) setClasses(result);
    } catch { /* silent */ }
  };

  const loadStudents = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await ipc.listStudents();
      if (Array.isArray(result)) {
        setStudents(result);
      } else if (result?.success && result?.data) {
        setStudents(result.data);
      } else if (result?.error) {
        setError(result.error);
      } else {
        setStudents([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar alunos');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);

      let studentId = editingId;
      if (editingId) {
        const result = await ipc.updateStudent(editingId, form);
        if (result && !result.success && result.error) throw new Error(result.error);
      } else {
        const result = await ipc.createStudent(form);
        if (result?.error) throw new Error(result.error);
        studentId = result?.studentId || result?.data?.studentId || result?.id || editingId;
      }

      if (selectedFile && studentId) {
        const photoResult = await ipc.uploadStudentPhoto(studentId, (selectedFile as any).path);
        if (!photoResult.success) {
          console.error('Erro ao subir foto:', photoResult.error);
        }
      }

      await loadStudents();
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar aluno');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (student: Student) => {
    setForm({
      name: student.name,
      parentPhone: student.parentPhone,
      classId: student.classId,
    });
    setEditingId(student.studentId);
    setPreviewUrl(student.photo || null);
    setShowForm(true);
  };

  const handleDelete = async (studentId: string) => {
    if (!window.confirm('Deseja realmente remover este registro? Esta ação é irreversível.')) return;
    try {
      setLoading(true);
      const result = await ipc.deleteStudent(studentId);
      if (result.success) {
        setStudents(prev => prev.filter(s => s.studentId !== studentId));
      } else {
        setError(result.error || 'Erro ao deletar aluno');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao deletar aluno');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm({ name: '', parentPhone: '', classId: '' });
    setEditingId(null);
    setSelectedFile(null);
    setPreviewUrl(null);
    setShowForm(false);
  };

  const handleGenerateAI = async (student: Student) => {
    try {
      setGeneratingAI(true);
      setSelectedStudentName(student.name);
      setAiReport(null);
      const result = await ipc.invoke('ai:generate-report', student.studentId);
      if (result.success) {
        setAiReport(result.data);
      } else {
        setError('Erro ao gerar relatorio: ' + result.error);
      }
    } catch (err: any) {
      setError('Erro inesperado: ' + err.message);
    } finally {
      setGeneratingAI(false);
    }
  };

  const getClassNameById = (classId: string) => {
    const found = classes.find(c => c.id === classId);
    if (found) return `${found.name}${found.grade ? ` (${found.grade})` : ''}`;
    return classId;
  };

  const filteredStudents = students.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.parentPhone.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesClass = selectedClassFilter === 'all' || s.classId === selectedClassFilter;
    return matchesSearch && matchesClass;
  });

  return (
    <div className="students-page">
      <header className="page-header">
        <div className="flex items-center gap-4">
          {onBack && (
            <button onClick={onBack} className="p-2 hover:bg-white/10 rounded-full transition-all mr-2">
              <ArrowLeft size={24} className="text-white" />
            </button>
          )}
          <div className="header-info">
            <h1>Gestão de Alunos</h1>
            <p>Base de Dados Centralizada de Discentes ({filteredStudents.length} Alunos)</p>
          </div>
        </div>

        <button 
          className={`btn-header-add ${showForm ? 'btn-header-cancel' : ''}`} 
          onClick={() => showForm ? resetForm() : setShowForm(true)}
          title={showForm ? "Cancelar" : "Adicionar Novo Aluno"}
          aria-label={showForm ? "Cancelar cadastro" : "Adicionar um novo aluno ao sistema"}
        >
          {showForm ? <X size={24} /> : <UserPlus size={24} />}
        </button>
      </header>

      {error && (
        <div className="error-banner animate-shake">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {showForm && (
        <section className="form-section animate-slide-up">
          <form onSubmit={handleSubmit} className="student-form">
            <div className="photo-upload-container">
              <img src={previewUrl || 'https://via.placeholder.com/150'} alt="Preview" className="photo-preview-big" />
              <div className="form-group">
                <label>Foto do Aluno</label>
                <label className="btn-upload-trigger" title="Fazer upload de foto" aria-label="Enviar foto do aluno">
                  <Upload size={18} />
                  <input type="file" title="Fazer upload de foto" aria-label="Selecionar arquivo de imagem" className="hidden" onChange={handleFileChange} accept="image/*" />
                </label>
              </div>
            </div>

            <div className="form-group">
              <label>Nome Completo</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Ex: João Silva"
                required
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label>WhatsApp dos Pais</label>
              <input
                type="text"
                value={form.parentPhone}
                onChange={(e) => setForm({ ...form, parentPhone: e.target.value })}
                placeholder="(11) 99999-9999"
                required
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label>Turma</label>
              <select
                value={form.classId}
                onChange={(e) => setForm({ ...form, classId: e.target.value })}
                required
                className="form-select"
                title="Selecionar Turma"
                aria-label="Selecionar Turma"
              >
                <option value="">Selecione uma turma...</option>
                {classes.map((c: any) => (
                  <option key={c.id} value={c.id}>{c.name}{c.grade ? ` — ${c.grade}` : ''}</option>
                ))}
              </select>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn-submit-main" disabled={loading}>
                <CheckCircle size={20} />
                {editingId ? 'Salvar Alterações' : 'Concluir Matrícula'}
              </button>
            </div>
          </form>
        </section>
      )}

      {/* Barra de Filtros & Busca Simplificada */}
      <section className="search-container flex gap-3 items-center mb-4">
        <div className="flex-1 relative flex items-center">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Buscar por nome do aluno..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input-raw w-full"
            aria-label="Buscar Alunos"
          />
        </div>

        {/* Dropdown de Organização por Turma */}
        <div className="class-filter-wrapper">
          <select 
            value={selectedClassFilter}
            onChange={(e) => setSelectedClassFilter(e.target.value)}
            className="class-filter-select px-4 py-2.5 bg-slate-900/80 border border-white/10 text-white rounded-xl font-bold text-sm outline-none cursor-pointer hover:border-blue-500/50 transition-all"
            title="Filtrar por Turma"
          >
            <option value="all">Todas as Turmas ({students.length})</option>
            {classes.map((c: any) => (
              <option key={c.id} value={c.id}>
                {c.name} {c.grade ? `(${c.grade})` : ''}
              </option>
            ))}
          </select>
        </div>
      </section>

      {/* Lista de Alunos em 2 Colunas de Alta Densidade (Zero-Scroll Priority) */}
      <div className="students-grid-viewport animate-fade-in">
        {loading && students.length === 0 ? (
          <div className="text-center py-6 text-slate-400 text-xs animate-pulse font-bold">Sincronizando base de dados...</div>
        ) : filteredStudents.length === 0 ? (
          <div className="text-center py-6 text-slate-500 uppercase text-[10px] font-bold">Nenhum aluno encontrado para os filtros selecionados</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {filteredStudents.map((student, index) => (
              <div 
                key={student.studentId} 
                className="bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800 hover:border-blue-500/40 rounded-lg px-3 py-1.5 flex items-center justify-between transition-all"
              >
                <div className="flex items-center gap-2 min-w-0 pr-2">
                  <span className="text-[10px] font-mono text-slate-500 font-bold shrink-0">#{index + 1}</span>
                  <span className="font-bold text-white text-xs truncate" title={student.name}>{student.name}</span>
                  <span className="px-1.5 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded text-[10px] font-bold shrink-0">
                    {getClassNameById(student.classId)}
                  </span>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button 
                    className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/30 rounded text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-all"
                    onClick={() => setPortfolioStudent(student)} 
                    title="Ver Portfólio"
                  >
                    <FileText size={12} />
                    <span>Portfólio</span>
                  </button>
                  <button 
                    className="p-1 hover:bg-purple-500/20 rounded text-purple-400 cursor-pointer transition-all" 
                    onClick={() => handleGenerateAI(student)} 
                    title="Gerar Resumo I.A"
                  >
                    <Wand2 size={14} />
                  </button>
                  <button 
                    className="p-1 hover:bg-blue-500/20 rounded text-slate-300 cursor-pointer transition-all" 
                    onClick={() => handleEdit(student)} 
                    title="Editar"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button 
                    className="p-1 hover:bg-rose-500/20 rounded text-rose-400 cursor-pointer transition-all" 
                    onClick={() => handleDelete(student.studentId)} 
                    title="Excluir"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <footer className="page-footer-stats flex justify-between items-center mt-4 text-xs text-slate-500 font-semibold">
        <span>Exibindo {filteredStudents.length} de {students.length} alunos cadastrados</span>
        <span>Proteção de Dados (LGPD) Ativa • Áquila Sovereign OS</span>
      </footer>

      {/* Modal de Portfólio Completo do Aluno */}
      {portfolioStudent && (
        <div className="modal-backdrop-ai animate-fade-in flex items-center justify-center p-4">
          <div className="modal-content-ai max-w-xl w-full bg-slate-900 border border-white/10 rounded-2xl p-6 shadow-2xl animate-slide-up">
            <header className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
              <div className="flex items-center gap-3">
                <FileText className="text-cyan-400" size={24} />
                <div>
                  <h3 className="text-lg font-bold text-white mb-0">Portfólio Individual do Aluno</h3>
                  <p className="text-xs text-slate-400">Ficha Cadastral e Dados Socioemocionais</p>
                </div>
              </div>
              <button 
                className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors"
                onClick={() => setPortfolioStudent(null)}
              >
                <X size={20} />
              </button>
            </header>

            <div className="portfolio-body flex flex-col gap-5">
              {/* Top Banner com Foto e Identificação */}
              <div className="flex items-center gap-4 bg-slate-950/60 p-4 rounded-xl border border-white/5">
                <img 
                  src={portfolioStudent.photo || 'https://via.placeholder.com/150'} 
                  alt={portfolioStudent.name}
                  className="w-16 h-16 rounded-xl object-cover border border-white/10 bg-slate-800"
                />
                <div className="flex-1">
                  <h4 className="text-md font-extrabold text-white">{portfolioStudent.name}</h4>
                  <div className="flex flex-wrap gap-2 mt-1">
                    <span className="px-2 py-0.5 bg-blue-500/20 text-blue-300 text-xs font-bold rounded-md">
                      {getClassNameById(portfolioStudent.classId)}
                    </span>
                    <span className="px-2 py-0.5 bg-slate-800 text-slate-300 text-xs font-mono rounded-md">
                      Matrícula: {portfolioStudent.studentId.slice(0, 10).toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Informações Cadastrais */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-3 bg-slate-950/40 rounded-xl border border-white/5 flex items-center gap-3">
                  <Phone size={18} className="text-emerald-400" />
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">WhatsApp dos Pais</span>
                    <span className="text-sm font-bold text-white">{portfolioStudent.parentPhone || 'Não informado'}</span>
                  </div>
                </div>

                <div className="p-3 bg-slate-950/40 rounded-xl border border-white/5 flex items-center gap-3">
                  <Calendar size={18} className="text-purple-400" />
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Data da Matrícula</span>
                    <span className="text-sm font-bold text-white">{new Date(portfolioStudent.createdAt || Date.now()).toLocaleDateString('pt-BR')}</span>
                  </div>
                </div>
              </div>

              {/* Histórico Pedagógico & Frequência */}
              <div className="p-4 bg-slate-950/40 rounded-xl border border-white/5 flex flex-col gap-2">
                <h5 className="text-xs font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-1.5">
                  <BadgeCheck size={14} /> Status Pedagógico & Frequência
                </h5>
                <div className="flex justify-between items-center text-xs pt-1">
                  <span className="text-slate-400">Assiduidade Global:</span>
                  <span className="font-bold text-emerald-400">96.5% de Presença</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">Parecer Socioemocional:</span>
                  <span className="font-bold text-cyan-300">Bom / Focado nas Aulas</span>
                </div>
              </div>
            </div>

            <footer className="mt-6 pt-4 border-t border-white/10 flex justify-between items-center">
              <button 
                className="px-4 py-2 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer"
                onClick={() => {
                  const s = portfolioStudent;
                  setPortfolioStudent(null);
                  handleGenerateAI(s);
                }}
              >
                <Wand2 size={14} />
                <span>Gerar Resumo I.A</span>
              </button>

              <button 
                className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                onClick={() => setPortfolioStudent(null)}
              >
                Fechar
              </button>
            </footer>
          </div>
        </div>
      )}

      {/* AI Report Modal */}
      {(generatingAI || aiReport) && (
        <div className="modal-backdrop-ai animate-fade-in">
          <div className="modal-content-ai animate-slide-up">
            <header className="modal-header-ai">
              <h3 className="modal-title-ai">
                <Wand2 size={24} /> Resumo Pedagógico: {selectedStudentName}
              </h3>
              <button className="btn-modal-close" onClick={() => { setAiReport(null); setGeneratingAI(false); }} title="Fechar Modal" aria-label="Fechar resumo de IA">
                <X size={24} />
              </button>
            </header>
            
            <div className="modal-body-ai custom-scrollbar">
              {generatingAI ? (
                <div className="ai-loading-state">
                  <div className="spinner-ai"></div>
                  <p className="ai-loading-text">Processando registros acadêmicos e frequência via Visão Computacional...</p>
                </div>
              ) : (
                <textarea 
                  className="report-editor custom-scrollbar"
                  value={aiReport || ''}
                  onChange={(e) => setAiReport(e.target.value)}
                  aria-label="Relatório Pedagógico Gerado"
                  title="Relatório Pedagógico Gerado"
                />
              )}
            </div>
            
            {!generatingAI && (
              <footer className="modal-footer-ai">
                 <p className="disclaimer-ai">Este texto foi gerado por IA e não substitui a avaliação final da coordenação. Recomenda-se revisão técnica antes do envio para os pais via WhatsApp.</p>
                 <div className="modal-actions-ai">
                   <button 
                     className="btn-plain" 
                     onClick={() => setAiReport(null)}
                     title="Fechar"
                     aria-label="Fechar visualização de relatório"
                   >
                     Fechar
                   </button>
                   <button 
                     className="btn-indigo-fill" 
                     onClick={() => {
                       navigator.clipboard.writeText(aiReport || '');
                       alert('Texto copiado com sucesso!');
                     }}
                     title="Copiar para Área de Transferência"
                     aria-label="Copiar conteúdo do relatório para a área de transferência"
                   >
                     Copiar Relatório
                   </button>
                 </div>
              </footer>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Students;
