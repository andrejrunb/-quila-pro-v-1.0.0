import React, { useState } from 'react';
import '../styles/SovereignEagleUX.css';

/**
 * SOVEREIGN MARKETPLACE (v3701)
 * ----------------------------
 * Página premium para descoberta e instalação de plugins soberanos.
 * Todos os plugins são assinados digitalmente pelo ecossistema Áquila.
 */
const plugins = [
  { id: 'guardian', name: 'SafeGuard Pro', desc: 'Monitoramento facial avançado para áreas de risco.', icon: '🛡️', installed: true },
  { id: 'pedagogic', name: 'IA Pedagógica V5', desc: 'Análise de sentimento e evolução de notas via LLM local.', icon: '📚', installed: false },
  { id: 'finance', name: 'Financial Glass', desc: 'Transparência total e cobrança via PIX automatizada.', icon: '💎', installed: false },
  { id: 'hybrid', name: 'Hybrid Shield', desc: 'Backup híbrido P2P entre campuses.', icon: '🔗', installed: true }
];

export const SovereignMarketplace: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <div className="eagle-command-center">
      <header className="holographic-card eagle-header">
        <div>
          <h1 className="eagle-title">SOVEREIGN MARKETPLACE</h1>
          <p className="metric-label">PLUGINS ASSINADOS E VALIDADOS LOCALMENTE</p>
        </div>
        <input 
          type="text" 
          placeholder="BUSCAR PLUGIN..." 
          className="logic-input-cyber marketplace-search"
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </header>

      <div className="unit-grid">
        {plugins.filter(p => p.name.toUpperCase().includes(searchTerm.toUpperCase())).map((plugin) => (
          <div key={plugin.id} className="holographic-card eagle-card-hover">
            <div className="unit-info-header">
              <span className="plugin-icon">{plugin.icon}</span>
              <div className="plugin-meta">
                <h3 className="unit-name">{plugin.name}</h3>
                <div className="integrity-seal-gold">SIGNED BY AQUILA ENGINE</div>
              </div>
            </div>
            
            <p className="plugin-description">
              {plugin.desc}
            </p>

            <div className="unit-metrics-grid store-actions">
              <button className={`logic-button-cyber ${plugin.installed ? 'outline' : ''}`}>
                {plugin.installed ? 'CONFIGURAR' : 'INSTALAR'}
              </button>
            </div>

            <div className="data-stream-glow" />
          </div>
        ))}
      </div>

      <footer className="holographic-card eagle-footer">
        AQUILA STORE PROTOCOL v3.7 | REPOSITÓRIO LOCAL: /mnt/sovereign/apps
      </footer>
    </div>
  );
};
