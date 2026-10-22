import React, { useState, useEffect } from 'react';
import { Coins, TrendingUp } from 'lucide-react';
import '../Dashboard.css'; // Reuso de estilos elite

export const EagleBalance: React.FC<{ userId: string }> = ({ userId }) => {
    const [balance, setBalance] = useState(100);
    const [lastTx, setLastTx] = useState<string>('');

    useEffect(() => {
        const updateBalance = async () => {
            if (window.aquila) {
                // Simulação via invoke até exportarmos o serviço real para a bridge IPC
                const wallet = await window.aquila.invoke('gamification:get-wallet', userId);
                if (wallet) {
                    setBalance(wallet.balance);
                    if (wallet.transactions.length > 0) {
                        setLastTx(wallet.transactions[0].reason);
                    }
                }
            }
        };

        updateBalance();
        const interval = setInterval(updateBalance, 10000);
        return () => clearInterval(interval);
    }, [userId]);

    return (
        <div className="eagle-balance-card">
            <div className="balance-info">
                <div className="coin-icon">
                    <Coins size={20} color="#fbbf24" />
                </div>
                <div className="balance-text">
                    <span className="balance-label">Eagle Coins</span>
                    <span className="balance-value">{balance} EC</span>
                </div>
            </div>
            {lastTx && (
                <div className="last-transaction">
                    <TrendingUp size={12} />
                    <span>{lastTx}</span>
                </div>
            )}
        </div>
    );
};
