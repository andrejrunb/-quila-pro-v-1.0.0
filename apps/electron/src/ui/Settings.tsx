import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Save, AlertCircle, CheckCircle, Wifi, Lock, Bell, Eye, Cloud } from 'lucide-react';
import './Settings.css';

interface SettingsProps {
  onBack: () => void;
}

interface AppSettings {
  schoolName: string;
  schoolId: string;
  pythonPath: string;
  databasePath: string;
  backupPath: string;
  autoBackup: boolean;
  backupTime: string;
  notificationsEnabled: boolean;
  alertSound: boolean;
  darkMode: boolean;
  awsAccessKey: string;
  awsSecretKey: string;
  awsRegion: string;
  awsBucket: string;
  retentionEvents: number;
  retentionLogs: number;
  retentionImages: number;
  google_api_key: string;
  openai_api_key: string;
  assigned_room_id?: string;
}

export const Settings: React.FC<SettingsProps> = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState('general');
  const [settings, setSettings] = useState<AppSettings>({
    schoolName: 'Escola Demo',
    schoolId: 'escola-001',
    pythonPath: 'C:\\Python39\\python.exe',
    databasePath: 'C:\\Users\\User\\AppData\\Local\\AquilaPro\\aquila.db',
    backupPath: 'C:\\Users\\User\\AppData\\Local\\AquilaPro\\backups',
    autoBackup: true,
    backupTime: '02:00',
    notificationsEnabled: true,
    alertSound: true,
    darkMode: false,
    awsAccessKey: '••••••••••••••••',
    awsSecretKey: '••••••••••••••••',
    awsRegion: 'us-east-1',
    awsBucket: 'aquila-pro-backups',
    retentionEvents: 90,
    retentionLogs: 30,
    retentionImages: 30,
    google_api_key: '',
    openai_api_key: '',
    assigned_room_id: '',
  });

  const [rooms, setRooms] = useState<any[]>([]);

  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [editingSecrets, setEditingSecrets] = useState(false);
  const [adminToken, setAdminToken] = useState('');
  const [cloudStatus, setCloudStatus] = useState({
    isEnrolled: false,
    cloudId: null as string | null,
    lastSync: null as string | null,
    endpoint: ''
  });
  const [enrollStatus, setEnrollStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [lgpdTermContent, setLgpdTermContent] = useState<string | null>(null);
  const [showLgpdModal, setShowLgpdModal] = useState<boolean>(false);

  const handleBrowsePython = async () => {
    try {
      const res = await (window as any).aquila?.invoke('dialog:openFile', {
        title: 'Selecione o Executável Python',
        filters: [{ name: 'Executável Python', extensions: ['exe', 'bat', 'cmd', '*'] }]
      });
      if (res && !res.canceled && res.filePaths?.[0]) {
        handleInputChange('pythonPath', res.filePaths[0]);
        (window as any).showToast?.('Caminho do Python atualizado!', 'success');
      }
    } catch (e) {
      console.error('Failed to select Python executable', e);
    }
  };

  const handleOpenDatabaseFolder = async () => {
    try {
      const dbPath = settings.databasePath;
      if (dbPath) {
        const folder = dbPath.substring(0, Math.max(dbPath.lastIndexOf('/'), dbPath.lastIndexOf('\\')));
        await (window as any).aquila?.invoke('shell:openPath', folder);
        (window as any).showToast?.('Abrindo pasta do banco de dados...', 'info');
      }
    } catch (e) {
      console.error('Failed to open database folder', e);
    }
  };

  const handleBrowseBackup = async () => {
    try {
      const res = await (window as any).aquila?.invoke('dialog:openDirectory', {
        title: 'Selecione a Pasta de Backup'
      });
      if (res && !res.canceled && res.filePaths?.[0]) {
        handleInputChange('backupPath', res.filePaths[0]);
        (window as any).showToast?.('Pasta de backup atualizada!', 'success');
      }
    } catch (e) {
      console.error('Failed to select backup directory', e);
    }
  };

  const handleViewLgpdTerm = async () => {
    try {
      const r = await (window as any).aquila?.invoke('lgpd:get-term');
      setLgpdTermContent(r?.data?.text || 'Termo de Consentimento Soberano da Escola Áquila Pro.');
      setShowLgpdModal(true);
    } catch (e) {
      (window as any).showToast?.('Não foi possível carregar o termo de consentimento.', 'error');
    }
  };

  const handleInputChange = (field: keyof AppSettings, value: any) => {
    setSettings(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const loadLGPDSettings = async () => {
    try {
      const events = await (window as any).aquila.invoke('lgpd:get-retention', 'events');
      const logs = await (window as any).aquila.invoke('lgpd:get-retention', 'logs');
      setSettings(prev => ({
        ...prev,
        retentionEvents: events.data || 90,
        retentionLogs: logs.data || 30
      }));
    } catch (err) {
      console.error('Failed to load LGPD settings:', err);
    }
  };

  const loadCloudStatus = async () => {
    try {
      const status = await (window as any).aquila.invoke('sync:get-status');
      setCloudStatus(status);
    } catch (err) {
      console.error('Failed to load cloud status:', err);
    }
  };

  const loadSettings = async () => {
    try {
      const savedSettings = await (window as any).aquila.invoke('settings:get');
      if (savedSettings) {
        setSettings(prev => ({ ...prev, ...savedSettings }));
      }
    } catch (err) {
      console.error('Failed to load settings:', err);
    }
  };

  useEffect(() => {
    loadSettings();
    loadLGPDSettings();
    loadCloudStatus();

    const fetchRoomsList = async () => {
      try {
        const roomsList = await (window as any).aquila.invoke('get-rooms');
        setRooms(roomsList || []);
      } catch (err) {
        console.error('Failed to fetch rooms in settings:', err);
      }
    };
    fetchRoomsList();
  }, []);

  const handleSave = async () => {
    setSaveStatus('saving');
    try {
      // Salvar configurações gerais
      await (window as any).aquila.invoke('settings:save', settings);
      
      // Salvar políticas LGPD
      await (window as any).aquila.invoke('lgpd:set-retention', { type: 'events', days: settings.retentionEvents });
      await (window as any).aquila.invoke('lgpd:set-retention', { type: 'logs', days: settings.retentionLogs });

      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (error) {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  const handleManualPurge = async () => {
    if (!window.confirm('Deseja realmente apagar todos os dados expirados conforme a política de retenção?')) return;
    try {
      await (window as any).aquila.invoke('lgpd:run-purge');
      (window as any).showToast?.('Limpeza de dados expirados concluída com sucesso!', 'success');
    } catch (err) {
      (window as any).showToast?.('Falha ao executar limpeza de dados', 'error');
    }
  };

  const handleEnroll = async () => {
    if (!adminToken) return;
    setEnrollStatus('loading');
    try {
      const result = await (window as any).aquila.invoke('sync:enroll', adminToken);
      if (result.success) {
        setEnrollStatus('success');
        (window as any).showToast?.('Matrícula de nó soberano concluída com sucesso!', 'success');
        await loadCloudStatus();
      } else {
        setEnrollStatus('error');
        (window as any).showToast?.(result.message || 'Falha na matrícula', 'error');
      }
    } catch (err) {
      setEnrollStatus('error');
      (window as any).showToast?.('Erro de rede ao matricular nó', 'error');
    }
  };

  const handleTestConnection = async () => {
    try {
      const result = await (window as any).aquila.invoke('sync:test-connection');
      if (result.success) {
        (window as any).showToast?.('Conexão com a nuvem Áquila OK!', 'success');
      } else {
        (window as any).showToast?.('Falha na conexão: ' + result.message, 'error');
      }
    } catch (err) {
      (window as any).showToast?.('Erro ao testar conexão', 'error');
    }
  };

  const renderGeneralSettings = () => (
    <div className="settings-tab-content">
      <h2>Configurações Gerais</h2>

      <div className="settings-group">
        <h3>Informações da Escola</h3>
        <div className="settings-row">
          <label htmlFor="schoolName">Nome da Escola</label>
          <input
            id="schoolName"
            type="text"
            value={settings.schoolName}
            onChange={(e) => handleInputChange('schoolName', e.target.value)}
            placeholder="Nome da sua instituição"
            title="Nome da sua instituição"
          />
        </div>
        <div className="settings-row">
          <label htmlFor="schoolId">ID da Escola</label>
          <input
            id="schoolId"
            type="text"
            value={settings.schoolId}
            onChange={(e) => handleInputChange('schoolId', e.target.value)}
            placeholder="Identificador único"
            title="Identificador Único da Escola (Somente Leitura)"
            disabled
          />
        </div>
        <div className="settings-row">
          <label htmlFor="assigned_room_id">Sala deste Computador</label>
          <select
            id="assigned_room_id"
            value={settings.assigned_room_id || ''}
            onChange={(e) => handleInputChange('assigned_room_id', e.target.value)}
            title="Selecione a sala de aula associada a este computador"
          >
            <option value="">Não Associado (Nenhum)</option>
            {rooms.map((room: any) => (
              <option key={room.id} value={room.id}>
                {room.name} {room.location ? `(${room.location})` : ''}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="settings-group">
        <h3>Caminhos do Sistema</h3>
        <div className="settings-row">
          <label htmlFor="pythonPath">Caminho do Python</label>
          <div className="path-input">
            <input
              id="pythonPath"
              type="text"
              value={settings.pythonPath}
              onChange={(e) => handleInputChange('pythonPath', e.target.value)}
              placeholder="C:\Python3x\python.exe"
              aria-label="Caminho do Python"
              title="Caminho para o executável Python do sistema"
            />
            <button className="browse-btn" onClick={handleBrowsePython}>Procurar...</button>
          </div>
        </div>
        <div className="settings-row">
          <label htmlFor="databasePath">Banco de Dados</label>
          <div className="path-input">
            <input
              id="databasePath"
              type="text"
              value={settings.databasePath}
              onChange={(e) => handleInputChange('databasePath', e.target.value)}
              disabled
              aria-label="Banco de Dados"
              placeholder="C:\...\aquila.db"
              title="Caminho do arquivo de banco de Dados (Somente Leitura)"
            />
            <button className="browse-btn" onClick={handleOpenDatabaseFolder}>Abrir Pasta</button>
          </div>
        </div>
        <div className="settings-row">
          <label htmlFor="backupPath">Pasta de Backup</label>
          <div className="path-input">
            <input
              id="backupPath"
              type="text"
              value={settings.backupPath}
              onChange={(e) => handleInputChange('backupPath', e.target.value)}
              aria-label="Pasta de Backup"
              placeholder="C:\...\backups"
              title="Pasta onde os backups locais serão armazenados"
            />
            <button className="browse-btn" onClick={handleBrowseBackup}>Procurar...</button>
          </div>
        </div>
      </div>

      <div className="settings-group">
        <h3>Aparência</h3>
        <div className="settings-row checkbox">
          <input
            type="checkbox"
            id="darkMode"
            checked={settings.darkMode}
            onChange={(e) => handleInputChange('darkMode', e.target.checked)}
            title="Ativar/Desativar Modo Escuro"
          />
          <label htmlFor="darkMode">Modo Escuro</label>
        </div>
      </div>
    </div>
  );

  const renderBackupSettings = () => (
    <div className="settings-tab-content">
      <h2>Configurações de Backup</h2>

      <div className="settings-group">
        <h3>Backup Automático</h3>
        <div className="settings-row checkbox">
          <input
            type="checkbox"
            id="autoBackup"
            checked={settings.autoBackup}
            onChange={(e) => handleInputChange('autoBackup', e.target.checked)}
            title="Ativar Backup Automático"
          />
          <label htmlFor="autoBackup">Ativar Backup Automático</label>
        </div>

        {settings.autoBackup && (
          <div className="settings-row">
            <label htmlFor="backupTime">Horário do Backup</label>
            <input
              id="backupTime"
              type="time"
              value={settings.backupTime}
              onChange={(e) => handleInputChange('backupTime', e.target.value)}
              aria-label="Horário do Backup"
              placeholder="00:00"
              title="Horário diário para execução do backup automático"
            />
            <small>Backup será realizado diariamente neste horário</small>
          </div>
        )}
      </div>

      <div className="settings-group">
        <h3>Armazenamento em Nuvem (AWS S3)</h3>
        <div className="info-box">
          <AlertCircle size={18} />
          <p>Credenciais AWS são criptografadas e armazenadas localmente</p>
        </div>

        <div className="settings-row">
          <label htmlFor="awsRegion">Região AWS</label>
          <select
            id="awsRegion"
            value={settings.awsRegion}
            onChange={(e) => handleInputChange('awsRegion', e.target.value)}
            aria-label="Região AWS"
            title="Selecione a Região AWS"
          >
            <option value="us-east-1">us-east-1 (N. Virginia)</option>
            <option value="us-west-2">us-west-2 (Oregon)</option>
            <option value="eu-west-1">eu-west-1 (Irlanda)</option>
            <option value="sa-east-1">sa-east-1 (São Paulo)</option>
          </select>
        </div>

        <div className="settings-row">
          <label htmlFor="awsBucket">Bucket S3</label>
          <input
            id="awsBucket"
            type="text"
            value={settings.awsBucket}
            onChange={(e) => handleInputChange('awsBucket', e.target.value)}
            placeholder="Nome do bucket S3"
            aria-label="Bucket S3"
            title="Nome do bucket S3 para backups"
          />
        </div>

        {!editingSecrets && (
          <button
            className="edit-secrets-btn"
            onClick={() => setEditingSecrets(true)}
          >
            <Lock size={16} />
            Editar Credenciais AWS
          </button>
        )}

        {editingSecrets && (
          <>
            <div className="settings-row">
              <label htmlFor="awsAccessKey">Access Key ID</label>
              <input
                id="awsAccessKey"
                type="password"
                placeholder="Sua Access Key ID"
                defaultValue={settings.awsAccessKey}
                aria-label="Access Key ID"
                title="ID da Chave de Acesso AWS"
              />
            </div>
            <div className="settings-row">
              <label htmlFor="awsSecretKey">Secret Access Key</label>
              <input
                id="awsSecretKey"
                type="password"
                placeholder="Sua Secret Access Key"
                defaultValue={settings.awsSecretKey}
                aria-label="Secret Access Key"
                title="Chave de Acesso Secreta AWS"
              />
            </div>
            <button
              className="edit-secrets-btn cancel"
              onClick={() => setEditingSecrets(false)}
            >
              Cancelar Edição
            </button>
          </>
        )}
      </div>
    </div>
  );

  const renderCloudSettings = () => (
    <div className="settings-tab-content">
      <h2>Sincronização Global & Multi-Escola</h2>
      
      <div className="settings-group">
        <h3>Status da Nuvem Áquila</h3>
        <div className={`cloud-card ${cloudStatus.isEnrolled ? 'active' : 'inactive'}`}>
          <div className="cloud-card-header">
            <Cloud size={32} />
            <div>
              <h4>{cloudStatus.isEnrolled ? 'Escola Matriculada' : 'Não Matriculada'}</h4>
              <p>{cloudStatus.cloudId ? `ID Global: ${cloudStatus.cloudId}` : 'Acesso standalone — sem Dashboard Global'}</p>
            </div>
          </div>
          {cloudStatus.isEnrolled && (
            <div className="cloud-card-footer">
              <span>Último Sinc: {cloudStatus.lastSync ? new Date(cloudStatus.lastSync).toLocaleString() : 'Pendente'}</span>
              <button 
                onClick={handleTestConnection} 
                className="test-btn" 
                title="Verificar status da conexão"
              >
                Testar Conexão
              </button>
            </div>
          )}
        </div>
      </div>

      {!cloudStatus.isEnrolled && (
        <div className="settings-group">
          <h3>Matricular Escola</h3>
          <p className="settings-hint">Insira o token fornecido pelo administrador da rede Áquila para habilitar o Dashboard Global.</p>
          <div className="settings-row">
            <label htmlFor="adminToken">Token de Administração</label>
            <div className="path-input">
              <input
                id="adminToken"
                type="password"
                value={adminToken}
                onChange={(e) => setAdminToken(e.target.value)}
                placeholder="Insira seu Token Áquila Cloud"
                title="Token de administração para matrícula na nuvem"
              />
              <button 
                className="save-btn" 
                onClick={handleEnroll}
                disabled={enrollStatus === 'loading' || !adminToken}
                title="Realizar matrícula"
              >
                {enrollStatus === 'loading' ? 'Matriculando...' : 'Matricular'}
              </button>
            </div>
          </div>
        </div>
      )}

      {cloudStatus.isEnrolled && (
        <div className="settings-group">
          <h3>Configurações Avançadas</h3>
          <div className="settings-row">
            <label htmlFor="cloudEndpoint">Endpoint da Nuvem</label>
            <input
              id="cloudEndpoint"
              type="text"
              value={cloudStatus.endpoint}
              readOnly
              title="URL do servidor de sincronização"
              placeholder="https://api.aquilapro.com"
            />
          </div>
        </div>
      )}
    </div>
  );

  const renderNotificationSettings = () => (
    <div className="settings-tab-content">
      <h2>Configurações de Notificações</h2>

      <div className="settings-group">
        <h3>Alertas do Sistema</h3>
        <div className="settings-row checkbox">
          <input
            type="checkbox"
            id="notificationsEnabled"
            checked={settings.notificationsEnabled}
            onChange={(e) => handleInputChange('notificationsEnabled', e.target.checked)}
            title="Ativar Notificações do Sistema"
          />
          <label htmlFor="notificationsEnabled">Ativar Notificações</label>
        </div>

        {settings.notificationsEnabled && (
          <div className="settings-row checkbox">
            <input
              type="checkbox"
              id="alertSound"
              checked={settings.alertSound}
              onChange={(e) => handleInputChange('alertSound', e.target.checked)}
              title="Ativar Som de Alerta"
            />
            <label htmlFor="alertSound">Som de Alerta</label>
          </div>
        )}
      </div>

      <div className="settings-group">
        <h3>Tipos de Notificação</h3>
        <div className="notification-types">
          <div className="notification-type">
            <div className="type-header">
              <span className="type-name">Ausências de Alunos</span>
              <input type="checkbox" id="notif-absences" defaultChecked title="Habilitar notificações de ausências" />
            </div>
            <p>Notificar quando um aluno não for detectado em sala</p>
          </div>

          <div className="notification-type">
            <div className="type-header">
              <span className="type-name">Chegadas Atrasadas</span>
              <input type="checkbox" id="notif-late" defaultChecked title="Habilitar notificações de atrasos" />
            </div>
            <p>Notificar sobre chegadas após o horário de aula</p>
          </div>

          <div className="notification-type">
            <div className="type-header">
              <span className="type-name">Alertas de Segurança</span>
              <input type="checkbox" id="notif-security" defaultChecked title="Habilitar notificações de segurança" />
            </div>
            <p>Notificar sobre pessoas não identificadas ou comportamentos suspeitos</p>
          </div>

          <div className="notification-type">
            <div className="type-header">
              <span className="type-name">Problemas de Câmeras</span>
              <input type="checkbox" id="notif-cams" defaultChecked title="Habilitar notificações de problemas em câmeras" />
            </div>
            <p>Notificar quando câmeras ficarem offline</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSecuritySettings = () => (
    <div className="settings-tab-content">
      <h2>Configurações de Segurança</h2>

      <div className="settings-group">
        <h3>Proteção de Dados</h3>
        <div className="info-box success">
          <CheckCircle size={18} />
          <p>Banco de dados local é criptografado automaticamente</p>
        </div>

        <div className="info-box success">
          <CheckCircle size={18} />
          <p>Backups em S3 são criptografados com AES-256</p>
        </div>
      </div>

      <div className="settings-group">
        <h3>Conformidade LGPD</h3>
        <div className="compliance-info">
          <h4>Retenção de Dados (Dias)</h4>
          <div className="settings-row">
            <label htmlFor="retentionEvents">Eventos e Detecções</label>
            <input 
              id="retentionEvents"
              type="number" 
              value={settings.retentionEvents} 
              onChange={(e) => handleInputChange('retentionEvents', parseInt(e.target.value))}
              placeholder="90"
              title="Dias de retenção para eventos"
            />
          </div>
          <div className="settings-row">
            <label htmlFor="retentionLogs">Logs de Auditoria</label>
            <input 
              id="retentionLogs"
              type="number" 
              value={settings.retentionLogs} 
              onChange={(e) => handleInputChange('retentionLogs', parseInt(e.target.value))}
              placeholder="30"
              title="Dias de retenção para logs"
            />
          </div>
        </div>

        <button className="compliance-btn" onClick={handleViewLgpdTerm}>
          <Eye size={16} />
          Ver Termo de Consentimento Atual
        </button>
      </div>

      <div className="settings-group">
        <h3>Limpeza de Dados</h3>
        <button className="danger-btn" onClick={handleManualPurge}>
          Limpar Dados Expirados Agora
        </button>
        <p className="settings-hint">Remove permanentemente dados que ultrapassaram o período de retenção configurado.</p>
      </div>
    </div>
  );

  const renderAISettings = () => (
    <div className="settings-tab-content">
      <h2>Inteligência Artificial</h2>
      <p className="settings-hint">Configure as chaves das APIs de IA para habilitar o Córtex Student Lab e o assistente pedagógico avançado.</p>

      <div className="settings-group">
        <div className="provider-header">
           <img src="https://www.gstatic.com/lamda/images/gemini_sparkle_v002_d473530c2731a4cd0247d.svg" alt="Gemini" width="24" height="24" />
           <h3>Google AI Studio (Gemini)</h3>
        </div>
        <div className="info-box">
          <AlertCircle size={18} />
          <p>Recomendado para Vision e busca em tempo real (Grounding). Obtenha sua chave em <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer">AI Studio</a>.</p>
        </div>
        <div className="settings-row">
          <label htmlFor="google_api_key">Gemini API Key</label>
          <input
            id="google_api_key"
            type="password"
            value={settings.google_api_key}
            onChange={(e) => handleInputChange('google_api_key', e.target.value)}
            placeholder="AIza..."
            title="Chave de API do Google AI Studio"
          />
        </div>
      </div>

      <div className="settings-group">
        <div className="provider-header">
           <img src="https://openai.com/favicon.ico" alt="OpenAI" width="24" height="24" />
           <h3>OpenAI (GPT-4)</h3>
        </div>
        <div className="settings-row">
          <label htmlFor="openai_api_key">OpenAI API Key</label>
          <input
            id="openai_api_key"
            type="password"
            value={settings.openai_api_key}
            onChange={(e) => handleInputChange('openai_api_key', e.target.value)}
            placeholder="sk-..."
            title="Chave de API da OpenAI"
          />
        </div>
      </div>
    </div>
  );

  return (
    <div className="settings-container">
      {/* Header */}
      <div className="settings-header">
        <button className="back-btn" onClick={onBack}>
          ← Voltar
        </button>
        <h1>Configurações</h1>
        <div className="header-spacer"></div>
      </div>

      {/* Tabs */}
      <div className="settings-tabs">
        <button
          className={`tab ${activeTab === 'general' ? 'active' : ''}`}
          onClick={() => setActiveTab('general')}
        >
          <SettingsIcon size={18} />
          Geral
        </button>
        <button
          className={`tab ${activeTab === 'backup' ? 'active' : ''}`}
          onClick={() => setActiveTab('backup')}
        >
          Backup
        </button>
        <button
          className={`tab ${activeTab === 'notifications' ? 'active' : ''}`}
          onClick={() => setActiveTab('notifications')}
        >
          <Bell size={18} />
          Notificações
        </button>
        <button
          className={`tab ${activeTab === 'security' ? 'active' : ''}`}
          onClick={() => setActiveTab('security')}
        >
          <Lock size={18} />
          Segurança
        </button>
        <button
          className={`tab ${activeTab === 'cloud' ? 'active' : ''}`}
          onClick={() => setActiveTab('cloud')}
        >
          <Cloud size={18} />
          Nuvem
        </button>
        <button
          className={`tab ${activeTab === 'ai' ? 'active' : ''}`}
          onClick={() => setActiveTab('ai')}
        >
          <Eye size={18} />
          IA
        </button>
      </div>

      {/* Content */}
      <div className="settings-content">
        {activeTab === 'general' && renderGeneralSettings()}
        {activeTab === 'backup' && renderBackupSettings()}
        {activeTab === 'notifications' && renderNotificationSettings()}
        {activeTab === 'security' && renderSecuritySettings()}
        {activeTab === 'cloud' && renderCloudSettings()}
        {activeTab === 'ai' && renderAISettings()}
      </div>

      {showLgpdModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0f172a] border border-cyan-500/30 rounded-2xl max-w-2xl w-full p-6 text-white shadow-2xl flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
              <h3 className="text-xl font-bold text-cyan-400 flex items-center gap-2">
                <Eye size={20} /> Termo de Consentimento Soberano (LGPD)
              </h3>
              <button 
                onClick={() => setShowLgpdModal(false)}
                className="text-zinc-400 hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-y-auto text-zinc-300 text-sm leading-relaxed p-4 bg-black/40 rounded-xl border border-white/5 whitespace-pre-wrap font-sans">
              {lgpdTermContent}
            </div>
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10 mt-4">
              <button
                className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm transition"
                onClick={() => {
                  if (lgpdTermContent) {
                    navigator.clipboard.writeText(lgpdTermContent);
                    (window as any).showToast?.('Termo copiado para a área de transferência!', 'success');
                  }
                }}
              >
                Copiar Texto
              </button>
              <button
                className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-sm font-semibold transition"
                onClick={() => setShowLgpdModal(false)}
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="settings-footer">
        <div className="save-status">
          {saveStatus === 'success' && (
            <>
              <CheckCircle size={18} className="text-success" />
              <span>Configurações salvas com sucesso!</span>
            </>
          )}
          {saveStatus === 'error' && (
            <>
              <AlertCircle size={18} className="text-error" />
              <span>Erro ao salvar configurações</span>
            </>
          )}
        </div>
        <button
          className="save-btn"
          onClick={handleSave}
          disabled={saveStatus === 'saving'}
        >
          <Save size={18} />
          {saveStatus === 'saving' ? 'Salvando...' : 'Salvar Configurações'}
        </button>
      </div>
    </div>
  );
};

export default Settings;
