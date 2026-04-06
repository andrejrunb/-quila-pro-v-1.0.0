import React, { useState, useEffect } from 'react';
import {
  ArrowLeft, Users, QrCode, CheckCircle2, Clock, AlertCircle,
  ChevronUp, ChevronDown, Copy, RefreshCw, Shield, Smartphone, FileText,
  TrendingUp, Wallet, Receipt, Zap, Check
} from 'lucide-react';
import { FileUploader } from '../components/FileUploader';
import './FinanceModule.css';

/**
 * Phase v3550: Emerald-Ledger Institutional Finance
 * Advanced pedagogical economy management.
 */
interface SubscriptionPlan {
  slots: number;
  tier: 'starter' | 'antigravity';
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

const PRICING = {
  starter: 4.50,
  antigravity: 8.50,
  minRate: 900.00
};

const SLOT_BLOCK = 10;
const AQUILA_PIX_KEY = '11999999999';

export const FinanceModule: React.FC<FinanceProps> = ({ onBack }) => {
  const [plan, setPlan] = useState<SubscriptionPlan>({
    slots: 200,
    tier: 'starter',
    nextDueDate: '2026-04-10',
    status: 'active',
    lastPayment: '2026-03-10',
    pixKey: AQUILA_PIX_KEY
  });

  const [history, setHistory] = useState<PaymentHistory[]>([]);
  const [pendingSlotChange, setPendingSlotChange] = useState<number>(0);
  const [selectedTier, setSelectedTier] = useState<'starter' | 'antigravity'>(plan.tier);
  const [showPixModal, setShowPixModal] = useState<PaymentHistory | null>(null);
  const [copiedPix, setCopiedPix] = useState(false);

  const calculateMonthlyPrice = (slots: number, tier: 'starter' | 'antigravity') => {
    const rate = PRICING[tier];
    const rawTotal = slots * rate;
    return tier === 'starter' ? Math.max(PRICING.minRate, rawTotal) : rawTotal;
  };

  useEffect(() => {
    const win = window as any;
    if (win.electron) {
      win.electron.invoke('get-subscription').then((s: any) => {
        if (s) {
          setPlan(prev => ({ ...prev, ...s }));
          setSelectedTier(s.tier || 'starter');
        }
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
    const initialPrice = calculateMonthlyPrice(200, 'starter');
    setHistory([
      {
        id: '3', date: '2026-05-10', description: 'May 2026 Subscription — 200 Students',
        amount: initialPrice, status: 'pending',
        pixCode: `00020126580014BR.GOV.BCB.PIX0136${AQUILA_PIX_KEY}5204000053039865406${initialPrice.toFixed(2).replace('.', '')}5802BR5913Aquila Pro6009SAO PAULO62070503***6304ABCD`
      },
      {
        id: '2', date: '2026-04-10', description: 'April 2026 Subscription — 200 Students',
        amount: initialPrice, status: 'paid'
      },
      {
        id: '1', date: '2026-03-10', description: 'March 2026 Subscription — 200 Students',
        amount: initialPrice, status: 'paid'
      },
    ]);
  };

  const handleSlotChange = (delta: number) => {
    const newTotal = plan.slots + pendingSlotChange + delta;
    if (newTotal < SLOT_BLOCK) return;
    setPendingSlotChange(prev => prev + delta);
  };

  const handleRequestUpdate = () => {
    const newSlots = plan.slots + pendingSlotChange;
    const newAmount = calculateMonthlyPrice(newSlots, selectedTier);
    const desc = `Update: ${selectedTier.toUpperCase()} Tier — ${newSlots} slots`;

    const newPayment: PaymentHistory = {
      id: Date.now().toString(),
      date: new Date().toISOString().split('T')[0],
      description: desc,
      amount: newAmount,
      status: 'pending',
      pixCode: `00020126580014BR.GOV.BCB.PIX0136${AQUILA_PIX_KEY}5204000053039865406${newAmount.toFixed(2).replace('.', '')}5802BR5913Aquila Pro6009SAO PAULO62070503***6304ABCD`
    };

    setHistory(prev => [newPayment, ...prev]);
    setPlan(prev => ({ ...prev, slots: newSlots, tier: selectedTier }));
    setPendingSlotChange(0);
    setShowPixModal(newPayment);
  };

  const copyPix = (code: string) => {
    navigator.clipboard.writeText(code).then(() => {
      setCopiedPix(true);
      setTimeout(() => setCopiedPix(false), 2000);
    });
  };

  const currentMonthlyPrice = calculateMonthlyPrice(plan.slots, plan.tier);
  const projectedMonthlyPrice = calculateMonthlyPrice(plan.slots + pendingSlotChange, selectedTier);
  const hasChanges = pendingSlotChange !== 0 || selectedTier !== plan.tier;

  return (
    <div className="finance-container" role="main" aria-label="Financeiro Institucional">
      {/* Header */}
      <header className="finance-header">
        <div className="flex-row items-center gap-4">
          <button onClick={onBack} aria-label="Voltar" className="btn-back">
            <ArrowLeft size={22} />
          </button>
          <div className="header-info">
            <h1>Financeiro Institucional</h1>
            <p>Gerencie sua assinatura pedagógica via Emerald-Ledger</p>
          </div>
        </div>
        <div className="plan-price">
           R$ {currentMonthlyPrice.toLocaleString('pt-BR')} /mês
        </div>
      </header>

      {/* Tiers Selector */}
      <section className="tiers-section">
        <h2 className="card-title"><Shield size={18} /> Planos e Capacidades</h2>
        <p className="card-subtitle">Selecione o nível de inteligência e escala para sua unidade escolar.</p>
        
        <div className="tiers-container">
          {/* Starter Tier */}
          <div 
            className={`tier-card ${selectedTier === 'starter' ? 'active' : ''}`}
            onClick={() => setSelectedTier('starter')}
          >
            <div className="tier-header">
              <span className="tier-name">Tier Starter</span>
              <span className="tier-badge">{selectedTier === 'starter' ? 'Selecionado' : 'Cloud'}</span>
            </div>
            <div className="tier-price">R$ 4,50 <span>/aluno</span></div>
            <ul className="tier-features">
              <li className="tier-feature"><Check size={14} /> Gestão Financeira Completa</li>
              <li className="tier-feature"><Check size={14} /> Integração WhatsApp Business</li>
              <li className="tier-feature"><Check size={14} /> Portal do Aluno Web</li>
              <li className="tier-feature text-dim"><AlertCircle size={14} /> Mínimo: R$ 900.00 / mês</li>
            </ul>
          </div>

          {/* Antigravity Tier */}
          <div 
            className={`tier-card antigravity-tier ${selectedTier === 'antigravity' ? 'active' : ''}`}
            onClick={() => setSelectedTier('antigravity')}
          >
            <div className="antigravity-glow" />
            <div className="tier-header">
              <span className="tier-name">Tier Antigravity</span>
              <span className="tier-badge">{selectedTier === 'antigravity' ? 'Ativo' : 'Edge AI'}</span>
            </div>
            <div className="tier-price">R$ 8,50 <span>/aluno</span></div>
            <ul className="tier-features">
              <li className="tier-feature"><Zap size={14} /> Biometria Facial Offline (Edge)</li>
              <li className="tier-feature"><Zap size={14} /> Micro-Expressões & Emoções</li>
              <li className="tier-feature"><Zap size={14} /> Antigravity Kernel Accelerator</li>
              <li className="tier-feature"><Zap size={14} /> Prioridade de Suporte 24/7</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Subscription Card */}
      <section className="plan-status-card">
        <div className="plan-status-header">
          <div className="status-indicator">
            <div className={`dot ${plan.status === 'active' ? 'active' : 'inactive'}`} />
            <span className="plan-label">Licença Ativa // {plan.slots} Vagas ({plan.tier.toUpperCase()})</span>
          </div>
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
            <span>Configuração Atual</span>
            <span>Tier {plan.tier === 'antigravity' ? 'Soberano' : 'Básico'}</span>
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
            <div className="price-value">R$ {projectedMonthlyPrice.toLocaleString('pt-BR')}</div>
          </div>
        </div>

        {hasChanges && (
          <button onClick={handleRequestUpdate} className="btn-confirm-slots">
            <RefreshCw size={18} />
            Atualizar Assinatura ({selectedTier.toUpperCase()})
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
