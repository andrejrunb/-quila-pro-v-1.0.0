import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { CheckCircle, Clock, AlertTriangle, CreditCard, ChevronRight } from 'lucide-react';
import './FinancialGlass.css';

interface BillingEntry {
  id: string;
  studentId: string;
  studentName: string;
  amount: number;
  dueDate: string;
  status: 'pending' | 'paid' | 'overdue';
  pixCode: string;
  auditSignature?: string;
}

const FinancialGlass: React.FC = () => {
  const [bills, setBills] = useState<BillingEntry[]>([]);
  const [selectedBill, setSelectedBill] = useState<BillingEntry | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBills();
  }, []);

  const loadBills = async () => {
    setLoading(true);
    try {
      const data = await (window as any).electron.invoke('get-billing-history');
      setBills(data);
    } catch (err) {
      console.error('Failed to load billing:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmPayment = async (id: string) => {
    try {
      await (window as any).electron.invoke('confirm-billing-payment', id);
      setShowConfetti(true);
      setTimeout(() => {
        setShowConfetti(false);
        loadBills();
        setSelectedBill(null);
      }, 3000);
    } catch (err) {
      console.error('Payment confirmation failed:', err);
    }
  };

  if (loading) return <div className="finance-loading">Autenticando Ledger Financeiro...</div>;

  return (
    <div className="finance-container">
      {showConfetti && <div className="confetti-overlay"><div className="confetti-piece"></div><div className="confetti-piece"></div><div className="confetti-piece"></div><div className="confetti-piece"></div><div className="confetti-piece"></div></div>}
      
      <header className="finance-header">
        <div className="header-info">
          <h1>Financial Glass</h1>
          <p>Transparência total no faturamento via PIX Soberano</p>
        </div>
        <div className="balance-card">
          <span>PENDENTE TOTAL</span>
          <h3>R$ {bills.filter(b => b.status !== 'paid').reduce((acc, b) => acc + b.amount, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
        </div>
      </header>

      <div className="billing-grid">
        <div className="bills-list">
          {bills.map(bill => (
            <div 
              key={bill.id} 
              className={`bill-item ${bill.status} ${selectedBill?.id === bill.id ? 'selected' : ''}`}
              onClick={() => setSelectedBill(bill)}
            >
              <div className="bill-icon">
                {bill.status === 'paid' ? <CheckCircle color="#00ffcc" /> : <Clock color="#ffbb33" />}
              </div>
              <div className="bill-main">
                <span className="student-name">{bill.studentName}</span>
                <span className="due-date">Vencimento: {new Date(bill.dueDate).toLocaleDateString('pt-BR')}</span>
              </div>
              <div className="bill-amount">
                R$ {bill.amount.toFixed(2)}
              </div>
              <ChevronRight size={16} color="rgba(255,255,255,0.3)" />
            </div>
          ))}
        </div>

        <div className="bill-details">
          {selectedBill ? (
            <div className="details-glass">
              <h2>Detalhes da Fatura</h2>
              <div className="details-row">
                <span>Status:</span>
                <span className={`status-pill ${selectedBill.status}`}>{selectedBill.status.toUpperCase()}</span>
              </div>
              <div className="details-row">
                <span>Valor:</span>
                <span className="amount-highlight">R$ {selectedBill.amount.toFixed(2)}</span>
              </div>

              {selectedBill.status !== 'paid' ? (
                <div className="pix-section">
                  <div className="qr-container">
                    <QRCodeSVG value={selectedBill.pixCode} size={180} />
                  </div>
                  <div className="pix-token">
                    <label>TOKEN PIX (COPIA E COLA)</label>
                    <div className="token-box">{selectedBill.pixCode}</div>
                  </div>
                  <button className="confirm-btn" onClick={() => handleConfirmPayment(selectedBill.id)}>
                    Confirmar Recebimento (Simulado)
                  </button>
                </div>
              ) : (
                <div className="paid-confirmation">
                  <CheckCircle size={64} color="#00ffcc" />
                  <h3>Pagamento Confirmado</h3>
                  <div className="audit-proof">
                    <div className="proof-label">🔐 SELO DE AUDITORIA ÁQUILA</div>
                    <div className="proof-hash" title={selectedBill.auditSignature}>
                      {selectedBill.auditSignature || 'LEGACY_RECORD_UNVERIFIED'}
                    </div>
                  </div>
                  <p>ID: {selectedBill.id.substring(0, 8)}</p>
                  <button className="receipt-btn" onClick={() => window.print()}>Imprimir Comprovante</button>
                </div>
              )}
            </div>
          ) : (
            <div className="empty-details">
              <CreditCard size={48} opacity={0.2} />
              <p>Selecione uma fatura para visualizar o QR Code e confirmar o pagamento.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FinancialGlass;
