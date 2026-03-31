import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search, Upload, Download, Filter, ArrowLeft, Scan, FileText, ClipboardList } from 'lucide-react';
import { BiometricEnrollment } from './BiometricEnrollment';
import './StudentManagement.css';

interface Student {
  id: string;
  name: string;
  matricula: string;
  room: string;
  grade: string;
  photo?: string;
  status: 'active' | 'inactive';
  enrollmentDate: string;
}

export const StudentManagement: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [docVault, setDocVault] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(true);

  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRoom, setFilterRoom] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [formData, setFormData] = useState<Partial<Student>>({
    name: '',
    matricula: '',
    room: '',
    grade: '',
    status: 'active',
  });
  const [showBiometric, setShowBiometric] = useState<{ id: string, name: string } | null>(null);
  const [isGenerating, setIsGenerating] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const result = await (window as any).aquila.invoke('students:list');
      if (result.success) {
        setStudents(result.data);
        
        const vault: Record<string, any[]> = {};
        for (const s of result.data) {
          vault[s.id] = await (window as any).aquila.invoke('secretary:get-student-documents', s.id);
        }
        setDocVault(vault);
      }
    } catch (err) {
      console.error('Failed to load students:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleGenerateDocument = async (studentId: string, studentName: string, type: 'declaration' | 'history') => {
    setIsGenerating(`${studentId}-${type}`);
    try {
      const result = await (window as any).aquila.invoke('secretary:generate-transcript', { studentId, type });
      if (result.success) {
        alert(`${type === 'declaration' ? 'Declaração' : 'Histórico'} gerado em: ${result.path}`);
      }
    } catch (err) {
      alert('Erro ao gerar documento.');
    } finally {
      setIsGenerating(null);
    }
  };

  useEffect(() => {
    let filtered = students;

    if (searchTerm) {
      filtered = filtered.filter(
        s =>
          s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (s.matricula && s.matricula.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (filterRoom !== 'all') {
      filtered = filtered.filter(s => s.room === filterRoom);
    }

    setFilteredStudents(filtered);
  }, [searchTerm, filterRoom, students]);

  const handleAddStudent = () => {
    setEditingStudent(null);
    setFormData({
      name: '',
      matricula: '',
      room: '',
      grade: '',
      status: 'active',
    });
    setShowForm(true);
  };

  const handleEditStudent = (student: Student) => {
    setEditingStudent(student);
    setFormData(student);
    setShowForm(true);
  };

  const handleDeleteStudent = async (id: string) => {
    if (confirm('Tem certeza que deseja deletar este aluno?')) {
      // Logic for deletion in DB would go here
      setStudents(students.filter(s => s.id !== id));
    }
  };

  const handleSaveStudent = async () => {
    // Logic for save in DB would go here
    setShowForm(false);
    loadData();
  };

  const rooms = ['Sala 101', 'Sala 102', 'Sala 103', 'Sala 104', 'Sala 105'];
  const grades = ['1ª Série', '2ª Série', '3ª Série'];

  if (loading) return <div className="p-8 text-blue-400 animate-pulse font-black uppercase tracking-widest text-xs">Sincronizando Registros Acadêmicos...</div>;

  return (
    <div className="student-mgmt-container">
      {/* Header */}
      <div className="student-mgmt-header">
        <div className="flex items-center gap-4 mb-4">
           <button onClick={onBack} className="btn-icon-action" title="Voltar" aria-label="Voltar para a tela anterior">
             <ArrowLeft size={24} />
           </button>
           <h1 className="modal-title modal-title-no-margin">Secretaria: Gestão de Alunos</h1>
        </div>
        <p>Total: {students.length} alunos verificados no sistema</p>
      </div>

      {/* Controles */}
      <div className="controls-bar">
        {/* Busca */}
        <div className="search-input-wrapper">
          <Search className="search-icon" size={18} />
          <input
            type="text"
            title="Buscar Aluno"
            aria-label="Buscar aluno por nome ou matrícula"
            placeholder="Buscar por nome ou matrícula..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="form-input-premium search-input-premium"
          />
        </div>

        {/* Filtro de Sala */}
        <div>
          <select
            value={filterRoom}
            title="Filtrar por Sala"
            aria-label="Filtrar alunos por sala"
            onChange={e => setFilterRoom(e.target.value)}
            className="form-input-premium"
          >
            <option value="all">Todas as Salas</option>
            {rooms.map(room => (
              <option key={room} value={room}>
                {room}
              </option>
            ))}
          </select>
        </div>

        {/* Botões de Ação */}
        <button
          onClick={handleAddStudent}
          className="btn-premium-action btn-add-student"
          title="Novo Aluno"
          aria-label="Adicionar um novo aluno"
        >
          <Plus className="w-5 h-5" />
          Novo Aluno
        </button>

        <button 
          className="btn-premium-action btn-import" 
          title="Importar Alunos" 
          aria-label="Importar lista de alunos de arquivo externo"
        >
          <Upload className="w-5 h-5" />
          Importar
        </button>
      </div>

      {/* Tabela de Alunos */}
      <div className="table-panel">
        <div className="table-scroll-wrapper custom-scrollbar">
          <table className="premium-table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Matrícula</th>
                <th>Sala</th>
                <th>Status</th>
                <th>Documentos</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map(student => (
                <tr key={student.id}>
                  <td><span className="student-name-main">{student.name}</span></td>
                  <td><span className="student-sub">{student.matricula}</span></td>
                  <td><span className="student-sub">{student.room}</span></td>
                  <td>
                    <span className={`status-pill status-pill--${student.status}`}>
                      {student.status === 'active' ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td>
                    <div className="doc-vault-status flex gap-1">
                      {['RG', 'CPF', 'RESIDENCE'].map(type => {
                        const docs = docVault[student.id] || [];
                        const doc = docs.find((d: any) => d.docType === type);
                        return (
                          <div 
                            key={type}
                            className={`w-2 h-2 rounded-full ${doc?.status === 'verified' ? 'bg-emerald-500' : 'bg-slate-700'}`}
                            title={`${type}: ${doc?.status || 'Pendente'}`}
                          ></div>
                        );
                      })}
                    </div>
                  </td>
                  <td>
                    <div className="actions-cell">
                      <button
                        onClick={() => handleEditStudent(student)}
                        className="btn-icon-action btn-icon-edit"
                        title="Editar Aluno"
                        aria-label={`Editar dados de ${student.name}`}
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteStudent(student.id)}
                        className="btn-icon-action btn-icon-delete"
                        title="Deletar Aluno"
                        aria-label={`Deletar registro de ${student.name}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setShowBiometric({ id: student.id, name: student.name })}
                        className="btn-icon-action btn-icon-biometric"
                        title="Cadastrar Biometria"
                        aria-label={`Cadastrar biometria para ${student.name}`}
                      >
                        <Scan className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleGenerateDocument(student.id, student.name, 'declaration')}
                        className={`btn-icon-action btn-icon-doc ${isGenerating === `${student.id}-declaration` ? 'anim-pulse' : ''}`}
                        title="Emitir Declaração de Matrícula"
                        aria-label={`Emitir Declaração para ${student.name}`}
                        disabled={isGenerating !== null}
                      >
                        <FileText className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleGenerateDocument(student.id, student.name, 'history')}
                        className={`btn-icon-action btn-icon-history ${isGenerating === `${student.id}-history` ? 'anim-pulse' : ''}`}
                        title="Emitir Histórico Escolar"
                        aria-label={`Emitir Histórico para ${student.name}`}
                        disabled={isGenerating !== null}
                      >
                        <ClipboardList className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Formulário */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal-content-glass" onClick={e => e.stopPropagation()}>
            <h2 className="modal-title">
              {editingStudent ? 'Editar Aluno' : 'Novo Aluno'}
            </h2>

            <div className="modal-body">
              <div className="form-group-premium">
                <label className="form-label-premium">Nome</label>
                <input
                  type="text"
                  title="Nome"
                  aria-label="Nome do aluno"
                  value={formData.name || ''}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="form-input-premium"
                  placeholder="Nome do aluno"
                />
              </div>

              <div className="form-group-premium">
                <label className="form-label-premium">Matrícula</label>
                <input
                  type="text"
                  title="Matrícula"
                  aria-label="Matrícula do aluno"
                  value={formData.matricula || ''}
                  onChange={e => setFormData({ ...formData, matricula: e.target.value })}
                  className="form-input-premium"
                  placeholder="Ex: MAT001"
                />
              </div>

              <div className="form-group-premium">
                <label className="form-label-premium">Sala</label>
                <select
                  value={formData.room || ''}
                  title="Sala"
                  aria-label="Selecionar sala"
                  onChange={e => setFormData({ ...formData, room: e.target.value })}
                  className="form-input-premium"
                >
                  <option value="">Selecione uma sala</option>
                  {rooms.map(room => (
                    <option key={room} value={room}>
                      {room}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group-premium">
                <label className="form-label-premium">Série</label>
                <select
                  value={formData.grade || ''}
                  title="Série"
                  aria-label="Selecionar série"
                  onChange={e => setFormData({ ...formData, grade: e.target.value })}
                  className="form-input-premium"
                >
                  <option value="">Selecione uma série</option>
                  {grades.map(grade => (
                    <option key={grade} value={grade}>
                      {grade}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group-premium">
                <label className="form-label-premium">Status</label>
                <select
                  value={formData.status || 'active'}
                  title="Status"
                  aria-label="Selecionar status do aluno"
                  onChange={e => setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' })}
                  className="form-input-premium"
                >
                  <option value="active">Ativo</option>
                  <option value="inactive">Inativo</option>
                </select>
              </div>
            </div>

            <div className="modal-footer">
              <button
                onClick={() => setShowForm(false)}
                className="btn-premium-action btn-modal-cancel"
                title="Cancelar"
                aria-label="Cancelar e fechar formulário"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveStudent}
                className="btn-premium-action btn-modal-save"
                title="Salvar"
                aria-label="Salvar dados do aluno"
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Overlay Biométrico */}
      {showBiometric && showBiometric.id && (
        <div className="network-console-overlay">
          <BiometricEnrollment 
            studentId={showBiometric.id} 
            studentName={showBiometric.name}
            onBack={() => setShowBiometric(null)} 
          />
        </div>
      )}
    </div>
  );
};

export default StudentManagement;
