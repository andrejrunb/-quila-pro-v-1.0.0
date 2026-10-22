import React, { useEffect } from 'react';

/**
 * HandoffManagerUI
 * Detecção automática silenciosa de dispositivo (Desktop vs Mobile) sem poluir o layout visual.
 */
const HandoffManagerUI: React.FC = () => {
  useEffect(() => {
    const isMobileViewport = window.innerWidth <= 768 || /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    document.documentElement.setAttribute('data-device-mode', isMobileViewport ? 'mobile' : 'desktop');
  }, []);

  return null;
};

export default HandoffManagerUI;
