import React, { useState, useEffect } from 'react';
import useIPC from '../hooks/useIPC';
import './StudentsManagement.css';

interface Student {
  id: string;
  name: string;
  email: string;
  class: string;
  status: 'active' | 'inactive';
  photoCount: number;
  lastSeen?: number;
}

interface StudentFormData {
  name: string;
  email: string;
  class: string;
}

interface StudentsManagementProps {
  onBack: () => void;
}

export const StudentsManagement: React.FC<StudentsManagementProps> = ({ onBack }) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [formData, setFormData] = useState<StudentFormData>({
    name: '',
    email: '',
    class: '',
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [filterClass, setFilterClass] = useState('');
  const { invoke } = useIPC();

  // Carregar alunos ao montar
  useEffect(() => {
    loadStudents();
  }, []);

  /**
   * Carregar lista de alunos
   */
  const loadStudents = async () => {
    try {
      setIsLoading(true);
      const result = await invoke('students:list');

      if (result.success && result.data) {
        setStudents(result.data);
      }
    } catch (error) {
      console.error('Erro ao carregar alunos:', error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Adicionar novo aluno
   */
  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const result = await invoke('students:add', formData);

      if (result.success) {
        setFormData({ name: '', email: '', class: '' });
        setShowForm(false);
        await loadStudents();
      } else {
        alert('Erro ao adicionar aluno: ' + (result.error || 'Erro desconhecido'));
      }
    } catch (error) {
      console.error('Erro ao adicionar aluno:', error);
    }
  };

  /**
   * Treinar aluno com fotos
   */
  const handleTrainStudent = async (studentId: string) => {
    try {
      // Simular seleção de fotos (em produção, usar file picker)
      const photoUrls = [
        'photo1.jpg',
        'photo2.jpg',
        'photo3.jpg',
      ];

      const result = await invoke('students:train', studentId, photoUrls);

      if (result.success) {
        console.log('Aluno treinado com sucesso');
        await loadStudents();
      }
    } catch (error) {
      console.error('Erro ao treinar aluno:', error);
    }
  };

  /**
   * Filtrar alunos
   */
  const filteredStudents = students.filter(student => {
    const matchesSearch =
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesClass = !filterClass || student.class === filterClass;
    return matchesSearch && matchesClass;
  });

  /**
   * Obter classes únicas
   */
  const classes = Array.from(new Set(students.map(s => s.class)));

  return (
    <div className="students-management">
      {/* Header */}
      <div className="management-header">
        <button onClick={onBack} className="btn btn-secondary back-btn">
          ← Voltar
        </button>
        <h1>👥 Gerenciamento de Alunos</h1>
        <button
          onClick={() => setShowForm(true)}
          className="btn btn-primary"
        >
          ➕ Adicionar Aluno
        </button>
      </div>

      {/* Filtros */}
      <div className="management-filters">
        <input
          type="text"
          placeholder="Buscar por nome ou email..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="search-input"
        />
        <select
          title="Filtrar Turma"
          aria-label="Filtrar Turma"
          value={filterClass}
          onChange={e => setFilterClass(e.target.value)}
          className="filter-select"
        >
          <option value="">Todas as turmas</option>
          {classes.map(cls => (
            <option key={cls} value={cls}>
              {cls}
            </option>
          ))}
        </select>
      </div>

      {/* Formulário de Adição */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2>Adicionar Novo Aluno</h2>
            <form onSubmit={handleAddStudent}>
              <div className="form-group">
                <label>Nome</label>
                <input
                  type="text"
                  title="Nome do Aluno"
                  aria-label="Nome do Aluno"
                  value={formData.name}
                  onChange={e =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  title="Email do Aluno"
                  aria-label="Email do Aluno"
                  value={formData.email}
                  onChange={e =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  required
                />
              </div>
              <div className="form-group">
                <label>Turma</label>
                <input
                  type="text"
                  title="Turma"
                  aria-label="Turma"
                  value={formData.class}
                  onChange={e =>
                    setFormData({ ...formData, class: e.target.value })
                  }
                  required
                />
              </div>
              <div className="form-actions">
                <button type="submit" className="btn-premium">
                  Adicionar
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="btn-secondary"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lista de Alunos */}
      {isLoading ? (
        <div className="loading">Carregando alunos...</div>
      ) : filteredStudents.length === 0 ? (
        <div className="empty-state">
          <p>Nenhum aluno encontrado</p>
        </div>
      ) : (
        <div className="students-grid">
          {filteredStudents.map(student => (
            <div key={student.id} className="student-card">
              <div className="card-header">
                <h3>{student.name}</h3>
                <span className={`status status-${student.status}`}>
                  {student.status === 'active' ? '🟢 Ativo' : '🔴 Inativo'}
                </span>
              </div>

              <div className="card-body">
                <div className="info-item">
                  <span className="label">Email:</span>
                  <span className="value">{student.email}</span>
                </div>
                <div className="info-item">
                  <span className="label">Turma:</span>
                  <span className="value">{student.class}</span>
                </div>
                <div className="info-item">
                  <span className="label">Fotos:</span>
                  <span className="value">{student.photoCount}</span>
                </div>
                {student.lastSeen && (
                  <div className="info-item">
                    <span className="label">Última Detecção:</span>
                    <span className="value">
                      {new Date(student.lastSeen).toLocaleString()}
                    </span>
                  </div>
                )}
              </div>

              <div className="card-actions">
                <button
                  onClick={() => handleTrainStudent(student.id)}
                  className="btn btn-small btn-primary"
                  title="Treinar com fotos"
                >
                  📸 Treinar
                </button>
                <button
                  onClick={() => setSelectedStudent(student)}
                  className="btn btn-small btn-secondary"
                  title="Ver detalhes"
                >
                  👁️ Detalhes
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detalhes do Aluno */}
      {selectedStudent && (
        <div className="modal-overlay" onClick={() => setSelectedStudent(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2>{selectedStudent.name}</h2>
            <div className="details">
              <div className="detail-row">
                <span className="label">ID:</span>
                <span className="value">{selectedStudent.id}</span>
              </div>
              <div className="detail-row">
                <span className="label">Email:</span>
                <span className="value">{selectedStudent.email}</span>
              </div>
              <div className="detail-row">
                <span className="label">Turma:</span>
                <span className="value">{selectedStudent.class}</span>
              </div>
              <div className="detail-row">
                <span className="label">Status:</span>
                <span className="value">{selectedStudent.status}</span>
              </div>
              <div className="detail-row">
                <span className="label">Fotos Cadastradas:</span>
                <span className="value">{selectedStudent.photoCount}</span>
              </div>
            </div>
            <div className="form-actions">
              <button
                onClick={() => handleTrainStudent(selectedStudent.id)}
                className="btn btn-primary"
              >
                📸 Treinar com Fotos
              </button>
              <button
                onClick={() => setSelectedStudent(null)}
                className="btn btn-secondary"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentsManagement;
