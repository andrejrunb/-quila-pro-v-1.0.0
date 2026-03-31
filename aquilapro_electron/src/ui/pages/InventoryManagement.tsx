import React, { useState, useEffect, useRef } from 'react';
import { 
  Package, Truck, Eye, AlertTriangle, 
  ChevronRight, ArrowLeft, RefreshCw, 
  Camera, LayoutGrid, Box 
} from 'lucide-react';
import { inventoryVision, StockDetection } from '../../services/InventoryVisionService';
import { crateGrid, ReplenishmentOrder } from '../../services/CrateGridController';
import './InventoryManagement.css';

interface InventoryProps {
  onBack: () => void;
}

export const InventoryManagement: React.FC<InventoryProps> = ({ onBack }) => {
  const [stock, setStock] = useState<StockDetection[]>([]);
  const [isVisionActive, setIsVisionActive] = useState(true);
  const [orders, setOrders] = useState<ReplenishmentOrder[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const liveStock = await inventoryVision.processZoneStream('all');
      setStock(liveStock);
      setOrders(crateGrid.auditStock());
    };

    fetchData();
    const interval = setInterval(fetchData, 10000); // 10s sync
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="inventory-container" role="main" aria-label="Crate-Grid Logistics">
      <header className="inventory-header">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="btn-back" title="Go Back">
            <ArrowLeft size={24} />
          </button>
          <div className="inventory-title-group">
            <h1>Crate-Grid <span className="text-secondary">Logistics</span></h1>
            <p className="text-sm opacity-60">Industrial Asset & Inventory Control // v3570</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="vision-overlay-active">
            <Eye size={14} className="animate-pulse" />
            COMPUTER VISION: ACTIVE
          </div>
          <button className="vision-toggle-btn" onClick={() => setIsVisionActive(!isVisionActive)} title="Toggle Vision Overlay">
            <Camera size={18} />
          </button>
        </div>
      </header>

      <div className="grid grid-cols-12 gap-6">
        {/* Main Grid */}
        <div className="col-span-8">
          <div className="crate-grid">
            {stock.map(item => (
              <InventoryItemCard key={item.itemId} item={item} />
            ))}
          </div>
        </div>

        {/* Sidebar Alerts & Orders */}
        <aside className="col-span-4">
          <div className="orders-panel">
            <h2 className="flex items-center gap-2 text-lg font-bold mb-4">
              <Truck size={20} className="text-logistic-amber" />
              Autonomous Replenishment
            </h2>
            <div className="orders-list">
              {orders.length === 0 && (
                <div className="text-center py-8 opacity-40">
                  <Box size={32} className="mx-auto mb-2" />
                  <p className="text-xs">No pending orders. Stock is optimal.</p>
                </div>
              )}
              {orders.map(order => (
                <div key={order.orderId} className={`order-item-mini ${order.priority}`}>
                   <div className="flex justify-between items-start">
                     <span className="text-xs font-black uppercase">{order.priority}</span>
                     <span className="text-[10px] opacity-50">{new Date(order.timestamp).toLocaleTimeString()}</span>
                   </div>
                   <div className="text-sm font-bold mt-1">Refill Request: {order.itemId}</div>
                   <div className="text-[10px] uppercase mt-1">Quantity: {order.quantity} units</div>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

const InventoryItemCard: React.FC<{ item: StockDetection }> = ({ item }) => {
  const barRef = useRef<HTMLDivElement>(null);
  const STOCK_MAX = 50; // Mock Max

  useEffect(() => {
    if (barRef.current) {
      const percent = Math.min((item.count / STOCK_MAX) * 100, 100);
      barRef.current.style.setProperty('--stock-percent', `${percent}%`);
    }
  }, [item.count]);

  return (
    <div className="inventory-card">
      <div className="item-meta">
        <div>
          <div className="item-name">{item.name}</div>
          <div className="item-zone">{item.zone}</div>
        </div>
        <Package size={20} className="text-logistic-amber opacity-30" />
      </div>

      <div className="stock-info">
        <div className="flex justify-between items-end mb-1">
          <span className="text-2xl font-black">{item.count}</span>
          <span className="text-[10px] opacity-40 pb-1">/ {STOCK_MAX} UNITS</span>
        </div>
        <div className="stock-meter-bg">
          <div 
            ref={barRef}
            className={`stock-meter-fill ${item.count < 5 ? 'critical' : ''}`}
          />
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-white/5 flex justify-between items-center">
        <div className="vision-tag">
          CV CONF: {(item.confidence * 100).toFixed(1)}%
        </div>
        <button className="btn-restock" title="Manual Restock">
          <RefreshCw size={14} /> RESTOCK
        </button>
      </div>
    </div>
  );
};
