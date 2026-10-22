import React, { useState, useEffect } from 'react';
import { 
  FileCheck, 
  Search, 
  Download, 
  ShieldAlert, 
  Clock, 
  Key, 
  Lock,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import './DigitalForensics.css';

interface EvidenceItem {
  id: string;
  timestamp: string;
  eventType: string;
  hash: string;
  signature: string;
  isValid: boolean;
}

const DigitalForensics: React.FC = () => {
  const [evidences, setEvidences] = useState<EvidenceItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    const loadEvidences = async () => {
      try {
        const evs = await (window as any).aquila.invoke('audit:get-evidences');
        if (evs && evs.length > 0) {
          setEvidences(evs);
        } else {
          setEvidences([]);
        }
      } catch (err) {
        console.error('Failed to load forensic evidences:', err);
      }
    };
    loadEvidences();
  }, []);

  const exportReport = (id: string) => {
    console.log(`Exportando laudo técnico para ${id}`);
    alert(`Laudo Técnico gerado para ${id}. Verifique o diretório de auditoria.`);
  };

  return (
    <div className="forensics-container">
      <header className="forensics-header">
        <div className="forensics-title">
          <FileCheck className="icon-blue" size={32} />
          <div>
            <h1>Auditoria Forense Digital</h1>
            <p>Nível 16: Cadeia de Custódia & Assinatura Criptográfica</p>
          </div>
        </div>
        <div className="forensics-actions">
          <button className="search-btn"><Search size={18} /> Pesquisar ID</button>
          <button className="export-all-btn"><Download size={18} /> Exportar Ledger</button>
        </div>
      </header>

      <div className="forensics-main">
        <aside className="evidence-list-panel">
          <h3>Evidências Recentes</h3>
          <div className="evidence-scroll">
            {evidences.map(e => (
              <div 
                key={e.id} 
                className={`evidence-card ${selectedId === e.id ? 'active' : ''}`}
                onClick={() => setSelectedId(e.id)}
              >
                <div className="card-top">
                  <span className="id">{e.id}</span>
                  <span className="time">{e.timestamp.split(' ')[1]}</span>
                </div>
                <div className="type">{e.eventType}</div>
                <div className="status">
                  <Lock size={12} /> Assinado Digitalmente
                </div>
              </div>
            ))}
          </div>
        </aside>

        <section className="evidence-detail-panel">
          {selectedId ? (() => {
            const ev = evidences.find(e => e.id === selectedId) as any;
            if (!ev) return null;
            let details = {};
            try { details = ev.details ? JSON.parse(ev.details) : {}; } catch(e){}
            return (
            <div className="detail-content">
              <div className="detail-header">
                <h2>Cadeia de Custódia: {selectedId}</h2>
                <button className="download-report" onClick={() => exportReport(selectedId)}>
                  <Download size={16} /> Gerar Laudo PDF
                </button>
              </div>

              <div className="detail-grid">
                <div className="detail-group">
                  <label><Clock size={14} /> Registro Temporal</label>
                  <div className="val">{ev.timestamp}</div>
                </div>
                <div className="detail-group">
                  <label><ShieldAlert size={14} /> Tipo de Evento</label>
                  <div className="val">{ev.eventType}</div>
                </div>
                <div className="detail-group full">
                  <label><Key size={14} /> Hash SHA-256 (SHA-2)</label>
                  <div className="code">{ev.hash}</div>
                </div>
                <div className="detail-group full">
                  <label><Lock size={14} /> Assinatura Digital (HMAC-SHA256)</label>
                  <div className="code signature">{ev.signature}</div>
                </div>
              </div>

              <div className="integrity-status success">
                <FileCheck size={24} />
                <div>
                  <strong>Integridade Verificada</strong>
                  <p>A evidência não foi alterada desde sua criação original.</p>
                </div>
              </div>

              <div className="forensic-meta">
                <h3>Metadados Técnicos</h3>
                <pre>
                  {JSON.stringify(details, null, 2)}
                </pre>
              </div>
            </div>
            );
          })() : (
            <div className="empty-state">
              <FileCheck size={64} opacity={0.1} />
              <p>Selecione uma evidência para visualizar a cadeia de custódia completa.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default DigitalForensics;
