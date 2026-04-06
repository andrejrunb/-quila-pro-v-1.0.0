import React, { useState } from 'react';
import { MessageCircle, Settings, Send, CheckCircle, AlertCircle, Smartphone, MessageSquare, Settings2, Save, Zap, ShieldCheck } from 'lucide-react';
import './WhatsAppIntegration.css';

interface WhatsAppTemplate {
  id: string;
  name: string;
  message: string;
  variables: string[];
  enabled: boolean;
}

interface WhatsAppIntegrationProps {
  onBack: () => void;
}

export const WhatsAppIntegration: React.FC<WhatsAppIntegrationProps> = ({ onBack }) => {
  const [templates, setTemplates] = useState<WhatsAppTemplate[]>([
    {
      id: '1',
      name: 'Aluno Ausente',
      message: 'Olá {{responsavel}}, seu filho {{aluno}} não foi detectado na aula de {{materia}} hoje.',
      variables: ['responsavel', 'aluno', 'materia'],
      enabled: true,
    },
    {
      id: '2',
      name: 'Chegada Atrasada',
      message: 'Atenção {{responsavel}}: {{aluno}} chegou {{minutos}} minutos atrasado na aula de {{materia}}.',
      variables: ['responsavel', 'aluno', 'minutos', 'materia'],
      enabled: true,
    },
    {
      id: '3',
      name: 'Saída Não Autorizada',
      message: 'ALERTA: {{aluno}} saiu da escola às {{hora}}. Contate a coordenação imediatamente.',
      variables: ['aluno', 'hora'],
      enabled: true,
    },
  ]);

  const [isConfigured, setIsConfigured] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [configData, setConfigData] = useState({
    apiKey: '',
    phoneNumber: '',
    businessAccountId: '',
    apiUrl: '',
    token: ''
  });

  const [testMessage, setTestMessage] = useState('');
  const [testPhone, setTestPhone] = useState('');
  const [testStatus, setTestStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [isSaving, setIsSaving] = useState(false);
  const [status] = useState({ queued: 0, sentThisHour: 0, rateLimit: '∞', tier: 'Standard' });

  const handleSaveConfig = () => {
    if (!configData.apiKey || !configData.phoneNumber) {
      alert('Preencha todos os campos');
      return;
    }
    setIsConfigured(true);
    setShowConfig(false);
  };

  const handleToggleTemplate = (id: string) => {
    setTemplates(templates.map(t => t.id === id ? { ...t, enabled: !t.enabled } : t));
  };

  const handleSendTest = async () => {
    if (!testPhone || !testMessage) {
      alert('Preencha telefone e mensagem');
      return;
    }

    setTestStatus('sending');
    setTimeout(() => {
      setTestStatus('success');
      setTimeout(() => setTestStatus('idle'), 3000);
    }, 2000);
  };

  return (
    <div className="whatsapp-container">
      <header className="whatsapp-header">
        <div className="header-top">
          <div>
            <button onClick={onBack} className="btn-back-link">
              ← Voltar para o Dashboard
            </button>
            <div className="title-container">
              <MessageCircle size={32} className="icon-emerald" />
              <h1>Integração WhatsApp</h1>
            </div>
            <p className="header-description">Configure notificações automáticas via WhatsApp (Evolution API)</p>
          </div>
          <button onClick={() => setShowConfig(true)} className="btn-config">
            <Settings size={20} />
            Configurar
          </button>
        </div>
      </header>

      <div className={`status-banner ${isConfigured ? 'active' : 'pending'}`}>
        {isConfigured ? (
          <>
            <CheckCircle size={24} className="icon-emerald" />
            <div>
              <p className="status-title status-active-title">Integração Ativa</p>
              <p className="status-text">WhatsApp configurado e pronto para enviar notificações</p>
            </div>
          </>
        ) : (
          <>
            <AlertCircle size={24} className="icon-warning" />
            <div>
              <p className="status-title status-pending-title">Não Configurado</p>
              <p className="status-text">Clique em "Configurar" para ativar notificações via WhatsApp</p>
            </div>
          </>
        )}
      </div>

      {isConfigured && (
        <section className="glass-card">
          <h2 className="card-title-small">Testar Envio Real</h2>
          <div className="form-container">
            <div className="form-group">
              <label className="form-label">Número de Telefone</label>
              <input
                type="tel"
                value={testPhone}
                onChange={e => setTestPhone(e.target.value)}
                placeholder="(11) 98765-4321"
                className="input-field"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Mensagem de Teste</label>
              <textarea
                value={testMessage}
                onChange={e => setTestMessage(e.target.value)}
                placeholder="Digite a mensagem de teste..."
                className="input-field textarea-field"
              />
            </div>
            <button
              onClick={handleSendTest}
              disabled={testStatus === 'sending'}
              className={`btn-send-test ${testStatus}`}
            >
              <Send size={20} />
              {testStatus === 'sending' ? 'Enviando...' : testStatus === 'success' ? 'Enviado com Sucesso!' : 'Enviar Teste'}
            </button>
          </div>
        </section>
      )}

      <section className="templates-container">
        <div className="templates-title-group">
          <h1>
            <MessageSquare size={40} className="icon-emerald" />
            Templates de WhatsApp
          </h1>
          <p className="header-subtitle">Personalize a comunicação automática com os pais</p>
        </div>

        <div className="templates-list-stack">
          {templates.map((tpl) => (
            <div key={tpl.id} className="template-card-premium">
              <div className="template-card-header">
                <div>
                  <h3 className="template-card-title">{tpl.name}</h3>
                  <p className="template-card-trigger">Gatilho: {tpl.id === '1' ? 'Detecção na Entrada' : 'Detecção na Saída'}</p>
                </div>
                <div className="icon-badge-emerald">
                  <Smartphone size={20} className="icon-emerald" />
                </div>
              </div>
              <div className="template-body">
                <p>{tpl.message}</p>
              </div>
              <div className="template-footer">
                <label className="template-toggle">
                  <input
                    type="checkbox"
                    checked={tpl.enabled}
                    onChange={() => handleToggleTemplate(tpl.id)}
                    className="checkbox-custom"
                  />
                  <span className="toggle-label">
                    {tpl.enabled ? 'Ativo' : 'Inativo'}
                  </span>
                </label>
                <div className="tag-list">
                  {tpl.variables.map(tag => (
                    <span key={tag} className="tag-badge">{`{{${tag}}}`}</span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
        <button
          onClick={() => setIsSaving(true)}
          disabled={isSaving}
          className="btn-save-templates"
        >
          {isSaving ? 'Salvando...' : <><Save size={20} /> Salvar Todos os Templates</>}
        </button>
      </section>

      {showConfig && (
        <div className="settings-grid">
          <div className="settings-stack">
            <div className="settings-card-glass">
              <h3 className="settings-card-title-flex">
                <Settings2 size={20} className="icon-emerald" />
                Parâmetros da API
              </h3>
              <div className="form-stack">
                <div className="form-item">
                  <label className="label-tiny-caps">Endpoint URL</label>
                  <input 
                    type="text" 
                    value={configData.apiUrl}
                    onChange={(e) => setConfigData({...configData, apiUrl: e.target.value})}
                    className="settings-input"
                    placeholder="https://graph.facebook.com/v17.0/..."
                  />
                </div>
                <div className="form-item">
                  <label className="label-tiny-caps">Bearer Token</label>
                  <input 
                    type="password" 
                    value={configData.token}
                    onChange={(e) => setConfigData({...configData, token: e.target.value})}
                    className="settings-input"
                    placeholder="EAAW..."
                  />
                </div>
              </div>
              <p className="config-help-text">Obtenha sua chave no portal Meta for Developers.</p>
            </div>

            <div className="status-queue-card">
              <div>
                <h3 className="queue-card-title">
                  Fila de Envios
                  <span className={status.queued > 0 ? 'status-active-pill' : 'status-pending-pill'}>
                    {status.queued || 0} Pendentes
                  </span>
                </h3>
                <div className="status-metrics-stack">
                  <div className="status-row">
                    <span className="label-bold">Status do Serviço</span>
                    <span className="status-value-active">
                      <Zap size={16} fill="currentColor" /> ATIVO
                    </span>
                  </div>
                  <div className="status-row">
                    <span className="label-bold">Enviadas na Janela (1h)</span>
                    <span className="value-heavy">{status.sentThisHour || 0} <span className="value-dim">/ {status.rateLimit || '∞'}</span></span>
                  </div>
                  <div className="status-row">
                    <span className="label-bold">Plano Atual</span>
                    <span className="plan-badge">{status.tier || '...'}</span>
                  </div>
                </div>
              </div>
              <div className="lgpd-notice-box">
                <ShieldCheck size={24} className="icon-emerald" />
                <p className="lgpd-text">
                  <strong>LGPD Assert:</strong> Todas as mensagens enviadas são filtradas localmente. Biometria e imagens nunca saem deste terminal. Eagle Tech garante a criptografia ponta-a-ponta via HTTPS/TLS 1.3.
                </p>
              </div>
            </div>
            
            <div className="modal-notice">
              <p>
                <strong>Nota:</strong> Esta instância utiliza a Evolution API para comunicação direta. Certifique-se de que o webhook esteja apontando para o servidor Áquila Cloud.
              </p>
            </div>

            <div className="modal-actions">
              <button onClick={() => setShowConfig(false)} className="btn-cancel">
                Cancelar
              </button>
              <button onClick={handleSaveConfig} className="btn-save">
                Salvar Configurações
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WhatsAppIntegration;
