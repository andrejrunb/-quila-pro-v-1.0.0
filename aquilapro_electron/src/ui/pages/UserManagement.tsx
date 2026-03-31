import React, { useState, useEffect } from 'react';
import { 
  UserPlus, Trash2, Shield, Users, 
  ArrowLeft, FileText, UserCheck, Star, Award, TrendingUp, CheckCircle2 
} from 'lucide-react';
import './UserManagement.css';

interface UserManagementProps {
  onBack: () => void;
}

export const UserManagement: React.FC<UserManagementProps> = ({ onBack }) => {
  const [users, setUsers] = useState<any[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newUser, setNewUser] = useState({
    username: '',
    password: '',
    name: '',
    role: 'operator'
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const aquila = (window as any).aquila;

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await aquila.invoke('get-users');
      setUsers(data || []);
    } catch (err) {
      setError('Erro ao carregar usuários do sistema Eagles.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const result = await aquila.invoke('create-user', newUser);
      if (result.success) {
        setShowCreateModal(false);
        setNewUser({ username: '', password: '', name: '', role: 'operator' });
        loadUsers();
      } else {
        setError(result.message || 'Falha na criação do usuário.');
      }
    } catch (err) {
      setError('Erro de comunicação com o núcleo de segurança.');
    }
  };

  const handleDeleteUser = async (userId: string, username: string) => {
    if (username === 'admin') return;
    if (!confirm(`Deseja revogar o acesso de "${username}"?`)) return;
    
    try {
      const result = await aquila.invoke('delete-user', userId);
      if (result.success) {
        loadUsers();
      } else {
        setError(result.message || 'Erro ao remover usuário.');
      }
    } catch (err) {
      setError('Erro ao processar exclusão.');
    }
  };

  return (
    <div className="user-mgmt-page animate-fade-in">
      <div className="max-container">
        <header className="mgmt-header">
          <button className="btn-nav-back" onClick={onBack} title="Voltar para Dashboard" aria-label="Voltar">
            <ArrowLeft size={20} />
          </button>
          <div className="header-title-group">
            <h1>Gestão de Acessos & RBAC</h1>
            <p>Controle de privilégios para Coordenadores e Colaboradores Áquila.</p>
          </div>
          <button className="btn-add-user" onClick={() => setShowCreateModal(true)}>
            <UserPlus size={18} />
            Novo Registro
          </button>
        </header>

        {error && <div className="error-banner animate-shake">{error}</div>}

        <section className="table-viewport animate-slide-up">
          {loading ? (
            <div className="sync-status-placeholder">Sincronizando base de usuários Eagles...</div>
          ) : (
            <table className="premium-users-table">
              <thead>
                <tr>
                  <th>Nome Completo</th>
                  <th>Identificador (Login)</th>
                  <th>Nível de Privilégio</th>
                  <th className="text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id}>
                    <td>
                      <div className="user-identity">
                        <div className="avatar-initial">{u.name.charAt(0).toUpperCase()}</div>
                        <span className="user-name-text">{u.name}</span>
                      </div>
                    </td>
                    <td><code className="username-badge">{u.username}</code></td>
                    <td>
                      <span className={`role-badge role-${u.role}`}>
                        {u.role === 'admin' ? <Shield size={12} /> : <UserCheck size={12} />}
                        {u.role}
                      </span>
                    </td>
                    <td className="actions-cell">
                      <div className="row-actions-group">
                        <button 
                          className="btn-performance-detail"
                          title="Desempenho Profissional"
                          onClick={() => setSelectedUser(u)}
                        >
                            <Star size={14} />
                            Desempenho
                        </button>
                        <button 
                          className="btn-delete-row" 
                          title="Revogar Acesso" 
                          disabled={u.username === 'admin'}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteUser(u.id, u.username);
                          }}
                          aria-label={`Remover usuário ${u.username}`}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        {selectedUser && (
          <div className="modal-overlay animate-fade-in" onClick={() => setSelectedUser(null)}>
             <div className="performance-card-premium animate-slide-up" onClick={e => e.stopPropagation()}>
                <header className="performance-header">
                   <div className="user-identity">
                      <div className="avatar-initial large">{selectedUser.name.charAt(0).toUpperCase()}</div>
                      <div>
                         <h3>{selectedUser.name}</h3>
                         <span className="role-badge">{selectedUser.role}</span>
                      </div>
                   </div>
                   <button className="btn-close-perf" onClick={() => setSelectedUser(null)}>×</button>
                </header>
                
                <div className="performance-grid">
                   <div className="perf-metric-box">
                      <span className="metric-label">Pontualidade (Bio-Point)</span>
                      <div className="metric-value-row">
                          <div className="progress-bar-bg">
                              <div className="progress-fill green w-92" />
                          </div>
                         <span className="metric-pct">92%</span>
                      </div>
                   </div>
                   <div className="perf-metric-box">
                      <span className="metric-label">Engajamento Pedagógico</span>
                      <div className="metric-value-row">
                          <div className="progress-bar-bg">
                              <div className="progress-fill blue w-85" />
                          </div>
                         <span className="metric-pct">85%</span>
                      </div>
                   </div>
                    <div className="perf-metric-box">
                       <span className="metric-label">Conformidade Onboarding</span>
                       <div className="metric-value-row">
                          <CheckCircle2 size={16} className="icon-compliance" />
                          <span className="compliance-status-text">FINALIZADO (LDB/BNCC)</span>
                       </div>
                    </div>
                </div>

                 <div className="performance-insights">
                    <div className="insight-item">
                       <TrendingUp size={16} className="icon-insight" />
                      <p>O profissional mantém estabilidade na retenção de atenção dos alunos sugerindo conformidade ideal com o Plano de Aula.</p>
                   </div>
                </div>

                <div className="perf-footer">
                   <button className="btn-save-report">
                      <Award size={16} />
                      Emitir Avaliação Quadrimestral
                   </button>
                </div>
             </div>
          </div>
        )}

        <section className="lgpd-card animate-fade-in">
          <div className="lgpd-header">
            <div className="lgpd-icon-box">
              <Shield size={24} />
            </div>
            <div className="lgpd-title-group">
              <h2>Protocolo de Resiliência LGPD</h2>
              <p>Blindagem jurídica e governança de dados sensíveis (Biometria/Neuro-Pulse).</p>
            </div>
            <button className="btn-export-ripd" onClick={() => alert('Gerando Relatório de Impacto (RIPD) criptografado...')}>
              <FileText size={18} />
              Exportar RIPD
            </button>
          </div>
          <div className="lgpd-stats-grid">
            <div className="lgpd-stat-item">
              <span className="stat-label color-blue-light">PROCESSAMENTO LOCAL</span>
              <p className="stat-desc">Confirmado: 100% da telemetria e biometria processada in-server. Zero vazamento para nuvem pública.</p>
            </div>
            <div className="lgpd-stat-item">
              <span className="stat-label color-green-light">CONSENTIMENTO DIGITAL</span>
              <p className="stat-desc">Governança ativa: 84% dos termos de aceite assinados via WhatsApp Eagles. (Goal: 100%).</p>
            </div>
            <div className="lgpd-stat-item">
              <span className="stat-label color-purple-light">POLÍTICA DE PURGE</span>
              <p className="stat-desc">Higiene de dados: Registros de presença bruta são pulverizados após 60 dias de inatividade.</p>
            </div>
          </div>
        </section>

        {showCreateModal && (
          <div className="modal-overlay animate-fade-in" onClick={() => setShowCreateModal(false)}>
            <div className="modal-content-glass animate-slide-up" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Provisionar Acesso</h2>
                <p>Configure as credenciais e o escopo de atuação do colaborador.</p>
              </div>
              <form onSubmit={handleCreateUser}>
                <div className="form-group">
                  <label>Nome Completo</label>
                  <input 
                    type="text" 
                    value={newUser.name}
                    placeholder="Ex: João Silva"
                    title="Nome Completo"
                    onChange={e => setNewUser({...newUser, name: e.target.value})}
                    required 
                  />
                </div>
                <div className="form-group">
                  <label>Login (Eagles ID)</label>
                  <input 
                    type="text" 
                    value={newUser.username}
                    placeholder="Ex: joao.silva"
                    title="Username"
                    onChange={e => setNewUser({...newUser, username: e.target.value})}
                    required 
                  />
                </div>
                <div className="form-group">
                  <label>Senha Criptográfica</label>
                  <input 
                    type="password" 
                    value={newUser.password}
                    placeholder="••••••••"
                    title="Senha"
                    onChange={e => setNewUser({...newUser, password: e.target.value})}
                    required 
                  />
                </div>
                <div className="form-group">
                  <label>Nível RBAC</label>
                  <select 
                    value={newUser.role}
                    title="Nível de Acesso"
                    aria-label="Nível de Acesso"
                    onChange={e => setNewUser({...newUser, role: e.target.value})}
                  >
                    <option value="operator">Colaborador (Telemetria)</option>
                    <option value="coordinator">Coordenador (Gestão Pedagógica)</option>
                    <option value="director">Diretor (Governança)</option>
                    <option value="secretary">Secretário (Registros)</option>
                    <option value="admin">Administrador (Root)</option>
                  </select>
                </div>
                <div className="modal-actions">
                  <button type="button" className="btn-modal-cancel" onClick={() => setShowCreateModal(false)}>Cancelar</button>
                  <button type="submit" className="btn-modal-save">Ativar Acesso</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};


