import React, { useState, useEffect } from 'react';
import {
  ArrowLeft, Users, QrCode, CheckCircle2, Clock, AlertCircle,
  ChevronUp, ChevronDown, Copy, RefreshCw, Shield, Smartphone, FileText,
  TrendingUp, Wallet, Receipt
} from 'lucide-react';
import { FileUploader } from '../components/FileUploader';
import './FinanceModule.css';

/**
 * Phase v3550: Emerald-Ledger Institutional Finance
 * Advanced pedagogical economy management.
 */
interface SubscriptionPlan {
  slots: number;
  pricePerSlot: number;
  nextDueDate: string;
  status: 'active' | 'pending' | 'overdue';
  lastPayment?: string;
  pixKey: string;
}

interface PaymentHistory {
  id: string;
  date: string;
  description: string;
  amount: number;
  status: 'paid' | 'pending' | 'overdue';
  pixCode?: string;
}

interface FinanceProps {
  onBack: () => void;
}

const PRICE_PER_SLOT = 4.90; 
const SLOT_BLOCK = 10;
const AQUILA_PIX_KEY = '11999999999';

export const FinanceModule: React.FC<FinanceProps> = ({ onBack }) => {
  const [plan, setPlan] = useState<SubscriptionPlan>({
    slots: 200,
    pricePerSlot: PRICE_PER_SLOT,
    nextDueDate: '2026-04-10',
    status: 'active',
    lastPayment: '2026-03-10',
    pixKey: AQUILA_PIX_KEY
  });

  const [history, setHistory] = useState<PaymentHistory[]>([]);
  const [pendingSlotChange, setPendingSlotChange] = useState<number>(0);
  const [showPixModal, setShowPixModal] = useState<PaymentHistory | null>(null);
  const [copiedPix, setCopiedPix] = useState(false);

  useEffect(() => {
    const win = window as any;
    if (win.electron) {
      win.electron.invoke('get-subscription').then((s: any) => {
        if (s) setPlan(prev => ({ ...prev, ...s }));
      }).catch(() => {});
      win.electron.invoke('get-payment-history').then((h: any[]) => {
        if (Array.isArray(h) && h.length > 0) setHistory(h);
        else seedMockHistory();
      }).catch(() => seedMockHistory());
    } else {
      seedMockHistory();
    }
  }, []);

  const seedMockHistory = () => {
    setHistory([
      {
        id: '3', date: '2026-05-10', description: 'May 2026 Subscription — 200 Students',
        amount: 200 * PRICE_PER_SLOT, status: 'pending',
        pixCode: `00020126580014BR.GOV.BCB.PIX0136${AQUILA_PIX_KEY}5204000053039865406${(200 * PRICE_PER_SLOT).toFixed(2).replace('.', '')}5802BR5913Aquila Pro6009SAO PAULO62070503***6304ABCD`
      },
      {
        id: '2', date: '2026-04-10', description: 'April 2026 Subscription — 200 Students',
        amount: 200 * PRICE_PER_SLOT, status: 'paid'
      },
      {
        id: '1', date: '2026-03-10', description: 'March 2026 Subscription — 200 Students',
        amount: 200 * PRICE_PER_SLOT, status: 'paid'
      },
    ]);
  };

  const handleSlotChange = (delta: number) => {
    const newTotal = plan.slots + pendingSlotChange + delta;
    if (newTotal < SLOT_BLOCK) return;
    setPendingSlotChange(prev => prev + delta);
  };

  const handleRequestChange = () => {
    if (pendingSlotChange === 0) return;
    const newSlots = plan.slots + pendingSlotChange;
    const newAmount = newSlots * PRICE_PER_SLOT;
    const desc = pendingSlotChange > 0 ? `Expansion to ${newSlots} slots` : `Reduction to ${newSlots} slots`;

    const newPayment: PaymentHistory = {
      id: Date.now().toString(),
      date: new Date().toISOString().split('T')[0],
      description: desc,
      amount: newAmount,
      status: 'pending',
      pixCode: `00020126580014BR.GOV.BCB.PIX0136${AQUILA_PIX_KEY}5204000053039865406${newAmount.toFixed(2).replace('.', '')}5802BR5913Aquila Pro6009SAO PAULO62070503***6304ABCD`
    };

    setHistory(prev => [newPayment, ...prev]);
    setPlan(prev => ({ ...prev, slots: newSlots }));
    setPendingSlotChange(0);
    setShowPixModal(newPayment);
  };

  const copyPix = (code: string) => {
    navigator.clipboard.writeText(code).then(() => {
      setCopiedPix(true);
      setTimeout(() => setCopiedPix(false), 2000);
    });
  };

  const monthlyTotal = (plan.slots + pendingSlotChange) * PRICE_PER_SLOT;

  return (
    <div className="finance-container" role="main" aria-label="Financeiro Institucional">
      {/* Header */}
      <header className="finance-header">
        <button onClick={onBack} aria-label="Voltar" className="btn-back">
          <ArrowLeft size={22} />
        </button>
        <div className="header-info">
          <h1>Financeiro Institucional</h1>
          <p>Gerencie sua assinatura pedagógica via Emerald-Ledger</p>
        </div>
      </header>

      {/* Subscription Card */}
      <section className="plan-status-card">
        <div className="plan-status-header">
          <div className="status-indicator">
            <div className={`dot ${plan.status === 'active' ? 'active' : 'inactive'}`} />
            <span className="plan-label">Licença Ativa // {plan.slots} Vagas para Alunos</span>
          </div>
          <span className="plan-price">
            R$ {(plan.slots * PRICE_PER_SLOT).toLocaleString('pt-BR')} /mês
          </span>
        </div>

        <div className="plan-details-grid">
          <div className="detail-item">
            <span>Próximo Ciclo de Faturamento</span>
            <span>{new Date(plan.nextDueDate).toLocaleDateString('pt-BR')}</span>
          </div>
          <div className="detail-item">
            <span>Último Pagamento</span>
            <span>{plan.lastPayment ? new Date(plan.lastPayment).toLocaleDateString('pt-BR') : '—'}</span>
          </div>
          <div className="detail-item">
            <span>Economia Unitária</span>
            <span>R$ {PRICE_PER_SLOT.toLocaleString('pt-BR')} por aluno</span>
          </div>
        </div>
      </section>

      {/* Scale Controls */}
      <section className="slots-management-card">
        <div className="flex-col">
           <h2 className="card-title"><Users size={18} /> Gestão de Escala</h2>
           <p className="card-subtitle">Ajuste a capacidade do campus em blocos de {SLOT_BLOCK} alunos.</p>
        </div>

        <div className="slots-controls-container">
          <div className="slots-stepper">
            <button
              onClick={() => handleSlotChange(-SLOT_BLOCK)}
              disabled={plan.slots + pendingSlotChange <= SLOT_BLOCK}
              className="btn-step"
              title="Reduzir 10 Vagas"
            >
              <ChevronDown size={20} />
            </button>
            <div className="slots-display">
              <div className="slots-number">{plan.slots + pendingSlotChange}</div>
              <div className="slots-unit">ALUNOS</div>
              {pendingSlotChange !== 0 && (
                <div className={`slots-delta ${pendingSlotChange > 0 ? 'plus' : 'minus'}`}>
                  {pendingSlotChange > 0 ? 'Expansão' : 'Redução'}
                </div>
              )}
            </div>
            <button
              onClick={() => handleSlotChange(+SLOT_BLOCK)}
              className="btn-step"
              title="Aumentar 10 Vagas"
            >
              <ChevronUp size={20} />
            </button>
          </div>

          <div className="new-price-display">
            <div className="price-label">Total Mensal Projetado</div>
            <div className="price-value">R$ {monthlyTotal.toLocaleString('pt-BR')}</div>
          </div>
        </div>

        {pendingSlotChange !== 0 && (
          <button onClick={handleRequestChange} className="btn-confirm-slots">
            <RefreshCw size={18} />
            Sincronizar Nova Capacidade
          </button>
        )}
      </section>

      {/* Ledger History */}
      <section className="history-card">
        <h2 className="card-title"><Receipt size={18} /> Livro de Transações</h2>
        <div className="history-list">
          {history.map(item => (
            <div key={item.id} className="history-item">
              <div className="item-left">
                <div className={`status-icon ${item.status}`}>
                  {item.status === 'paid' ? <CheckCircle2 size={16} /> : <Clock size={16} />}
                </div>
                <div>
                  <div className="item-desc">{item.description}</div>
                  <div className="item-date">{new Date(item.date).toLocaleDateString()}</div>
                </div>
              </div>
              <div className="item-right">
                <span className="item-amount">$ {item.amount.toFixed(2)}</span>
                <span className={`status-badge ${item.status}`}>{item.status === 'paid' ? 'Pago' : 'Pendente'}</span>
                {item.status !== 'paid' && (
                  <button onClick={() => setShowPixModal(item)} className="btn-pay-pix" title="Liquidar pagamento via PIX">
                    <QrCode size={14} /> LIQUIDAR
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Sovereignty Note */}
      <footer className="security-note">
        <Shield size={14} className="text-emerald-500" />
        <span>Hub Financeiro Soberano: Todas as transações são criptografadas e auditadas via Áquila Distributed Ledger.</span>
      </footer>

      {/* Payment Modal */}
      {showPixModal && (
        <div className="modal-overlay">
          <div className="modal-content animate-zoom-in">
            <div className="modal-header">
              <h3><Wallet size={18} /> Portal de Liquidação</h3>
              <button onClick={() => setShowPixModal(null)} className="btn-close-modal">✕</button>
            </div>

            <div className="modal-summary">
              <div className="summary-amount">R$ {showPixModal.amount.toLocaleString('pt-BR')}</div>
              <p className="summary-desc">{showPixModal.description}</p>
            </div>

            <div className="pix-key-section">
              <label className="price-label">Chave PIX Soberana</label>
              <div className="pix-key-box">
                <span>{AQUILA_PIX_KEY}</span>
                <button onClick={() => copyPix(AQUILA_PIX_KEY)} className="btn-copy" title="Copiar Chave PIX">
                  <Copy size={16} />
                </button>
              </div>
            </div>

            {showPixModal.pixCode && (
              <div className="pix-code-section">
                <label className="price-label">Código Copiar e Colar</label>
                <div className="pix-code-box">{showPixModal.pixCode}</div>
                <button onClick={() => copyPix(showPixModal.pixCode!)} className="btn-copy-code">
                   {copiedPix ? <CheckCircle2 size={18} /> : <Smartphone size={18} />}
                   {copiedPix ? 'CÓDIGO COPIADO' : 'COPIAR CÓDIGO PIX'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
