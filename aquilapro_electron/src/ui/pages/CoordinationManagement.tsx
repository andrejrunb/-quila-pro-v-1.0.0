import React, { useState, useEffect } from 'react';
import { 
  Users, Shield, Plus, Trash2, Edit2, 
  CheckCircle, XCircle, Layout, BookOpen, 
  BarChart3, Search, FileText 
} from 'lucide-react';
import { BehavioralEvidenceReport } from '../components/BehavioralEvidenceReport';
import { FileUploader } from '../components/FileUploader';
import './CoordinationManagement.css';

interface Coordination {
  id: string;
  name: string;
}

interface User {
  id: string;
  username: string;
  name: string;
  role: string;
  coordinationId: string | null;
  coordinationName?: string;
}

interface Class {
  id: string;
  name: string;
  coordinationId: string | null;
}

interface CoordinationManagementProps {
  onBack: () => void;
}

export const CoordinationManagement: React.FC<CoordinationManagementProps> = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState<'coordinations' | 'users' | 'classes' | 'verification' | 'evidence' | 'plans'>('coordinations');
  const [searchTerm, setSearchTerm] = useState('');
  const [coordinations, setCoordinations] = useState<Coordination[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [verificationQueue, setVerificationQueue] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [showCoordForm, setShowCoordForm] = useState(false);
  const [newCoordName, setNewCoordName] = useState('');

  const aquila = (window as any).aquila;

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [cRes, uRes, clRes, vRes] = await Promise.all([
        aquila.invoke('get-coordinations'),
        aquila.invoke('get-users'),
        aquila.invoke('get-classes'),
        aquila.invoke('get-verification-queue')
      ]);
      setCoordinations(cRes || []);
      setUsers(uRes || []);
      setClasses(clRes || []);
      setVerificationQueue(vRes || []);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddCoordination = async () => {
    if (!newCoordName) return;
    const newCoord = { id: `coord-${Date.now()}`, name: newCoordName };
    await aquila.invoke('upsert-coordination', newCoord);
    setNewCoordName('');
    setShowCoordForm(false);
    loadData();
  };

  const handleDeleteCoordination = async (id: string) => {
    if (window.confirm('Excluir esta coordenação removerá o vínculo de turmas e usuários. Continuar?')) {
      await aquila.invoke('delete-coordination', id);
      loadData();
    }
  };

  const handleUpdateUser = async (userId: string, role: string, coordId: string | null) => {
    await aquila.invoke('update-user-role', userId, role, coordId);
    loadData();
  };

  const handleUpdateClassCoord = async (classObj: any, coordId: string | null) => {
    await aquila.invoke('upsert-class', { ...classObj, coordinationId: coordId });
    loadData();
  };

  const handleVerifyId = async (id: string, status: 'confirmed' | 'rejected', confirmedStudentId?: string) => {
    try {
      const user = await aquila.invoke('get-current-user');
      await aquila.invoke('update-verification-status', id, status, confirmedStudentId, user?.id);
      loadData();
    } catch (error) {
      console.error('Erro ao verificar:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="coordination-management-page">
        <div className="management-container text-center py-20">
           <p className="text-dim uppercase font-black tracking-widest text-xs">Sincronizando Hierarquias Escolares...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="coordination-management-page">
      <div className="management-container">
        {/* Header */}
        <header className="management-header">
          <div>
            <button onClick={onBack} className="btn-back-link" aria-label="Voltar para a página anterior">
              ← Voltar
            </button>
            <h1 className="management-title">
              Gestão de Coordenação & Níveis de Acesso
            </h1>
            <p className="management-subtitle">Configure hierarquias, permissões e divisões da escola.</p>
          </div>
          <nav className="tab-navigation">
            <div 
              className={`tab-item ${activeTab === 'coordinations' ? 'tab-active-coordinations' : ''}`} 
              onClick={() => setActiveTab('coordinations')}
              aria-label="Aba de Coordenações"
            >
              <Layout className="tab-icon icon-blue" />
              <span className="tab-label">Coordenações</span>
            </div>
            <div 
              className={`tab-item ${activeTab === 'users' ? 'tab-active-users' : ''}`} 
              onClick={() => setActiveTab('users')}
              aria-label="Aba de Permissões de Usuários"
            >
              <Shield className="tab-icon icon-indigo" />
              <span className="tab-label">Permissões</span>
            </div>
            <div 
              className={`tab-item ${activeTab === 'verification' ? 'tab-active-verification' : ''}`} 
              onClick={() => setActiveTab('verification')}
              aria-label="Aba de Validação por IA"
            >
              <Users className="tab-icon icon-orange" />
              <span className="tab-label">Validação IA</span>
              {verificationQueue.length > 0 && (
                <span className="notification-badge">
                  {verificationQueue.length}
                </span>
              )}
            </div>
            <div 
              className={`tab-item ${activeTab === 'evidence' ? 'tab-active-evidence' : ''}`} 
              onClick={() => setActiveTab('evidence')}
              aria-label="Aba de Relatórios de Evidência"
            >
              <BarChart3 className="tab-icon icon-purple" />
              <span className="tab-label">Evidência</span>
            </div>
            <div 
              className={`tab-item ${activeTab === 'plans' ? 'tab-active-plans' : ''}`} 
              onClick={() => setActiveTab('plans')}
              aria-label="Aba de Planos de Aula"
            >
              <FileText className="tab-icon icon-emerald" />
              <span className="tab-label">Planos</span>
            </div>
          </nav>
        </header>

        {/* Content Hub */}
        <div className="management-content-hub">
          {activeTab === 'coordinations' && (
            <div className="animate-fade-in">
              <div className="section-header">
                <h2 className="section-title">
                  <Layout className="icon-blue" size={24} /> Coordenações Registradas
                </h2>
                <button 
                  onClick={() => setShowCoordForm(true)}
                  className="btn-primary"
                  aria-label="Criar Nova Coordenação"
                >
                  <Plus size={18} /> Nova Coordenação
                </button>
              </div>

              <div className="coordinations-grid">
                {coordinations.map(coord => (
                  <div key={coord.id} className="coord-card">
                    <div className="coord-card-header">
                      <div>
                        <h3 className="coord-name">{coord.name}</h3>
                        <p className="coord-id">ID: {coord.id}</p>
                      </div>
                      <button 
                        onClick={() => handleDeleteCoordination(coord.id)} 
                        className="btn-icon-delete"
                        title="Excluir Coordenação"
                        aria-label={`Excluir Coordenação ${coord.name}`}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <div className="coord-stats">
                        <BookOpen size={16} /> {classes.filter(c => c.coordinationId === coord.id).length} turmas vinculadas
                    </div>
                  </div>
                ))}
              </div>

              {showCoordForm && (
                <div className="modal-overlay">
                  <div className="modal-container">
                    <h3 className="modal-title">Nova Coordenação</h3>
                    <input 
                      type="text"
                      className="modal-input"
                      placeholder="Nome da Coordenação (ex: Fundamental I)"
                      value={newCoordName}
                      onChange={e => setNewCoordName(e.target.value)}
                      title="Digitar nome da nova coordenação"
                      autoFocus
                    />
                    <div className="modal-actions">
                      <button onClick={() => setShowCoordForm(false)} className="btn-modal-cancel">Cancelar</button>
                      <button onClick={handleAddCoordination} className="btn-modal-save">Salvar</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'users' && (
            <div className="animate-fade-in">
              <h2 className="section-title mb-6">
                <Shield className="icon-indigo" size={24} /> Níveis de Acesso por Usuário
              </h2>
              <div className="data-table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th className="table-header-cell">Usuário</th>
                      <th className="table-header-cell">Cargo / Permissão</th>
                      <th className="table-header-cell">Vínculo de Coordenação</th>
                      <th className="table-header-cell">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(user => (
                      <tr key={user.id}>
                        <td className="table-cell">
                          <div className="user-name">{user.name}</div>
                          <div className="user-username">@{user.username}</div>
                        </td>
                        <td className="table-cell">
                          <select 
                            className="input-select"
                            value={user.role}
                            title="Selecionar Cargo do Usuário"
                            aria-label={`Selecionar Cargo para ${user.name}`}
                            onChange={e => handleUpdateUser(user.id, e.target.value, user.coordinationId)}
                          >
                            <option value="director">Diretor(a)</option>
                            <option value="secretary">Secretário(a)</option>
                            <option value="coordinator">Coordenador(a)</option>
                            <option value="admin">Administrador TI</option>
                          </select>
                        </td>
                        <td className="table-cell">
                          <select 
                            className="input-select"
                            disabled={user.role !== 'coordinator'}
                            value={user.coordinationId || ''}
                            title="Vincular Usuário a Coordenação"
                            aria-label={`Vincular ${user.name} a uma coordenação`}
                            onChange={e => handleUpdateUser(user.id, user.role, e.target.value || null)}
                          >
                            <option value="">Sem vínculo</option>
                            {coordinations.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                          </select>
                        </td>
                        <td className="table-cell">
                          <button 
                            className="btn-icon-action"
                            title="Editar Dados do Usuário"
                            aria-label={`Editar ${user.name}`}
                          >
                            <Edit2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'verification' && (
            <div className="animate-fade-in">
              <h2 className="section-title mb-6">
                <Users className="icon-orange" size={24} /> Fila de Validação de Identidade
              </h2>
              
              {verificationQueue.length === 0 ? (
                <div className="empty-state">
                  <CheckCircle className="empty-icon" />
                  <p>Nenhuma identificação pendente de validação humana.</p>
                </div>
              ) : (
                <div className="verification-grid">
                  {verificationQueue.map(item => (
                    <div key={item.id} className="v-card">
                      <div className="v-card-media">
                        <div className="v-media-placeholder">
                          [IMAGEM CÂMERA: {item.cameraId}]
                        </div>
                        <div className="v-id-badge">
                          IA: {item.studentId || 'Desconhecido'}
                        </div>
                      </div>
                      <div className="v-card-body">
                         <p className="v-timestamp">{new Date(item.createdAt).toLocaleString('pt-BR')}</p>
                         <p className="v-prompt">Confirme se o aluno identificado pela IA está correto:</p>
                        
                        <div className="v-actions">
                          <button 
                            onClick={() => handleVerifyId(item.id, 'confirmed', item.studentId)}
                            className="btn-v-confirm"
                            aria-label="Confirmar Identificação IA"
                          >
                            <CheckCircle size={18} /> Confirmar
                          </button>
                          <button 
                            onClick={() => handleVerifyId(item.id, 'rejected')}
                            className="btn-v-reject"
                            aria-label="Rejeitar Identificação IA"
                          >
                            <XCircle size={18} /> Rejeitar
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          
          {activeTab === 'evidence' && (
            <div className="animate-fade-in">
              <h2 className="section-title mb-6">
                <BarChart3 className="icon-purple" size={24} /> Motor de Accountability & Evidência
              </h2>
              
              <div className="search-wrapper">
                 <Search className="search-icon" size={20} />
                 <input 
                    type="text" 
                    placeholder="Buscar aluno para comparar com a média da turma..." 
                    className="search-input"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    title="Buscar aluno para relatório"
                 />
              </div>

              {searchTerm ? (
                 <BehavioralEvidenceReport studentId="std-001" />
              ) : (
                <div className="placeholder-area">
                   <p>Digite o nome do aluno para gerar o comparativo quantitativo.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'plans' && (
            <div className="animate-fade-in">
              <h2 className="section-title mb-6">
                <FileText className="icon-emerald" size={24} /> Repositório de Planos de Aula
              </h2>
              <div className="plans-wrapper">
                <p className="plans-desc">Envie os planos de aula semanais ou a matriz curricular anual para validação pela coordenação.</p>
                <FileUploader 
                  onFilesSelected={(files) => console.log('Curriculum Files:', files)}
                  label="Arraste seus planos de aula (PDF/DOCX) aqui"
                  accept=".pdf,.docx,.doc"
                />
              </div>
            </div>
          )}
        </div>

        {/* Lower Grid: Mapping vs Roles Info */}
        <div className="mapping-grid">
            <section className="map-card">
                <h2 className="map-card-title">
                    <BookOpen className="icon-indigo" size={20} /> Vínculo de Turmas
                </h2>
                <div className="classes-list custom-scrollbar">
                    {classes.map(cl => (
                        <div key={cl.id} className="class-mapping-item">
                            <div>
                                <span className="class-info-name">{cl.name}</span>
                                <p className="class-info-id">ID: {cl.id}</p>
                            </div>
                            <select 
                                className="input-select"
                                value={cl.coordinationId || ''}
                                title="Atribuir Coordenação à Turma"
                                aria-label={`Atribuir coordenação para ${cl.name}`}
                                onChange={e => handleUpdateClassCoord(cl, e.target.value || null)}
                            >
                                <option value="">Não Atribuída</option>
                                {coordinations.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>
                    ))}
                </div>
            </section>

            <section className="info-card-elite">
                <h2 className="info-title">Sobre os Níveis</h2>
                <div className="roles-benefit-list">
                    <div className="role-benefit-item">
                        <CheckCircle className="icon-check-role text-green" />
                        <span><strong>Direção/Secretaria</strong>: Visão total da escola, relatórios bimestrais e anuais.</span>
                    </div>
                    <div className="role-benefit-item">
                        <CheckCircle className="icon-check-role text-blue" />
                        <span><strong>Coordenação</strong>: Dashboards específicos das turmas vinculadas, alertas de corredor e saídas.</span>
                    </div>
                    <div className="role-benefit-item">
                        <XCircle className="icon-check-role text-red" />
                        <span><strong>Restrição</strong>: Coordenadores não podem visualizar dados de turmas fora de sua área de atuação.</span>
                    </div>
                </div>
            </section>
        </div>
      </div>
    </div>
  );
};

export default CoordinationManagement;
