import React, { useState, useEffect } from 'react';
import './PedagogicalMarketplace.css';

// Inteface Mock para o Frontend
interface MarketAsset {
  id: string;
  title: string;
  type: string;
  price: number;
  authorId: string;
  rating: number;
  tags: string[];
  effectivenessScore?: number;
}

export const PedagogicalMarketplace: React.FC = () => {
  const [assets, setAssets] = useState<MarketAsset[]>([]);
  const [balance, setBalance] = useState(1250); 
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => {
      setAssets([
        {
          id: 'asset-quantum-physics-101',
          title: 'Física Quântica para Crianças (Prompt Evoluído)',
          type: 'AI_PROMPT',
          price: 150,
          authorId: 'Prof. Andrej',
          rating: 4.9,
          effectivenessScore: 0.94,
          tags: ['Ciência', 'IA', 'Primário']
        },
        {
          id: 'asset-history-rpg',
          title: 'História do Brasil: RPG de Mesa Didático',
          type: 'LESSON_PLAN',
          price: 80,
          authorId: 'Prof. Thaysa',
          rating: 4.7,
          effectivenessScore: 0.82,
          tags: ['História', 'Gamificação']
        },
        {
          id: 'asset-algebra-flashcards',
          title: 'Álgebra Universal (Flashcards Anki-ready)',
          type: 'FLASHCARDS',
          price: 45,
          authorId: 'Córtex Central',
          rating: 5.0,
          effectivenessScore: 0.98,
          tags: ['Matemática', 'Vestibular']
        },
        {
          id: 'asset-chemistry-vr',
          title: 'Laboratório de Química VR (Guia de Setup)',
          type: 'EXPERIMENT',
          price: 95,
          authorId: 'Prof. Marcus',
          rating: 4.8,
          effectivenessScore: 0.88,
          tags: ['Química', 'VR', 'Edge Hub']
        }
      ]);
      setLoading(false);
    }, 800);
  }, []);

  const handleBuy = (asset: MarketAsset) => {
    if (balance >= asset.price) {
      setBalance(prev => prev - asset.price);
      alert(`🎉 Sucesso! Você adquiriu um material verificado pelo Córtex. Monitoramento de impacto iniciado.`);
    } else {
      alert('⚠️ Créditos insuficientes.');
    }
  };

  if (loading) {
    return <div className="marketplace-container"><h1>Sincronizando Auditoria Córtex...</h1></div>;
  }

  return (
    <div className="marketplace-container">
      <header className="marketplace-header">
        <div className="marketplace-title">
          <h1>Sovereign Marketplace</h1>
          <p>Potencializado pela Auditoria Pedagógica Córtex AI</p>
        </div>
        <div className="marketplace-stats">
          <div className="stat-chip">
            🤖 Córtex Verified: 65% do Catálogo
          </div>
          <div className="stat-chip merit">
            💎 Seu Saldo: {balance} Créditos
          </div>
        </div>
      </header>

      <div className="asset-grid">
        {assets.map(asset => (
          <div key={asset.id} className={`asset-card ${asset.effectivenessScore && asset.effectivenessScore > 0.9 ? 'verified' : ''}`}>
            {asset.effectivenessScore && asset.effectivenessScore > 0.9 && (
              <div className="cortex-badge" title="Alta performance pedagógica comprovada">
                💎 CÓRTEX VERIFIED
              </div>
            )}
            <span className="asset-type">{asset.type ? asset.type.replace('_', ' ') : 'Recurso'}</span>
            <h3 className="asset-title">{asset.title}</h3>
            
            <div className="asset-tags">
              {asset.tags.map(tag => (
                <span key={tag} className="tag">{tag}</span>
              ))}
            </div>

            <div className="asset-footer">
              <div className="asset-author">
                Por {asset.authorId}
                <div style={{ color: '#ffd700', marginTop: '4px', fontSize: '10px' }}>
                  IMPACTO: {asset.effectivenessScore ? `+${Math.round(asset.effectivenessScore * 100)}% Performance` : 'Auditando...'}
                </div>
              </div>
              
              <div className="asset-action">
                <div className="asset-price">
                  <span>💎</span> {asset.price}
                </div>
                <button 
                  className="buy-button"
                  onClick={() => handleBuy(asset)}
                >
                  Adquirir
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PedagogicalMarketplace;
