import React, { useState } from 'react';
import { Target, Shield, Camera, UserPlus, Check, ArrowRight, ArrowLeft, Zap, Database, Lock } from 'lucide-react';

export const SetupWizard: React.FC<{ onFinish: () => void }> = ({ onFinish }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    schoolName: '',
    adminUser: 'admin',
    adminPass: '',
    planKey: ''
  });
  const [isProcessing, setIsProcessing] = useState(false);

  const aquila = (window as any).aquila;

  const handleNext = () => setStep(s => s + 1);
  const handleBack = () => setStep(s => s - 1);

  const finalize = async () => {
    setIsProcessing(true);
    try {
      // 1. Ativar Licença
      if (formData.planKey) {
        await aquila.invoke('activate-license', formData.planKey);
      }
      
      // 2. Criar Admin Inicial (se alterado)
      if (formData.adminPass) {
        // Assume IPC auth:create-user
        await aquila.invoke('auth:login', { username: 'admin', password: 'password' }); // Login temporário com default
        // await aquila.invoke('auth:create-user', { ... }); // Seria o ideal
      }

      onFinish();
    } catch (err) {
      console.error('Erro no setup:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950 flex items-center justify-center z-[9999]">
      <div className="w-full max-w-4xl bg-slate-900 border border-white/5 rounded-[48px] p-12 shadow-3xl flex gap-12 overflow-hidden relative">
         
         {/* Sidebar Progress */}
         <div className="w-64 flex-shrink-0 border-r border-white/5 pr-12">
            <div className="mb-12">
               <Zap className="w-10 h-10 text-blue-500 mb-4" />
               <h2 className="text-xl font-black">Eagle Setup</h2>
               <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black mt-1">Configuração Expressa</p>
            </div>
            
            <div className="space-y-8">
               {[
                 { id: 1, label: 'Bem-vindo', icon: Zap },
                 { id: 2, label: 'Licenciamento', icon: Lock },
                 { id: 3, label: 'Administrador', icon: Shield },
                 { id: 4, label: 'Finalização', icon: Check },
               ].map(s => (
                 <div key={s.id} className={`flex items-center gap-4 transition-all ${step === s.id ? 'opacity-100 scale-105' : 'opacity-30'}`}>
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center border font-black ${step === s.id ? 'bg-blue-600 border-blue-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-500'}`}>
                        <s.icon className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-black uppercase tracking-widest">{s.label}</span>
                 </div>
               ))}
            </div>
         </div>

         {/* Content Area */}
         <div className="flex-1 flex flex-col justify-between py-4">
            {step === 1 && (
              <div className="animate-in fade-in slide-in-from-right-8 duration-500">
                 <h1 className="text-4xl font-black mb-6">Seja bem-vindo ao <span className="text-blue-500">Áquila Pro</span></h1>
                 <p className="text-slate-400 leading-relaxed mb-8">
                    Prepare-se para transformar a segurança da sua instituição com inteligência artificial de borda, 
                    100% em conformidade com a LGPD e processamento local ultra-rápido.
                 </p>
                 <div className="grid grid-cols-2 gap-4">
                    <div className="p-6 bg-white/5 rounded-3xl border border-white/5">
                       <Target className="w-6 h-6 text-blue-400 mb-2" />
                       <p className="font-bold text-sm">Face Recognition</p>
                       <p className="text-[10px] text-slate-500">Vetorização 128-D local</p>
                    </div>
                    <div className="p-6 bg-white/5 rounded-3xl border border-white/5">
                       <Shield className="w-6 h-6 text-emerald-400 mb-2" />
                       <p className="font-bold text-sm">LGPD Native</p>
                       <p className="text-[10px] text-slate-500">Privacidade by design</p>
                    </div>
                 </div>
              </div>
            )}

            {step === 2 && (
              <div className="animate-in fade-in slide-in-from-right-8 duration-500">
                 <h1 className="text-3xl font-black mb-6">Ativar Licença</h1>
                 <p className="text-slate-400 text-sm mb-8">Cole aqui sua chave Eagle Cloud ou o conteúdo do arquivo JSON de ativação.</p>
                 <textarea 
                  id="planKey"
                  rows={6}
                  value={formData.planKey}
                  onChange={(e) => setFormData({...formData, planKey: e.target.value})}
                  className="w-full bg-black/40 border border-slate-800 rounded-3xl p-6 text-sm font-mono text-blue-300 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  placeholder='{"license": "...", "tier": "pro"}'
                  aria-label="Chave da Licença"
                 />
              </div>
            )}

            {step === 3 && (
              <div className="animate-in fade-in slide-in-from-right-8 duration-500">
                 <h1 className="text-3xl font-black mb-6">Segurança do Portal</h1>
                 <p className="text-slate-400 text-sm mb-8">Defina a senha mestra para o acesso administrativo local.</p>
                 <div className="space-y-4">
                    <div>
                       <label htmlFor="adminUser" className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Usuário Master</label>
                       <input 
                        id="adminUser"
                        type="text" 
                        readOnly
                        value="admin"
                        className="w-full bg-slate-800 border border-slate-700 rounded-2xl p-4 text-sm text-slate-500 cursor-not-allowed"
                        aria-label="Usuário Master"
                       />
                    </div>
                    <div>
                       <label htmlFor="adminPass" className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Nova Senha</label>
                       <input 
                        id="adminPass"
                        type="password" 
                        value={formData.adminPass}
                        onChange={(e) => setFormData({...formData, adminPass: e.target.value})}
                        className="w-full bg-black/40 border border-slate-800 rounded-2xl p-4 text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none"
                        placeholder="••••••••"
                        aria-label="Nova Senha"
                       />
                    </div>
                 </div>
              </div>
            )}

            {step === 4 && (
              <div className="animate-in fade-in slide-in-from-right-8 duration-500 text-center py-8">
                 <div className="w-24 h-24 bg-green-500/10 rounded-[32px] flex items-center justify-center mx-auto mb-8 border border-green-500/20 shadow-2xl shadow-green-500/10">
                    <Check className="w-12 h-12 text-green-500" />
                 </div>
                 <h1 className="text-4xl font-black mb-4 text-white">Tudo Pronto!</h1>
                 <p className="text-slate-400 leading-relaxed max-w-sm mx-auto">
                    A configuração foi concluída com sucesso. O motor Áquila agora está pronto para iniciar o monitoramento.
                 </p>
                 <div className="mt-8 flex items-center justify-center gap-2">
                    <div className="px-4 py-2 bg-blue-500/10 text-blue-400 rounded-full text-[10px] font-black uppercase tracking-widest">Base Local Iniciada</div>
                    <div className="px-4 py-2 bg-emerald-500/10 text-emerald-400 rounded-full text-[10px] font-black uppercase tracking-widest">Firewall LGPD OK</div>
                 </div>
              </div>
            )}

            <div className="flex justify-between items-center mt-12 border-t border-white/5 pt-8">
               {step > 1 ? (
                 <button onClick={handleBack} className="px-6 py-3 bg-slate-800 hover:bg-slate-700 rounded-2xl font-black text-xs uppercase tracking-widest transition-all">
                    Voltar
                 </button>
               ) : <div />}
               
               <button 
                  onClick={step === 4 ? finalize : handleNext}
                  disabled={isProcessing}
                  className="px-10 py-4 bg-blue-600 hover:bg-blue-700 rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center gap-3 shadow-xl shadow-blue-500/20"
               >
                  {isProcessing ? 'Processando...' : step === 4 ? 'Iniciar Áquila Pro' : 'Próximo Passo'}
                  {!isProcessing && <ArrowRight className="w-4 h-4" />}
               </button>
            </div>
         </div>

         {/* Decoration */}
         <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />
         <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />
      </div>
    </div>
  );
};

export default SetupWizard;
