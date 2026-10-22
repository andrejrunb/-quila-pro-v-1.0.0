import React, { useState, useEffect } from 'react';
import { Shield, Check, X, CreditCard, Zap, Crown, Info, Key, CheckCircle2, AlertCircle } from 'lucide-react';

interface LicenseInfo {
  tier: 'essencial' | 'pro' | 'enterprise';
  active: boolean;
  expiresAt?: string;
  activatedAt?: string;
  clientId?: string;
}

interface PlanLimits {
  maxCameraStreams: number;
  maxStudentFaces: number;
  whatsappQueueEnabled: boolean;
  whatsappRatePerHour: number;
  heatmapEnabled: boolean;
  multiUnitEnabled: boolean;
  hrEnabled: boolean;
  secretaryEnabled: boolean;
  messengerEnabled: boolean;
  gamificationEnabled: boolean;
}

export const LicensePage: React.FC = () => {
  const [license, setLicense] = useState<LicenseInfo | null>(null);
  const [limits, setLimits] = useState<PlanLimits | null>(null);
  const [licenseKey, setLicenseKey] = useState('');
  const [isActivating, setIsActivating] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const aquila = (window as any).aquila;

  const loadLicenseData = async () => {
    try {
      const info = await aquila.invoke('get-license-info');
      const lim = await aquila.invoke('get-plan-limits');
      setLicense(info);
      setLimits(lim);
    } catch (err) {
      console.error('Erro ao carregar licença:', err);
    }
  };

  useEffect(() => {
    loadLicenseData();
  }, []);

  const handleActivate = async () => {
    if (!licenseKey.trim()) return;
    setIsActivating(true);
    setMessage(null);

    try {
      const success = await aquila.invoke('activate-license', licenseKey);
      if (success) {
        setMessage({ type: 'success', text: 'Licença ativada com sucesso! Bem-vindo ao próximo nível.' });
        await loadLicenseData();
        setLicenseKey('');
      } else {
        setMessage({ type: 'error', text: 'Chave de licença inválida ou expirada.' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: `Erro na ativação: ${err.message}` });
    } finally {
      setIsActivating(false);
    }
  };

  const tiers = [
    {
      id: 'essencial',
      name: 'Essencial',
      icon: <Zap className="w-6 h-6 text-yellow-400" />,
      color: 'from-slate-800 to-slate-900',
      border: 'border-slate-700',
      activeColor: 'ring-yellow-500/50 text-yellow-500'
    },
    {
      id: 'pro',
      name: 'Pro',
      icon: <Shield className="w-6 h-6 text-blue-400" />,
      color: 'from-blue-900/40 to-slate-900',
      border: 'border-blue-500/30',
      activeColor: 'ring-blue-500 text-blue-400'
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      icon: <Crown className="w-6 h-6 text-purple-400" />,
      color: 'from-purple-900/40 to-slate-900',
      border: 'border-purple-500/30',
      activeColor: 'ring-purple-500 text-purple-400'
    }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-12">
          <h1 className="text-4xl font-extrabold mb-2 bg-gradient-to-r from-slate-100 to-slate-400 bg-clip-text text-transparent">
            Gestão de Licença
          </h1>
          <p className="text-slate-400">Gerencie seu plano e recursos do Áquila Pro</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          {tiers.map(t => (
            <div 
              key={t.id} 
              className={`relative overflow-hidden rounded-3xl border-2 p-8 bg-gradient-to-b ${t.color} ${
                license?.tier === t.id ? t.border + ' ring-4 ring-offset-4 ring-offset-slate-950 ' + t.activeColor : 'border-white/5 opacity-60'
              }`}
            >
              {license?.tier === t.id && (
                <div className="absolute top-4 right-4 bg-white/10 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-white backdrop-blur-md">
                   Plano Ativo
                </div>
              )}
              
              <div className="mb-6">{t.icon}</div>
              <h3 className="text-2xl font-bold mb-4">{t.name}</h3>
              
              <ul className="space-y-4 text-sm text-slate-300">
                <li className="flex items-center gap-3">
                  <Check className="w-4 h-4 text-green-500" />
                  {t.id === 'essencial' ? '4 Câmeras RTSP' : t.id === 'pro' ? '12 Câmeras RTSP' : 'Câmeras Ilimitadas'}
                </li>
                <li className="flex items-center gap-3">
                  <Check className="w-4 h-4 text-green-500" />
                  {t.id === 'essencial' ? '300 Alunos' : t.id === 'pro' ? '1.000 Alunos' : 'Alunos Ilimitados'}
                </li>
                <li className="flex items-center gap-3">
                  <Check className="w-4 h-4 text-green-500" />
                  {t.id === 'essencial' ? 'Alertas WhatsApp' : 'WhatsApp Ilimitado s/ Fila'}
                </li>
                <li className="flex items-center gap-3">
                  {t.id === 'essencial' ? <X className="w-4 h-4 text-slate-600" /> : <Check className="w-4 h-4 text-green-500" />}
                  Heatmap de Fluxo
                </li>
              </ul>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Ativação */}
          <div className="bg-slate-900/50 rounded-3xl p-8 border border-white/5 backdrop-blur-md">
             <h3 className="text-xl font-bold mb-6 flex items-center gap-3">
                <Key className="w-5 h-5 text-blue-400" />
                Ativar Nova Chave
             </h3>
             
             <div className="space-y-4">
                <p className="text-sm text-slate-400">Cole abaixo o código JSON de ativação fornecido pela Eagle Tech.</p>
                <textarea 
                  value={licenseKey}
                  onChange={(e) => setLicenseKey(e.target.value)}
                  className="w-full h-48 bg-black/40 border border-slate-700 rounded-2xl p-4 font-mono text-xs text-blue-300 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  placeholder='{ "key": "...", "tier": "pro", ... }'
                />
                
                {message && (
                  <div className={`p-4 rounded-xl flex items-center gap-3 transition-all ${
                    message.type === 'success' ? 'bg-green-500/10 text-green-400 border border-green-500/30' : 'bg-red-500/10 text-red-400 border border-red-500/30'
                  }`}>
                    {message.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                    <span className="text-sm">{message.text}</span>
                  </div>
                )}

                <button 
                  onClick={handleActivate}
                  disabled={isActivating || !licenseKey}
                  className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600 text-white font-bold rounded-2xl shadow-xl shadow-blue-500/20 transition-all flex items-center justify-center gap-2"
                >
                  {isActivating ? <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : 'Validar e Ativar Licença'}
                </button>
             </div>
          </div>

          {/* Detalhes da Sessão */}
          <div className="bg-slate-900/50 rounded-3xl p-8 border border-white/5 flex flex-col justify-between">
             <div>
                <h3 className="text-xl font-bold mb-6 flex items-center gap-3">
                  <Info className="w-5 h-5 text-slate-400" />
                  Status da Licença
                </h3>
                
                <div className="space-y-6">
                  <div className="flex justify-between items-center pb-4 border-b border-white/5">
                    <span className="text-slate-400">Plano Atual</span>
                    <span className="font-bold uppercase tracking-widest text-blue-400">{license?.tier || 'Nenhum'}</span>
                  </div>
                  <div className="flex justify-between items-center pb-4 border-b border-white/5">
                    <span className="text-slate-400">Status</span>
                    <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-tighter ${license?.active ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                       {license?.active ? 'Ativa' : 'Expirada/Inativa'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pb-4 border-b border-white/5">
                    <span className="text-slate-400">Válida até</span>
                    <span className="text-slate-200">{license?.expiresAt ? new Date(license.expiresAt).toLocaleDateString('pt-BR') : 'N/A'}</span>
                  </div>
                  <div className="flex justify-between items-center pb-4 border-b border-white/5">
                    <span className="text-slate-400">Máximo de Câmeras</span>
                    <span className="text-slate-200">{limits?.maxCameraStreams || 0}</span>
                  </div>
                </div>
             </div>

             <div className="mt-8 p-4 bg-blue-500/5 rounded-2xl border border-blue-500/10 text-[10px] text-slate-500 flex items-start gap-3">
               <Shield className="w-4 h-4 flex-shrink-0 mt-0.5" />
               <p>Esta licença é vinculada ao hardware local deste servidor. Transferências exigem suporte Eagle Tech. Em conformidade com LGPD, todos os dados de licença são validados localmente.</p>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LicensePage;
