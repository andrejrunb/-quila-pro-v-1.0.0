import React from 'react';
import './MeritFinanceDashboard.css';

const MeritFinanceDashboard: React.FC = () => {
    return (
        <div className="merit-finance-container">
            <header className="merit-header">
                <h1>💰 Dashboard de Mérito Financeiro</h1>
                <p>Onde seu esforço pedagógico se transforma em economia soberana.</p>
            </header>

            <div className="grant-grid">
                <div className="grant-card balance-card">
                    <h3>Créditos de Mérito</h3>
                    <div className="balance-value">R$ 150,00</div>
                    <p>Disponível para materiais e cursos extras</p>
                    <button className="redeem-btn">Resgatar Créditos</button>
                </div>

                <div className="grant-card scholarship-card">
                    <h3>Bolsa Atual (Smart Grant)</h3>
                    <div className="scholarship-value">15% <span>de desconto</span></div>
                    <p>Válido para a próxima mensalidade</p>
                    <div className="status-badge">🛡️ Ledger Verified</div>
                </div>
            </div>

            <div className="progress-section">
                <h3>🚀 Rumo ao Próximo Nível de Bolsa</h3>
                <div className="progress-track">
                    <div className="progress-label">
                        <span>Status: <strong>Assiduidade de Platina</strong></span>
                        <span>80% concluído</span>
                    </div>
                    <div className="progress-bar-container">
                        <div className="progress-bar" style={{ width: '80%' }}></div>
                    </div>
                    <p className="progress-hint">Faltam apenas <strong>4 dias</strong> de presença validada para subir para 20% de desconto!</p>
                </div>
            </div>

            <div className="history-section">
                <h3>📜 Extrato de Mérito (Sovereign Ledger)</h3>
                <div className="history-table">
                    <div className="history-row header">
                        <span>Data</span>
                        <span>Descrição</span>
                        <span>Bônus</span>
                        <span>Hash</span>
                    </div>
                    <div className="history-row">
                        <span>18/04/2026</span>
                        <span>Presença PoA Validada</span>
                        <span className="positive">+R$ 2,50</span>
                        <code className="hash">a8f2...9d2e</code>
                    </div>
                    <div className="history-row">
                        <span>17/04/2026</span>
                        <span>Conquista: Nível 15</span>
                        <span className="positive">+R$ 50,00</span>
                        <code className="hash">bc71...ee41</code>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MeritFinanceDashboard;
