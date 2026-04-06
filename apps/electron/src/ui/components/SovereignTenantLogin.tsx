import React, { useState } from 'react';
import '../styles/SovereignEagleUX.css';

/**
 * SOVEREIGN TENANT LOGIN (v3702)
 * ----------------------------
 * Interface premium de autenticação com suporte a múltiplos contextos (Tenants).
 * Permite que um administrador transite entre diferentes escolas
 * ou que um docente acesse sua unidade específica via um portal unificado.
 */
const mockTenants = [
  { id: 'alpha', name: 'Colégio Alpha Soberano', subdomain: 'alpha.aquila.local' },
  { id: 'beta', name: 'Instituto Beta de Inovação', subdomain: 'beta.aquila.local' },
  { id: 'gamma', name: 'Escola Técnica Gamma', subdomain: 'gamma.aquila.local' }
];

export const SovereignTenantLogin: React.FC = () => {
  const [selectedTenant, setSelectedTenant] = useState(mockTenants[0].id);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleLogin = () => {
    setIsLoggingIn(true);
    setTimeout(() => {
       setIsLoggingIn(false);
       alert(`CONTEÚDO CARREGADO PARA: ${mockTenants.find(t => t.id === selectedTenant)?.name}`);
    }, 1500);
  };

  return (
    <div className="eagle-command-center tenant-login-container">
      <div className="holographic-card login-card">
        <div className="login-header">
          <div className="avatar-core login-avatar" />
          <h1 className="eagle-title login-title">ÁQUILA PRO | LOGIN</h1>
          <p className="metric-label">SELECIONE O CONTEXTO INSTITUCIONAL</p>
        </div>

        <div className="unit-metrics-grid login-form">
          <label htmlFor="tenant-select" className="sr-only">Selecione a Instituição</label>
          <select 
            id="tenant-select"
            className="logic-input-cyber" 
            value={selectedTenant}
            onChange={(e) => setSelectedTenant(e.target.value)}
            title="Seletor de Instituição"
          >
            {mockTenants.map(tenant => (
              <option key={tenant.id} value={tenant.id}>{tenant.name}</option>
            ))}
          </select>

          <label htmlFor="access-key" className="sr-only">Chave de Acesso</label>
          <input 
            id="access-key"
            type="password" 
            placeholder="CHAVE DE ACESSO SOBERANO" 
            className="logic-input-cyber"
          />

          <button 
            type="button"
            className={`logic-button-cyber ${isLoggingIn ? 'loading' : ''}`} 
            onClick={handleLogin}
          >
            {isLoggingIn ? 'AUTENTICANDO...' : 'ACESSAR CÓRTEX'}
          </button>
        </div>

        <div className="integrity-seal-gold login-footer-seal">
          TENANT ISOLATION v3702 | AES-256-PQC PROTECTED
        </div>
      </div>
    </div>
  );
};
