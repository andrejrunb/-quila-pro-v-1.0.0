import React, { useState, useEffect, useRef } from 'react';
import { ShieldCheck, CreditCard, Users, Zap, Check, AlertCircle } from 'lucide-react';
import './LicensingManagement.css';

/**
 * LicensingManagement.tsx — Passo 38 do Roadmap.
 * Gestão de Seats, Planos e Faturamento B2B.
 */
export const LicensingManagement: React.FC = () => {
  const [tier] = useState('Enterprise');
  const [seatsUsed] = useState(840);
  const totalSeats = 2000;
  const progressBarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (progressBarRef.current) {
        const progress = (seatsUsed / totalSeats) * 100;
        progressBarRef.current.style.setProperty('--seats-progress', `${progress}%`);
    }
  }, [seatsUsed, totalSeats]);

  return (
    <div className="licensing-container animate-fade-in">
      <div className="licensing-header">
        <div>
          <h1 className="licensing-title">
            <ShieldCheck className="icon-indigo" size={40} />
            Licenciamento & Assinatura
          </h1>
          <p className="licensing-subtitle">Gerencie sua cota de alunos e recursos ativos do Áquila Pro</p>
        </div>
        <div className="licensing-id-badge">
            ID: AQ-BR-9901
        </div>
      </div>

      <div className="licensing-grid-top">
        <div className="tier-card">
            <h3 className="tier-label">Plano Atual</h3>
            <p className="tier-name">{tier}</p>
            <p className="tier-status"><Check size={12} /> Renovado até Ago 2026</p>
            <Zap className="tier-icon-bg" />
        </div>

        <div className="seats-card">
            <div className="seats-header">
                <h3 className="seats-label">Utilização de Seats (Alunos)</h3>
                <span className="seats-count">{seatsUsed} / {totalSeats}</span>
            </div>
            <div className="seats-bar-container">
                <div 
                    ref={progressBarRef}
                    className="seats-bar-fill"
                />
            </div>
            <div className="seats-footer">
                <p className="seats-footer-label">Capacidade Ideal</p>
                <p className="seats-footer-value">{(totalSeats - seatsUsed)} Disponíveis</p>
            </div>
        </div>
      </div>

      <div className="billing-grid">
        <div className="billing-main-card">
            <h3 className="billing-title"><Users size={20} className="icon-blue" /> Próxima Fatura</h3>
            <div className="billing-row">
                <p className="billing-row-label">Assinatura Mensal (Base)</p>
                <p className="billing-row-value">R$ 4.500,00</p>
            </div>
            <div className="billing-row">
                <p className="billing-row-label">Add-on: WhatsApp Ilimitado</p>
                <p className="billing-row-value icon-emerald">INCLUSO</p>
            </div>
            <div className="billing-total-row">
                <p className="billing-total-label">Total Estimado</p>
                <p className="billing-total-value">R$ 4.500,00</p>
            </div>
            <button className="btn-billing-history">
                <CreditCard size={18} /> Ver Histórico de Faturas
            </button>
        </div>

        <div className="licensing-sidebar">
            <div className="quota-alert-card">
                <div className="quota-alert-icon-box">
                    <AlertCircle />
                </div>
                <div>
                    <h4 className="quota-alert-title">Aviso de Cota</h4>
                    <p className="quota-alert-text">Sua escola atingiu 42% da capacidade de seats contratada. Recomendamos expansão para 5.000 alunos no próximo bimestre.</p>
                </div>
            </div>
            
            <div className="upsell-card">
                <div className="upsell-icon-box">
                    <Zap className="upsell-icon" />
                </div>
                <h4 className="upsell-title">Precisa de mais recursos?</h4>
                <p className="upsell-text">Libere reconhecimento facial multi-unidade e integração com catracas legadas.</p>
                <button className="btn-upsell">
                    Falar com Consultor
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default LicensingManagement;
