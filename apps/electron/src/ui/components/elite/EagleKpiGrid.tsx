import React from 'react';

interface EagleKpiGridProps {
  children: React.ReactNode;
  className?: string;
}

export const EagleKpiGrid: React.FC<EagleKpiGridProps> = ({ children, className = '' }) => {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 w-full ${className}`}>
      {children}
    </div>
  );
};
