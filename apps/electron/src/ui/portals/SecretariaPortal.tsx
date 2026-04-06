import React from 'react';
import { PortalLayout } from '../layouts/PortalLayout';
import { FileText, CloudSync, ShieldAlert, CheckCircle2, Search } from 'lucide-react';
import './SecretariaPortal.css';

export const SecretariaPortal: React.FC = () => {
  const syncStats = [
    { label: 'Sincronia MEC', status: 'OK', date: 'Hoje, 09:12' },
    { label: 'Censo Escolar', status: 'OK', date: 'Hoje, 07:45' },
    { label: 'ERP Financeiro', status: 'PENDENTE', date: '-' },
  ];

  return (
    <PortalLayout portalName="Secretaria Digital" themeColor="#10b981">
      <div className="sec-portal-container">
        {/* Dashboard de Sincronia */}
        <div className="sec-stats-grid">
          {syncStats.map((stat, idx) => (
            <div key={idx} className="sec-stat-card glass shadow-glow">
              <div className={`status-pill ${stat.status.toLowerCase()}`}>
                {stat.status === 'OK' ? <CheckCircle2 size={12} /> : <ShieldAlert size={12} />}
                {stat.status}
              </div>
              <h3 className="stat-label">{stat.label}</h3>
              <p className="stat-date">{stat.date}</p>
            </div>
          ))}
        </div>

        {/* Busca de Documentos */}
        <div className="sec-search-bar glass">
          <Search size={20} className="text-zinc-500" />
          <input type="text" placeholder="Buscar aluno, prontuário ou histórico..." className="sec-input" />
        </div>

        {/* Vault de Documentos */}
        <section className="sec-vault-section">
          <div className="sec-header">
            <div className="sec-icon-box bg-emerald-500/10 text-emerald-500">
              <FileText size={20} />
            </div>
            <div className="sec-title-group">
              <h2 className="text-xl font-bold">Cofre de Documentos (Vault)</h2>
              <p className="text-xs text-zinc-500 uppercase font-black">Sincronização Segura com a Cloud</p>
            </div>
          </div>

          <div className="sec-doc-grid">
            <div className="doc-item glass hover:border-emerald-500/50 transition-all">
              <div className="doc-icon"><FileText size={24} /></div>
              <div className="doc-info">
                <span className="doc-name">Histórico_João_Silva.pdf</span>
                <span className="doc-meta">Assinado Digitalmente • 12/03/24</span>
              </div>
              <CloudSync size={20} className="text-emerald-500" />
            </div>
            {/* Mais itens mockados */}
          </div>
        </section>
      </div>
    </PortalLayout>
  );
};

export default SecretariaPortal;
