import React from 'react';
import { ResponsiveContainer, AreaChart, Area } from 'recharts';
import { EagleCard } from './EagleCard';

const getSparklineData = (currentValue: number) => {
  const base = currentValue || 10;
  return Array.from({ length: 8 }, (_, i) => ({
    value: Math.max(0, base + Math.sin(i) * (base * 0.2) + (Math.random() - 0.5) * (base * 0.1))
  }));
};

const KpiSparkline: React.FC<{ color: string; value: number }> = ({ color, value }) => {
  const data = React.useMemo(() => getSparklineData(value), [value]);
  
  return (
    <div className="w-full h-10 mt-2">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id={`grad-${color}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.3}/>
              <stop offset="95%" stopColor={color} stopOpacity={0}/>
            </linearGradient>
          </defs>
          <Area 
            type="monotone" 
            dataKey="value" 
            stroke={color} 
            fillOpacity={1} 
            fill={`url(#grad-${color})`} 
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

interface EagleKpiCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trendColor?: string;
  onClick?: () => void;
  className?: string;
  glow?: boolean;
}

export const EagleKpiCard: React.FC<EagleKpiCardProps> = ({
  title,
  value,
  icon,
  trendColor = '#3b82f6', // Default blue
  onClick,
  className = '',
  glow = false
}) => {
  return (
    <EagleCard 
      className={`flex flex-col animate-fade-in ${className}`} 
      clickable={!!onClick}
      onClick={onClick}
      glow={glow}
    >
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-full flex items-center justify-center bg-white/5 border border-white/10" style={{ color: trendColor }}>
          {icon}
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">{title}</span>
          <h3 className="text-2xl font-black text-white">{value}</h3>
        </div>
      </div>
      <KpiSparkline color={trendColor} value={typeof value === 'number' ? value : parseFloat(value as string) || 0} />
    </EagleCard>
  );
};
