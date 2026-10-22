import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Sparkles, 
  Heart, 
  Zap, 
  Award, 
  ExternalLink, 
  ArrowLeft, 
  Users, 
  DollarSign, 
  Link, 
  Copy, 
  Cpu, 
  HardDrive,
  Laptop
} from 'lucide-react';

interface PartnershipPortalProps {
  onBack: () => void;
}

interface AffiliateProduct {
  id: string;
  name: string;
  description: string;
  category: string;
  tier: string;
  affiliateUrl: string;
  priceEstimate: number;
  verified: boolean;
}

interface AffiliateStats {
  referredSchoolsCount: number;
  totalCommissionAccrued: number;
  monthlyRecurringRevenue: number;
  payoutHistory: Array<{ date: string; amount: number; status: string }>;
}

export const PartnershipPortal: React.FC<PartnershipPortalProps> = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState<'benefits' | 'affiliate'>('benefits');
  const [products, setProducts] = useState<AffiliateProduct[]>([]);
  const [stats, setStats] = useState<AffiliateStats | null>(null);
  const [copied, setCopied] = useState(false);

  const referralUrl = "https://aquilapro.com.br/signup?ref=consultor_pedagogico_14";

  useEffect(() => {
    const fetchAffiliateData = async () => {
      try {
        if (window.aquila && (window.aquila as any).affiliate) {
          const productsList = await (window.aquila as any).affiliate.getProducts();
          const statsData = await (window.aquila as any).affiliate.getStats();
          setProducts(productsList);
          setStats(statsData);
        }
      } catch (err) {
        console.error('Erro ao buscar dados do programa de afiliados:', err);
      }
    };
    fetchAffiliateData();
  }, []);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getHardwareIcon = (category: string) => {
    switch (category) {
      case 'WIFI_REPEATER': return <Zap className="text-amber-400" size={18} />;
      case 'COMPUTER': return <Laptop className="text-sky-400" size={18} />;
      case 'DISPLAY': return <Cpu className="text-purple-400" size={18} />;
      default: return <HardDrive className="text-slate-400" size={18} />;
    }
  };

  const benefits = [
    {
      icon: <Shield className="text-blue-400" />,
      title: 'Seguro Escolar "SafePass"',
      description: 'Redução de 15% na apólice anual devido ao monitoramento de IA de alta precisão.',
      status: 'Ativo'
    },
    {
      icon: <Award className="text-yellow-400" />,
      title: 'Certificação Anti-Bullying',
      description: 'Selo de Escola Segura emitido pela Federação Nacional de Escolas Particulares.',
      status: 'Disponível'
    },
    {
      icon: <Heart className="text-red-400" />,
      title: 'Convênio Saúde Monitorada',
      description: 'Atendimento médico prioritário via telemedicina para alunos com alertas de queda.',
      status: 'Pendente'
    }
  ];

  return (
    <div className="p-8 max-w-6xl mx-auto animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <button 
            onClick={onBack}
            className="flex items-center text-slate-400 hover:text-white transition-colors mb-4 group"
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          >
            <ArrowLeft size={18} className="mr-2 group-hover:-translate-x-1 transition-transform" />
            Voltar ao Dashboard
          </button>
          <h1 className="text-4xl font-black bg-gradient-to-r from-blue-400 via-indigo-400 to-emerald-400 bg-clip-text text-transparent text-left">
            Portal de Parcerias & Afiliados B2B
          </h1>
          <p className="text-slate-400 mt-2 text-left">Benefícios de seguros, certificações e controle de comissionamento de rede de consultores.</p>
        </div>

        {activeTab === 'benefits' ? (
          <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-2xl flex items-center">
            <Sparkles className="text-blue-400 mr-3 animate-pulse" />
            <div>
              <p className="text-[10px] uppercase font-bold text-blue-300">Economia Anual Estimada</p>
              <p className="text-2xl font-black text-white">R$ 12.450,00</p>
            </div>
          </div>
        ) : (
          <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-2xl flex items-center">
            <DollarSign className="text-emerald-400 mr-3 animate-bounce" />
            <div>
              <p className="text-[10px] uppercase font-bold text-emerald-300">Comissões Acumuladas</p>
              <p className="text-2xl font-black text-white">
                R$ {stats?.totalCommissionAccrued ? stats.totalCommissionAccrued.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '4.890,50'}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-800 mb-8 gap-6">
        <button
          className={`pb-4 font-bold text-sm transition-colors relative ${activeTab === 'benefits' ? 'text-blue-400' : 'text-slate-400 hover:text-white'}`}
          onClick={() => setActiveTab('benefits')}
          style={{ background: 'none', border: 'none', cursor: 'pointer' }}
        >
          Parcerias & Convênios
          {activeTab === 'benefits' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500" />}
        </button>
        <button
          className={`pb-4 font-bold text-sm transition-colors relative ${activeTab === 'affiliate' ? 'text-emerald-400' : 'text-slate-400 hover:text-white'}`}
          onClick={() => setActiveTab('affiliate')}
          style={{ background: 'none', border: 'none', cursor: 'pointer' }}
        >
          Programa de Afiliados B2B
          {activeTab === 'affiliate' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500" />}
        </button>
      </div>

      {activeTab === 'benefits' ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {benefits.map((benefit, idx) => (
              <div key={idx} className="glass-premium p-6 border-slate-700/50 hover:border-blue-500/30 transition-all hover:scale-[1.02] cursor-pointer group">
                <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center mb-6 border border-white/5 group-hover:bg-blue-500/10 transition-colors">
                  {benefit.icon}
                </div>
                <h3 className="text-xl font-bold mb-2">{benefit.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed mb-6">{benefit.description}</p>
                <div className="flex items-center justify-between pt-4 border-t border-white/5">
                  <span className={`text-[10px] px-3 py-1 rounded-full font-black uppercase ${
                    benefit.status === 'Ativo' ? 'bg-emerald-500/10 text-emerald-400' :
                    benefit.status === 'Disponível' ? 'bg-blue-500/10 text-blue-400' : 'bg-slate-500/10 text-slate-400'
                  }`}>
                    {benefit.status}
                  </span>
                  <ExternalLink size={16} className="text-slate-500" />
                </div>
              </div>
            ))}
          </div>

          <div className="glass-premium p-8 border-indigo-500/20 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none">
              <Zap size={200} className="text-indigo-400" />
            </div>
            <div className="relative z-10 max-w-2xl">
              <h2 className="text-2xl font-black mb-4 flex items-center">
                <Zap className="text-yellow-400 mr-2" />
                Aumente seu Seguro com IA
              </h2>
              <p className="text-slate-400 leading-relaxed mb-6 text-left">
                Ao atingir 98% de precisão nas zonas de pátio e implementar o alerta de aglomeração, 
                sua escola se torna elegível para o nível <strong>Platinum</strong> de segurança, 
                desbloqueando coberturas de responsabilidade civil estendidas.
              </p>
              <button className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-3 rounded-2xl font-bold transition-all transform active:scale-95 shadow-lg shadow-indigo-600/20">
                Solicitar Auditoria Gratuita
              </button>
            </div>
          </div>
        </>
      ) : (
        <div className="flex flex-col gap-8">
          {/* Key Affiliate KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="glass-premium p-6 border-slate-700/50">
              <div className="flex justify-between items-center mb-4">
                <span className="text-[10px] uppercase font-bold text-slate-400">Escolas Indicadas</span>
                <Users className="text-emerald-400" size={20} />
              </div>
              <h2 className="text-3xl font-black text-white">{stats?.referredSchoolsCount || 14} Escolas</h2>
              <p className="text-xs text-slate-500 mt-2">Consultoria B2B ativa no ecossistema</p>
            </div>
            <div className="glass-premium p-6 border-slate-700/50">
              <div className="flex justify-between items-center mb-4">
                <span className="text-[10px] uppercase font-bold text-slate-400">Recorrência Mensal (MRR)</span>
                <DollarSign className="text-emerald-400 animate-pulse" size={20} />
              </div>
              <h2 className="text-3xl font-black text-emerald-400">
                R$ {stats?.monthlyRecurringRevenue ? stats.monthlyRecurringRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '1.200,00'}
              </h2>
              <p className="text-xs text-slate-500 mt-2">Comissão contínua recorrente (15% SaaS)</p>
            </div>
            <div className="glass-premium p-6 border-slate-700/50">
              <div className="flex justify-between items-center mb-4">
                <span className="text-[10px] uppercase font-bold text-slate-400">Link de Indicação Único</span>
                <Link className="text-sky-400" size={20} />
              </div>
              <div className="flex gap-2 items-center mt-2">
                <input 
                  type="text" 
                  readOnly 
                  value={referralUrl}
                  className="bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs font-mono text-slate-300 flex-1 outline-none"
                />
                <button 
                  onClick={handleCopyLink}
                  className={`p-2 rounded-lg border transition-all ${copied ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'}`}
                  title="Copiar Link"
                  style={{ cursor: 'pointer' }}
                >
                  <Copy size={14} />
                </button>
              </div>
              <p className="text-[10px] text-slate-500 mt-2 text-left">{copied ? '✓ Link copiado para a área de transferência!' : 'Divulgue para mantenedores e comissões automáticas'}</p>
            </div>
          </div>

          {/* Catalog and Products list */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Products grid */}
            <div className="glass-premium p-6 border-slate-700/50">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-left">
                <Sparkles className="text-amber-400" size={16} />
                Catálogo de Hardware Homologado e Comissionado
              </h3>
              <p className="text-xs text-slate-400 mb-6 text-left">
                Consultores recebem bônus sobre todo hardware verificado indicado e adquirido pelas escolas parceiras para viabilização local do Áquila Edge Hub.
              </p>

              <div className="flex flex-col gap-4 max-h-[300px] overflow-y-auto pr-2">
                {products.length > 0 ? products.map(prod => (
                  <div key={prod.id} className="flex items-center justify-between p-4 bg-slate-900/50 border border-slate-800 rounded-xl hover:border-slate-700 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center border border-white/5">
                        {getHardwareIcon(prod.category)}
                      </div>
                      <div className="text-left">
                        <h4 className="font-bold text-sm text-white">{prod.name}</h4>
                        <p className="text-[11px] text-slate-500 truncate max-w-[240px]">{prod.description}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-black text-white">R$ {prod.priceEstimate.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                      <a 
                        href={prod.affiliateUrl} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-[10px] text-emerald-400 font-bold block hover:underline mt-1"
                      >
                        Indicar Produto →
                      </a>
                    </div>
                  </div>
                )) : (
                  <div className="text-xs text-slate-500 p-8 text-center">Nenhum hardware homologado carregado.</div>
                )}
              </div>
            </div>

            {/* Payout history */}
            <div className="glass-premium p-6 border-slate-700/50">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-left">
                <DollarSign className="text-emerald-400" size={16} />
                Histórico de Repasses e Comissões Recorrentes
              </h3>
              <p className="text-xs text-slate-400 mb-6 text-left">
                Tabela de depósitos automatizados baseados nas mensalidades vigentes das escolas indicadas.
              </p>

              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-[10px] uppercase font-bold text-slate-500">
                    <th className="pb-3">Data</th>
                    <th className="pb-3">Valor Depositado</th>
                    <th className="pb-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="text-xs text-slate-300">
                  {stats?.payoutHistory ? stats.payoutHistory.map((pay, i) => (
                    <tr key={i} className="border-b border-slate-800/50 last:border-none">
                      <td className="py-4">{new Date(pay.date).toLocaleDateString('pt-BR')}</td>
                      <td className="py-4 font-bold text-white">R$ {pay.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                      <td className="py-4 text-right">
                        <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 rounded-full text-[9px] font-black uppercase">
                          {pay.status === 'paid' ? 'Pago' : 'Pendente'}
                        </span>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={3} className="py-8 text-center text-slate-500">Nenhum pagamento registrado.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PartnershipPortal;
