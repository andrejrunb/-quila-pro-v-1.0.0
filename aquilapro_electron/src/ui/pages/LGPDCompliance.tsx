import React, { useState } from 'react';
import { Shield, Check, X, AlertTriangle, FileLock, EyeOff, Eye, Download } from 'lucide-react';
import './LGPDCompliance.css';

interface ConsentRecord {
  id: string;
  subject: string;
  type: 'biometric' | 'image' | 'voice';
  status: 'granted' | 'revoked' | 'pending';
  lastUpdated: string;
}

export const LGPDCompliance: React.FC = () => {
  const [records, setRecords] = useState<ConsentRecord[]>([
    { id: '1', subject: 'João Silva (Aluno)', type: 'biometric', status: 'granted', lastUpdated: '2024-03-10' },
    { id: '2', subject: 'Maria Santos (Aluno)', type: 'image', status: 'granted', lastUpdated: '2024-03-12' },
    { id: '3', subject: 'Pedro Oliveira (Aluno)', type: 'biometric', status: 'pending', lastUpdated: '2024-03-15' },
    { id: '4', subject: 'Prof. Carlos (Docente)', type: 'image', status: 'revoked', lastUpdated: '2024-02-28' },
  ]);

  const [anonymizeActive, setAnonymizeActive] = useState(false);

  const toggleStatus = (id: string) => {
    setRecords(records.map(r => {
      if (r.id === id) {
        const nextStatus = r.status === 'granted' ? 'revoked' : 'granted';
        return { ...r, status: nextStatus, lastUpdated: new Date().toISOString().split('T')[0] };
      }
      return r;
    }));
  };

  return (
    <div className="lgpd-container animate-fade-in">
      <header className="lgpd-page-header">
        <div className="header-icon">
          <Shield size={32} className="text-blue-500" />
        </div>
        <div>
          <h1>Cofre de Consentimento LGPD</h1>
          <p>Gestão centralizada de permissões e governança de dados sensíveis.</p>
        </div>
        
        <div className="privacy-mode-switch">
           <div className={`switch-track ${anonymizeActive ? 'active' : ''}`} onClick={() => setAnonymizeActive(!anonymizeActive)}>
              <div className="switch-thumb">
                 {anonymizeActive ? <EyeOff size={12} /> : <Eye size={12} />}
              </div>
           </div>
           <span className="switch-label">Modo Anonimato</span>
        </div>
      </header>

      <div className="lgpd-grid">
        <section className="consent-list-panel glass-panel">
          <div className="panel-header">
             <h2>Registros de Autorização</h2>
             <button className="btn-download-ripd">
                <Download size={16} />
                RIPD-v2.0
             </button>
          </div>
          <div className="consent-table-wrapper">
            <table className="consent-table">
              <thead>
                <tr>
                  <th>Titular</th>
                  <th>Atributo</th>
                  <th>Status Jurídico</th>
                  <th>Modificado em</th>
                  <th>Ação</th>
                </tr>
              </thead>
              <tbody>
                {records.map(r => (
                  <tr key={r.id}>
                    <td className="font-bold">{r.subject}</td>
                    <td><span className="type-badge">{r.type}</span></td>
                    <td>
                      <span className={`status-tag status-${r.status}`}>
                        {r.status === 'granted' && <> <Check size={12} /> CONCEDIDO</>}
                        {r.status === 'revoked' && <> <X size={12} /> REVOGADO</>}
                        {r.status === 'pending' && <> <AlertTriangle size={12} /> PENDENTE</>}
                      </span>
                    </td>
                    <td className="text-dim">{r.lastUpdated}</td>
                    <td>
                      <button className="btn-toggle-consent" onClick={() => toggleStatus(r.id)}>
                        Alternar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="legal-principles-panel glass-panel">
           <h2>Diretrizes de Resiliência</h2>
           <div className="principles-list">
              <div className="principle-item">
                 <FileLock size={20} className="text-purple-400" />
                 <div>
                    <h4>Minimização de Dados</h4>
                    <p>Coletamos apenas o vetor biométrico (hash), nunca a imagem bruta da impressão digital.</p>
                 </div>
              </div>
              <div className="principle-item">
                 <Shield size={20} className="text-green-400" />
                 <div>
                    <h4>Finalidade Específica</h4>
                    <p>O processamento RuView (WiFi-CSI) é restrito à segurança patrimonial e contagem de presença.</p>
                 </div>
              </div>
              <div className="principle-item">
                 <AlertTriangle size={20} className="text-yellow-400" />
                 <div>
                    <h4>Revogabilidade</h4>
                    <p>O titular pode retirar o consentimento a qualquer momento, resultando no 'purge' imediato do hash.</p>
                 </div>
              </div>
           </div>
        </section>
      </div>
    </div>
  );
};

export default LGPDCompliance;
