import { useEffect, useState } from 'react';
import useWebSocket from './useWebSocket';

export interface WSNotification {
  type: 'face_recognition' | 'alert' | 'presence' | 'status' | 'camera' | 'detection';
  data: any;
  timestamp: Date;
}

/**
 * useWSNotifications — Hook especializado para Áquila Pro v3.5
 * Encapsula a lógica de roteamento de mensagens do WebSocket.
 */
export const useWSNotifications = (onNotification?: (notif: WSNotification) => void) => {
  const { isConnected, lastMessage, send, error } = useWebSocket('ws://localhost:9000');
  const [notifications, setNotifications] = useState<WSNotification[]>([]);

  useEffect(() => {
    if (lastMessage) {
      const notif = lastMessage as WSNotification;
      setNotifications(prev => [notif, ...prev].slice(0, 50));
      
      if (onNotification) {
        onNotification(notif);
      }
    }
  }, [lastMessage, onNotification]);

  const subscribe = (channels: string[]) => {
    send({ type: 'subscribe', data: { channels }, timestamp: new Date() });
  };

  return {
    isConnected,
    notifications,
    lastMessage,
    error,
    subscribe,
    send
  };
};

export default useWSNotifications;
