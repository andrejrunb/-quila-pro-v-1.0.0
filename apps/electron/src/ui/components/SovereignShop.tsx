import React, { useState, useEffect } from 'react';
import './SovereignShop.css';

interface ShopItem {
  id: string;
  name: string;
  price: number;
  type: 'skin' | 'avatar';
  preview: string;
}

const SHOP_ITEMS: ShopItem[] = [
  { id: 'skin_dark_neon', name: 'Dark Neon Skin', price: 500, type: 'skin', preview: '🌌' },
  { id: 'skin_cyberpunk', name: 'Cyberpunk Red', price: 750, type: 'skin', preview: '💊' },
  { id: 'avatar_samurai', name: 'Samurai AI', price: 1200, type: 'avatar', preview: '🥷' },
  { id: 'avatar_scientist', name: 'Digital Einstein', price: 1500, type: 'avatar', preview: '👨‍🔬' },
  { id: 'skin_gold', name: 'Elite Gold', price: 3000, type: 'skin', preview: '✨' },
];

interface Props {
  studentId: string;
  onClose: () => void;
  onUpdate: () => void;
}

const SovereignShop: React.FC<Props> = ({ studentId, onClose, onUpdate }) => {
  const [balance, setBalance] = useState<number>(0);
  const [unlockedItems, setUnlockedItems] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchaseMsg, setPurchaseMsg] = useState('');

  useEffect(() => {
    loadEconomy();
  }, [studentId]);

  const loadEconomy = async () => {
    try {
      const economy = await (window as any).electron.invoke('get-student-economy', studentId);
      setBalance(economy.balance);
      setUnlockedItems(economy.unlocked_items);
    } catch (err) {
      console.error('Failed to load shop economy:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleBuy = async (item: ShopItem) => {
    if (balance < item.price) {
      setPurchaseMsg('Saldo insuficiente!');
      return;
    }

    try {
      const result = await (window as any).electron.invoke('purchase-student-item', {
        studentId,
        itemId: item.id,
        price: item.price
      });

      if (result.success) {
        setPurchaseMsg(`Desbloqueado: ${item.name}!`);
        await loadEconomy();
        onUpdate();
      } else {
        setPurchaseMsg(result.message);
      }
    } catch (err) {
      setPurchaseMsg('Erro na transação.');
    }
  };

  if (loading) return <div className="shop-loading">Carregando Mercado...</div>;

  return (
    <div className="shop-overlay" onClick={onClose}>
      <div className="shop-container" onClick={e => e.stopPropagation()}>
        <header className="shop-header">
          <div className="shop-title">
            <h1>Mercado de Soberania</h1>
            <p>Troque seu esforço por capital digital</p>
          </div>
          <div className="shop-balance">
            <span className="coin-icon">💎</span>
            <span className="balance-value">{balance} AQC</span>
          </div>
        </header>

        {purchaseMsg && <div className="shop-alert">{purchaseMsg}</div>}

        <div className="shop-grid">
          {SHOP_ITEMS.map(item => {
            const isUnlocked = unlockedItems.includes(item.id);
            return (
              <div key={item.id} className={`shop-card ${isUnlocked ? 'unlocked' : ''}`}>
                <div className="item-preview">{item.preview}</div>
                <div className="item-info">
                  <h3>{item.name}</h3>
                  <span className="item-type">{item.type.toUpperCase()}</span>
                </div>
                <button 
                  className={`buy-btn ${isUnlocked ? 'equipped' : ''}`}
                  onClick={() => !isUnlocked && handleBuy(item)}
                  disabled={isUnlocked}
                >
                  {isUnlocked ? 'ADQUIRIDO' : `${item.price} AQC`}
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
