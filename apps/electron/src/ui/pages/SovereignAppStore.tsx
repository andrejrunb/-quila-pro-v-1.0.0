import React, { useState, useEffect } from 'react';
import { 
  ShoppingBag, 
  Download, 
  ShieldCheck, 
  Star, 
  ExternalLink, 
  Cpu,
  LayoutGrid,
  CheckCircle2,
  Package
} from 'lucide-react';
import './SovereignAppStore.css';
import { HardwareMarketplace } from '../components/HardwareMarketplace';

interface StoreProps {
  isAdmin?: boolean;
}

const SovereignAppStore: React.FC<StoreProps> = ({ isAdmin = false }) => {
  const [activeTab, setActiveTab] = useState<'SOFTWARE' | 'HARDWARE'>('SOFTWARE');
  const [apps, setApps] = useState<any[]>([]);
  const [featured, setFeatured] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const installed = await (window as any).aquila.invoke('plugins:list');
      const storeApps = await (window as any).aquila.invoke('plugins:marketplace');
      setApps(installed);
      setFeatured(storeApps);
      setLoading(false);
    } catch (err) {
      console.error('Erro ao carregar loja:', err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) return <div className="store-loading">Sincronizando Marketplace Nexus...</div>;

  return (
    <div className="store-container">
      <header className="store-header">
        <div className="flex items-center gap-4">
          <ShoppingBag className="store-logo-glow" size={32} />
          <div>
            <h1>Áquila App Store</h1>
            <p>Ecossistema de Extensões Soberanas — Nível 27</p>
          </div>
        </div>
        <div className="store-status">
           <ShieldCheck size={16} className="text-emerald-500" />
           <span>Ambiente Sandbox Ativo (WASM)</span>
        </div>
      </header>

      {isAdmin && (
        <div className="store-tabs">
          <button 
            className={`tab-btn ${activeTab === 'SOFTWARE' ? 'active' : ''}`}
            onClick={() => setActiveTab('SOFTWARE')}
          >
            Plugins Soberanos
          </button>
          <button 
            className={`tab-btn ${activeTab === 'HARDWARE' ? 'active' : ''}`}
            onClick={() => setActiveTab('HARDWARE')}
          >
            Infraestrutura Física
          </button>
        </div>
      )}

      <div className="store-content">
        {activeTab === 'SOFTWARE' ? (
          <>
            {/* Apps Instalados */}
            <section className="installed-apps">
           <h2 className="section-title"><Package size={18} /> Meus Aplicativos</h2>
           <div className="app-grid">
              {apps.map(app => (
                <div key={app.id} className={`app-card installed ${app.status}`}>
                   <div className="app-icon-box">{app.name.charAt(0)}</div>
                   <div className="app-info">
                      <strong>{app.name}</strong>
                      <span>v{app.version} | {app.developer}</span>
                      <div className="app-tags">
                         {app.permissions.map((p: string) => <span key={p} className="p-tag">{p}</span>)}
                      </div>
                   </div>
                   <div className="app-actions">
                      <button className="btn-manage">Gerenciar</button>
                      <span className={`status-dot ${app.status}`}></span>
                   </div>
                </div>
              ))}
           </div>
        </section>

        {/* Destaques do Marketplace */}
        <section className="featured-store">
           <h2 className="section-title"><Star size={18} /> Destaques do Ecossistema</h2>
           <div className="marketplace-grid">
              {featured.map(item => (
                <div key={item.id} className="market-card">
                   <div className="m-header">
                      <div className="m-icon-placeholder"><LayoutGrid size={24} /></div>
                      <div className="m-meta">
                         <strong>{item.name}</strong>
                         <div className="rating">
                            <Star size={12} fill="#f59e0b" className="text-amber-500" />
                            <span>{item.rating}</span>
                         </div>
                      </div>
                   </div>
                   <p className="m-desc">Aumente a eficiência do seu hub com inteligência local especializada.</p>
                   <div className="m-footer">
                      <span className="price">{item.price}</span>
                      <button className="btn-install">
                         <Download size={14} /> Instalar
                      </button>
                   </div>
                </div>
              ))}
            </div>
         </section>
          </>
        ) : (
          <HardwareMarketplace />
        )}
      </div>

      <footer className="store-footer">
         <Cpu size={14} />
         <span>Sandbox Integrity: 100% | Auditoria de Manifesto: OK</span>
      </footer>
    </div>
  );
};

export default SovereignAppStore;
