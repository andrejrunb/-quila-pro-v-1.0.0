import { useEffect } from 'react';

/**
 * Hook para registrar o Service Worker
 * Permite cache offline de imagens e assets estáticos
 */
export function useServiceWorker(): void {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/service-worker.js')
        .then((registration) => {
          console.log('Service Worker registrado com sucesso:', registration);
        })
        .catch((error) => {
          console.log('Erro ao registrar Service Worker:', error);
        });
    }
  }, []);
}

export default useServiceWorker;
