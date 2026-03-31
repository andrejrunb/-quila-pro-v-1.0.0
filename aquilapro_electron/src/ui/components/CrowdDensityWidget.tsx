import React, { useState, useEffect } from 'react';
import { Users, AlertTriangle, TrendingUp } from 'lucide-react';

interface CrowdDensityWidgetProps {
  zoneId: string;
  zoneName: string;
  threshold?: number;
}

const CrowdDensityWidget: React.FC<CrowdDensityWidgetProps> = ({ zoneId, zoneName, threshold = 10 }) => {
  const [count, setCount] = useState(0);
  const [status, setStatus] = useState<'normal' | 'busy' | 'crowded'>('normal');

  useEffect(() => {
    const fetchDensity = async () => {
      if ((window as any).aquila?.getDensity) {
        const density = await (window as any).aquila.getDensity(zoneId);
        setCount(density);
        
        if (density >= threshold) setStatus('crowded');
        else if (density >= threshold * 0.7) setStatus('busy');
        else setStatus('normal');
      }
    };

    fetchDensity();
    const interval = setInterval(fetchDensity, 5000);
    return () => clearInterval(interval);
  }, [zoneId, threshold]);

  const getStatusColor = () => {
    switch (status) {
      case 'crowded': return 'text-red-500 bg-red-500/10 border-red-500/20';
      case 'busy': return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
      default: return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
    }
  };

  return (
    <div className={`p-4 rounded-xl border flex items-center justify-between ${getStatusColor()}`}>
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${status === 'crowded' ? 'bg-red-500 text-white' : 'bg-current opacity-20'}`}>
          <Users size={20} className={status === 'crowded' ? 'opacity-100' : 'opacity-100'} />
        </div>
        <div>
          <h4 className="text-sm font-semibold opacity-80">{zoneName}</h4>
          <p className="text-xs opacity-60">Status: {status.toUpperCase()}</p>
        </div>
      </div>
      
      <div className="text-right">
        <div className="text-2xl font-bold flex items-center gap-1 justify-end">
          {count}
          {status === 'crowded' && <AlertTriangle size={16} />}
        </div>
        <p className="text-[10px] opacity-60 flex items-center gap-1 justify-end">
          <TrendingUp size={10} />
          pessoas p/ min
        </p>
      </div>
    </div>
  );
};

export default CrowdDensityWidget;
