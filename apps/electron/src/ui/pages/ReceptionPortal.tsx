import React, { useState } from 'react';
import { 
  UserPlus, Camera, ShieldCheck, 
  Search, FileText, CheckCircle2,
  AlertCircle
} from 'lucide-react';
import './ReceptionPortal.css';

/**
 * ReceptionPortal (v1634)
 * Interface para Tablet (.apk) na recepção da escola.
 */
export const ReceptionPortal: React.FC = () => {
  const [formData, setFormData] = useState({ name: '', cpf: '', phone: '', photo: '' });
  const [isCapturing, setIsCapturing] = useState(false);
  const [step, setStep] = useState<'form' | 'success'>('form');
  const [isFlagged, setIsFlagged] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // @ts-ignore - window.aquila bridge
    const result = await window.aquila.visitor.register(formData);
    if (result && result.securityStatus === 'CRITICAL') {
       setIsFlagged(true);
    }
    setStep('success');
  };

  return (
    <div className="reception-portal-container">
      <div className="portal-glass-panel animate-scale-in">
         {step === 'form' ? (
            <>
               <header className="form-header">
                  <div className="p-4 bg-blue-500/10 rounded-2xl text-blue-400">
                     <UserPlus size={32} />
                  </div>
                  <div className="text-left">
                     <h1 className="text-2xl font-black">Registro de Visitante</h1>
                     <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Protocolo de Segurança Áquila</p>
                  </div>
               </header>

               <form className="reception-form mt-8 space-y-6" onSubmit={handleSubmit}>
                  <div className="photo-capture-area">
                     {formData.photo ? (
                        <img src={formData.photo} alt="Preview" className="photo-preview" />
                     ) : (
                        <div className="capture-placeholder" onClick={() => setFormData({...formData, photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=visitor'})}>
                           <Camera size={48} />
                           <span>Tocar para Capturar Rosto</span>
                        </div>
                     )}
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                     <div className="input-group">
                        <label>Nome Completo</label>
                        <input type="text" placeholder="Ex: João Silva" required onChange={e => setFormData({...formData, name: e.target.value})} />
                     </div>
                     <div className="input-group">
                        <label>CPF</label>
                        <input type="text" placeholder="000.000.000-00" required onChange={e => setFormData({...formData, cpf: e.target.value})} />
                     </div>
                     <div className="input-group">
                        <label>Telefone para Contato</label>
                        <input type="text" placeholder="(00) 00000-0000" required onChange={e => setFormData({...formData, phone: e.target.value})} />
                     </div>
                  </div>

                  <button type="submit" className="submit-registration-btn">
                     <ShieldCheck size={20} />
                     <span>FINALIZAR CADASTRO</span>
                  </button>
               </form>
            </>
         ) : (
            <div className="success-view text-center py-12">
               {isFlagged ? (
                  <div className="security-flag-icon">
                     <AlertCircle size={80} className="text-red-500" />
                     <h2 className="text-3xl font-black text-red-500 mt-6">ALERTA DE SEGURANÇA</h2>
                     <p className="text-slate-400 mt-2 px-8">Um alerta silencioso foi enviado para a coordenação. Por favor, aguarde o atendente institucional.</p>
                  </div>
               ) : (
                  <div className="cleared-icon">
                     <CheckCircle2 size={80} className="text-green-500" />
                     <h2 className="text-3xl font-black text-green-500 mt-6">ENTRADA AUTORIZADA</h2>
                     <p className="text-slate-400 mt-2">Cadastro concluído com sucesso. Bem-vindo(a) ao Áquila!</p>
                  </div>
               )}
               <button className="reset-btn mt-12" onClick={() => setStep('form')}>NOVO CADASTRO</button>
            </div>
         )}
      </div>
    </div>
  );
};
