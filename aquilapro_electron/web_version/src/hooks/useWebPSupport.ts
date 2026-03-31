import { useEffect, useState } from 'react';

/**
 * Hook para detectar suporte a WebP no navegador
 * Retorna true se o navegador suporta WebP, false caso contrário
 */
export function useWebPSupport(): boolean {
  const [supportsWebP, setSupportsWebP] = useState(false);

  useEffect(() => {
    // Verificar suporte a WebP
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    
    try {
      const webp = canvas.toDataURL('image/webp');
      setSupportsWebP(webp.indexOf('image/webp') === 5);
    } catch (e) {
      setSupportsWebP(false);
    }
  }, []);

  return supportsWebP;
}

export default useWebPSupport;
