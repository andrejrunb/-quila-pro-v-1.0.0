import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  ArrowLeft, Users, QrCode, CheckCircle2, Clock, AlertCircle,
  ChevronUp, ChevronDown, Copy, RefreshCw, Shield, Smartphone, FileText,
  TrendingUp, Wallet, Receipt, Zap, Check, Building2, GraduationCap,
  Crown, Star, Percent, Globe, Sparkles, X,
  MessageCircle, BarChart, ExternalLink, Calculator, ShieldAlert, History
} from 'lucide-react';
import { FileUploader } from '../components/FileUploader';
import { useToast } from '../hooks/ToastContext';
import './FinanceModule.css';

/**
 * Financeiro Escolar (v1.5.0)
 * Sistema de Precificação Dinâmica — Escola Pública vs Privada
 */

// ─── Types ─────────────────────────────────────────────────
type SchoolType = 'private' | 'public';
type PlanTier = 'starter' | 'professional' | 'sovereign';

interface TierConfig {
  id: PlanTier;
  name: string;
  tagline: string;
  basePrice: number;
  icon: React.ReactNode;
  color: string;
  glowColor: string;
  features: { label: string; included: boolean }[];
  popular?: boolean;
}

interface SubscriptionPlan {
  slots: number;
  tier: PlanTier;
  schoolType: SchoolType;
  nextDueDate: string;
  status: 'active' | 'pending' | 'overdue';
  lastPayment?: string;
  pixKey: string;
  unitCount: number;
}

interface StudentDebt {
  id: string;
  studentName: string;
  status: 'paid' | 'pending' | 'overdue';
  amount: number;
  dueDate: string;
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

// ─── Pricing Engine ────────────────────────────────────────
const PUBLIC_DISCOUNT = 0.40; // 40% desconto governamental
const MULTI_UNIT_DISCOUNT = 0.10; // 10% a partir da 2ª unidade
const AQUILA_PIX_KEY = '11999999999';

const TIERS: TierConfig[] = [
  {
    id: 'starter',
    name: 'Essencial',
    tagline: 'Gestão escolar fundamental',
    basePrice: 4.50,
    icon: <Star size={22} />,
    color: '#10b981',
    glowColor: 'rgba(16, 185, 129, 0.15)',
    features: [
      { label: 'Gestão Financeira Completa', included: true },
      { label: 'Portal do Aluno Web', included: true },
      { label: 'Integração WhatsApp Business', included: true },
      { label: 'Relatórios Básicos', included: true },
      { label: 'Dashboard de Coordenação', included: false },
      { label: 'Frequência Facial Offline', included: false },
      { label: 'Auditoria Cruzada (IA)', included: false },
      { label: 'Reconhecimento de Ocorrências', included: false },
      { label: 'Suporte Prioritário 24/7', included: false },
    ],
  },
  {
    id: 'professional',
    name: 'Professional',
    tagline: 'Inteligência pedagógica avançada',
    basePrice: 6.50,
    icon: <GraduationCap size={22} />,
    color: '#3b82f6',
    glowColor: 'rgba(59, 130, 246, 0.15)',
    popular: true,
    features: [
      { label: 'Gestão Financeira Completa', included: true },
      { label: 'Portal do Aluno Web', included: true },
      { label: 'Integração WhatsApp Business', included: true },
      { label: 'Relatórios Avançados', included: true },
      { label: 'Dashboard de Coordenação', included: true },
      { label: 'Frequência Facial Offline', included: true },
      { label: 'Auditoria Cruzada (IA)', included: true },
      { label: 'Reconhecimento de Ocorrências', included: false },
      { label: 'Suporte Prioritário 24/7', included: false },
    ],
  },
  {
    id: 'sovereign',
    name: 'Sovereign',
    tagline: 'Controle total com IA soberana',
    basePrice: 8.50,
    icon: <Crown size={22} />,
    color: '#a855f7',
    glowColor: 'rgba(168, 85, 247, 0.15)',
    features: [
      { label: 'Gestão Financeira Completa', included: true },
      { label: 'Portal do Aluno Web', included: true },
      { label: 'Integração WhatsApp Business', included: true },
      { label: 'Relatórios Preditivos com IA', included: true },
      { label: 'Dashboard de Coordenação', included: true },
      { label: 'Frequência Facial Offline', included: true },
      { label: 'Auditoria Cruzada (IA)', included: true },
      { label: 'Reconhecimento de Ocorrências', included: true },
      { label: 'Suporte Prioritário 24/7', included: true },
    ],
  },
];

const MIN_STUDENTS = 20;
const MAX_STUDENTS = 2000;

// ─── Price Calculator ──────────────────────────────────────
function calculatePrice(
  tier: PlanTier,
  students: number,
  schoolType: SchoolType,
  unitCount: number,
): { monthly: number; perStudent: number; discount: number; originalMonthly: number } {
  const tierConfig = TIERS.find((t) => t.id === tier)!;
  const basePerStudent = tierConfig.basePrice;
  let discountPercent = 0;

  // Desconto governamental
  if (schoolType === 'public') {
    discountPercent += PUBLIC_DISCOUNT * 100;
  }

  // Desconto multi-unidade
  if (unitCount > 1) {
    discountPercent += MULTI_UNIT_DISCOUNT * 100;
  }

  const effectiveDiscount = Math.min(discountPercent, 50) / 100; // cap 50%
  const discountedPrice = basePerStudent * (1 - effectiveDiscount);
  const originalMonthly = basePerStudent * students;
  const monthly = discountedPrice * students;

  // Mínimo para escolas privadas starter
  const minRate = schoolType === 'private' && tier === 'starter' ? 900 : 0;
  const finalMonthly = Math.max(minRate, monthly);

  return {
    monthly: finalMonthly,
    perStudent: discountedPrice,
    discount: effectiveDiscount * 100,
    originalMonthly,
  };
}

// ─── Component ─────────────────────────────────────────────
export const FinanceModule: React.FC<FinanceProps> = ({ onBack }) => {
  const { showToast } = useToast();
  const [plan, setPlan] = useState<SubscriptionPlan>({
    slots: 200,
    tier: 'starter',
    schoolType: 'private',
    nextDueDate: '2026-05-10',
    status: 'active',
    lastPayment: '2026-04-10',
    pixKey: AQUILA_PIX_KEY,
    unitCount: 1,
  });

  const [history, setHistory] = useState<PaymentHistory[]>([]);
  const [selectedTier, setSelectedTier] = useState<PlanTier>(plan.tier);
  const [studentCount, setStudentCount] = useState(plan.slots);
  const [schoolType, setSchoolType] = useState<SchoolType>(plan.schoolType);
  const [region, setRegion] = useState<'capital' | 'interior'>('capital');
  const [unitCount, setUnitCount] = useState(plan.unitCount);
  const [livePricing, setLivePricing] = useState<any>(null);
  const [showPixModal, setShowPixModal] = useState<PaymentHistory | null>(null);
  const [copiedPix, setCopiedPix] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  const [roi, setRoi] = useState<any>(null);
  const [loadingRoi, setLoadingRoi] = useState(false);
  const [view, setView] = useState<'licensing' | 'student-fees' | 'automation'>('licensing');
  const [automationHistory, setAutomationHistory] = useState<any[]>([]);
  const [sendingMessage, setSendingMessage] = useState<string | null>(null);
  const [negotiationProposal, setNegotiationProposal] = useState<any | null>(null);
  const [isNegotiating, setIsNegotiating] = useState(false);
  const [studentDebts, setStudentDebts] = useState<StudentDebt[]>([
    { id: 'S1', studentName: 'André Santos', status: 'overdue', amount: 850.00, dueDate: '2026-04-10' },
    { id: 'S2', studentName: 'Beatriz Lima', status: 'pending', amount: 850.00, dueDate: '2026-05-10' },
    { id: 'S3', studentName: 'Carlos Oliveira', status: 'paid', amount: 850.00, dueDate: '2026-04-10' },
  ]);

  const [globalStats, setGlobalStats] = useState({
    totalRevenue: 0,
    pendingLiquidation: 0,
    highRiskCount: 0,
    riskPercentage: 0
  });
  const [radarData, setRadarData] = useState<any[]>([]);

  const pricing = useMemo(
    () => calculatePrice(selectedTier, studentCount, schoolType, unitCount),
    [selectedTier, studentCount, schoolType, unitCount],
  );

  const currentPricing = useMemo(
    () => calculatePrice(plan.tier, plan.slots, plan.schoolType, plan.unitCount),
    [plan],
  );

  const hasChanges =
    selectedTier !== plan.tier ||
    studentCount !== plan.slots ||
    schoolType !== plan.schoolType ||
    unitCount !== plan.unitCount;

  const fetchQuote = useCallback(async () => {
    const win = window as any;
    if (win.aquila) {
      try {
        const result = await win.aquila.invoke('finance:calculate-quote', {
          criteria: {
            type: schoolType,
            region,
            count: studentCount,
            planId: selectedTier,
            unitCount
          }
        });
        if (result.success) setLivePricing(result);
      } catch (err) {
        console.error('[Finance] Quote Error:', err);
      }
    }
  }, [selectedTier, studentCount, schoolType, region, unitCount]);

  useEffect(() => {
    fetchQuote();
  }, [fetchQuote]);

  const fetchROI = useCallback(async () => {
    const win = window as any;
    if (win.aquila) {
      setLoadingRoi(true);
      try {
        const result = await win.aquila.invoke('finance:calculate-roi', {
          studentCount,
          schoolType,
          unitCount
        });
        setRoi(result);
      } catch (err) {
        console.error('[Pricing] ROI Error:', err);
      } finally {
        setLoadingRoi(false);
      }
    }
  }, [studentCount, schoolType, unitCount]);

  useEffect(() => {
    fetchROI();
  }, [fetchROI]);

  const fetchBillingHistory = useCallback(async () => {
    const win = window as any;
    if (win.aquila) {
      try {
        const billingHistory = await win.aquila.invoke('finance:get-billing-history');
        if (Array.isArray(billingHistory)) {
          setHistory(billingHistory.map((h: any) => ({
            id: h.id,
            date: h.updatedAt.split('T')[0],
            description: `Faturamento Institucional - ${h.id}`,
            amount: h.amount,
            status: h.status,
            pixCode: h.pixCode
          })));
        }
      } catch (err) {
        console.error('[Finance] Error loading history:', err);
      }
    }
  }, []);

  const fetchGlobalStats = useCallback(async () => {
    const win = window as any;
    if (win.aquila) {
      try {
        const stats = await win.aquila.invoke('finance:get-stats');
        if (stats) {
          setGlobalStats(stats);
        }
      } catch (err) {
        console.error('[Finance] Stats Error:', err);
      }
    }
  }, []);

  const fetchRadarData = useCallback(async () => {
    const win = window as any;
    if (win.aquila) {
      try {
        const data = await win.aquila.invoke('churn:get-radar');
        if (data) {
          setRadarData(data);
        }
      } catch (err) {
        console.error('[Finance] Radar Error:', err);
      }
    }
  }, []);

  const fetchAutomationHistory = useCallback(async () => {
    const win = window as any;
    if (win.aquila) {
      try {
        const result = await win.aquila.invoke('whatsapp:get-history');
        if (result.success) setAutomationHistory(result.data);
      } catch (err) {
        console.error('[Finance] Automation History Error:', err);
      }
    }
  }, []);

  const sendWhatsAppReminder = async (studentId: string, type: 'REMINDER' | 'OVERDUE') => {
    const win = window as any;
    if (win.aquila) {
      setSendingMessage(studentId);
      try {
        const result = await win.aquila.invoke('whatsapp:send-billing', { studentId, messageType: type });
        if (result.success) {
          showToast('Lembrete enviado com sucesso!', 'success');
          fetchAutomationHistory();
        } else {
          showToast('Erro ao enviar mensagem: ' + (result.error || 'Falha no Córtex'), 'error');
        }
      } catch (err) {
        console.error('[Finance] Send WhatsApp Error:', err);
        showToast('Erro de comunicação com o WhatsApp Bridge.', 'error');
      } finally {
        setSendingMessage(null);
      }
    }
  };

  useEffect(() => {
    const win = window as any;
    if (win.aquila) {
      win.aquila.invoke('get-subscription').then((s: any) => {
        if (s) {
          setPlan((prev) => ({ ...prev, ...s }));
          setSelectedTier(s.tier || 'starter');
          setStudentCount(s.slots || 200);
          setSchoolType(s.schoolType || 'private');
          setUnitCount(s.unitCount || 1);
        }
      }).catch(() => {});
      fetchBillingHistory();
      fetchGlobalStats();
      fetchRadarData();
    }
  }, [fetchBillingHistory, fetchGlobalStats, fetchRadarData]);


  // Fetch de dados reais tratado no useEffect

  const handleGeneratePix = async (billingId: string) => {
    const win = window as any;
    if (win.aquila) {
      try {
        const pixCode = await win.aquila.invoke('finance:generate-pix', { billingId });
        const billing = history.find(h => h.id === billingId);
        if (billing) {
          setShowPixModal({ ...billing, pixCode });
        } else {
          // Fallback se não encontrar no estado local ainda
          setShowPixModal({
            id: billingId,
            date: new Date().toISOString().split('T')[0],
            description: `Faturamento Institucional - ${billingId}`,
            amount: livePricing?.totalValue || pricing.monthly,
            status: 'pending',
            pixCode
          });
        }
      } catch (err) {
        console.error('[Finance] Pix Generation Error:', err);
      }
    }
  };

  const handleConfirmChange = async () => {
    const win = window as any;
    if (win.aquila) {
      try {
        // Primeiro salvamos o perfil para garantir que o cálculo no backend bata com a UI
        await handleSaveProfile();
        
        // Geramos a cobrança real
        const schoolId = 'main_school'; 
        const result = await win.aquila.invoke('finance:generate-monthly-billing', { schoolId });
        
        if (result && result.billingId) {
          await fetchBillingHistory();
          handleGeneratePix(result.billingId);
        }
      } catch (err) {
        console.error('[Finance] Billing Generation Error:', err);
      }
    }
  };

  const handleSaveProfile = async () => {
    const win = window as any;
    if (win.aquila) {
      try {
        const success = await win.aquila.invoke('institution:update-profile', {
          type: schoolType,
          region,
          tier: selectedTier,
          slots: studentCount,
          unitCount
        });
        if (success) {
          showToast('Perfil Institucional atualizado com sucesso no Córtex!', 'success');
          fetchQuote();
        } else {
          showToast('Não foi possível salvar o perfil institucional.', 'warning');
        }
      } catch (err) {
        console.error('[Finance] Profile Update Error:', err);
        showToast('Erro crítico ao atualizar perfil institucional.', 'error');
      }
    }
  };

  const startNegotiation = async (debt: any) => {
    const win = window as any;
    if (win.aquila) {
      setIsNegotiating(true);
      setView('negotiation');
      try {
        const proposals = await win.aquila.invoke('finance:get-proposals', { 
          studentId: debt.studentId || debt.id, 
          totalDebt: debt.amount 
        });
        setNegotiationProposal(proposals);
        showToast('Negociação inteligente iniciada.', 'info');
      } catch (err) {
        console.error('[Finance] Negotiation Error:', err);
        showToast('Falha ao iniciar negociação inteligente.', 'error');
        setView('student-fees');
      } finally {
        setIsNegotiating(false);
      }
    }
  };

  const acceptSettlement = async (type: string) => {
    const win = window as any;
    if (win.aquila && negotiationProposal) {
      try {
        const result = await win.aquila.invoke('finance:accept-proposal', { 
          studentId: negotiationProposal.studentId, 
          type 
        });
        if (result.success) {
          showToast('Acordo formalizado e enviado via WhatsApp!', 'success');
          setView('student-fees');
          fetchGlobalStats();
        } else {
          showToast('Erro ao processar acordo: ' + (result.error || 'Erro desconhecido'), 'error');
        }
      } catch (err) {
        console.error('[Finance] Accept Proposal Error:', err);
        showToast('Erro de comunicação ao aceitar proposta.', 'error');
      }
    }
  };

  const handleGenerateBilling = async (studentId: string) => {
    const win = window as any;
    if (win.aquila) {
      try {
        const result = await win.aquila.invoke('finance:generate-monthly-billing', { schoolId: studentId });
        if (result.success) {
          showToast('Mensalidades geradas com sucesso!', 'success');
          fetchGlobalStats();
        } else {
          showToast('Erro ao gerar faturamento: ' + (result.error || 'Erro desconhecido'), 'error');
        }
      } catch (err) {
        console.error('[Finance] Generate Billing Error:', err);
        showToast('Erro crítico ao gerar faturamento institucional.', 'error');
      }
    }
  };

  const copyPix = (code: string) => {
    navigator.clipboard.writeText(code).then(() => {
      setCopiedPix(true);
      setTimeout(() => setCopiedPix(false), 2000);
    });
  };

  const formatCurrency = (v: number | undefined | null) => {
    if (typeof v !== 'number' || isNaN(v)) {
      return 'R$ 0,00';
    }
    return `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
  };

  return (
    <div className="finance-container" role="main" aria-label="Financeiro Institucional">
      {/* Header */}
      <header className="finance-header">
        <div className="flex-row items-center gap-4">
          <button onClick={onBack} aria-label="Voltar" className="btn-back">
            <ArrowLeft size={22} />
          </button>
          <div className="header-info">
            <h1 className="glass-title">Financial Glass</h1>
            <p>Planos dinâmicos para escolas públicas e privadas</p>
          </div>
        </div>
        <div className="plan-price">{formatCurrency(currentPricing.monthly)} /mês</div>
        <div className="view-switcher-finance">
          <button 
            className={`view-btn ${view === 'licensing' ? 'active' : ''}`}
            onClick={() => setView('licensing')}
          >
            Licenciamento Áquila
          </button>
          <button 
            className={`view-btn ${view === 'student-fees' ? 'active' : ''}`}
            onClick={() => setView('student-fees')}
          >
            Gestão de Mensalidades
          </button>
          <button 
            className={`view-btn ${view === 'automation' ? 'active' : ''}`}
            onClick={() => {
              setView('automation');
              fetchAutomationHistory();
            }}
          >
            Automação WhatsApp
          </button>
        </div>
      </header>

      <div className="finance-content-wrapper">
        {view === 'licensing' && (
          <div className="licensing-view animate-fade-in">
            
            {/* Global Stats Dashboard */}
            <section className="global-stats-dashboard">
              <div className="stat-card">
                <div className="stat-icon-wrapper revenue">
                  <TrendingUp size={20} />
                </div>
                <div className="stat-details">
                  <span className="stat-label">Receita Coletada</span>
                  <span className="stat-value">{formatCurrency(globalStats.totalRevenue)}</span>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon-wrapper pending">
                  <Clock size={20} />
                </div>
                <div className="stat-details">
                  <span className="stat-label">Liquidação Pendente</span>
                  <span className="stat-value">{formatCurrency(globalStats.pendingLiquidation)}</span>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon-wrapper churn">
                  <AlertCircle size={20} />
                </div>
                <div className="stat-details">
                  <span className="stat-label">Risco de Churn Sistema</span>
                  <span className="stat-value">{globalStats.riskPercentage}%</span>
                </div>
              </div>
            </section>

            {/* [SQA-FIN-404] Evasion Radar: Proactive Monitoring */}
            <section className="evasion-radar-section">
              <div className="radar-header">
                <div className="flex-row items-center gap-2">
                  <ShieldAlert className="pulse-icon text-critical" size={20} />
                  <h2 className="glass-subtitle">Evasion Radar</h2>
                </div>
                <div className="radar-status-badge">
                  <span className="radar-dot animate-pulse-critical" />
                  Live Audit
                </div>
              </div>

              <div className="radar-grid">
                {radarData.length > 0 ? (
                  radarData.map((item) => (
                    <div key={item.studentId} className={`radar-card ${item.riskLevel}`}>
                      <div className="radar-card-glow" />
                      <div className="radar-info">
                        <div className="flex-row justify-between items-start mb-3">
                          <div className="student-main-info">
                            <span className="student-name">{item.name}</span>
                            <span className="student-id">#{item.studentId.substring(0, 8)}</span>
                          </div>
                          <div className={`risk-badge ${item.riskLevel}`}>
                            {item.riskLevel.toUpperCase()}
                          </div>
                        </div>

                        <div className="radar-metrics">
                          <div className="metric">
                            <div className="flex-row justify-between mb-1">
                              <span className="label">Risco Pedagógico</span>
                              <span className="value">{item.riskScore}%</span>
                            </div>
                            <div className="risk-bar-bg">
                              <div 
                                className={`risk-bar-fill ${item.riskLevel}`} 
                                style={{ width: `${item.riskScore}%` }} 
                              />
                            </div>
                          </div>
                          <div className="metric">
                            <div className="flex-row justify-between mb-1">
                              <span className="label">Inadimplência</span>
                              <span className={`value ${item.hasDebt ? 'text-critical' : 'text-success'}`}>
                                {item.hasDebt ? formatCurrency(item.totalOverdue) : 'Regular'}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="radar-actions">
                          <button 
                            className="btn-intervene"
                            onClick={() => sendWhatsAppReminder(item.studentId, item.hasDebt ? 'OVERDUE' : 'REMINDER')}
                            disabled={sendingMessage === item.studentId}
                          >
                            <Zap size={14} /> {sendingMessage === item.studentId ? 'Enviando...' : 'Intervir Agora'}
                          </button>
                          <button className="btn-view-profile" title="Ver Perfil">
                            <ExternalLink size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="empty-radar glass-panel">
                    <CheckCircle2 className="text-success" size={40} />
                    <h3>Radar Limpo</h3>
                    <p>Nenhum aluno em risco crítico detectado no momento.</p>
                  </div>
                )}
              </div>
            </section>

      {/* School Type Toggle */}
      <section className="school-type-section">
        <div className="school-type-header">
          <h2 className="card-title"><Building2 size={18} /> Tipo de Instituição</h2>
          <p className="card-subtitle">Escolas públicas recebem desconto governamental automático de {PUBLIC_DISCOUNT * 100}%.</p>
        </div>

        <div className="school-type-toggle">
          <button
            className={`stype-btn ${schoolType === 'private' ? 'stype-active' : ''}`}
            onClick={() => setSchoolType('private')}
          >
            <Building2 size={18} />
            <div className="stype-text">
              <span className="stype-label">Escola Privada</span>
              <span className="stype-desc">Preço cheio, mínimo R$900/mês no Essencial</span>
            </div>
          </button>
          <button
            className={`stype-btn stype-public ${schoolType === 'public' ? 'stype-active' : ''}`}
            onClick={() => setSchoolType('public')}
          >
            <Globe size={18} />
            <div className="stype-text">
              <span className="stype-label">Escola Pública</span>
              <span className="stype-desc">Desconto governamental de {PUBLIC_DISCOUNT * 100}%</span>
            </div>
            {schoolType === 'public' && (
              <span className="gov-badge"><Shield size={10} /> GOV</span>
            )}
          </button>
        </div>

        {/* Region Toggle */}
        <div className="school-type-header" style={{ marginTop: '2rem' }}>
          <h2 className="card-title"><Globe size={18} /> Região da Unidade</h2>
          <p className="card-subtitle">Unidades em capitais possuem multiplicador de 1.15x (Custo Operacional Elite).</p>
        </div>
        <div className="school-type-toggle region-toggle">
          <button
            className={`stype-btn ${region === 'capital' ? 'stype-active' : ''}`}
            onClick={() => setRegion('capital')}
          >
            <div className="stype-text">
              <span className="stype-label">Capital / Metrópole</span>
              <span className="stype-desc">Multiplicador 1.15x</span>
            </div>
          </button>
          <button
            className={`stype-btn ${region === 'interior' ? 'stype-active' : ''}`}
            onClick={() => setRegion('interior')}
          >
            <div className="stype-text">
              <span className="stype-label">Interior / Litoral</span>
              <span className="stype-desc">Multiplicador 1.0x</span>
            </div>
          </button>
        </div>

        {/* Multi-unit */}
        <div className="unit-counter">
          <span className="unit-label">Unidades da rede:</span>
          <div className="unit-stepper">
            <button onClick={() => setUnitCount(Math.max(1, unitCount - 1))} className="btn-step-sm" title="Remover unidade">
              <ChevronDown size={14} />
            </button>
            <span className="unit-value">{unitCount}</span>
            <button onClick={() => setUnitCount(unitCount + 1)} className="btn-step-sm" title="Adicionar unidade">
              <ChevronUp size={14} />
            </button>
          </div>
          {unitCount > 1 && (
            <span className="multi-discount-badge"><Percent size={12} /> -{MULTI_UNIT_DISCOUNT * 100}% multi-unidade</span>
          )}
        </div>
      </section>

      {/* Tiers */}
      <section className="tiers-section">
        <div className="tiers-section-header">
          <h2 className="card-title"><Shield size={18} /> Planos e Capacidades</h2>
          <button className="btn-toggle-compare" onClick={() => setShowComparison(!showComparison)}>
            {showComparison ? 'Ver Cards' : 'Comparar tudo'}
          </button>
        </div>

        {!showComparison ? (
          <div className="tiers-container">
            {TIERS.map((tier) => {
              const tierPricing = calculatePrice(tier.id, studentCount, schoolType, unitCount);
              const isSelected = selectedTier === tier.id;
              return (
                <div
                  key={tier.id}
                  className={`tier-card ${isSelected ? 'active' : ''} tier-${tier.id}`}
                  onClick={() => setSelectedTier(tier.id)}
                  style={{ '--tier-color': tier.color, '--tier-glow': tier.glowColor } as React.CSSProperties}
                >
                  {tier.popular && <div className="popular-ribbon">MAIS POPULAR</div>}
                  <div className="tier-header">
                    <div className="tier-icon-box" style={{ color: tier.color }}>{tier.icon}</div>
                    <span className="tier-badge">{isSelected ? 'Selecionado' : 'Escolher'}</span>
                  </div>
                  <span className="tier-name">{tier.name}</span>
                  <span className="tier-tagline">{tier.tagline}</span>
                  <div className="tier-price-row">
                    <span className="tier-price-value">{formatCurrency(tierPricing.perStudent)}</span>
                    <span className="tier-price-unit">/aluno</span>
                    {tierPricing.discount > 0 && (
                      <span className="tier-original-price">
                        {formatCurrency(tier.basePrice)}
                      </span>
                    )}
                  </div>
                  {tierPricing.discount > 0 && (
                    <div className="tier-discount-badge">
                      <Percent size={12} /> -{tierPricing.discount.toFixed(0)}%
                      {schoolType === 'public' && ' Gov'}
                    </div>
                  )}
                  <div className="tier-monthly">
                    Mensal: <strong>{formatCurrency(tierPricing.monthly)}</strong>
                  </div>
                  <ul className="tier-features">
                    {tier.features.filter(f => f.included).map((f, i) => (
                      <li key={i} className="tier-feature">
                        <Check size={14} style={{ color: tier.color }} /> {f.label}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        ) : (
          /* Comparison Table */
          <div className="comparison-table">
            <div className="comparison-header">
              <div className="comparison-feature-col">Funcionalidade</div>
              {TIERS.map((t) => (
                <div key={t.id} className="comparison-tier-col" style={{ color: t.color }}>
                  {t.icon} {t.name}
                </div>
              ))}
            </div>
            {TIERS[2].features.map((feature, i) => (
              <div key={i} className="comparison-row">
                <div className="comparison-feature-col">{feature.label}</div>
                {TIERS.map((t) => (
                  <div key={t.id} className="comparison-tier-col">
                    {t.features[i]?.included ? (
                      <CheckCircle2 size={16} style={{ color: t.color }} />
                    ) : (
                      <X size={16} className="text-dim" />
                    )}
                  </div>
                ))}
              </div>
            ))}
            <div className="comparison-row comparison-price-row">
              <div className="comparison-feature-col">Preço/aluno</div>
              {TIERS.map((t) => {
                const tp = calculatePrice(t.id, studentCount, schoolType, unitCount);
                return (
                  <div key={t.id} className="comparison-tier-col comparison-price">
                    {formatCurrency(tp.perStudent)}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </section>


      {/* ROI Calculator Section */}
      <section className="roi-calculator-card">
        <div className="roi-header">
          <h2 className="card-title"><TrendingUp size={18} /> Análise de ROI Soberano</h2>
          <span className="roi-badge-live">LIVE ANALYTICS</span>
        </div>
        <p className="card-subtitle">Comparativo de economia real contra sistemas legados (fragmentados).</p>

        {loadingRoi ? (
          <div className="roi-loading"><RefreshCw size={24} className="spin" /> Calculando economia...</div>
        ) : roi ? (
          <div className="roi-content">
            <div className="roi-main-stat">
              <div className="roi-stat-group">
                <span className="roi-label">Economia Mensal Estimada</span>
                <span className="roi-value text-emerald-400">{formatCurrency(roi.savings)}</span>
              </div>
              <div className="roi-percentage-circle">
                <svg viewBox="0 0 36 36" className="circular-chart">
                  <path className="circle-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                  <path className="circle" strokeDasharray={`${roi.percentage}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                  <text x="18" y="20.35" className="percentage">{roi.percentage}%</text>
                </svg>
                <span className="roi-percentage-label">ROI POSITIVO</span>
              </div>
            </div>

            <div className="roi-breakdown">
              <div className="roi-item">
                <span className="roi-item-label">Sistemas Legados (Total)</span>
                <span className="roi-item-value text-red-400">{formatCurrency(roi.legacyTotal)}</span>
              </div>
              <div className="roi-item">
                <span className="roi-item-label">Áquila Pro (Hub Local)</span>
                <span className="roi-item-value text-blue-400">{formatCurrency(roi.aquilaMonthly)}</span>
              </div>
            </div>

            <div className="roi-comparison-details">
              <h4>Custos Fragmentados Substituídos:</h4>
              <ul className="roi-details-list">
                <li><Check size={12} /> Grade Horária (Urania/PowerCubus): {formatCurrency(roi.details.scheduling)}</li>
                <li><Check size={12} /> Mensageria (SMS/WhatsApp): {formatCurrency(roi.details.messaging)}</li>
                <li><Check size={12} /> Secretaria & Registros: {formatCurrency(roi.details.records)}</li>
                {roi.details.biometricsCloud > 0 && <li><Check size={12} /> Biometria em Nuvem: {formatCurrency(roi.details.biometricsCloud)}</li>}
              </ul>
            </div>
          </div>
        ) : (
          <div className="roi-placeholder">Selecione os parâmetros para calcular o ROI.</div>
        )}
      </section>

      {/* Student Slider */}
      <section className="slots-management-card">
        <h2 className="card-title"><Users size={18} /> Escala de Alunos</h2>
        <p className="card-subtitle">Deslize para ajustar a quantidade de alunos matriculados.</p>

        <div className="slider-container">
          <div className="slider-header">
            <span className="slider-min">{MIN_STUDENTS}</span>
            <span className="slider-current">{studentCount} alunos</span>
            <span className="slider-max">{MAX_STUDENTS}</span>
          </div>
          <input
            type="range"
            min={MIN_STUDENTS}
            max={MAX_STUDENTS}
            step={10}
            value={studentCount}
            onChange={(e) => setStudentCount(parseInt(e.target.value, 10))}
            className="student-slider"
            aria-label="Quantidade de alunos"
            title="Quantidade de alunos"
            style={{
              '--slider-progress': `${((studentCount - MIN_STUDENTS) / (MAX_STUDENTS - MIN_STUDENTS)) * 100}%`,
            } as React.CSSProperties}
          />
        </div>

        <div className="price-summary-row">
          <div className="price-summary-item">
            <span className="price-summary-label">Plano</span>
            <span className="price-summary-value" style={{ color: TIERS.find(t => t.id === selectedTier)?.color }}>
              {TIERS.find(t => t.id === selectedTier)?.name}
            </span>
          </div>
          <div className="price-summary-item">
            <span className="price-summary-label">Por aluno</span>
            <span className="price-summary-value">{formatCurrency(livePricing?.perStudent || pricing.perStudent)}</span>
          </div>
          <div className="price-summary-item">
            <span className="price-summary-label">Desconto</span>
            <span className="price-summary-value discount-value">
              {(livePricing?.discount || pricing.discount) > 0 ? `-${(livePricing?.discount || pricing.discount).toFixed(0)}%` : '—'}
            </span>
          </div>
          <div className="price-summary-item price-summary-total">
            <span className="price-summary-label">Mensal</span>
            <span className="price-summary-value">{formatCurrency(livePricing?.totalValue || pricing.monthly)}</span>
          </div>
        </div>

        <div className="finance-actions-group">
          {hasChanges && (
            <button onClick={handleConfirmChange} className="btn-confirm-slots">
              <Sparkles size={18} />
              GERAR COBRANÇA PIX — {formatCurrency(livePricing?.totalValue || pricing.monthly)}
            </button>
          )}
          
          <button onClick={handleSaveProfile} className="btn-save-profile">
            <Shield size={18} />
            DEFINIR COMO PERFIL OFICIAL (CÓRTEX)
          </button>
        </div>
      </section>

      {/* Current Plan Status */}
      <section className="plan-status-card">
        <div className="plan-status-header">
          <div className="status-indicator">
            <div className={`dot ${plan.status === 'active' ? 'active' : 'inactive'}`} />
            <span className="plan-label">
              Licença Ativa — {TIERS.find(t => t.id === plan.tier)?.name} — {plan.slots} Alunos
              {plan.schoolType === 'public' && ' (Pública)'}
            </span>
          </div>
          {plan.schoolType === 'public' && (
            <span className="gov-badge-lg"><Shield size={14} /> ESCOLA PÚBLICA</span>
          )}
        </div>

        <div className="plan-details-grid">
          <div className="detail-item">
            <span>Próximo Faturamento</span>
            <span>{new Date(plan.nextDueDate).toLocaleDateString('pt-BR')}</span>
          </div>
          <div className="detail-item">
            <span>Última Liquidação</span>
            <span>{plan.lastPayment ? new Date(plan.lastPayment).toLocaleDateString('pt-BR') : '—'}</span>
          </div>
          <div className="detail-item">
            <span>Unidades</span>
            <span>{plan.unitCount} unidade{plan.unitCount > 1 ? 's' : ''}</span>
          </div>
        </div>
      </section>

      {/* Billing History Table [SQA-FIN-402] */}
      <section className="billing-history-card">
        <div className="card-header-flex">
          <h2 className="card-title"><History size={18} /> Histórico de Faturamento Institucional</h2>
          <span className="history-badge">LATEST 12 MONTHS</span>
        </div>
        <div className="history-table-container">
          <table className="history-table">
            <thead>
              <tr>
                <th>Data</th>
                <th>Descrição</th>
                <th>Valor</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {history.length > 0 ? history.map((item) => (
                <tr key={item.id} className={`history-row ${item.status}`}>
                  <td>{new Date(item.date).toLocaleDateString('pt-BR')}</td>
                  <td>
                    <div className="history-desc-cell">
                      <span className="desc-main">{item.description}</span>
                      <span className="desc-id">{item.id}</span>
                    </div>
                  </td>
                  <td className="font-bold">{formatCurrency(item.amount)}</td>
                  <td>
                    <span className={`status-pill pill-${item.status}`}>
                      {item.status === 'paid' ? 'PAGO' : item.status === 'overdue' ? 'ATRASADO' : 'PENDENTE'}
                    </span>
                  </td>
                  <td>
                    {item.status !== 'paid' && (
                      <button 
                        className="btn-pay-pix" 
                        onClick={() => handleGeneratePix(item.id)}
                        title="Pagar via Pix"
                      >
                        <QrCode size={14} /> PAGAR
                      </button>
                    )}
                    {item.status === 'paid' && (
                      <button className="btn-receipt-view" title="Ver Recibo">
                        <Receipt size={14} /> RECIBO
                      </button>
                    )}
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="empty-history">
                    <Clock size={48} className="text-dim" />
                    <p>Nenhuma fatura gerada para esta unidade até o momento.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

          </div>
        )}
        {view === 'automation' && (
          <div className="automation-view animate-fade-in">
            <section className="automation-hub-section">
              <div className="section-header">
                <div className="flex-row items-center gap-2">
                  <MessageSquare className="text-primary" size={20} />
                  <h2 className="glass-subtitle">WhatsApp Billing Automation</h2>
                </div>
                <p className="card-subtitle">Fila de mensagens inteligentes e histórico de cobranças automáticas.</p>
              </div>

              <div className="automation-grid">
                <div className="automation-stats-row">
                  <div className="automation-stat-card glass-panel">
                    <span className="stat-label">Mensagens Hoje</span>
                    <span className="stat-value">{automationHistory.filter(m => m.timestamp?.includes(new Date().toISOString().split('T')[0])).length}</span>
                  </div>
                  <div className="automation-stat-card glass-panel">
                    <span className="stat-label">Taxa de Resposta</span>
                    <span className="stat-value">68%</span>
                  </div>
                  <div className="automation-stat-card glass-panel success">
                    <span className="stat-label">Acordos Fechados (AI)</span>
                    <span className="stat-value">12</span>
                  </div>
                </div>

                <div className="automation-history-list glass-panel">
                  <div className="history-header">
                    <h3>Histórico Recente</h3>
                    <button className="btn-refresh" onClick={fetchAutomationHistory}>
                      <RefreshCw size={14} /> Atualizar
                    </button>
                  </div>
                  
                  <div className="history-scroll-area">
                    {automationHistory.length > 0 ? (
                      automationHistory.map((msg, idx) => (
                        <div key={idx} className="history-item">
                          <div className="item-main">
                            <span className="item-name">{msg.studentId}</span>
                            <span className="item-type-badge">{msg.type}</span>
                          </div>
                          <div className="item-meta">
                            <span className="item-time">{new Date(msg.timestamp).toLocaleTimeString()}</span>
                            <span className={`item-status ${msg.status}`}>{msg.status.toUpperCase()}</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="empty-history">
                        <Clock size={32} />
                        <p>Nenhuma mensagem enviada hoje.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}

        {view === 'negotiation' && (
          <div className="negotiation-hub-view animate-fade-in">
            <header className="negotiation-header">
              <button className="btn-back" onClick={() => setView('student-fees')}>
                <ArrowLeft size={16} /> Voltar
              </button>
              <div className="title-area">
                <h2 className="glass-title">Centro de Negociação Inteligente</h2>
                <p className="card-subtitle">Utilizando o Córtex Financeiro para propostas éticas e sustentáveis.</p>
              </div>
            </header>

            {isNegotiating ? (
              <div className="negotiation-loading">
                <div className="ai-loader"></div>
                <p>Calculando propostas baseadas no perfil do aluno...</p>
              </div>
            ) : negotiationProposal && (
              <div className="negotiation-content">
                <div className="debt-summary glass-panel">
                  <span className="label">Dívida Original</span>
                  <span className="value">{formatCurrency(negotiationProposal.totalDebt)}</span>
                </div>

                <div className="proposals-grid">
                  {negotiationProposal.options.map((opt: any) => (
                    <div key={opt.type} className={`proposal-card glass-panel ${opt.type.toLowerCase()}`}>
                      <div className="card-accent"></div>
                      <h3 className="proposal-title">{opt.type}</h3>
                      <div className="proposal-details">
                        <div className="detail">
                          <span className="d-label">Parcelas</span>
                          <span className="d-value">{opt.installments}x</span>
                        </div>
                        <div className="detail">
                          <span className="d-label">Valor da Parcela</span>
                          <span className="d-value">{formatCurrency(opt.installmentValue)}</span>
                        </div>
                        {opt.discount > 0 && (
                          <div className="detail discount">
                            <span className="d-label">Desconto</span>
                            <span className="d-value">-{opt.discount}%</span>
                          </div>
                        )}
                      </div>
                      <div className="total-area">
                        <span className="total-label">Total do Acordo</span>
                        <span className="total-value">{formatCurrency(opt.totalValue)}</span>
                      </div>
                      <button className="btn-accept-proposal" onClick={() => acceptSettlement(opt.type)}>
                        Gerar Termo e Enviar
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}


        {view === 'student-fees' && (
          <div className="student-fees-view animate-fade-in">
            <div className="fees-grid">
              <div className="infinite-pix-card glass-panel">
                <div className="card-header-flex">
                  <h3 className="card-title"><Zap size={18} className="text-yellow-400" /> INFINITE PIX</h3>
                  <span className="ai-badge">AUTONOMOUS RECONCILIATION</span>
                </div>
                <p className="card-subtitle">O sistema monitora a conta bancária da escola e liquida mensalidades em milissegundos.</p>
                
                <div className="stats-row-mini">
                  <div className="s-mini-item">
                    <span className="s-mini-label">Conciliados (Mês)</span>
                    <span className="s-mini-value">242</span>
                  </div>
                  <div className="s-mini-item">
                    <span className="s-mini-label">Taxa de Sucesso</span>
                    <span className="s-mini-value">99.8%</span>
                  </div>
                </div>

                <div className="reconciliation-pulse">
                  <div className="pulse-dot"></div>
                  <span>Monitorando Transações via API Scoped...</span>
                </div>
              </div>

              <div className="ledger-card glass-panel">
                <h3 className="card-title"><BarChart size={18} /> Livro Razão de Alunos</h3>
                <div className="debt-list">
                  {studentDebts.map(debt => (
                    <div key={debt.id} className={`debt-item ${debt.status}`}>
                      <div className="debt-info">
                        <span className="d-name">{debt.studentName}</span>
                        <span className="d-date">Vencimento: {new Date(debt.dueDate).toLocaleDateString('pt-BR')}</span>
                      </div>
                      <div className="debt-actions">
                        <span className="d-amount">{formatCurrency(debt.amount)}</span>
                        {debt.status === 'overdue' && (
                          <div className="flex-row gap-2">
                            <button className="btn-whatsapp-dunning" onClick={() => sendWhatsAppReminder(debt.studentName, 'overdue')}>
                              <MessageSquare size={14} />
                            </button>
                            <button className="btn-ai-negotiate" onClick={() => startNegotiation(debt)}>
                              <Zap size={14} /> Acordo AI
                            </button>
                          </div>
                        )}
                        <span className={`status-pill ${debt.status}`}>
                          {debt.status === 'paid' ? 'PAGO' : debt.status === 'overdue' ? 'ATRASADO' : 'PENDENTE'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                <button className="btn-view-all-reports">
                  <FileText size={16} /> VER RELATÓRIO DE INADIMPLÊNCIA
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer (Always Visible) */}
      <footer className="security-note">
        <Shield size={14} className="text-emerald-500" />
        <span>Todas as transações são registradas de forma segura e auditável no servidor local soberano.</span>
      </footer>


      {/* PIX Modal */}
      {showPixModal && (
        <div className="modal-overlay" onClick={() => setShowPixModal(null)}>
          <div className="modal-content animate-zoom-in" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3><Wallet size={18} /> Portal de Pagamento PIX</h3>
              <button onClick={() => setShowPixModal(null)} className="btn-close-modal">✕</button>
            </div>
            <div className="modal-summary">
              <div className="summary-amount">{formatCurrency(showPixModal.amount)}</div>
              <p className="summary-desc">{showPixModal.description}</p>
            </div>
            <div className="pix-key-section">
              <label className="price-label">Chave PIX (CNPJ)</label>
              <div className="pix-key-box">
                <span>{AQUILA_PIX_KEY}</span>
                <button onClick={() => copyPix(AQUILA_PIX_KEY)} className="btn-copy" title="Copiar Chave PIX">
                  <Copy size={16} />
                </button>
              </div>
            </div>
            {showPixModal.pixCode && (
              <div className="pix-code-section">
                <label className="price-label">PIX Cópia e Cola</label>
                <div className="pix-code-box">{showPixModal.pixCode}</div>
                <button onClick={() => copyPix(showPixModal.pixCode!)} className="btn-copy-code">
                  {copiedPix ? <CheckCircle2 size={18} /> : <Smartphone size={18} />}
                  {copiedPix ? 'CÓDIGO COPIADO!' : 'COPIAR CÓDIGO PIX'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
