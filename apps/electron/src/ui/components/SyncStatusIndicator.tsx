import React, { useState, useEffect } from 'react';
import './SyncStatusIndicator.css';

export const SyncStatusIndicator: React.FC = () => {
  const [status, setStatus] = useState<'idle' | 'syncing' | 'error' | 'offline'>('idle');
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [isEnrolled, setIsEnrolled] = useState(false);

  useEffect(() => {
    // Carregar estado inicial
    const init = async () => {
      const data = await (window as any).aquila.invoke('sync:get-status');
      setIsEnrolled(data.isEnrolled);
      setLastSync(data.lastSync);
      if (!data.isEnrolled) setStatus('offline');
    };
    init();

    // Ouvir atualizações
    const cleanup = (window as any).aquila.onSyncStatus((_event: any, data: any) => {
      setStatus(data.status);
      if (data.lastSync) setLastSync(data.lastSync);
    });

    return () => {
      if (typeof cleanup === 'function') cleanup();
    };
  }, []);

  const getStatusText = () => {
    if (!isEnrolled) return 'Escola não matriculada na nuvem';
    if (status === 'syncing') return 'Sincronizando com a nuvem...';
    if (status === 'error') return 'Erro na conexão com a nuvem';
    if (!lastSync) return 'Conectado. Aguardando primeira sincronização.';
    return `Última Sincronização: ${new Date(lastSync).toLocaleString('pt-BR')}`;
  };

  const getStatusLabel = () => {
    if (!isEnrolled) return 'Offline';
    if (status === 'syncing') return 'Sync...';
    return 'Nuvem';
  };

  return (
    <div className={`sync-status-indicator glass ${isEnrolled ? 'enrolled' : 'unregistered'}`} title={getStatusText()}>
      <div className={`status-dot ${status}`}></div>
      <span className="status-label">{getStatusLabel()}</span>
    </div>
  );
};

export default SyncStatusIndicator;
