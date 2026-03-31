import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, CheckCircle2, CreditCard, Wallet, Copy, ShieldCheck, Lock, ArrowLeft, Zap, Info } from "lucide-react";
import { toast } from "sonner";

const PLANS = [
  { id: 'essencial', name: 'Áquila Essencial', price: 1990, color: 'text-orange-500' },
  { id: 'profissional', name: 'Áquila Profissional', price: 4990, color: 'text-blue-500' },
  { id: 'enterprise', name: 'Áquila Enterprise', price: 9990, color: 'text-yellow-500' },
];

export default function Checkout() {
  const [location] = useLocation();
  const [params] = useState(() => new URLSearchParams(window.location.search));
  const planId = params.get('plan') || 'bronze';
  const plan = PLANS.find(p => p.id === planId) || PLANS[0];

  const [contactData, setContactData] = useState({
    name: "",
    email: "",
    cpf: "",
  });

  const [pixData, setPixData] = useState<any>(null);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');

  // TRPC Mutations
  const createPix = trpc.checkout.createPix.useMutation();
  const createStripe = trpc.checkout.createStripeSession.useMutation();

  const handlePixCheckout = async () => {
    if (!contactData.name || !contactData.email || !contactData.cpf) {
       toast.error("Por favor, preencha todos os dados.");
       return;
    }
    setPaymentStatus('processing');
    try {
      const res = await createPix.mutateAsync({
        planId: plan.id,
        amount: plan.price,
        customerName: contactData.name,
        customerEmail: contactData.email,
        customerCpf: contactData.cpf,
      });
      setPixData(res);
      setPaymentStatus('idle');
      toast.success("QR Code Pix gerado!");
    } catch (err) {
      setPaymentStatus('error');
      toast.error("Erro ao gerar Pix.");
    }
  };

  const handleStripeCheckout = async () => {
    setPaymentStatus('processing');
    try {
      const res = await createStripe.mutateAsync({
        planId: plan.id,
        amount: plan.price,
      });
      if (res.url) window.location.href = res.url;
    } catch (err) {
      setPaymentStatus('error');
      toast.error("Erro ao iniciar pagamento com Cartão.");
    }
  };

  const copyPix = () => {
    if (pixData?.qrCode) {
      navigator.clipboard.writeText(pixData.qrCode);
      toast.success("Código Copia e Cola copiado!");
    }
  };

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-[#030712] text-white font-sans">
      {/* Background Elements */}
      <div className="bg-blobs">
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
      </div>

      <Navigation />
      
      <main className="flex-1 pt-32 pb-24">
        <div className="container max-w-5xl mx-auto px-4">
           {/* Header */}
           <div className="flex items-center gap-4 mb-12">
              <button 
                onClick={() => window.history.back()} 
                className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center hover:bg-white/5 transition-all"
                title="Voltar"
                aria-label="Voltar para a página anterior"
              >
                 <ArrowLeft size={20} />
              </button>
              <div>
                 <h1 className="text-3xl font-black italic uppercase tracking-tighter">Checkout Seguro</h1>
                 <p className="text-gray-500 font-bold uppercase text-[10px] tracking-widest">Ativação Imediata via Protocolo V3</p>
              </div>
           </div>

           <div className="grid lg:grid-cols-3 gap-12">
              {/* Order Summary */}
              <div className="lg:col-span-1 space-y-8">
                 <div className="glass-card p-10 rounded-[3rem] border-white/10 bg-white/5">
                    <h3 className="text-[10px] font-black uppercase text-gray-500 tracking-widest mb-8">Resumo do Pedido</h3>
                    <div className="space-y-6">
                       <div className="flex justify-between items-center">
                          <span className="text-sm font-bold text-gray-400">Plano Selecionado</span>
                          <span className={`text-sm font-black italic uppercase ${plan.color}`}>{plan.name}</span>
                       </div>
                       <div className="flex justify-between items-center pt-6 border-t border-white/5">
                          <span className="text-xl font-black italic uppercase">Total</span>
                          <span className="text-3xl font-black italic text-blue-500">R$ {plan.price.toLocaleString('pt-BR')}</span>
                       </div>
                    </div>
                    
                    <div className="mt-12 p-6 rounded-2xl bg-blue-500/5 border border-blue-500/10">
                       <div className="flex items-center gap-3 mb-4">
                          <Zap size={16} className="text-blue-500" />
                          <span className="text-[10px] font-black uppercase tracking-widest">Protocolo Eagle</span>
                       </div>
                       <p className="text-[10px] text-gray-500 font-light leading-relaxed">
                          Sua ativação será processada em tempo real após a compensação bancária. Acesso instantâneo ao Dashboard V3.
                       </p>
                    </div>
                 </div>

                 <div className="p-8 text-center space-y-4">
                    <ShieldCheck size={40} className="text-green-500 mx-auto mb-4" />
                    <h4 className="text-sm font-black italic uppercase tracking-tighter">Transação Protegida</h4>
                    <p className="text-[10px] text-gray-600 font-medium">Criptografia AES-256 bits.<br/>Processamento 100% Auditado.</p>
                 </div>
              </div>

              {/* Payment Steps */}
              <div className="lg:col-span-2">
                 <div className="glass-card p-10 md:p-16 rounded-[4rem] border-white/10 bg-white/5 relative overflow-hidden">
                    {!pixData ? (
                      <div className="space-y-12">
                         <div className="space-y-8">
                            <h2 className="text-2xl font-black italic uppercase tracking-tighter">Identificação do Cliente</h2>
                            <div className="grid md:grid-cols-2 gap-6">
                               <div className="space-y-2">
                                  <label className="text-[8px] font-black uppercase text-gray-500 tracking-widest ml-4">Nome Completo</label>
                                  <Input value={contactData.name} onChange={e => setContactData({...contactData, name: e.target.value})} className="bg-white/5 border-white/10 rounded-2xl h-14 px-6 font-light italic" placeholder="Ex: Andrej Silva" />
                               </div>
                               <div className="space-y-2">
                                  <label className="text-[8px] font-black uppercase text-gray-500 tracking-widest ml-4">CPF / CNPJ</label>
                                  <Input value={contactData.cpf} onChange={e => setContactData({...contactData, cpf: e.target.value})} className="bg-white/5 border-white/10 rounded-2xl h-14 px-6 font-light italic" placeholder="000.000.000-00" />
                               </div>
                               <div className="md:col-span-2 space-y-2">
                                  <label className="text-[8px] font-black uppercase text-gray-500 tracking-widest ml-4">E-mail para Recebimento</label>
                                  <Input type="email" value={contactData.email} onChange={e => setContactData({...contactData, email: e.target.value})} className="bg-white/5 border-white/10 rounded-2xl h-14 px-6 font-light italic" placeholder="contato@escola.com.br" />
                               </div>
                            </div>
                         </div>

                         <div className="space-y-8 pt-12 border-t border-white/5">
                            <h2 className="text-2xl font-black italic uppercase tracking-tighter">Método de Pagamento</h2>
                            <Tabs defaultValue="pix" className="w-full">
                               <TabsList className="grid grid-cols-2 h-auto p-2 bg-white/5 rounded-3xl mb-12 border border-white/5">
                                  <TabsTrigger value="pix" className="flex flex-col gap-2 py-6 rounded-2xl font-black uppercase tracking-widest text-[10px] data-[state=active]:bg-blue-600 data-[state=active]:text-white transition-all">
                                     <Wallet size={20} /> Pix Imediato
                                  </TabsTrigger>
                                  <TabsTrigger value="card" className="flex flex-col gap-2 py-6 rounded-2xl font-black uppercase tracking-widest text-[10px] data-[state=active]:bg-blue-600 data-[state=active]:text-white transition-all">
                                     <CreditCard size={20} /> Cartão de Crédito
                                  </TabsTrigger>
                               </TabsList>

                               <TabsContent value="pix" className="text-center space-y-10 animate-in fade-in slide-in-from-bottom-5 duration-500">
                                  <div className="flex flex-col items-center">
                                     <div className="w-20 h-20 rounded-full bg-blue-600/10 border border-blue-500/20 flex items-center justify-center mb-8">
                                        <Wallet size={32} className="text-blue-500" />
                                     </div>
                                     <h4 className="text-xl font-black italic uppercase mb-2">Pix: Ativação em Segundos</h4>
                                     <p className="text-gray-500 text-sm font-light max-w-sm">Use o Pix para gerar o QR Code de ativação instantânea do Eagle AI.</p>
                                  </div>
                                  <Button onClick={handlePixCheckout} disabled={paymentStatus === 'processing'} className="w-full h-20 rounded-2xl bg-white text-blue-600 text-xl font-bold hover:scale-[1.02] transition-all shadow-xl shadow-white/5">
                                     {paymentStatus === 'processing' ? <Loader2 className="animate-spin" /> : "GERAR QR CODE PIX"}
                                  </Button>
                               </TabsContent>

                               <TabsContent value="card" className="text-center space-y-10 animate-in fade-in slide-in-from-bottom-5 duration-500">
                                  <div className="flex flex-col items-center">
                                     <div className="w-20 h-20 rounded-full bg-blue-600/10 border border-blue-500/20 flex items-center justify-center mb-8">
                                        <CreditCard size={32} className="text-blue-500" />
                                     </div>
                                     <h4 className="text-xl font-black italic uppercase mb-2">Checkout Stripe V3</h4>
                                     <p className="text-gray-500 text-sm font-light max-w-sm">Você será redirecionado para o ambiente seguro do Stripe para concluir.</p>
                                  </div>
                                  <Button onClick={handleStripeCheckout} disabled={paymentStatus === 'processing'} className="w-full h-20 rounded-2xl bg-white text-blue-600 text-xl font-bold hover:scale-[1.02] transition-all shadow-xl shadow-white/5">
                                     {paymentStatus === 'processing' ? <Loader2 className="animate-spin" /> : "PAGAR COM CARTÃO"}
                                  </Button>
                               </TabsContent>
                            </Tabs>
                         </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center text-center space-y-10 py-10 animate-in zoom-in duration-700">
                         <div className="w-20 h-20 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center">
                            <CheckCircle2 size={40} className="text-green-500" />
                         </div>
                         <h2 className="text-3xl font-black italic uppercase tracking-tighter">QR Code V3 Gerado</h2>
                         
                         <div className="p-8 bg-white rounded-[2rem] shadow-2xl shadow-blue-500/20">
                            {pixData.qrCodeBase64 ? (
                               <img src={pixData.qrCodeBase64} alt="PIX QR Code" className="w-64 h-64" />
                            ) : (
                               <div className="w-64 h-64 bg-gray-100 flex items-center justify-center text-gray-400 font-bold italic">PIX ERROR</div>
                            )}
                         </div>

                         <div className="w-full space-y-6">
                            <div className="p-6 rounded-2xl bg-white/5 border border-white/10 text-xs font-mono break-all text-gray-400">
                               {pixData.qrCode}
                            </div>
                            <Button onClick={copyPix} variant="outline" className="w-full h-16 rounded-2xl border-blue-500/30 text-blue-500 font-black italic uppercase text-[10px] tracking-widest hover:bg-blue-500/10">
                               <Copy className="mr-2" size={14} /> Copiar Código Copia e Cola
                            </Button>
                         </div>

                         <div className="flex items-center gap-3 text-[10px] font-black text-gray-600 uppercase tracking-widest italic pt-8 border-t border-white/5 w-full justify-center">
                            <Loader2 size={12} className="animate-spin text-blue-500" />
                            Aguardando confirmação do protocolo Pix...
                         </div>
                      </div>
                    )}
                 </div>

                 <p className="mt-8 text-center text-[8px] font-bold text-gray-600 uppercase tracking-widest">
                    Ambiente 100% Seguro certificado pela Transação Estratégica Áquila Pro.
                 </p>
              </div>
           </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
