import { useEffect, useState, useCallback, useRef } from 'react';

/**
 * Hook para gerenciar conexão WebSocket
 */
export const useWebSocket = (url: string = 'ws://localhost:9000') => {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // Conectar ao servidor WebSocket
  useEffect(() => {
    try {
      const ws = new WebSocket(url);

      ws.onopen = () => {
        console.log('WebSocket conectado');
        setIsConnected(true);
        setError(null);
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          setLastMessage(message);
        } catch (error) {
          console.error('Erro ao processar mensagem:', error);
        }
      };

      ws.onerror = (error) => {
        console.error('Erro WebSocket:', error);
        setError('Erro na conexão WebSocket');
      };

      ws.onclose = () => {
        console.log('WebSocket desconectado');
        setIsConnected(false);
      };

      wsRef.current = ws;

      return () => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.close();
        }
      };
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Erro ao conectar');
    }
  }, [url]);

  // Enviar mensagem
  const send = useCallback((message: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket não está conectado');
    }
  }, []);

  // Enviar ping
  const ping = useCallback(() => {
    send({
      type: 'ping',
      data: { timestamp: new Date() },
      timestamp: new Date(),
    });
  }, [send]);

  return {
    isConnected,
    lastMessage,
    error,
    send,
    ping,
  };
};

export default useWebSocket;

