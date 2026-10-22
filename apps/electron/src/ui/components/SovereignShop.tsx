import React, { useState, useEffect } from 'react';
import { Sparkles, Gift, Check, Trophy, ShieldCheck } from 'lucide-react';
import './SovereignShop.css';

interface ShopItem {
  id: string;
  name: string;
  price: number;
  type: 'skin' | 'avatar';
  preview: string;
  description: string;
}

const SHOP_ITEMS: ShopItem[] = [
  { id: 'skin_dark_neon', name: 'Dark Neon Skin', price: 500, type: 'skin', preview: '🌌', description: 'Tema visual noturno com bordas fluorescentes de alta concentração.' },
  { id: 'skin_cyberpunk', name: 'Cyberpunk Red', price: 750, type: 'skin', preview: '💊', description: 'Paleta inspirada na estética Cyberpunk com acentos rubros e contraste extremo.' },
  { id: 'avatar_samurai', name: 'Samurai AI', price: 1200, type: 'avatar', preview: '🥷', description: 'Avatar lendário de honra acadêmica e disciplina milenar nos estudos.' },
  { id: 'avatar_scientist', name: 'Digital Einstein', price: 1500, type: 'avatar', preview: '👨‍🔬', description: 'Avatar em homenagem ao mestre da física moderna e curiosidade infinita.' },
  { id: 'skin_gold', name: 'Elite Gold', price: 3000, type: 'skin', preview: '✨', description: 'Aura dourada reservada aos estudantes com maestria e assiduidade máxima.' },
];

interface Props {
  studentId: string;
  onClose: () => void;
  onUpdate: () => void;
}

export const SovereignShop: React.FC<Props> = ({ studentId, onClose, onUpdate }) => {
  const [balance, setBalance] = useState<number>(1000);
  const [unlockedItems, setUnlockedItems] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchaseMsg, setPurchaseMsg] = useState<{ text: string; type: 'success' | 'warn' | 'info' } | null>(null);

  useEffect(() => {
    loadEconomy();
  }, [studentId]);

  const loadEconomy = async () => {
    try {
      if (window.aquila?.student?.getEconomy) {
        const economy = await window.aquila.student.getEconomy(studentId);
        if (economy) {
          setBalance(economy.aureusBalance ?? 1000);
          const ids = (economy.inventory || []).map((i: any) => i.id || i);
          setUnlockedItems(ids);
          return;
        }
      }
    } catch (err) {
      console.warn('Usando saldo local de contingência:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleClaimBonus = async (amount: number = 500, label: string = 'Bônus Diário') => {
    try {
      if (window.aquila?.invoke) {
        await window.aquila.invoke('grant-student-coins', { studentId, amount });
      }
    } catch (e) {
      // contingência
    }
    setBalance(prev => prev + amount);
    setPurchaseMsg({ text: `🎉 Parabéns! Você resgatou +${amount} AQC (${label})!`, type: 'success' });
    onUpdate();
  };

  const handleBuy = async (item: ShopItem) => {
    if (balance < item.price) {
      setPurchaseMsg({
        text: `Saldo insuficiente (${balance} AQC). Conclua desafios na Câmara de Maestria ou resgate o bônus diário abaixo!`,
        type: 'warn'
      });
      return;
    }

    try {
      if (window.aquila?.invoke) {
        await window.aquila.invoke('purchase-student-item', {
          studentId,
          itemId: item.id,
          price: item.price
        });
      }
    } catch (err) {
      console.warn('Transação operando em modo offline:', err);
    }

    setBalance(prev => Math.max(0, prev - item.price));
    setUnlockedItems(prev => Array.from(new Set([...prev, item.id])));
    setPurchaseMsg({ text: `✨ Desbloqueado com sucesso: ${item.name}! Item equipado.`, type: 'success' });
    onUpdate();
  };

  if (loading) return <div className="shop-loading">Carregando Mercado de Soberania...</div>;

  return (
    <div className="shop-overlay" onClick={onClose}>
      <div className="shop-container" onClick={e => e.stopPropagation()}>
        <header className="shop-header">
          <div className="shop-title">
            <h1>Mercado de Soberania</h1>
            <p>Troque seu esforço acadêmico por cosméticos e títulos digitais exclusivos</p>
          </div>
          <div className="shop-balance">
            <span className="coin-icon">💎</span>
            <span className="balance-value">{balance.toLocaleString('pt-BR')} AQC</span>
          </div>
        </header>

        {/* FEEDBACK BANNER */}
        {purchaseMsg && (
          <div
            className={`shop-alert ${purchaseMsg.type}`}
            style={{
              padding: '12px 18px',
              borderRadius: 10,
              marginBottom: 16,
              background: purchaseMsg.type === 'success' ? 'rgba(52, 211, 153, 0.15)' : 'rgba(239, 68, 68, 0.15)',
              border: purchaseMsg.type === 'success' ? '1px solid #34d399' : '1px solid #ef4444',
              color: purchaseMsg.type === 'success' ? '#34d399' : '#fca5a5',
              fontSize: '0.88rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}
          >
            {purchaseMsg.text}
          </div>
        )}

        {/* RECOMPENSA / FAUCET PEDAGÓGICO */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 18 }}>
          <button
            className="af-btn"
            style={{ flex: 1, padding: '10px 16px', background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none' }}
            onClick={() => handleClaimBonus(500, 'Presença & Foco em Sala')}
          >
            <Gift size={16} />
            <span>Coletar Bônus Diário (+500 AQC)</span>
          </button>
          <button
            className="af-btn ghost"
            style={{ flex: 1, padding: '10px 16px' }}
            onClick={() => handleClaimBonus(1000, 'Conquista de Maestria')}
          >
            <Trophy size={16} />
            <span>Resgatar Recompensa de Estudo (+1.000 AQC)</span>
          </button>
        </div>

        {/* GRID DE ITENS */}
        <div className="shop-grid">
          {SHOP_ITEMS.map(item => {
            const isUnlocked = unlockedItems.includes(item.id);
            const canAfford = balance >= item.price;
            return (
              <div key={item.id} className={`shop-card ${isUnlocked ? 'unlocked' : ''}`}>
                <div className="item-preview">{item.preview}</div>
                <div className="item-info">
                  <h3>{item.name}</h3>
                  <span className="item-type">{item.type.toUpperCase()}</span>
                  <p style={{ fontSize: '0.72rem', color: '#94a3b8', margin: '4px 0 0', lineHeight: 1.3 }}>
                    {item.description}
                  </p>
                </div>
                <button
                  className={`buy-btn ${isUnlocked ? 'equipped' : canAfford ? '' : 'locked'}`}
                  onClick={() => !isUnlocked && handleBuy(item)}
                  disabled={isUnlocked}
                  style={{
                    background: isUnlocked
                      ? 'rgba(52, 211, 153, 0.2)'
                      : canAfford
                      ? 'linear-gradient(135deg, #0ea5e9, #6366f1)'
                      : 'rgba(255,255,255,0.08)',
                    borderColor: isUnlocked ? '#34d399' : canAfford ? '#38bdf8' : 'rgba(255,255,255,0.1)',
                    color: isUnlocked ? '#34d399' : '#ffffff'
                  }}
                >
                  {isUnlocked ? '✓ EQUIPADO' : `${item.price} AQC`}
                </button>
              </div>
            );
          })}
        </div>

        <button className="shop-close-btn" onClick={onClose}>Voltar ao Estudo</button>
      </div>
    </div>
  );
};

export default SovereignShop;
