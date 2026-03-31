import React, { useState, useEffect } from 'react';
import { 
  Users, UserPlus, Trash2, Edit2, Search, 
  Camera, Phone, X, Upload, CheckCircle, AlertCircle, Wand2 
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

export const Students: React.FC<{ onNavigate?: (page: any) => void, onSearchParams?: (params: any) => void }> = ({ onNavigate, onSearchParams }) => {
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
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

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
      const result = await ipc.invoke('get-classes');
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

  const filteredStudents = students.filter(
    s =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.parentPhone.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="students-page">
      <header className="page-header">
        <div className="header-info">
          <h1>Gestão de Alunos</h1>
          <p>Eagles Database Infrastructure</p>
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
                {editingId ? 'Atualizar Aluno' : 'Confirmar Cadastro'}
              </button>
            </div>
          </form>
        </section>
      )}

      <section className="search-container">
        <Search size={20} className="search-icon" />
        <input
          type="text"
          placeholder="Buscar por nome ou contato..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input-raw"
          aria-label="Buscar Alunos"
        />
      </section>

      <div className="table-viewport animate-fade-in">
        <table className="students-table-premium">
          <thead>
            <tr>
              <th>Identificação</th>
              <th>WhatsApp Pais</th>
              <th>Turma</th>
              <th>Data Registro</th>
              <th className="text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {loading && students.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-12 text-dim animate-pulse">Sincronizando base de dados centralizada...</td></tr>
            ) : filteredStudents.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-12 text-dim uppercase text-[10px] font-bold">Nenhum registro encontrado</td></tr>
            ) : (
              filteredStudents.map((student) => (
                <tr key={student.studentId}>
                  <td>
                    <div className="student-identity-cell">
                      <img src={student.photo || 'https://via.placeholder.com/150'} alt={`Foto de ${student.name}`} className="table-photo-mini" />
                      <div>
                        <span className="name-main">{student.name}</span>
                        <span className="id-sub">ID: {student.studentId.slice(0, 8)}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="contact-cell">
                       <Phone size={14} className="text-blue-400" />
                       {student.parentPhone}
                    </div>
                  </td>
                  <td>
                    <span className="class-badge-table">{student.classId}</span>
                  </td>
                  <td>{new Date(student.createdAt).toLocaleDateString('pt-BR')}</td>
                  <td>
                    <div className="table-actions-row">
                      <button 
                        className="btn-table-action action-biometric" 
                        onClick={() => {
                          if (onNavigate && onSearchParams) {
                            onSearchParams({ studentId: student.studentId });
                            onNavigate('biometric-enrollment');
                          }
                        }} 
                        title="Recadastrar Biometria 3D"
                        aria-label={`Recadastrar biometria 3D para ${student.name}`}
                      >
                        <Camera size={16} />
                      </button>
                      <button 
                        className="btn-table-action action-ai" 
                        onClick={() => handleGenerateAI(student)} 
                        title="Gerar Resumo I.A"
                        aria-label={`Gerar resumo pedagógico por IA para ${student.name}`}
                      >
                        <Wand2 size={16} />
                      </button>
                      <button 
                        className="btn-table-action action-edit" 
                        onClick={() => handleEdit(student)} 
                        title="Editar Registro"
                        aria-label={`Editar dados de ${student.name}`}
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        className="btn-table-action action-delete" 
                        onClick={() => handleDelete(student.studentId)} 
                        title="Remover Aluno"
                        aria-label={`Remover registro de ${student.name} permanentemente`}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <footer className="page-footer-stats">
        <span>Total de Registros: {students.length}</span>
        <span>Áquila AI Database Encryption Active</span>
      </footer>

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
