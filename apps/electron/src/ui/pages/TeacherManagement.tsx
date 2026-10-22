import React, { useState, useEffect } from 'react';
import { 
  Users, UserPlus, Trash2, Edit2, Search, 
  Mail, X, Upload, CheckCircle, AlertCircle, Wand2, ArrowLeft, Shield, Check, BookOpen
} from 'lucide-react';
import { useIPC } from '../hooks/useIPC';
import './TeacherManagement.css';

interface Teacher {
  id: string;
  username: string;
  name: string;
  email: string | null;
  role: string;
  status: string;
}

interface TeacherForm {
  name: string;
  email: string;
  username?: string;
  password?: string;
  role: string;
  status: string;
}

export const TeacherManagement: React.FC<{ 
  onBack?: () => void 
}> = ({ onBack }) => {
  const ipc = useIPC();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [teacherClasses, setTeacherClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<TeacherForm>({
    name: '',
    email: '',
    username: '',
    password: '',
    role: 'docente',
    status: 'active',
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [generatingCard, setGeneratingCard] = useState<string | null>(null);

  useEffect(() => {
    loadTeachers();
    loadTeacherClasses();
  }, []);

  const loadTeachers = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await ipc.invoke('secretariat:get-teachers');
      if (Array.isArray(result)) {
        setTeachers(result);
      } else {
        setTeachers([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar professores');
    } finally {
      setLoading(false);
    }
  };

  const loadTeacherClasses = async () => {
    try {
      const result = await ipc.invoke('secretariat:get-teacher-classes');
      if (Array.isArray(result)) {
        setTeacherClasses(result);
      }
    } catch { /* silent */ }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);

      if (editingId) {
        const payload = {
          name: form.name,
          email: form.email,
          role: form.role,
          status: form.status,
          ...(form.password ? { password: form.password } : {})
        };
        const result = await ipc.invoke('secretariat:update-teacher', { id: editingId, updates: payload });
        if (result && !result.success && result.error) throw new Error(result.error);
      } else {
        const payload = {
          name: form.name,
          email: form.email,
          role: form.role,
          status: form.status,
          username: form.username || undefined,
          password: form.password || undefined
        };
        const result = await ipc.invoke('secretariat:create-teacher', payload);
        if (result && !result.success && result.error) throw new Error(result.error);
        if (result && result.success) {
          alert(`Professor cadastrado!\nUsuário: ${result.login}\nSenha: ${result.password}`);
        }
      }

      await loadTeachers();
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar professor');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (teacher: Teacher) => {
    setForm({
      name: teacher.name,
      email: teacher.email || '',
      role: teacher.role,
      status: teacher.status || 'active',
      username: teacher.username,
      password: '', // do not display hash
    });
    setEditingId(teacher.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Deseja realmente remover este professor? O usuário e cadastro de funcionário serão removidos.')) return;
    try {
      setLoading(true);
      const result = await ipc.invoke('secretariat:delete-teacher', id);
      if (result && result.success) {
        setTeachers(prev => prev.filter(t => t.id !== id));
      } else {
        setError(result?.error || 'Erro ao deletar professor');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao deletar professor');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateCard = async (teacher: Teacher) => {
    try {
      setGeneratingCard(teacher.id);
      const result = await ipc.invoke('secretariat:generate-teacher-card', teacher);
      if (result && result.success && result.filePath) {
        alert(`Crachá gerado com sucesso em:\n${result.filePath}`);
      } else {
        alert('Erro ao gerar crachá: ' + (result?.error || 'Erro desconhecido'));
      }
    } catch (err: any) {
      alert('Erro ao gerar crachá: ' + err.message);
    } finally {
      setGeneratingCard(null);
    }
  };

  const resetForm = () => {
    setForm({ name: '', email: '', username: '', password: '', role: 'docente', status: 'active' });
    setEditingId(null);
    setShowForm(false);
  };

  const getTeacherSubjectsString = (teacherId: string) => {
    const links = teacherClasses.filter(tc => tc.teacherId === teacherId);
    if (links.length === 0) return 'Nenhuma disciplina alocada';
    return links.map(l => `${l.subjectName} (${l.className})`).join(', ');
  };

  const filteredTeachers = teachers.filter(
    t =>
      t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.email && t.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      t.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="teacher-management-page">
      <header className="page-header">
        <div className="flex items-center gap-4">
          {onBack && (
            <button onClick={onBack} className="p-2 hover:bg-white/10 rounded-full transition-all mr-2">
              <ArrowLeft size={24} className="text-white" />
            </button>
          )}
          <div className="header-info">
            <h1>Gestão de Professores</h1>
            <p>Cadastro, Credenciais e Composição Docente</p>
          </div>
        </div>

        <button 
          className={`btn-header-add ${showForm ? 'btn-header-cancel' : ''}`} 
          onClick={() => showForm ? resetForm() : setShowForm(true)}
          title={showForm ? "Cancelar" : "Adicionar Novo Professor"}
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
          <form onSubmit={handleSubmit} className="teacher-form">
            <div className="form-group">
              <label>Nome Completo</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Ex: Prof. Carlos de Souza"
                required
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label>E-mail</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="Ex: carlos@escola.com"
                required
                className="form-input"
              />
            </div>

            {!editingId && (
              <div className="form-group">
                <label>Nome de Usuário (opcional)</label>
                <input
                  type="text"
                  value={form.username || ''}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                  placeholder="Ex: carlos.souza (deixe em branco para autogerar)"
                  className="form-input"
                />
              </div>
            )}

            <div className="form-group">
              <label>{editingId ? 'Nova Senha (deixe em branco para manter)' : 'Senha (deixe em branco para usar o usuário)'}</label>
              <input
                type="password"
                value={form.password || ''}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="Ex: Senha123"
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label>Papel (Role)</label>
              <select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                required
                className="form-select"
                title="Papel"
              >
                <option value="docente">Professor (Docente)</option>
                <option value="teacher">Professor (Teacher)</option>
                <option value="coordinator">Coordenador</option>
              </select>
            </div>

            <div className="form-group">
              <label>Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                required
                className="form-select"
                title="Status"
              >
                <option value="active">Ativo</option>
                <option value="inactive">Inativo</option>
              </select>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn-submit-main" disabled={loading}>
                <CheckCircle size={20} />
                {editingId ? 'Salvar Alterações' : 'Concluir Cadastro'}
              </button>
            </div>
          </form>
        </section>
      )}

      <section className="search-container">
        <Search size={20} className="search-icon" />
        <input
          type="text"
          placeholder="Buscar por nome, usuário ou e-mail..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input-raw"
          aria-label="Buscar Professores"
        />
      </section>

      <div className="table-viewport animate-fade-in">
        <table className="teachers-table-premium">
          <thead>
            <tr>
              <th>Identificação / Nome</th>
              <th>Nome de Usuário / E-mail</th>
              <th>Carga Horária / Disciplinas</th>
              <th>Papel / Status</th>
              <th className="text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {loading && teachers.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-12 text-dim animate-pulse">Carregando corpo docente...</td></tr>
            ) : filteredTeachers.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-12 text-dim uppercase text-[10px] font-bold">Nenhum registro encontrado</td></tr>
            ) : (
              filteredTeachers.map((teacher) => (
                <tr key={teacher.id}>
                  <td>
                    <div className="teacher-identity-cell">
                      <div className="avatar-circle">
                        {teacher.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <span className="name-main">{teacher.name}</span>
                        <span className="id-sub">RM: {teacher.id.slice(0, 10).toUpperCase()}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="contact-cell">
                      <span className="name-main text-xs text-slate-300">@{teacher.username}</span>
                      {teacher.email && (
                        <span className="flex items-center gap-1 text-[11px] text-slate-400">
                          <Mail size={12} /> {teacher.email}
                        </span>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className="subjects-cell">
                      <BookOpen size={14} className="text-emerald-400" />
                      <span className="text-xs text-slate-300">{getTeacherSubjectsString(teacher.id)}</span>
                    </div>
                  </td>
                  <td>
                    <div className="flex flex-col gap-1 items-start">
                      <span className="role-badge">{teacher.role === 'docente' ? 'Prof.' : teacher.role}</span>
                      <span className={`status-badge ${teacher.status || 'active'}`}>
                        {teacher.status === 'active' ? 'Ativo' : 'Inativo'}
                      </span>
                    </div>
                  </td>
                  <td>
                    <div className="table-actions-row">
                      <button 
                        className="btn-table-action action-ai" 
                        onClick={() => handleGenerateCard(teacher)} 
                        title="Gerar Crachá (PDF)"
                        disabled={generatingCard === teacher.id}
                      >
                        {generatingCard === teacher.id ? (
                          <div className="spinner-mini" />
                        ) : (
                          <Wand2 size={16} />
                        )}
                      </button>
                      <button 
                        className="btn-table-action action-edit" 
                        onClick={() => handleEdit(teacher)} 
                        title="Editar Registro"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        className="btn-table-action action-delete" 
                        onClick={() => handleDelete(teacher.id)} 
                        title="Remover Registro"
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
        <span>Total de Professores: {teachers.length}</span>
        <span>Acesso Soberano & Criptografado</span>
      </footer>
    </div>
  );
};

export default TeacherManagement;
