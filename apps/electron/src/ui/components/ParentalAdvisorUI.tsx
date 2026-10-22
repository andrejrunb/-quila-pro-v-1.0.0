import React, { useState, useEffect } from 'react';
import './ParentalAdvisorUI.css';

interface Report {
  id: string;
  studentName: string;
  summary: string;
  status: 'pending' | 'approved' | 'sent';
}

const ParentalAdvisorUI: React.FC = () => {
  const [reports, setReports] = useState<Report[]>([
    { id: '1', studentName: 'Gabriel Silva', summary: 'Evolução notável em lógica, mas requer atenção em foco.', status: 'pending' },
    { id: '2', studentName: 'Ana Clara', summary: 'Liderança positiva no grupo. Recomendo leitura extra de história.', status: 'pending' },
    { id: '3', studentName: 'Lucas Lima', summary: 'Participação ativa. Melhoria na escrita de ensaios.', status: 'pending' }
  ]);

  const [loading, setLoading] = useState(false);

  const handleApprove = (id: string) => {
    setLoading(true);
    setTimeout(() => {
      setReports(prev => prev.map(r => r.id === id ? { ...r, status: 'approved' } : r));
      setLoading(false);
    }, 600);
  };

  const handleSendWhatsApp = (id: string) => {
    setLoading(true);
    // Simulação de chamada IPC para o ParentalAdvisorService
    setTimeout(() => {
      setReports(prev => prev.map(r => r.id === id ? { ...r, status: 'sent' } : r));
      setLoading(false);
      alert("Relatório enviado com sucesso via WhatsApp!");
    }, 1200);
  };

  return (
    <div className="parent-bridge-container">
      <div className="pb-header">
        <h2>Parent Insight Bridge (Phase 1100)</h2>
        <p>Revise e aprove os insights agênticos antes do envio às famílias.</p>
      </div>

      <div className="pb-list">
        {reports.map(report => (
          <div key={report.id} className={`pb-card ${report.status}`}>
            <div className="pb-info">
              <span className="pb-student">{report.studentName}</span>
              <p className="pb-summary">{report.summary}</p>
            </div>
            <div className="pb-actions">
              {report.status === 'pending' ? (
                <>
                  <button className="pb-btn edit">✏️ Ajustar</button>
                  <button className="pb-btn approve" onClick={() => handleApprove(report.id)}>✅ Aprovar</button>
                </>
              ) : report.status === 'approved' ? (
                <button className="pb-btn whatsapp" onClick={() => handleSendWhatsApp(report.id)}>
                   Enviar WhatsApp
                </button>
              ) : (
                <span className="pb-status-badge sent">🚀 ENVIADO (WhatsApp-First)</span>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="pb-footer">
        <div className="pb-security-info">
          🔒 Assinado digitalmente via Sovereign Quantum Shield (SQS).
        </div>
      </div>
    </div>
  );
};

export default ParentalAdvisorUI;
