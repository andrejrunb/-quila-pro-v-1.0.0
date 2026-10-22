import React, { useState, useEffect } from 'react';
import { 
  ShoppingBag, Tag, Search, Filter, MessageCircle, 
  MapPin, Clock, ArrowLeft, Plus, CheckCircle
} from 'lucide-react';
import './CommunityMarketplace.css';

interface MarketplaceAd {
  id: string;
  title: string;
  category: 'uniform' | 'book' | 'equipment' | 'other';
  price: number;
  condition: 'new' | 'like-new' | 'used';
  description: string;
  sellerName: string;
  timestamp: string;
  image?: string;
  status: 'active' | 'sold';
}

export const CommunityMarketplace: React.FC<{ onBack?: () => void }> = ({ onBack }) => {
  const [ads, setAds] = useState<MarketplaceAd[]>([]);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const loadAds = async () => {
    setLoading(true);
    try {
      const res = await (window as any).aquila.invoke('marketplace:list-ads', { category: filter !== 'all' ? filter : undefined });
      if (res) {
        setAds(res);
      }
    } catch (err) {
      console.error('Erro ao carregar anúncios:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAds();
  }, [filter]);

  const categoryLabels: Record<string, string> = {
    uniform: 'Uniformes',
    book: 'Livros Didáticos',
    equipment: 'Equipamentos',
    other: 'Outros'
  };

  const conditionLabels: Record<string, string> = {
    new: 'Novo',
    'like-new': 'Seminovo',
    used: 'Usado'
  };

  const handleInterest = async (ad: MarketplaceAd) => {
    try {
      const res = await (window as any).aquila.invoke('community:send-notification', {
        userId: ad.sellerName, // Simplificação: nome como ID para demo
        title: 'Interesse no seu anúncio!',
        message: `Um pai tem interesse no item: ${ad.title}. Entre em contato para combinar.`,
        type: 'GENERAL'
      });
      if (res?.success) {
        alert('🎉 Interesse enviado ao vendedor! Ele receberá uma notificação.');
      }
    } catch (err) {
      console.error('Erro ao enviar interesse:', err);
    }
  };

  return (
    <div className="cm-container animate-fade-in">
      <header className="cm-header glass">
        <div className="cm-header-left">
          {onBack && <button className="cm-back-btn" onClick={onBack}><ArrowLeft size={20} /></button>}
          <div>
            <h1>Marketplace da Comunidade</h1>
            <p>Troca e venda segura entre pais e responsáveis</p>
          </div>
        </div>
        <button className="cm-add-btn">
          <Plus size={20} />
          <span>Criar Anúncio</span>
        </button>
      </header>

      <div className="cm-controls">
        <div className="cm-search glass">
          <Search size={18} />
          <input 
            type="text" 
            placeholder="O que você está procurando?" 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="cm-filters">
          {['all', 'uniform', 'book', 'equipment'].map(cat => (
            <button 
              key={cat}
              className={`cm-filter-chip ${filter === cat ? 'active' : ''}`}
              onClick={() => setFilter(cat)}
            >
              {cat === 'all' ? 'Tudo' : categoryLabels[cat]}
            </button>
          ))}
        </div>
      </div>

      <div className="cm-grid">
        {loading ? (
          <div className="cm-loading">Sincronizando com a Rede Áquila...</div>
        ) : ads.length > 0 ? (
          ads.filter(ad => ad.title.toLowerCase().includes(search.toLowerCase())).map(ad => (
            <div key={ad.id} className="cm-ad-card glass">
              <div className="cm-ad-image">
                {ad.image ? <img src={ad.image} alt={ad.title} /> : <div className="cm-placeholder"><ShoppingBag size={48} /></div>}
                <div className="cm-ad-badge">{categoryLabels[ad.category]}</div>
              </div>
              <div className="cm-ad-content">
                <div className="cm-ad-header">
                  <h3 className="cm-ad-title">{ad.title}</h3>
                  <span className="cm-ad-price">R$ {ad.price.toFixed(2)}</span>
                </div>
                <p className="cm-ad-desc">{ad.description}</p>
                <div className="cm-ad-meta">
                  <span><Tag size={12} /> {conditionLabels[ad.condition]}</span>
                  <span><Clock size={12} /> {new Date(ad.timestamp).toLocaleDateString()}</span>
                </div>
                <div className="cm-ad-seller">
                  <div className="cm-seller-info">
                    <div className="cm-seller-avatar">{(ad.sellerName || 'P').charAt(0)}</div>
                    <span>{ad.sellerName}</span>
                    <CheckCircle size={12} className="cm-verified-icon" />
                  </div>
                  <button 
                    className="cm-interest-btn"
                    onClick={() => handleInterest(ad)}
                  >
                    <MessageCircle size={16} />
                    Tenho Interesse
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="cm-empty">
            <ShoppingBag size={64} />
            <h2>Nenhum anúncio encontrado</h2>
            <p>Seja o primeiro a anunciar um item para a comunidade!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CommunityMarketplace;
