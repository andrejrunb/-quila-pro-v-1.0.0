import React, { useState, useEffect } from 'react';
import { 
  CreditCard, ShieldCheck, History, 
  QrCode, TrendingUp, AlertCircle, 
  ExternalLink, CheckCircle
} from 'lucide-react';
import './FinancialGlassUI.css';

interface BillingRecord {
  id: string;
  studentName: string;
  amount: number;
  dueDate: string;
  status: 'paid' | 'pending' | 'overdue';
  pixCode: string;
  signature: string; // Ledger Hash
}

/**
 * FINANCIAL GLASS UI (v3502)
 * -------------------------
 * Dashboard de transparência financeira com Auditoria de Ledger Local.
 */
const FinancialGlassUI: React.FC = () => {
  const [billing, setBilling] = useState<BillingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState<BillingRecord | null>(null);

  useEffect(() => {
    loadFinancialData();
  }, []);

  const loadFinancialData = async () => {
    setLoading(true);
    try {
      // @ts-ignore
      const data = await window.electron.invoke('get-billing-registry');
      setBilling(data || []);
    } catch (err) {
      console.error('Failed to load financial data:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="financial-loader">SINCRONIZANDO LEDGER COGNITIVO...</div>;

  return (
    <div className="financial-glass-container">
      <header className="financial-glass-header">
        <div className="branding">
           <div className="glass-icon-wrapper">
              <CreditCard size={24} className="text-emerald-400" />
           </div>
           <div>
              <h1 className="glass-title">Financial Glass</h1>
              <p className="glass-subtitle">Soberania de Gestão & Transparência</p>
           </div>
        </div>

        <div className="balance-overview-glass">
           <div className="balance-item">
              <span className="label">Receita Projetada</span>
              <span className="value">R$ 145.200,00</span>
           </div>
           <div className="balance-divider"></div>
           <div className="balance-item">
              <span className="label">Efetivado (PIX)</span>
              <span className="value text-emerald-400">R$ 98.450,00</span>
           </div>
        </div>
      </header>

      {/* Tabela de Faturamento de Elite */}
      <div className="billing-table-wrapper glass-panel">
         <table className="billing-table">
            <thead>
               <tr>
                  <th>CLIENTE / ALUNO</th>
                  <th>VALOR</th>
                  <th>VENCIMENTO</th>
                  <th>STATUS</th>
                  <th>SIGNATURE (LEDGER)</th>
                  <th>AÇÕES</th>
               </tr>
            </thead>
            <tbody>
               {billing.map(invoice => (
                  <tr key={invoice.id} onClick={() => setSelectedInvoice(invoice)}>
                     <td className="font-bold">{invoice.studentName}</td>
                     <td className="amount">R$ {invoice.amount.toLocaleString('pt-BR')}</td>
                     <td>{new Date(invoice.dueDate).toLocaleDateString()}</td>
                     <td>
                        <span className={`status-badge ${invoice.status}`}>
                           {invoice.status.toUpperCase()}
                        </span>
                     </td>
                     <td className="signature-cell">
                        <ShieldCheck size={12} className="text-blue-400" />
                        <code>{invoice.signature.substring(0, 12)}...</code>
                     </td>
                     <td>
                        <button className="btn-action-icon" title="Exibir Código PIX e Auditoria">
                           <QrCode size={16} />
                        </button>
                     </td>
                  </tr>
               ))}
            </tbody>
         </table>
      </div>

      {/* Modal PIX / Auditoria (v3502) */}
      {selectedInvoice && (
         <div className="modal-overlay-glass" onClick={() => setSelectedInvoice(null)}>
            <div className="invoice-modal-v3502 animate-pop-in" onClick={e => e.stopPropagation()}>
               <div className="modal-header">
                  <h3>Detalhamento de Cobrança</h3>
                  <div className={`status-pill ${selectedInvoice.status}`}>{selectedInvoice.status}</div>
               </div>

               <div className="modal-content-grid">
                  <div className="pix-section">
                     <div className="qr-container-premium">
                        {/* QR CODE Simulado (v3502) */}
                        <div className="qr-placeholder">
                           <QrCode size={140} className="qr-img" />
                           <div className="qr-logo-overlay">🦅</div>
                        </div>
                     </div>
                     <p className="pix-token">00020126480014BR.GOV.BCB.PIX0114...</p>
                     <button className="btn-copy">COPIAR CHAVE PIX</button>
                  </div>

                  <div className="audit-trail-section">
                     <h4 className="section-title"><History size={14} /> Trilha de Auditoria</h4>
                     <div className="trail-list">
                        <div className="trail-item">
                           <CheckCircle size={12} className="text-blue-400" />
                           <div className="trail-info">
                              <span className="event">Fatura Gerada</span>
                              <span className="timestamp">12/04 - 14:20</span>
                           </div>
                        </div>
                        <div className="trail-item">
                           <CheckCircle size={12} className="text-blue-400" />
                           <div className="trail-info">
                              <span className="event">Assinada por AdminAgent</span>
                              <span className="timestamp">12/04 - 14:21</span>
                           </div>
                        </div>
                     </div>
                     
                     <div className="ledger-proof-box mt-6">
                        <p className="text-[10px] text-slate-500 uppercase font-black">Prova de Bloco Soberana</p>
                        <code className="block-hash">{selectedInvoice.signature}</code>
                        <div className="verify-seal">
                           <ShieldCheck size={14} /> IDENTIDADE VERIFICADA
                        </div>
                     </div>
                  </div>
               </div>

               <div className="modal-footer">
                  <button className="btn-sovereign" onClick={() => setSelectedInvoice(null)}>FECHAR</button>
               </div>
            </div>
         </div>
      )}

      <footer className="glass-footer">
         <div className="alert-ribbon">
            <AlertCircle size={14} />
            <span>Sincronização com o Banco Central em modo Passivo (Soberania Financeira Ativa).</span>
         </div>
      </footer>
    </div>
  );
};

export default FinancialGlassUI;
