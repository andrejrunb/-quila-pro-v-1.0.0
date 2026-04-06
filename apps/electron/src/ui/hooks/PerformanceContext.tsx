import React, { createContext, useContext, useState, useEffect } from 'react';

interface PerformanceContextProps {
  isLiteMode: boolean;
  setLiteMode: (active: boolean) => void;
  hardwareProfile: any;
}

const PerformanceContext = createContext<PerformanceContextProps | undefined>(undefined);

export const PerformanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLiteMode, setIsLiteMode] = useState(false);
  const [hardwareProfile, setHardwareProfile] = useState<any>(null);

  useEffect(() => {
    // Detect hardware profile initially
    if (window.aquila && window.aquila.getHardwareProfile) {
      window.aquila.getHardwareProfile().then((profile: any) => {
        setHardwareProfile(profile);
        
        // Auto-detect Lite Mode if RAM < 8GB or CPU cores < 4
        const savedMode = localStorage.getItem('aquila-lite-mode');
        if (savedMode !== null) {
          setIsLiteMode(savedMode === 'true');
        } else if (profile.totalRamGB < 8 || profile.cpuCores < 4) {
          setIsLiteMode(true);
        }
      });
    }
  }, []);

  useEffect(() => {
    // Apply class to body for global CSS selectors
    if (isLiteMode) {
      document.body.classList.add('mode-lite');
    } else {
      document.body.classList.remove('mode-lite');
    }
    localStorage.setItem('aquila-lite-mode', String(isLiteMode));
  }, [isLiteMode]);

  const setLiteMode = (active: boolean) => {
    setIsLiteMode(active);
  };

  return (
    <PerformanceContext.Provider value={{ isLiteMode, setLiteMode, hardwareProfile }}>
      {children}
    </PerformanceContext.Provider>
  );
};

export const usePerformance = () => {
  const context = useContext(PerformanceContext);
  if (!context) {
    throw new Error('usePerformance must be used within a PerformanceProvider');
  }
  return context;
};
