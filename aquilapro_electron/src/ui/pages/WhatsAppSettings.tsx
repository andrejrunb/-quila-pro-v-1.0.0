import React, { useState, useEffect } from 'react';
import { MessageSquare, Settings2, Send, CheckCircle, AlertCircle, RefreshCcw, ShieldCheck, Zap } from 'lucide-react';

export const WhatsAppSettings: React.FC = () => {
  const [waConfig, setWaConfig] = useState({ apiUrl: '', token: '' });
  const [testPhone, setTestPhone] = useState('');
  const [status, setStatus] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const aquila = (window as any).aquila;

  const loadStatus = async () => {
    try {
      const s = await aquila.invoke('whatsapp:get-status');
      setStatus(s);
    } catch (err) {
      console.error('Erro ao buscar status WA:', err);
    }
  };

  useEffect(() => {
    loadStatus();
    const interval = setInterval(loadStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleSave = async () => {
    if (!waConfig.apiUrl || !waConfig.token) return;
    setIsSaving(true);
    try {
      await aquila.invoke('whatsapp:update-config', waConfig);
      setMessage({ type: 'success', text: 'Configurações de WhatsApp salvas com sucesso!' });
      setTimeout(() => setMessage(null), 3000);
    } catch (err: any) {
      setMessage({ type: 'error', text: `Erro: ${err.message}` });
    } finally {
      setIsSaving(false);
    }
  };

  const handleTest = async () => {
    if (!testPhone) return;
    setIsTesting(true);
    setMessage(null);
    try {
      const success = await aquila.invoke('whatsapp:test-connection', testPhone);
      if (success) {
        setMessage({ type: 'success', text: 'Mensagem de teste enviada! Verifique seu celular.' });
      } else {
        setMessage({ type: 'error', text: 'Falha ao enviar mensagem de teste. Verifique a URL e o Token.' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: `Erro no teste: ${err.message}` });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-12">
          <h1 className="text-4xl font-black bg-gradient-to-r from-emerald-400 to-green-400 bg-clip-text text-transparent">
            Configuração WhatsApp
          </h1>
          <p className="text-slate-500 mt-2">Integração oficial via API para notificações em tempo real</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-8">
             {/* Configuração da API */}
             <div className="bg-slate-900/50 border border-white/5 rounded-3xl p-8 backdrop-blur-md">
                <h3 className="text-xl font-bold mb-6 flex items-center gap-3">
                   <Settings2 className="w-5 h-5 text-emerald-400" />
                   Parâmetros da API
                </h3>
                
                <div className="space-y-4">
                   <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block mb-2">Endpoint URL</label>
                      <input 
                        type="text" 
                        value={waConfig.apiUrl}
                        onChange={(e) => setWaConfig({...waConfig, apiUrl: e.target.value})}
                        className="w-full bg-black/40 border border-slate-800 rounded-xl p-3 text-sm text-emerald-300 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                        placeholder="https://graph.facebook.com/v17.0/..."
                      />
                   </div>
                   <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block mb-2">Bearer Token</label>
                      <input 
                        type="password" 
                        value={waConfig.token}
                        onChange={(e) => setWaConfig({...waConfig, token: e.target.value})}
                        className="w-full bg-black/40 border border-slate-800 rounded-xl p-3 text-sm text-emerald-300 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                        placeholder="EAAW..."
                      />
                   </div>
                   
                   <button 
                    onClick={handleSave}
                    disabled={isSaving}
                    className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-xl shadow-emerald-500/10"
                   >
                     {isSaving ? 'Salvando...' : 'Salvar Configurações'}
                   </button>
                </div>
             </div>

             {/* Teste de Conexão */}
             <div className="bg-slate-900/50 border border-white/5 rounded-3xl p-8 backdrop-blur-md">
                <h3 className="text-xl font-bold mb-6 flex items-center gap-3">
                   <Send className="w-5 h-5 text-blue-400" />
                   Teste de Envio
                </h3>
                <div className="flex gap-4">
                   <input 
                    type="text" 
                    value={testPhone}
                    onChange={(e) => setTestPhone(e.target.value)}
                    className="flex-1 bg-black/40 border border-slate-800 rounded-xl p-3 text-sm text-blue-300 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    placeholder="Ex: 5511999999999"
                   />
                   <button 
                    onClick={handleTest}
                    disabled={isTesting || !testPhone}
                    className="px-6 bg-blue-600 hover:bg-blue-700 rounded-xl transition-all disabled:opacity-50"
                   >
                     {isTesting ? <RefreshCcw className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                   </button>
                </div>
                {message && (
                  <div className={`mt-4 p-4 rounded-xl flex items-center gap-3 text-xs ${
                    message.type === 'success' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
                  }`}>
                    {message.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                    {message.text}
                  </div>
                )}
             </div>
          </div>

          <div className="space-y-8">
             {/* Status da Fila */}
             <div className="bg-slate-900 border border-white/5 rounded-[40px] p-10 flex flex-col justify-between h-full">
                <div>
                   <h3 className="text-xl font-black mb-8 flex items-center justify-between">
                      Fila de Envios
                      <span className={`px-4 py-1 rounded-full text-[10px] uppercase tracking-widest font-black ${status?.queued > 0 ? 'bg-blue-500 text-white' : 'bg-slate-800 text-slate-500'}`}>
                         {status?.queued || 0} Pendentes
                      </span>
                   </h3>
                   
                   <div className="space-y-8">
                      <div className="flex justify-between items-center">
                         <span className="text-slate-500 font-bold text-sm">Status do Serviço</span>
                         <span className="flex items-center gap-2 text-green-500 font-black text-xs">
                            <Zap className="w-4 h-4 fill-green-500" /> ATIVO
                         </span>
                      </div>
                      <div className="flex justify-between items-center">
                         <span className="text-slate-500 font-bold text-sm">Enviadas na Janela (1h)</span>
                         <span className="text-2xl font-black text-white">{status?.sentThisHour || 0} <span className="text-slate-700 text-sm">/ {status?.rateLimit || '∞'}</span></span>
                      </div>
                      <div className="flex justify-between items-center">
                         <span className="text-slate-500 font-bold text-sm">Plano Atual</span>
                         <span className="px-3 py-1 bg-blue-500/10 text-blue-400 rounded-lg font-black text-[10px] uppercase tracking-widest">{status?.tier || '...'}</span>
                      </div>
                   </div>
                </div>

                <div className="mt-12 p-6 bg-green-500/5 border border-green-500/10 rounded-3xl flex items-start gap-4">
                   <ShieldCheck className="w-6 h-6 text-green-500 flex-shrink-0" />
                   <p className="text-[10px] text-slate-400 leading-relaxed italic">
                      <strong>LGPD Assert:</strong> Todas as mensagens enviadas são filtradas localmente. Biometria e imagens nunca saem deste terminal. A Eagle Tech garante a criptografia ponta-a-ponta no transporte via HTTPS/TLS 1.3.
                   </p>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WhatsAppSettings;
